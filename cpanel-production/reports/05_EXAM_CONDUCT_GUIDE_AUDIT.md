# ALO English Test Platform — Exam Conduct Guide Audit

**Report ID:** 05_EXAM_CONDUCT_GUIDE_AUDIT
**Audit date:** Build 1.0.0
**Source:** `docs/EXAM_CONDUCT_GUIDE.md` (778 lines), `app/routes.php`

---

## 1. File existence and size

| Property | Value |
|---|---|
| File path | `docs/EXAM_CONDUCT_GUIDE.md` |
| Line count | **778** |
| Sections | 8 top-level sections (§0–§7) |
| Per-exam entries | **32** (`#### 6.x.y` headings) |
| Audience | Students, parents, ambassadors, counselors, and proctoring staff |
| Scope | All 32 practice exams across 5 categories |

The file exists at the documented path and is shipped in the cPanel production package.

## 2. Document structure

| § | Section | Purpose |
|---:|---|---|
| 0 | How to Read This Guide | Three-layer structure: global guidance (§1–§5), per-exam reference (§6), compliance wording (§7) |
| 1 | Equipment Guide | Recommended setup (1.1), browser pre-flight (1.2), mobile support (1.3) |
| 2 | Before the Exam | Account setup (2.1), quota check (2.2), exam selection (2.3), instructions & disclaimer (2.4), microphone test (2.5), timer start (2.6) |
| 3 | During the Exam | Timer (3.1), autosave (3.2), answer-all & flag (3.3), submit before time (3.4), refreshing (3.5), integrity (3.6) |
| 4 | After the Exam | Smart Score Report (4.1), review explanations (4.2), download PDF (4.3), book counseling (4.4), study plan (4.5), retake (4.6) |
| 5 | About the ALO Estimated Score Engine | What it is (5.1), what it is not (5.2), how to use it (5.3) |
| 6 | Per-Exam Reference | 32 entries grouped by 5 categories (6.1 English Proficiency, 6.2 Study Abroad, 6.3 University Internal, 6.4 Visa/Interview, 6.5 ALO Internal) |
| 7 | Compliance Wording | Approved and forbidden labels used on every public surface |

## 3. Equipment guide (§1)

The guide documents a complete pre-flight checklist:

| Item | Requirement |
|---|---|
| Device | Laptop or desktop recommended; mobile supported for practice only |
| Operating system | Windows 10+, macOS 11+, ChromeOS, recent Linux |
| Browser | Latest Chrome, Edge, Firefox, Safari (updated within last 90 days; IE rejected) |
| Internet | Stable 5 Mbps+ down / 1 Mbps+ up |
| Microphone | Required for any speaking practice (browser permission required) |
| Camera | Optional; recommended for interview-style practice |
| Headphones | Recommended for listening sections |
| Room | Quiet, well-lit, free of interruptions |
| Power | Laptop plugged in (long exams like MCAT/IELTS drain battery) |
| Time | Uninterrupted block = exam duration + 5-minute buffer (`exam_settings.attempt_default_buffer_minutes`) |

Browser pre-flight (auto-run on attempt start) checks: browser version, mic permission, network RTT (< 300 ms target), screen size (≥ 768×600 px), storage quota (IndexedDB / localStorage for autosave). Failed pre-flight does not block practice — the student must acknowledge the warning.

## 4. Before / During / After exam instructions (§2–§4)

**Before (§2):** account setup with email + phone verification, ALO Student ID linking for the 3 free ALO attempts, terms acceptance stored in `exam_terms_acceptance`, free quota check, exam selection, instructions & disclaimer acknowledgement, microphone test, timer start.

**During (§3):** timer behaviour (no pausing past the per-section cap), 5-second autosave to IndexedDB, answer-all guidance with flag-for-review, submit-before-time rule (auto-submit fires at zero), refresh/reconnect behaviour (resume from last autosave), integrity rules (no second tab, no copy-paste for listening sections, fullscreen recommended).

**After (§4):** Smart Score Report with skill breakdowns and CEFR estimate, explanations + model answers, PDF download, counseling booking link, 7-day study plan generation, retake guidance (minimum 48–72 hours between attempts of the same exam).

