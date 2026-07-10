# ALO English Test Platform — Exam Conduct Guide

**Audience:** Students, parents, ambassadors, counselors, and proctoring staff.
**Scope:** All 32 practice exams across 5 categories (English Proficiency, Study Abroad Entrance, University Internal, Visa/Interview, ALO Internal).
**Public disclaimer (read first):**

> **Practice exam only. Estimated score only. Not official exam result. No guarantee that questions will appear in real exam.**

---

## 0. How to Read This Guide

This guide has three layers:

1. **Global guidance** (§1–§5) — applies to every exam: equipment, before/during/after workflow, scoring interpretation, disclaimers.
2. **Per-exam reference** (§6) — one compact entry per exam with: what it is, who should take it, sections, time, question types, scoring style, mock-start steps, speaking/recording notes, writing-evaluation notes, report interpretation, post-score actions, official-exam disclaimer.
3. **Compliance wording** (§7) — the exact labels and disclaimers used on every public surface.

The platform supports **32 practice exams**. Every exam on ALO is labeled with the wording *"X-style practice test"* (stored in `exam_types.style_label`). No exam is, or claims to be, an official administration of any third-party test.

---

## 1. Equipment Guide

### 1.1 Recommended setup

| Item | Requirement | Notes |
|---|---|---|
| Device | Laptop or desktop recommended | Mobile (phone/tablet) supported for **practice only**; the layout is responsive but some reading passages are easier on a larger screen |
| Operating system | Windows 10+, macOS 11+, ChromeOS, recent Linux | Mobile: iOS 15+, Android 11+ |
| Browser | Latest Chrome, Edge, Firefox, or Safari | Update within the last 90 days; avoid IE and beta/dev channels |
| Internet | Stable 5 Mbps+ download / 1 Mbps+ upload | Use wired or strong Wi-Fi; avoid metered hotspot for long exams |
| Microphone | Required for any speaking practice | Built-in laptop mic works; USB headset mic is better. Browser prompts for mic permission — click "Allow" |
| Camera | Optional for most exams; recommended for interview-style practice | Used only for the *optional* Practice Interview Coach self-review; never recorded silently |
| Headphones | Recommended for listening sections | Avoids echo and prevents audio leakage in shared rooms |
| Room | Quiet, well-lit, free of interruptions | Close chat apps, mute phone notifications |
| Power | Laptop plugged in | Long exams (MCAT, IELTS) drain battery |
| Time | Uninterrupted block matching the exam duration + 5-minute buffer | Buffer is added by `exam_settings.attempt_default_buffer_minutes` |

### 1.2 Browser pre-flight (auto-run on attempt start)

The platform runs a quick pre-flight on every attempt start screen:

1. Browser version check (rejects IE; warns on out-of-date browsers).
2. Microphone permission check (for speaking exams).
3. Network RTT check (warns if > 300 ms).
4. Screen size check (warns if < 768×600 px).
5. Storage quota check (warns if IndexedDB / localStorage are unavailable — autosave needs them).

A failed pre-flight does not block practice, but the student is asked to acknowledge the warning before continuing.

### 1.3 Mobile support

- Mobile is supported for **practice only** and works best for short exams (Duolingo, Linguaskill, OIETC, ALO Diagnostic, visa interviews).
- For long reading-dense exams (IELTS Reading, SAT R&W, MCAT CARS, LSAT RC) a laptop/desktop is strongly recommended.
- Speaking recording works on mobile browsers but the timer + passage layout is more comfortable on a larger screen.

---

## 2. Before the Exam

### 2.1 Account setup (first time only)

1. **Register** at `/register` with name, email, phone, password.
2. **Verify email** — click the link in the verification email. The account stays in `status = 'pending'` until verified.
3. **Verify phone** — enter the OTP sent by SMS. Required before any attempt.
4. **ALO students**: enter your ALO Student ID (optional) to unlock the **3 free ALO attempts**. Without it, you get **1 free public attempt**. The check is server-side; the ID is validated against the ALO CRM during the hourly CRM sync.
5. **Accept terms** — the current Terms of Service (`exam_settings.terms_version`) and Privacy Policy (`privacy_version`). Stored in `exam_terms_acceptance`.

### 2.2 Check your free quota

Visit the Student Dashboard → **Free Quota** card. It shows:

- `used_free_attempts` / `max_free_attempts` (depends on ALO/public/partner/ambassador flags).
- A note that the quota is **shared across all 32 exams**.
- A "Buy paid attempt" / "Redeem voucher" button shown only when the free quota is exhausted.

The number you see is a snapshot. The authoritative check happens at attempt start — if another device used a slot in the meantime, the start call may still fail.

### 2.3 Select the exam

From the public exam catalog (`/exams`) or from the Student Dashboard → **Practice Tests**:

1. Filter by category (English / Study Abroad / University / Visa / ALO Internal) or search.
2. Open the exam landing page to read its sections, duration, scoring scale, and disclaimer.
3. Click **Start Digital Practice Session**.

### 2.4 Read the instructions and disclaimer

Every attempt start screen shows:

- The exam name and the wording *"X-style practice test"*.
- The number of sections, total questions, total duration.
- The free-quota cost of this attempt (1 slot unless already exhausted).
- The **practice disclaimer** (canonical text from `exam_settings.practice_disclaimer`):
  > *This is an original practice question created by ALO. It is not an official exam item and is not affiliated with, endorsed by, or reproduced from any official test publisher. Items will not appear in any real exam.*
- A checkbox: *"I understand this is a practice exam only and the score is an estimate."*

The Start button is disabled until the checkbox is ticked.

### 2.5 Test the microphone (speaking exams only)

- Click **Test microphone** on the start screen.
- Speak a 5-second sample; the platform plays it back.
- If no audio is captured, check the browser mic permission and the OS mic level.
- The mic test writes a `device_check` row to `exam_proctor_logs` for auditability.

### 2.6 Start the timer

Click **Start**. The timer starts on the server (`exam_mock_attempts.started_at = NOW()`) and is also displayed at the top of the screen. The server clock is authoritative — the client timer is decorative.

---

## 3. During the Exam

### 3.1 Timer

- Visible at the top of every screen, formatted `HH:MM:SS`.
- Counts down from the exam's total duration + `attempt_default_buffer_minutes` (default 5).
- When 5 minutes remain, the timer turns orange; when 1 minute remains, it turns red.
- When the timer hits zero, the attempt is auto-submitted by the server (`status = 'submitted'`, `submit_reason = 'timeout'`).

### 3.2 Autosave

- Every answer is autosaved to `exam_answers` within 2 seconds of the student changing it.
- A "Saved" indicator appears next to each question; if save fails (network drop), the indicator turns red and the student is asked to retry.
- Speaking recordings are uploaded in chunks; if the connection drops, the upload resumes when reconnected.

