/**
 * src/lib/crm/assistant-runner.ts
 *
 * The sending half of the after-hours assistant.
 *
 * Two things make this safe to leave running unattended:
 *
 *   1. **It cannot bypass the outbound funnel.** A reply is an ordinary
 *      `DELIVER` through `deliverOutbound`, so consent, the WhatsApp service
 *      window, the daily cap, quiet hours, exactly-once claiming and the audit
 *      trail all apply exactly as they do to a message a counsellor types. The
 *      assistant is a sender, not a privileged one.
 *   2. **Every automatic send is recorded as one.** The message states that it is
 *      automated (see ASSISTANT_DISCLOSURE), and the record says who caused it
 *      (`createdBy: 'after-hours-assistant'`), so "did a robot tell this student
 *      that?" is answerable from the database.
 *
 * The runner never sends inside office hours and never sends when the plan says
 * HANDOFF: holding a queue of questions for the morning is the job, answering
 * them with guesses is not.
 */

import { isOutsideOfficeHours, planAssistantReply, type AssistantInput, type AssistantPlan } from './assistant';
import type { DeliverOutcome, OutboundDraft } from './outbound';
import type { MessageChannel, MessagePurpose } from './messaging-policy';

export const ASSISTANT_AUTHOR = 'after-hours-assistant';

export type AssistantConversation = {
  conversationId: string;
  channel: string;
  studentId: string;
  recipientHandle: string | null;
  /** The student's inbound message being answered. */
  body: string;
  /** Messages the assistant has already sent in this conversation. */
  repliesThisConversation: number;
  serviceWithdrawn: boolean;
};

export type AssistantOutcome =
  | { status: 'SENT'; conversationId: string; plan: AssistantPlan; delivery: DeliverOutcome }
  | { status: 'HANDOFF'; conversationId: string; plan: AssistantPlan }
  | { status: 'SILENT'; conversationId: string; plan: AssistantPlan }
  | { status: 'SKIPPED'; conversationId: string; plan: AssistantPlan; reason: string };

export type AssistantRunnerDeps = {
  now?: () => Date;
  /** Whether the assistant is enabled at all (ASSISTANT_ENABLED). */
  enabled?: boolean;
  deliver(draft: OutboundDraft): Promise<DeliverOutcome>;
};

/**
 * One decision per inbound message.
 *
 * `requiresHumanReview` on a HANDOFF is passed to the caller, which records it
 * on the conversation rather than inventing a task the team never sees.
 */
export async function runAfterHoursAssistant(
  conversation: AssistantConversation,
  deps: AssistantRunnerDeps,
): Promise<AssistantOutcome> {
  const now = (deps.now ?? (() => new Date()))();
  const enabled = deps.enabled ?? process.env.ASSISTANT_ENABLED === 'true';

  if (!enabled) {
    return { status: 'SILENT', conversationId: conversation.conversationId, plan: planAssistantReply({ body: conversation.body, now, repliesThisConversation: 0, outsideOfficeHours: false, enabled: false }) };
  }

  const input: AssistantInput = {
    body: conversation.body,
    now,
    repliesThisConversation: conversation.repliesThisConversation,
    // Recomputed here rather than trusted from the caller: an operator's clock
    // being wrong must not turn the assistant into an in-hours interruptor.
    outsideOfficeHours: isOutsideOfficeHours(now),
    serviceWithdrawn: conversation.serviceWithdrawn,
    enabled: true,
  };

  const plan = planAssistantReply(input);

  if (plan.action === 'SILENT') {
    return { status: 'SILENT', conversationId: conversation.conversationId, plan };
  }

  if (plan.action === 'HANDOFF') {
    return { status: 'HANDOFF', conversationId: conversation.conversationId, plan };
  }

  if (!conversation.recipientHandle) {
    // The channel cannot be replied to without an address, and inventing one is
    // not an option. This is a handoff, not a silent drop.
    return {
      status: 'SKIPPED',
      conversationId: conversation.conversationId,
      plan,
      reason: 'No recipient handle is recorded for this conversation, so the assistant could not reply.',
    };
  }

  const delivery = await deps.deliver({
    channel: conversation.channel as MessageChannel,
    // SERVICE, not MARKETING: this is a reply to a student's own question, which
    // is exactly the purpose the policy treats as part of the relationship.
    purpose: 'SERVICE' as MessagePurpose,
    studentId: conversation.studentId,
    recipientHandle: conversation.recipientHandle,
    body: plan.draft ?? '',
    conversationId: conversation.conversationId,
    scheduledFor: now,
    createdBy: ASSISTANT_AUTHOR,
  });

  return { status: 'SENT', conversationId: conversation.conversationId, plan, delivery };
}
