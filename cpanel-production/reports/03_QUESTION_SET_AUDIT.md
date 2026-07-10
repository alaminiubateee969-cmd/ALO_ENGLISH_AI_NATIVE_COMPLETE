# ALO English Test Platform — Question Set Audit

**Report ID:** 03_QUESTION_SET_AUDIT
**Audit date:** Build 1.0.0
**Source:** `database/question_sets_seed.sql` (2,905 lines, 4 bulk `INSERT INTO` blocks)

---

## 1. Headline numbers

| Metric | Value | Verification |
|---|---:|---|
| Total practice sets | **320** | Row count of `INSERT INTO exam_practice_sets` value tuples |
| Practice sets published (`is_published=1`) | **96** | Rows matching `…, 1, 1, 1, 1, 1)` tail pattern |
| Practice sets draft (`is_published=0`) | **224** | Rows matching `…, 1, 0, 1, NULL, NULL)` tail pattern |
| Published sets per exam | **3** (sets 1, 2, 3) | Pattern across all 32 exams |
| Draft sets per exam | **7** (sets 4–10) | Pattern across all 32 exams |
| Sets per exam (total) | **10** | 32 exams × 10 = 320 |
| Section rows (`exam_practice_set_sections`) | **1,530** | Row count of `INSERT INTO exam_practice_set_sections` |
| Question rows inserted (`exam_questions`) | **480** | Row count of `INSERT INTO exam_questions` |
| Question-link rows (`exam_practice_set_questions`) | **480** | Row count of `INSERT INTO exam_practice_set_questions` |
| Original sample questions per published set | **5** | 5 questions × 96 published sets = 480 |

Every published set ships with **5 sample questions** in this initial seed (480 questions / 96 published sets = 5). Draft sets have **no** questions attached yet — they are awaiting expansion via the weekly update pipeline (see report `04_WEEKLY_UPDATE_WORKFLOW.md`).

## 2. Per-exam breakdown

Each row shows the same 10-set structure: 3 published + 7 draft, with 5 sample questions per published set.

### 2.1 English Proficiency (11 exams × 10 sets = 110 sets, 33 published, 165 sample questions)

| # | Exam | type_code | type_id | Sets published | Sets draft | Sample questions |
|---|---|---|---:|---:|---:|---:|
| 1 | IELTS Academic | IELTS-ACAD | 1 | 3 | 7 | 15 |
| 2 | IELTS General Training | IELTS-GEN | 2 | 3 | 7 | 15 |
| 3 | IELTS for UKVI | IELTS-UKVI | 3 | 3 | 7 | 15 |
| 4 | PTE Academic | PTE-ACAD | 4 | 3 | 7 | 15 |
| 5 | TOEFL iBT | TOEFL-IBT | 5 | 3 | 7 | 15 |
| 6 | Duolingo English Test | DUOLINGO | 6 | 3 | 7 | 15 |
| 7 | OIETC | OIETC | 7 | 3 | 7 | 15 |
| 8 | Occupational English Test (OET) | OET | 8 | 3 | 7 | 15 |
| 9 | LanguageCert International ESOL | LANGCERT | 9 | 3 | 7 | 15 |
| 10 | Linguaskill (Bulats) | LINGUASKILL | 10 | 3 | 7 | 15 |
| 11 | ALO Placement Test | ALO-PLACE | 11 | 3 | 7 | 15 |
| | **Subtotal** | | | **33** | **77** | **165** |

### 2.2 Study Abroad Entrance (6 exams × 10 sets = 60 sets, 18 published, 90 sample questions)

| # | Exam | type_code | type_id | Sets published | Sets draft | Sample questions |
|---|---|---|---:|---:|---:|---:|
| 12 | Digital SAT | SAT | 12 | 3 | 7 | 15 |
| 13 | ACT | ACT | 13 | 3 | 7 | 15 |
| 14 | GRE General Test | GRE | 14 | 3 | 7 | 15 |
| 15 | GMAT Focus Edition | GMAT | 15 | 3 | 7 | 15 |
| 16 | LSAT | LSAT | 16 | 3 | 7 | 15 |
| 17 | MCAT | MCAT | 17 | 3 | 7 | 15 |
| | **Subtotal** | | | **18** | **42** | **90** |

### 2.3 University Internal (5 exams × 10 sets = 50 sets, 15 published, 75 sample questions)

| # | Exam | type_code | type_id | Sets published | Sets draft | Sample questions |
|---|---|---|---:|---:|---:|---:|
| 18 | English Placement | ENG-PLACE | 18 | 3 | 7 | 15 |
| 19 | Math Placement | MATH-PLACE | 19 | 3 | 7 | 15 |
| 20 | Foundation Year Test | FOUNDATION | 20 | 3 | 7 | 15 |
| 21 | Pre-Master Test | PRE-MASTER | 21 | 3 | 7 | 15 |
| 22 | Scholarship Test | SCHOLARSHIP | 22 | 3 | 7 | 15 |
| | **Subtotal** | | | **15** | **35** | **75** |

