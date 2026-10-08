/**
 * GET /api/audio?file=speaking/{attemptId}/{filename} — Serve audio files securely.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getUploadDir } from "@/lib/paths";
import { readFile } from "fs/promises";
import { resolve, sep } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);
    const file = url.searchParams.get("file");
    if (!file) return Response.json({ success: false, status: 400, message: "File parameter required", error: "BAD_REQUEST" }, { status: 400 });

    // UPLOAD_DIR is resolved at runtime, so these paths cannot be traced at
    // build time. Without the turbopackIgnore hints, Next.js traces and bundles
    // the entire project (including public/) into the server output.
    //
    // getUploadDir() resolves under the data root (see src/lib/paths.ts) rather
    // than defaulting to /tmp, which a container restart discards.
    const uploadDir = getUploadDir();
    const resolvedPath = resolve(/*turbopackIgnore: true*/ uploadDir, file);
    const normalizedBase = resolve(/*turbopackIgnore: true*/ uploadDir);
    if (!resolvedPath.startsWith(normalizedBase + sep) && resolvedPath !== normalizedBase) {
      return Response.json({ success: false, status: 403, message: "Invalid path", error: "FORBIDDEN" }, { status: 403 });
    }

    const pathParts = file.split("/");
    if (pathParts.length < 3 || pathParts[0] !== "speaking") {
      return Response.json({ success: false, status: 400, message: "Invalid format", error: "BAD_REQUEST" }, { status: 400 });
    }

    const attemptId = pathParts[1];
    const attempt = await db.attempt.findUnique({ where: { id: attemptId }, select: { userId: true } });
    if (!attempt) return Response.json({ success: false, status: 404, message: "Not found", error: "NOT_FOUND" }, { status: 404 });
    if (attempt.userId !== user.id) return Response.json({ success: false, status: 403, message: "Forbidden", error: "FORBIDDEN" }, { status: 403 });

    const fileBuffer = await readFile(/*turbopackIgnore: true*/ resolvedPath);
    const ext = resolvedPath.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = { webm: "audio/webm", ogg: "audio/ogg", m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav" };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new Response(fileBuffer, {
      status: 200,
      headers: { "Content-Type": contentType, "Content-Length": String(fileBuffer.length), "Cache-Control": "private, no-cache, no-store, must-revalidate", "X-Content-Type-Options": "nosniff" },
    });
  } catch (err) {
    console.error("[audio-error]", err);
    return Response.json({ success: false, status: 500, message: "Server error", error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
