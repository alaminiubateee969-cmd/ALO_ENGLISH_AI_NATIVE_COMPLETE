/**
 * POST /api/crm/review-queue/students/[id] — resolve a flagged student record.
 *
 * Actions:
 *   CONFIRM       this is a distinct person: clear the flag, keep the record
 *   KEEP_PENDING  not now, and here is what it is waiting for
 *
 * WHY THIS IS NOT THE GENERIC STUDENT UPDATE ROUTE
 * ───────────────────────────────────────────────
 * The generic CRUD route updates profile fields and is guarded by the COUNSELOR
 * role. Clearing a review flag is an identity decision — it says "the person who
 * messaged us is not the student whose name merely matched" — and that is
 * guarded by `canResolveReview`, audited as `REVIEW_RESOLVE`, and requires a
 * note. Reusing the profile route would have quietly downgraded a decision about
 * who someone is into an ordinary field edit.
 *
 * This route never merges records. Merging two students is not reversible, and
 * the whole point of the flagged record is that a human, not a heuristic,
 * decides which person is which.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { audit, getClientIp } from '@/lib/audit';
import { badRequest, forbidden, notFound, ok, unauthorized, withErrorHandler } from '@/lib/responses';
import { canResolveReview, type CrmRole } from '@/lib/crm/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resolutionSchema = z.object({
  action: z.enum(['CONFIRM', 'KEEP_PENDING']).default('CONFIRM'),
  note: z.string().min(3).max(1000),
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
    if (!parsed.success) {
      return badRequest('A note is required: confirming or deferring a person needs a reason on the record.');
    }

    const student = await db.student.findUnique({
      where: { id },
      select: { id: true, name: true, studentCode: true, needsReview: true, deletedAt: true },
    });
    if (!student || student.deletedAt) return notFound('Student not found.');

    const target = student.studentCode ?? student.name;

    if (parsed.data.action === 'KEEP_PENDING') {
      // The flag stays set, so the record remains in the queue. What is added is
      // the reason it is still there, on the student's own timeline.
      await db.timelineEntry.create({
        data: {
          entityType: 'STUDENT',
          entityId: id,
          action: 'REVIEW_PENDING',
          description: `Left pending by a human: ${parsed.data.note}`,
          userId: user.id,
        },
      });
      await audit('REVIEW_RESOLVE', {
        userId: user.id,
        resource: `Student:${id}`,
        metadata: { action: 'KEEP_PENDING', note: parsed.data.note },
        ipAddress: getClientIp(req),
      });
      return ok({ action: 'KEEP_PENDING', student: { id, name: student.name, studentCode: student.studentCode }, summary: `${target} left pending.` });
    }

    await db.$transaction(async (tx) => {
      await tx.student.update({ where: { id }, data: { needsReview: false } });
      await tx.timelineEntry.create({
        data: {
          entityType: 'STUDENT',
          entityId: id,
          action: 'REVIEW_CONFIRMED',
          description: `Confirmed as a distinct person by a human: ${parsed.data.note}`,
          userId: user.id,
        },
      });
    });

    await audit('REVIEW_RESOLVE', {
      userId: user.id,
      resource: `Student:${id}`,
      metadata: { action: 'CONFIRM', note: parsed.data.note, studentCode: student.studentCode },
      ipAddress: getClientIp(req),
    });

    return ok({
      action: 'CONFIRM',
      student: { id, name: student.name, studentCode: student.studentCode },
      summary: `${target} confirmed as a distinct person.`,
    });
  });
}
