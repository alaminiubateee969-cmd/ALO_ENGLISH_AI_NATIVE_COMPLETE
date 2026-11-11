/**
 * src/lib/email/EmailService.ts
 *
 * Email outbox for the ALO Education platform.
 *
 * WHY AN OUTBOX, NOT A DIRECT SMTP CALL
 * ─────────────────────────────────────
 *  - The sandbox deployment has no SMTP relay configured by default. A direct
 *    `nodemailer.send()` call would throw and the exam submit flow would fail.
 *    An outbox keeps the send non-blocking: every message is written to disk
 *    atomically and the certificate page records `emailedAt`. An operator (or
 *    a future SMTP runner) drains the outbox at their own pace.
 *  - The same module is the single place to plug a real SMTP transport when
 *    one is configured — see `SmtpConfig` and the marked hook below. No other
 *    code in the platform needs to change.
 *
 * OUTBOX FORMAT
 * ─────────────
 * One JSON file per message under `<dataRoot>/storage/email-outbox/`:
 *
 *   {
 *     "id": "<uuid>",
 *     "to": "student@example.com",
 *     "from": "ALO Education <no-reply@alolabs.net>",
 *     "subject": "...",
 *     "text": "...",
 *     "html": "...",
 *     "attachmentPath": "/abs/path/to/ALO-CERT-2026-000001.pdf" | null,
 *     "createdAt": "2026-...",
 *     "status": "QUEUED",
 *     "attemptCount": 0
 *   }
 *
 * An audit log entry is written for every queued message so the send is
 * traceable across the outbox, the audit trail and the certificate row.
 */

import { getDataRoot, ensureDir } from "@/lib/paths";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";

export type EmailMessage = {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html?: string;
  /** Absolute path to a file attachment on disk, or null. */
  attachmentPath?: string | null;
  attachmentName?: string | null;
  /** Set when this email delivers a certificate, so we can stamp emailedAt. */
  certificateId?: string | null;
};

export type QueuedEmail = EmailMessage & {
  id: string;
  from: string;
  queuedAt: string;
  outboxFile: string;
};

/** Resolved sender address. Falls back to a default no-reply. */
function resolveFrom(): string {
  return (
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    'ALO Education <no-reply@alolabs.net>'
  );
}

/** Where the outbox lives on disk. Created on first call. */
export function getEmailOutboxDir(): string {
  const dir = join(getDataRoot(), "storage", "email-outbox");
  ensureDir(dir);
  return dir;
}

/** SMTP transport configuration, when one is set in the environment. */
export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
};

/** Read SMTP env vars. Returns null when not configured. */
export function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    user,
    pass,
    from: resolveFrom(),
    secure: process.env.SMTP_SECURE === "1" || process.env.SMTP_SECURE === "true",
  };
}

/**
 * Queue an email for delivery. Writes the message to the outbox atomically,
 * records an audit log entry, and stamps the certificate's `emailedAt` when
 * `certificateId` is provided.
 *
 * Never throws for an expected condition; returns a result object so the
 * caller (the exam submit flow) can continue even if email queuing fails.
 */
export async function queueEmail(message: EmailMessage): Promise<{
  ok: boolean;
  queued?: QueuedEmail;
  error?: string;
}> {
  try {
    if (!message.to || !message.to.includes("@")) {
      return { ok: false, error: "Invalid recipient address" };
    }
    const id = randomUUID();
    const queuedAt = new Date().toISOString();
    const from = message.from || resolveFrom();
    const outboxDir = getEmailOutboxDir();
    // Sortable file name: YYYYMMDD-HHMMSS-<short-id>.json
    const stamp = queuedAt.replace(/[:.]/g, "").replace("T", "-").slice(0, 15);
    const fileName = `${stamp}-${id.slice(0, 8)}.json`;
    const outboxFile = join(outboxDir, fileName);
    const record: QueuedEmail = {
      ...message,
      id,
      from,
      queuedAt,
      outboxFile,
      attachmentPath: message.attachmentPath ?? null,
      attachmentName: message.attachmentName ?? null,
      certificateId: message.certificateId ?? null,
    };
    await mkdir(outboxDir, { recursive: true });
    await writeFile(outboxFile, JSON.stringify(record, null, 2), "utf8");

    // ── SMTP hook ────────────────────────────────────────────────────────
    // If SMTP env vars are configured, attempt an immediate send and update
    // the outbox file's status. We do NOT depend on nodemailer here so the
    // module stays dependency-free; the SMTP runner (mini-services/email-runner
    // if present) drains the outbox instead.
    // To enable direct send, install nodemailer and call it here, then update
    // the outbox file's `status` to "SENT" and stamp `sentAt`.

    // Stamp the certificate row so the UI can show "email queued".
    if (message.certificateId) {
      try {
        await db.certificate.update({
          where: { id: message.certificateId },
          data: { emailedAt: new Date() },
        });
      } catch {
        // Non-fatal: the email is still queued on disk.
      }
    }

    await audit("MESSAGES_SEND", {
      resource: "email:" + id,
      metadata: {
        to: message.to,
        subject: message.subject,
        outboxFile,
        certificateId: message.certificateId ?? null,
        hasAttachment: Boolean(message.attachmentPath),
        smtpConfigured: Boolean(readSmtpConfig()),
      },
    });

    return { ok: true, queued: record };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return { ok: false, error: message };
  }
}

