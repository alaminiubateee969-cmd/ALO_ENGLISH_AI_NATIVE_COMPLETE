export const MAX_SPEECH_AUDIO_BYTES = 10 * 1024 * 1024;

const DATA_URL_PREFIX = /^data:audio\/[a-z0-9.+-]+(?:;codecs=[a-z0-9._+-]+)?;base64,/i;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/** Validate Base64 audio transport and estimate decoded size without allocating it. */
export function inspectBase64Audio(value: unknown): { payload: string; byteSize: number } | null {
  if (typeof value !== "string") return null;
  const payload = value.replace(DATA_URL_PREFIX, "");
  if (payload.length === 0 || payload.length % 4 !== 0 || !BASE64.test(payload)) return null;
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  const byteSize = payload.length / 4 * 3 - padding;
  if (!Number.isSafeInteger(byteSize) || byteSize <= 0 || byteSize > MAX_SPEECH_AUDIO_BYTES) return null;
  return { payload, byteSize };
}
