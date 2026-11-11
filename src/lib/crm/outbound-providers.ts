/**
 * src/lib/crm/outbound-providers.ts
 *
 * The transport half of outbound delivery: one adapter per provider, each a thin
 * translation of `send(...)` into that provider's HTTP API.
 *
 * What these adapters deliberately do NOT do:
 *
 *   - decide whether a message may be sent (that is ./outbound + the policy gate);
 *   - decide whether to retry (they classify the failure and let the caller apply
 *     bounded backoff);
 *   - touch storage or the database — the result goes back to the caller;
 *   - send without a credential. `describeReadiness()` is checked before `send`,
 *     and a missing credential is reported as a configuration gap rather than
 *     attempted unauthenticated.
 *
 * Failures are classified into a small, honest vocabulary so a retry decision is
 * mechanical rather than a guess: an expired token is not retryable, a 429 is, a
 * 500 is, a rejected template is not.
 *
 * The fetch implementation is injectable, so every one of those branches is
 * covered by tests that never touch a network.
 */

import type { DeliveryAdapter, SendResult } from './outbound';
import type { ProviderId } from './automation';

const GRAPH_VERSION = 'v21.0';

export type AdapterDeps = { fetchImpl?: typeof fetch };

/** Environment variable names, exposed so readiness can name what is missing. */
export const PROVIDER_SEND_ENV: Partial<Record<ProviderId, { token: string; account?: string }>> = {
  whatsapp_cloud: { token: 'WHATSAPP_ACCESS_TOKEN', account: 'WHATSAPP_PHONE_NUMBER_ID' },
  meta_messenger: { token: 'META_PAGE_ACCESS_TOKEN' },
  instagram: { token: 'META_PAGE_ACCESS_TOKEN' },
  sms_provider: { token: 'ALO_SMS_ACCESS_TOKEN', account: 'ALO_SMS_SEND_URL' },
};

function readEnv(key: string | undefined): string | null {
  if (!key) return null;
  return process.env[key]?.trim() || null;
}

/** Nothing here ever returns a value — only the name of the variable to set. */
function readinessFor(provider: ProviderId): { configured: boolean; envKey: string | null; note: string } {
  const required = PROVIDER_SEND_ENV[provider];
  if (!required) {
    return { configured: false, envKey: null, note: `${provider} has no send adapter in this deployment.` };
  }
  const missing = [required.token, required.account].filter((key): key is string => Boolean(key) && !readEnv(key));
  if (missing.length > 0) {
    return {
      configured: false,
      envKey: missing[0] ?? null,
      note: `Outbound ${provider} sends are disabled: ${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} not set.`,
    };
  }
  return { configured: true, envKey: required.token, note: `Outbound ${provider} sends use ${required.token}.` };
}

/**
 * Map a provider's HTTP status onto what we should do next.
 *
 * 401/403 mean the credential is wrong and no amount of retrying fixes it — and
 * retrying a wrong credential is how an account gets rate-limited into
 * suspension. 429 and 5xx are genuinely transient.
 */
function classifyHttpStatus(status: number, providerMessage: string): Extract<SendResult, { ok: false }> {
  const detail = providerMessage ? ` Provider said: ${providerMessage.slice(0, 300)}` : '';
  if (status === 401 || status === 403) {
    return { ok: false, code: 'AUTH_FAILED', reason: `The provider rejected our credentials (${status}).${detail}`, retryable: false };
  }
  if (status === 429) {
    return { ok: false, code: 'RATE_LIMITED', reason: `The provider is rate-limiting this account (429).${detail}`, retryable: true };
  }
  if (status >= 500) {
    return { ok: false, code: 'HTTP_ERROR', reason: `The provider failed with ${status}.${detail}`, retryable: true };
  }
  return { ok: false, code: 'PROVIDER_REJECTED', reason: `The provider rejected the message (${status}).${detail}`, retryable: false };
}

async function readProviderError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim();
  } catch {
    return '';
  }
}

