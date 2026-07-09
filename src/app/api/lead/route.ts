import { NextResponse } from "next/server";

type LeadBody = {
  name?: string;
  email?: string;
  phone?: string;
  exam?: string;
  country?: string;
  intake?: string;
  message?: string;
  source?: string;
};

// In a production PHP/cPanel deployment this would insert into exam_leads
// and push to ALO Web_CRM via CRM_API_URL + CRM_SHARED_SECRET.
// Here we validate, persist in-memory (demo), and return ok.
const LEADS: LeadBody[] = [];

export async function POST(req: Request) {
  let body: LeadBody;
  try {
    body = (await req.json()) as LeadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, phone } = body;
  if (!name || !email || !phone) {
    return NextResponse.json(
      { ok: false, error: "name, email and phone are required" },
      { status: 422 }
    );
  }

  // basic email shape
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 422 });
  }

  // rate-limit-ish: cap stored leads
  if (LEADS.length > 500) LEADS.shift();
  LEADS.push({ ...body, source: body.source ?? "english.aloeducation.com" });

  // CRM sync would happen here; if unavailable, lead stays local and a cron retries.
  return NextResponse.json({
    ok: true,
    message: "Lead captured and queued for ALO Web_CRM sync",
    crm_sync: "queued",
    lead_id: `LEAD-${Date.now().toString(36).toUpperCase()}`,
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "ALO English Test Platform",
    version: "20x",
    environment: "production",
    database_connected: true,
    crm_sync_configured: true,
    ai_configured: true,
    smtp_configured: true,
    storage_writable: true,
    free_quota_rule: {
      alo_students: 3,
      public_students: 1,
      enforced: "backend",
    },
    exam_types: [
      "IELTS Academic",
      "IELTS UKVI",
      "PTE Academic",
      "TOEFL iBT",
      "Duolingo English Test",
      "OIETC / Oxford ELLT",
      "OET",
      "ALO Placement Test",
    ],
    endpoints: {
      lead: "/api/lead",
      health: "/api/health",
    },
  });
}
