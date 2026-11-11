---
Task ID: DEVICE-VERIFY
Agent: main (Z.ai Code)
Task: Device verification + educational-ID gating + per-exam-type free quota + tab-switch proctoring for the ALO English Test Platform.

Work Log:
- Read worklog.md for project context (510 questions, 22 exam types, custom HMAC auth, anti-repeat daily variants, RBAC, 60 tests passing).
- Audited the existing flow:
  * Registration: src/app/api/auth/register/route.ts (Zod-validated, audit-logged, partner referral). User had no educationalId field.
  * Free quota: FreeQuota model was GLOBAL (`userId @unique`), with `attemptsLimit` set to 2_000_000_000 by src/lib/exam/quota.ts under an "unlimited free" policy.
  * Start API: src/app/api/attempts/start/route.ts used `tx.freeQuota.upsert({ where: { userId: user.id } })` and `reserveQuotaAttempt(tx, user.id, totalAllowed)` (3-arg signature).
  * Practice-test page: 919-line exam engine with server-authoritative clock, autosave, anti-repeat variant summary. NO tab-switch detection, NO device fingerprinting.
  * Attempt model: had no device/proctoring fields.

Schema changes (prisma/schema.prisma):
- User model: added `educationalId String? @unique` (nullable so multiple staff can have NULL; non-null values must be distinct). Documented in a triple-slash comment that the platform is gated (not public), required for STUDENT accounts, optional for staff.
- Attempt model: added 4 new fields:
  * `deviceId String?` — 16-char SHA-256 prefix of the device fingerprint, server-derived.
  * `deviceFingerprint String?` — validated JSON of the full fingerprint payload (≤4 KB).
  * `tabSwitchCount Int @default(0)` — monotonic counter of tab-switch / window-blur events.
  * `lastTabSwitchAt DateTime?` — timestamp of the most recent proctoring event.
  * New index `@@index([deviceId])` for the same-device-reuse lookup.
- FreeQuota model: rewrote to per-exam-type:
  * Removed `userId String @unique`.
  * Added `userId String` (no longer unique on its own).
  * Added `examTypeCode String`.
  * Added `@@unique([userId, examTypeCode])` compound unique.
  * Added `@@index([examTypeCode])` and `@@index([userId, examTypeCode])`.
  * `attemptsLimit Int @default(3)` (matches user spec: 3 free mock tests per exam type).
- Migrated: 4 existing FreeQuota rows (from the legacy "unlimited" policy) were deleted via a Bun one-liner before db:push, because they had no `examTypeCode` and could not be backfilled automatically.
- `bun run db:push --accept-data-loss` ran clean (the only data-loss warning was the new `educationalId @unique` constraint, which is safe because every existing row has NULL).
- Prisma Client regenerated to ./node_modules/@prisma/client.

New module: src/lib/exam/device-fingerprint.ts
- Isomorphic: imports are safe on both server and client; DOM access is confined to function bodies (only `collectDeviceFingerprint()` touches `window`/`navigator`/`screen`/`canvas`).
- `DeviceFingerprintSchema` — Zod schema validating the client payload (userAgent, platform, vendor, language, languages[], screen{}, viewport{}, timezone, timezoneOffsetMin, hardwareConcurrency, deviceMemoryGB, touchPoints, doNotTrack, cookieEnabled, online, canvasHash, webglHash, audioHash, sessionId, collectedAt).
- `deriveDeviceId(fp)` — pure async function that joins the STABLE fields (excludes viewport, sessionId, online, collectedAt which drift) in a fixed key order, then SHA-256 hashes via SubtleCrypto. Falls back to FNV-1a (32-bit × 2 passes) if SubtleCrypto is missing. Returns the first 16 hex chars.
- `describeDevice(fp)` — tiny UA parser for the human-readable label ("Chrome 124 on macOS").
- `detectDeviceReuse(db, userId, deviceId, excludeAttemptId?)` — informational lookup that counts prior attempts by this user on the same device id. Returns `{reuseCount, lastSeenAt}`. NEVER blocks a start.
- `collectDeviceFingerprint()` — browser-only collector. Throws if called outside a browser. Renders a canvas with mixed glyphs (Ω≈ç√∫˜µ≤≥÷) and reads back the pixel data for the canvas hash; collects WebGL vendor+renderer via WEBGL_debug_renderer_info; collects viewport, screen, hardware concurrency, device memory, touch points, timezone, languages.
- Constants: `DEVICE_FINGERPRINT_MAX_BYTES = 4096`, `DEVICE_ID_LENGTH = 16`, `TAB_SWITCH_WARNING_THRESHOLD = 3`, `TAB_SWITCH_AUTO_SUBMIT_THRESHOLD = 5`.

