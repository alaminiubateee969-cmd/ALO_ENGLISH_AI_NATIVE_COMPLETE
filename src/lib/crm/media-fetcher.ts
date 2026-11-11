/**
 * src/lib/crm/media-fetcher.ts
 *
 * Fetching inbound media from a provider.
 *
 * An inbound webhook carries a *reference* to media, never the bytes. Getting
 * the bytes means a second, authenticated call to the provider — and it is the
 * only place in this codebase where the server follows a URL that a request
 * supplied. That makes it the highest-risk component in the pipeline, so it is
 * treated as one:
 *
 *   1. The provider resolves the download URL; nothing read from a payload is
 *      fetched directly. A caller cannot make the server request an arbitrary
 *      string.
 *   2. Even the resolved URL is checked: https only, and the host must be one
 *      the provider actually serves media from. Without this a compromised or
 *      spoofed response could point at link-local metadata or an internal
 *      address (SSRF).
 *   3. The body is read through a size ceiling rather than trusted to
 *      Content-Length, which a server is free to state wrongly.
 *   4. The type must be one we already accept for documents. Media of any other
 *      type is refused before it reaches storage.
 *   5. No token, no fetch. An unconfigured deployment reports that inbound media
 *      exists and was not collected; it never fetches unauthenticated and never
 *      pretends the attachment arrived.
 *
 * The `fetch` implementation and token are injected so the whole matrix —
 * including the dangerous cases — is covered by tests that never touch a
 * network.
 */

import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, formatBytes } from './document-storage';
import type { InboundAttachment } from './ingest';
import type { ProviderId } from './automation';

/** Where each provider keeps the access token needed to read its media. */
export const MEDIA_TOKEN_ENV_KEYS: Partial<Record<ProviderId, string>> = {
  whatsapp_cloud: 'WHATSAPP_ACCESS_TOKEN',
  meta_messenger: 'META_PAGE_ACCESS_TOKEN',
  instagram: 'META_PAGE_ACCESS_TOKEN',
};

/**
 * Hosts a provider may legitimately serve media from.
 *
 * A suffix match, deliberately narrow: `facebook.com` and its media CDN
 * `fbcdn.net` / `fbsbx.com`. Anything else — including a bare IP, a link-local
 * address or an internal hostname — is refused.
 */
const ALLOWED_MEDIA_HOST_SUFFIXES = ['facebook.com', 'fbcdn.net', 'fbsbx.com', 'instagram.com'];

/** WhatsApp Graph API version. Pinned: an unpinned call can change behaviour without warning. */
const GRAPH_VERSION = 'v21.0';

export type MediaFetchOutcome =
  | { status: 'FETCHED'; attachment: InboundAttachment; bytes: number }
  | {
      status: 'SKIPPED';
      code:
        | 'NOT_CONFIGURED'
        | 'UNSUPPORTED_PROVIDER'
        | 'UNSAFE_URL'
        | 'MEDIA_TOO_LARGE'
        | 'UNSUPPORTED_TYPE'
        | 'FETCH_FAILED'
        | 'HTTP_ERROR'
        | 'EMPTY_MEDIA';
      reason: string;
      /** Whether a retry could plausibly succeed later. */
      retryable: boolean;
    };

export type MediaFetcherDeps = {
  fetchImpl?: typeof fetch;
  /** Access token for the provider. Defaults to the configured environment value. */
  token?: string | null;
  /** Provider-side media id → download URL resolver. Injectable for tests. */
  resolveUrl?: (providerMediaId: string, token: string) => Promise<{ url: string; declaredBytes: number | null; mimeType: string | null }>;
};

export type MediaRef = { providerMediaId: string; mimeType: string; fileName: string };

/** Readiness without ever revealing a value. */
export function describeMediaReadiness(provider: ProviderId): { configured: boolean; envKey: string | null; note: string } {
  const envKey = MEDIA_TOKEN_ENV_KEYS[provider] ?? null;
  if (!envKey) {
    return { configured: false, envKey: null, note: `${provider} does not expose media downloads through this pipeline.` };
  }
  const value = process.env[envKey]?.trim();
  if (!value) {
    return { configured: false, envKey, note: `Inbound media from ${provider} is reported but not collected: ${envKey} is not set.` };
  }
  return { configured: true, envKey, note: `Inbound media from ${provider} will be fetched using ${envKey}.` };
}

