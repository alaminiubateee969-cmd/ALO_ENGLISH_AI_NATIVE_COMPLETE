/**
 * tests/media-fetcher.test.ts
 *
 * The media fetcher is the one place the server follows a URL that arrived in a
 * request, so most of these tests are about what it REFUSES to do: fetch over
 * plain http, fetch a link-local address, follow an attacker-controlled host
 * masquerading as the provider, or read a body larger than the ceiling because
 * Content-Length lied.
 *
 * `fetch` is injected throughout. Nothing here touches a network.
 */

import { afterAll, describe, expect, test } from 'bun:test';
import type { MediaFetcherDeps, MediaRef } from '../src/lib/crm/media-fetcher';
import { MAX_DOCUMENT_BYTES } from '../src/lib/crm/document-storage';

const mod = await import('../src/lib/crm/media-fetcher');
const { collectInboundAttachments, describeMediaReadiness, fetchProviderMedia, isFetchableMediaUrl, MAX_ATTACHMENTS_PER_MESSAGE } = mod;

const savedToken = process.env.WHATSAPP_ACCESS_TOKEN;
afterAll(() => {
  if (savedToken === undefined) delete process.env.WHATSAPP_ACCESS_TOKEN;
  else process.env.WHATSAPP_ACCESS_TOKEN = savedToken;
});

const REF: MediaRef = { providerMediaId: 'media-1', mimeType: 'image/jpeg', fileName: 'photo.jpg' };

/** Counts calls and answers with a scripted sequence. */
function scriptedFetch(handlers: Array<() => Response | Promise<Response>>) {
  const calls: Array<{ url: string; authorization: string | null }> = [];
  let index = 0;
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({ url: String(input), authorization: headers.get('authorization') });
    const handler = handlers[Math.min(index, handlers.length - 1)];
    index += 1;
    if (!handler) throw new Error('no scripted response');
    return handler();
  }) as unknown as typeof fetch;
  return { impl, calls };
}