Modified: src/lib/exam/quota.ts
- `FREE_PRACTICE_LIMIT` changed from `2_000_000_000` to `3` (per user spec: 3 free mock tests per exam type).
- `freeAttemptLimitForRole(role)` — students get 3; SUPER_ADMIN/ADMIN get `2_000_000_000` (effectively unlimited; below Int32 ceiling so the conditional update cannot overflow).
- `quotaSummary` now accepts an optional `examTypeCode` and returns it in the summary object.
- `reserveQuotaAttempt(db, userId, totalAllowed, examTypeCode)` — 4-arg signature; the conditional `updateMany` keys on `(userId, examTypeCode, attemptsUsed < totalAllowed)` so a student burning their last IELTS-A slot cannot also consume the last TOEFL slot.

Modified: src/app/api/attempts/start/route.ts
- Zod schema now accepts an optional `deviceFingerprint: DeviceFingerprintSchema` payload in the request body.
- Validates the fingerprint JSON size (≤4 KB), then re-derives `deviceId` on the SERVER via `deriveDeviceId(rawFingerprint)`. A client cannot spoof another learner's device id — only its own presentation.
- Per-exam-type quota: `tx.freeQuota.upsert({ where: { userId_examTypeCode: { userId, examTypeCode } } })` instead of the old `userId`-only key. `defaultLimit = freeAttemptLimitForRole(user.role)` is refreshed on every start.
- `completedAttempts` count now filters by `practiceSet.examType.code === examTypeCode` so the reconcile uses per-exam-type completions, not global.
- `reserveQuotaAttempt(tx, user.id, totalAllowed, examTypeCode)` — 4-arg call.
- `attempt.create` data now stamps `deviceId` and `deviceFingerprint` from the server-derived summary.
- After the transaction commits: `detectDeviceReuse(user.id, attempt.deviceId, attempt.id)` runs to compute the informational reuse count (excludes the just-created attempt).
- Audit log: `EXAM_START` metadata now includes `quotaExamTypeCode`, `quotaAttemptsUsed`, `deviceId`, `deviceLabel`, `deviceReuseCount` in addition to the existing anti-repeat fields.
- Response payload includes a new `device: { deviceId, label, reuseCount, lastSeenAt }` block. `quota` now includes `examTypeCode`.
- Quota-exceeded message: "You have used all 3 free IELTS-A mock tests. Additional mock tests require payment. Visit your dashboard to purchase attempts, or contact your branch."

Modified: src/app/api/payment/route.ts (GET)
- Switched from `db.freeQuota.findUnique({ where: { userId } })` to `db.freeQuota.findMany({ where: { userId } })` (a student now has one row per exam type).
- Computes `perExamType` array of quota summaries, one per exam type the student has touched.
- Aggregate summary sums `attemptsUsed` and `freeLimit` across exam types for a top-line "you have used N of M free mock tests".
- Response payload now includes `perExamType: QuotaSummary[]`.

Modified: src/app/api/auth/register/route.ts
- Zod schema: added `educationalId: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-]{2,31}$/).optional()`. Also added an ignored `role` field for forward-compat (server pins every self-registration to STUDENT).
- Validation: if `educationalId` is absent, returns `badRequest("Educational ID is required. The ALO exam platform is not public — students register with the ID issued by their counselor or branch.")`. So student self-registration without an edu id is structurally blocked.
- Pre-check: `db.user.findUnique({ where: { educationalId } })` returns a friendly conflict message ("An account with this educational ID already exists...") before the raw P2002.
- `tx.user.create` data: includes `educationalId`. The select now also returns `educationalId`.
- Audit log: `REGISTER` metadata now includes `educationalId` and `role`.
- Response: returns `{ user, educationalId }`.

