# ALO English Test Platform — Weekly Question Update Guide

**Audience:** Admins, content managers, reviewers, ALO Practice Examiners, compliance officers.
**Scope:** The weekly content pipeline that keeps the question bank fresh, balanced, and compliant.
**Cron entry:** `0 2 * * 1` (Monday 02:00 server time) → `cron/weekly_question_update.sh` → `scripts/weekly_question_update.php`.
**Manual run:** `php scripts/weekly_question_update.php [--dry-run] [--week=YYYY-MM-DD]`.

> **Compliance reminder:** Every item added by the weekly pipeline is 100% original content authored or licensed by ALO. No official exam items, no copyrighted third-party passages. The pipeline enforces the same originality, duplicate, and quality checks described in `docs/QUESTION_BANK_GUIDE.md`.

---

## 1. Why a Weekly Update?

A practice platform with a static question bank quickly becomes stale: students who retake mocks see the same items, score-inflation bias creeps in, and the platform's value as a self-assessment tool degrades. The weekly update pipeline:

- adds **fresh original items** every week (`exam_settings.weekly_update_questions_target`, default 20);
- rotates **draft sets into published status** so students see variety;
- retires (versions) **stale items** that have been live too long;
- logs every change in `exam_weekly_updates` for auditability;
- syncs the new catalog to the ALO CRM so counselors can recommend fresh practice.

---

## 2. Admin Settings (under Admin → Settings → Weekly Updates)

All keys live in `exam_settings`. Defaults are seeded in `database/seed.sql`.

| Setting key | Default | Description |
|---|---|---|
| `weekly_update_enabled` | `true` | Master switch. When `false`, the cron job exits immediately with `status='skipped'`. |
| `weekly_update_day` | `monday` | Day of week the pipeline runs. Must match the cron schedule. |
| `weekly_update_time` | `02:00` | Local server time. Display only — the cron job's actual schedule is set in cPanel → Cron Jobs. |
| `weekly_update_questions_target` | `20` | Target number of new questions to add per week. The pipeline stops adding when this is met OR when no more drafts are available. |
| `weekly_update_exams` | `ALL` | Comma-separated `type_code` list (e.g. `IELTS-ACAD,PTE-ACAD,SAT`) or `ALL` to apply to every active exam. |
| `weekly_update_reviewer_required` | `true` | If `true`, draft items must go through the reviewer before being eligible for publish. If `false`, the pipeline can auto-promote drafts that pass all quality + originality + duplicate checks. **Strongly recommended: `true`.** |
| `weekly_update_auto_publish` | `false` | If `false` (default), the pipeline stops at `approved` and waits for an admin to publish. If `true`, the pipeline publishes approved items automatically. **Strongly recommended: `false`** — the admin gate is the final compliance checkpoint. |
| `weekly_update_publish_threshold` | `15` | Minimum number of approved items required to publish a weekly batch. Below this, the batch is held and rolled into next week. |
| `weekly_update_stale_days` | `180` | A published question is eligible for versioning/refresh after this many days live. |
| `weekly_update_crm_sync` | `true` | If `true`, sync the updated catalog to the ALO CRM at the end of the pipeline. |
| `weekly_update_notify_admin` | `true` | Email the admin when a batch is ready for approval. |
| `weekly_update_notify_reviewer` | `true` | Email assigned reviewers when items are waiting in their queue. |

### 2.1 Recommended production configuration

```
weekly_update_enabled             = true
weekly_update_day                 = monday
weekly_update_time                = 02:00
weekly_update_questions_target    = 20
weekly_update_exams               = ALL
weekly_update_reviewer_required   = true
weekly_update_auto_publish        = false        ← NEVER auto-publish; admin must approve
weekly_update_publish_threshold   = 15
weekly_update_stale_days          = 180
weekly_update_crm_sync            = true
weekly_update_notify_admin        = true
weekly_update_notify_reviewer     = true
```

---

## 3. The 12-Step Pipeline

`scripts/weekly_question_update.php` runs these 12 steps in order. Each step writes a row to `exam_weekly_updates` with `step`, `status`, `rows_affected`, and `notes`. The pipeline is **transactional per step** — a failure in step N rolls back that step's writes and aborts the run (with `status='failed'` on the week's master row).

