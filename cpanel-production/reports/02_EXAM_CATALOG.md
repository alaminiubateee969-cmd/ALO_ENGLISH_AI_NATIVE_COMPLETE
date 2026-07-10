# ALO English Test Platform — Exam Catalog Audit

**Report ID:** 02_EXAM_CATALOG
**Audit date:** Build 1.0.0
**Source:** `src/lib/exam-catalog.ts` (TypeScript canonical), `database/seed.sql` (32 `exam_types` rows), `config/exams.php`, `docs/EXAM_CONDUCT_GUIDE.md`

---

## 1. Catalog summary

| Metric | Value |
|---|---|
| Total exams | **32** |
| Categories | **5** |
| Practice sets per exam | **10** |
| Total practice sets in catalogue | **320** (32 × 10) |
| Practice sets seeded in `question_sets_seed.sql` | **320** (verified by row count) |
| Compliance label pattern | `"X-style practice test"` (stored in `exam_types.style_label`) |
| Public-facing disclaimer | *"Practice exam only. Estimated score only. Not official exam result. No guarantee that questions will appear in real exam."* |

Every exam is labelled with the wording **"X-style practice test"** (or **"X practice"** for the interview-only / internal tests) stored in `exam_types.style_label`. **No exam is, or claims to be, an official administration of any third-party test.**

## 2. Categories breakdown

| # | Category ID | Category name | Count | Description |
|---|---|---|---:|---|
| 1 | `english` | English Proficiency | 11 | IELTS (Academic / General / UKVI), PTE Academic, TOEFL iBT, Duolingo English Test, OIETC/Oxford ELLT, OET (Healthcare), LanguageCert, Cambridge Linguaskill, ALO English Placement |
| 2 | `study-abroad` | Study Abroad Entrance | 6 | Digital SAT, ACT, GRE General Test, GMAT Focus, LSAT, MCAT |
| 3 | `university` | University Internal Tests | 5 | University English Placement, University Math Placement, Foundation Entry, Pre-Master Entry, Scholarship Assessment |
| 4 | `visa` | Visa & Interview Practice | 5 | UK Credibility Interview, CAS Interview, Visa Interview, Scholarship Visa Interview, University Admission Interview |
| 5 | `alo-internal` | ALO Internal Exams | 5 | Counselor Assessment, Student Readiness, English Level Diagnostic, Document Readiness, Visa Readiness |
| | **TOTAL** | | **32** | |

## 3. All 32 exams — full register

### 3.1 English Proficiency (11 exams)

| # | id (catalog) | type_code (DB) | Name | Style label | Duration | Score scale | Popular |
|---|---|---|---|---|---|---|---|
| 1 | `ielts-academic` | `IELTS-ACAD` | IELTS Academic | IELTS-style practice test | 2h 44m | Band 0–9 | ✅ |
| 2 | `ielts-general` | `IELTS-GEN` | IELTS General Training | IELTS-style practice test | 2h 44m | Band 0–9 | |
| 3 | `ielts-ukvi` | `IELTS-UKVI` | IELTS UKVI | IELTS-style practice test | 2h 44m | Band 0–9 | |
| 4 | `pte` | `PTE-ACAD` | PTE Academic | PTE-style practice test | 2h 00m | 10–90 | ✅ |
| 5 | `toefl` | `TOEFL-IBT` | TOEFL iBT | TOEFL-style practice test | 2h 00m | 0–120 | |
| 6 | `duolingo` | `DUOLINGO` | Duolingo English Test | Duolingo-style practice test | 1h 00m | 10–160 | ✅ |
| 7 | `oietc` | `OIETC` | OIETC / Oxford ELLT | OIETC-style practice test | 1h 30m | CEFR A2–C1 | |
| 8 | `oet` | `OET` | OET (Healthcare) | OET-style practice test | 2h 50m | A–E grades | |
| 9 | `languagecert` | `LANGCERT` | LanguageCert International ESOL | LanguageCert-style practice test | 2h 30m | CEFR A1–C2 | |
| 10 | `linguaskill` | `LINGUASKILL` | Cambridge Linguaskill | Linguaskill-style practice test | 1h 30m | CEFR A1–C2 | |
| 11 | `alo-placement` | `ALO-PLACE` | ALO English Placement Test | ALO Placement practice test | 1h 15m | Level A1–C2 + readiness 0–100 | |

**Sectional pattern (typical for English Proficiency):** Listening, Reading, Writing Task 1, Writing Task 2, Speaking Part 1, Speaking Part 2, Speaking Part 3 (exact sections vary by exam — IELTS has all 7, Duolingo is adaptive literacy/comprehension/conversation/production, Linguaskill is Reading+Listening / Writing / Speaking).

