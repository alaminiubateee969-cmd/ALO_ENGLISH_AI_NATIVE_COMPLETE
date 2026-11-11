/**
 * tests/webhook-signature.test.ts
 *
 * The webhook endpoint is a public write path into the CRM. If this module is
 * wrong, anyone who learns the URL can create students. So these tests try to
 * forge requests rather than confirm that a correct one works.
 */

import { afterAll, afterEach, describe, expect, test } from 'bun:test';
import {
  PROVIDER_SIGNATURE_SCHEMES,
  computeSignature,
  describeSignatureReadiness,
  safeCompareHex,
  verifyWebhookSignature,
} from '../src/lib/crm/webhook-signature';

const GUARDED_KEYS = ['WHATSAPP_APP_SECRET', 'META_APP_SECRET', 'SMS_WEBHOOK_SECRET'] as const;
const saved = new Map(GUARDED_KEYS.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of GUARDED_KEYS) {
    const original = saved.get(key);
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
}

afterEach(restoreEnv);
afterAll(restoreEnv);

const SECRET = 'a'.repeat(40);
const BODY = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ id: 'wamid.1' }] } }] }] });

function headers(map: Record<string, string>) {
  const lower = new Map(Object.entries(map).map(([key, value]) => [key.toLowerCase(), value]));
  return { get: (name: string) => lower.get(name.toLowerCase()) ?? null };
}

describe('verification basics', () => {
  test('accepts a correctly signed Meta body', () => {
    process.env.WHATSAPP_APP_SECRET = SECRET;
    const signature = `sha256=${computeSignature(SECRET, BODY)}`;

    const result = verifyWebhookSignature('whatsapp_cloud', BODY, headers({ 'x-hub-signature-256': signature }));
    expect(result.verified).toBe(true);
    if (result.verified) expect(result.scheme).toBe('meta_sha256');
  });

  test('rejects a tampered body with a valid-looking header', () => {
    process.env.WHATSAPP_APP_SECRET = SECRET;
    const signature = `sha256=${computeSignature(SECRET, BODY)}`;
    const tampered = BODY.replace('wamid.1', 'wamid.ATTACKER');

    const result = verifyWebhookSignature('whatsapp_cloud', tampered, headers({ 'x-hub-signature-256': signature }));
    expect(result.verified).toBe(false);
    if (!result.verified) expect(result.code).toBe('BAD_SIGNATURE');
  });

  test('rejects a signature made with the wrong secret', () => {
    process.env.WHATSAPP_APP_SECRET = SECRET;
    const forged = `sha256=${computeSignature('b'.repeat(40), BODY)}`;
    const result = verifyWebhookSignature('whatsapp_cloud', BODY, headers({ 'x-hub-signature-256': forged }));
    expect(result.verified).toBe(false);
  });

  test('rejects a missing signature header', () => {
    process.env.WHATSAPP_APP_SECRET = SECRET;
    const result = verifyWebhookSignature('whatsapp_cloud', BODY, headers({}));
    expect(result.verified).toBe(false);
    if (!result.verified) expect(result.code).toBe('MISSING_SIGNATURE');
  });

  test('requires the sha256= prefix for Meta providers', () => {
    process.env.WHATSAPP_APP_SECRET = SECRET;
    const bare = computeSignature(SECRET, BODY);
    const result = verifyWebhookSignature('whatsapp_cloud', BODY, headers({ 'x-hub-signature-256': bare }));
    expect(result.verified).toBe(false);
    if (!result.verified) expect(result.code).toBe('BAD_SIGNATURE');
  });
});

