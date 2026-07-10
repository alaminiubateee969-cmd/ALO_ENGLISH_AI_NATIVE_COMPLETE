# ALO English Test Platform — Question Bank Guide

**Audience:** Admins, exam managers, content authors, reviewers, ALO Practice Examiners.
**Scope:** Authoring, reviewing, versioning, importing, exporting, and auditing the ALO question bank.
**Compliance reminder:** Every item in the bank MUST be **100% original** content authored or licensed by ALO. No official exam items, no copyrighted third-party passages, no leaked material. See §4.

---

## 1. Question Bank Overview

The ALO question bank is the single source of truth for every practice item on the platform. It powers:

- the **universal CBT engine** (`app/Services/ExamEngine.php`);
- the **practice-set assembly** workflow (`exam_practice_sets`, `exam_practice_set_sections`, `exam_practice_set_questions`);
- the **weekly content pipeline** (`scripts/weekly_question_update.php`);
- the **examiner review queue** for writing and speaking items (`exam_writing_submissions`, `exam_speaking_sessions`);
- the **Smart Score Report** explanations (`exam_questions.explanation`).

Tables involved (full schema in `database/install.sql`):

| Table | Purpose |
|---|---|
| `exam_question_types` | The catalog of 58 supported response formats (see §3). |
| `exam_questions` | The master question rows. One row per question. |
| `exam_question_options` | Options for MCQ-type questions (correctness, sort order, optional feedback). |
| `exam_question_media` | Linked media (passage text, image prompt, audio script, audio file URL, model answer). |
| `exam_question_versions` | Snapshots of every published version of a question (see §7). |
| `exam_question_review_queue` | Per-question review state (draft / in_review / approved / rejected / published). |
| `exam_practice_set_questions` | Many-to-many link between a practice set's section and a question. |

Each `exam_questions` row carries:

- a unique `question_code` (e.g. `Q-IELTS-R-001`, `Q-SAT-M-003`, `Q-VISA-002`);
- `exam_type_id` (1–32, foreign key into `exam_types`);
- `section_id` (foreign key into `exam_sections`);
- `question_type_id` (foreign key into `exam_question_types`);
- `difficulty` (`easy`, `medium`, `hard`, `advanced`);
- `tags` (comma-separated skill labels, see §5);
- `prompt` (the question stem — Markdown supported);
- `explanation` (teaches the concept; rendered in the Smart Score Report);
- `time_seconds` (recommended seconds to answer);
- `points` (default 1);
- `is_active` (1 = live, 0 = retired);
- `is_published` (1 = visible to students, 0 = draft or in review);
- `created_by`, `reviewed_by`, `approved_by` (audit trail);
- type-specific answer fields (see §3).

---

## 2. How to Add a Question

### 2.1 Via the Admin UI (recommended for hand-authored questions)

1. **Log in** to `/admin` with an account that has the `questions.create` permission.
2. Navigate to **Question Bank → New Question**.
3. Pick the **exam type** (1–32). The section dropdown filters to that exam's sections.
4. Pick the **section** (e.g. *Academic Reading*, *Verbal Reasoning*, *Credibility Interview*).
5. Pick the **question type** (see §3). The form re-renders to show the type-specific answer fields.
6. Fill in:
   - `question_code` — auto-suggested based on exam + section + next sequence; editable but must be unique.
   - `prompt` — Markdown supported. Long passages go in the **Passage** field (`exam_question_media.passage_text`) and are referenced from the prompt with `{{passage}}`.
   - `difficulty` — easy / medium / hard / advanced.
   - `tags` — multi-select from the tag catalog (§5). Custom tags require admin approval.
   - `explanation` — Markdown; teach the concept, don't just restate the answer.
   - `time_seconds` — recommended answer time.
7. Fill the **type-specific answer fields** (see §3 for the full mapping).
8. Attach **media** (optional): passage text, image prompt description, audio script, audio file URL, model answer.
9. Save as **Draft**. The question enters `exam_question_review_queue` with `state = 'draft'`.
10. (Author) Click **Submit for review**. The state moves to `in_review` and an ALO Practice Examiner is auto-assigned based on the exam type.

