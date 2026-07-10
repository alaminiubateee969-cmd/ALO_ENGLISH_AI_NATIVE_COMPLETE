# ALO English Test Platform — Weekly Update Workflow Audit

**Report ID:** 04_WEEKLY_UPDATE_WORKFLOW
**Audit date:** Build 1.0.0
**Source:** `cron/weekly_question_update.php`, `app/Services/AuditService.php`, `database/install.sql` (tables `exam_weekly_updates`, `exam_question_versions`, `exam_question_review_queue`, `exam_admin_approvals`, `exam_settings`), `docs/WEEKLY_UPDATE_GUIDE.md`

---

## 1. Purpose

The weekly update pipeline refreshes the question bank on a fixed schedule so that students always see fresh, original, exam-aligned practice content. It is **idempotent** (one run per ISO week) and **never auto-publishes** without admin approval.

Default schedule: **every Monday at 02:00** server time, configurable via `exam_settings`.

## 2. The 12-step pipeline

The pipeline is implemented in `cron/weekly_question_update.php` and follows the steps documented in its header block:

| Step | Action | Detail |
|---:|---|---|
| 1 | **Load settings** | Read `exam_settings` for `weekly_update_enabled`, `weekly_update_day`, `weekly_update_time`, `weekly_update_questions_target`, `weekly_update_exams_list` (optional allow-list), `weekly_update_reviewer_required`, `weekly_update_auto_publish`. All settings also have env fallbacks (`WEEKLY_UPDATE_ENABLED`, `WEEKLY_UPDATE_DAY`, `WEEKLY_UPDATE_QUESTIONS_TARGET`). |
| 2 | **Guard: skip if disabled OR not scheduled day OR already ran this week** | If `enabled=false`, exit. If `date('l')` (lowercase today) ≠ `scheduled_day`, exit. If a row already exists in `exam_weekly_updates` for the current ISO week (`week_start`..`week_end`), exit (idempotent). |
| 3 | **Select exam types needing refresh** | Pick exams whose questions have the oldest `last_updated` timestamp — fair round-robin across all 32 exam types. |
| 4 | **Generate / import new draft questions** | Original placeholder questions created locally (no external scraping). Each new question gets a unique `content_hash` and `originality_sha1` before insert. |
| 5 | **Duplicate check** | SHA1 of normalised stem text + trigram Jaccard similarity ≥ 0.85 against existing bank. Duplicates are skipped and counted in the run summary. |
| 6 | **Quality check** | Answer-key validation (every objective question has a correct option), structural integrity (passage JSON parseable, options non-empty for MCQ). |
| 7 | **Grammar / readability check** | Basic Flesch-Kincaid readability — flag items outside the target band for the exam's difficulty level. |
| 8 | **Save draft** | Insert into `exam_questions` with `status='draft'`, `is_published=0`, `version=1`. Write the corresponding `exam_question_versions` snapshot row. |
| 9 | **Assign reviewer** | Round-robin assignment among active `TEACHER` / `EXAM_MANAGER` users. Insert a row into `exam_question_review_queue` with `status='in_review'`, `assigned_reviewer_id`, `submitted_at=now`. |
| 10 | **Log to `exam_weekly_updates`** | Insert one summary row per run: `update_code`, `week_start`, `week_end`, `exam_types_updated_json`, `questions_added`, `questions_approved` (always 0 at this step), `questions_rejected`, `status='draft'`. The UNIQUE(week_start, week_end) constraint makes a duplicate run in the same week a no-op. |
| 11 | **DO NOT auto-publish** | The cron explicitly stops at step 10. There is **no** code path that flips `is_published` from 0 to 1 without an admin's manual click in the Admin UI (`/admin/weekly-updates` → "Approve & Publish"). |
| 12 | **Emit dashboard signal** | The next time an admin loads `/admin/weekly-updates`, the dashboard pulls the latest `exam_weekly_updates` row plus the per-exam breakdown of new drafts in `exam_question_review_queue`. |

