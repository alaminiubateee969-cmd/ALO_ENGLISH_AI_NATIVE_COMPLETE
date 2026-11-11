---
Task ID: ANTI-REPEAT
Agent: main (Z.ai Code)
Task: Anti-repeat exam question system — 5 daily variants per exam type, never serve the same set twice, per-attempt shuffle

Work Log:
- Read worklog.md for project context (ALO English Test Platform, 510 questions across 22 exam types, single practice set per exam type).
- Read src/app/api/attempts/start/route.ts and src/lib/exam/selection.ts to understand the existing start flow (single-transaction quota reservation + attempt create + selectQuestions + persistSelection). Confirmed there was no QuestionExposure.ts file and the DailyQuestionSet model existed but only as a 1-row-per-(examTypeCode,date) marker with no actual question content.
- Read src/app/api/questions/route.ts and src/lib/exam/questions.ts (loadAttemptQuestions) to confirm the practice-test page reads the frozen AttemptQuestion rows in `order` asc — meaning the per-attempt shuffle just needs to write AttemptQuestion rows in shuffled order and the existing read path serves them correctly.
- Extended prisma/schema.prisma:
  * Added new model `DailyQuestionVariant` (id, dailySetId, variantIndex 1..5, practiceSetId, questionIds JSON, questionCount) with @@unique([dailySetId, variantIndex]).
  * Added new model `AttemptVariantExposure` (id, userId, attemptId @unique, variantId, createdAt) with @@unique([userId, variantId]) and a 1:1 relation to Attempt (onDelete: Cascade so deleting an attempt cleans up its exposure row).
  * Modified `DailyQuestionSet` to make practiceSetId nullable (legacy rows still readable) and added a `variants DailyQuestionVariant[]` relation.
  * Modified `Attempt` to add a `variantExposure AttemptVariantExposure?` back-relation.
  * Ran `bun run db:push` — schema synced to SQLite cleanly, no data loss.
- Created src/lib/exam/daily-sets.ts:
  * `DAILY_VARIANT_COUNT = 5`, `MAX_VARIANT_SIZE = 60`, `MIN_VARIANT_SIZE = 5`.
  * `todayStr()` — UTC YYYY-MM-DD for deterministic day boundaries across deployments.
  * Mulberry32 seeded PRNG + FNV-1a string hash → stable per-(examTypeCode, date, variantIndex) seed so all servers/cold-starts produce the same 5 variants today, and yesterday's variants differ from today's.
  * `variantSize(poolSize)` policy: tiny banks (<=10) serve all questions in every variant (5 variants differ only by per-attempt order); small (<=30) serve 70%; medium (<=60) serve 50%; large cap at 60.
  * `loadGradeablePool()` — reuses the same hasAnswerKey / hasReadyListeningAudio filtering as the legacy selectQuestions so variants exclude ungradeable questions and respect EXAM_REQUIRE_LISTENING_AUDIO strict mode.
  * `ensureDailyVariants()` — idempotent: looks up today's DailyQuestionSet + its 5 variants; if missing or partial, builds the gradeable pool, derives 5 seeded-shuffled subsets, and creates the rows. Safe to call inside a transaction.
  * `shuffleForAttempt()` — Math.random Fisher-Yates for the per-attempt re-shuffle layer.
- Created src/lib/QuestionExposure.ts:
  * `getExposedVariantIds(userId, variantIds)` — Set lookup of variants the student has already been exposed to.
  * `pickNextVariant(userId, bundle)` — picks an unseen variant uniformly at random; if all 5 have been seen, falls back to the least-recently-seen one so repeat sittings are spaced as far apart as possible.
  * `recordVariantExposure({userId, attemptId, variantId})` — writes the AttemptVariantExposure row. Idempotent: a P2002 unique violation (re-drawing a previously-seen variant after cycling) is silently swallowed so the original exposure timestamp stays intact for the picker.
  * `getAttemptVariant(attemptId)` — lookup helper for callers wanting to surface the variant slot to the student.
- Created src/lib/exam/anti-repeat.ts (high-level orchestrator):
  * `selectQuestionsWithAntiRepeat(tx, userId, practiceSetId)` → resolves the practice set's exam type, calls ensureDailyVariants, picks the next variant, re-shuffles the order per attempt, and returns a SelectionResult-compatible object extended with `variantId`, `variantIndex`, `isFreshVariant`, `dailySetDate`. Throws the same QuestionShortageError / ListeningAudioNotReadyError the legacy path throws so the start route's error handling is unchanged.
  * `persistAntiRepeatSelection(tx, {attemptId, userId, selection})` — freezes the per-attempt shuffled question IDs onto AttemptQuestion rows (idempotent on the attempt: a resume is a no-op so a started attempt can never be re-rolled) and records the variant exposure. Must be called inside the same transaction as Attempt.create.