## 5. Per-exam template (§6 — 32 entries)

Every one of the 32 exams has an identical entry structure under §6.x.y. The template fields per exam are:

| # | Field | Example (IELTS Academic) |
|---:|---|---|
| 1 | **What it is** | An IELTS-style academic practice test covering the four skills assessed on the real IELTS Academic module. |
| 2 | **Who should take it** | Students targeting undergraduate or postgraduate admission at institutions that accept IELTS Academic. |
| 3 | **Sections** | Listening (30 min, 40 Q), Academic Reading (60 min, 40 Q), Academic Writing Task 1 (20 min) + Task 2 (40 min), Speaking (11–14 min, 3 parts). |
| 4 | **Total duration** | ~180 minutes. |
| 5 | **Question types** | single_mcq, multi_mcq, true_false_notgiven, yes_no_notgiven, matching_headings, matching_paragraphs, sentence_completion, summary_completion, fill_blanks, short_answer, writing_task1, writing_task2, speaking_part1/2/3. |
| 6 | **Scoring style** | Band 0–9 (overall + per-skill) computed by the band scorer. |
| 7 | **How to start a mock** | Dashboard → Practice Tests → IELTS Academic → Start Digital Practice Session → read disclaimer → tick checkbox → test microphone → Start. |
| 8 | **Equipment needed** | Laptop/desktop, microphone, headphones, stable internet, quiet room. |
| 9 | **Speaking recording** | Browser captures audio via `MediaRecorder`, uploads to `public/uploads/audio/`, master copy moves to `storage/private/audio/`. Auto-graded by the Automated Practice Feedback service on 6 dimensions. |
| 10 | **Writing evaluation** | Free-text submission; word count enforced (Task 1 ≥ 150, Task 2 ≥ 250, max 750). Auto-graded by the ALO Evaluation System rubric; an ALO Practice Examiner may review in the examiner queue. |
| 11 | **Report** | Smart Score Report (PDF) with overall band, per-skill band, CEFR estimate, question review, model answers, disclaimer. |
| 12 | **Interpret estimated score** | Band 9 = expert; 7–8 = good user; 5–6 = modest/competent; below 5 = limited. Directional estimate only. |
| 13 | **After score** | Book counseling, follow 7-day study plan, retake after 48–72 hours. |
| 14 | **Official exam disclaimer** | "IELTS Academic is a registered trademark of Cambridge University Press & Assessment, the British Council, and IDP Education. ALO's 'IELTS-style academic practice test' is not affiliated with, endorsed by, or reproduced from any official IELTS administration." |

> **Note on field count.** The brief estimated a "12-field template"; the actual shipped template has **14 fields** per exam entry (the two extras are **Interpret estimated score** and **After score**, both added to make the score interpretation and retake guidance explicit for students and parents). The 12 core fields (What it is / Who should take it / Sections / Total duration / Question types / Scoring style / How to start a mock / Equipment needed / Speaking recording / Writing evaluation / Report / Official exam disclaimer) are all present on every entry.

## 6. Per-exam entry coverage

All 32 exam entries are present in §6, grouped by category:

| Category section | Count | Exam entries |
|---|---:|---|
| §6.1 English Proficiency | 11 | 6.1.1 IELTS Academic, 6.1.2 IELTS General Training, 6.1.3 IELTS UKVI, 6.1.4 PTE Academic, 6.1.5 TOEFL iBT, 6.1.6 Duolingo English Test, 6.1.7 OIETC, 6.1.8 OET, 6.1.9 LanguageCert, 6.1.10 Linguaskill, 6.1.11 ALO Placement Test |
| §6.2 Study Abroad Entrance | 6 | 6.2.1 Digital SAT, 6.2.2 ACT, 6.2.3 GRE, 6.2.4 GMAT Focus, 6.2.5 LSAT, 6.2.6 MCAT |
| §6.3 University Internal | 5 | 6.3.1 English Placement, 6.3.2 Math Placement, 6.3.3 Foundation Year Test, 6.3.4 Pre-Master Test, 6.3.5 Scholarship Test |
| §6.4 Visa / Interview | 5 | 6.4.1 UK Credibility Interview, 6.4.2 CAS Interview, 6.4.3 Visa Interview, 6.4.4 Scholarship Visa Interview, 6.4.5 Admission Interview |
| §6.5 ALO Internal | 5 | 6.5.1 ALO Counselor Check, 6.5.2 ALO Student Readiness, 6.5.3 ALO English Diagnostic, 6.5.4 ALO Document Readiness, 6.5.5 ALO Visa Readiness |
| **Total** | **32** | (verified by `grep -cE "^#### 6\." docs/EXAM_CONDUCT_GUIDE.md` = 32) |

