/**
 * src/lib/certificate/CertificateGenerator.ts
 *
 * The formal certificate system for the ALO Education English Test Platform.
 *
 * Every submitted attempt — passed or not — receives a verifiable completion
 * certificate. This module is the single owner of:
 *
 *   1. Certificate number allocation (ALO-CERT-YYYY-NNNNNN, transactional)
 *   2. PDF generation (pdfkit, pure JS, no external renderer required)
 *   3. PDF persistence on disk (under the platform data root)
 *   4. Certificate row persistence (Prisma)
 *   5. Lookup helpers used by the API routes and the public /certificate/[id] page
 *
 * Design notes
 * ────────────
 *  - The PDF is the source of truth for what the student sees. The DB row
 *    stores the verifiable number and the score snapshot, and points at the
 *    file path under the data root.
 *  - The certificate number is allocated inside a Prisma transaction with an
 *    atomic `updateMany` guard, the same pattern used by the attempt
 *    double-submit guard. Two concurrent submissions can never receive the
 *    same number.
 *  - The PDF layout is drawn entirely with pdfkit vector primitives — no
 *    external image assets are required, so generation never breaks because a
 *    file moved. The ALO mark is drawn, not embedded.
 *  - The "score" shown is the practice indicator from the attempt's Score row.
 *    It carries the same practice-only disclaimer as the rest of the platform.
 */

import { db } from "@/lib/db";
import { getDataRoot, ensureDir, resolveDataPath } from "@/lib/paths";
import { join, resolve as resolvePath, relative as relativePath } from "node:path";
import { existsSync, createReadStream, statSync } from "node:fs";
import { mkdir, writeFile as writeFileFs } from "node:fs/promises";
import PDFDocument from "pdfkit";
import type { Readable } from "node:stream";

// ─── Public types ────────────────────────────────────────────────────────

export type CertificateInput = {
  attemptId: string;
};

export type IssuedCertificate = {
  id: string;
  certificateNumber: string;
  userId: string;
  attemptId: string;
  examTypeCode: string;
  examTypeName: string;
  studentName: string;
  studentEmail: string;
  overallScore: number | null;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  filePath: string | null;
  issuedAt: Date;
  verificationUrl: string;
};

export type CertificateView = IssuedCertificate & {
  interestedInCounseling: boolean;
  interestedLeadId: string | null;
  interestedAt: Date | null;
  emailedAt: Date | null;
};

// ─── Certificate number allocation ───────────────────────────────────────

const CERT_PREFIX = "ALO-CERT";

/** Format a (year, sequence) pair into the human-readable certificate number. */
export function formatCertificateNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error(`Certificate year must be a four-digit year, received ${year}.`);
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999999) {
    throw new Error(`Certificate sequence must be between 1 and 999999, received ${sequence}.`);
  }
  return `${CERT_PREFIX}-${year}-${String(sequence).padStart(6, "0")}`;
}

/** Parse a certificate number. Returns null when it is not well formed. */
export function parseCertificateNumber(input: string): { year: number; sequence: number } | null {
  const match = /^ALO-CERT-(\d{4})-(\d{6})$/.exec(input.trim().toUpperCase());
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

export function isValidCertificateNumber(input: string | null | undefined): boolean {
  return typeof input === "string" && parseCertificateNumber(input) !== null;
}

function academicYear(now: Date = new Date()): number {
  return now.getUTCFullYear();
}

/**
 * Allocate the next certificate number for the current year.
 *
 * Uses an atomic `updateMany` with a conditional WHERE on the existing
 * lastValue, the same double-allocation guard the attempt submit flow uses to
 * prevent double submission. Two concurrent allocations can never observe the
 * same lastValue.
 */
export async function allocateCertificateNumber(now: Date = new Date()): Promise<string> {
  const year = academicYear(now);

  // Ensure the year row exists. upsert is safe but not atomic against a
  // concurrent first-allocation, so the actual increment is the guard below.
  await db.certificateSequence.upsert({
    where: { year },
    create: { year, lastValue: 0 },
    update: {},
  });

  // Read the current value, then claim the next one with a conditional update.
  // A retry loop handles the rare race where two allocations both read the same
  // value: the second's updateMany will affect 0 rows and it retries.
  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await db.certificateSequence.findUnique({ where: { year } });
    const currentValue = row?.lastValue ?? 0;
    const nextValue = currentValue + 1;
    if (nextValue > 999999) {
      throw new Error("Certificate sequence overflow for the current year.");
    }
    const claimed = await db.certificateSequence.updateMany({
      where: { year, lastValue: currentValue },
      data: { lastValue: nextValue },
    });
    if (claimed.count === 1) {
      return formatCertificateNumber(year, nextValue);
    }
    // Lost the race — back off briefly and retry.
    await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)));
  }
  throw new Error("Could not allocate a certificate number after repeated retries.");
}

