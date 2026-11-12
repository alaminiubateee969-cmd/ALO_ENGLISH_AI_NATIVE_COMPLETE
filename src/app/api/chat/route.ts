/**
 * POST /api/chat — Rule-based web chat endpoint for the ALO homepage assistant.
 *
 * This endpoint is "own AI": it NEVER calls an external LLM. The full
 * conversation is driven by ChatEngine (pattern matching + state machine).
 *
 * Flow:
 *   1. Visitor sends a message + their current ChatContext (state + draft).
 *   2. We run generateChatReply() locally.
 *   3. If the engine flags readyToRegister, we collect the draft fields and
 *      call the shared registerStudentInternal helper (factored out from
 *      /api/auth/register) so the visitor is automatically logged in via
 *      setSessionCookie.
 *   4. We return the next reply text, quick replies, the updated state /
 *      draft, and an optional portal link / student ID.
 *
 * Authentication: NOT required. The chat is the entry point for visitors who
 * do not yet have an account. If the visitor is already logged in, we tell
 * the engine so it can short-circuit to the portal link.
 */

import {
  generateChatReply,
  registrationSuccessReply,
  registrationFailureReply,
  type ChatContext,
  type ChatState,
  type RegistrationDraft,
  type ChatReply,
} from "@/lib/ai/chat/ChatEngine";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { ok, badRequest, rateLimited } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { RequestBodyTooLargeError, readJsonWithLimit } from "@/lib/http/read-json-with-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_REQUEST_BYTES = 32 * 1024; // 32 KB — chat messages + draft only

const CHAT_STATES: ChatState[] = [
  "greeting",
  "exam_selection",
  "exam_info",
  "account_check",
  "registration_collect_name",
  "registration_collect_email",
  "registration_collect_edu_id",
  "registration_collect_password",
  "registration_submitting",
  "portal_redirect",
  "faq",
];

const draftSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().max(254).optional(),
  educationalId: z.string().max(64).optional(),
  password: z.string().max(128).optional(),
  examInterest: z.string().max(32).optional(),
});

const schema = z.object({
  message: z.string().max(2_000).optional(),
  state: z.enum(CHAT_STATES as [ChatState, ...ChatState[]]).optional(),
  draft: draftSchema.optional(),
});

type RegisterResult =
  | { success: true; studentId: string; user: { id: string; email: string; name: string | null; educationalId: string | null } }
  | { success: false; reason: string };

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const ip = getClientIp(req) || "unknown";
    const rl = rateLimit(`chat:${ip}`, 30, 60); // 30 messages / minute / IP
    if (!rl.allowed) {
      return rateLimited("You're chatting a bit fast. Please slow down and try again.");
    }

    let body: unknown;
    try {
      body = await readJsonWithLimit(req, MAX_REQUEST_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return badRequest("Chat request is too large");
      }
      return badRequest("Invalid JSON body");
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Invalid chat request");
    }

    // ─── Hydrate context from the client payload ────────────────────────
    const draft: RegistrationDraft = {
      name: parsed.data.draft?.name,
      email: parsed.data.draft?.email,
      educationalId: parsed.data.draft?.educationalId,
      password: parsed.data.draft?.password,
      examInterest: (parsed.data.draft?.examInterest as RegistrationDraft["examInterest"]) ?? null,
    };
    const ctx: ChatContext = {
      state: parsed.data.state || "greeting",
      draft,
      turnCount: 0,
    };

    // If the visitor is already logged in, jump them to the portal link
    // unless they explicitly asked for help.
    const currentUser = await getCurrentUser();
    const message = parsed.data.message || "";
    if (currentUser && !message) {
      const reply: ChatReply = {
        text: `Welcome back! You're signed in as ${currentUser.email}. Head to the practice-test portal whenever you're ready.`,
        nextState: "portal_redirect",
        portalLink: "/practice-test",
        quickReplies: [
          { label: "Open practice test", value: "go to portal" },
          { label: "Build a study plan", value: "study plan" },
        ],
      };
      return ok({ reply, context: serializeContext(ctx) }, "Welcome back");
    }

    // ─── Run the rule-based engine ──────────────────────────────────────
    let reply = generateChatReply(message, ctx);

    // ─── If the engine says "readyToRegister", create the account ───────
    if (reply.readyToRegister && ctx.draft.email && ctx.draft.educationalId && ctx.draft.password) {
      const registerResult = await performRegistration(req, {
        name: ctx.draft.name || undefined,
        email: ctx.draft.email,
        educationalId: ctx.draft.educationalId,
        password: ctx.draft.password,
      });

      if (registerResult.success) {
        // Clear the password from the draft before echoing back — never
        // round-trip a password, even transiently, to the browser.
        ctx.draft.password = undefined;
        reply = registrationSuccessReply(
          registerResult.user.educationalId || registerResult.user.id,
          ctx,
        );
      } else {
        ctx.draft.password = undefined;
        reply = registrationFailureReply(registerResult.reason);
      }
    }

    // Always strip the password from the draft before returning to the
    // browser. The engine may keep it transiently for the register call,
    // but it never leaves the server after that.
    ctx.draft.password = undefined;

    return ok(
      {
        reply,
        context: serializeContext(ctx),
        loggedInAs: currentUser?.email ?? null,
      },
      "Chat reply generated",
    );
  });
}

// ─── Serialize context for the client (strip sensitive fields) ──────────

function serializeContext(ctx: ChatContext) {
  return {
    state: ctx.state,
    draft: {
      name: ctx.draft.name,
      email: ctx.draft.email,
      educationalId: ctx.draft.educationalId,
      examInterest: ctx.draft.examInterest ?? null,
      // password intentionally omitted
    },
    turnCount: ctx.turnCount,
  };
}

// ─── Internal registration call ─────────────────────────────────────────

/**
 * Call the shared registration helper (factored out from /api/auth/register)
 * and set the session cookie in this request's cookie jar so the visitor is
 * logged in immediately. This avoids an HTTP sub-fetch (which would need an
 * absolute URL and wouldn't propagate the visitor's IP for rate-limiting)
 * while keeping the registration logic in ONE place.
 */
async function performRegistration(
  req: Request,
  input: { name?: string; email: string; educationalId: string; password: string },
): Promise<RegisterResult> {
  try {
    // Dynamic import keeps the register helper out of the cold-start path
    // when no chat visitor is registering.
    const { registerStudentInternal } = await import("@/lib/auth/registerStudent");
    const result = await registerStudentInternal({
      name: input.name,
      email: input.email,
      password: input.password,
      educationalId: input.educationalId,
      ipAddress: getClientIp(req) || "unknown",
    });
    if (!result.ok) {
      return { success: false, reason: result.reason };
    }
    return {
      success: true,
      studentId: result.user.educationalId || result.user.id,
      user: result.user,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unexpected error during registration.";
    return { success: false, reason };
  }
}