### 2.2 Via CSV import

Use the **Question Bank → Import → CSV** screen. Template (downloadable from the same screen):

```csv
question_code,exam_type,section,question_type,difficulty,tags,prompt,explanation,time_seconds,options,correct_index,correct_answer,model_answer,passage,audio_script
Q-IELTS-R-099,IELTS-ACAD,ACAD_READING,single_mcq,medium,"academic-reading;inference","What is the writer's main claim about urban green spaces?","The passage frames green spaces as infrastructure, not decoration — see paragraph 2.",90,"They are essential urban infrastructure.|They are aesthetic luxuries.|They reduce property values.|They are difficult to maintain.",0,,,"Urban green spaces...",""
```

Rules:

- Header row is required and must match the template exactly.
- Use `|` to separate options inside the `options` cell.
- `correct_index` is 0-based for MCQs; empty for non-MCQ.
- `correct_answer` is used for `fill_blanks`, `short_answer`, `numeric_answer`, `write_from_dictation`.
- `model_answer` is used for writing/speaking types.
- `passage` and `audio_script` are stored in `exam_question_media` and linked to the question.
- Empty optional fields are left blank (no `NULL` literal).
- All rows enter `exam_question_review_queue` with `state = 'draft'`.

### 2.3 Via JSON import

Use the **Question Bank → Import → JSON** screen. The JSON schema mirrors the CSV columns plus optional nested `media` and `options` arrays:

```json
[
  {
    "question_code": "Q-IELTS-R-099",
    "exam_type": "IELTS-ACAD",
    "section": "ACAD_READING",
    "question_type": "single_mcq",
    "difficulty": "medium",
    "tags": ["academic-reading", "inference"],
    "prompt": "What is the writer's main claim about urban green spaces?",
    "explanation": "The passage frames green spaces as infrastructure, not decoration — see paragraph 2.",
    "time_seconds": 90,
    "options": [
      {"text": "They are essential urban infrastructure.", "is_correct": true},
      {"text": "They are aesthetic luxuries.", "is_correct": false},
      {"text": "They reduce property values.", "is_correct": false},
      {"text": "They are difficult to maintain.", "is_correct": false}
    ],
    "media": {
      "passage_text": "Urban green spaces..."
    }
  }
]
```

JSON is preferred over CSV when:

- options have per-option feedback (`feedback` field);
- a question has multiple media attachments (passage + image prompt + audio script);
- the import is generated by a script (the `gen_question_sets.py` generator emits SQL directly, but JSON is the supported import format for ad-hoc imports).

### 2.4 Via the programmatic generator (for batch placeholders)

`scripts/gen_question_sets.py` emits `database/question_sets_seed.sql` with 320 practice sets + sample original questions. Re-run only when the exam catalog changes; do NOT use it to author real content — its output is explicitly marked as `[Original placeholder prompt]`.

---

## 3. The 58 Supported Question Types

Stored in `exam_question_types`. Grouped here by response format and grading behavior. Each row has `is_graded_auto` (1 = auto-graded by `ScoringRules`, 0 = needs examiner/AI review).

### 3.1 Objective — single-select MCQ (auto-graded)

| `type_code` | `type_name` | Used by |
|---|---|---|
| `single_mcq` | Single Best Answer MCQ | All exams (default) |
| `true_false_notgiven` | True / False / Not Given | IELTS Reading |
| `yes_no_notgiven` | Yes / No / Not Given | IELTS Reading |
| `central_idea` | Central Idea / Main Idea | SAT, ACT, GRE, LSAT, MCAT, all reading |
| `inference` | Inference | TOEFL, SAT, LSAT, MCAT, all reading |
| `vocabulary_in_context` | Vocabulary in Context | SAT, ACT, Placement |
| `standard_english` | Standard English Conventions | SAT Writing |
| `logical_reasoning` | Logical Reasoning | LSAT |
| `analytical_reasoning` | Analytical Reasoning (Logic Games) | LSAT |
| `critical_reasoning` | Critical Reasoning | GMAT |
| `sentence_correction` | Sentence Correction | GMAT |
| `problem_solving` | Problem Solving (Quant) | GMAT, SAT, ACT, GRE |
| `data_interpretation` | Data Interpretation | GRE, GMAT, ACT Science, MCAT |

