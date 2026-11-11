# TEACHERS-CERTS — AI Teachers + Certificate System

Task ID: TEACHERS-CERTS
Agent: main (Z.ai Code)
Date: 2026-01

## Summary

Expanded the ALO Education English Test Platform's AI examiner faculty from 5
to 10 Bengali practice guides (5 female + 5 male, each with a unique skill
specialization) and built a full formal-certificate system: every submitted
exam now automatically generates a verifiable PDF certificate, emails it to the
student, and lets an interested student request a counselor callback that
creates a CRM lead automatically.

## What changed

### 1. AI examiner faculty (5 → 10, balanced 5F + 5M)
File: `src/lib/agents/AIExaminers.ts` (rewritten, additive)

- Added `specialization` and `gender` fields to the `AIExaminer` type.
- Preserved the original 5 personas and their `evaluationFocus` lists, and
  appended 5 new ones so existing index-based defaults (`AI_EXAMINERS[0]` =
  Anika, `[1]` = Rifat) are unchanged — `ExaminerEngine.ts` and
  `live-exam/page.tsx` keep their behaviour.
- New personas:
  - `examiner-06` Mr. Imran Kabir (M) — Pronunciation awareness & intelligibility practice
  - `examiner-07` Dr. Sumaiya Islam (F) — Academic writing practice
  - `examiner-08` Dr. Saifuddin Mahmud (M) — Spoken fluency & coherence practice
  - `examiner-09` Ms. Ayesha Siddiqua (F) — Grammar & accuracy practice
  - `examiner-10` Mr. Jahangir Alam (M) — Vocabulary & collocation practice
- All 10 have South Asian / Bengali names + appearance descriptions, an
  `avatarUrl` path (`/examiners/examiner-NN.png` — images to be generated
  later), and the existing accent-awareness disclaimer (no acoustic scoring,
  no accent judgment, no score produced).
- Added convenience exports: `FEMALE_EXAMINERS`, `MALE_EXAMINERS`,
  `findExaminer(id)`.
- Updated `GET /api/examiners` to return `specialization`, `gender`,
  `avatarUrl`, plus `femaleCount` / `maleCount` totals.

### 2. Prisma schema (new Certificate + CertificateSequence models)
File: `prisma/schema.prisma`

- `Certificate`: id, certificateNumber (@unique, ALO-CERT-YYYY-NNNNNN),
  userId, attemptId (@unique — 1:1 per attempt), examTypeCode, examTypeName,
  overallScore, listeningScore, readingScore, writingScore, speakingScore,
  interestedInCounseling (boolean), interestedLeadId, interestedAt,
  emailedAt, filePath (relative to data root), issuedAt, createdAt, updatedAt.
  Indexes on userId, attemptId, examTypeCode, certificateNumber.
- `CertificateSequence`: per-year counter for transactional number allocation
  (same lock pattern as `StudentIdSequence`).
- Added reverse relations: `User.certificates Certificate[]`,
  `Attempt.certificate Certificate?` (named `"AttemptCertificate"`).
- `bun run db:push` ran clean; Prisma client regenerated with the new models
  (verified: `db.certificate`, `db.certificateSequence`, `attempt.certificate`,
  `user.certificates` all accessible at runtime).

### 3. Certificate generator
File: `src/lib/certificate/CertificateGenerator.ts` (new, ~600 lines)

- `allocateCertificateNumber()` — transactional ALO-CERT-YYYY-NNNNNN
  allocation using `updateMany` with a conditional WHERE on `lastValue`,
  with retry loop for the rare race.
- `formatCertificateNumber`, `parseCertificateNumber`,
  `isValidCertificateNumber` — format/parse helpers.
- `generateCertificatePdf(input)` — US Letter portrait PDF built entirely
  with pdfkit vector primitives (no external image assets required):
  - Double border frame (navy + orange)
  - Drawn ALO monogram (navy disc + orange graduation-cap diamond + tassel)
  - "ALO EDUCATION / YOUR DREAM — OUR COMMITMENT" wordmark
  - "Certificate of Completion" title with orange divider
  - Student name + exam type name + body copy
  - Score panel: Overall (filled navy block) + Listening / Reading / Writing /
    Speaking (outlined blue blocks), each showing the formatted score or "—"
  - Date issued + "Authorised by ALO Education Faculty" signature lines
  - Verification block with certificate number (monospace) + verification URL
  - Footer disclaimer (practice indicators, not official exam scores)
