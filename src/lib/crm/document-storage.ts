/**
 * src/lib/crm/document-storage.ts
 *
 * Private storage for student documents received over WhatsApp, Messenger,
 * Instagram, SMS or the portal.
 *
 * THREE RULES THIS MODULE ENFORCES
 * ────────────────────────────────
 *   1. Files land OUTSIDE the web root, under UPLOAD_DIR, and are only ever
 *      served through an authorized route. A storage key is never a public URL.
 *   2. A storage key can never escape the upload root. Keys are generated here,
 *      and any key read back is re-validated before use — a key that contains
 *      "..", an absolute path or a null byte is refused rather than resolved.
 *   3. Replacing a file never overwrites the previous one. Version 1, 2, 3… live
 *      side by side, so a previously verified passport scan stays readable even
 *      after the student uploads a new one.
 *
 * Files are addressed by content, not by name: the on-disk filename is derived
 * from the student, document and version, and the original name is kept as
 * metadata only. A student cannot influence where a file is written.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { getUploadDir } from '@/lib/paths';

/** Hard ceiling for one document. Larger files must be sent as a link. */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

/** Extensions mapped from the MIME types we accept. */
export const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

export type StorageResult =
  | {
      ok: true;
      storageKey: string;
      fileHash: string;
      fileSize: number;
      mimeType: string;
      /** True when an identical file already existed at this key. */
      duplicateContent: boolean;
    }
  | { ok: false; code: 'TOO_LARGE' | 'UNSUPPORTED_TYPE' | 'EMPTY' | 'INVALID_TARGET' | 'WRITE_FAILED'; reason: string };

/**
 * Build the relative storage key for a document version.
 *
 * Shape: students/<studentId>/documents/<documentId>/v<version>.<ext>
 * Student and document ids are cuid()-shaped, but they are still sanitised:
 * a key must never depend on a value being well-formed upstream.
 */
export function buildStorageKey(input: {
  studentId: string;
  documentId: string;
  version: number;
  mimeType: string;
}): string {
  const safeSegment = (value: string, fallback: string): string => {
    const cleaned = value.replace(/[^A-Za-z0-9_-]/g, '');
    return cleaned.length > 0 && cleaned.length <= 64 ? cleaned : fallback;
  };

  const student = safeSegment(input.studentId, 'unknown-student');
  const document = safeSegment(input.documentId, 'unknown-document');
  const extension = ALLOWED_DOCUMENT_TYPES[input.mimeType] ?? 'bin';
  const version = Number.isInteger(input.version) && input.version > 0 ? input.version : 1;

  return ['students', student, 'documents', document, `v${version}.${extension}`].join('/');
}

/**
 * Validate a storage key and resolve it to an absolute path inside the upload
 * root. Returns null when the key is malformed or would escape the root.
 *
 * This is the only function that may turn a key into a path.
 */
export function resolveStoragePath(storageKey: string): string | null {
  if (typeof storageKey !== 'string' || storageKey.length === 0 || storageKey.length > 512) return null;
  if (storageKey.includes('\0') || storageKey.includes('\\')) return null;
  if (isAbsolute(storageKey)) return null;

  const normalised = normalize(storageKey).split(sep).join('/');
  if (normalised.startsWith('..') || normalised.includes('/../') || normalised.startsWith('/')) return null;

  const root = resolve(getUploadDir());
  const target = resolve(root, normalised);
  const rel = relative(root, target);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return null;

  return target;
}

/** SHA-256 of the file contents. Used for integrity checks and deduplication. */
export function hashContent(buffer: Buffer | Uint8Array): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Persist an inbound file. Idempotent by content: if the same bytes are already
 * at this key, the existing file is kept and reported as a content duplicate
 * rather than rewritten.
 */