**Answer fields:** `options` (array in `exam_question_options`), `correct_index` on the correct option row.

### 3.2 Objective — multi-select MCQ (auto-graded)

| `type_code` | `type_name` | Used by |
|---|---|---|
| `multi_mcq` | Multiple Correct MCQ | All exams |
| `sentence_equivalence` | Sentence Equivalence | GRE |
| `read_and_select` | Read and Select | Duolingo |

**Answer fields:** `options` (array); `is_correct = 1` on every correct option. Partial credit is configurable per practice set (see `scoring_rule_json`).

### 3.3 Objective — matching (auto-graded)

| `type_code` | `type_name` | Used by |
|---|---|---|
| `matching_headings` | Matching Headings | IELTS Reading |
| `matching_paragraphs` | Matching Information | IELTS Reading |
| `matching_sentence_endings` | Matching Sentence Endings | IELTS Reading |
| `matching_pairs` | Matching Pairs | All |

**Answer fields:** `matching_pairs` JSON in `exam_question_media.matching_pairs` — `{"left": ["A","B","C"], "right": ["ii","iv","i"], "correct_mapping": {"A":"ii","B":"iv","C":"i"}}`.

### 3.4 Objective — text / fill / cloze (auto-graded)

| `type_code` | `type_name` | Used by |
|---|---|---|
| `sentence_completion` | Sentence Completion | IELTS Reading |
| `summary_completion` | Summary Completion | IELTS Reading |
| `fill_blanks` | Fill in the Blanks | All |
| `short_answer` | Short Answer | IELTS, all |
| `reading_fill_blanks` | Reading Fill in the Blanks (dropdown) | PTE |
| `listening_fill_blanks` | Listening Fill in the Blanks | PTE |
| `write_from_dictation` | Write From Dictation | PTE |
| `interactive_reading` | Interactive Reading | Duolingo |
| `complete_the_sentence` | Complete the Sentence (Cloze) | Duolingo |
| `listen_and_type` | Listen and Type | Duolingo |

**Answer fields:** `correct_answer` (string; for multi-blank, a `||`-separated list or a JSON object of `{blank_index: "answer"}`).

### 3.5 Objective — numeric / quantitative (auto-graded)

| `type_code` | `type_name` | Used by |
|---|---|---|
| `grid_in` | Numeric Grid-In | SAT |
| `numeric_answer` | Numeric Answer (with tolerance) | All math |
| `quantitative_comparison` | Quantitative Comparison | GRE |
| `data_sufficiency` | Data Sufficiency | GMAT |

**Answer fields:** `numeric_answer` for `grid_in` and `numeric_answer`; for `quantitative_comparison` the `options` array is fixed (`A: Quantity A is greater`, `B: Quantity B is greater`, `C: The two quantities are equal`, `D: The relationship cannot be determined`), and the question carries `quantity_a` + `quantity_b` text. For `data_sufficiency` the options are fixed A–E and the correct option is in `correct_index`.

### 3.6 Objective — reorder / ordering (auto-graded)

| `type_code` | `type_name` | Used by |
|---|---|---|
| `reorder_paragraphs` | Reorder Paragraphs | PTE |

**Answer fields:** `reorder_items` (array) + `correct_order` (array of indexes).

### 3.7 Writing — examiner/AI graded (`is_graded_auto = 0`)

