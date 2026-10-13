/**
 * src/lib/crm/webhook-signature.ts
 *
 * Provider webhook signature verification.
 *
 * A webhook endpoint is a public, unauthenticated write path into the CRM. If it
 * cannot prove the request came from the provider, anyone who learns the URL can
 * create students, conversations and documents. So verification is not optional
 * and a missing secret is a hard failure, not a warning.
 *
 * Comparison is constant-time. A timing side channel on a signature check is a
 * real attack, and `===` on strings leaks length and prefix information.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export type SignatureScheme =
  /** Meta: X-Hub-Signature-256 = "sha256=<hex>", HMAC over the raw body. */
  | 'meta_sha256'
  /** Generic: hex HMAC in a custom header. */
  | 'shared_hmac_sha256'
  /** No signature support configured for this provider. */
  | 'unsupported';

export const PROVIDER_SIGNATURE_SCHEMES: Record<string, SignatureScheme> = {
  whatsapp_cloud: 'meta_sha256',
  meta_messenger: 'meta_sha256',
  instagram: 'meta_sha256',
  sms_provider: 'shared_hmac_sha256',
  internal: 'unsupported',
};

/** Header carrying the signature, per provider. */
export const SIGNATURE_HEADERS: Record<string, string> = {
  whatsapp_cloud: 'x-hub-signature-256',
  meta_messenger: 'x-hub-signature-256',
  instagram: 'x-hub-signature-256',
  sms_provider: 'x-alo-signature',
};

/** Environment variable holding each provider's signing secret. */
export const SECRET_ENV_KEYS: Record<string, string> = {
  whatsapp_cloud: 'WHATSAPP_APP_SECRET',
  meta_messenger: 'META_APP_SECRET',
  instagram: 'META_APP_SECRET',
  sms_provider: 'SMS_WEBHOOK_SECRET',
};

export type VerificationResult =
  | { verified: true; scheme: SignatureScheme }
  | { verified: false; code: 'NOT_CONFIGURED' | 'MISSING_SIGNATURE' | 'BAD_SIGNATURE' | 'UNSUPPORTED_PROVIDER' | 'BAD_SECRET'; reason: string };

function readSecret(provider: string): string | null {
  const key = SECRET_ENV_KEYS[provider];
  if (!key) return null;
  const value = process.env[key]?.trim();
  return value && value.length >= 16 ? value : null;
}

/** Constant-time hex comparison. Returns false for malformed input. */
export function safeCompareHex(expected: string, received: string): boolean {
  if (typeof expected !== 'string' || typeof received !== 'string') return false;
  const a = expected.trim().toLowerCase();
  const b = received.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(a) || !/^[0-9a-f]+$/.test(b)) return false;
  if (a.length !== b.length) return false;

  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length || bufA.length === 0) return false;

  return timingSafeEqual(bufA, bufB);
}

/** Compute the expected signature for a body. Exported for tests and tooling. */
export function computeSignature(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

/**
 * Verify a webhook request.
 *
 * @param provider Provider id, e.g. "whatsapp_cloud".
 * @param rawBody  The exact bytes received. Any re-serialisation breaks the HMAC.
 * @param headers  Request headers.
 */
export function verifyWebhookSignature(
  provider: string,
  rawBody: string,
  headers: { get(name: string): string | null },
): VerificationResult {
  const scheme = PROVIDER_SIGNATURE_SCHEMES[provider];
  if (!scheme) {
    return { verified: false, code: 'UNSUPPORTED_PROVIDER', reason: `Unknown provider "${provider}".` };
  }
  if (scheme === 'unsupported') {
    return {
      verified: false,
      code: 'UNSUPPORTED_PROVIDER',
      reason: `${provider} does not support signature verification and cannot be used as an inbound source.`,
    };
  }

  const secret = readSecret(provider);
  if (!secret) {
    return {
      verified: false,
      code: 'NOT_CONFIGURED',
      reason: `${SECRET_ENV_KEYS[provider]} is not set (or is shorter than 16 characters). Inbound webhooks are refused until it is configured.`,
    };
  }

  const headerName = SIGNATURE_HEADERS[provider];
  const raw = headers.get(headerName);
  if (!raw) {
    return { verified: false, code: 'MISSING_SIGNATURE', reason: `Missing ${headerName} header.` };
  }

  let received = raw.trim();
  if (scheme === 'meta_sha256') {
    if (!received.toLowerCase().startsWith('sha256=')) {
      return { verified: false, code: 'BAD_SIGNATURE', reason: 'Expected a sha256=<hex> signature.' };
    }
    received = received.slice('sha256='.length);
  }

  const expected = computeSignature(secret, rawBody);
  if (!safeCompareHex(expected, received)) {
    return { verified: false, code: 'BAD_SIGNATURE', reason: 'Signature did not match the request body.' };
  }

  return { verified: true, scheme };
}

/** True when every configured provider has its secret present. */
export function describeSignatureReadiness(providers: string[]): {
  provider: string;
  configured: boolean;
  envKey: string | null;
}[] {
  return providers.map((provider) => ({
    provider,
    configured: readSecret(provider) !== null,
    envKey: SECRET_ENV_KEYS[provider] ?? null,
  }));
}
