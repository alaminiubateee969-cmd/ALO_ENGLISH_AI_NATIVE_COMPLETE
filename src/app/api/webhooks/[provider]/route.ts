/**
 * POST /api/webhooks/[provider] — inbound message ingestion.
 *
 * Providers: whatsapp_cloud | meta_messenger | instagram | sms_provider
 *
 * This route is public by necessity and therefore treats its input as hostile:
 *
 *   1. The signature is verified against the raw body BEFORE the JSON is parsed
 *      or any database work happens. An unverified request is rejected with 401
 *      and nothing is written.
 *   2. Duplicate deliveries are detected by idempotency key, so a provider that
 *      retries five times creates one student, one message and one document.
 *   3. Every response is quick. Providers retry on timeout, and a retry storm is
 *      exactly what duplicate protection exists to absorb.
 *
 * It does NOT trust the payload for identity: sender details feed the matching
 * rules, and an ambiguous match becomes a review-queue entry rather than an
 * attachment to someone else's record.
 *
 * Configuration (see .env.example):
 *   WHATSAPP_APP_SECRET, META_APP_SECRET, SMS_WEBHOOK_SECRET
 *   WHATSAPP_VERIFY_TOKEN (GET handshake)
 *
 * Without the relevant secret the route answers 503: unconfigured, not open.
 */

import { NextRequest, NextResponse } from 'next/server';
import { badRequest, serviceUnavailable, unauthorized, withErrorHandler } from '@/lib/responses';
import { ingestInboundMessage, type InboundAttachment, type InboundMessage } from '@/lib/crm/ingest';
import { prismaIngestStore } from '@/lib/crm/prisma-store';
import type { ProviderId } from '@/lib/crm/automation';
import { verifyWebhookSignature } from '@/lib/crm/webhook-signature';
import { normaliseProviderPayload, type ProviderPayload } from '@/lib/crm/provider-payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Body ceiling. A webhook carrying more is not a chat message. */
const MAX_WEBHOOK_BYTES = 2 * 1024 * 1024;

/** GET — Meta's subscription handshake. Echoes the challenge only on a match. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }): Promise<Response> {
  const { provider } = await params;
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (provider === 'sms_provider' || provider === 'internal') {
    return serviceUnavailable(`${provider} does not use a verification handshake.`);
  }

  const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  if (!expected) {
    // Fails closed: an unconfigured deployment must not confirm a subscription.
    return serviceUnavailable('WHATSAPP_VERIFY_TOKEN is not configured; the webhook subscription cannot be verified.');
  }
  if (mode !== 'subscribe' || !token || token !== expected) {
    return unauthorized('Verification token did not match.');
  }

  return new NextResponse(challenge ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const { provider } = await params;

    // ── 1. Size, then signature, over the exact bytes received. ─────────────
    const rawBody = await req.text();
    if (rawBody.length > MAX_WEBHOOK_BYTES) {
      return badRequest('Webhook payload exceeds the accepted size.');
    }

    const verification = verifyWebhookSignature(provider, rawBody, req.headers);
    if (!verification.verified) {
      // Record nothing on an unverified request — not even a rejection row,
      // which would let an attacker fill the event table.
      const status = verification.code === 'NOT_CONFIGURED' ? 503 : 401;
      const message = `${verification.code}: ${verification.reason}`;
      return status === 503 ? serviceUnavailable(message) : unauthorized(message);
    }

    let payload: ProviderPayload;
    try {
      payload = JSON.parse(rawBody) as ProviderPayload;
    } catch {
      return badRequest('Webhook body is not valid JSON.');
    }

    const normalised = normaliseProviderPayload(provider, payload);
    if (!normalised) {
      // Acknowledged and ignored: providers send status callbacks we do not
      // consume, and returning an error would only trigger more retries.
      return NextResponse.json({ received: true, processed: false, reason: 'No inbound message in this event.' }, { status: 200 });
    }

    // Media bytes are fetched by the provider adapter, which needs an access
    // token. Until that is configured, the message is recorded and the
    // attachment is reported as uncollected rather than dropped silently.
    const attachments: InboundAttachment[] = [];
    const uncollectedMedia = normalised.mediaRefs.map((media) => media.fileName);

    const message: InboundMessage = {
      provider: provider as ProviderId,
      channel: normalised.channel,
      externalEventId: normalised.externalEventId,
      externalThreadId: normalised.externalThreadId,
      providerMessageId: normalised.providerMessageId,
      senderId: normalised.senderId,
      senderName: normalised.senderName,
      senderPhone: normalised.senderPhone,
      body: normalised.body,
      occurredAt: normalised.occurredAt,
      attachments,
      signatureVerified: true,
      payload,
    };

    const outcome = await ingestInboundMessage(message, prismaIngestStore);

    if (outcome.status === 'REJECTED') {
      return badRequest(outcome.reason);
    }

    // A duplicate is a success from the provider's point of view: it means the
    // event was already handled, and it must stop retrying.
    return NextResponse.json(
      {
        received: true,
        processed: outcome.status === 'PROCESSED',
        duplicate: outcome.status === 'DUPLICATE',
        needsReview: outcome.status === 'PROCESSED' ? outcome.needsReview : undefined,
        identityDecision: outcome.status === 'PROCESSED' ? outcome.identityDecision : undefined,
        // Reported so an operator can see that media exists but was not stored.
        uncollectedMedia: uncollectedMedia.length > 0 ? uncollectedMedia : undefined,
      },
      { status: 200 },
    );
  });
}