### Step 1 — Generate / Import

- For each exam in `weekly_update_exams`:
  - pull drafts from the author queue (CSV/JSON imports from the past 7 days that are still in `state = 'draft'`);
  - if drafts are short of the weekly target, the pipeline **requests authoring** by creating `exam_question_review_queue` rows with `state = 'requested'` and notifying assigned authors via email.
- No items are added in this step — it only stages them.

### Step 2 — Save draft

- Each staged item is written to `exam_questions` with `is_published = 0`, `is_active = 1`, and `state = 'draft'` in the review queue.
- The `created_by` is the author (for hand-authored items) or the importing admin (for CSV/JSON imports).
- A new row in `exam_question_versions` is created with `version = 1` for new items.

### Step 3 — Duplicate check

- Run `QuestionBankService::duplicateCheck()` against the entire bank AND the import batch AND the retired items AND the external corpus of known official items (used only for **prevention**, never for **adding**).
- Exact-text-hash matches block the item; the item is moved to `state = 'rejected'` with `reason = 'duplicate'`.
- Fuzzy matches (trigram Jaccard ≥ 0.85) block; matches between 0.70 and 0.85 warn and require reviewer sign-off.
- A summary row is written to `exam_weekly_updates` with the duplicate count.

### Step 4 — Quality check

- Run `QuestionBankService::qualityCheck()` (see `docs/QUESTION_BANK_GUIDE.md` §9).
- Structural failures block (state → `rejected`).
- Content quality warnings (readability, plausibility) flag for reviewer attention but do not block.
- A summary row is written.

### Step 5 — Grammar / Readability check

- Run LanguageTool CLI against the prompt, explanation, and (for MCQs) each option.
- Run Flesch-Kincaid on the prompt; compare against the exam's `target_cefr` band.
- Grammar errors block. Readability out-of-band warns.
- A summary row is written.

### Step 6 — Answer-key validation

- For objective types, re-derive the correct answer from the explanation by a keyword/regex matcher.
- For numeric types, verify the answer parses and the tolerance is set.
- For writing/speaking, verify the `model_answer` meets the minimum word count.
- Mismatches block.
- A summary row is written.

### Step 7 — Assign reviewer

- If `weekly_update_reviewer_required = true`, assign a reviewer per item using `exam_settings.review_assignment_strategy` (default: round-robin among active examiners for that exam).
- Write `reviewer_id` to `exam_question_review_queue`.
- If `weekly_update_notify_reviewer = true`, send the reviewer an email with their queue link.
- Items move from `state = 'draft'` to `state = 'in_review'`.

> **Note:** Steps 1–7 run automatically in the Monday 02:00 cron job. Steps 8–10 require human action (reviewer and admin) and typically complete by Wednesday. Steps 11–12 run automatically once step 10 is done.

### Step 8 — Reviewer approves

- The reviewer opens `/examiner`, reviews each item, and either **Approves** (state → `approved`, `originality_confirmed = 1`) or **Rejects** (state → `rejected` with comment).
- Reviewer SLA: 2 business days.
- The pipeline does NOT auto-advance from `in_review` to `approved` — the human reviewer's sign-off is required.

### Step 9 — Admin approves

- An admin with `questions.publish` permission opens `/admin/questions/pending` and either **Publishes** the batch or **Rejects** items back to `in_review`.
- The pipeline checks `weekly_update_publish_threshold` (default 15). If fewer approved items are available, the batch is held and rolled into next week (a `status='held'` row is written to `exam_weekly_updates`).
- If `weekly_update_auto_publish = false` (recommended), this step is the human gate. If `true`, the pipeline publishes automatically — **not recommended** for production.

### Step 10 — Publish

- For each approved item:
  - set `is_published = 1` on `exam_questions`;
  - move `state` to `published` in `exam_question_review_queue`;
  - write a new `exam_question_versions` row (or bump `version` and set `superseded_at` on the previous version for edited items);
  - write `published_by` and `published_at`;
  - attach the item to one or more **draft practice sets** (`is_published = 0` sets, sets 4–10 per exam) so that published items are immediately available to students through those sets when they are subsequently published.
- A summary row is written with `rows_affected` = number of items published.

### Step 11 — Version old items