| `type_code` | `type_name` | Used by |
|---|---|---|
| `essay` | Essay | All exams |
| `writing_task1` | Writing Task 1 (Academic — chart/diagram) | IELTS Academic |
| `writing_task1_general` | Writing Task 1 (General — letter) | IELTS General |
| `writing_task2` | Writing Task 2 | IELTS Academic/General, OIETC, Placement |
| `integrated_writing` | Integrated Writing | TOEFL |
| `academic_discussion` | Academic Discussion | TOEFL |
| `writing_sample` | Writing Sample | Duolingo |
| `issue_task` | Issue Task | GRE |
| `argument_task` | Argument Task | GRE |
| `summarize_spoken_text` | Summarize Spoken Text | PTE |
| `summarize_written_text` | Summarize Written Text (one sentence) | PTE |

**Answer fields:** `model_answer` (a high-scoring sample) in `exam_question_media`. Word-count limits enforced from `exam_settings.writing_word_count_min` / `writing_word_count_max` (default 150–750). Graded by `ScoringRules::rubric()` against the rubric in the practice set's `scoring_rule_json`.

### 3.8 Speaking — examiner/AI graded (`is_graded_auto = 0`)

| `type_code` | `type_name` | Used by |
|---|---|---|
| `read_aloud` | Read Aloud | PTE |
| `repeat_sentence` | Repeat Sentence | PTE |
| `describe_image` | Describe Image | PTE, Duolingo |
| `retell_lecture` | Retell Lecture | PTE |
| `speaking_part1` | Speaking Part 1 | IELTS, OIETC, LanguageCert, Placement |
| `speaking_part2` | Speaking Part 2 (Cue Card) | IELTS, LanguageCert |
| `speaking_part3` | Speaking Part 3 | IELTS, LanguageCert |
| `independent_speaking` | Independent Speaking | TOEFL |
| `speaking_sample` | Speaking Sample | Duolingo |
| `credibility_interview` | Credibility Interview Prompt | Visa/Interview, ALO Internal |

**Answer fields:** `model_answer` (a structured hint or 60-second sample transcript). Audio is uploaded by the CBT engine (`public/uploads/audio/`), master copy in `storage/private/audio/`. Graded by `Automated Practice Feedback` on 6 dimensions: fluency, pronunciation, lexical resource, grammar, coherence, task response.

### 3.9 Adding a new question type

1. Add a row to `exam_question_types` via `database/seed.sql` (or `database/migrations/<timestamp>_add_qtype_<code>.sql`).
2. Extend the response renderer in `public/assets/js/exam-engine.js` (`AnswerRenderer` switch).
3. Extend the scorer in `app/Services/ScoringRules.php` (`grade()` switch).
4. Add an admin form section in `app/Views/admin/questions/_form_<type>.php`.
5. Add a PHPUnit test case for the new type in `tests/Unit/ScoringRulesTest.php`.
6. Update `docs/QUESTION_BANK_GUIDE.md` (this file) with the new type in §3.

---

## 4. Originality Rules (non-negotiable)

1. **No official exam items.** Every passage, audio script, prompt, distractor, model answer, chart, and image must be **100% original** content authored or licensed by ALO. Do not paraphrase, summarize, or "rephrase" official exam items — that is still a derivative work.
2. **No copyrighted third-party content.** Do not copy passages from books, news articles, blogs, or other test-prep publishers. If you need a real-world source for a chart or data table, you must either (a) use a public-domain source and credit it, or (b) generate the data yourself and label it as illustrative.
3. **No leaked material.** If a contributor reports that they have seen a question on a real exam, the question must NOT be added — even if reworded. Discard and document the report in `exam_audit_logs`.
4. **No "real exam common questions" lists.** Do not curate lists of "commonly appearing" items. Every item must be standalone original practice.
5. **No implication of official affiliation.** Wording on every question, explanation, and report MUST use the labels in §11 of `DEVELOPMENT-GUIDELINE.md` ("X-style practice test", "Original exam-aligned practice", "Not official exam content", "No guarantee of real-exam repetition").
6. **Attribution.** If a passage draws on a real (public-domain or licensed) source, attribute it in the explanation. If a chart uses real public-domain data, attribute the source in the chart caption.
7. **Source tracking.** Every question must have `source = 'original'` in `exam_questions.source` (default). If `source = 'licensed'`, the `license_url` and `license_note` fields must be populated.
8. **Author identity.** `created_by` must point to a real user ID; anonymous authorship is forbidden.
9. **Review must confirm originality.** The reviewer signs off on the `originality_confirmed` flag in `exam_question_review_queue` before forwarding to admin approval. The reviewer's ID is recorded.
10. **Audit.** Every question's author, reviewer, approver, and edit history is preserved in `exam_audit_logs` and `exam_question_versions`. Any question found post-publish to violate originality rules is **immediately retired** (`is_active = 0`), removed from all published practice sets, and a post-mortem is opened.