### 3.3 Answer all questions; flag the difficult ones

- The question palette on the right shows answered (green), flagged (orange), and unseen (gray) questions.
- **Flag for review** marks a question for revisit; flagged answers are still graded.
- Use **Previous / Next** to navigate; the palette is clickable.

### 3.4 Submit before time

- Click **Submit** at any time. A confirmation modal shows the count of unanswered questions and asks for confirmation.
- On confirm, the attempt moves to `status = 'submitted'` and scoring begins.

### 3.5 Refreshing the page

- Refreshing is allowed; the autosaved answers are restored.
- The timer continues from server time, not from the page reload — refreshing does not give extra time.
- If the browser crashes, reopen the same URL within `attempt_expiry_hours` (24h) and resume.

### 3.6 Integrity

- Tab switches are logged in `exam_proctor_logs` if `exam_settings.proctoring_enabled = true`. The student sees a warning at `proctor_tab_switch_threshold` (default 3) tab switches. Practice exams do not auto-fail on tab switches — they are practice.
- Camera snapshots (only if the student opted into the Practice Interview Coach self-review) are stored locally and never uploaded without explicit per-attempt consent.

---

## 4. After the Exam

### 4.1 View the Smart Score Report

After submission, the platform renders the **Smart Score Report**:

- Overall **estimated score** in the exam's native scale (Band 0-9, 0-120, 400-1600, etc.).
- A **CEFR estimate** (A1–C2) for English-proficiency exams.
- **Skill breakdown** bars (Listening / Reading / Writing / Speaking, or Quant / Verbal / etc.).
- **Question review** — each question, the student's answer, the correct answer, and an explanation.
- The practice disclaimer is printed on page 1.

The report is generated by `app/Services/PdfReportService.php` and stored in `storage/private/reports/<attempt_code>.pdf`.

### 4.2 Review explanations

Every question has an `explanation` field authored by ALO's content team. Read each one, even for questions you got right — the explanation teaches the underlying skill.

### 4.3 Download the PDF

- Click **Download Smart Score Report (PDF)**.
- The download is a signed URL (`DownloadController::serve()`) with a 60-second TTL and IP pin.
- The disclaimer is on page 1.

### 4.4 Book a counseling session

- Click **Book counseling** on the report.
- Pick a slot from the ALO counselor calendar; the booking writes to `exam_consultation_bookings` and syncs to the ALO CRM via the hourly cron.
- Counseling sessions are with ALO advisors, not with official examiners.

### 4.5 Follow the study plan

The Student Dashboard → **Study Plan** shows a 7-day plan generated from your weakest skills in the last attempt(s). Each day has 2–3 short tasks (read a passage, practice a question type, watch a 5-min video).

### 4.6 Retake

- If you still have free quota, retake is one click.
- If free quota is exhausted, redeem a voucher or pay the per-attempt fee (`paid_attempt_price_usd`).
- Each retake is a new attempt with a new `attempt_code`. The previous report remains available.

---

## 5. How to Interpret the Estimated Score

### 5.1 What it is

The score is an **estimate** produced by `app/Services/ScoringRules.php` using the scoring rule JSON stored on the practice set (`exam_practice_sets.scoring_rule_json`). The rule is one of:

- **band** — IELTS-style 0–9 in 0.5 increments (Listening, Reading, Writing, Speaking, Overall).
- **scaled** — PTE 10–90, TOEFL 0–120, SAT 400–1600, GRE 130–170, GMAT 205–805, MCAT 472–528, ACT 1–36, OET A–E.
- **percent** — University placement / scholarship tests (0–100).
- **rubric** — Visa/interview and ALO internal exams (Pass/Fail with sub-criteria scores).
- **cefr** — A1–C2 for English-placement and diagnostic exams.

### 5.2 What it is not

- It is **not** an official test result.
- It is **not** a guarantee of the score you will receive on a real administration.
- It is **not** comparable across exam families (an IELTS Band 7 is not "the same" as a TOEFL 100 — only the official concordance tables published by the test owners are authoritative).
- It is **not** a substitute for diagnostic feedback from a qualified teacher.

### 5.3 How to use it

Use the estimate to:

1. Track your own progress over multiple attempts.
2. Identify the skill (L/R/W/S, or Quant/Verbal/etc.) that is pulling your overall down.
3. Decide whether to book a counseling session or buy a paid attempt for targeted practice.

Do **not** use the estimate to:

1. Claim proficiency on a visa or university application.
2. Compare yourself to a friend who took a different exam family.
3. Substitute for an official test sitting.

---

## 6. Per-Exam Reference (all 32)

> Each entry uses the same 12-field template. "Sections" and "Question types" are sourced from `exam_sections` and `exam_question_types`; durations and counts from `exam_sections.duration_minutes` / `exam_sections.question_count`. The disclaimer text is the same for every exam and is reproduced once at the end of the section.

### 6.1 English Proficiency (11 exams)

#### 6.1.1 IELTS Academic — `IELTS-ACAD`
- **What it is:** An IELTS-style academic practice test covering the four skills assessed on the real IELTS Academic module.
- **Who should take it:** Students targeting undergraduate or postgraduate admission at institutions that accept IELTS Academic; students planning UKVI Academic sub-category practice.
- **Sections:** Listening (30 min, 40 Q), Academic Reading (60 min, 40 Q), Academic Writing Task 1 (20 min) + Task 2 (40 min), Speaking (11–14 min, 3 parts).
- **Total duration:** ~180 minutes.
- **Question types:** single_mcq, multi_mcq, true_false_notgiven, yes_no_notgiven, matching_headings, matching_paragraphs, matching_sentence_endings, sentence_completion, summary_completion, fill_blanks, short_answer, writing_task1, writing_task2, speaking_part1, speaking_part2, speaking_part3.
- **Scoring style:** Band 0–9 (overall + per-skill) computed by the band scorer.
- **How to start a mock:** Dashboard → Practice Tests → IELTS Academic → Start Digital Practice Session → read disclaimer → tick checkbox → test microphone → Start.
- **Equipment needed:** Laptop/desktop, microphone, headphones (for listening), stable internet, quiet room.
- **Speaking recording:** Browser captures audio via `MediaRecorder`, uploads chunks to `public/uploads/audio/`, master copy moves to `storage/private/audio/`. Auto-graded by the Automated Practice Feedback service on 6 dimensions (fluency, pronunciation, lexical resource, grammar, coherence, task response).
- **Writing evaluation:** Free-text submission; word count enforced (Task 1 ≥150, Task 2 ≥250, max 750). Auto-graded by the ALO Evaluation System rubric; an ALO Practice Examiner may review and add comments in the examiner queue.
- **Report:** Smart Score Report (PDF) with overall band, per-skill band, CEFR estimate, question review, model answers, disclaimer.
- **Interpret estimated score:** Band 9 = expert; 7–8 = good user; 5–6 = modest/competent; below 5 = limited. Treat as a directional estimate only.
- **After score:** Book counseling, follow 7-day study plan, retake after 48–72 hours to measure progress.
- **Official exam disclaimer:** IELTS Academic is a registered trademark of Cambridge University Press & Assessment, the British Council, and IDP Education. ALO's "IELTS-style academic practice test" is not affiliated with, endorsed by, or reproduced from any official IELTS administration.

