/**
 * GET /api/crm/review-queue — everything waiting for a human decision, in one
 * read.
 *
 * Three things end up here, and they are deliberately returned together because
 * they are usually about the same person: a conversation the pipeline refused to
 * attach on an ambiguous match, the documents that arrived with it, and the
 * student record created for it. An operator working down this list should not
 * have to open three screens to answer one question.
 *
 * Auth: an authenticated staff member. Reading the queue is broad on purpose —
 * hiding a queue of unanswered students from the people who answer students is
 * how a queue grows. RESOLVING an entry is the narrow permission, enforced by
 * the resolution route and `canResolveReview`.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ok, unauthorized, withErrorHandler } from '@/lib/responses';
import { buildReviewQueue } from '@/lib/crm/review-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The queue is a work list, not an archive. Old items are still listed, but the
 * window cap keeps a decade of history from being shipped to a browser. */
const MAX_ITEMS_PER_KIND = 100;

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const kind = new URL(req.url).searchParams.get('kind');

    const [conversations, documents, students] = await Promise.all([
      kind && kind !== 'CONVERSATION'
        ? Promise.resolve([])
        : db.conversation.findMany({
            // A conversation with no student is the most important kind here, so
            // the filter is written as "unattached, or attached to a live student":
            // a relation filter alone would silently drop every unlinked entry.
            where: { needsReview: true, OR: [{ studentId: null }, { student: { deletedAt: null } }] },
            orderBy: { createdAt: 'asc' },
            take: MAX_ITEMS_PER_KIND,
            select: {
              id: true,
              channel: true,
              externalThreadId: true,
              studentId: true,
              needsReview: true,
              reviewReason: true,
              messageCount: true,
              lastMessageAt: true,
              createdAt: true,
              student: { select: { name: true, studentCode: true } },
              messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true } },
            },
          }),
      kind && kind !== 'DOCUMENT'
        ? Promise.resolve([])
        : db.document.findMany({
            where: { verificationStatus: 'PENDING_REVIEW', deletedAt: null },
            orderBy: { createdAt: 'asc' },
            take: MAX_ITEMS_PER_KIND,
            select: {
              id: true,
              studentId: true,
              type: true,
              fileName: true,
              fileSize: true,
              sourceChannel: true,
              verificationStatus: true,
              createdAt: true,
              student: { select: { name: true, studentCode: true } },
            },
          }),
      kind && kind !== 'STUDENT'
        ? Promise.resolve([])
        : db.student.findMany({
            where: { needsReview: true, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            take: MAX_ITEMS_PER_KIND,
            select: { id: true, studentCode: true, name: true, phone: true, email: true, needsReview: true, createdAt: true },
          }),
    ]);

    const queue = buildReviewQueue({
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        channel: conversation.channel,
        externalThreadId: conversation.externalThreadId,
        studentId: conversation.studentId,
        needsReview: conversation.needsReview,
        reviewReason: conversation.reviewReason,
        messageCount: conversation.messageCount,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
        studentName: conversation.student?.name ?? null,
        studentCode: conversation.student?.studentCode ?? null,
        // Quoted back to the operator so the decision can be made from the queue
        // rather than by opening a conversation in another tab.
        lastMessagePreview: conversation.messages[0]?.body?.slice(0, 240) ?? null,
      })),
      documents: documents.map((document) => ({
        id: document.id,
        studentId: document.studentId,
        type: document.type,
        fileName: document.fileName,
        fileSize: document.fileSize,
        sourceChannel: document.sourceChannel,
        verificationStatus: document.verificationStatus,
        createdAt: document.createdAt,
        studentName: document.student?.name ?? null,
        studentCode: document.student?.studentCode ?? null,
      })),
      students: students.map((student) => ({
        id: student.id,
        studentCode: student.studentCode,
        name: student.name,
        phone: student.phone,
        email: student.email,
        needsReview: student.needsReview,
        createdAt: student.createdAt,
      })),
      now: new Date(),
    });

    return ok(queue);
  });
}