---

## 5. Difficulty Levels and Tags

### 5.1 Difficulty

`exam_questions.difficulty` is one of:

| Level | Definition | Typical CEFR (for English) |
|---|---|---|
| `easy` | Foundational; tests recall and basic comprehension. | A2–B1 |
| `medium` | Standard practice; tests application and analysis. | B1–B2 |
| `hard` | Advanced; tests evaluation and inference. | B2–C1 |
| `advanced` | Stretch; tests nuanced reasoning and synthesis. | C1–C2 |

Every practice set rotates difficulty across its 10 sets (sets 1–10 cycle through easy/medium/hard/advanced by `(set_n - 1) % 4`) so that the published catalog always offers a difficulty gradient per exam.

### 5.2 Tag catalog

Tags live in `exam_questions.tags` (comma-separated). The canonical tag vocabulary:

**Skill tags (English):**
- `grammar`, `vocabulary`, `coherence`, `fluency`, `pronunciation`
- `academic-reading`, `listening-detail`, `listening-gist`, `inference`, `main-idea`
- `task-response`, `lexical-resource`, `grammatical-range`, `cohesion`

**Skill tags (Quant):**
- `algebra`, `geometry`, `arithmetic`, `statistics`, `data-analysis`, `probability`
- `problem-solving`, `quant-comparison`, `data-sufficiency`

**Skill tags (Interview/Visa):**
- `credibility`, `study-plan`, `finances`, `career-plan`, `ties-to-home-country`

**Cognitive tags (Bloom):**
- `recall`, `comprehension`, `application`, `analysis`, `evaluation`, `synthesis`

**Topic tags:** unlimited, but must be reviewed before publishing (e.g. `urban-green-spaces`, `coral-reefs`, `remote-work`, `sleep-science`).

Custom tags require admin approval via the **Question Bank → Tags → Approve** screen. Approved tags appear in the tag multi-select on the question form.

### 5.3 Tag-based practice

Students can filter practice sets by tag (`/student/practice-tests?tag=inference`). The Student Dashboard → **Skill breakdown** chart aggregates scores by tag, so the student can see which skills need work.

---

## 6. Review Workflow

Every question moves through five states in `exam_question_review_queue`. The state machine is enforced by `QuestionBankService::transition()`.

```
   ┌─────────┐   submit for review    ┌──────────┐   approve          ┌──────────┐   publish    ┌───────────┐
   │  draft  │ ─────────────────────▶ │ in_review│ ────────────────▶ │ approved │ ───────────▶ │ published │
   └─────────┘                         └──────────┘                   └──────────┘              └───────────┘
        ▲                                    │                              │                          │
        │             reject                 │             reject           │                          │ retire
        └────────────────────────────────────┴──────────────────────────────┘                          ▼
                                                                                                                                 ┌──────────┐
                                                                                                                                 │ retired  │
                                                                                                                                 └──────────┘
```

### 6.1 Draft

- Default state on creation (UI, CSV, JSON, or generator).
- Visible only to the author and admins.
- Author can edit any field.
- Author cannot self-approve (RBAC: `questions.review` ≠ `questions.create`).

### 6.2 In review

