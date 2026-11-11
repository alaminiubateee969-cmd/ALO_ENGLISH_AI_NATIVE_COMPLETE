/**
 * POST /api/grammar/check — optional grammar and style feedback for a piece of
 * writing practice.
 *
 * WHY THIS IS A SERVER ROUTE AND NOT A DIRECT CALL FROM THE BROWSER
 * ────────────────────────────────────────────────────────────────
 * The grammar engine is a self-hosted LanguageTool sidecar (see
 * src/lib/writing/grammar.ts for the licence reasoning). Calling it straight from
 * the browser would mean either exposing the sidecar to the internet or leaking
 * the operator's internal hostname to every learner — and it would send learner
 * text from a page the application does not control. Proxying through this route
 * keeps the sidecar private and keeps the payload shape under our control.
 *
 * PRIVACY
 * ───────
 * Only the candidate text and a language tag leave this application. No attempt
 * id, no user id, no email, no IP forwarding header. The route does not store the
 * text: the learner's writing is theirs, and a grammar check is not a submission.
 *
 * FAILURE IS NORMAL
 * ─────────────────
 * Every outcome — the service being unconfigured, down, slow, or the text being
 * too long — is a 200 with a described status, because writing practice must keep
 * working when the grammar service does not. Only a malformed request or a
 * missing permission is an HTTP error.
 *
 * Auth: any signed-in user. Writing practice is part of a learner's account, and
 * an unauthenticated proxy to an internal sidecar is a free denial-of-service
 * target.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { badRequest, ok, rateLimited, unauthorized, withErrorHandler } from '@/lib/responses';
import { rateLimit } from '@/lib/rate-limit';
import { GRAMMAR_MAX_CHARS, checkGrammar, describeGrammarSummary, groupGrammarSuggestions } from '@/lib/writing/grammar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  text: z.string().max(GRAMMAR_MAX_CHARS * 2, 'The submitted text is far too long to check.'),
  language: z.string().max(20).optional(),
});

/** Per-user ceiling. Each check is a request to a sidecar that runs on the same host. */
const CHECKS_PER_HOUR = 40;

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const limit = rateLimit(`grammar:${user.id}`, CHECKS_PER_HOUR, 3600);
    if (!limit.allowed) {
      return rateLimited('That is a lot of grammar checks in one hour. Take a short break and try again.');
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest('Send the text you want checked.');

    const result = await checkGrammar(parsed.data.text, { language: parsed.data.language });

    return ok({
      status: result.status,
      language: result.language ?? null,
      // Null when there is nothing worth saying (feature off, or clean text with
      // the engine disabled) — the UI hides the panel rather than showing an
      // empty box.
      summary: describeGrammarSummary(result),
      groups: groupGrammarSuggestions(result.suggestions ?? []),
      suggestions: result.suggestions ?? [],
      durationMs: result.durationMs ?? null,
      maxChars: GRAMMAR_MAX_CHARS,
      note:
        result.status === 'ok'
          ? 'Suggestions are style and grammar hints from a LanguageTool service. They are not a band score and not a review of your ideas.'
          : result.reason ?? null,
    });
  });
}