// ─── PDF generation ──────────────────────────────────────────────────────

const NAVY: [number, number, number] = [0x0b, 0x1f, 0x3a];
const BLUE: [number, number, number] = [0x00, 0x57, 0xb8];
const ORANGE: [number, number, number] = [0xe8, 0x50, 0x1a];
const GREY: [number, number, number] = [0x4b, 0x55, 0x63];
const LIGHT: [number, number, number] = [0xf1, 0xf5, 0xf9];

export type PdfInput = {
  studentName: string;
  examTypeName: string;
  certificateNumber: string;
  overallScore: number | null;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  issuedAt: Date;
  verificationUrl: string;
};

/**
 * Build the certificate PDF and return it as a Buffer.
 *
 * The layout is US Letter portrait (612×792). Everything is drawn with pdfkit
 * vector primitives and fonts, so generation never depends on a filesystem
 * asset being present.
 */
export async function generateCertificatePdf(input: PdfInput): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
    info: {
      Title: `ALO Education Certificate — ${input.certificateNumber}`,
      Author: "ALO Education",
      Subject: `${input.examTypeName} — Certificate of Completion`,
      Keywords: "ALO Education, English practice, certificate",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // ── Outer frame: double border in navy + orange ─────────────────────────
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const margin = 40;

  doc
    .rect(margin, margin, pageW - margin * 2, pageH - margin * 2)
    .lineWidth(3)
    .strokeColor(NAVY)
    .stroke();
  doc
    .rect(margin + 6, margin + 6, pageW - (margin + 6) * 2, pageH - (margin + 6) * 2)
    .lineWidth(0.7)
    .strokeColor(ORANGE)
    .stroke();

  // ── Brand mark: drawn ALO monogram + wordmark ───────────────────────────
  drawAloMark(doc, pageW / 2, 120, 22);
  doc
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("ALO EDUCATION", pageW / 2, 158, { align: "center" });
  doc
    .fillColor(GREY)
    .font("Helvetica")
    .fontSize(9)
    .text("YOUR DREAM — OUR COMMITMENT", pageW / 2, 182, { align: "center" });

  // ── Title ───────────────────────────────────────────────────────────────
  doc
    .fillColor(ORANGE)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text("Certificate of Completion", pageW / 2, 230, { align: "center" });

  // Thin orange divider under the title.
  doc
    .moveTo(pageW / 2 - 120, 268)
    .lineTo(pageW / 2 + 120, 268)
    .lineWidth(1.5)
    .strokeColor(ORANGE)
    .stroke();

  // ── Recipient ───────────────────────────────────────────────────────────
  doc
    .fillColor(GREY)
    .font("Helvetica")
    .fontSize(12)
    .text("This certificate is proudly presented to", pageW / 2, 296, { align: "center" });

  const safeName = (input.studentName || "Student").trim();
  doc
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text(safeName, pageW / 2, 322, { align: "center" });

  // ── Body copy ───────────────────────────────────────────────────────────
  doc
    .fillColor(GREY)
    .font("Helvetica")
    .fontSize(12)
    .text("for successfully completing the", pageW / 2, 368, { align: "center" });

  doc
    .fillColor(BLUE)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(input.examTypeName, pageW / 2, 390, { align: "center" });

  doc
    .fillColor(GREY)
    .font("Helvetica")
    .fontSize(11)
    .text("practice assessment on the ALO Education English Test Platform.", pageW / 2, 418, {
      align: "center",
    });

  // ── Score panel ─────────────────────────────────────────────────────────
  drawScorePanel(doc, pageW / 2, 460, input);

  // ── Date + signature row ────────────────────────────────────────────────
  const issuedDateStr = formatDateLong(input.issuedAt);
  doc
    .fillColor(GREY)
    .font("Helvetica")
    .fontSize(10)
    .text("Date Issued", 110, 600, { align: "left", width: 200 });
  doc
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(issuedDateStr, 110, 614, { align: "left", width: 200 });
  doc
    .moveTo(110, 636)
    .lineTo(280, 636)
    .lineWidth(0.8)
    .strokeColor(GREY)
    .stroke();

  doc
    .fillColor(GREY)
    .font("Helvetica")
    .fontSize(10)
    .text("Authorised by", pageW - 110 - 200, 600, { align: "right", width: 200 });
  doc
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("ALO Education Faculty", pageW - 110 - 200, 614, { align: "right", width: 200 });
  doc
    .moveTo(pageW - 280, 636)
    .lineTo(pageW - 110, 636)
    .lineWidth(0.8)
    .strokeColor(GREY)
    .stroke();

  // ── Verification block ──────────────────────────────────────────────────
  doc
    .fillColor(LIGHT)
    .rect(110, 670, pageW - 220, 56)
    .fill();
  doc
    .strokeColor(BLUE)
    .lineWidth(0.8)
    .rect(110, 670, pageW - 220, 56)
    .stroke();
  doc
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Certificate Number", pageW / 2, 680, { align: "center" });
  doc
    .fillColor(BLUE)
    .font("Courier-Bold")
    .fontSize(14)
    .text(input.certificateNumber, pageW / 2, 696, { align: "center" });
  doc
    .fillColor(GREY)
    .font("Helvetica")
    .fontSize(8)
    .text(`Verify online: ${input.verificationUrl}`, pageW / 2, 714, { align: "center" });

  // ── Footer disclaimer ───────────────────────────────────────────────────
  doc
    .fillColor(GREY)
    .font("Helvetica-Oblique")
    .fontSize(7)
    .text(
      "This certificate confirms participation in an original exam-aligned practice assessment. " +
        "Scores shown are practice indicators derived from objective answer accuracy, not official exam scores or publisher-equivalent results. " +
        "Writing and speaking assessments are qualitative practice feedback and are not calibrated against human raters.",
      110,
      pageH - margin - 16,
      { align: "center", width: pageW - 220 },
    );

  doc.end();

  // Wait for the document to flush. pdfkit emits 'end' after the last chunk.
  await new Promise<void>((resolve) => doc.on("end", () => resolve()));
  return Buffer.concat(chunks);
}