- `issueCertificateForAttempt(attemptId)` — main entry point. Idempotent on
  the attempt: returns the existing Certificate row if present, regenerates
  the PDF only if the file is missing on disk. Otherwise allocates the number,
  generates the PDF, writes it to `<dataRoot>/storage/certificates/<number>.pdf`,
  persists the Certificate row.
- `findCertificateById(id)`, `findCertificateByNumber(number)` — both return a
  `CertificateView` (the public metadata).
- `listCertificatesForUser(userId)`, `streamCertificatePdf(cert)` — for the
  download endpoint and the student's own list.
- `getCertificateStorageDir()`, `resolveStoragePath()` — file path helpers
  that resolve under the platform data root (survives standalone redeploy).

### 4. Email outbox service
File: `src/lib/email/EmailService.ts` (new, ~260 lines)

- `queueEmail(message)` — atomic file-based outbox under
  `<dataRoot>/storage/email-outbox/<timestamp>-<id>.json`. Each entry records
  `to`, `from`, `subject`, `text`, `html`, `attachmentPath`, `certificateId`,
  `status: "QUEUED"`. Stamps `certificate.emailedAt` and writes a
  `MESSAGES_SEND` audit entry. Never throws — returns `{ok, queued?, error?}`
  so the exam submit flow can continue even if email queuing fails.
- `buildCertificateEmail(input)` — HTML + plain-text body for the certificate
  email, with the verification URL and a "Talk to a counselor" prompt.
- `readSmtpConfig()` — reads `SMTP_HOST/USER/PASS/PORT/SECURE/FROM` env vars.
  Returns null when not configured. The module is the single SMTP hook point:
  install `nodemailer` and call it inside `queueEmail` to switch from outbox
  to direct send. No other code needs to change.

### 5. API routes (all new)

- `POST /api/certificate/generate` (`src/app/api/certificate/generate/route.ts`)
  - Auth: signed-in user. Body: `{ attemptId }`.
  - Validates ownership + that the attempt is SUBMITTED/SCORED.
  - Calls `issueCertificateForAttempt`, queues the email, returns the
    certificate metadata + email queue status.
  - Idempotent: a second call for the same attempt returns the same row.

- `GET /api/certificate/[id]` (`src/app/api/certificate/[id]/route.ts`)
  - Two modes: default returns JSON metadata; `?format=pdf` streams the PDF
    via a `ReadableStream` body with `Content-Type: application/pdf` and
    `Content-Disposition: inline`.
  - `[id]` accepts either the internal cuid or the public certificate number
    (ALO-CERT-YYYY-NNNNNN) — so the same URL works for the API and for the
    public `/certificate/[id]` page.
  - Public (the cuid is unguessable and the certificate number is what is
    printed on the PDF).

- `POST /api/certificate/[id]/express-interest`
  (`src/app/api/certificate/[id]/express-interest/route.ts`)
  - Auth: signed-in user. The certificate must belong to the caller.
  - Body: optional `{ note?, preferredDestination? }`.
  - Idempotent: returns 409 if `interestedInCounseling` is already true.
  - Creates a CRM `Lead` automatically with `source=WEBSITE`,
    `courseInterest=<examTypeName>`, `englishStatus=<score line>`, and a
    notes string that includes the certificate number + exam + score +
    preferred destination + student note. Stamps the certificate row with
    `interestedInCounseling=true`, `interestedLeadId`, `interestedAt`.
  - Writes `LEAD_CREATE` + `DOCUMENTS_UPDATE` audit entries.

### 6. Public certificate page
File: `src/app/certificate/[id]/page.tsx` (new, client component)

- Fetches `GET /api/certificate/[id]` and renders an HTML preview that mirrors
  the PDF layout (double border frame, drawn ALO mark, title, recipient,
  exam name, score panel with Overall + 4 skills, date + signature lines,
  verification block, practice disclaimer).
- "Download PDF" button → `cert.downloadUrl` (`?format=pdf`).
- "Copy verification link" button.
- "Express interest" CTA → POSTs to `/api/certificate/[id]/express-interest`,
  shows a success alert and a "Request received" state when done. The
  certificate card flips to the post-interest state on the same page.
