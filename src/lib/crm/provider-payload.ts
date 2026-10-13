/**
 * src/lib/crm/provider-payload.ts
 *
 * Provider payload adapters for the inbound webhook.
 *
 * Lives in lib rather than in the route file for two reasons: Next.js validates
 * the exports of a route module and rejects helpers (the build fails with
 * "Property ... is incompatible with index signature"), and an adapter is worth
 * unit-testing in isolation, which a route module cannot be.
 *
 * Each adapter is defensive by design: a provider can change its payload shape at
 * any time, and the failure mode must be "this event was ignored", never a crash
 * that makes the provider retry forever.
 */

export type ProviderPayload = {

  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          id?: string;
          from?: string;
          timestamp?: string;
          text?: { body?: string };
          image?: { id?: string; mime_type?: string; caption?: string; filename?: string };
          document?: { id?: string; mime_type?: string; filename?: string; caption?: string };
        }>;
      };
    }>;
  }>;
  // Generic shape accepted from a configured SMS provider.
  from?: string;
  body?: string;
  messageId?: string;
  threadId?: string;
  name?: string;
  timestamp?: string;
};

export type NormalisedInbound = {
  channel: string;
  externalEventId: string | null;
  externalThreadId: string | null;
  providerMessageId: string | null;
  senderId: string;
  senderName: string | null;
  senderPhone: string | null;
  body: string;
  occurredAt: Date | null;
  /** Attachment metadata only. Media bytes are fetched separately (see below). */
  mediaRefs: Array<{ providerMediaId: string; mimeType: string; fileName: string }>;
};

/**
 * Convert a provider payload into the shape the pipeline expects.
 *
 * Media is referenced, not downloaded here: fetching it needs the provider's
 * access token and a separate authenticated call. Until that fetcher is
 * configured the message is still recorded, and the attachment is reported as
 * uncollected rather than silently dropped.
 */
export function normaliseProviderPayload(provider: string, payload: ProviderPayload): NormalisedInbound | null {
  if (provider === 'whatsapp_cloud') {
    const value = payload.entry?.[0]?.changes?.[0]?.value;
    const incoming = value?.messages?.[0];
    if (!incoming) return null;

    const contact = value?.contacts?.[0];
    const timestamp = incoming.timestamp ? Number(incoming.timestamp) * 1000 : null;
    const mediaRefs: NormalisedInbound['mediaRefs'] = [];
    if (incoming.image?.id) {
      mediaRefs.push({ providerMediaId: incoming.image.id, mimeType: incoming.image.mime_type ?? 'image/jpeg', fileName: incoming.image.filename ?? 'whatsapp-image.jpg' });
    }
    if (incoming.document?.id) {
      mediaRefs.push({ providerMediaId: incoming.document.id, mimeType: incoming.document.mime_type ?? 'application/pdf', fileName: incoming.document.filename ?? 'whatsapp-document.pdf' });
    }

    return {
      channel: 'WHATSAPP',
      externalEventId: incoming.id ?? null,
      externalThreadId: incoming.from ?? null,
      providerMessageId: incoming.id ?? null,
      senderId: incoming.from ?? '',
      senderName: contact?.profile?.name ?? null,
      senderPhone: incoming.from ?? null,
      body: incoming.text?.body ?? incoming.image?.caption ?? incoming.document?.caption ?? '',
      occurredAt: timestamp ? new Date(timestamp) : null,
      mediaRefs,
    };
  }

  if (provider === 'meta_messenger' || provider === 'instagram') {
    // Both use the Meta messaging webhook shape.
    const text = payload.body ?? '';
    if (!payload.from) return null;
    return {
      channel: provider === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK',
      externalEventId: payload.messageId ?? null,
      externalThreadId: payload.threadId ?? payload.from,
      providerMessageId: payload.messageId ?? null,
      senderId: payload.from,
      senderName: payload.name ?? null,
      senderPhone: null,
      body: text,
      occurredAt: payload.timestamp ? new Date(payload.timestamp) : null,
      mediaRefs: [],
    };
  }

  if (provider === 'sms_provider') {
    if (!payload.from) return null;
    return {
      channel: 'SMS',
      externalEventId: payload.messageId ?? null,
      externalThreadId: payload.from,
      providerMessageId: payload.messageId ?? null,
      senderId: payload.from,
      senderName: payload.name ?? null,
      senderPhone: payload.from,
      body: payload.body ?? '',
      occurredAt: payload.timestamp ? new Date(payload.timestamp) : null,
      mediaRefs: [],
    };
  }

  return null;
}