/** Draw the ALO monogram: navy disc + orange graduation-cap silhouette. */
function drawAloMark(doc: PDFKit.PDFDocument, cx: number, cy: number, r: number): void {
  doc
    .circle(cx, cy, r)
    .fillColor(NAVY)
    .fill();
  // Mortar board: orange square rotated ~45° (drawn as a diamond).
  const s = r * 0.85;
  doc
    .moveTo(cx - s, cy)
    .lineTo(cx, cy - s * 0.7)
    .lineTo(cx + s, cy)
    .lineTo(cx, cy + s * 0.7)
    .closePath()
    .fillColor(ORANGE)
    .fill();
  // Tassel accent.
  doc
    .moveTo(cx + s, cy)
    .lineTo(cx + s + r * 0.4, cy + r * 0.4)
    .lineWidth(1.5)
    .strokeColor(ORANGE)
    .stroke();
}

/** Draw the score panel: an Overall block + four skill blocks. */
function drawScorePanel(
  doc: PDFKit.PDFDocument,
  cx: number,
  topY: number,
  input: PdfInput,
): void {
  const blockW = 92;
  const blockH = 64;
  const gap = 10;
  const overallW = blockW * 1.4;
  const totalW = overallW + blockW * 4 + gap * 4;
  let x = cx - totalW / 2;

  // Overall block (navy fill, white text).
  drawScoreBlock(doc, x, topY, overallW, blockH, "OVERALL", formatScore(input.overallScore), NAVY, true);
  x += overallW + gap;

  drawScoreBlock(doc, x, topY, blockW, blockH, "LISTENING", formatScore(input.listeningScore), BLUE, false);
  x += blockW + gap;
  drawScoreBlock(doc, x, topY, blockW, blockH, "READING", formatScore(input.readingScore), BLUE, false);
  x += blockW + gap;
  drawScoreBlock(doc, x, topY, blockW, blockH, "WRITING", formatScore(input.writingScore), BLUE, false);
  x += blockW + gap;
  drawScoreBlock(doc, x, topY, blockW, blockH, "SPEAKING", formatScore(input.speakingScore), BLUE, false);
}