- Modified src/app/api/attempts/start/route.ts:
  * Swapped `selectQuestions` → `selectQuestionsWithAntiRepeat` and `persistSelection` → `persistAntiRepeatSelection`.
  * Added `antiRepeat` block to the response payload: `{ variantIndex: 1..5, totalVariants: 5, isFreshVariant: boolean, dailySetDate: 'YYYY-MM-DD' }`. Additive only — the practice-test page's existing reads (`attempt`, `clock`, `questions`, `media`, `quota`) all still work unchanged.
  * Extended the EXAM_START audit-log metadata with `antiRepeatVariantIndex`, `antiRepeatIsFreshVariant`, `antiRepeatDailySetDate` so operators can audit the policy in action.
  * Kept the same try/catch around ListeningAudioNotReadyError / QuestionShortageError → 422 responses; no behavior change for short banks or unvalidated listening audio.
- Updated src/lib/agents/runtime/agents/content-agents.ts (Exam Orchestrator agent):
  * Switched the same two calls (`selectQuestions` → `selectQuestionsWithAntiRepeat`, `persistSelection` → `persistAntiRepeatSelection`).
  * Added anti-repeat fields (`variantIndex`, `isFreshVariant`, `dailySetDate`) to the `exam.session` AgentArtifact payload and the orchestrator.started log line.
  * Kept the audio/shortage error branches unchanged.

Smoke test (ran against the real SQLite DB, IELTS-A 131-question pool):
- 5 variants generated on first call (variant #1..#5, each 60 questions, distinct first-question IDs proving different selections).
- Started 6 attempts in sequence: variants drawn were 4, 5, 2, 3, 1 (all distinct, isFresh=true), then 6th attempt cycled to variant 4 with isFresh=false.
- Per-attempt shuffle verified: attempt 1's first-5 question IDs differed from variant 4's canonical first-5 IDs.
- DB state after 6 attempts: 5 DailyQuestionVariant rows for IELTS-A today, 5 AttemptVariantExposure rows for the user (unique constraint on (userId, variantId) preserved the first exposure's timestamp when the 6th attempt re-drew variant 4).
- Cascade delete verified: deleting the 6 test attempts cascaded to deleting their AttemptVariantExposure rows (0 remained).
- Lint: PASS (0 errors, 1 unrelated pre-existing warning in src/components/factory/control-center.tsx).
- Typecheck: my new/modified files produce no errors. Pre-existing errors in scripts/factory-acceptance.ts, src/lib/factory/lifecycle.ts, src/app/api/factory/.../provision/route.ts, src/components/ai-os/marketing.tsx, src/lib/content/blog.ts, src/app/api/agents/status/route.ts are unrelated to this task and were present before.

Stage Summary:
- Schema: 2 new models (DailyQuestionVariant, AttemptVariantExposure) + 2 modified models (DailyQuestionSet, Attempt). Schema pushed to SQLite via `bun run db:push` with no data loss.
- New modules:
  * src/lib/exam/daily-sets.ts — deterministic 5-variant-per-day generation, per-attempt shuffle helper, variant size policy.
  * src/lib/QuestionExposure.ts — exposure tracking + variant picker (fresh-first, least-recently-seen fallback).
  * src/lib/exam/anti-repeat.ts — high-level selectQuestionsWithAntiRepeat + persistAntiRepeatSelection.
- Modified modules:
  * src/app/api/attempts/start/route.ts — uses anti-repeat selection; response includes antiRepeat summary; audit log includes variant metadata.
  * src/lib/agents/runtime/agents/content-agents.ts — orchestrator agent uses anti-repeat selection; artifact payload includes variant metadata.
- Backward compatibility: practice-test page's existing startTest() flow is unchanged (it reads attempt.id, clock, and then fetches /api/questions?attemptId=X which reads the frozen AttemptQuestion rows in `order` asc — the new system writes those rows in shuffled order, so the page just renders whatever order the server froze). The /api/questions endpoint was not modified and still works.
- Existing selectQuestions / persistSelection exports in src/lib/exam/selection.ts are kept (unused now but exported) to avoid breaking any external import.
- Policy satisfied:
  1. Students cannot take the same exam twice — daily variant picker draws an unseen variant until all 5 are exhausted, then falls back to least-recently-seen.
  2. 5 different question sets per exam type per day — generated idempotently on first start of the day for that exam type.
  3. Random set they haven't seen — pickNextVariant filters by AttemptVariantExposure rows.
  4. Questions randomized — variant contents are seeded-shuffled subsets of the pool (different selection), and per-attempt Math.random shuffle gives different order even on the same variant.