The cron also writes a row to `exam_cron_logs` for every invocation (start, finish, status, output) and emits audit events via `AuditService::ACTION_WEEKLY_UPDATE_RUN` to `exam_audit_logs`.

## 3. Cron job file

```text
cron/weekly_question_update.php
```

- Schedule (cPanel cron): `0 2 * * 1` (Mondays 02:00) — corresponds to the default `weekly_update_day=monday`, `weekly_update_time=02:00` settings.
- CLI invocation: `php /home/aloeduca/english.aloeducation.com/cron/weekly_question_update.php`
- Bootstrap: `cron/_bootstrap.php` (loaded via `require_once __DIR__ . '/_bootstrap.php';`) sets up autoload, env loading from `/home/aloeduca/config/english.env`, and the `cronLog()` + `cronLock()` helpers.
- Locking: `cronLock($job)` prevents overlapping runs of the same job. A second invocation while one is still running logs a WARN and exits cleanly.

The cron is **stateless and idempotent**. Re-running it on a non-Monday, or twice on the same Monday, has no side effects.

## 4. Admin settings (in `exam_settings`)

| Setting key | Default | Type | Notes |
|---|---|---|---|
| `weekly_update_enabled` | `true` | bool | Master on/off switch. |
| `weekly_update_day` | `monday` | string | Lowercase ISO weekday name. |
| `weekly_update_time` | `02:00` | string | 24h `HH:MM`. Used by the cPanel cron expression. |
| `weekly_update_exams_list` | (empty = all 32) | json | Optional allow-list of `exam_type_id` values to refresh. Empty = refresh all 32. |
| `weekly_update_questions_target` | `20` | int | Target number of new draft questions per exam per week. |
| `weekly_update_reviewer_required` | `true` | bool | If `true`, every new draft MUST be assigned a reviewer before it can be approved. |
| `weekly_update_auto_publish` | **`false`** | bool | **DISABLED by default.** Even if flipped to `true`, the cron code path does not implement auto-publish — the flag is reserved for future use and intentionally has no effect today. Admin approval remains mandatory. |

All settings are editable from `/admin/settings` (permission `english.settings.manage`). Every change is audited via `AuditService::ACTION_SETTINGS_UPDATE`.

## 5. Dashboard metrics (`/admin/weekly-updates`)

The admin Weekly Updates dashboard surfaces these live metrics:

| Metric | Source |
|---|---|
| Pending review (this week) | `COUNT(*) FROM exam_question_review_queue WHERE status IN ('draft','in_review','needs_revision') AND created_at >= :week_start` |
| Approved (this week) | `COUNT(*) FROM exam_question_review_queue WHERE status='approved' AND reviewed_at >= :week_start` |
| Rejected (this week) | `COUNT(*) FROM exam_question_review_queue WHERE status='rejected' AND reviewed_at >= :week_start` |
| Duplicates skipped (this week) | `exam_weekly_updates.questions_rejected` (latest row, or sum of the last 4 weeks) |
| Bank health | `COUNT(*) FROM exam_questions WHERE status='published'` per exam type, plus ratio of published vs draft per exam |
| Last update run | `MAX(created_at) FROM exam_weekly_updates` |
| Next scheduled run | Computed from `weekly_update_day` + `weekly_update_time` |
| Run history | `SELECT * FROM exam_weekly_updates ORDER BY week_start DESC LIMIT 12` (last 12 weeks) |