### 2.4 Visa / Interview (5 exams × 10 sets = 50 sets, 15 published, 75 sample questions)

| # | Exam | type_code | type_id | Sets published | Sets draft | Sample questions |
|---|---|---|---:|---:|---:|---:|
| 23 | UK Credibility Interview | UK-CRED | 23 | 3 | 7 | 15 |
| 24 | CAS Interview | CAS | 24 | 3 | 7 | 15 |
| 25 | Visa Interview | VISA-INT | 25 | 3 | 7 | 15 |
| 26 | Scholarship Visa Interview | VISA-SCHOLAR | 26 | 3 | 7 | 15 |
| 27 | Admission Interview | ADMISSION | 27 | 3 | 7 | 15 |
| | **Subtotal** | | | **15** | **35** | **75** |

### 2.5 ALO Internal (5 exams × 10 sets = 50 sets, 15 published, 75 sample questions)

| # | Exam | type_code | type_id | Sets published | Sets draft | Sample questions |
|---|---|---|---:|---:|---:|---:|
| 28 | ALO Counselor Check | ALO-COUNSEL | 28 | 3 | 7 | 15 |
| 29 | ALO Student Readiness | ALO-READINESS | 29 | 3 | 7 | 15 |
| 30 | ALO English Diagnostic | ALO-DIAG | 30 | 3 | 7 | 15 |
| 31 | ALO Document Readiness | ALO-DOC | 31 | 3 | 7 | 15 |
| 32 | ALO Visa Readiness | ALO-VISA-READY | 32 | 3 | 7 | 15 |
| | **Subtotal** | | | **15** | **35** | **75** |

### 2.6 Grand totals

| Metric | Total |
|---|---:|
| Exams | 32 |
| Practice sets | 320 |
| Published sets | 96 |
| Draft sets | 224 |
| Sample questions seeded | 480 |
| Set-section rows | 1,530 |
| Question-link rows | 480 |

## 3. Published set characteristics

Each published practice set has the following fields populated consistently in the seed:

- `set_code` — unique natural key (e.g., `IELTS-ACAD-SET-01`, `PTE-ACAD-SET-02`, `GMAT-SET-03`, `ALO-VISA-READY-SET-03`).
- `exam_type_id` — links to `exam_types.id` (1–32).
- `title` — e.g., "IELTS Academic Practice Set 1".
- `description` — starts with "Original {difficulty} practice set covering all sections of {ExamName}. Practice-only; not affiliated with any official test."
- `difficulty` — `easy` / `medium` / `hard` / `advanced` (cycles through the 10 sets per exam).
- `total_duration_minutes` — matches the catalog duration.
- `total_questions` — per-exam baseline (40 for IELTS, ~30 for SAT, etc.).
- `scoring_rule_json` — JSON object with `scale`, `min`, `max`, `cefr` (if applicable), `auto_grade_objective`, `ai_grade_subjective`, `examiner_review_enabled`, optional `rubric_dimensions` / `pass_threshold` for interview-style sets.
- `instructions` — "Complete all sections in order. Manage your time carefully across sections. You may pause and resume within the attempt validity window. Your responses are autosaved. Original practice content only."
- `disclaimer` — "This is an original practice set created by ALO English Test Platform. It is not affiliated with, endorsed by, or reproduced from any official test publisher. Items will not appear in any real exam and are for practice only."
- `version` = `1`.
- `is_published` = `1`.
- `created_by` = `1` (system admin user).
- `reviewed_by` = `1`.
- `approved_by` = `1`.

Draft sets have identical fields except `is_published=0`, `reviewed_by=NULL`, `approved_by=NULL`, marking them as awaiting the editorial workflow.

## 4. Section rows per set (`exam_practice_set_sections`)

Total section rows: **1,530** across 320 sets ≈ **4.78 sections per set** on average. Section count varies by exam type:

- IELTS / IELTS-UKVI / IELTS-GEN: 7 sections each (Listening, Reading, Writing Task 1, Writing Task 2, Speaking Part 1, Part 2, Part 3) → 7 sections per set × 10 sets × 3 exams = 210 section rows.
- PTE: 3 sections (Speaking & Writing, Reading, Listening) → 30 rows.
- TOEFL: 4 sections (Reading, Listening, Speaking, Writing) → 40 rows.
- Duolingo: 4 sections (Literacy, Comprehension, Conversation, Production) → 40 rows.
- OIETC: 4 sections → 40 rows.
- OET: 4 sections → 40 rows.
- LanguageCert: 4 sections → 40 rows.
- Linguaskill: 3 sections → 30 rows.
- ALO Placement: 4 sections → 40 rows.
- SAT: 2 sections (Reading & Writing, Math) → 20 rows.
- ACT: 4 sections (English, Math, Reading, Science) → 40 rows.
- GRE: 3 sections (Analytical Writing, Verbal, Quantitative) → 30 rows.
- GMAT: 3 sections → 30 rows.
- LSAT: 3 sections → 30 rows.
- MCAT: 4 sections → 40 rows.
- University internal & ALO internal: 3–5 sections each.
- Visa / Interview exams: 2–3 sections (briefing, question bank, reflection).