#### 6.1.2 IELTS General Training — `IELTS-GEN`
- **What it is:** An IELTS-style General Training practice test for migration and work contexts.
- **Who should take it:** Candidates preparing for migration to the UK, Canada, Australia, or New Zealand under General Training requirements.
- **Sections:** Listening (30 min), General Training Reading (60 min), General Writing Task 1 (letter, 20 min) + Task 2 (essay, 40 min), Speaking (11–14 min).
- **Total duration:** ~165 minutes.
- **Question types:** as IELTS Academic but Reading uses everyday sources (notices, ads, workplace documents); Writing Task 1 is a letter (`writing_task1_general`).
- **Scoring style:** Band 0–9.
- **How to start a mock:** same flow as 6.1.1, pick "IELTS General Training".
- **Equipment needed:** same as 6.1.1.
- **Speaking recording:** same as 6.1.1.
- **Writing evaluation:** same as 6.1.1 but Task 1 uses the letter rubric (tone, purpose, audience).
- **Report:** same shape as 6.1.1.
- **Interpret estimated score:** Band 4 = limited; 5 = modest; 6 = competent; 7+ = good. Migration often requires 6.0–6.5 per skill.
- **After score:** retake after 1 week; book counseling if speaking or writing is below target.
- **Official exam disclaimer:** Same as 6.1.1.

#### 6.1.3 IELTS for UKVI — `IELTS-UKVI`
- **What it is:** An IELTS UKVI-style practice test mirroring the Secure English Language Test (SELT) format used for UK visas.
- **Who should take it:** Students applying for UK student visas requiring a SELT; candidates who need to practice the in-person SELT format.
- **Sections:** Same four skills as IELTS Academic; speaking is conducted face-to-face in real SELT administration (ALO practice is recorded, not face-to-face).
- **Total duration:** ~180 minutes.
- **Question types:** same as IELTS Academic.
- **Scoring style:** Band 0–9; CEFR-mapped (B1 / B2 / C1) per Common European Framework.
- **How to start a mock:** same flow, pick "IELTS for UKVI".
- **Equipment needed:** same as 6.1.1; camera optional for the Practice Interview Coach self-review of the speaking part.
- **Speaking recording:** same as 6.1.1; the SELT face-to-face format is approximated by recording + Automated Practice Feedback.
- **Writing evaluation:** same as 6.1.1.
- **Report:** Band + CEFR annotation (e.g. "Band 5.5 — CEFR B2").
- **Interpret estimated score:** UKVI Academic requires B2 (Band 5.5) for degree-level; UKVI A1/B1 levels apply to family/spouse visas.
- **After score:** If below the visa threshold, book a counselor and follow the 7-day plan focused on the weakest skill.
- **Official exam disclaimer:** IELTS for UKVI is administered by IELTS SELT Consortium. ALO's "IELTS UKVI-style practice test" is not an official SELT administration and produces no UKVI-recognized score.

#### 6.1.4 PTE Academic — `PTE-ACAD`
- **What it is:** A PTE-style academic practice test for the computer-based Pearson Test of English.
- **Who should take it:** Students applying to Australian, UK, NZ, and Canadian institutions that accept PTE Academic.
- **Sections:** Speaking & Writing (54–67 min), Reading (29–30 min), Listening (30–43 min).
- **Total duration:** ~120 minutes.
- **Question types:** read_aloud, repeat_sentence, describe_image, retell_lecture, summarize_spoken_text, summarize_written_text, essay, reading_fill_blanks, reorder_paragraphs, listening_fill_blanks, write_from_dictation, multiple-choice (single_mcq, multi_mcq).
- **Scoring style:** Scaled 10–90 (overall + communicative skills + enabling skills).
- **How to start a mock:** Dashboard → Practice Tests → PTE Academic → Start.
- **Equipment needed:** Microphone required (speaking), headphones recommended (listening).
- **Speaking recording:** Same pipeline as 6.1.1; the Automated Practice Feedback service scores pronunciation, oral fluency, and content.
- **Writing evaluation:** Word count enforced; auto-graded on content, form, grammar, vocabulary, spelling.
- **Report:** Scaled 10–90 + sub-skill bars + question review.
- **Interpret estimated score:** 65+ is competitive for most universities; 79+ for top-tier.
- **After score:** Practice the lowest enabling skill (e.g. spelling or pronunciation).
- **Official exam disclaimer:** PTE Academic is a trademark of Pearson Education. ALO's "PTE-style academic practice test" is not affiliated with or endorsed by Pearson.

#### 6.1.5 TOEFL iBT — `TOEFL-IBT`
- **What it is:** A TOEFL iBT-style practice test for the internet-based Test of English as a Foreign Language.
- **Who should take it:** Students applying to US and Canadian universities, and other institutions that accept TOEFL iBT.
- **Sections:** Reading (54–72 min), Listening (41–57 min), Speaking (17 min), Writing (50 min, integrated + academic discussion).
- **Total duration:** ~117 minutes.
- **Question types:** single_mcq, multi_mcq, sentence_completion, inference, central_idea, vocabulary_in_context, summarize_spoken_text, independent_speaking, integrated_writing, academic_discussion.
- **Scoring style:** Scaled 0–120 (4 sections × 30).
- **How to start a mock:** Dashboard → Practice Tests → TOEFL iBT → Start.
- **Equipment needed:** Microphone, headphones, stable internet.
- **Speaking recording:** Browser records 45–60-second responses; auto-graded on delivery, language use, topic development.
- **Writing evaluation:** Integrated (read + listen + write) and academic discussion; auto-graded on content, organization, grammar, vocabulary.
- **Report:** 0–120 + per-section bars + question review.
- **Interpret estimated score:** 100+ is competitive for top US universities; 79+ for many graduate programs.
- **After score:** Practice the integrated writing task if score < 24.
- **Official exam disclaimer:** TOEFL is a trademark of Educational Testing Service (ETS). ALO's "TOEFL iBT-style practice test" is not affiliated with or endorsed by ETS.

