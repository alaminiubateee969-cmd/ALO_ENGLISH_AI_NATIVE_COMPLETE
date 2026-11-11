/**
 * src/lib/crm/messaging-policy.ts
 *
 * Whether an automated message may be sent — decided before anything is queued.
 *
 * WHY THIS IS A GATE AND NOT A CHECKBOX
 * ─────────────────────────────────────
 * Three separate rules can each make a send unlawful or merely obnoxious, and
 * they are easy to lose once sends are spread across campaigns, reminders and
 * an after-hours assistant:
 *
 *   1. Consent. Marketing needs permission; a withdrawal on any channel stops
 *      that purpose everywhere, because the register is per student.
 *   2. Channel rules. WhatsApp allows free-form replies only inside the
 *      customer-service window; outside it, an approved template is required.
 *      A template is a different kind of message, so it is modelled explicitly.
 *   3. Volume. A daily cap and quiet hours stop a helpful reminder from becoming
 *      harassment — and stop a retry loop from messaging someone fifty times.
 *
 * The function is pure: it takes the facts and returns a decision with a reason
 * that can be shown to a human and written to the audit log.
 */

export type MessageChannel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'FACEBOOK' | 'INSTAGRAM';

export type MessagePurpose = 'MARKETING' | 'SERVICE' | 'FOLLOW_UP';

export type ConsentStatus = 'GRANTED' | 'DENIED' | 'WITHDRAWN' | 'UNKNOWN';

export type SendContext = {
  channel: MessageChannel;
  purpose: MessagePurpose;
  /** Consent register entry for this student/channel/purpose. */
  consent: ConsentStatus;
  /** True when the student has withdrawn marketing consent on any channel. */
  marketingOptOut: boolean;
  /** Current time. */
  now: Date;
  /** Last inbound message from the student, if any (drives the WhatsApp window). */
  lastInboundAt?: Date | null;
  /** Messages already sent to this student today, by channel. */
  sentToday: number;
  /** True when the message is an approved template rather than free-form text. */
  isApprovedTemplate?: boolean;
  /** Business hours, in the timezone offset supplied below. */
  businessHours?: { startHour: number; endHour: number; utcOffsetMinutes: number };
};

export type SendDecision = {
  allowed: boolean;
  /** Machine-readable code, safe to log. */
  code:
    | 'OK'
    | 'CONSENT_MISSING'
    | 'OPTED_OUT'
    | 'WHATSAPP_WINDOW_CLOSED'
    | 'DAILY_CAP_REACHED'
    | 'QUIET_HOURS'
    | 'INVALID_CONTEXT';
  /** Human-readable explanation for the audit log and the UI. */
  reason: string;
};

/** Free-form replies are allowed for this long after the student writes. */
export const WHATSAPP_SERVICE_WINDOW_HOURS = 24;

/** Hard daily ceiling per student, across all purposes on one channel. */
export const DAILY_MESSAGE_CAP = 3;

export const DEFAULT_BUSINESS_HOURS = { startHour: 9, endHour: 21, utcOffsetMinutes: 360 }; // Asia/Dhaka

function hoursBetween(earlier: Date, later: Date): number {
  return (later.getTime() - earlier.getTime()) / (60 * 60 * 1000);
}

function localHour(now: Date, utcOffsetMinutes: number): number {
  const shifted = new Date(now.getTime() + utcOffsetMinutes * 60 * 1000);
  return shifted.getUTCHours();
}

/**
 * Decide whether a message may be sent. Marketing declines without explicit
 * consent; service and follow-up messages may proceed while the relationship is
 * active, but never past an opt-out, the daily cap, or quiet hours — except for
 * the WhatsApp service window, which outranks quiet hours because the student
 * wrote first and is waiting for an answer.
 */
