/**
 * POST /api/speaking/upload — Upload a speaking recording.
 *
 * Accepts multipart/form-data with:
 *   - audio: Blob (audio/webm or audio/mp4)
 *   - attemptId: string
 *   - questionId: string
 *   - duration: string (milliseconds)
 *   - mimeType: string
 *
 * Validates:
 *   - Authentication required
 *   - Attempt ownership verified
 *   - File size limit (25MB)
 *   - MIME type validation (audio only)
 *   - Attempt must be IN_PROGRESS
 *
 * Stores:
 *   - Audio file in UPLOAD_DIR/speaking/{attemptId}/{questionId}.webm
 *   - Metadata in database (via Document model or attempt metadata)
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden, internalError } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
];

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const formData = await req.formData().catch(() => null);
    if (!formData) return badRequest("Expected multipart form data");

    const audioFile = formData.get("audio") as File | null;
    const attemptId = formData.get("attemptId") as string | null;
    const questionId = formData.get("questionId") as string | null;
    const duration = formData.get("duration") as string | null;
    const mimeType = formData.get("mimeType") as string | null;

    // Validate required fields
    if (!audioFile) return badRequest("Audio file is required");
    if (!attemptId) return badRequest("Attempt ID is required");
    if (!questionId) return badRequest("Question ID is required");

    // Validate file size
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return badRequest(`Audio file is too large (max ${MAX_AUDIO_SIZE / (1024 * 1024)}MB)`);
    }
    if (audioFile.size === 0) {
      return badRequest("Audio file is empty");
    }

    // Validate MIME type
    const actualMime = mimeType || audioFile.type;
    if (!ALLOWED_MIME_TYPES.some((allowed) => actualMime.includes(allowed))) {
      return badRequest(`Unsupported audio format: ${actualMime}. Supported: webm, ogg, mp4, wav`);
    }

    // Verify attempt ownership
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      select: { userId: true, status: true },
    });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("Not your attempt");
    if (attempt.status !== "IN_PROGRESS") {
      return badRequest("Attempt is not in progress");
    }

    // Determine file extension
    const ext = actualMime.includes("webm") ? "webm"
      : actualMime.includes("ogg") ? "ogg"
      : actualMime.includes("mp4") ? "m4a"
      : actualMime.includes("mpeg") ? "mp3"
      : actualMime.includes("wav") ? "wav"
      : "webm";

    // Generate secure filename
    const filename = `${questionId}-${randomUUID().slice(0, 8)}.${ext}`;
    const uploadDir = process.env.UPLOAD_DIR || "/tmp/alo-english-uploads";
    const speakingDir = join(uploadDir, "speaking", attemptId);
    const filePath = join(speakingDir, filename);

    // Create directory if needed
    try {
      await mkdir(speakingDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Write audio file
    const audioBuffer = await audioFile.arrayBuffer();
    await writeFile(filePath, Buffer.from(audioBuffer));

    // Store relative path (not absolute — security)
    const relativePath = `speaking/${attemptId}/${filename}`;

    // Audit log
    await audit("SPEAKING_UPLOAD" as any, {
      userId: user.id,
      resource: "speaking:" + attemptId + ":" + questionId,
      ipAddress: getClientIp(req),
      metadata: {
        fileSize: audioFile.size,
        mimeType: actualMime,
        duration: duration || "unknown",
        questionId,
      },
    });

    return ok({
      filePath: relativePath,
      fileSize: audioFile.size,
      mimeType: actualMime,
      duration: duration ? parseInt(duration) : 0,
      questionId,
      attemptId,
    }, "Speaking recording uploaded successfully");
  });
}
