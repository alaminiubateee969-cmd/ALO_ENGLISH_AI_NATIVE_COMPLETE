import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';

export const MIN_MP3_BYTES = 1024;
export const MAX_MP3_BYTES = 20 * 1024 * 1024;
const MAX_ID3_TAG_BYTES = 16 * 1024 * 1024;

/**
 * Validate an MP3 container signature and basic frame header before an asset
 * is persisted as READY. This is deliberately a structural check, not a claim
 * that every codec/frame decodes in every browser; browser playback remains a
 * separate release gate.
 */
export function inspectMp3Buffer(buffer, { minBytes = MIN_MP3_BYTES, maxBytes = MAX_MP3_BYTES } = {}) {
  if (!Buffer.isBuffer(buffer)) return { valid: false, reason: 'NOT_A_BUFFER' };
  if (buffer.length < minBytes) return { valid: false, reason: 'TOO_SMALL', byteSize: buffer.length };
  if (buffer.length > maxBytes) return { valid: false, reason: 'TOO_LARGE', byteSize: buffer.length };

  let start = 0;
  if (buffer.subarray(0, 3).toString('ascii') === 'ID3') {
    if (buffer.length < 10) return { valid: false, reason: 'TRUNCATED_ID3_HEADER', byteSize: buffer.length };
    const sizeBytes = [buffer[6], buffer[7], buffer[8], buffer[9]];
    if (sizeBytes.some((value) => (value & 0x80) !== 0)) {
      return { valid: false, reason: 'INVALID_ID3_SIZE', byteSize: buffer.length };
    }
    const tagSize = (sizeBytes[0] << 21) | (sizeBytes[1] << 14) | (sizeBytes[2] << 7) | sizeBytes[3];
    if (tagSize > MAX_ID3_TAG_BYTES) return { valid: false, reason: 'ID3_TAG_TOO_LARGE', byteSize: buffer.length };
    start = 10 + tagSize + ((buffer[5] & 0x10) !== 0 ? 10 : 0);
    if (start + 4 > buffer.length) return { valid: false, reason: 'TRUNCATED_ID3_TAG', byteSize: buffer.length };
  }

  const scanEnd = Math.min(buffer.length - 4, start + 64 * 1024);
  for (let offset = start; offset <= scanEnd; offset += 1) {
    if (buffer[offset] !== 0xff || (buffer[offset + 1] & 0xe0) !== 0xe0) continue;
    const version = (buffer[offset + 1] >> 3) & 0x03;
    const layer = (buffer[offset + 1] >> 1) & 0x03;
    const bitrateIndex = (buffer[offset + 2] >> 4) & 0x0f;
    const sampleRateIndex = (buffer[offset + 2] >> 2) & 0x03;
    if (version === 0x01 || layer === 0 || bitrateIndex === 0 || bitrateIndex === 0x0f || sampleRateIndex === 0x03) continue;

    return {
      valid: true,
      reason: null,
      byteSize: buffer.length,
      mimeType: 'audio/mpeg',
      sha256: createHash('sha256').update(buffer).digest('hex'),
    };
  }

  return { valid: false, reason: 'NO_MPEG_AUDIO_FRAME', byteSize: buffer.length };
}

/**
 * Resolve only same-origin, public listening URLs to a file beneath `public/`.
 * Rejects absolute external URLs and path traversal rather than accidentally
 * treating an arbitrary path as a trusted generated asset.
 */
export function resolvePublicListeningFile(audioUrl, publicDir, trustedOrigin) {
  if (typeof audioUrl !== 'string' || audioUrl.trim() === '') return null;
  let parsed;
  try {
    if (!trustedOrigin) return null;
    parsed = new URL(audioUrl, trustedOrigin);
    const trusted = new URL(trustedOrigin);
    if (parsed.origin !== trusted.origin) return null;
  } catch {
    return null;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    return null;
  }
  if (!pathname.startsWith('/audio/listening/')) return null;

  const publicRoot = resolve(publicDir);
  const filePath = resolve(publicRoot, `.${pathname}`);
  if (filePath !== publicRoot && !filePath.startsWith(publicRoot + sep)) return null;
  return filePath;
}

export function safeAudioError(error) {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  return message.replace(/[\r\n\t]+/g, ' ').slice(0, 1000);
}