describe('configuration failures are refusals, not warnings', () => {
  test('an unset secret refuses every request', () => {
    delete process.env.WHATSAPP_APP_SECRET;
    const result = verifyWebhookSignature('whatsapp_cloud', BODY, headers({ 'x-hub-signature-256': 'sha256=deadbeef' }));
    expect(result.verified).toBe(false);
    if (!result.verified) {
      expect(result.code).toBe('NOT_CONFIGURED');
      expect(result.reason).toContain('WHATSAPP_APP_SECRET');
    }
  });

  test('a too-short secret is treated as unconfigured', () => {
    process.env.META_APP_SECRET = 'short';
    const result = verifyWebhookSignature('meta_messenger', BODY, headers({ 'x-hub-signature-256': 'sha256=deadbeef' }));
    expect(result.verified).toBe(false);
    if (!result.verified) expect(result.code).toBe('NOT_CONFIGURED');
  });

  test('an unknown provider is refused', () => {
    const result = verifyWebhookSignature('telegram', BODY, headers({}));
    expect(result.verified).toBe(false);
    if (!result.verified) expect(result.code).toBe('UNSUPPORTED_PROVIDER');
  });

  test('a provider with no signature support cannot be an inbound source', () => {
    expect(PROVIDER_SIGNATURE_SCHEMES.internal).toBe('unsupported');
    const result = verifyWebhookSignature('internal', BODY, headers({}));
    expect(result.verified).toBe(false);
    if (!result.verified) expect(result.code).toBe('UNSUPPORTED_PROVIDER');
  });
});

describe('per-provider headers', () => {
  test('Messenger and Instagram share the Meta secret', () => {
    process.env.META_APP_SECRET = SECRET;
    const signature = `sha256=${computeSignature(SECRET, BODY)}`;
    for (const provider of ['meta_messenger', 'instagram'] as const) {
      const result = verifyWebhookSignature(provider, BODY, headers({ 'x-hub-signature-256': signature }));
      expect(result.verified).toBe(true);
    }
  });

  test('the SMS provider uses its own header and a bare hex signature', () => {
    process.env.SMS_WEBHOOK_SECRET = 'sms-secret-value-1234567890';
    const hex = computeSignature('sms-secret-value-1234567890', BODY);

    expect(verifyWebhookSignature('sms_provider', BODY, headers({ 'x-alo-signature': hex })).verified).toBe(true);
    // The Meta header must not work for the SMS provider.
    expect(verifyWebhookSignature('sms_provider', BODY, headers({ 'x-hub-signature-256': `sha256=${hex}` })).verified).toBe(false);
  });

  test('header names are matched case-insensitively', () => {
    process.env.WHATSAPP_APP_SECRET = SECRET;
    const signature = `sha256=${computeSignature(SECRET, BODY)}`;
    expect(verifyWebhookSignature('whatsapp_cloud', BODY, headers({ 'X-Hub-Signature-256': signature })).verified).toBe(true);
  });
});

describe('comparison helper', () => {
  test('rejects malformed input instead of throwing', () => {
    expect(safeCompareHex('abcd', 'abcd')).toBe(true);
    expect(safeCompareHex('abcd', 'abce')).toBe(false);
    expect(safeCompareHex('abcd', 'abc')).toBe(false);
    expect(safeCompareHex('zzzz', 'zzzz')).toBe(false);
    expect(safeCompareHex('', '')).toBe(false);
  });

  test('is case-insensitive on hex', () => {
    expect(safeCompareHex('ABCDEF', 'abcdef')).toBe(true);
  });
});

describe('readiness reporting', () => {
  test('reports which providers are configured, without exposing secrets', () => {
    process.env.WHATSAPP_APP_SECRET = SECRET;
    delete process.env.SMS_WEBHOOK_SECRET;

    const report = describeSignatureReadiness(['whatsapp_cloud', 'sms_provider']);
    expect(report).toEqual([
      { provider: 'whatsapp_cloud', configured: true, envKey: 'WHATSAPP_APP_SECRET' },
      { provider: 'sms_provider', configured: false, envKey: 'SMS_WEBHOOK_SECRET' },
    ]);
    // The report is safe to log: it names the variable, never the value.
    expect(JSON.stringify(report)).not.toContain(SECRET);
  });
});