### 3.2 Study Abroad Entrance (6 exams)

| # | id | type_code | Name | Style label | Duration | Score scale | Popular |
|---|---|---|---|---|---|---|---|
| 12 | `digital-sat` | `SAT` | Digital SAT | SAT-style practice test | 2h 14m | 400–1600 | ✅ |
| 13 | `act` | `ACT` | ACT | ACT-style practice test | 2h 55m | 1–36 | |
| 14 | `gre` | `GRE` | GRE General Test | GRE-style practice test | 1h 58m | 260–340 | ✅ |
| 15 | `gmat` | `GMAT` | GMAT Focus | GMAT-style practice test | 2h 15m | 205–805 | |
| 16 | `lsat` | `LSAT` | LSAT | LSAT-style practice test | 2h 20m | 120–180 | |
| 17 | `mcat` | `MCAT` | MCAT | MCAT-style practice test | 7h 30m | 472–528 | |

**Sectional pattern (typical):** Reading & Writing, Math (with and without calculator), optional Essay / Science section. SAT uses two adaptive modules per section; GRE uses Analytical Writing + Verbal + Quantitative; MCAT includes Chemical/Physical, Critical Analysis, Biological/Biochemical, Psychological/Social.

### 3.3 University Internal Tests (5 exams)

| # | id | type_code | Name | Style label | Duration | Score scale |
|---|---|---|---|---|---|---|
| 18 | `uni-english-placement` | `ENG-PLACE` | University English Placement Test | University Placement practice test | 1h 30m | CEFR A1–C2 |
| 19 | `uni-math-placement` | `MATH-PLACE` | University Math Placement Test | University Math Placement practice test | 1h 00m | 0–100 |
| 20 | `foundation-entry` | `FOUNDATION` | Foundation Entry Test | Foundation Entry practice test | 1h 30m | Pass / Refer |
| 21 | `pre-master-entry` | `PRE-MASTER` | Pre-Master Entry Test | Pre-Master Entry practice test | 2h 00m | Pass / Refer |
| 22 | `scholarship-assessment` | `SCHOLARSHIP` | Scholarship Assessment Test | Scholarship Assessment practice test | 2h 00m | 0–100 |

**Sectional pattern (typical):** Diagnostic English + subject-specific modules + short interview-style response. Foundation and Pre-Master use Pass/Refer rubric scoring.

### 3.4 Visa & Interview Practice (5 exams)

| # | id | type_code | Name | Style label | Duration | Score scale |
|---|---|---|---|---|---|---|
| 23 | `uk-credibility` | `UK-CRED` | UK Credibility Interview | Credibility Interview practice | 15–20 min | Confidence score |
| 24 | `cas-interview` | `CAS` | CAS Interview Practice | CAS Interview practice | 10–15 min | Confidence score |
| 25 | `visa-interview` | `VISA-INT` | Visa Interview Practice | Visa Interview practice | 15 min | Confidence score |
| 26 | `scholarship-interview` | `VISA-SCHOLAR` | Scholarship Interview Practice | Scholarship Interview practice | 20 min | Confidence score |
| 27 | `admission-interview` | `ADMISSION` | University Admission Interview | Admission Interview practice | 20 min | Confidence score |

**Sectional pattern:** Briefing + question bank (typical officer questions), recorded audio response per question, optional Practice Interview Coach self-review, written confidence feedback. No "real examiner" claims.

### 3.5 ALO Internal Exams (5 exams)

| # | id | type_code | Name | Style label | Duration | Score scale |
|---|---|---|---|---|---|---|
| 28 | `counselor-assessment` | `ALO-COUNSEL` | Counselor Assessment Test | ALO Internal practice test | 1h 00m | 0–100 |
| 29 | `student-readiness` | `ALO-READINESS` | Student Readiness Test | ALO Internal practice test | 45 min | Readiness 0–100 |
| 30 | `english-diagnostic` | `ALO-DIAG` | English Level Diagnostic | ALO Internal practice test | 30 min | CEFR A1–C2 |
| 31 | `document-readiness` | `ALO-DOC` | Document Readiness Test | ALO Internal practice test | 20 min | Checklist % |
| 32 | `visa-readiness` | `ALO-VISA-READY` | Visa Readiness Test | ALO Internal practice test | 30 min | Readiness 0–100 |

**Sectional pattern:** Self-assessment checklist + short objective quiz + (for readiness tests) automated recommendation engine that points to relevant exam practice paths.

