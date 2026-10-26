/**
 * tests/provider-payload.test.ts
 *
 * The provider adapters are the boundary between an untrusted payload and the
 * rest of the pipeline, so they are tested with malformed and partial input:
 * a provider changing its shape must produce "ignored", never a crash.
 */

import { describe, expect, test } from 'bun:test';
import { normaliseDeliveryReceipts, normaliseProviderPayload } from '../src/lib/crm/provider-payload';

describe('WhatsApp Cloud', () => {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: '12345' },
              contacts: [{ profile: { name: 'Rahim' }, wa_id: '8801712345678' }],
              messages: [
                {
                  id: 'wamid.TEST',
                  from: '8801712345678',
                  timestamp: '1791972000',
                  text: { body: 'Hello' },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  test('normalises a text message', () => {
    const result = normaliseProviderPayload('whatsapp_cloud', payload);
    expect(result).not.toBeNull();
    expect(result!.channel).toBe('WHATSAPP');
    expect(result!.externalEventId).toBe('wamid.TEST');
    expect(result!.providerMessageId).toBe('wamid.TEST');
    expect(result!.senderPhone).toBe('8801712345678');
    expect(result!.senderName).toBe('Rahim');
    expect(result!.body).toBe('Hello');
    expect(result!.occurredAt?.getTime()).toBe(1791972000000);
    expect(result!.mediaRefs).toEqual([]);
  });

  test('captures a document as an uncollected media reference, not as content', () => {
    const withDoc = structuredClone(payload);
    // @ts-expect-error test fixture mutates the shape deliberately
    withDoc.entry[0].changes[0].value.messages[0] = {
      id: 'wamid.DOC',
      from: '8801712345678',
      timestamp: '1791972000',
      document: { id: 'media-99', mime_type: 'application/pdf', filename: 'passport.pdf' },
    };

    const result = normaliseProviderPayload('whatsapp_cloud', withDoc);
    expect(result!.body).toBe('');
    expect(result!.mediaRefs).toEqual([{ providerMediaId: 'media-99', mimeType: 'application/pdf', fileName: 'passport.pdf' }]);
  });

  test('returns null when there is no inbound message (status callbacks)', () => {
    expect(normaliseProviderPayload('whatsapp_cloud', { entry: [{ changes: [{ value: { statuses: [] } }] }] as never })).toBeNull();
    expect(normaliseProviderPayload('whatsapp_cloud', {})).toBeNull();
  });

  test('tolerates a partially populated contact block', () => {
    const partial = structuredClone(payload);
    // @ts-expect-error deliberate partial payload
    delete partial.entry[0].changes[0].value.contacts;
    const result = normaliseProviderPayload('whatsapp_cloud', partial);
    expect(result!.senderName).toBeNull();
    expect(result!.senderId).toBe('8801712345678');
  });
});

describe('Messenger and Instagram', () => {
  test('maps each to its own channel', () => {
    const payload = { from: 'psid-1', messageId: 'mid-1', threadId: 't-1', body: 'Hi', name: 'Karim', timestamp: '2026-10-14T05:00:00Z' };

    const messenger = normaliseProviderPayload('meta_messenger', payload);
    expect(messenger!.channel).toBe('FACEBOOK');

    const instagram = normaliseProviderPayload('instagram', payload);
    expect(instagram!.channel).toBe('INSTAGRAM');
    expect(instagram!.body).toBe('Hi');
    expect(instagram!.occurredAt?.toISOString()).toBe('2026-10-14T05:00:00.000Z');
  });

  test('returns null without a sender', () => {
    expect(normaliseProviderPayload('meta_messenger', { body: 'no sender' })).toBeNull();
    expect(normaliseProviderPayload('instagram', {})).toBeNull();
  });

  test('falls back to the sender id when no thread is supplied', () => {
    const result = normaliseProviderPayload('meta_messenger', { from: 'psid-9', body: 'hello' });
    expect(result!.externalThreadId).toBe('psid-9');
    expect(result!.externalEventId).toBeNull();
  });
});

describe('SMS provider', () => {
  test('normalises an inbound SMS', () => {
    const result = normaliseProviderPayload('sms_provider', {
      from: '+8801712345678',
      body: 'STOP',
      messageId: 'sms-1',
      timestamp: '2026-10-14T05:00:00Z',
    });
    expect(result!.channel).toBe('SMS');
    expect(result!.senderPhone).toBe('+8801712345678');
    expect(result!.body).toBe('STOP');
  });

  test('returns null without a sender', () => {
    expect(normaliseProviderPayload('sms_provider', { body: 'x' })).toBeNull();
  });
});

describe('unknown providers', () => {
  test('an unrecognised provider is ignored rather than guessed at', () => {
    expect(normaliseProviderPayload('telegram', { from: 'x', body: 'y' })).toBeNull();
    expect(normaliseProviderPayload('', {})).toBeNull();
  });
});

describe('delivery receipts', () => {
  test('a WhatsApp status callback becomes a receipt', () => {
    const receipts = normaliseDeliveryReceipts('whatsapp_cloud', {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [{ id: 'wamid.OUT1', status: 'delivered', timestamp: '1760421600' }],
              },
            },
          ],
        },
      ],
    });

    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.providerMessageId).toBe('wamid.OUT1');
    expect(receipts[0]?.status).toBe('DELIVERED');
    expect(receipts[0]?.occurredAt?.getTime()).toBe(1760421600 * 1000);
  });

  test('a failed status carries the provider error code and reason', () => {
    const receipts = normaliseDeliveryReceipts('whatsapp_cloud', {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [{ id: 'wamid.OUT2', status: 'failed', errors: [{ code: 131026, title: 'Message undeliverable' }] }],
              },
            },
          ],
        },
      ],
    });

    expect(receipts[0]?.status).toBe('FAILED');
    expect(receipts[0]?.errorCode).toBe('131026');
    expect(receipts[0]?.errorReason).toBe('Message undeliverable');
  });

  test('several statuses in one event are all returned', () => {
    const receipts = normaliseDeliveryReceipts('whatsapp_cloud', {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { id: 'a', status: 'sent' },
                  { id: 'b', status: 'read' },
                ],
              },
            },
          ],
        },
      ],
    });
    expect(receipts.map((receipt) => receipt.status)).toEqual(['SENT', 'READ']);
  });

  test('an unknown status word is ignored rather than guessed at', () => {
    const receipts = normaliseDeliveryReceipts('whatsapp_cloud', {
      entry: [{ changes: [{ value: { statuses: [{ id: 'a', status: 'deleted-by-provider' }] } }] }],
    });
    expect(receipts).toHaveLength(0);
  });

  test('an inbound message with no statuses produces no receipts', () => {
    const receipts = normaliseDeliveryReceipts('whatsapp_cloud', {
      entry: [{ changes: [{ value: { messages: [{ id: 'x', from: '8801', text: { body: 'hi' } }] } }] }],
    });
    expect(receipts).toHaveLength(0);
  });

  test('Messenger delivery ids become receipts; a bare watermark does not', () => {
    expect(normaliseDeliveryReceipts('meta_messenger', { delivery: { mids: ['mid.1', 'mid.2'] } }).map((r) => r.providerMessageId)).toEqual(['mid.1', 'mid.2']);
    expect(normaliseDeliveryReceipts('meta_messenger', { delivery: { watermark: 123 } })).toHaveLength(0);
  });

  test('an SMS provider callback is read', () => {
    const receipts = normaliseDeliveryReceipts('sms_provider', { messageId: 'sms-9', status: 'undelivered' });
    expect(receipts[0]?.status).toBe('FAILED');
  });
});
