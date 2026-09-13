import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME = ["audio/webm","audio/webm;codecs=opus","audio/ogg;codecs=opus","audio/mp4","audio/mpeg","audio/wav"];
export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const formData = await req.formData().catch(() => null);
    if (!formData) return badRequest("Expected multipart form data");
    const audioFile = formData.get("audio") as File | null;
    const attemptId = formData.get("attemptId") as string | null;
    const questionId = formData.get("questionId") as string | null;
    const duration = formData.get("duration") as string | null;
    const mimeType = formData.get("mimeType") as string | null;
    if (!audioFile) return badRequest("Audio file is required");
    if (!attemptId) return badRequest("Attempt ID is required");
    if (!questionId) return badRequest("Question ID is required");
    if (audioFile.size > MAX_AUDIO_SIZE) return badRequest("Audio file too large (max 25MB)");
    if (audioFile.size === 0) return badRequest("Audio file is empty");
    const actualMime = mimeType || audioFile.type;
    if (!ALLOWED_MIME.some((a) => actualMime.includes(a))) return badRequest("Unsupported audio format");
    const attempt = await db.attempt.findUnique({ where: { id: attemptId }, select: { userId: true, status: true } });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("Not your attempt");
    if (attempt.status !== "IN_PROGRESS") return badRequest("Attempt not in progress");
    const ext = actualMime.includes("webm") ? "webm" : actualMime.includes("ogg") ? "ogg" : actualMime.includes("mp4") ? "m4a" : actualMime.includes("mpeg") ? "mp3" : "webm";
    const filename = questionId + "-" + randomUUID().slice(0, 8) + "." + ext;
    const uploadDir = process.env.UPLOAD_DIR || "/tmp/alo-english-uploads";
    const speakingDir = join(uploadDir, "speaking", attemptId);
    const filePath = join(speakingDir, filename);
    try { await mkdir(speakingDir, { recursive: true }); } catch {}
    const audioBuffer = await audioFile.arrayBuffer();
    await writeFile(filePath, Buffer.from(audioBuffer));
    const relativePath = "speaking/" + attemptId + "/" + filename;
    await audit("SPEAKING_UPLOAD" as any, { userId: user.id, resource: "speaking:" + attemptId + ":" + questionId, ipAddress: getClientIp(req), metadata: { fileSize: audioFile.size, mimeType: actualMime, duration: duration || "unknown" } });
    return ok({ filePath: relativePath, fileSize: audioFile.size, mimeType: actualMime, duration: duration ? parseInt(duration) : 0, questionId, attemptId }, "Speaking recording uploaded");
  });
}
