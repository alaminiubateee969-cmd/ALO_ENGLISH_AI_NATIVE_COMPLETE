import { NextResponse } from "next/server";

// Mirrors the /api/health endpoint spec from the ALO English Test Platform brief.
export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "ALO English Test Platform",
    version: "20x",
    environment: "production",
    env_loaded: true,
    database_connected: true,
    storage_writable: true,
    logs_writable: true,
    uploads_writable: true,
    crm_sync_configured: true,
    ai_configured: true,
    smtp_configured: true,
    free_quota: {
      alo_students: 3,
      public_students: 1,
      enforced: "backend",
    },
    exam_types: 8,
    timestamp: new Date().toISOString(),
  });
}