function metaResponse(url: string, extra: { fileSize?: number; mimeType?: string } = {}): Response {
  return new Response(JSON.stringify({ url, file_size: extra.fileSize, mime_type: extra.mimeType }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function deps(impl: typeof fetch, extra: Partial<MediaFetcherDeps> = {}): MediaFetcherDeps {
  return {
    fetchImpl: impl,
    token: 'test-token',
    resolveUrl: async () => ({ url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=abc', declaredBytes: null, mimeType: 'image/jpeg' }),
    ...extra,
  };
}

const bytes = (n: number) => new Uint8Array(n);

describe('URL safety', () => {
  test('accepts the hosts the provider actually serves media from', () => {
    expect(isFetchableMediaUrl('https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=x').ok).toBe(true);
    expect(isFetchableMediaUrl('https://graph.facebook.com/v21.0/123').ok).toBe(true);
    expect(isFetchableMediaUrl('https://scontent.xx.fbcdn.net/v/t1/abc').ok).toBe(true);
  });

  test('refuses plain http', () => {
    const result = isFetchableMediaUrl('http://lookaside.fbsbx.com/x');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('https');
  });

  test('refuses a link-local address, so a spoofed response cannot reach cloud metadata', () => {
    expect(isFetchableMediaUrl('https://169.254.169.254/latest/meta-data/').ok).toBe(false);
    expect(isFetchableMediaUrl('https://127.0.0.1:5432/').ok).toBe(false);
  });

  test('refuses a lookalike host that merely contains the provider name', () => {
    expect(isFetchableMediaUrl('https://notfacebook.com/x').ok).toBe(false);
    expect(isFetchableMediaUrl('https://facebook.com.evil.example/x').ok).toBe(false);
  });

  test('refuses a URL carrying credentials', () => {
    expect(isFetchableMediaUrl('https://user:pass@lookaside.fbsbx.com/x').ok).toBe(false);
  });

  test('refuses something that is not a URL at all', () => {
    expect(isFetchableMediaUrl('not a url').ok).toBe(false);
  });
});

describe('no token, no fetch', () => {
  test('reports NOT_CONFIGURED and never touches the network', async () => {
    const { impl, calls } = scriptedFetch([]);
    const outcome = await fetchProviderMedia('whatsapp_cloud', REF, { fetchImpl: impl, token: null });

    expect(outcome.status).toBe('SKIPPED');
    if (outcome.status !== 'SKIPPED') return;
    expect(outcome.code).toBe('NOT_CONFIGURED');
    expect(outcome.reason).toContain('WHATSAPP_ACCESS_TOKEN');
    expect(calls).toHaveLength(0);
  });

  test('a provider with no media API is refused as unsupported, not silently skipped', async () => {
    const { impl, calls } = scriptedFetch([]);
    const outcome = await fetchProviderMedia('sms_provider', REF, { fetchImpl: impl, token: 'irrelevant' });
    expect(outcome.status === 'SKIPPED' && outcome.code).toBe('UNSUPPORTED_PROVIDER');
    expect(calls).toHaveLength(0);
  });
});

describe('a successful download', () => {
  test('resolves then downloads, returning the bytes with a normalised type', async () => {
    const { impl, calls } = scriptedFetch([() => new Response(bytes(2048), { status: 200 })]);
    const outcome = await fetchProviderMedia('whatsapp_cloud', REF, deps(impl));

    expect(outcome.status).toBe('FETCHED');
    if (outcome.status !== 'FETCHED') return;
    expect(outcome.bytes).toBe(2048);
    expect(outcome.attachment.mimeType).toBe('image/jpeg');
    expect(outcome.attachment.fileName).toBe('photo.jpg');
    expect(outcome.attachment.providerMediaId).toBe('media-1');
    // Only the media host is called: the URL was resolved by the injected
    // resolver, which is the only thing allowed to mint a fetchable URL.
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toContain('lookaside.fbsbx.com');
  });

  test('sends the access token to the media host', async () => {
    const { impl, calls } = scriptedFetch([() => new Response(bytes(10), { status: 200 })]);
    await fetchProviderMedia('whatsapp_cloud', REF, deps(impl));
    expect(calls[0]?.authorization).toBe('Bearer test-token');
  });

  test('falls back to the file extension when the provider says octet-stream', async () => {
    const { impl } = scriptedFetch([() => new Response(bytes(10), { status: 200 })]);
    const outcome = await fetchProviderMedia(
      'whatsapp_cloud',
      { providerMediaId: 'm', mimeType: 'application/octet-stream', fileName: 'passport.pdf' },
      deps(impl, { resolveUrl: async () => ({ url: 'https://lookaside.fbsbx.com/x', declaredBytes: null, mimeType: 'application/octet-stream' }) }),
    );
    expect(outcome.status === 'FETCHED' && outcome.attachment.mimeType).toBe('application/pdf');
  });
});

describe('refusals that happen before any download', () => {
  test('a declared size above the ceiling is refused without downloading', async () => {
    const { impl, calls } = scriptedFetch([() => new Response(bytes(1), { status: 200 })]);
    const outcome = await fetchProviderMedia(
      'whatsapp_cloud',
      REF,
      deps(impl, {
        resolveUrl: async () => ({ url: 'https://lookaside.fbsbx.com/x', declaredBytes: MAX_DOCUMENT_BYTES + 1, mimeType: 'image/jpeg' }),
      }),
    );
    expect(outcome.status === 'SKIPPED' && outcome.code).toBe('MEDIA_TOO_LARGE');
    expect(calls).toHaveLength(0);
  });

  test('a resolved URL pointing off-provider is refused', async () => {
    const { impl, calls } = scriptedFetch([() => new Response(bytes(1), { status: 200 })]);
    const outcome = await fetchProviderMedia(
      'whatsapp_cloud',
      REF,
      deps(impl, {
        resolveUrl: async () => ({ url: 'https://169.254.169.254/latest/meta-data/', declaredBytes: null, mimeType: 'image/jpeg' }),
      }),
    );
    expect(outcome.status === 'SKIPPED' && outcome.code).toBe('UNSAFE_URL');
    expect(calls).toHaveLength(0);
  });

  test('a type we do not accept for documents is refused', async () => {
    const { impl, calls } = scriptedFetch([() => new Response(bytes(1), { status: 200 })]);
    const outcome = await fetchProviderMedia(
      'whatsapp_cloud',
      { providerMediaId: 'm', mimeType: 'text/plain', fileName: 'notes.txt' },
      deps(impl, { resolveUrl: async () => ({ url: 'https://lookaside.fbsbx.com/x', declaredBytes: null, mimeType: 'text/plain' }) }),
    );
    expect(outcome.status === 'SKIPPED' && outcome.code).toBe('UNSUPPORTED_TYPE');
    expect(outcome.status === 'SKIPPED' && outcome.retryable).toBe(false);
    expect(calls).toHaveLength(0);
  });
});

describe('failures during the download are described, never thrown', () => {
  test('the size ceiling holds even when Content-Length lies about it', async () => {
    // A body that streams past the ceiling while claiming to be tiny.
    const chunk = new Uint8Array(1024 * 1024);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let sent = 0; sent <= MAX_DOCUMENT_BYTES / chunk.byteLength; sent += 1) controller.enqueue(chunk);
        controller.close();
      },
    });
    const { impl } = scriptedFetch([
      () => new Response(stream, { status: 200, headers: { 'content-length': '16' } }),
    ]);
    const outcome = await fetchProviderMedia('whatsapp_cloud', REF, deps(impl));
    expect(outcome.status === 'SKIPPED' && outcome.code).toBe('MEDIA_TOO_LARGE');
  });

  test('a 5xx from the media host is marked retryable', async () => {
    const { impl } = scriptedFetch([() => new Response('nope', { status: 503 })]);
    const outcome = await fetchProviderMedia('whatsapp_cloud', REF, deps(impl));
    expect(outcome.status === 'SKIPPED' && outcome.code).toBe('HTTP_ERROR');
    expect(outcome.status === 'SKIPPED' && outcome.retryable).toBe(true);
  });

  test('a 404 is not retryable: the media is gone', async () => {
    const { impl } = scriptedFetch([() => new Response('gone', { status: 404 })]);
    const outcome = await fetchProviderMedia('whatsapp_cloud', REF, deps(impl));
    expect(outcome.status === 'SKIPPED' && outcome.retryable).toBe(false);
  });

  test('a failure resolving the URL is described, not thrown', async () => {
    const { impl, calls } = scriptedFetch([]);
    const outcome = await fetchProviderMedia(
      'whatsapp_cloud',
      REF,
      deps(impl, { resolveUrl: async () => { throw new Error('Graph API answered 401 for media media-1.'); } }),
    );
    expect(outcome.status === 'SKIPPED' && outcome.code).toBe('HTTP_ERROR');
    expect(outcome.status === 'SKIPPED' && outcome.reason).toContain('401');
    expect(calls).toHaveLength(0);
  });

  test('a network failure while downloading is described', async () => {
    const impl = (async () => { throw new Error('socket hang up'); }) as unknown as typeof fetch;
    const outcome = await fetchProviderMedia('whatsapp_cloud', REF, deps(impl));
    expect(outcome.status === 'SKIPPED' && outcome.code).toBe('FETCH_FAILED');
    expect(outcome.status === 'SKIPPED' && outcome.reason).toContain('socket hang up');
  });

  test('zero bytes is EMPTY_MEDIA, not a stored empty document', async () => {
    const { impl } = scriptedFetch([() => new Response(bytes(0), { status: 200 })]);
    const outcome = await fetchProviderMedia('whatsapp_cloud', REF, deps(impl));
    expect(outcome.status === 'SKIPPED' && outcome.code).toBe('EMPTY_MEDIA');
  });
});

describe('collecting a message\'s attachments', () => {
  test('one unreadable attachment does not stop the others', async () => {
    const { impl } = scriptedFetch([
      () => new Response(bytes(100), { status: 200 }),
      () => new Response('boom', { status: 500 }),
      () => new Response(bytes(300), { status: 200 }),
    ]);
    const result = await collectInboundAttachments(
      'whatsapp_cloud',
      [
        { providerMediaId: 'a', mimeType: 'image/jpeg', fileName: 'a.jpg' },
        { providerMediaId: 'b', mimeType: 'image/jpeg', fileName: 'b.jpg' },
        { providerMediaId: 'c', mimeType: 'image/jpeg', fileName: 'c.jpg' },
      ],
      deps(impl),
    );

    expect(result.attachments.map((a) => a.fileName)).toEqual(['a.jpg', 'c.jpg']);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.code).toBe('HTTP_ERROR');
    expect(result.uncollected).toEqual(['b.jpg']);
  });

  test('a message cannot carry an unbounded number of attachments', async () => {
    const { impl } = scriptedFetch([() => new Response(bytes(10), { status: 200 })]);
    const refs: MediaRef[] = Array.from({ length: MAX_ATTACHMENTS_PER_MESSAGE + 3 }, (_, index) => ({
      providerMediaId: `m${index}`,
      mimeType: 'image/jpeg',
      fileName: `file-${index}.jpg`,
    }));
    const result = await collectInboundAttachments('whatsapp_cloud', refs, deps(impl));

    expect(result.attachments).toHaveLength(MAX_ATTACHMENTS_PER_MESSAGE);
    expect(result.rejected).toHaveLength(3);
    expect(result.rejected.every((rejection) => rejection.code === 'TOO_MANY_ATTACHMENTS')).toBe(true);
  });

  test('with no token every attachment is reported uncollected rather than dropped', async () => {
    const { impl, calls } = scriptedFetch([]);
    const result = await collectInboundAttachments(
      'whatsapp_cloud',
      [{ providerMediaId: 'a', mimeType: 'image/jpeg', fileName: 'a.jpg' }],
      { fetchImpl: impl, token: null },
    );
    expect(result.attachments).toHaveLength(0);
    expect(result.uncollected).toEqual(['a.jpg']);
    expect(result.rejected[0]?.code).toBe('NOT_CONFIGURED');
    expect(calls).toHaveLength(0);
  });
});

describe('readiness reporting', () => {
  test('names the variable to set and never prints a value', () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    const before = describeMediaReadiness('whatsapp_cloud');
    expect(before.configured).toBe(false);
    expect(before.envKey).toBe('WHATSAPP_ACCESS_TOKEN');
    expect(before.note).toContain('WHATSAPP_ACCESS_TOKEN');

    process.env.WHATSAPP_ACCESS_TOKEN = 'super-secret-value';
    const after = describeMediaReadiness('whatsapp_cloud');
    expect(after.configured).toBe(true);
    expect(after.note).not.toContain('super-secret-value');
  });

  test('a provider with no media API is reported as such', () => {
    const readiness = describeMediaReadiness('sms_provider');
    expect(readiness.configured).toBe(false);
    expect(readiness.envKey).toBeNull();
  });
});