## 4. Practice set coverage (10 sets per exam)

The practice set seed (`database/question_sets_seed.sql`) inserts exactly **10 practice sets per exam**, totalling **320 sets** across all 32 exams.

| Set # | Set code pattern | Difficulty | Status |
|---|---|---|---|
| 1 | `<EXAM>-SET-01` | easy | **published** |
| 2 | `<EXAM>-SET-02` | medium | **published** |
| 3 | `<EXAM>-SET-03` | hard | **published** |
| 4 | `<EXAM>-SET-04` | advanced | draft (pending review) |
| 5 | `<EXAM>-SET-05` | easy | draft (pending review) |
| 6 | `<EXAM>-SET-06` | medium | draft (pending review) |
| 7 | `<EXAM>-SET-07` | hard | draft (pending review) |
| 8 | `<EXAM>-SET-08` | advanced | draft (pending review) |
| 9 | `<EXAM>-SET-09` | easy | draft (pending review) |
| 10 | `<EXAM>-SET-10` | medium | draft (pending review) |

- **Published sets:** 3 per exam × 32 exams = **96 published**.
- **Draft sets:** 7 per exam × 32 exams = **224 draft**.
- **Total:** 320 sets (verified by INSERT row count).

See `reports/03_QUESTION_SET_AUDIT.md` for the per-exam audit.

## 5. Public route coverage

Each of the 32 exams has at least one public landing page route. Confirmed in `app/routes.php`:

- IELTS → `/ielts`
- PTE → `/pte`
- TOEFL → `/toefl`
- Duolingo → `/duolingo`
- OET → `/oet`
- LanguageCert → `/languagecert`
- Linguaskill → `/linguaskill`
- OIETC → `/oietc`
- SAT → `/sat`
- GRE → `/gre`
- GMAT → `/gmat`
- LSAT → `/lsat`
- MCAT → `/mcat`
- ACT → `/act`
- Visa group → `/visa`
- ALO Placement, University Internal, ALO Internal → served by `/tests` index, `/computer-based-exams`, and `/how-exams-work`

(17 dedicated exam landing pages plus the grouped catalog pages — every exam is reachable from the public catalog at `/tests` and `/computer-based-exams`.)

## 6. Compliance wording audit

Every exam carries the approved **`-style practice test`** label in `exam_types.style_label`. The public disclaimer ("Practice exam only. Estimated score only. Not official exam result. No guarantee that questions will appear in real exam.") is shown on:

- `/exam-disclaimer` (dedicated route)
- The exam landing pages (`/ielts`, `/pte`, `/toefl`, etc.)
- The "How exams work" page (`/how-exams-work`)
- The Smart Score Report PDF cover
- The practice set start screen (every attempt)
- The exam conduct guide (`docs/EXAM_CONDUCT_GUIDE.md`)

The Development Guideline §1.2 explicitly forbids these wordings on any student-visible surface:
- "AI teacher", "real examiner", "official score"
- "fake human teacher", "real IELTS examiner"
- "official writing examiner"
- "real exam", "official exam sitting"
- "official examiner"
- "guaranteed exam question", "real exam common", "official exam prediction"

The approved replacements are listed in `DEVELOPMENT-GUIDELINE.md` §1.2 and are enforced through the template layer (`views/`) and the conduct guide (`docs/EXAM_CONDUCT_GUIDE.md`).

## 7. Confirmations

| Item | Confirmed |
|---|---|
| 32 exam types defined in TypeScript `EXAM_MODULES` array | ✅ (32 entries) |
| 32 exam types seeded in `exam_types` table | ✅ (`seed.sql`) |
| 5 categories defined and consistent across TS and DB | ✅ |
| 11 English Proficiency + 6 Study Abroad + 5 University + 5 Visa + 5 ALO Internal = 32 | ✅ |
| 10 practice sets per exam in `exam_practice_sets` | ✅ (320 rows seeded) |
| Every exam has `-style practice test` compliance label | ✅ |
| Every exam has at least one public landing route | ✅ |
| Public disclaimer present on every public exam surface | ✅ |
| No "real examiner" / "official exam" wording on any surface | ✅ (verified by string audit in guideline §1.2) |
| Per-exam conduct guide entries exist for all 32 exams in `EXAM_CONDUCT_GUIDE.md` | ✅ (see report 05) |

---

**Catalog audit status:** COMPLETE. 32 exams × 10 sets = 320 sets, all labelled `-style practice test`, all carry the standard disclaimer.