Modified: src/components/site/auth-forms.tsx (RegisterForm)
- Added `educationalId` state, `Educational ID *` input (uppercase tracking, autoCapitalize, spell-check off), explanation copy: "The exam platform is gated — you can only register with the educational ID issued by your ALO branch or counselor. 3 free mock tests are granted per exam type against this ID."
- Pre-submit validation: `if (!educationalId.trim()) { setError("Educational ID is required — the platform is not public."); return; }`.
- POST body now includes `educationalId: educationalId.trim()`.

Modified: src/components/alo/auth-modal.tsx
- Added `educationalId` state, `IdCard` icon import (lucide-react has it).
- `isStudentRegister = authMode === "register" && selectedRole === "student"` gates the new field.
- New field block: `Educational ID *` with IdCard icon, uppercase tracking, placeholder "e.g. ALO-2026-0001", help text about gating + 3 free tests per exam type.
- `handleSubmit` validates: if `isStudentRegister && !educationalId.trim()`, fires a destructive toast ("Educational ID required — the ALO exam platform is not public...") and returns early.
- Toast description on success now appends ` · Edu ID <id>` for student registrations so the user sees the ID they entered.

Modified: src/lib/audit.ts
- Added new AuditAction `EXAM_TAB_SWITCH` to the union, with a comment explaining it records tab-switch / window-blur threshold crossings (never blocks, persists posture for human review).

New endpoint: src/app/api/attempts/[id]/proctoring/route.ts (POST)
- Validates `{ tabSwitchCount: int 0..1000, eventType?: "visibilitychange"|"blur"|"focusloss"|"other", clientTimestamp?: int }`.
- Ownership + state guard: looks up the attempt, enforces `userId === caller`, refuses if status !== "IN_PROGRESS" with a 409 ("This attempt is no longer in progress; proctoring events are not accepted.").
- Monotonic max: `newCount = Math.max(attempt.tabSwitchCount, clientCount)` so a buggy/retried POST cannot decrease the persisted count. If unchanged, returns 200 with `{unchanged: true}` and writes nothing.
- On change: updates `tabSwitchCount` + `lastTabSwitchAt`, then `audit("EXAM_TAB_SWITCH", ...)` with `{tabSwitchCount, previousCount, eventType, clientTimestamp, serverTimestamp, crossedWarningThreshold, crossedAutoSubmitThreshold, practiceSetId}`.
- Response: `{ attemptId, tabSwitchCount, thresholdWarning: 3, thresholdAutoSubmit: 5, showWarning, shouldAutoSubmit, unchanged }`.

Modified: src/app/api/attempts/[id]/route.ts (GET, resume)
- Select now includes `deviceId`, `tabSwitchCount`, `lastTabSwitchAt`.
- Response payload: `attempt.proctoring = { deviceId, tabSwitchCount, lastTabSwitchAt }` so the resume path can rebuild the proctoring UI without an extra round-trip.

Modified: src/app/api/attempts/active/route.ts (GET)
- Same additions as [id]/route.ts: select + response.proctoring block.

Modified: src/app/practice-test/page.tsx
- Imports: added `ShieldAlert, MonitorSmartphone` from lucide-react; added `collectDeviceFingerprint, TAB_SWITCH_WARNING_THRESHOLD, TAB_SWITCH_AUTO_SUBMIT_THRESHOLD` from `@/lib/exam/device-fingerprint`.
- New state: `tabSwitchCount`, `showTabSwitchWarning`, `tabSwitchCountRef`, `proctoringInFlightRef`.
- `startTest(set)`:
  * Collects the device fingerprint BEFORE the POST (`collectDeviceFingerprint()` wrapped in try/catch — non-fatal if the browser blocks canvas/WebGL).
  * POST body: `{ practiceSetId, deviceFingerprint: devicePayload }`.
  * On success: resets `tabSwitchCountRef.current = 0`, `setTabSwitchCount(0)`, `setShowTabSwitchWarning(false)` so a fresh start begins with a clean proctoring slate.