export function evaluateSendPolicy(context: SendContext): SendDecision {
  const { channel, purpose, consent, marketingOptOut, now, sentToday, isApprovedTemplate } = context;

  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    return { allowed: false, code: 'INVALID_CONTEXT', reason: 'A valid current time is required to apply send rules.' };
  }

  // 1. Opt-out is absolute, and it applies across channels and purposes.
  if (marketingOptOut && purpose === 'MARKETING') {
    return {
      allowed: false,
      code: 'OPTED_OUT',
      reason: 'The student withdrew marketing consent. This is recorded centrally and blocks every channel.',
    };
  }

  // 2. Consent rules differ by purpose.
  if (purpose === 'MARKETING' && consent !== 'GRANTED') {
    return {
      allowed: false,
      code: 'CONSENT_MISSING',
      reason: `Marketing on ${channel} requires recorded consent; the register says ${consent}.`,
    };
  }

  if ((purpose === 'SERVICE' || purpose === 'FOLLOW_UP') && consent === 'DENIED') {
    return {
      allowed: false,
      code: 'CONSENT_MISSING',
      reason: `The student declined ${channel} contact; use another channel or ask for consent again in person.`,
    };
  }

  // 3. WhatsApp: outside the customer-service window only an approved template
  //    may be sent. Templates are pre-approved by the provider, so they are the
  //    only lawful way to initiate.
  if (channel === 'WHATSAPP') {
    const lastInbound = context.lastInboundAt ?? null;
    const windowOpen = lastInbound !== null && hoursBetween(lastInbound, now) < WHATSAPP_SERVICE_WINDOW_HOURS;
    if (!windowOpen && !isApprovedTemplate) {
      return {
        allowed: false,
        code: 'WHATSAPP_WINDOW_CLOSED',
        reason: `No inbound message in the last ${WHATSAPP_SERVICE_WINDOW_HOURS}h. Outside the service window only an approved template may be sent.`,
      };
    }
  }

  // 4. Daily cap. Protects against retry loops most of all.
  if (sentToday >= DAILY_MESSAGE_CAP) {
    return {
      allowed: false,
      code: 'DAILY_CAP_REACHED',
      reason: `Daily cap of ${DAILY_MESSAGE_CAP} messages per student already reached on ${channel}.`,
    };
  }

  // 5. Quiet hours. A student who just wrote is waiting, so an open WhatsApp
  //    window overrides this; nothing else does.
  const businessHours = context.businessHours ?? DEFAULT_BUSINESS_HOURS;
  const hour = localHour(now, businessHours.utcOffsetMinutes);
  const insideHours = hour >= businessHours.startHour && hour < businessHours.endHour;
  const windowOpenForWhatsApp =
    channel === 'WHATSAPP' &&
    context.lastInboundAt != null &&
    hoursBetween(context.lastInboundAt, now) < WHATSAPP_SERVICE_WINDOW_HOURS;

  if (!insideHours && !windowOpenForWhatsApp) {
    return {
      allowed: false,
      code: 'QUIET_HOURS',
      reason: `Local time ${hour}:00 is outside ${businessHours.startHour}:00–${businessHours.endHour}:00. Queue until the window opens.`,
    };
  }

  return { allowed: true, code: 'OK', reason: 'Consent, channel rules, cap and hours all satisfied.' };
}

/**
 * Retry policy for a failed send. Bounded and deterministic: after the last
 * attempt the message is left failed for a human, instead of retrying forever.
 */
export const RETRY_BACKOFF_MINUTES = [5, 30, 120, 720] as const;

export function nextRetryAt(attempt: number, from: Date): { retryAt: Date | null; exhausted: boolean } {
  if (!Number.isInteger(attempt) || attempt < 1) {
    return { retryAt: null, exhausted: false };
  }
  const delay = RETRY_BACKOFF_MINUTES[attempt - 1];
  if (delay === undefined) return { retryAt: null, exhausted: true };
  return { retryAt: new Date(from.getTime() + delay * 60 * 1000), exhausted: false };
}
