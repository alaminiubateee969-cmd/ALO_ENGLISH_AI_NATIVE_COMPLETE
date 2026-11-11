/**
 * GET /api/crm/leads/priority — the call list, scored and ranked.
 *
 * Each lead comes back with its score, the contributions that produced it, and
 * the two or three things worth doing next. A counsellor sees their own leads; a
 * branch manager, an admin or a super admin sees all of them, which matches how
 * every other CRM list in this application is scoped.
 *
 * The score is a priority hint, not a prediction. See src/lib/crm/lead-score.ts
 * for why that distinction is enforced in the module rather than in the copy.
 *
 * Auth: COUNSELOR, BRANCH_MANAGER, ADMIN, SUPER_ADMIN.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { badRequest, ok, withErrorHandler } from '@/lib/responses';
import { rankLeads, scoreLead, type LeadBand } from '@/lib/crm/lead-score';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  band: z.enum(['COLD', 'WARM', 'HOT', 'CLOSED']).optional(),
  status: z.string().max(30).optional(),
});

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole('COUNSELOR', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN');

    const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return badRequest('limit must be between 1 and 100 and band must be COLD, WARM, HOT or CLOSED.');
    const limit = parsed.data.limit ?? 25;

    const leads = await db.lead.findMany({
      where: {
        ...(user.role === 'COUNSELOR' ? { counselorId: user.id } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
      },
      select: {
        id: true,
        name: true,
        status: true,
        source: true,
        country: true,
        courseInterest: true,
        intake: true,
        budgetRange: true,
        englishStatus: true,
        email: true,
        phone: true,
        notes: true,
        createdAt: true,
        counselorId: true,
        // Counts, not content: the score reads how much contact there has been,
        // never what was said.
        _count: { select: { messages: true, tasks: true } },
      },
      // Read a window larger than the page: the ranking is computed here, so the
      // database cannot do the ordering for us.
      orderBy: { createdAt: 'desc' },
      take: 250,
    });

    // Consent is a real signal, so it is read rather than assumed. Consents
    // captured before the person had a student record are attached to the lead,
    // which is exactly the case this list is looking at.
    const consents = await db.communicationConsent.findMany({
      where: { capturedLeadId: { in: leads.map((lead) => lead.id) }, status: 'GRANTED' },
      select: { capturedLeadId: true, purpose: true },
    });
    const consentByLead = new Map<string, Set<string>>();
    for (const consent of consents) {
      if (!consent.capturedLeadId) continue;
      const purposes = consentByLead.get(consent.capturedLeadId) ?? new Set<string>();
      purposes.add(consent.purpose);
      consentByLead.set(consent.capturedLeadId, purposes);
    }

    const now = new Date();
    const scored = leads.map((lead) => {
      const purposes = consentByLead.get(lead.id);
      const score = scoreLead(
        lead,
        {
          messageCount: lead._count.messages,
          hasServiceConsent: purposes?.has('SERVICE') ?? false,
          hasMarketingConsent: purposes?.has('MARKETING') ?? false,
        },
        now,
      );
      return { id: lead.id, name: lead.name, status: lead.status, source: lead.source, createdAt: lead.createdAt, ...score };
    });

    const filtered = parsed.data.band ? scored.filter((row) => row.band === (parsed.data.band as LeadBand)) : scored;
    // The generic `rankLeads` only needs the two fields it sorts by; the caller
    // keeps the full row, so the element type is stated rather than widened.
    const ranked: Array<(typeof scored)[number]> = rankLeads(filtered).slice(0, limit);

    return ok({
      leads: ranked,
      considered: leads.length,
      limit,
      disclaimer: ranked[0]?.disclaimer ?? null,
      note: 'Ranked highest score first, then longest waiting. Scores are computed on read, so they cannot go stale in the database.',
    });
  });
}