async function postJson(fetchImpl: typeof fetch, url: string, token: string, body: unknown): Promise<Response> {
  return fetchImpl(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Extract a provider message id from a response body, without trusting its shape. */
function providerMessageIdFrom(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const record = body as Record<string, unknown>;
  const direct = record.message_id ?? record.id ?? record.sid ?? record.messageId;
  if (typeof direct === 'string') return direct;
  const messages = record.messages;
  if (Array.isArray(messages) && typeof messages[0] === 'object' && messages[0] !== null) {
    const first = (messages[0] as Record<string, unknown>).id;
    if (typeof first === 'string') return first;
  }
  return null;
}

async function readJsonOrNull(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/* ─────────────────────────────── WhatsApp Cloud ───────────────────────────── */

export function whatsappAdapter(deps: AdapterDeps = {}): DeliveryAdapter {
  const fetchImpl = deps.fetchImpl ?? fetch;
  return {
    provider: 'whatsapp_cloud',
    describeReadiness: () => readinessFor('whatsapp_cloud'),
    async send(input) {
      const phoneNumberId = readEnv('WHATSAPP_PHONE_NUMBER_ID');
      const token = readEnv('WHATSAPP_ACCESS_TOKEN');
      if (!phoneNumberId || !token) return { ok: false, code: 'NOT_CONFIGURED', reason: readinessFor('whatsapp_cloud').note, retryable: false };

      // WhatsApp has two message kinds and they are not interchangeable: a
      // template is the only way to open a conversation, free text is the only
      // thing allowed inside the 24-hour service window.
      const payload: Record<string, unknown> = input.isApprovedTemplate
        ? {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: input.to,
            type: 'template',
            template: {
              name: input.templateName ?? '',
              language: { code: input.templateLanguage ?? '' },
            },
          }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: input.to,
            type: 'text',
            text: { preview_url: false, body: input.body },
          };

      if (input.isApprovedTemplate && (!input.templateName || !input.templateLanguage)) {
        return {
          ok: false,
          code: 'PROVIDER_REJECTED',
          reason: 'An approved template needs both its name and its language code; the provider rejects the send otherwise.',
          retryable: false,
        };
      }

      let response: Response;
      try {
        response = await postJson(fetchImpl, `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(phoneNumberId)}/messages`, token, payload);
      } catch (error) {
        return { ok: false, code: 'NETWORK_ERROR', reason: `Could not reach the WhatsApp API: ${(error as Error).message}`, retryable: true };
      }

      if (!response.ok) return classifyHttpStatus(response.status, await readProviderError(response));
      const body = await readJsonOrNull(response);
      return { ok: true, providerMessageId: providerMessageIdFrom(body), detail: input.isApprovedTemplate ? 'Template accepted.' : 'Message accepted.' };
    },
  };
}

/* ──────────────────────── Messenger and Instagram (Meta) ──────────────────── */

export function metaMessagingAdapter(provider: 'meta_messenger' | 'instagram', deps: AdapterDeps = {}): DeliveryAdapter {
  const fetchImpl = deps.fetchImpl ?? fetch;
  return {
    provider,
    describeReadiness: () => readinessFor(provider),
    async send(input) {
      const token = readEnv('META_PAGE_ACCESS_TOKEN');
      if (!token) return { ok: false, code: 'NOT_CONFIGURED', reason: readinessFor(provider).note, retryable: false };

      // `RESPONSE` is the honest messaging type for a reply. Meta requires a tag
      // to send outside the window, and inventing one would misrepresent why we
      // are writing, so that path is simply not taken here.
      let response: Response;
      try {
        response = await postJson(fetchImpl, `https://graph.facebook.com/${GRAPH_VERSION}/me/messages`, token, {
          recipient: { id: input.to },
          messaging_type: 'RESPONSE',
          message: { text: input.body },
        });
      } catch (error) {
        return { ok: false, code: 'NETWORK_ERROR', reason: `Could not reach the Meta messaging API: ${(error as Error).message}`, retryable: true };
      }

      if (!response.ok) return classifyHttpStatus(response.status, await readProviderError(response));
      const body = await readJsonOrNull(response);
      return { ok: true, providerMessageId: providerMessageIdFrom(body), detail: 'Message accepted.' };
    },
  };
}

/* ───────────────────────────── SMS provider ───────────────────────────────── */

export function smsAdapter(deps: AdapterDeps = {}): DeliveryAdapter {
  const fetchImpl = deps.fetchImpl ?? fetch;
  return {
    provider: 'sms_provider',
    describeReadiness: () => readinessFor('sms_provider'),
    async send(input) {
      const url = readEnv('ALO_SMS_SEND_URL');
      const token = readEnv('ALO_SMS_ACCESS_TOKEN');
      if (!url || !token) return { ok: false, code: 'NOT_CONFIGURED', reason: readinessFor('sms_provider').note, retryable: false };

      const safety = safeSendUrl(url);
      if (!safety.ok) return { ok: false, code: 'PROVIDER_REJECTED', reason: safety.reason, retryable: false };

      let response: Response;
      try {
        response = await postJson(fetchImpl, url, token, { to: input.to, body: input.body, reference: input.idempotencyKey });
      } catch (error) {
        return { ok: false, code: 'NETWORK_ERROR', reason: `Could not reach the SMS provider: ${(error as Error).message}`, retryable: true };
      }

      if (!response.ok) return classifyHttpStatus(response.status, await readProviderError(response));
      const body = await readJsonOrNull(response);
      return { ok: true, providerMessageId: providerMessageIdFrom(body), detail: 'Message accepted by the SMS provider.' };
    },
  };
}

/** The SMS endpoint is operator-configured, so it is allowed off-provider — but never plain http. */
export function safeSendUrl(raw: string): { ok: boolean; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'ALO_SMS_SEND_URL is not a valid URL.' };
  }
  if (url.protocol !== 'https:') {
    return { ok: false, reason: 'Refused to send credentials to a non-https SMS endpoint.' };
  }
  return { ok: true, reason: 'Accepted.' };
}

export function defaultAdapterFor(provider: ProviderId, deps: AdapterDeps = {}): DeliveryAdapter | null {
  switch (provider) {
    case 'whatsapp_cloud':
      return whatsappAdapter(deps);
    case 'meta_messenger':
      return metaMessagingAdapter('meta_messenger', deps);
    case 'instagram':
      return metaMessagingAdapter('instagram', deps);
    case 'sms_provider':
      return smsAdapter(deps);
    default:
      return null;
  }
}