#### 6.1.6 Duolingo English Test — `DUOLINGO`
- **What it is:** A Duolingo-style adaptive practice test for the Duolingo English Test.
- **Who should take it:** Students applying to institutions that accept DET (many US, UK, and Canadian universities).
- **Sections:** Literacy, Comprehension, Conversation, Production (single adaptive section, ~60 min).
- **Total duration:** ~60 minutes.
- **Question types:** read_and_select, listen_and_type, complete_the_sentence, interactive_reading, describe_image, writing_sample, speaking_sample, fill_blanks.
- **Scoring style:** Scaled 10–160 (with subscores: Literacy, Comprehension, Conversation, Production).
- **How to start a mock:** Dashboard → Practice Tests → Duolingo English Test → Start.
- **Equipment needed:** Microphone, camera (optional, for the speaking sample self-review), stable internet.
- **Speaking recording:** 30–90 second samples; auto-graded on fluency, content, complexity.
- **Writing evaluation:** 3–5 minute writing sample; auto-graded on grammar, lexical diversity, task relevance.
- **Report:** 10–160 + 4 subscores + question review.
- **Interpret estimated score:** 105+ for many US universities; 120+ for top-tier.
- **After score:** Practice production (writing/speaking) if subscore is the lowest.
- **Official exam disclaimer:** Duolingo English Test is a trademark of Duolingo, Inc. ALO's "Duolingo-style practice test" is not affiliated with or endorsed by Duolingo.

#### 6.1.7 OIETC — `OIETC`
- **What it is:** An OIETC-style practice test for the Online International English Test Certificate.
- **Who should take it:** Students applying to UK universities that accept OIETC as an alternative to IELTS/TOEFL.
- **Sections:** Reading, Listening, Writing, Speaking (4 sections, ~90 min total).
- **Total duration:** ~90 minutes.
- **Question types:** single_mcq, fill_blanks, short_answer, writing_task2, speaking_part1, vocabulary_in_context.
- **Scoring style:** CEFR A1–C1.
- **How to start a mock:** Dashboard → Practice Tests → OIETC → Start.
- **Equipment needed:** Microphone, headphones.
- **Speaking recording:** 2–3 minute Part 1 response; auto-graded.
- **Writing evaluation:** 250+ word essay; auto-graded.
- **Report:** CEFR level + question review.
- **Interpret estimated score:** B2 is typical for undergraduate entry; C1 for postgraduate.
- **After score:** Practice writing if below B2.
- **Official exam disclaimer:** OIETC is administered by participating UK universities. ALO's "OIETC-style practice test" is not affiliated with any official OIETC administration.

#### 6.1.8 Occupational English Test (OET) — `OET`
- **What it is:** An OET-style practice test for healthcare professionals (medicine, nursing, dentistry, pharmacy, etc.).
- **Who should take it:** Healthcare professionals seeking registration in the UK, US, Australia, Ireland, Singapore, etc.
- **Sections:** Listening (45 min), Reading (60 min), Writing (45 min, profession-specific), Speaking (20 min, role-play).
- **Total duration:** ~165 minutes.
- **Question types:** single_mcq, multi_mcq, fill_blanks, short_answer, writing_task1 (profession-specific letter), speaking_part2 (role-play).
- **Scoring style:** A–E (A = 350–500, B = 320–340, C+ = 300–310, C = 270–290, D = 200–260, E = 100–190).
- **How to start a mock:** Dashboard → Practice Tests → OET → select profession (Medicine / Nursing / etc.) → Start.
- **Equipment needed:** Microphone, headphones.
- **Speaking recording:** Role-play with a pre-recorded interlocutor; auto-graded on intelligibility, fluency, appropriateness, resources of grammar/expression.
- **Writing evaluation:** Profession-specific letter (referral, discharge, transfer); auto-graded on purpose, content, conciseness/clarity, genre/style, organization, language.
- **Report:** A–E grade per skill + numeric (0–500) + question review.
- **Interpret estimated score:** Grade B (350+) is required by most regulators.
- **After score:** Practice role-plays if speaking below B.
- **Official exam disclaimer:** OET is a trademark of Cambridge Boxhill Language Assessment. ALO's "OET-style practice test" is not affiliated with or endorsed by the OET Centre.

#### 6.1.9 LanguageCert International ESOL — `LANGCERT`
- **What it is:** A LanguageCert-style practice test for the International ESOL qualification (A1–C2).
- **Who should take it:** Students applying for UK visas (LanguageCert SELT) and academic admission.
- **Sections:** Listening, Reading, Writing, Speaking.
- **Total duration:** ~165 minutes.
- **Question types:** single_mcq, fill_blanks, short_answer, writing_task1, writing_task2, speaking_part1, speaking_part2, speaking_part3.
- **Scoring style:** CEFR A1–C2 with Pass/High Pass/Distinction per level.
- **How to start a mock:** Dashboard → Practice Tests → LanguageCert → Start.
- **Equipment needed:** Microphone, headphones.
- **Speaking recording:** Multi-part spoken assessment; auto-graded.
- **Writing evaluation:** Two writing tasks (letter + essay); auto-graded.
- **Report:** CEFR + per-skill performance + question review.
- **Interpret estimated score:** B2 for degree-level study; C1 for postgraduate.
- **After score:** Focus on the weakest skill.
- **Official exam disclaimer:** LanguageCert is a trademark of PeopleCert. ALO's "LanguageCert-style practice test" is not affiliated with or endorsed by PeopleCert.

#### 6.1.10 Linguaskill (Bulats) — `LINGUASKILL`
- **What it is:** A Linguaskill-style adaptive practice test for the Cambridge Linguaskill (formerly BULATS) assessment.
- **Who should take it:** Students and professionals needing a fast English placement for academic or workplace contexts; students preparing for the Linguaskill Business or General variants.
- **Sections:** Reading & Listening (adaptive), Writing, Speaking.
- **Total duration:** ~90 minutes (adaptive).
- **Question types:** single_mcq, multi_mcq, fill_blanks, complete_the_sentence, interactive_reading, listening_fill_blanks, write_from_dictation, essay, speaking_sample.
- **Scoring style:** CEFR A1–C2 + Cambridge English Scale score (82–230).
- **How to start a mock:** Dashboard → Practice Tests → Linguaskill → Start.
- **Equipment needed:** Microphone, headphones.
- **Speaking recording:** Short spoken responses; auto-graded.
- **Writing evaluation:** Email + essay; auto-graded.
- **Report:** CEFR + scale score + question review.
- **Interpret estimated score:** B2 (160–170) for academic; C1 (180+) for professional.
- **After score:** Practice writing if subscore below target.
- **Official exam disclaimer:** Linguaskill and BULATS are trademarks of Cambridge University Press & Assessment. ALO's "Linguaskill-style practice test" is not affiliated with or endorsed by Cambridge.