- Author clicks **Submit for review**.
- An ALO Practice Examiner is auto-assigned by `exam_type_id` (configured in `exam_settings.review_assignment_strategy`, default: round-robin among active examiners for that exam).
- The reviewer sees the question in their **Review queue** at `/examiner`.
- Reviewer actions:
  - **Approve** → state moves to `approved`; `reviewed_by` is recorded; `originality_confirmed = 1`.
  - **Reject** → state moves back to `draft`; reviewer adds a comment; author is notified by email.
  - **Request changes** → state stays in `in_review`; reviewer adds a comment; author edits and resubmits.

### 6.3 Approved

- The reviewer has signed off; the question waits for an admin to publish.
- An admin (with `questions.publish` permission) sees the question in **Question Bank → Pending publication**.
- Admin can:
  - **Publish** → state moves to `published`; `approved_by` is recorded; `is_published = 1`; a snapshot is written to `exam_question_versions` (see §7).
  - **Reject** → state moves back to `in_review` (re-review required) with a comment.
- By default (`exam_settings.auto_publish_after_approval = false`), auto-publish is **off**. The admin gate is intentional — it is the final compliance checkpoint.

### 6.4 Published

- The question is visible to students through practice sets that include it.
- Any subsequent edit creates a new draft version (see §7); the published version is not changed until the new version is published.
- A published question can be **retired** (`is_active = 0`); retired questions are excluded from new practice sets but remain visible in past attempts' reports.

### 6.5 Retired

- Retired questions stay in the bank for audit and historical report rendering, but cannot be added to new practice sets.
- Retirement is reversible (admin only); on un-retire, the question returns to `published` state.

### 6.6 SLA targets

| Transition | Target SLA |
|---|---|
| Draft → In review | 1 business day (author responsibility) |
| In review → Approved/Rejected | 2 business days (reviewer) |
| Approved → Published | 1 business day (admin) |
| Published → retired (compliance issue) | Within 4 hours of report |

---

## 7. Versioning

Every published version of a question is snapshotted in `exam_question_versions`:

| Column | Purpose |
|---|---|
| `question_id` | FK to `exam_questions.id` |
| `version` | 1, 2, 3, … |
| `snapshot_json` | Full copy of the question row + options + media at the moment of publication |
| `published_at` | When this version became live |
| `published_by` | Admin user ID |
| `superseded_at` | When a newer version was published (NULL = current) |

When a published question is edited:

1. The edit is made on a **new draft version** (the live row is not touched).
2. The draft goes through the review workflow again.
3. On publish, the current version's `superseded_at` is set, and a new `exam_question_versions` row is inserted.
4. Past attempts continue to render against the version they were taken against (so the student's report never silently changes).
5. The audit log records the diff between versions.

This means:

- A student who took a mock in January sees the January version in their report, even if the question was updated in March.
- An admin can roll back to any previous version via **Question Bank → Versions → Roll back**.

---

## 8. CSV / JSON Import

### 8.1 CSV import

- **Where:** Admin → Question Bank → Import → CSV.
- **Required columns:** `question_code, exam_type, section, question_type, difficulty, tags, prompt, explanation, time_seconds`.
- **Type-specific columns:** `options`, `correct_index`, `correct_answer`, `numeric_answer`, `quantity_a`, `quantity_b`, `reorder_items`, `correct_order`, `matching_pairs`, `model_answer`, `passage`, `audio_script`, `image_prompt`.
- **Separator inside a cell:** `|` for arrays (options, tags); `||` for multi-blank answers; JSON object string for `matching_pairs`.
- **Encoding:** UTF-8 with BOM.
- **Max rows per import:** 500. Larger imports must be split.
- **Pre-flight checks (run before any DB write):**
  - header validation;
  - `question_code` uniqueness (within the file AND against the DB);
  - `exam_type` validity (must exist in `exam_types`);
  - `section` validity (must exist in `exam_sections` for the given `exam_type`);
  - `question_type` validity (must exist in `exam_question_types`);
  - `difficulty` enum check;
  - tag spelling check (warns on unknown tags; does not block);
  - for MCQ types: `options` non-empty, `correct_index` in range;
  - for `numeric_answer` / `grid_in`: `correct_answer` parses as a number;
  - for `quantitative_comparison`: `quantity_a` and `quantity_b` both present;
  - for `reorder_paragraphs`: `reorder_items` and `correct_order` arrays equal length;
  - for writing/speaking types: `model_answer` non-empty.
- **Failure behavior:** the import is atomic — if any row fails pre-flight, no rows are written. A downloadable error report lists every failing row and the reason.
- **Post-import:** every imported row enters `exam_question_review_queue` with `state = 'draft'`. The author is set to the importing admin; the import batch ID is recorded in `exam_audit_logs` for traceability.

### 8.2 JSON import

- **Where:** Admin → Question Bank → Import → JSON.
- **Schema:** see §2.3 for the example.
- **Validation:** same as CSV, plus structural JSON validation (arrays, required keys, types).
- **Nested fields supported:** `options[].feedback`, `media.image_prompt`, `media.audio_url`, `media.matching_pairs` (as a JSON object inside the JSON file).
- **Bulk limit:** 500 questions per file.

### 8.3 Export

- Admin → Question Bank → Export → CSV or JSON.
- Filters: by exam type, section, difficulty, tag, state (draft/in_review/approved/published/retired), author, date range.
- Export respects RBAC: an examiner exporting their review queue gets only their assigned questions.
- Exported files are written to `storage/private/exports/` and served via `DownloadController::serve()` with a 60-second signed URL.

---

## 9. Quality Checks

Before a question can be submitted for review, `QuestionBankService::qualityCheck()` runs the following. The check is also re-run on publish.

### 9.1 Structural checks

- `prompt` is non-empty and at least 20 characters.
- `explanation` is non-empty and at least 40 characters.
- For MCQ types: at least 3 options, exactly one correct (for `single_mcq`) or at least two correct (for `multi_mcq` / `sentence_equivalence`).
- Options have no duplicate text.
- Distractors are not trivially wrong (e.g. "All of the above" with no other correct option, or "None of the above" as the only correct option — both flagged).
- For writing/speaking: `model_answer` meets the minimum word/character count for the type.
- For `quantitative_comparison`: `quantity_a` and `quantity_b` are both present and not identical strings.
- For `reorder_paragraphs`: at least 3 items.
- For `matching_pairs`: at least 3 pairs.

### 9.2 Content quality checks

- **Readability:** the prompt's Flesch-Kincaid grade is within ±2 of the target CEFR for the exam (configured in `exam_types.target_cefr`). Out-of-range prompts warn (do not block).
- **Grammar:** the prompt is run through a grammar checker (LanguageTool CLI). Errors block submission; warnings (passive voice, long sentences) do not.
- **Spelling:** the prompt is spell-checked against the platform dictionary (en-US by default; en-GB for IELTS UKVI). Misspellings block.
- **Answer-key validation:** for objective types, the correct answer is re-derived from the explanation by a regex/keyword matcher (e.g. the explanation must contain the correct option's text). Mismatches block.
- **Plausibility of distractors:** each distractor must share at least one keyword with the correct option OR the passage (so distractors are not obviously wrong). Distractors that share zero keywords with the source material are flagged.
- **Time realism:** `time_seconds` is within the configured range for the question type (e.g. 30–180s for IELTS Reading MCQ). Out-of-range values warn.

### 9.3 Bias and sensitivity checks

- A sensitivity lexicon (slurs, stereotypes, sensitive historical references) is run against every question, explanation, and option. Hits block submission and notify the compliance admin.
- A name-balance check warns if all names in a question set are from a single demographic (the platform's name pool is balanced across regions and genders).

### 9.4 Difficulty calibration

- For objective types, after 100 student attempts, the platform computes the actual difficulty (fraction correct) and compares it to the declared `difficulty`. Misalignment > 0.25 (e.g. declared `easy` but actual < 0.4 correct) flags the question for recalibration.
- Recalibration is a non-breaking edit — only `difficulty` changes; no version bump.

---

## 10. Duplicate Detection

`QuestionBankService::duplicateCheck()` runs on every draft save and on every import row. It compares the new question against the entire bank using three signals:

1. **Exact text hash.** `sha1(prompt_normalized)` where `prompt_normalized` is the prompt lowercased, with whitespace collapsed and punctuation removed. An exact hash match blocks submission.
2. **Fuzzy text similarity.** A trigram Jaccard similarity ≥ 0.85 against any existing prompt blocks submission. A similarity between 0.70 and 0.85 warns and requires the reviewer to confirm.
3. **Answer-key hash.** `sha1(correct_answer_normalized)` for objective types. A match against a different prompt blocks submission (the same answer under a different question is suspicious).

### 10.1 Cross-source duplicate check

The check also compares against:

- every **retired** question (to prevent re-adding a known-duplicate);
- every **imported external corpus** flagged by admins (e.g. a corpus of known official exam items — used only to **prevent** accidental duplication, never to **add** official content);
- every other question in the **same import batch** (to catch intra-batch duplicates).

### 10.2 Resolution

- A blocked duplicate must be re-authored. The author can request a "duplicate override" from the compliance admin, who reviews the case and either approves the override (with a written justification in `exam_audit_logs`) or rejects it.
- A warning-level duplicate is forwarded to the reviewer with the similar question linked; the reviewer decides.

---

## 11. Audit and Reporting

### 11.1 Audit log

Every question lifecycle event writes to `exam_audit_logs`:

- `created` (with full question JSON)
- `submitted_for_review` (author, reviewer assignment)
- `approved` / `rejected` (reviewer, comment)
- `published` / `unpublished` (admin, version number)
- `edited` (diff between old and new JSON)
- `retired` / `unretired` (admin, reason)
- `duplicate_blocked` (with the matched question's code)
- `quality_check_failed` (with the failing check name)
- `originality_violation_reported` (compliance admin only)

The audit log is read-only (no UPDATE or DELETE in the application layer; DB-level triggers prevent it).

### 11.2 Reports

Admin → Reports → Question Bank offers:

- **Bank health** (count by state, count by difficulty, count by tag, count by exam type, count by reviewer, average time-to-publish).
- **Originality report** (every question with `source = 'original'` and the originality confirmation chain).
- **Difficulty calibration report** (declared vs. actual difficulty for items with ≥100 attempts).
- **Stale content report** (published questions not edited in 12 months; flagged for refresh).
- **Reviewer performance** (per reviewer: SLA adherence, reject rate, override rate).
- **Export** of any report to CSV or PDF.

### 11.3 Compliance sign-off

Before each release, `scripts/generate_audit_reports.php` produces a **Question Bank Compliance PDF** in `storage/private/reports/audit/`. It lists:

- the total bank size;
- the count of original-confirmed items;
- the count of licensed items (with license URLs);
- any items flagged for originality review;
- the reviewer and approver chain for every published item.

The compliance admin signs this PDF before the release tag is pushed.

---

## 12. Quick Reference — Author's Checklist

Before clicking **Submit for review**, confirm:

- [ ] The question is 100% original (or licensed with attribution). No official exam item, no copyrighted third-party content.
- [ ] The `question_code` is unique and follows the convention `Q-<EXAM>-<SECTION>-<NNN>`.
- [ ] The `prompt` is clear, self-contained, and free of grammar/spelling errors.
- [ ] The `explanation` teaches the concept (not just "the answer is A").
- [ ] For MCQ types: exactly one correct option (single) or at least two (multi), with plausible distractors.
- [ ] For numeric types: the answer is verified manually and the tolerance is set.
- [ ] For writing/speaking: the `model_answer` meets the word/character minimum.
- [ ] The `difficulty` reflects the actual challenge, not the topic.
- [ ] The `tags` include at least one skill tag and one cognitive tag.
- [ ] The `time_seconds` is realistic.
- [ ] The duplicate check passed (no warning or it has been justified).
- [ ] The quality checks passed (no errors; warnings reviewed).
- [ ] The wording uses "X-style practice" and does NOT claim official affiliation.

End of `docs/QUESTION_BANK_GUIDE.md`.