Every entry is cross-referenced by its `type_code` (e.g., `IELTS-ACAD`, `PTE-ACAD`, `GMAT`) which matches the `exam_types.type_code` value in the database.

## 7. Public disclaimer

The guide opens with a public disclaimer block, quoted verbatim:

> **Practice exam only. Estimated score only. Not official exam result. No guarantee that questions will appear in real exam.**

This disclaimer is repeated on every public surface (landing pages, attempt start screen, report PDF, certificates, exam-conduct guide). The guide's §7 also documents the full compliance wording matrix — the same matrix reproduced in `DEVELOPMENT-GUIDELINE.md` §1.2 — listing every approved term ("ALO Estimated Score Engine", "Smart Score Report", "ALO Practice Interview Coach", "Automated Practice Feedback", "ALO Evaluation System", "Digital Practice Session", "ALO Practice Examiner", "Original exam-aligned practice") alongside the forbidden equivalents ("AI teacher", "real examiner", "official score", "fake human teacher", "real IELTS examiner", "official writing examiner", "real exam", "official examiner", "guaranteed exam question", "real exam common", "official exam prediction").

## 8. Public and admin routes for the conduct guide

The conduct guide is exposed via two routes, both defined in `app/routes.php`:

| Route | Method | Controller method | Middleware | Audience |
|---|---|---|---|---|
| `/how-exams-work` | GET | `PublicController::howExamsWork` | none (public) | Prospective students, parents, ambassadors |
| `/admin/exam-conduct` | GET | `AdminController::examConduct` | `auth` + `role:ADMIN,SUPER_ADMIN,EXAM_MANAGER,TEACHER,SUPPORT_STAFF,VIEWER` + `permission:english.tests.manage` | Admin staff |

Verified in `app/routes.php`:
- Line 52: `$r->get('/how-exams-work',  [PublicController::class, 'howExamsWork']);` (public, no middleware)
- Line 142: `$r->get('/exam-conduct',    [AdminController::class, 'examConduct'],     ['permission:english.tests.manage']);` (inside the `/admin` route group, which already applies `auth` + the role check)

The public route (`/how-exams-work`) is the student-facing version of the conduct guide: it covers equipment, before/during/after workflow, the standard disclaimer, and links to each exam landing page. The admin route (`/admin/exam-conduct`) is the staff-facing reference: it includes the same content plus internal notes about scoring rules, examiner queues, and the question review workflow.

## 9. Confirmations

| Item | Confirmed |
|---|---|
| `docs/EXAM_CONDUCT_GUIDE.md` exists at the documented path | ✅ |
| Line count: 778 | ✅ |
| Covers all 32 exams across 5 categories | ✅ (32 `#### 6.x.y` entries) |
| Per-exam template applied to every entry | ✅ (12 core fields + 2 score-interpretation fields = 14 fields per exam) |
| Equipment guide present (§1.1–§1.3) | ✅ |
| Before / During / After exam instructions present (§2–§4) | ✅ |
| Public disclaimer block at the top of the guide | ✅ |
| Compliance wording matrix in §7 | ✅ |
| Public route `/how-exams-work` defined in `app/routes.php` | ✅ (line 52, no middleware) |
| Admin route `/admin/exam-conduct` defined in `app/routes.php` | ✅ (line 142, auth + role + permission) |
| Per-exam `type_code` cross-references match `exam_types.type_code` in DB | ✅ |

---

**Exam conduct guide audit status:** COMPLETE. 778-line guide covers all 32 exams with a consistent per-exam template, equipment + before/during/after workflow, public disclaimer, and dual public/admin routes.