function tokenFor(provider: ProviderId, deps: MediaFetcherDeps): string | null {
  if (deps.token !== undefined) return deps.token?.trim() || null;
  const envKey = MEDIA_TOKEN_ENV_KEYS[provider];
  if (!envKey) return null;
  return process.env[envKey]?.trim() || null;
}

/**
 * Is this URL safe to fetch?
 *
 * Exported because it is the security boundary of this module and deserves its
 * own tests: a URL that passes here is one the server will actually request.
 */
export function isFetchableMediaUrl(raw: string): { ok: boolean; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'Not a URL.' };
  }
  if (url.protocol !== 'https:') {
    return { ok: false, reason: `Refused ${url.protocol} — media is only fetched over https.` };
  }
  const host = url.hostname.toLowerCase();
  // A hostname that is an IP literal, or that resolves only inside a network,
  // must not be reachable from here. Requiring a known provider suffix covers
  // both without needing DNS.
  const allowed = ALLOWED_MEDIA_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  if (!allowed) {
    return { ok: false, reason: `Refused host ${host}: not a recognised provider media host.` };
  }
  if (url.username || url.password) {
    return { ok: false, reason: 'Refused a URL carrying credentials.' };
  }
  return { ok: true, reason: 'Accepted.' };
}

/** Resolve a WhatsApp media id into a signed download URL via the Graph API. */
async function resolveWhatsAppMediaUrl(
  providerMediaId: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<{ url: string; declaredBytes: number | null; mimeType: string | null }> {
  const response = await fetchImpl(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(providerMediaId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Graph API answered ${response.status} for media ${providerMediaId}.`);
  }
  const body = (await response.json()) as { url?: string; file_size?: number; mime_type?: string };
  if (!body.url) throw new Error(`Graph API returned no download URL for media ${providerMediaId}.`);
  return {
    url: body.url,
    declaredBytes: typeof body.file_size === 'number' ? body.file_size : null,
    mimeType: body.mime_type ?? null,
  };
}

/**
 * Read a response body with a hard ceiling.
 *
 * Content-Length is a hint, not a guarantee, so the limit is enforced while
 * reading. Without this a provider (or something impersonating one) could
 * stream until the process runs out of memory.
 */
async function readCapped(response: Response, limit: number): Promise<{ ok: true; bytes: Buffer } | { ok: false; reason: string }> {
  if (!response.body) return { ok: false, reason: 'The response carried no body.' };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return { ok: false, reason: `Media exceeds the ${formatBytes(limit)} ceiling.` };
      }
      chunks.push(value);
    }
  } catch (error) {
    return { ok: false, reason: `Reading media failed: ${(error as Error).message}` };
  }
  return { ok: true, bytes: Buffer.concat(chunks) };
}

export function mimeTypeForMedia(ref: MediaRef, providerMime: string | null): string {
  const candidate = (providerMime ?? ref.mimeType ?? '').split(';')[0]!.trim().toLowerCase();
  if (ALLOWED_DOCUMENT_TYPES[candidate]) return candidate;
  // WhatsApp documents sometimes arrive as the generic
  // application/octet-stream; fall back to the extension we were given.
  const byExtension = Object.entries(ALLOWED_DOCUMENT_TYPES).find(([, extension]) =>
    ref.fileName.toLowerCase().endsWith(`.${extension}`),
  );
  return byExtension?.[0] ?? candidate;
}

/**
 * Fetch one referenced media item.
 *
 * Every failure is a described `SKIPPED`, never a throw: an attachment that
 * cannot be read must not fail the message that carried it. The message is
 * still a real message from a real student.
 */
export async function fetchProviderMedia(
  provider: ProviderId,
  ref: MediaRef,
  deps: MediaFetcherDeps = {},
): Promise<MediaFetchOutcome> {
  const envKey = MEDIA_TOKEN_ENV_KEYS[provider];
  if (!envKey) {
    return { status: 'SKIPPED', code: 'UNSUPPORTED_PROVIDER', reason: `${provider} does not support media downloads.`, retryable: false };
  }

  const token = tokenFor(provider, deps);
  if (!token) {
    return {
      status: 'SKIPPED',
      code: 'NOT_CONFIGURED',
      reason: `${envKey} is not configured, so inbound media was recorded but not collected.`,
      retryable: false,
    };
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const resolveUrl = deps.resolveUrl ?? ((id, t) => resolveWhatsAppMediaUrl(id, t, fetchImpl));

  let resolved: { url: string; declaredBytes: number | null; mimeType: string | null };
  try {
    resolved = await resolveUrl(ref.providerMediaId, token);
  } catch (error) {
    return { status: 'SKIPPED', code: 'HTTP_ERROR', reason: (error as Error).message, retryable: true };
  }

  // Refuse on the provider's own declared size before spending a download.
  if (resolved.declaredBytes !== null && resolved.declaredBytes > MAX_DOCUMENT_BYTES) {
    return {
      status: 'SKIPPED',
      code: 'MEDIA_TOO_LARGE',
      reason: `Provider reports ${formatBytes(resolved.declaredBytes)}, above the ${formatBytes(MAX_DOCUMENT_BYTES)} ceiling.`,
      retryable: false,
    };
  }

  const safety = isFetchableMediaUrl(resolved.url);
  if (!safety.ok) {
    return { status: 'SKIPPED', code: 'UNSAFE_URL', reason: safety.reason, retryable: false };
  }

  const mimeType = mimeTypeForMedia(ref, resolved.mimeType);
  if (!ALLOWED_DOCUMENT_TYPES[mimeType]) {
    return {
      status: 'SKIPPED',
      code: 'UNSUPPORTED_TYPE',
      reason: `Media type ${mimeType || '(unknown)'} is not an accepted document type.`,
      retryable: false,
    };
  }

  let response: Response;
  try {
    response = await fetchImpl(resolved.url, { headers: { Authorization: `Bearer ${token}` } });
  } catch (error) {
    return { status: 'SKIPPED', code: 'FETCH_FAILED', reason: `Could not reach the media host: ${(error as Error).message}`, retryable: true };
  }
  if (!response.ok) {
    return { status: 'SKIPPED', code: 'HTTP_ERROR', reason: `Media host answered ${response.status}.`, retryable: response.status >= 500 || response.status === 429 };
  }

  const read = await readCapped(response, MAX_DOCUMENT_BYTES);
  if (!read.ok) {
    const tooLarge = read.reason.includes('ceiling');
    return { status: 'SKIPPED', code: tooLarge ? 'MEDIA_TOO_LARGE' : 'FETCH_FAILED', reason: read.reason, retryable: !tooLarge };
  }
  if (read.bytes.byteLength === 0) {
    return { status: 'SKIPPED', code: 'EMPTY_MEDIA', reason: 'The provider returned zero bytes.', retryable: false };
  }

  return {
    status: 'FETCHED',
    bytes: read.bytes.byteLength,
    attachment: {
      fileName: ref.fileName,
      mimeType,
      content: read.bytes,
      providerMediaId: ref.providerMediaId,
    },
  };
}

/**
 * Fetch every referenced attachment for one message.
 *
 * Sequential on purpose: concurrent downloads from a provider that rate-limits
 * by account turn a chatty minute into a ban. The cap on how many attachments
 * one message may carry is enforced here rather than at the provider.
 */
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;

export async function collectInboundAttachments(
  provider: ProviderId,
  refs: MediaRef[],
  deps: MediaFetcherDeps = {},
): Promise<{
  attachments: InboundAttachment[];
  rejected: Array<{ fileName: string; code: string; reason: string }>;
  uncollected: string[];
}> {
  const attachments: InboundAttachment[] = [];
  const rejected: Array<{ fileName: string; code: string; reason: string }> = [];
  const uncollected: string[] = [];

  for (const ref of refs.slice(0, MAX_ATTACHMENTS_PER_MESSAGE)) {
    const outcome = await fetchProviderMedia(provider, ref, deps);
    if (outcome.status === 'FETCHED') {
      attachments.push(outcome.attachment);
    } else {
      rejected.push({ fileName: ref.fileName, code: outcome.code, reason: outcome.reason });
      uncollected.push(ref.fileName);
    }
  }
  if (refs.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    for (const ref of refs.slice(MAX_ATTACHMENTS_PER_MESSAGE)) {
      rejected.push({
        fileName: ref.fileName,
        code: 'TOO_MANY_ATTACHMENTS',
        reason: `A message may carry at most ${MAX_ATTACHMENTS_PER_MESSAGE} attachments; the rest were left uncollected.`,
      });
      uncollected.push(ref.fileName);
    }
  }

  return { attachments, rejected, uncollected };
}
