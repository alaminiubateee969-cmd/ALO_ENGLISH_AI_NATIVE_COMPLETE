/**
 * POST /api/crm/review-queue/conversations/[id] — resolve a flagged conversation.
 *
 * Actions:
 *   LINK_STUDENT  the sender really is this student: attach the conversation, its
 *                 messages and its unclaimed documents, and clear the flag
 *   DISMISS       this is not a duplicate: clear the flag, with a note saying what
 *                 was checked
 *   KEEP_PENDING  not now: record what it is waiting for, keep it in the queue
 *
 * WHAT LINKING DOES, AND WHY IT IS NOT A MERGE
 * ───────────────────────────────────────────
 * Linking attaches the conversation to an existing student record. It never
 * merges two student records: the pipeline created a flagged record precisely
 * because merging two people's documents and applications is not recoverable by
 * an apology. If the operator decides the flagged record and an existing student
 * are the same person, they link the conversation and then close the duplicate
 * record by hand, deliberately, with the audit trail that entails.
 *
 * Auth: `canResolveReview` — an identity decision moves a person's messages and
 * documents with it, so it belongs to the people who own student relationships.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { audit, getClientIp } from '@/lib/audit';
import { badRequest, forbidden, notFound, ok, unauthorized, withErrorHandler } from '@/lib/responses';
import { canResolveReview, type CrmRole } from '@/lib/crm/permissions';
import { describeResolution, validateResolution } from '@/lib/crm/review-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resolutionSchema = z.object({
  action: z.enum(['LINK_STUDENT', 'DISMISS', 'KEEP_PENDING']),
  studentId: z.string().min(1).optional(),
  note: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const role = user.role as CrmRole;
    const permission = canResolveReview(role);
    if (!permission.allowed) {
      await audit('REVIEW_RESOLVE', { userId: user.id, metadata: { refusedBy: permission.code, role }, ipAddress: getClientIp(req) });
      return forbidden(permission.reason);
    }

    const { id } = await params;
    const parsed = resolutionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest('Invalid resolution.');

    const conversation = await db.conversation.findUnique({
      where: { id },
      select: { id: true, channel: true, externalThreadId: true, studentId: true, needsReview: true, reviewReason: true },
    });
    if (!conversation) return notFound('Conversation not found.');

    const validation = validateResolution({
      action: parsed.data.action,
      studentId: parsed.data.studentId ?? null,
      note: parsed.data.note ?? null,
      currentStudentId: conversation.studentId,
    });
    if (!validation.ok) return badRequest(validation.reason);

    const label = conversation.externalThreadId ? `${conversation.channel} · ${conversation.externalThreadId}` : `${conversation.channel} conversation`;

    if (validation.action === 'KEEP_PENDING') {
      // Deliberately left in the queue. The reason is appended to the existing
      // one rather than replacing it: the original machine reason for flagging
      // this conversation is part of the record of what happened.
      const reason = [conversation.reviewReason, `Waiting (${user.email ?? user.id}): ${validation.note}`].filter(Boolean).join(' | ');
      await db.conversation.update({ where: { id }, data: { reviewReason: reason } });

      await audit('REVIEW_RESOLVE', {
        userId: user.id,
        resource: `Conversation:${id}`,
        metadata: { action: 'KEEP_PENDING', note: validation.note },
        ipAddress: getClientIp(req),
      });
      return ok({ action: 'KEEP_PENDING', summary: describeResolution({ action: 'KEEP_PENDING', note: validation.note }, { label }) });
    }

    if (validation.action === 'DISMISS') {
      await db.$transaction(async (tx) => {
        await tx.conversation.update({
          where: { id },
          data: { needsReview: false, reviewReason: `Dismissed by a human: ${validation.note}` },
        });
        // Written to the student's timeline only when there is a student: a
        // timeline entry needs an entity to hang from, and inventing one would
        // put this on the wrong person's record.
        if (conversation.studentId) {
          await tx.timelineEntry.create({
            data: {
              entityType: 'STUDENT',
              entityId: conversation.studentId,
              action: 'REVIEW_DISMISSED',
              description: `Review entry for ${label} dismissed as not a duplicate: ${validation.note}`,
              userId: user.id,
            },
          });
        }
      });
      await audit('REVIEW_RESOLVE', {
        userId: user.id,
        resource: `Conversation:${id}`,
        metadata: { action: 'DISMISS', note: validation.note, studentId: conversation.studentId },
        ipAddress: getClientIp(req),
      });
      return ok({ action: 'DISMISS', summary: describeResolution({ action: 'DISMISS', note: validation.note }, { label }) });
    }

    // LINK_STUDENT
    const student = await db.student.findUnique({
      where: { id: validation.studentId! },
      select: { id: true, name: true, studentCode: true, deletedAt: true },
    });
    if (!student || student.deletedAt) return notFound('That student does not exist.');

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.conversation.update({
        where: { id },
        data: { studentId: student.id, needsReview: false, reviewReason: `Linked to ${student.studentCode ?? student.id} by a human.` },
      });

      // Messages that arrived with no owner move with the conversation.
      // Message.studentId is nullable, so the filter is a plain null check.
      const messages = await tx.message.updateMany({
        where: { conversationId: id, studentId: null },
        data: { studentId: student.id },
      });
      // Documents were never stored against a guessed student, so this is the
      // point at which an orphaned file finds its student. Document.studentId
      // is NOT NULL in the schema and the ingest pipeline refuses to store an
      // attachment until a student is matched (NO_STUDENT), so there are
      // normally no ownerless rows; the filter below is defensive so that a
      // future ingest path that stores first cannot silently orphan a file.
      const orphanedDocuments = await tx.document.findMany({
        where: { conversationId: id },
        select: { id: true, studentId: true },
      });
      const documents = await tx.document.updateMany({
        where: {
          id: { in: orphanedDocuments.filter((document) => !document.studentId).map((document) => document.id) },
        },
        data: { studentId: student.id },
      });

      // The flagged record created for an ambiguous sender is closed as a
      // duplicate only if it holds nothing: no messages, no documents. Otherwise
      // it is left alone and a human decides, because erasing a record that has
      // content is how someone's file disappears.
      let closedDuplicate: string | null = null;
      if (conversation.studentId && conversation.studentId !== student.id) {
        const [messageCount, documentCount] = await Promise.all([
          tx.message.count({ where: { studentId: conversation.studentId } }),
          tx.document.count({ where: { studentId: conversation.studentId } }),
        ]);
        if (messageCount === 0 && documentCount === 0) {
          await tx.student.update({ where: { id: conversation.studentId }, data: { needsReview: false } }).catch(() => undefined);
          closedDuplicate = conversation.studentId;
        }
      }

      return { conversation: updated, messages: messages.count, documents: documents.count, closedDuplicate };
    });

    await audit('REVIEW_RESOLVE', {
      userId: user.id,
      resource: `Conversation:${id}`,
      metadata: {
        action: 'LINK_STUDENT',
        studentId: student.id,
        messagesMoved: result.messages,
        documentsMoved: result.documents,
        note: validation.note,
      },
      ipAddress: getClientIp(req),
    });

    return ok({
      action: 'LINK_STUDENT',
      student: { id: student.id, name: student.name, studentCode: student.studentCode },
      messagesMoved: result.messages,
      documentsMoved: result.documents,
      summary: describeResolution({ action: 'LINK_STUDENT', note: validation.note }, { label }),
    });
  });
}
