/**
 * GET /api/audio?file=speaking/{attemptId}/{filename} — Serve audio files securely.
 *
 * Authentication required.
 * Ownership verified — student can only access their own recordings.
 * Path traversal prevention.
 */

import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { readFile } from "fs/promises";
import { resolve, sep } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const url = new URL(req.url);
    const file = url.searchParams.get("file");

    if (!file) return badRequest("File parameter is required");

    // Path traversal prevention
    const uploadDir = process.env.UPLOAD_DIR || "/tmp/alo-english-uploads";
    const resolvedPath = resolve(uploadDir, file);
    const normalizedBase = resolve(uploadDir);

    if (!resolvedPath.startsWith(normalizedBase + sep) && resolvedPath !== normalizedBase) {
      return forbidden("Invalid file path");
    }

    // Extract attemptId from path and verify ownership
    // Path format: speaking/{attemptId}/{filename}
    const pathParts = file.split("/");
    if (pathParts.length < 3 || pathParts[0] !== "speaking") {
      return badRequest("Invalid file path format");
    }

    const attemptId = pathParts[1];

    // Verify ownership
    const { db } = await import("@/lib/db");
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      select: { userId: true },
    });

    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("Not your recording");

    // Read and serve file
    try {
      const fileBuffer = await readFile(resolvedPath);
      const ext = resolvedPath.split(".").pop()?.toLowerCase() || "";

      const mimeTypes: Record<string, string> = {
        webm: "audio/webm",
        ogg: "audio/ogg",
        m4a: "audio/mp4",
        mp3: "audio/mpeg",
        wav: "audio/wav",
      };

      const contentType = mimeTypes[ext] || "application/octet-stream";

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(fileBuffer.length),
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return notFound("Audio file not found");
    }
  });
}