- Identify published items older than `weekly_update_stale_days` (default 180 days).
- For each:
  - if a newer draft version exists, supersede the old version (set `superseded_at` on the old `exam_question_versions` row; the new version becomes live);
  - if no newer version exists, flag the item for refresh (write a `state = 'refresh_requested'` row in the review queue and notify the original author).
- Old items are NOT retired — they remain available for historical attempts. Only their *current* version is rotated.

### Step 12 — Log in `exam_weekly_updates` and sync to CRM

- Write the master row for the week:
  - `update_code` (e.g. `WU-2025-W04`);
  - `week_start` (Monday 00:00), `week_end` (Sunday 23:59);
  - `questions_added` (published this week);
  - `questions_rejected` (duplicates + quality failures);
  - `questions_versioned` (old items rotated);
  - `reviewer_ids` (comma-separated);
  - `admin_approver_id`;
  - `status = 'completed'`;
  - `notes` (JSON with per-step summaries).
- If `weekly_update_crm_sync = true`, call `CrmSyncService::pushCatalogSnapshot()` to push the updated catalog to the ALO CRM. The CRM uses this snapshot to update counselor recommendations and the marketing-site "fresh content" badge.
- Send the admin the weekly summary email (questions added, rejected, versioned; reviewer performance; bank health score).

---

## 4. The `exam_weekly_updates` Table

Schema (from `database/install.sql`):

| Column | Type | Purpose |
|---|---|---|
| `id` | BIGINT unsigned PK | — |
| `update_code` | VARCHAR(32) UNIQUE | `WU-YYYY-Www` (ISO week) |
| `week_start` | DATE | Monday of the week |
| `week_end` | DATE | Sunday of the week |
| `pipeline_step` | TINYINT | 1–12, or 0 for the master row |
| `status` | ENUM(`pending`,`in_progress`,`completed`,`failed`,`held`,`skipped`) | Per-step status |
| `rows_affected` | INT | Items touched in this step |
| `questions_added` | INT | Master-row aggregate |
| `questions_rejected` | INT | Master-row aggregate |
| `questions_versioned` | INT | Master-row aggregate |
| `reviewer_ids` | VARCHAR(255) | Comma-separated reviewer user IDs |
| `admin_approver_id` | BIGINT | Admin who approved the batch |
| `notes` | JSON | Per-step details, error messages, warnings |
| `started_at` | DATETIME | Pipeline start |
| `finished_at` | DATETIME | Pipeline end (NULL while running) |
| `created_at` | DATETIME | Row creation |

Indexes: `UNIQUE(update_code)`, `INDEX(week_start, week_end)`, `INDEX(status)`.

The admin dashboard queries this table to render the metrics in §5.

---

## 5. Dashboard Metrics (Admin → Weekly Updates)

The dashboard at `/admin/weekly-updates` shows:

### 5.1 Current week panel

- **Status** — `pending` / `in_progress` / `awaiting_review` / `awaiting_approval` / `completed` / `failed` / `held` / `skipped`.
- **Started at** / **Finished at**.
- **Pipeline progress bar** — 12 steps; each step is a green check, a yellow dot (running), a red X (failed), or a gray square (not started).
- **Questions added / rejected / versioned** for the current week.

### 5.2 Trend cards

- **Pending** — items currently in `state = 'draft'` or `state = 'in_review'` across the whole bank.
- **Approved** — items in `state = 'approved'` waiting for the admin to publish.
- **Rejected** — items in `state = 'rejected'` this week, with the reason breakdown (duplicate / quality / originality / other).
- **Duplicates** — items blocked by `duplicateCheck()` this week, with the matched question's code.
- **Exams needing questions** — exams whose published bank has fewer than the target minimum (default 50 published items per exam). Clicking through opens the question bank filtered to that exam's draft queue.
- **Bank health score** — a composite 0–100 score:
  - 40% — coverage (every exam has ≥ target minimum of published items);
  - 20% — freshness (median published-item age ≤ `weekly_update_stale_days`);
  - 20% — originality (every published item has `originality_confirmed = 1`);
  - 10% — review SLA (median time-to-publish within target);
  - 10% — difficulty balance (no difficulty bucket < 15% of the bank).
- **Last update** — the most recent `exam_weekly_updates` master row (`update_code`, `week_start`, `questions_added`, `status`, `finished_at`).
- **Next update** — the next Monday 02:00 (server time), with a countdown.