function drawScoreBlock(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  color: [number, number, number],
  filled: boolean,
): void {
  if (filled) {
    doc.rect(x, y, w, h).fillColor(color).fill();
  } else {
    doc
      .rect(x, y, w, h)
      .lineWidth(1)
      .strokeColor(color)
      .stroke();
  }
  const textColor: [number, number, number] = filled ? [255, 255, 255] : GREY;
  doc
    .fillColor(textColor)
    .font("Helvetica")
    .fontSize(8)
    .text(label, x, y + 10, { align: "center", width: w });
  const valueColor: [number, number, number] = filled ? [255, 255, 255] : color;
  doc
    .fillColor(valueColor)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(value, x, y + 24, { align: "center", width: w });
}

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return (Math.round(value * 10) / 10).toFixed(1);
}

function formatDateLong(date: Date): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const d = new Date(date);
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// ─── Persistence ─────────────────────────────────────────────────────────

/** Directory where certificate PDFs live, under the platform data root. */
export function getCertificateStorageDir(): string {
  const dir = join(getDataRoot(), "storage", "certificates");
  ensureDir(dir);
  return dir;
}

/** Build the public verification URL for a certificate. */
function buildVerificationUrl(certificateNumber: string): string {
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const path = `/certificate/${certificateNumber}`;
  if (base) {
    return base.replace(/\/+$/, "") + path;
  }
  return path;
}

export type IssueOptions = {
  /** Skip sending the email (used by the submit flow when email is handled separately). */
  skipEmail?: boolean;
};

type AttemptForIssue = {
  id: string;
  user: { id: string; email: string; name: string | null } | null;
  practiceSet: { examType: { code: string; name: string } };
  score: {
    overall: number | null;
    listening: number | null;
    reading: number | null;
    writing: number | null;
    speaking: number | null;
  } | null;
  certificate: CertificateRow | null;
};

type CertificateRow = {
  id: string;
  certificateNumber: string;
  userId: string;
  attemptId: string;
  examTypeCode: string;
  examTypeName: string;
  overallScore: number | null;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  filePath: string | null;
  issuedAt: Date;
  interestedInCounseling: boolean;
  interestedLeadId: string | null;
  interestedAt: Date | null;
  emailedAt: Date | null;
};

/**
 * Issue (or return the existing) certificate for an attempt.
 *
 * This is the main entry point. It is idempotent on the attempt: if a
 * Certificate row already exists for this attemptId, it is returned unchanged
 * — the PDF is regenerated only if the file is missing on disk.
 */
