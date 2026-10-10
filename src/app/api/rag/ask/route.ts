/**
 * Public handbook Q&A endpoint. Requests are bounded and rate-limited because
 * each grounded answer may call an external model. Source material is restricted
 * to active public records by RagEngine; provider output is not authoritative.
 */

import { RagEngine } from "@/lib/ai/rag/RagEngine";
import { getClientIp } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { badRequest, ok, payloadTooLarge, rateLimited, withErrorHandler } from "@/lib/responses";
import { RequestBodyTooLargeError, readJsonWithLimit } from "@/lib/http/read-json-with-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_REQUEST_BYTES = 4096;
const schema = z.object({
  question: z.string().min(3).max(500),
  materialId: z.string().max(128).optional(),
  category: z.string().max(100).optional(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const ip = getClientIp(req) || "unknown";
    if (!rateLimit(`rag-ask:${ip}`, 10, 15 * 60).allowed) {
      return rateLimited("Too many handbook questions. Please try again later.");
    }

    let body: unknown;
    try {
      body = await readJsonWithLimit(req, MAX_REQUEST_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) return payloadTooLarge("Request body is too large");
      return badRequest("Invalid JSON");
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid request");

    const { question, materialId, category } = parsed.data;
    const result = await RagEngine.ask(question, materialId, category);
    return ok(result, "Answer generated");
  });
}