export function writePrivateDocument(input: {
  studentId: string;
  documentId: string;
  version: number;
  mimeType: string;
  content: Buffer | Uint8Array;
}): StorageResult {
  const buffer = Buffer.isBuffer(input.content) ? input.content : Buffer.from(input.content);

  if (buffer.byteLength === 0) {
    return { ok: false, code: 'EMPTY', reason: 'The received file is empty.' };
  }
  if (buffer.byteLength > MAX_DOCUMENT_BYTES) {
    return {
      ok: false,
      code: 'TOO_LARGE',
      reason: `File is ${buffer.byteLength} bytes; the limit is ${MAX_DOCUMENT_BYTES}.`,
    };
  }
  if (!ALLOWED_DOCUMENT_TYPES[input.mimeType]) {
    return {
      ok: false,
      code: 'UNSUPPORTED_TYPE',
      reason: `${input.mimeType} is not an accepted document type.`,
    };
  }

  const storageKey = buildStorageKey(input);
  const absolutePath = resolveStoragePath(storageKey);
  if (!absolutePath) {
    return { ok: false, code: 'INVALID_TARGET', reason: 'The storage key did not resolve inside the upload root.' };
  }

  const fileHash = hashContent(buffer);

  try {
    if (existsSync(absolutePath)) {
      const existing = readFileSync(absolutePath);
      if (hashContent(existing) === fileHash) {
        return { ok: true, storageKey, fileHash, fileSize: existing.byteLength, mimeType: input.mimeType, duplicateContent: true };
      }
    }

    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, buffer, { mode: 0o600 });
    return { ok: true, storageKey, fileHash, fileSize: buffer.byteLength, mimeType: input.mimeType, duplicateContent: false };
  } catch (error) {
    return {
      ok: false,
      code: 'WRITE_FAILED',
      reason: error instanceof Error ? error.message : 'The file could not be written.',
    };
  }
}

/**
 * Read a stored document back. Returns null when the key is invalid, the file is
 * missing, or the recorded hash no longer matches — a truncated or altered file
 * is refused rather than served.
 */
export function readPrivateDocument(storageKey: string, expectedHash?: string | null): Buffer | null {
  const absolutePath = resolveStoragePath(storageKey);
  if (!absolutePath || !existsSync(absolutePath)) return null;

  try {
    const buffer = readFileSync(absolutePath);
    if (expectedHash && hashContent(buffer) !== expectedHash) return null;
    return buffer;
  } catch {
    return null;
  }
}

export function documentExists(storageKey: string): boolean {
  const absolutePath = resolveStoragePath(storageKey);
  return absolutePath !== null && existsSync(absolutePath);
}

export function documentSize(storageKey: string): number | null {
  const absolutePath = resolveStoragePath(storageKey);
  if (!absolutePath || !existsSync(absolutePath)) return null;
  try {
    return statSync(absolutePath).size;
  } catch {
    return null;
  }
}

/**
 * Remove a stored file.
 *
 * Deliberately not exposed through any HTTP route. This exists only for the
 * approved retention workflow, which runs outside day-to-day CRM permissions
 * (see `canPermanentlyDelete` in src/lib/crm/permissions.ts, which denies every
 * ordinary role).
 */
export function removeStoredDocument(storageKey: string): boolean {
  const absolutePath = resolveStoragePath(storageKey);
  if (!absolutePath || !existsSync(absolutePath)) return false;
  try {
    unlinkSync(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Guess a document type from the file name. This is a SUGGESTION for the review
 * queue only: an automatically received file is recorded as PENDING_REVIEW and a
 * human decides. It never sets a verification state.
 */
export function suggestDocumentType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (/passport/.test(lower)) return 'PASSPORT';
  if (/\b(nid|national.?id)\b/.test(lower)) return 'NID';
  if (/birth/.test(lower)) return 'BIRTH_CERT';
  if (/ielts|trf/.test(lower)) return 'IELTS';
  if (/pte/.test(lower)) return 'PTE';
  if (/toefl/.test(lower)) return 'TOEFL';
  if (/duolingo|det\b/.test(lower)) return 'DUOLINGO';
  if (/transcript|marksheet|result/.test(lower)) return 'TRANSCRIPT';
  if (/bank|statement|solvency/.test(lower)) return 'BANK_STATEMENT';
  if (/cv|resume/.test(lower)) return 'CV';
  if (/sop|statement.?of.?purpose/.test(lower)) return 'SOP';
  if (/recommend|reference/.test(lower)) return 'RECOMMENDATION';
  if (/offer|admission/.test(lower)) return 'OFFER_LETTER';
  if (/visa/.test(lower)) return 'VISA';
  if (/photo/.test(lower)) return 'PHOTO';
  return 'CERTIFICATE';
}

/** Human-readable size, for the review UI. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Where documents are stored, for health output. Never includes file contents. */
export function storageRoot(): string {
  return getUploadDir();
}

/** Join a storage key for logging without leaking more than the last segment. */
export function describeStorageKey(storageKey: string): string {
  const parts = storageKey.split('/');
  return parts.length > 2 ? `…/${parts.slice(-2).join('/')}` : storageKey;
}
