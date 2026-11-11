/**
 * GET /api/crm/documents/[id]/download — authorized document access.
 *
 * THE ONLY PATH BY WHICH A STORED FILE LEAVES THE SERVER
 * ─────────────────────────────────────────────────────
 * Files are written outside the web root with mode 0600 and are never linked
 * directly. This route is therefore the entire access-control surface for
 * student documents, and it does four things in order:
 *
 *   1. Authenticates the caller.
 *   2. Applies the permission policy from src/lib/crm/permissions.ts — where
 *      marketing roles are refused outright, and admin rank alone is NOT
 *      sufficient for a passport, NID, bank statement or visa document.
 *   3. Verifies the file's hash before serving it, so a truncated or swapped
 *      file is refused rather than handed over.
 *   4. Writes an audit record whether the read succeeds OR fails. A denied
 *      attempt is exactly the event an audit trail exists to capture.
 *
 * Responses are marked no-store and nosniff: a document must not be cached by a
 * shared proxy or interpreted as anything other than the recorded type.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { audit, getClientIp } from '@/lib/audit';
import { forbidden, internalError, notFound, unauthorized, withErrorHandler } from '@/lib/responses';
import { readPrivateDocument } from '@/lib/crm/document-storage';
import { canReadStudentDocument, SENSITIVE_DOCUMENT_TYPES, type CrmRole, type DocumentSensitivity } from '@/lib/crm/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sensitivityFor(documentType: string): DocumentSensitivity {
  return (SENSITIVE_DOCUMENT_TYPES as readonly string[]).includes(documentType) ? 'SENSITIVE' : 'INTERNAL';
}

/**
 * A recorded, named grant for one student. Stored as a Setting so it is
 * explicit, revocable and visible — never inferred from a role.
 */
async function hasExplicitGrant(studentId: string, userId: string): Promise<boolean> {
  const grant = await db.setting.findUnique({
    where: { key: `doc-access-grant:${studentId}:${userId}` },
    select: { value: true },
  });
  return grant?.value === 'true';
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const document = await db.document.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        applicationId: true,
        type: true,
        fileName: true,
        mimeType: true,
        fileHash: true,
        storageKey: true,
        filePath: true,
        deletedAt: true,
        verificationStatus: true,
        student: { select: { counselorId: true } },
      },
    });

    if (!document || document.deletedAt) {
      await audit('DOCUMENTS_DOWNLOAD', {
        userId: user.id,
        resource: `document:${id}`,
        metadata: { outcome: 'not_found_or_removed' },
        ipAddress: getClientIp(req),
      });
      return notFound('Document not found');
    }

    const isAssignedCounselor = document.student?.counselorId === user.id;
    const grant = await hasExplicitGrant(document.studentId, user.id);

    const decision = canReadStudentDocument({
      role: user.role as CrmRole,
      studentId: document.studentId,
      isAssignedCounselor,
      hasExplicitGrant: grant,
      sensitivity: sensitivityFor(document.type),
    });

    // Access is audited either way: a refused read is the signal an audit trail
    // exists to capture.
    await audit('DOCUMENTS_DOWNLOAD', {
      userId: user.id,
      resource: `document:${id}`,
      metadata: {
        action: 'DOWNLOAD',
        outcome: decision.allowed ? 'allowed' : 'denied',
        code: decision.code,
        documentType: document.type,
        sensitivity: sensitivityFor(document.type),
      },
      ipAddress: getClientIp(req),
    });

    if (!decision.allowed) {
      return forbidden(decision.reason);
    }

    const storageKey = document.storageKey ?? document.filePath;
    if (!storageKey) {
      return internalError('This document has no stored file.');
    }

    // The recorded hash is passed in: a file that no longer matches is refused
    // instead of served.
    const content = readPrivateDocument(storageKey, document.fileHash);
    if (!content) {
      return internalError('The stored file is missing or failed its integrity check. Re-upload the document.');
    }

    const safeFileName = document.fileName.replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'document';

    return new NextResponse(new Uint8Array(content), {
      status: 200,
      headers: {
        'Content-Type': document.mimeType,
        'Content-Length': String(content.byteLength),
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'X-Document-Verification': document.verificationStatus,
      },
    });
  });
}