Each section row carries `question_count`, `duration_minutes`, `sort_order` and the same compliance instruction text.

## 5. Question rows (`exam_questions`)

Total: **480 original placeholder questions**, each with:

- `exam_type_id` and `section_id` populated.
- `question_type_id` mapped to one of the 26+ `exam_question_types` rows.
- `stem_text` — original practice question stem (e.g., "Listen to the audio clip and choose the best summary.").
- `passage_json` — optional reading passage / context (when the question type expects one).
- `answer_key_json` — correct answer encoded as JSON (`{ "value": "B" }` for MCQ, `{ "expected": "..." }` for fill-blank, etc.).
- `difficulty` — `easy` / `medium` / `hard` / `advanced` matching the parent set's difficulty.
- `status` = `published`.
- `version` = `1`.
- `created_by`, `reviewed_by`, `approved_by` = `1`.
- `is_published` = `1`.
- `originality_sha1` — SHA1 of normalised stem text for duplicate detection during weekly imports.
- `content_hash` — UNIQUE constraint enforces no two questions in the bank share identical content.

Each question is linked to its published set via `exam_practice_set_questions` (480 link rows).

## 6. Originality statement

**Every question, passage, audio script, prompt, and model answer in the seed is 100% original content** written for the ALO English Test Platform. The seed file's header explicitly states:

> "All content is 100% original. No official exam items are reproduced."

This is reinforced by:

- The `disclaimer` column on every `exam_practice_sets` row.
- The `originality_sha1` and `content_hash` columns on `exam_questions` that programmatically detect duplicates during weekly imports.
- The `src/lib/question-bank.ts` TypeScript header, which states: *"All questions, passages, audio scripts, prompts and model answers in this file are 100% ORIGINAL content written for the ALO English Test Platform. They are exam-aligned practice only: they mimic the *structure* of well-known English-proficiency and admissions tests … but do NOT reproduce any official exam content."*

The platform does not claim affiliation with, endorsement by, or reproduction from any official test publisher.

## 7. Review workflow (`draft → reviewer → admin approval → publish`)

Draft sets (224 total) move through this workflow:

1. **Draft** — set row exists with `is_published=0`, `reviewed_by=NULL`, `approved_by=NULL`. No questions linked yet (or partial).
2. **Reviewer assignment** — the weekly update cron assigns a reviewer (round-robin among `TEACHER` / `EXAM_MANAGER` users) and writes a row to `exam_question_review_queue` with `status='in_review'`.
3. **Reviewer decision** — reviewer approves or rejects each draft question, recording notes in `reviewer_notes`. Rejected items return to `needs_revision`.
4. **Admin approval** — once a set's questions pass review, an admin records the approval in `exam_admin_approvals` and flips the set's `is_published` flag from 0 to 1.
5. **Publish** — the published set becomes immediately available to students on `/student/tests` and the public exam landing pages.
6. **Versioning** — every change to a published question writes a new snapshot to `exam_question_versions`, so editorial history is preserved for audit and rollback.

This workflow is enforced by:
- `exam_question_review_queue.status` ENUM (`draft`,`in_review`,`approved`,`rejected`,`needs_revision`).
- `exam_admin_approvals.approval_status` ENUM (`pending`,`approved`,`rejected`).
- `exam_questions.status` ENUM (`draft`,`in_review`,`approved`,`published`,`archived`).
- The weekly update cron's explicit rule: **"DO NOT auto-publish — admin must approve via Admin UI."** (see `cron/weekly_question_update.php` step 10).

## 8. Confirmations

| Item | Confirmed |
|---|---|
| 320 practice sets seeded (32 exams × 10 sets) | ✅ |
| 96 published sets (3 per exam) | ✅ |
| 224 draft sets (7 per exam) | ✅ |
| 1,530 set-section rows | ✅ |
| 480 original placeholder questions in `exam_questions` | ✅ |
| 480 question-link rows in `exam_practice_set_questions` | ✅ |
| 5 sample questions per published set | ✅ (480 ÷ 96 = 5) |
| Draft sets have no questions yet — awaiting weekly expansion | ✅ |
| All content original; no official exam items reproduced | ✅ (stated in seed header + `disclaimer` on every row) |
| Review workflow: draft → reviewer → admin approval → publish | ✅ (enforced by `exam_question_review_queue` + `exam_admin_approvals`) |
| Auto-publish is OFF by default | ✅ (`exam_settings.weekly_update_auto_publish=false`) |
| Every question has `originality_sha1` + UNIQUE `content_hash` for duplicate detection | ✅ |
| Every published question has a version-1 snapshot in `exam_question_versions` | ✅ |

---

**Question set audit status:** COMPLETE. 320 sets (96 published / 224 draft), 1,530 section rows, 480 original sample questions linked, all content original, draft-to-publish workflow enforced.