- Sticky footer (min-h-screen flex flex-col, mt-auto footer).
- Mobile-first responsive (single column on mobile, two-column actions on sm+).

### 7. Exam submit flow integration
File: `src/app/api/attempts/submit/route.ts` (modified, additive)

- After `conductExam` succeeds and the audit entries are written, the route
  now calls `issueCertificateForAttempt(attemptId)` and `queueEmail(...)` in a
  best-effort try/catch. The certificate id, public verification URL,
  download URL, and `emailed` boolean are attached to the response as
  `certificate`.
- A certificate-generation failure is logged but never rolls back the
  submission or blocks the score — the student can still retrieve the
  certificate later via `POST /api/certificate/generate`.
- The response shape is otherwise unchanged: `attempt`, `result`, `objective`
  are exactly as before. Frontend callers that ignore the new `certificate`
  field keep working.

## Verification

- `bun run lint` — clean (only a pre-existing warning in
  `src/components/factory/control-center.tsx`, unrelated to this task).
- `npx tsc --noEmit -p tsconfig.json` — no new errors introduced by the
  certificate/email/examiner files. Pre-existing errors in
  `factory/lifecycle.ts`, `agents/skills`, `ai-os/marketing.tsx` are
  unrelated and untouched.
- End-to-end `bun -e` exercise of `generateCertificatePdf` produced a 4116-byte
  PDF with a valid `%PDF-` header at `/tmp/cert-sample.pdf`.
- End-to-end `bun -e` exercise of `AI_EXAMINERS` confirms 10 personas
  (5F + 5M), all Bengali names, unique specializations, `avatarUrl` set,
  `[0]` still Anika, `[1]` still Rifat.
- `db.certificate`, `db.certificateSequence`, `attempt.certificate`,
  `user.certificates` all accessible at runtime (Prisma client regenerated).

## Files modified / created

Modified:
- `src/lib/agents/AIExaminers.ts` (rewritten, additive — 5 → 10 personas)
- `src/app/api/examiners/route.ts` (added specialization/gender/avatarUrl +
  femaleCount/maleCount)
- `prisma/schema.prisma` (added Certificate + CertificateSequence models +
  reverse relations on User and Attempt)
- `src/app/api/attempts/submit/route.ts` (auto-generate + email certificate
  after submit, best-effort)
- `package.json` + `bun.lock` (added `pdfkit` + `@types/pdfkit`)

Created:
- `src/lib/certificate/CertificateGenerator.ts`
- `src/lib/email/EmailService.ts`
- `src/app/api/certificate/generate/route.ts`
- `src/app/api/certificate/[id]/route.ts`
- `src/app/api/certificate/[id]/express-interest/route.ts`
- `src/app/certificate/[id]/page.tsx`

Database:
- `bun run db:push` applied — `Certificate` and `CertificateSequence` tables
  created in SQLite. No migration SQL written (db:push syncs the schema
  directly, which is the project's existing pattern).

## Things the next agent should know

- The 5 new examiner avatar images (`examiner-06.png` … `examiner-10.png`) do
  NOT exist in `public/examiners/` yet. The `avatarUrl` field points at them;
  generate the actual PNGs when image generation is run.
- The email outbox is file-based (`storage/email-outbox/*.json`). To switch to
  real SMTP delivery, install `nodemailer` and call it inside
  `queueEmail()` in `src/lib/email/EmailService.ts`. No other code changes.
- The certificate PDF is drawn entirely with pdfkit vector primitives — no
  external image assets are required, so generation is robust against missing
  files. If you want to embed the real ALO logo, replace the `drawAloMark`
  function with a `doc.image(...)` call (note `logo-mark.png` is actually a
  JPEG; convert it first).
- The exam submit response now includes a `certificate` field
  (`{ id, certificateNumber, publicUrl, downloadUrl, emailed } | null`). It
  is null only if certificate generation failed (best-effort); the score and
  attempt status are still authoritative.
- The public `/certificate/[id]` page accepts both the cuid and the public
  ALO-CERT-YYYY-NNNNNN number in the URL — the printed verification URL uses
  the public number so it is shareable.