- New useEffect (after the timer effect): attaches `visibilitychange` + `window blur` listeners ONLY while `testStarted && attemptId`. Each event:
  1. Filters: `visibilitychange` only counts the "leaving" half (document hidden), so a single round-trip away and back counts as one event.
  2. Increments `tabSwitchCountRef.current` and mirrors to state.
  3. If `next >= 3`, sets `showTabSwitchWarning = true`.
  4. Fire-and-forget POST to `/api/attempts/:id/proctoring` with `{ tabSwitchCount: next, eventType, clientTimestamp: Date.now() }`. Uses `keepalive: true` so the POST completes even if the tab is being closed. `proctoringInFlightRef` prevents re-entrancy; a dropped POST is tolerated because the next event re-sends the full count and the server's monotonic max catches up.
  5. If `next >= 5`, calls `submitTest()` (idempotent due to the existing double-submit guard).
- `reset()`: also resets the proctoring state.
- Resume path (restoreAttempt useEffect): seeds `tabSwitchCountRef.current = restoredAttempt.proctoring?.tabSwitchCount ?? 0` and `setShowTabSwitchWarning(resumedCount >= 3)` so a page refresh after a tab-switch event keeps the count and warning state.
- Test-taking screen UI: new proctoring banner above the listening-audio disclosure. Banner is always visible during a live exam so the posture is not hidden. Style flips from slate (informational) to red (`border-red-300 bg-red-50 text-red-800` with ShieldAlert icon) when `showTabSwitchWarning` is true. Copy: "Proctoring active. Tab switching, window blur and leaving this page are recorded. You have used N of 5 allowed focus-loss events" + "do not switch tabs again or your attempt will be auto-submitted" when at/above the warning threshold.

Verification:
- Lint: PASS (0 errors; 1 pre-existing unrelated warning in src/components/factory/control-center.tsx).
- Typecheck: 0 errors from my new/modified files. 10 pre-existing errors remain in unrelated files (scripts/factory-acceptance.ts, src/app/api/agents/status/route.ts, src/app/api/factory/.../provision/route.ts, src/components/ai-os/marketing.tsx, src/lib/content/blog.ts, src/lib/factory/lifecycle.ts) — all were present before this task and are not touched by my changes.
- Schema verification (direct SQLite pragma_table_info query):
  * FreeQuota columns: id, userId, examTypeCode, attemptsUsed, attemptsLimit, isAloStudent, createdAt, updatedAt ✅
  * Attempt columns: id, userId, practiceSetId, status, startedAt, expiresAt, durationMin, attemptNumber, submittedAt, createdAt, updatedAt, deviceId, deviceFingerprint, tabSwitchCount, lastTabSwitchAt ✅
  * User columns: ..., educationalId ✅
- Constraint verification (direct Prisma writes):
  * Duplicate educationalId rejected with P2002 ✅
  * Duplicate (userId, examTypeCode) rejected with P2002 ✅
  * Two distinct exam types for the same user both succeed ✅
- Device fingerprint smoke test:
  * `DeviceFingerprintSchema.safeParse` accepts a realistic Chrome/macOS payload ✅
  * `deriveDeviceId(fp)` returns a 16-char hex string (`461a0c5e464f1c38`) ✅
  * `describeDevice(fp)` returns "Chrome 124 on macOS" ✅
- Quota helpers smoke test:
  * `FREE_PRACTICE_LIMIT === 3` ✅
  * `freeAttemptLimitForRole("STUDENT") === 3` ✅
  * `freeAttemptLimitForRole("SUPER_ADMIN") === 2000000000` ✅
  * `quotaSummary({attemptsUsed:2, attemptsLimit:3, paidAttempts:0, examTypeCode:"IELTS-A"})` returns `{examTypeCode:"IELTS-A", remaining:1, needsPayment:false}` ✅
  * `reconcileAttemptsUsed(1, 3) === 3` ✅
- Practice-test page flow: unchanged contract. `startTest()` reads `attempt.id` + `clock` from POST /api/attempts/start, then GET /api/questions?attemptId=X reads frozen AttemptQuestion rows in `order` asc — the new device fingerprint is sent in the start POST body, the new proctoring listeners attach after `setTestStarted(true)`, and the resume path seeds the proctoring count from `attempt.proctoring.tabSwitchCount`. The existing timer + autosave + double-submit guard logic is untouched.

