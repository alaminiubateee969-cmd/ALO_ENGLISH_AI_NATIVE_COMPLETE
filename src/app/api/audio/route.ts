/**
 * GET /api/audio?file=speaking/{attemptId}/{filename}
 * Serve a bounded speaking recording only to the authenticated attempt owner.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getUploadDir } from "@/lib/paths";
import { parseSpeakingRecordingPath } from "@/lib/audio/recording-path";
import { badRequest, forbidden, internalError, notFound, unauthorized } from "@/lib/responses";
import { lstat, readFile, realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RECORDING_BYTES = 20 * 1024 * 1024;
const MIME_TYPES: Record<string, string> = {
  webm: "audio/webm",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

function errorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return null;
  const status = (error as { statusCode?: unknown }).statusCode;
  return status === 401 || status === 403 ? status : null;
}

export async function GET(req: Request): Promise<Response> {
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth();
  } catch (error) {
    const status = errorStatus(error);
    if (status === 401) return unauthorized();
    if (status === 403) return forbidden();
    console.error("[audio-auth-error]", error);
    return internalError();
  }

  const file = new URL(req.url).searchParams.get("file");
  const locator = parseSpeakingRecordingPath(file);
  if (!locator) return badRequest("Invalid recording locator");

  try {
    const attempt = await db.attempt.findUnique({
      where: { id: locator.attemptId },
      select: { userId: true },
    });
    if (!attempt) return notFound("Recording not found");
    if (attempt.userId !== user.id) return forbidden("You can only access recordings for your own attempts");

    const uploadDir = resolve(getUploadDir());
    const speakingDir = resolve(uploadDir, "speaking");
    const attemptDir = resolve(speakingDir, locator.attemptId);
    const filePath = resolve(attemptDir, locator.filename);

    // Build the path only from the validated locator, then reject symlinks in
    // every user-controlled directory component so one attempt cannot alias
    // another student's file through a filesystem link.
    const [speakingInfo, attemptInfo, fileInfo] = await Promise.all([
      lstat(speakingDir),
      lstat(attemptDir),
      lstat(filePath),
    ]);
    if (speakingInfo.isSymbolicLink() || attemptInfo.isSymbolicLink() || fileInfo.isSymbolicLink()) {
      return forbidden("Invalid recording path");
    }
    if (!speakingInfo.isDirectory() || !attemptInfo.isDirectory() || !fileInfo.isFile()) {
      return notFound("Recording not found");
    }
    if (fileInfo.size <= 0 || fileInfo.size > MAX_RECORDING_BYTES) {
      return new Response(
        JSON.stringify({ success: false, status: 413, message: "Recording exceeds the allowed size", error: "PAYLOAD_TOO_LARGE" }),
        { status: 413, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
      );
    }

    const [realRoot, realFile] = await Promise.all([realpath(uploadDir), realpath(filePath)]);
    const realRootPrefix = realRoot.endsWith(sep) ? realRoot : `${realRoot}${sep}`;
    if (!realFile.startsWith(realRootPrefix)) return forbidden("Invalid recording path");

    const bytes = await readFile(filePath);
    if (bytes.length !== fileInfo.size || bytes.length > MAX_RECORDING_BYTES) {
      return internalError("Recording changed while being read");
    }

    const extension = locator.filename.split(".").pop()?.toLowerCase() || "";
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
        "Content-Length": String(bytes.length),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return notFound("Recording not found");
    }
    console.error("[audio-error]", error);
    return internalError();
  }
}