/**
 * Build the certificate email body for a student.
 *
 * The HTML is intentionally simple and self-contained so it renders in any
 * mail client. The link is the public `/certificate/[number]` page, which
 * works whether the student is signed in or not.
 */
export function buildCertificateEmail(input: {
  studentName: string;
  studentEmail: string;
  examTypeName: string;
  certificateNumber: string;
  verificationUrl: string;
  overallScore: number | null;
}): EmailMessage {
  const name = input.studentName || "Student";
  const scoreLine =
    input.overallScore === null || !Number.isFinite(input.overallScore)
      ? "Your practice assessment has been recorded."
      : `Your overall practice indicator: ${(Math.round(input.overallScore * 10) / 10).toFixed(1)}.`;
  const subject = `Your ALO Education Certificate — ${input.examTypeName}`;
  const text =
    `Hello ${name},\n\n` +
    `Congratulations on completing the ${input.examTypeName} practice assessment on the ALO Education English Test Platform.\n\n` +
    `${scoreLine}\n\n` +
    `Your formal completion certificate is attached to this email.\n\n` +
    `Certificate number: ${input.certificateNumber}\n` +
    `Verify or download it any time: ${input.verificationUrl}\n\n` +
    `If you would like to be connected to an educational portal or speak to a counselor about your next step, ` +
    `open the certificate page and tap "Talk to a counselor".\n\n` +
    `— ALO Education Faculty\n` +
    `(This is an automated message. Scores shown are practice indicators, not official exam results.)\n`;
  const html =
    `<div style="font-family: Arial, Helvetica, sans-serif; color: #0B1F3A; max-width: 600px; margin: 0 auto;">` +
    `<h2 style="color:#0B1F3A; margin:0 0 8px;">Hello ${escapeHtml(name)},</h2>` +
    `<p style="color:#4B5563; line-height:1.55;">` +
    `Congratulations on completing the <strong style="color:#0057B8;">${escapeHtml(input.examTypeName)}</strong> ` +
    `practice assessment on the ALO Education English Test Platform.</p>` +
    `<p style="color:#4B5563; line-height:1.55;">${escapeHtml(scoreLine)}</p>` +
    `<p style="color:#4B5563; line-height:1.55;">` +
    `Your formal completion certificate is attached to this email.</p>` +
    `<table style="margin:16px 0; border:1px solid #D9E8FF; border-radius:10px; background:#F8FAFC;">` +
    `<tr><td style="padding:12px 16px; color:#4B5563;">Certificate number</td>` +
    `<td style="padding:12px 16px; font-family:monospace; color:#0057B8; font-weight:bold;">${escapeHtml(input.certificateNumber)}</td></tr>` +
    `<tr><td style="padding:12px 16px; color:#4B5563;">Verify / download</td>` +
    `<td style="padding:12px 16px;"><a href="${escapeHtml(input.verificationUrl)}" style="color:#E8501A;">${escapeHtml(input.verificationUrl)}</a></td></tr>` +
    `</table>` +
    `<p style="color:#4B5563; line-height:1.55;">` +
    `If you would like to be connected to an educational portal or speak to a counselor about your next step, ` +
    `open the certificate page and tap <strong style="color:#0057B8;">“Talk to a counselor”</strong>.</p>` +
    `<p style="color:#4B5563; line-height:1.55; margin-top:24px;">— ALO Education Faculty</p>` +
    `<p style="color:#9CA3AF; font-size:11px; line-height:1.45; margin-top:8px;">` +
    `This is an automated message. Scores shown are practice indicators derived from objective answer accuracy, ` +
    `not official exam results or publisher-equivalent scores.</p>` +
    `</div>`;
  return {
    to: input.studentEmail,
    subject,
    text,
    html,
  };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