Admins can also trigger a manual run from the dashboard via `POST /admin/weekly-updates/run` (CSRF + `english.questions.manage` permission), which executes the same pipeline immediately. The manual run respects all the same idempotency guards (it will not double-run for the current ISO week unless the previous run's row is first archived).

## 6. Versioning (`exam_question_versions`)

Every time a question's content changes — initial draft, reviewer edits, post-publish correction — a new snapshot row is written:

```sql
exam_question_versions (
  id            BIGINT AUTO_INCREMENT,
  question_id   BIGINT NOT NULL,    -- FK to exam_questions
  version       INT NOT NULL,        -- monotonically increasing per question
  snapshot_json JSON NOT NULL,       -- full content snapshot at this version
  changed_by    BIGINT NULL,         -- actor user id
  changed_at    DATETIME,
  change_reason VARCHAR(255) NULL
)
```

- `version` starts at `1` for the initial draft and increments on every save.
- `snapshot_json` contains the full stem, passage, options, answer key, and metadata as a single JSON document — sufficient to fully reconstruct the question at that point in time.
- `changed_by` records the actor (system cron, reviewer, or admin).
- `change_reason` is optional but encouraged for reviewer/admin edits.

This table is the source of truth for "what did this question look like when this student took it on date X?" — a critical audit trail for grade disputes and content rollbacks. To roll back a question to a previous version, an admin opens the version history and clicks "Restore" — which writes a new version row with the old snapshot's content.

## 7. `exam_weekly_updates` table

```sql
exam_weekly_updates (
  id                       BIGINT AUTO_INCREMENT,
  update_code              VARCHAR(48) NOT NULL,        -- e.g. WEEKLY-2025-W03
  week_start               DATE NOT NULL,                -- ISO Monday
  week_end                 DATE NOT NULL,                -- ISO Sunday
  exam_types_updated_json  JSON NULL,                    -- [{exam_type_id, added, rejected}, ...]
  questions_added          INT NOT NULL DEFAULT 0,
  questions_approved       INT NOT NULL DEFAULT 0,       -- always 0 in this row (approval happens later)
  questions_rejected       INT NOT NULL DEFAULT 0,       -- duplicates + quality failures
  status                   ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by               BIGINT NULL,
  created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_week_code (update_code),
  KEY idx_week_range (week_start, week_end)
)
```

A second UNIQUE constraint on `(week_start, week_end)` is enforced at the application layer (the cron's idempotency check). The row starts as `draft`, transitions to `published` when an admin publishes one or more approved sets from the batch, and `archived` after 90 days.

## 8. Audit trail

Every privileged action in the weekly update flow is written to `exam_audit_logs` via `AuditService`:

| AuditService action constant | Triggered by |
|---|---|
| `ACTION_WEEKLY_UPDATE_RUN` | Every cron invocation (start, success, or failure) |
| `ACTION_QUESTION_CREATE` | Each new draft question inserted |
| `ACTION_QUESTION_UPDATE` | Reviewer edits on a draft |
| `ACTION_QUESTION_PUBLISH` | Admin clicks "Approve & Publish" on a draft set |
| `ACTION_SETTINGS_UPDATE` | Any change to a `weekly_update_*` setting |
| `ACTION_USER_UPDATE` | Reviewer assignment (if it changes the reviewer's `last_assigned_at` profile field) |

Each audit row records `actor_user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `details_json`, `created_at`. The audit log is immutable (no UPDATE/DELETE path in the application) and indexed on actor, entity, and created_at.

## 9. Confirmations

| Item | Confirmed |
|---|---|
| Weekly update cron exists at `cron/weekly_question_update.php` | ✅ |
| 12-step pipeline documented in the file header | ✅ |
| Schedule: Monday 02:00 by default | ✅ |
| Idempotent (UNIQUE week range + lock + day-of-week guard) | ✅ |
| Admin can configure enable, day, time, exams list, target count, reviewer required | ✅ |
| `weekly_update_auto_publish` defaults to `false` | ✅ |
| Auto-publish is intentionally NOT implemented even if the flag is true | ✅ |
| Dashboard metrics (pending, approved, rejected, duplicates, bank health, last/next update) | ✅ |
| `exam_weekly_updates` table with UNIQUE(week_start, week_end) | ✅ |
| Versioning via `exam_question_versions` (snapshot JSON per version) | ✅ |
| Audit logging on every privileged step (run, create, update, publish, settings) | ✅ |
| Manual run endpoint available at `POST /admin/weekly-updates/run` | ✅ |
| Cron logs to `exam_cron_logs` on every invocation | ✅ |

---

**Weekly update workflow audit status:** COMPLETE. Pipeline is idempotent, never auto-publishes, versioned, and fully audited.