#### 6.1.11 ALO Placement Test — `ALO-PLACE`
- **What it is:** ALO's internal English placement test, used to recommend the right course level for new ALO students.
- **Who should take it:** Newly enrolled ALO students; students considering ALO courses who want a diagnostic before enrolling.
- **Sections:** Reading, Listening, Grammar & Vocabulary, Writing, Speaking.
- **Total duration:** ~90 minutes.
- **Question types:** single_mcq, fill_blanks, vocabulary_in_context, sentence_completion, writing_task2, speaking_part1.
- **Scoring style:** CEFR A1–C2.
- **How to start a mock:** Dashboard → Practice Tests → ALO Placement → Start. ALO students see this card first.
- **Equipment needed:** Microphone, headphones.
- **Speaking recording:** Same pipeline; auto-graded.
- **Writing evaluation:** 200+ word essay; auto-graded.
- **Report:** CEFR + recommended ALO course level + question review.
- **Interpret estimated score:** A2 → Foundation; B1 → Pre-sessional; B2 → Academic English; C1 → Advanced.
- **After score:** ALO counselor recommends a course; student enrolls via the ALO CRM.
- **Official exam disclaimer:** ALO Placement Test is an ALO-internal diagnostic. It is not a CEFR certification; it is a placement estimate.

### 6.2 Study Abroad Entrance (6 exams)

#### 6.2.1 Digital SAT — `SAT`
- **What it is:** An SAT-style adaptive practice test for the College Board's Digital SAT.
- **Who should take it:** Students applying to US undergraduate programs.
- **Sections:** Reading & Writing Module 1 + Module 2 (adaptive, 64 min total), Math Module 1 + Module 2 (adaptive, 70 min total).
- **Total duration:** ~134 minutes.
- **Question types:** single_mcq, central_idea, inference, vocabulary_in_context, standard_english, grid_in, text_completion.
- **Scoring style:** Scaled 400–1600 (two section scores 200–800 each).
- **How to start a mock:** Dashboard → Practice Tests → Digital SAT → Start.
- **Equipment needed:** Laptop/desktop, calculator (in-browser calculator is provided).
- **Speaking recording:** N/A.
- **Writing evaluation:** Standard English conventions items (auto-graded).
- **Report:** 400–1600 + per-section bars + question review.
- **Interpret estimated score:** 1400+ for top-tier US universities; 1200+ for many state universities.
- **After score:** Practice the lowest module (Math or R&W); retake weekly.
- **Official exam disclaimer:** SAT is a trademark of the College Board. ALO's "SAT-style practice test" is not affiliated with, endorsed by, or reproduced from any official SAT administration.

#### 6.2.2 ACT — `ACT`
- **What it is:** An ACT-style practice test for the ACT college admissions exam.
- **Who should take it:** Students applying to US undergraduate programs who prefer the ACT format.
- **Sections:** English (45 min), Math (60 min), Reading (35 min), Science (35 min).
- **Total duration:** ~175 minutes (+ optional Writing, not included in this practice).
- **Question types:** standard_english, problem_solving, central_idea, inference, data_interpretation, single_mcq.
- **Scoring style:** Scaled 1–36 (composite + per-section).
- **How to start a mock:** Dashboard → Practice Tests → ACT → Start.
- **Equipment needed:** Laptop/desktop, calculator (for Math).
- **Speaking recording:** N/A.
- **Writing evaluation:** N/A in this practice.
- **Report:** 1–36 composite + per-section bars + question review.
- **Interpret estimated score:** 27+ for competitive universities; 33+ for top-tier.
- **After score:** Practice the weakest section.
- **Official exam disclaimer:** ACT is a trademark of ACT, Inc. ALO's "ACT-style practice test" is not affiliated with or endorsed by ACT.

