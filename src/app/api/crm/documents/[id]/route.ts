/**
 * GET    /api/crm/documents/[id] — read one document's metadata
 * PUT    /api/crm/documents/[id] — update review state
 * DELETE /api/crm/documents/[id] — remove from views (SOFT delete only)
 *
 * WHY DELETE IS NOT A HARD DELETE
 * ───────────────────────────────
 * A previous version of this route handed deletion to the generic CRUD handler,
 * which called `deleteMany` — a permanent row delete that the database cascade
 * then propagated. That contradicts the retention policy for this platform: a
 * student's documents are the evidence behind an application, a visa file and a
 * payment, and "we deleted the passport scan by accident" is not recoverable.
 *
 * So DELETE now sets `deletedAt` and records the action. The file stays in
 * private storage, the version history stays intact, and the record disappears
 * from normal views. Permanent erasure runs only through the approved retention
 * workflow (`canPermanentlyDelete` denies every ordinary role) with its own
 * approval and audit trail.
 *
 * The download route refuses any document with `deletedAt` set, so a soft-deleted
 * file is unreachable through the API.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { audit, getClientIp } from '@/lib/audit';
import { forbidden, notFound, ok, unauthorized, withErrorHandler } from '@/lib/responses';
import { canSoftDelete, canVerifyDocument, canReadStudentDocument, SENSITIVE_DOCUMENT_TYPES, type CrmRole } from '@/lib/crm/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  /** Human review decision. PENDING_REVIEW is the state of a new inbound file. */
  verificationStatus: z.enum(['PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED']).optional(),
  type: z.string().min(1).max(40).optional(),
  reviewNote: z.string().max(500).optional(),
});

async function loadDocument(id: string) {
  return db.document.findUnique({
    where: { id },
    select: {
      id: true,
      studentId: true,
      type: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      fileHash: true,
      sourceChannel: true,
      verificationStatus: true,
      verifiedBy: true,
      verifiedAt: true,
      currentVersion: true,
      retentionClass: true,
      deletedAt: true,
      createdAt: true,
      student: { select: { counselorId: true } },
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const document = await loadDocument(id);
    if (!document || document.deletedAt) return notFound('Document not found');

    const decision = canReadStudentDocument({
      role: user.role as CrmRole,
      studentId: document.studentId,
      isAssignedCounselor: document.student?.counselorId === user.id,
      hasExplicitGrant: false,
      sensitivity: (SENSITIVE_DOCUMENT_TYPES as readonly string[]).includes(document.type) ? 'SENSITIVE' : 'INTERNAL',
    });

    if (!decision.allowed) {
      await audit('DOCUMENTS_DOWNLOAD', {
        userId: user.id,
        resource: `document:${id}`,
        metadata: { action: 'METADATA_READ', outcome: 'denied', code: decision.code },
        ipAddress: getClientIp(req),
      });
      return forbidden(decision.reason);
    }

    // Metadata only. The file itself is served exclusively by the download
    // route, which re-checks permission and verifies the hash.
    const { fileHash, ...metadata } = document;
    return ok({ ...metadata, hasStoredFile: Boolean(fileHash), downloadUrl: `/api/crm/documents/${document.id}/download` });
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return forbidden(parsed.error.issues[0]?.message ?? 'Invalid request body');

    const document = await loadDocument(id);
    if (!document || document.deletedAt) return notFound('Document not found');

    const isAssignedCounselor = document.student?.counselorId === user.id;

    // Changing a verification state is a review action, not an edit: it needs
    // both a reviewing role and responsibility for this student.
    if (parsed.data.verificationStatus) {
      const decision = canVerifyDocument(user.role as CrmRole, isAssignedCounselor);
      if (!decision.allowed) {
        await audit('DOCUMENTS_DOWNLOAD', {
          userId: user.id,
          resource: `document:${id}`,
          metadata: { action: 'VERIFY', outcome: 'denied', code: decision.code },
          ipAddress: getClientIp(req),
        });
        return forbidden(decision.reason);
      }
    }

    const updated = await db.document.update({
      where: { id },
      data: {
        ...(parsed.data.verificationStatus
          ? {
              verificationStatus: parsed.data.verificationStatus,
              // Verified-by is recorded only for VERIFIED; a rejection records
              // the reviewer separately in the audit log.
              ...(parsed.data.verificationStatus === 'VERIFIED'
                ? { verifiedBy: user.id, verifiedAt: new Date() }
                : { verifiedBy: null, verifiedAt: null }),
            }
          : {}),
        ...(parsed.data.type ? { type: parsed.data.type } : {}),
      },
      select: { id: true, verificationStatus: true, verifiedBy: true, verifiedAt: true, type: true },
    });

    await audit('DOCUMENTS_UPDATE', {
      userId: user.id,
      resource: `document:${id}`,
      metadata: {
        verificationStatus: parsed.data.verificationStatus ?? null,
        type: parsed.data.type ?? null,
        note: parsed.data.reviewNote ?? null,
      },
      ipAddress: getClientIp(req),
    });

    return ok(updated, 'Document updated');
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;

    // Permanent deletion is not a role permission. This route never removes the
    // row or the file; it records a soft delete and keeps the history.
    const decision = canSoftDelete(user.role as CrmRole);
    if (!decision.allowed) {
      await audit('DOCUMENTS_DELETE', {
        userId: user.id,
        resource: `document:${id}`,
        metadata: { outcome: 'denied', code: decision.code, persistent: false },
        ipAddress: getClientIp(req),
      });
      return forbidden(`${decision.reason} Permanent deletion requires the approved retention workflow.`);
    }

    const document = await loadDocument(id);
    if (!document || document.deletedAt) return notFound('Document not found');

    await db.document.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });

    await audit('DOCUMENTS_DELETE', {
      userId: user.id,
      resource: `document:${id}`,
      metadata: {
        outcome: 'soft_deleted',
        persistent: false,
        note: 'Row and stored file retained; excluded from normal views. Permanent erasure requires the approved retention workflow.',
      },
      ipAddress: getClientIp(req),
    });

    return ok({ id, softDeleted: true }, 'Document removed from views. The file and its history are retained.');
  });
}