export async function issueCertificateForAttempt(
  attemptId: string,
  _opts: IssueOptions = {},
): Promise<IssuedCertificate> {
  const attempt = (await db.attempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { id: true, email: true, name: true } },
      practiceSet: { select: { examType: { select: { code: true, name: true } } } },
      score: { select: { overall: true, listening: true, reading: true, writing: true, speaking: true } },
      certificate: true,
    },
  })) as AttemptForIssue | null;

  if (!attempt) throw new Error("Attempt not found");
  if (!attempt.user) throw new Error("Attempt has no user");

  const existing = attempt.certificate;
  if (existing) {
    // Regenerate the file only if it is missing.
    const filePath = existing.filePath ?? null;
    if (filePath) {
      const abs = resolveDataPath(filePath);
      if (!existsSync(abs)) {
        await regeneratePdfAndOverwrite(existing, attempt);
      }
    } else {
      await regeneratePdfAndOverwrite(existing, attempt);
    }
    return toIssuedCertificate(existing, attempt.user);
  }

  // Allocate the certificate number transactionally.
  const certificateNumber = await allocateCertificateNumber(new Date());

  const overallScore = attempt.score?.overall ?? null;
  const listeningScore = attempt.score?.listening ?? null;
  const readingScore = attempt.score?.reading ?? null;
  const writingScore = attempt.score?.writing ?? null;
  const speakingScore = attempt.score?.speaking ?? null;
  const examTypeCode = attempt.practiceSet.examType.code;
  const examTypeName = attempt.practiceSet.examType.name;
  const issuedAt = new Date();

  const verificationUrl = buildVerificationUrl(certificateNumber);

  // Generate the PDF first so the row only persists once the file is on disk.
  const pdfInput: PdfInput = {
    studentName: attempt.user.name || attempt.user.email,
    examTypeName,
    certificateNumber,
    overallScore,
    listeningScore,
    readingScore,
    writingScore,
    speakingScore,
    issuedAt,
    verificationUrl,
  };
  const pdfBuffer = await generateCertificatePdf(pdfInput);

  const storageDir = getCertificateStorageDir();
  const fileName = `${certificateNumber}.pdf`;
  const absPath = join(storageDir, fileName);
  await writeFile(absPath, pdfBuffer);
  // Relative path stored in the DB so it survives a redeploy / data-root move.
  const relPath = relativePathFrom(absPath);

  const row = (await db.certificate.create({
    data: {
      certificateNumber,
      userId: attempt.user.id,
      attemptId: attempt.id,
      examTypeCode,
      examTypeName,
      overallScore,
      listeningScore,
      readingScore,
      writingScore,
      speakingScore,
      filePath: relPath,
      issuedAt,
    },
  })) as CertificateRow;

  return toIssuedCertificate(row, attempt.user);
}

/** Regenerate the PDF for an existing certificate row and overwrite the file. */
async function regeneratePdfAndOverwrite(
  row: { certificateNumber: string; filePath: string | null },
  attempt: AttemptForIssue,
): Promise<void> {
  if (!attempt.user) return;
  const pdfInput: PdfInput = {
    studentName: attempt.user.name || attempt.user.email,
    examTypeName: attempt.practiceSet.examType.name,
    certificateNumber: row.certificateNumber,
    overallScore: attempt.score?.overall ?? null,
    listeningScore: attempt.score?.listening ?? null,
    readingScore: attempt.score?.reading ?? null,
    writingScore: attempt.score?.writing ?? null,
    speakingScore: attempt.score?.speaking ?? null,
    issuedAt: new Date(),
    verificationUrl: buildVerificationUrl(row.certificateNumber),
  };
  const pdfBuffer = await generateCertificatePdf(pdfInput);
  const storageDir = getCertificateStorageDir();
  const fileName = `${row.certificateNumber}.pdf`;
  const absPath = join(storageDir, fileName);
  await writeFile(absPath, pdfBuffer);
}