#### 6.2.3 GRE General Test — `GRE`
- **What it is:** A GRE-style practice test for the ETS GRE General Test.
- **Who should take it:** Applicants to US graduate programs (master's, PhD, business school).
- **Sections:** Analytical Writing (30 min), Verbal Reasoning Module 1 + 2 (adaptive, 41 min), Quantitative Reasoning Module 1 + 2 (adaptive, 47 min).
- **Total duration:** ~165 minutes.
- **Question types:** text_completion, sentence_equivalence, central_idea, inference, quantitative_comparison, problem_solving, data_interpretation, issue_task, argument_task.
- **Scoring style:** Verbal 130–170, Quant 130–170, Analytical Writing 0–6.
- **How to start a mock:** Dashboard → Practice Tests → GRE → Start.
- **Equipment needed:** Laptop/desktop, calculator (in-browser).
- **Speaking recording:** N/A.
- **Writing evaluation:** Issue task auto-graded on analytical writing, development, organization, language.
- **Report:** 130–170 + 0–6 + per-section bars + question review.
- **Interpret estimated score:** 320+ combined (V+Q) for many programs; 330+ for top-tier.
- **After score:** Practice the weakest of V/Q.
- **Official exam disclaimer:** GRE is a trademark of Educational Testing Service (ETS). ALO's "GRE-style practice test" is not affiliated with or endorsed by ETS.

#### 6.2.4 GMAT Focus Edition — `GMAT`
- **What it is:** A GMAT-style practice test for the GMAC GMAT Focus Edition.
- **Who should take it:** Applicants to MBA and business master's programs.
- **Sections:** Quantitative (45 min), Verbal (45 min), Data Insights (45 min).
- **Total duration:** ~135 minutes.
- **Question types:** problem_solving, data_sufficiency, critical_reasoning, sentence_correction, data_insights, data_interpretation.
- **Scoring style:** Scaled 205–805 (total) + per-section.
- **How to start a mock:** Dashboard → Practice Tests → GMAT Focus → Start.
- **Equipment needed:** Laptop/desktop, calculator (for Data Insights).
- **Speaking recording:** N/A.
- **Writing evaluation:** N/A (AWA removed in Focus Edition).
- **Report:** 205–805 + per-section + question review.
- **Interpret estimated score:** 645+ for top-20 MBA; 685+ for top-5.
- **After score:** Drill weak section with sectional practice.
- **Official exam disclaimer:** GMAT is a trademark of the Graduate Management Admission Council. ALO's "GMAT-style practice test" is not affiliated with or endorsed by GMAC.

#### 6.2.5 LSAT — `LSAT`
- **What it is:** An LSAT-style practice test for the Law School Admission Test.
- **Who should take it:** Applicants to US and Canadian law schools.
- **Sections:** Logical Reasoning (two sections, 70 min), Reading Comprehension (35 min), Analytical Reasoning / Logic Games (35 min, optional in current administrations; included here for full coverage).
- **Total duration:** ~175 minutes.
- **Question types:** logical_reasoning, analytical_reasoning, central_idea, inference, single_mcq.
- **Scoring style:** Scaled 120–180.
- **How to start a mock:** Dashboard → Practice Tests → LSAT → Start.
- **Equipment needed:** Laptop/desktop, scratch paper.
- **Speaking recording:** N/A.
- **Writing evaluation:** LSAT Writing (separate, not included in this practice).
- **Report:** 120–180 + per-section accuracy + question review.
- **Interpret estimated score:** 160+ for many law schools; 170+ for top-tier.
- **After score:** Drill logic games if weak.
- **Official exam disclaimer:** LSAT is a trademark of the Law School Admission Council. ALO's "LSAT-style practice test" is not affiliated with or endorsed by LSAC.

#### 6.2.6 MCAT — `MCAT`
- **What it is:** An MCAT-style practice test for the AAMC Medical College Admission Test.
- **Who should take it:** Applicants to US, Canadian, and Australian medical schools.
- **Sections:** Chemical & Physical Foundations (95 min), Critical Analysis & Reasoning Skills / CARS (90 min), Biological & Biochemical Foundations (95 min), Psychological, Social & Biological Foundations (95 min).
- **Total duration:** ~375 minutes (with breaks; ALO practice is delivered in one continuous block by default; the student can pause between sections).
- **Question types:** single_mcq, inference, central_idea, problem_solving, data_interpretation.
- **Scoring style:** Scaled 472–528 (118–132 per section).
- **How to start a mock:** Dashboard → Practice Tests → MCAT → Start. The long duration is flagged at the start screen.
- **Equipment needed:** Laptop/desktop, stable power, snacks, water.
- **Speaking recording:** N/A.
- **Writing evaluation:** N/A.
- **Report:** 472–528 + per-section bars + question review.
- **Interpret estimated score:** 510+ for many MD programs; 515+ for top-tier.
- **After score:** Practice CARS (often the bottleneck for STEM majors).
- **Official exam disclaimer:** MCAT is a trademark of the Association of American Medical Colleges. ALO's "MCAT-style practice test" is not affiliated with or endorsed by the AAMC.

### 6.3 University Internal (5 exams)

#### 6.3.1 English Placement — `ENG-PLACE`
- **What it is:** A university English placement-style practice test used by partner universities to place incoming students into the right ESL/academic English level.
- **Who should take it:** Students entering a partner university; students who want a quick English level check before applying.
- **Sections:** Reading, Listening, Grammar, Writing.
- **Total duration:** ~60 minutes.
- **Question types:** single_mcq, fill_blanks, vocabulary_in_context, sentence_completion, writing_task2.
- **Scoring style:** CEFR A1–C2.
- **How to start a mock:** Dashboard → Practice Tests → English Placement → Start.
- **Equipment needed:** Laptop/desktop, headphones.
- **Speaking recording:** N/A (most partner placements assess speaking separately).
- **Writing evaluation:** 200-word essay; auto-graded.
- **Report:** CEFR + recommended course level + question review.
- **Interpret estimated score:** A2 → pre-sessional; B2 → direct entry; C1 → exempt.
- **After score:** Discuss with the partner university admissions team.
- **Official exam disclaimer:** "University English placement-style practice" is not affiliated with any specific university placement program.

#### 6.3.2 Math Placement — `MATH-PLACE`
- **What it is:** A university math placement-style practice test covering algebra, pre-calculus, and calculus basics.
- **Who should take it:** Students entering a partner university who need to be placed into the right math course.
- **Sections:** Algebra, Pre-Calculus, Calculus.
- **Total duration:** ~90 minutes.
- **Question types:** single_mcq, numeric_answer, grid_in, problem_solving.
- **Scoring style:** Percent 0–100.
- **How to start a mock:** Dashboard → Practice Tests → Math Placement → Start.
- **Equipment needed:** Laptop/desktop, calculator (in-browser), scratch paper.
- **Speaking recording:** N/A.
- **Writing evaluation:** N/A.
- **Report:** 0–100 + per-topic bars + question review.
- **Interpret estimated score:** 70%+ for calculus placement; 50–70% for pre-calculus; below 50% for algebra refresher.
- **After score:** Review the missed topics and retake.
- **Official exam disclaimer:** "University math placement-style practice" is not affiliated with any specific university math placement program.

#### 6.3.3 Foundation Year Test — `FOUNDATION`
- **What it is:** A foundation program-style practice test for students entering a foundation year before undergraduate study.
- **Who should take it:** Students who do not yet meet direct entry requirements and are taking a foundation year.
- **Sections:** Academic English, Study Skills, Critical Thinking, Quantitative Reasoning.
- **Total duration:** ~120 minutes.
- **Question types:** single_mcq, short_answer, writing_task2, problem_solving, vocabulary_in_context.
- **Scoring style:** CEFR A1–C2 + percent.
- **How to start a mock:** Dashboard → Practice Tests → Foundation Year → Start.
- **Equipment needed:** Laptop/desktop, headphones.
- **Speaking recording:** N/A.
- **Writing evaluation:** Short essay; auto-graded.
- **Report:** CEFR + percent + question review.
- **Interpret estimated score:** B1 with 60%+ to progress to undergraduate.
- **After score:** Discuss with foundation-year tutor.
- **Official exam disclaimer:** "Foundation program-style practice test" is not affiliated with any specific foundation program.

#### 6.3.4 Pre-Master Test — `PRE-MASTER`
- **What it is:** A pre-masters program-style practice test for students entering a pre-master's pathway.
- **Who should take it:** Students preparing for postgraduate study who need a pre-master's refresher.
- **Sections:** Academic English, Critical Reading, Quantitative Reasoning, Writing.
- **Total duration:** ~120 minutes.
- **Question types:** single_mcq, central_idea, inference, writing_task2, problem_solving, vocabulary_in_context.
- **Scoring style:** CEFR + percent.
- **How to start a mock:** Dashboard → Practice Tests → Pre-Master → Start.
- **Equipment needed:** Laptop/desktop.
- **Speaking recording:** N/A.
- **Writing evaluation:** 300-word essay; auto-graded.
- **Report:** CEFR + percent + question review.
- **Interpret estimated score:** B2+ with 65%+ to progress to master's.
- **After score:** Review the missed topics with the pre-master's tutor.
- **Official exam disclaimer:** "Pre-masters program-style practice test" is not affiliated with any specific pre-master's program.

#### 6.3.5 Scholarship Test — `SCHOLARSHIP`
- **What it is:** A university scholarship-style practice test used by partner universities as a scholarship qualifier.
- **Who should take it:** Students applying for partner-university scholarships.
- **Sections:** Quantitative Aptitude, Verbal Reasoning, Essay Writing.
- **Total duration:** ~90 minutes.
- **Question types:** single_mcq, problem_solving, central_idea, vocabulary_in_context, essay.
- **Scoring style:** Percent 0–100.
- **How to start a mock:** Dashboard → Practice Tests → Scholarship Test → Start.
- **Equipment needed:** Laptop/desktop.
- **Speaking recording:** N/A.
- **Writing evaluation:** 500-word essay; auto-graded.
- **Report:** 0–100 + per-section bars + essay feedback + question review.
- **Interpret estimated score:** 75%+ for competitive scholarships; 85%+ for full scholarships.
- **After score:** Submit the official scholarship application separately (this practice score does not count toward the application).
- **Official exam disclaimer:** "University scholarship-style practice test" is not affiliated with any specific scholarship program.

### 6.4 Visa / Interview (5 exams)

#### 6.4.1 UK Credibility Interview — `UK-CRED`
- **What it is:** A UK credibility interview-style practice for the UK student visa credibility interview.
- **Who should take it:** International students applying for a UK student visa (Student route) who may be called for a credibility interview.
- **Sections:** Credibility Interview (5–10 questions on study plan, finances, post-study plans).
- **Total duration:** ~30 minutes.
- **Question types:** credibility_interview, speaking_part1.
- **Scoring style:** Rubric Pass/Fail with sub-criteria (clarity, consistency, credibility, English fluency).
- **How to start a mock:** Dashboard → Practice Tests → UK Credibility Interview → Start. The Practice Interview Coach guides you.
- **Equipment needed:** Microphone, camera (optional), quiet room.
- **Speaking recording:** Browser captures each response; auto-graded by the Practice Interview Coach rubric.
- **Writing evaluation:** N/A.
- **Report:** Pass/Fail + per-criterion bars + transcript + model answers.
- **Interpret estimated score:** Pass with 70%+ on each criterion is the target for a real credibility interview.
- **After score:** Practice the lowest criterion (often "post-study plans" clarity).
- **Official exam disclaimer:** "UK credibility interview-style practice" is not affiliated with UK Visas and Immigration (UKVI). ALO does not guarantee any interview outcome.

#### 6.4.2 CAS Interview — `CAS`
- **What it is:** A CAS interview-style practice for the Confirmation of Acceptance for Studies interview conducted by some UK universities.
- **Who should take it:** Students who have received a CAS from a UK university that requires an interview.
- **Sections:** CAS Interview (course details, university choice, career plan).
- **Total duration:** ~30 minutes.
- **Question types:** credibility_interview, speaking_part1.
- **Scoring style:** Rubric Pass/Fail.
- **How to start a mock:** Dashboard → Practice Tests → CAS Interview → Start.
- **Equipment needed:** Microphone, camera (optional).
- **Speaking recording:** Same as 6.4.1.
- **Writing evaluation:** N/A.
- **Report:** Pass/Fail + per-criterion bars + transcript.
- **Interpret estimated score:** Pass with 70%+ on course knowledge and career plan.
- **After score:** Review your offer letter and CAS details before the real interview.
- **Official exam disclaimer:** "CAS interview-style practice" is not affiliated with any specific UK university interview process.

#### 6.4.3 Visa Interview — `VISA-INT`
- **What it is:** A general visa interview-style practice for non-UK student visa interviews (US, Canada, Australia, Ireland, etc.).
- **Who should take it:** Students preparing for a non-UK student visa interview at an embassy or consulate.
- **Sections:** Visa Interview (study plan, finances, ties to home country, post-study plans).
- **Total duration:** ~30 minutes.
- **Question types:** credibility_interview, speaking_part1.
- **Scoring style:** Rubric Pass/Fail.
- **How to start a mock:** Dashboard → Practice Tests → Visa Interview → select country context → Start.
- **Equipment needed:** Microphone, camera (optional).
- **Speaking recording:** Same as 6.4.1.
- **Writing evaluation:** N/A.
- **Report:** Pass/Fail + per-criterion bars + transcript.
- **Interpret estimated score:** Pass with 70%+ on each criterion.
- **After score:** Review your visa application documents and practice the weakest criterion.
- **Official exam disclaimer:** "Visa interview-style practice" is not affiliated with any embassy, consulate, or immigration authority.

#### 6.4.4 Scholarship Visa Interview — `VISA-SCHOLAR`
- **What it is:** A scholarship visa interview-style practice for students whose visa is funded by a scholarship (e.g. Chevening, Commonwealth, university-specific).
- **Who should take it:** Students whose visa application is tied to a scholarship.
- **Sections:** Scholarship Visa Interview (scholarship terms, study plan, return commitment, finances).
- **Total duration:** ~30 minutes.
- **Question types:** credibility_interview, speaking_part1.
- **Scoring style:** Rubric Pass/Fail.
- **How to start a mock:** Dashboard → Practice Tests → Scholarship Visa Interview → Start.
- **Equipment needed:** Microphone.
- **Speaking recording:** Same as 6.4.1.
- **Writing evaluation:** N/A.
- **Report:** Pass/Fail + per-criterion bars + transcript.
- **Interpret estimated score:** Pass with 75%+ on return commitment.
- **After score:** Re-read your scholarship award letter.
- **Official exam disclaimer:** "Scholarship visa interview-style practice" is not affiliated with any scholarship body or immigration authority.

#### 6.4.5 Admission Interview — `ADMISSION`
- **What it is:** An admission interview-style practice for university admission interviews (undergraduate or postgraduate).
- **Who should take it:** Students invited to an admission interview by a university.
- **Sections:** Admission Interview (motivation, fit, strengths, scenario questions).
- **Total duration:** ~30 minutes.
- **Question types:** credibility_interview, speaking_part1, speaking_part3.
- **Scoring style:** Rubric Pass/Fail.
- **How to start a mock:** Dashboard → Practice Tests → Admission Interview → Start.
- **Equipment needed:** Microphone, camera (optional).
- **Speaking recording:** Same as 6.4.1.
- **Writing evaluation:** N/A.
- **Report:** Pass/Fail + per-criterion bars + transcript.
- **Interpret estimated score:** Pass with 75%+ on motivation and fit.
- **After score:** Research the program before the real interview.
- **Official exam disclaimer:** "Admission interview-style practice" is not affiliated with any specific university admission process.

### 6.5 ALO Internal (5 exams)

#### 6.5.1 ALO Counselor Check — `ALO-COUNSEL`
- **What it is:** A counselor-led readiness checkpoint practice used by ALO counselors with their students.
- **Who should take it:** ALO students preparing for a counselor review meeting.
- **Sections:** Study Plan Review, Document Readiness, Mock Interview.
- **Total duration:** ~45 minutes.
- **Question types:** credibility_interview, speaking_part1, short_answer.
- **Scoring style:** Rubric Pass/Fail.
- **How to start a mock:** ALO counselor assigns the check; the student opens it from their dashboard.
- **Equipment needed:** Microphone, camera (optional).
- **Speaking recording:** Same as 6.4.1.
- **Writing evaluation:** N/A.
- **Report:** Pass/Fail + per-criterion bars + counselor notes.
- **Interpret estimated score:** Pass with 70%+ to proceed to the next ALO milestone.
- **After score:** Schedule a meeting with the assigned ALO counselor.
- **Official exam disclaimer:** ALO Counselor Check is an ALO-internal practice. It is not affiliated with any external examination body.

#### 6.5.2 ALO Student Readiness — `ALO-READINESS`
- **What it is:** An end-to-end readiness assessment covering academic English, study plan, and interview.
- **Who should take it:** ALO students nearing their application deadline.
- **Sections:** Academic English, Study Plan, Mock Interview, Document Review.
- **Total duration:** ~45 minutes.
- **Question types:** single_mcq, writing_task2, credibility_interview, speaking_part1.
- **Scoring style:** Rubric Pass/Fail + CEFR.
- **How to start a mock:** Dashboard → Practice Tests → ALO Student Readiness → Start.
- **Equipment needed:** Laptop/desktop, microphone.
- **Speaking recording:** Same as 6.4.1.
- **Writing evaluation:** 250-word essay; auto-graded.
- **Report:** Pass/Fail + CEFR + per-criterion bars + question review.
- **Interpret estimated score:** Pass with 75%+ across all criteria to be considered "ready".
- **After score:** ALO counselor follows up within 48 hours.
- **Official exam disclaimer:** ALO Student Readiness is an ALO-internal practice. It is not affiliated with any external examination body.

#### 6.5.3 ALO English Diagnostic — `ALO-DIAG`
- **What it is:** A diagnostic English test for new ALO students to baseline their level.
- **Who should take it:** Newly enrolled ALO students at the start of their program.
- **Sections:** Reading, Listening, Grammar & Vocabulary, Writing, Speaking.
- **Total duration:** ~60 minutes.
- **Question types:** single_mcq, fill_blanks, vocabulary_in_context, writing_task2, speaking_part1.
- **Scoring style:** CEFR A1–C2.
- **How to start a mock:** Dashboard → Practice Tests → ALO English Diagnostic → Start.
- **Equipment needed:** Microphone, headphones.
- **Speaking recording:** Same as 6.1.1.
- **Writing evaluation:** 200-word essay; auto-graded.
- **Report:** CEFR + recommended ALO course level + question review.
- **Interpret estimated score:** A2 → Foundation; B1 → Pre-sessional; B2 → Academic English; C1 → Advanced.
- **After score:** ALO counselor enrolls you in the recommended course.
- **Official exam disclaimer:** ALO English Diagnostic is an ALO-internal diagnostic. It is not a CEFR certification.

#### 6.5.4 ALO Document Readiness — `ALO-DOC`
- **What it is:** A document completeness and authenticity check practice used by ALO counselors.
- **Who should take it:** ALO students preparing their application document pack.
- **Sections:** Passport Check, Academic Documents, Financial Documents, English Proficiency Evidence, Statement of Purpose.
- **Total duration:** ~30 minutes.
- **Question types:** short_answer, single_mcq.
- **Scoring style:** Rubric Pass/Fail.
- **How to start a mock:** Dashboard → Practice Tests → ALO Document Readiness → Start.
- **Equipment needed:** Laptop/desktop; document upload (PDF/JPG) enabled.
- **Speaking recording:** N/A.
- **Writing evaluation:** N/A (SoP reviewed separately by counselor).
- **Report:** Pass/Fail per document category + counselor notes.
- **Interpret estimated score:** All categories must Pass to proceed.
- **After score:** Submit the document pack to the ALO counselor.
- **Official exam disclaimer:** ALO Document Readiness is an ALO-internal check. It is not affiliated with any visa or admissions authority.

#### 6.5.5 ALO Visa Readiness — `ALO-VISA-READY`
- **What it is:** A visa pack readiness review before the student submits their visa application.
- **Who should take it:** ALO students with a confirmed offer and CAS/I-20/CoE, preparing to file a visa application.
- **Sections:** Visa Pack Review, Mock Visa Interview, Financial Evidence Check.
- **Total duration:** ~45 minutes.
- **Question types:** credibility_interview, speaking_part1, short_answer.
- **Scoring style:** Rubric Pass/Fail.
- **How to start a mock:** Dashboard → Practice Tests → ALO Visa Readiness → Start.
- **Equipment needed:** Microphone, camera (optional).
- **Speaking recording:** Same as 6.4.1.
- **Writing evaluation:** N/A.
- **Report:** Pass/Fail + per-criterion bars + counselor notes.
- **Interpret estimated score:** Pass with 75%+ on each criterion to file the visa.
- **After score:** ALO counselor signs off on the visa pack submission.
- **Official exam disclaimer:** ALO Visa Readiness is an ALO-internal review. It is not affiliated with any immigration authority and does not guarantee a visa outcome.

---

## 7. Compliance Wording (used on every public surface)

- Every exam card, landing page, attempt start screen, score report, and certificate carries the wording *"X-style practice test"* (where X is the exam family: IELTS / PTE / TOEFL / Duolingo / SAT / GRE / GMAT / LSAT / MCAT / ACT / OET / etc.).
- Every score report includes: *"Practice estimate only. Not an official exam result."*
- Every certificate includes the `certificates_disclaimer`: *"Certificates issued by ALO English Test Platform acknowledge completion of practice only and are not official language proficiency certifications."*
- Every practice set includes the `practice_disclaimer`: *"This is an original practice question created by ALO. It is not an official exam item and is not affiliated with, endorsed by, or reproduced from any official test publisher. Items will not appear in any real exam."*
- Public-facing wording uses: **ALO Practice Examiner**, **Digital Practice Session**, **Smart Score Report**, **ALO Evaluation System**, **Practice Interview Coach**, **Automated Practice Feedback**, **Estimated Score Engine**.
- Public-facing wording **never** uses: "AI teacher", "fake human teacher", "real examiner", "guaranteed exam question", "real exam common", "official exam prediction".
- No claim of official partnership with IELTS, PTE, TOEFL, Duolingo, SAT, GRE, GMAT, LSAT, MCAT, ACT, OET, LanguageCert, Linguaskill, OIETC, or any other test publisher is ever made.

---

## 8. Public Disclaimer (canonical, repeated for emphasis)

> **Practice exam only. Estimated score only. Not official exam result. No guarantee that questions will appear in real exam.**
>
> The ALO English Test Platform provides original, exam-aligned practice tests for self-assessment and skill development. Scores are estimates produced by the ALO Estimated Score Engine and the Automated Practice Feedback service. They are not official exam results and are not affiliated with, endorsed by, or reproduced from any official test publisher. Practice items will not appear in any real exam administration.

---

End of `docs/EXAM_CONDUCT_GUIDE.md`.