### 5.3 History table

- One row per week: `update_code`, `week_start`, `status`, `questions_added`, `questions_rejected`, `questions_versioned`, `admin_approver`, `finished_at`, **View** button.
- **View** opens a per-step breakdown (12 rows) with `rows_affected`, `notes`, and `started_at` / `finished_at` per step.

### 5.4 Reviewer performance panel

- Per reviewer: items reviewed this week, SLA adherence (median time from `in_review` to `approved`/`rejected`), reject rate, override rate (reviewer-approved items later rejected by admin).

### 5.5 Admin actions

- **Run now** — triggers the pipeline immediately with `--dry-run=false` (admin only; rate-limited to once per hour).
- **Dry run** — runs the pipeline with `--dry-run=true` (no DB writes; produces a preview report).
- **Pause** — sets `weekly_update_enabled = false` until resumed.
- **Override publish threshold** — admin can publish a batch smaller than `weekly_update_publish_threshold` with a written justification (recorded in `exam_audit_logs`).
- **Re-assign reviewer** — admin can re-assign an item from one reviewer to another (records both IDs in the audit log).

---

## 6. Failure Modes and Recovery

| Symptom | Likely cause | Recovery |
|---|---|---|
| Pipeline `status = 'failed'` at step 3 | Duplicate check found an exact hash match against an existing item | Author re-words the item; re-run the pipeline |
| Pipeline `status = 'failed'` at step 4 | Quality check found a structural failure (e.g. wrong number of options) | Author fixes; re-run |
| Pipeline `status = 'failed'` at step 5 | LanguageTool CLI not installed on server | Install LanguageTool; re-run from step 5 |
| Pipeline `status = 'held'` at step 9 | Fewer than `weekly_update_publish_threshold` approved items | Wait for reviewers; or admin lowers threshold with justification |
| Pipeline `status = 'skipped'` | `weekly_update_enabled = false` | Re-enable in Settings |
| Reviewer SLA breach | Reviewer inactive | Admin re-assigns to another reviewer |
| CRM sync failed at step 12 | CRM API unreachable | Pipeline still completes (`status = 'completed_with_crm_warning'`); CRM sync retried by hourly `crm_sync.php` |
| Two pipeline runs overlap | Previous run hung | Lock check at pipeline start; second run exits with `status = 'skipped_concurrent'` |

Every failure writes a `notes` JSON to `exam_weekly_updates` with the exception class, message, and stack trace (truncated). The admin dashboard surfaces these in red.

---

## 7. Compliance and Audit

- The weekly pipeline is the primary source of fresh content; it must respect the same originality rules as ad-hoc authoring (see `docs/QUESTION_BANK_GUIDE.md` §4).
- The pipeline never auto-publishes when `weekly_update_auto_publish = false` (the recommended default). The admin's publish action is the final compliance gate.
- Every weekly batch is auditable: the `update_code` links the `exam_weekly_updates` master row to every item's `exam_audit_logs` entries for that week.
- The compliance admin reviews the weekly batch's `Question Bank Compliance PDF` (auto-generated by `scripts/generate_audit_reports.php`) before signing off the release.
- If a published weekly item is later found to violate originality, it is retired within 4 hours (per `docs/QUESTION_BANK_GUIDE.md` §6.6) and a post-mortem is opened.

---

## 8. Quick Reference — Weekly Checklist

For the admin each Monday morning:

- [ ] Open `/admin/weekly-updates` and check the current week's status.
- [ ] If `awaiting_review`, nudge reviewers via the **Re-assign / Remind** action.
- [ ] If `awaiting_approval`, review the batch at `/admin/questions/pending` and either **Publish** or **Reject** with comments.
- [ ] Check the **Bank health score**; if < 80, open the contributing factor and address.
- [ ] Check **Exams needing questions**; if any exam is below the minimum, commission additional authoring.
- [ ] Review the **Duplicates** and **Rejected** breakdowns; spot-check 2–3 items for calibration.
- [ ] Confirm the CRM sync completed (no `crm_warning` status).
- [ ] Sign the **Question Bank Compliance PDF** for the week.

End of `docs/WEEKLY_UPDATE_GUIDE.md`.
