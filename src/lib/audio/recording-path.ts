/**
 * Strictly parse a private speaking-recording locator. Only the exact
 * `speaking/{attemptId}/{filename}` shape is accepted; callers must still
 * authorize the attempt owner before opening the file.
 */
export type SpeakingRecordingPath = {
  attemptId: string;
  filename: string;
};

const ATTEMPT_ID = /^[a-z0-9]{8,64}$/i;
const RECORDING_FILENAME = /^[a-z0-9][a-z0-9_-]{0,127}\.(?:webm|ogg|m4a|mp3|wav)$/i;

export function parseSpeakingRecordingPath(value: unknown): SpeakingRecordingPath | null {
  if (typeof value !== "string" || value.length > 220 || value.includes("\\")) return null;
  const parts = value.split("/");
  if (parts.length !== 3 || parts[0] !== "speaking") return null;

  const [, attemptId, filename] = parts;
  if (!ATTEMPT_ID.test(attemptId) || !RECORDING_FILENAME.test(filename)) return null;
  return { attemptId, filename };
}