// ─── Lookup helpers ──────────────────────────────────────────────────────

type CertificateWithUser = CertificateRow & {
  user: { id: string; email: string; name: string | null } | null;
};

/** Resolve a certificate by its internal id (cuid). */
export async function findCertificateById(id: string): Promise<CertificateView | null> {
  const row = (await db.certificate.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true } } },
  })) as CertificateWithUser | null;
  if (!row) return null;
  return toCertificateView(row);
}

/** Resolve a certificate by its public certificate number (ALO-CERT-YYYY-NNNNNN). */
export async function findCertificateByNumber(number: string): Promise<CertificateView | null> {
  const parsed = parseCertificateNumber(number);
  if (!parsed) return null;
  const normalized = number.trim().toUpperCase();
  const row = (await db.certificate.findUnique({
    where: { certificateNumber: normalized },
    include: { user: { select: { id: true, email: true, name: true } } },
  })) as CertificateWithUser | null;
  if (!row) return null;
  return toCertificateView(row);
}

/** Public list for the signed-in student. */
export async function listCertificatesForUser(userId: string): Promise<CertificateView[]> {
  const rows = (await db.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    include: { user: { select: { id: true, email: true, name: true } } },
  })) as CertificateWithUser[];
  return rows.map(toCertificateView);
}

// ─── File access ─────────────────────────────────────────────────────────

/** Absolute path on disk for a certificate PDF (resolved from the stored relative path). */
export function resolveStoragePath(storedPath: string): string {
  return resolveDataPath(storedPath);
}

/** Stream a certificate PDF from disk. Returns null when the file is missing. */
export async function streamCertificatePdf(
  certificate: { filePath: string | null; certificateNumber: string },
): Promise<{ stream: Readable; size: number; fileName: string } | null> {
  if (!certificate.filePath) return null;
  const abs = resolveDataPath(certificate.filePath);
  if (!existsSync(abs)) return null;
  const stat = statSync(abs);
  return {
    stream: createReadStream(abs),
    size: stat.size,
    fileName: `${certificate.certificateNumber}.pdf`,
  };
}

// ─── Internals ───────────────────────────────────────────────────────────

async function writeFile(absPath: string, buffer: Buffer): Promise<void> {
  await mkdir(resolvePath(absPath, ".."), { recursive: true });
  await writeFileFs(absPath, buffer);
}

/** Relative path from the data root, used as the portable stored value. */
function relativePathFrom(absPath: string): string {
  const root = getDataRoot();
  const rel = relativePath(root, absPath);
  // Always store with forward slashes so the value is portable across OSes.
  return rel.split("\\").join("/");
}

function toIssuedCertificate(
  row: CertificateRow,
  user: { id: string; email: string; name: string | null },
): IssuedCertificate {
  return {
    id: row.id,
    certificateNumber: row.certificateNumber,
    userId: row.userId,
    attemptId: row.attemptId,
    examTypeCode: row.examTypeCode,
    examTypeName: row.examTypeName,
    studentName: user.name || user.email,
    studentEmail: user.email,
    overallScore: row.overallScore,
    listeningScore: row.listeningScore,
    readingScore: row.readingScore,
    writingScore: row.writingScore,
    speakingScore: row.speakingScore,
    filePath: row.filePath,
    issuedAt: row.issuedAt,
    verificationUrl: buildVerificationUrl(row.certificateNumber),
  };
}

function toCertificateView(row: CertificateWithUser): CertificateView {
  const user = row.user ?? { id: row.userId, email: "", name: null };
  const issued = toIssuedCertificate(row, user);
  return {
    ...issued,
    interestedInCounseling: Boolean(row.interestedInCounseling),
    interestedLeadId: row.interestedLeadId ?? null,
    interestedAt: row.interestedAt ?? null,
    emailedAt: row.emailedAt ?? null,
  };
}
