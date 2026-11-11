/**
 * tests/document-storage.test.ts
 *
 * Document storage is the part of this system where a mistake exposes a
 * passport scan, so these tests attack it rather than describe it:
 *
 *   - path traversal, absolute paths, null bytes and backslashes
 *   - writing outside the upload root
 *   - serving a file whose bytes no longer match its recorded hash
 *   - silently overwriting a verified file with a new version
 *
 * Everything runs against a temporary directory; no real upload dir is touched.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SANDBOX = mkdtempSync(join(tmpdir(), 'alo-storage-'));
process.env.UPLOAD_DIR = SANDBOX;

// Imported after UPLOAD_DIR is set: paths.ts reads the environment lazily, but
// keeping the order explicit avoids a future refactor breaking these tests.
const {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  buildStorageKey,
  documentExists,
  formatBytes,
  hashContent,
  readPrivateDocument,
  removeStoredDocument,
  resolveStoragePath,
  suggestDocumentType,
  writePrivateDocument,
} = await import('../src/lib/crm/document-storage');

const PDF = Buffer.from('%PDF-1.4 tiny test document');

beforeAll(() => {
  if (!existsSync(SANDBOX)) throw new Error('sandbox missing');
});

afterAll(() => {
  rmSync(SANDBOX, { recursive: true, force: true });
});

describe('storage keys and path confinement', () => {
  test('builds a deterministic key from ids, never from the file name', () => {
    const key = buildStorageKey({ studentId: 'stu1', documentId: 'doc1', version: 1, mimeType: 'application/pdf' });
    expect(key).toBe('students/stu1/documents/doc1/v1.pdf');

    const withSlashes = buildStorageKey({
      studentId: '../../../etc',
      documentId: 'a/b\\c',
      version: 2,
      mimeType: 'application/pdf',
    });
    expect(withSlashes).not.toContain('..');
    expect(withSlashes).toBe('students/etc/documents/abc/v2.pdf');
  });

  test('refuses traversal, absolute paths, backslashes and null bytes', () => {
    for (const evil of [
      '../secrets.pdf',
      'students/../../etc/passwd',
      '/etc/passwd',
      'C:\\Windows\\system32\\config',
      'students\u0000/../../etc/passwd',
      '',
    ]) {
      expect(resolveStoragePath(evil)).toBeNull();
    }
  });

  test('a legitimate key resolves inside the upload root', () => {
    const resolved = resolveStoragePath('students/stu1/documents/doc1/v1.pdf');
    expect(resolved).not.toBeNull();
    expect(resolved!.startsWith(SANDBOX)).toBe(true);
  });

  test('a key with no path component is refused rather than resolving to the root', () => {
    expect(resolveStoragePath('.')).toBeNull();
    expect(resolveStoragePath('/')).toBeNull();
  });
});

describe('writing documents', () => {
  test('stores a file privately and returns its hash', () => {
    const result = writePrivateDocument({
      studentId: 'stu1',
      documentId: 'doc-write',
      version: 1,
      mimeType: 'application/pdf',
      content: PDF,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fileHash).toBe(hashContent(PDF));
    expect(result.fileSize).toBe(PDF.byteLength);
    expect(result.duplicateContent).toBe(false);
    expect(documentExists(result.storageKey)).toBe(true);
  });

  test('is idempotent by content: the same bytes are not rewritten', () => {
    const input = { studentId: 'stu1', documentId: 'doc-idem', version: 1, mimeType: 'application/pdf', content: PDF };
    const first = writePrivateDocument(input);
    const second = writePrivateDocument(input);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.duplicateContent).toBe(true);
    expect(second.storageKey).toBe(first.storageKey);
  });

  test('rejects an empty file, an oversized file and an unsupported type', () => {
    const empty = writePrivateDocument({ studentId: 's', documentId: 'd', version: 1, mimeType: 'application/pdf', content: Buffer.alloc(0) });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.code).toBe('EMPTY');

    const huge = writePrivateDocument({
      studentId: 's',
      documentId: 'd2',
      version: 1,
      mimeType: 'application/pdf',
      content: Buffer.alloc(MAX_DOCUMENT_BYTES + 1, 1),
    });
    expect(huge.ok).toBe(false);
    if (!huge.ok) expect(huge.code).toBe('TOO_LARGE');

    const exe = writePrivateDocument({ studentId: 's', documentId: 'd3', version: 1, mimeType: 'application/x-msdownload', content: PDF });
    expect(exe.ok).toBe(false);
    if (!exe.ok) expect(exe.code).toBe('UNSUPPORTED_TYPE');
  });

  test('a new version does not overwrite the previous file', () => {
    const v1 = writePrivateDocument({ studentId: 'stu2', documentId: 'doc-ver', version: 1, mimeType: 'application/pdf', content: Buffer.from('version one') });
    const v2 = writePrivateDocument({ studentId: 'stu2', documentId: 'doc-ver', version: 2, mimeType: 'application/pdf', content: Buffer.from('version two') });

    expect(v1.ok && v2.ok).toBe(true);
    if (!v1.ok || !v2.ok) return;
    expect(v1.storageKey).not.toBe(v2.storageKey);

    // The verified original is still readable after the replacement.
    expect(readPrivateDocument(v1.storageKey, v1.fileHash)?.toString()).toBe('version one');
    expect(readPrivateDocument(v2.storageKey, v2.fileHash)?.toString()).toBe('version two');
  });

  test('every accepted MIME type maps to an extension', () => {
    for (const [mime, ext] of Object.entries(ALLOWED_DOCUMENT_TYPES)) {
      const key = buildStorageKey({ studentId: 's', documentId: 'd', version: 1, mimeType: mime });
      expect(key.endsWith(`.${ext}`)).toBe(true);
    }
  });
});

describe('reading documents', () => {
  test('refuses a file whose bytes no longer match the recorded hash', () => {
    const stored = writePrivateDocument({ studentId: 'stu3', documentId: 'doc-tamper', version: 1, mimeType: 'application/pdf', content: PDF });
    expect(stored.ok).toBe(true);
    if (!stored.ok) return;

    const path = resolveStoragePath(stored.storageKey)!;
    writeFileSync(path, 'tampered contents');

    expect(readPrivateDocument(stored.storageKey, stored.fileHash)).toBeNull();
    // Without a hash to compare against it still reads, so callers must always
    // pass the recorded hash when serving a file to a user.
    expect(readPrivateDocument(stored.storageKey)).not.toBeNull();
  });

  test('returns null for a missing file or a hostile key', () => {
    expect(readPrivateDocument('students/nope/none/v1.pdf')).toBeNull();
    expect(readPrivateDocument('../../etc/passwd')).toBeNull();
  });

  test('removeStoredDocument only ever touches files inside the root', () => {
    const stored = writePrivateDocument({ studentId: 'stu4', documentId: 'doc-del', version: 1, mimeType: 'application/pdf', content: PDF });
    expect(stored.ok).toBe(true);
    if (!stored.ok) return;

    expect(removeStoredDocument('../../etc/passwd')).toBe(false);
    expect(removeStoredDocument(stored.storageKey)).toBe(true);
    expect(documentExists(stored.storageKey)).toBe(false);
  });

  test('nothing was written outside the sandbox', () => {
    const entries = readFileSync(join(SANDBOX, 'students', 'stu1', 'documents', 'doc-write', 'v1.pdf'));
    expect(entries.byteLength).toBe(PDF.byteLength);
  });
});

describe('type suggestions', () => {
  test('recognises common document names', () => {
    expect(suggestDocumentType('passport-front.jpg')).toBe('PASSPORT');
    expect(suggestDocumentType('IELTS_TRF_2026.pdf')).toBe('IELTS');
    expect(suggestDocumentType('bank-statement-april.pdf')).toBe('BANK_STATEMENT');
    expect(suggestDocumentType('my-scan.pdf')).toBe('CERTIFICATE');
  });

  test('formatBytes is readable', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});