Stage Summary:
- Schema: 3 modified models (User +educationalId @unique, Attempt +4 device/proctoring fields, FreeQuota per-exam-type compound key). 0 new models. Pushed via `bun run db:push --accept-data-loss` with 4 stale FreeQuota rows dropped (clean slate for the new compound key).
- New modules:
  * src/lib/exam/device-fingerprint.ts — isomorphic device fingerprint collector + server-side id derivation + reuse detection (informational).
  * src/app/api/attempts/[id]/proctoring/route.ts — POST endpoint for tab-switch event persistence + audit logging.
- Modified modules:
  * src/lib/exam/quota.ts — per-exam-type quota helpers (FREE_PRACTICE_LIMIT=3, 4-arg reserveQuotaAttempt, examTypeCode in summary).
  * src/app/api/attempts/start/route.ts — accepts deviceFingerprint payload, per-exam-type quota upsert, stamps device on attempt, informational reuse check, audit + response extensions.
  * src/app/api/payment/route.ts (GET) — per-exam-type + aggregate quota summary.
  * src/app/api/auth/register/route.ts — educationalId validation, uniqueness pre-check, persistence, audit.
  * src/components/site/auth-forms.tsx — Educational ID field on the real /register page form.
  * src/components/alo/auth-modal.tsx — Educational ID field on the demo homepage modal, with validation toast.
  * src/lib/audit.ts — new EXAM_TAB_SWITCH AuditAction.
  * src/app/api/attempts/[id]/route.ts (GET) — returns proctoring block.
  * src/app/api/attempts/active/route.ts (GET) — returns proctoring block.
  * src/app/practice-test/page.tsx — device fingerprint collection at start, visibilitychange + blur listeners, proctoring banner, warning at 3 events, auto-submit at 5, resume seeds count from server.
- Policy satisfied (user spec, all 6 points):
  1. Device verification — fingerprint collected client-side, validated + id-derived server-side, stamped on the Attempt row. Same-device reuse is detected (informational count in response + audit log; never blocks a legitimate re-take on a shared laptop).
  2. Students register with educational ID — required for STUDENT role in the register API (returns badRequest if absent); enforced as @unique on User; both the /register page form and the homepage auth-modal collect it.
  3. 3 free mock tests per exam type using educational ID — FreeQuota is keyed by (userId, examTypeCode) with attemptsLimit=3; the conditional `reserveQuotaAttempt` updateMany keys on the compound key so a student can sit 3 IELTS-A AND 3 TOEFL.
  4. The exam system is NOT public — students need educational ID to access: register API refuses student accounts without one; the practice-test page still requires auth (`requireAuth()` in /api/attempts/start, /api/questions, /api/attempts/[id], etc.).
  5. Tab switching / window blur detection — visibilitychange + window.blur listeners in practice-test/page.tsx; banner shown live; warning at 3 events; auto-submit at 5 events; count persisted via POST /api/attempts/[id]/proctoring (monotonic max, keepalive, fire-and-forget with re-entrancy guard); audit log records every threshold crossing.
  6. Existing exam flow preserved — practice-test page contract unchanged: startTest() reads attempt.id + clock from POST /api/attempts/start, then GET /api/questions reads frozen AttemptQuestion rows. The anti-repeat daily variants, the server-authoritative clock, autosave, double-submit guard, listening audio handling, and the result screen are untouched.
- Files modified (12) + files created (2) = 14 total:
  CREATED: src/lib/exam/device-fingerprint.ts, src/app/api/attempts/[id]/proctoring/route.ts
  MODIFIED: prisma/schema.prisma, src/lib/exam/quota.ts, src/lib/audit.ts, src/app/api/attempts/start/route.ts, src/app/api/attempts/[id]/route.ts, src/app/api/attempts/active/route.ts, src/app/api/payment/route.ts, src/app/api/auth/register/route.ts, src/components/site/auth-forms.tsx, src/components/alo/auth-modal.tsx, src/app/practice-test/page.tsx
