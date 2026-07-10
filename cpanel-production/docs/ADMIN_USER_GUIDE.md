# ALO English Test Platform — Admin User Guide

**Audience:** ALO platform admins, exam managers, content managers, compliance officers.
**Scope:** Day-to-day operations of the Admin portal at `/admin`.
**Required role:** `SUPER_ADMIN`, `ADMIN`, or `EXAM_MANAGER` (with module-specific permissions).
**Compliance reminder:** Every action you take in the admin portal is logged in `exam_audit_logs`. Every question, voucher, and setting change must respect the practice-only, original-content rules described in `DEVELOPMENT-GUIDELINE.md` §1.3.

---

## 1. Logging In

1. Go to https://english.aloeducation.com/login.
2. Enter your admin email (e.g. `admin@alo.com`) and password.
3. If MFA is enabled (`exam_settings.admin_mfa_required = true`), enter the 6-digit code from your authenticator app.
4. The platform routes you to `/admin` based on your role.

### 1.1 Login protection

- After 5 failed login attempts from one IP within 1 minute, the IP is locked out for 15 minutes (`exam_settings.rate_limit_login_per_min = 5`).
- A successful login writes `last_login_at` to `exam_users` and a row to `exam_audit_logs` with `action = 'login'`.
- Failed attempts are also logged with `action = 'login_failed'`.
- If you forget your password, the **Forgot password** link sends a reset email; the token is valid for 30 minutes.

### 1.2 First-time login

If you are the deploying engineer and you just replaced the placeholder admin password (per `docs/CPANEL_DEPLOYMENT_GUIDE.md` §5.5):

1. Log in with `admin@alo.com` and your real password.
2. Open **Settings → Profile** and update the name and phone.
3. Open **Settings → Security** and enable MFA (scan the QR code with Google Authenticator or similar).
4. Open **Settings → Users** and create individual admin accounts for each human admin (do NOT share the `admin@alo.com` account). Assign each a role (`ADMIN`, `EXAM_MANAGER`, etc.) and the minimum permissions needed.

---

## 2. Dashboard Overview

`/admin` opens the dashboard with eight panels:

### 2.1 KPI cards (top row)

| KPI | Source | What it tells you |
|---|---|---|
| **Active students (30d)** | `COUNT(exam_students) WHERE last_activity_at >= NOW() - INTERVAL 30 DAY` | Engagement |
| **Mocks taken (7d)** | `COUNT(exam_mock_attempts) WHERE status='completed' AND started_at >= NOW() - INTERVAL 7 DAY` | Volume |
| **Free quota used (today)** | `SUM(exam_free_quota.used_free_attempts) WHERE DATE(updated_at)=CURDATE()` | Quota burn-down |
| **Vouchers redeemed (7d)** | `COUNT(exam_voucher_usage) WHERE redeemed_at >= NOW() - INTERVAL 7 DAY` | Voucher traction |
| **Pending reviews** | `COUNT(exam_question_review_queue) WHERE state IN ('draft','in_review','approved')` | Question-bank throughput |
| **CRM sync status** | latest `exam_crm_sync_logs.status` | Integration health |
| **Bank health score** | composite (see `docs/WEEKLY_UPDATE_GUIDE.md` §5.2) | Content freshness + coverage |
| **Compliance flags** | `COUNT(exam_audit_logs) WHERE action='originality_violation_reported' AND created_at >= NOW() - INTERVAL 7 DAY` | Risk indicator |

### 2.2 Admissions pipeline chart

A stacked bar chart of student progress through the ALO pipeline stages (Lead → Registered → Verified → First Mock → Counseling Booked → Application Submitted → Visa Filed → Enrolled). Sourced from the CRM-synced pipeline state.

### 2.3 AI recommendations

A short list of recommended next actions, e.g.:

- "GRE bank has only 8 published items (target 50) — commission authoring."
- "Reviewer A's SLA is 4.2 days (target 2.0) — re-balance load."
- "13 students hit the free-quota cap in the last 7 days — consider an ambassador voucher campaign."

### 2.4 Top student weaknesses

Aggregated skill-tag frequencies from the lowest-scored questions in the last 100 attempts. Click through to open a pre-filtered question-bank search for that tag.

### 2.5 Quick actions

- **Add question** (links to Question Bank → New Question).
- **Generate voucher** (links to Vouchers → New).
- **Run weekly update now** (triggers the pipeline with `--dry-run=false`; rate-limited to once per hour).
- **View audit log**.
- **View reports**.

---

## 3. Managing Students

**Path:** `/admin/students`.

### 3.1 Student list

- Searchable by name, email, phone, ALO Student ID, ambassador code.
- Filterable by status (`active`, `pending`, `suspended`, `deleted`), by ALO link (yes/no), by partner flag, by ambassador referrer.
- Sortable by registration date, last activity, mocks taken, free quota used.
- Columns: avatar, name + email, ALO Student ID, status, mocks taken, free quota used / max, last activity, actions.

### 3.2 Student detail

Click a student row to open the detail view:

- **Profile** — name, email, phone, ALO Student ID, ambassador referrer, partner flag, status, registered at, last login.
- **Free quota** — `used_free_attempts` / `max_free_attempts`; reset button (admin only; writes an audit row).
- **Mock attempts** — table of all attempts (`attempt_code`, exam, started_at, status, score, link to report).
- **Vouchers** — vouchers owned and redeemed.
- **Counseling bookings** — past and upcoming sessions.
- **Audit history** — every action taken on this student by any admin.

### 3.3 Actions

- **Suspend** — sets `status = 'suspended'`. The student cannot log in. Free-quota stops accruing. Audit-logged.
- **Activate** — reverses a suspension.
- **Reset free quota** — sets `used_free_attempts = 0`. Requires a written justification in the modal; logged in `exam_audit_logs` with `action = 'quota_reset'`.
- **Grant voucher** — opens a modal to issue a voucher directly to the student (one free paid-attempt-equivalent).
- **Link ALO Student ID** — connects the platform account to the ALO CRM, unlocking the 3-free-ALO quota. The link is validated against the CRM during the next hourly sync.
- **Mark as partner student** — sets `is_partner_student = 1`, switching the quota to `free_quota_partner` (default 2).
- **Delete** — soft-deletes (`status = 'deleted'`); the record is retained for audit. Hard delete is not supported from the UI (DBA-only via a migration).

---

## 4. Managing Questions

**Path:** `/admin/questions`.

The question bank is documented in detail in `docs/QUESTION_BANK_GUIDE.md`. This section covers the admin's operational view.

### 4.1 Question list

- Searchable by `question_code`, prompt text, tag, author.
- Filterable by exam type, section, difficulty, state (draft / in_review / approved / published / retired), author, reviewer, date range.
- Bulk actions: **Submit for review** (draft → in_review), **Publish** (approved → published), **Retire** (published → retired), **Export** (CSV/JSON).

### 4.2 Create a question

Click **New Question** → follow `docs/QUESTION_BANK_GUIDE.md` §2.1.

### 4.3 Import questions

Click **Import → CSV or JSON** → follow `docs/QUESTION_BANK_GUIDE.md` §8.

### 4.4 Review queue

Click **Review Queue** to see items currently in `in_review` state assigned to you (if you are also an examiner) or unassigned.

### 4.5 Pending publication

Click **Pending Publication** to see items in `approved` state. This is the admin's gate before items go live:

- Click **Preview** to see the question as a student would.
- Click **Publish** to push it live (writes a new `exam_question_versions` snapshot).
- Click **Reject** to send it back to `in_review` with a comment.

By default (`exam_settings.auto_publish_after_approval = false`), auto-publish is off. The admin's manual publish action is the final compliance gate.

### 4.6 Versions

Click any question's **Versions** tab to see its full version history (`exam_question_versions`):

- version number, published_at, published_by, superseded_at;
- **View** opens the snapshot JSON;
- **Roll back** restores a previous version as the current live version (writes a new version row, never deletes history).

### 4.7 Tags management

Click **Tags** to manage the tag catalog:

- See usage counts per tag.
- Approve or reject custom tags proposed by authors.
- Merge duplicate tags.

### 4.8 Compliance note

Every question-bank page carries the reminder banner: *"All items must be 100% original. No official exam items, no copyrighted content. Wording must use 'X-style practice test' and must not claim official affiliation."*

---

## 5. Managing Practice Sets

**Path:** `/admin/practice-sets`.

### 5.1 Practice set list

- 320 sets seeded (10 per exam × 32 exams; 96 published + 224 draft by default).
- Filter by exam, difficulty, state (published/draft), author.
- Columns: `set_code`, exam, title, difficulty, total questions, total duration, state, version, actions.

### 5.2 Create / edit a practice set

1. **Basic info** — `set_code` (auto-suggested), exam type, title, description, difficulty, total duration, total questions.
2. **Sections** — pick from the exam's section list (`exam_sections`). For each section, set the question count and duration.
3. **Questions** — pick questions from the bank (filtered to the same exam + section). The system warns if a selected question is in `draft` state (will block publishing the set until the question is also published).
4. **Scoring rule** — choose the scoring rule JSON: `band`, `scaled`, `percent`, `rubric`, `cefr` (auto-suggested from the exam type's `score_scale`).
5. **Instructions & disclaimer** — pre-filled from `exam_settings.practice_disclaimer`; editable per set.
6. **Reviewers** — assign a reviewer (or use auto-assignment).
7. Save as **Draft** or **Submit for review**.

### 5.3 Publish a practice set

- A set can be published only when every question in it is `published`.
- Publishing writes `is_published = 1`, `published_by`, `published_at`, and a new version snapshot.
- Un-publishing sets `is_published = 0` (the set disappears from the student-facing catalog but past attempts remain accessible).

### 5.4 Compliance

- Every set carries the disclaimer: *"This is an original practice set created by ALO English Test Platform. It is not affiliated with, endorsed by, or reproduced from any official test publisher. Items will not appear in any real exam and are for practice only."*
- The disclaimer is non-editable in the UI; it can only be changed via `exam_settings.practice_disclaimer` (admin-only, audit-logged).

---

## 6. Managing Vouchers

**Path:** `/admin/vouchers`.

### 6.1 Voucher list

- All vouchers with `voucher_code`, type (free attempt / discount / bundle), value, expiry, issued to, redeemed by, redeemed at, status.

### 6.2 Generate vouchers

1. Click **Generate Vouchers**.
2. Pick the type:
   - **Free attempt** — gives the holder one free mock (any exam).
   - **Discount** — a percentage or fixed-amount off a paid attempt.
   - **Bundle** — N free attempts for a single student (typically issued by ambassadors).
3. Quantity (1–500 per batch).
4. Expiry (default `voucher_default_expiry_days = 90`).
5. Issued to — a specific student email (optional; if blank, the voucher is a generic code).
6. Notes (e.g. "Ambassador Q1 campaign").
7. Click **Generate**. The platform creates N rows in `exam_vouchers` with random `voucher_code` strings, and writes a row to `exam_audit_logs`.

### 6.3 Download voucher codes

- Click **Export CSV** for the batch. The CSV contains `voucher_code, type, value, expiry, issued_to, status`.
- For ambassador-issued vouchers, the codes are also visible in the ambassador portal under **Vouchers → My Vouchers**.

### 6.4 Revoke a voucher

- Click **Revoke** on an unredeemed voucher. The voucher's `status` moves to `revoked`; it can no longer be redeemed.
- Already-redeemed vouchers cannot be revoked (the attempt has already happened).

### 6.5 Voucher usage audit

- The **Usage** tab shows every redemption (`exam_voucher_usage`), with `voucher_code`, redeemed_by email, attempt_code, redeemed_at.

---

## 7. Managing Quotas

**Path:** `/admin/quotas`.

### 7.1 Global quota settings

- `free_quota_alo` (default 3), `free_quota_public` (default 1), `free_quota_partner` (default 2), `free_quota_ambassador_referred` (default 2).
- Changes here update `exam_settings` and are audit-logged. They take effect immediately for new attempts.

### 7.2 Per-student quota overrides

- Search for a student → **Override quota** → set a custom `max_free_attempts` for that student (e.g. 5 for an ALO partner scholarship student).
- The override is recorded in `exam_free_quota` with `override_reason` and `override_admin_id`.

### 7.3 Quota usage report

- Aggregated view: how many students have hit the cap in the last 7/30 days, broken down by ALO/public/partner/ambassador.
- Useful for planning voucher campaigns or ambassador incentives.

### 7.4 Compliance

- The quota rule is **shared across all 32 exams** and enforced server-side in `AttemptController::start()` → `FreeQuotaService::checkAndReserve()`.
- The admin UI never disables the check entirely; it only adjusts the per-student or per-cohort maximums.

---

## 8. CRM Sync Monitoring

**Path:** `/admin/crm`.

### 8.1 Sync status panel

- Latest sync row from `exam_crm_sync_logs` (`entity_type`, `status`, `started_at`, `finished_at`, `rows_pushed`, `rows_pulled`, `error_message`).
- Last 24 hours chart: pushes and pulls by entity type (leads, students, attempts, vouchers, consultations, marketing sources).

### 8.2 Manual sync trigger

- Click **Sync now** to run `CrmSyncService::syncAll()` immediately. The page polls until the sync completes (or 60 seconds elapse) and shows the result.
- Useful after a bulk import or a CRM-side correction.

### 8.3 Entity sync settings

- Toggle per entity type: `sync_leads`, `sync_students`, `sync_attempts`, `sync_vouchers`, `sync_consultations`, `sync_marketing_sources`.
- Each toggle writes an `exam_settings` row and an audit entry.

### 8.4 CRM sync logs

- Full table of `exam_crm_sync_logs` with filters by entity, status, date range.
- Click a row to see the request/response payloads (truncated to 4 KB each).

### 8.5 Failure handling

- A failed sync row stays in `status = 'error'` (or `'retry'` if retries remain).
- The hourly cron retries `status = 'retry'` rows up to `crm_sync_retry_max` (default 3) times.
- After max retries, the row stays in `status = 'error'` and an alert email is sent to `support@alo.com`.

---

## 9. Audit Logs

**Path:** `/admin/audit`.

### 9.1 Audit log table

- Every mutating action across the platform is logged in `exam_audit_logs`.
- Columns: `id`, `actor_user_id`, `actor_ip`, `entity_type`, `entity_id`, `action`, `before_json`, `after_json`, `created_at`.
- Filterable by actor, entity type, action, date range.
- Searchable by entity ID (e.g. search for a specific `attempt_code` to see every action taken on that attempt).

### 9.2 Read-only

The audit log is append-only. No admin (not even SUPER_ADMIN) can UPDATE or DELETE rows from the UI. DB-level triggers prevent it.

### 9.3 Compliance reports

- **Daily activity report** — every action in the last 24 hours, grouped by actor.
- **Compliance incident report** — every `action = 'originality_violation_reported'` or `action = 'duplicate_blocked'` in the last 30 days.
- **Privileged action report** — every quota reset, voucher grant, role grant, setting change in the last 30 days.

Export any report to PDF or CSV.

---

## 10. Reports

**Path:** `/admin/reports`.

### 10.1 Standard reports

| Report | Cadence | Description |
|---|---|---|
| **Bank health** | on-demand | Count by state, difficulty, tag, exam; bank health score trend |
| **Originality compliance** | weekly | Every published item with `originality_confirmed = 1`; flagged items |
| **Difficulty calibration** | weekly | Declared vs. actual difficulty for items with ≥100 attempts |
| **Stale content** | weekly | Published items not edited in 12 months |
| **Reviewer performance** | weekly | Per reviewer: SLA, reject rate, override rate |
| **Student engagement** | weekly | Active students, mocks per student, retake rate |
| **Voucher performance** | monthly | Issued vs. redeemed, ROI by campaign |
| **CRM sync** | weekly | Push/pull volumes, error rate, retry success |
| **Quota burn-down** | weekly | Free-quota exhaustion rate; voucher conversions |
| **Pipeline conversion** | monthly | Lead → Enrolled funnel; drop-off by stage |
| **Audit summary** | monthly | Privileged action count by actor; compliance incidents |

### 10.2 Custom reports

Click **Custom Report** to build a query:

- pick a base table (attempts, students, vouchers, audit logs, …);
- pick dimensions and metrics;
- pick a date range and filters;
- run; export to CSV or PDF.

### 10.3 Compliance PDFs

- `scripts/generate_audit_reports.php` produces the weekly compliance PDFs in `storage/private/reports/audit/`. They are linked from this page.
- The compliance admin signs each PDF before the release tag is pushed.

---

## 11. Weekly Updates Approval

**Path:** `/admin/weekly-updates`.

Documented in detail in `docs/WEEKLY_UPDATE_GUIDE.md`. Admin's operational view:

### 11.1 Current week

- Pipeline progress bar (12 steps); each step shows status.
- If `awaiting_review`: nudge reviewers via **Remind**.
- If `awaiting_approval`: open the pending-publication list, preview each item, **Publish** or **Reject**.
- If `held` (below threshold): decide whether to wait or override (with justification).
- If `failed`: open the failed step's `notes` JSON, diagnose, fix, and click **Re-run from failed step**.

### 11.2 History

- One row per week. Click **View** to see the per-step breakdown.
- Export the year-to-date history to CSV.

### 11.3 Settings

- Edit `weekly_update_*` settings inline (enabled, day, target, exams, reviewer required, auto-publish, publish threshold, stale days, CRM sync, notifications).
- Every change is audit-logged.

---

## 12. Settings

**Path:** `/admin/settings`.

### 12.1 General

- `platform_name`, `platform_version`, `support_email`, `support_phone`, `terms_version`, `privacy_version`.
- Maintenance mode toggle (shows a maintenance page to non-admins; admins still log in).

### 12.2 Free quota

- See §7.

### 12.3 Weekly updates

- See §11.3.

### 12.4 CRM

- See §8.3.

### 12.5 Payments

- Default currency (`USD`), default gateway (`stripe`), paid attempt price (`9.00`), voucher default expiry (90 days).
- Stripe keys are NOT editable here — they live in `/home/aloeduca/config/english.env` for security. The page shows whether they are configured (without revealing values).

### 12.6 Attempt behavior

- `attempt_default_buffer_minutes` (5), `attempt_max_active_per_student` (2), `attempt_expiry_hours` (24).

### 12.7 Speaking & writing

- `speaking_max_attempts_per_day` (3), `writing_word_count_min` (150), `writing_word_count_max` (750), `ai_grading_enabled` (true), `ai_grading_model` (`alo-internal-rubric-v1`).

### 12.8 Proctoring & integrity

- `proctoring_enabled` (false by default), `proctor_tab_switch_threshold` (3).

### 12.9 Certificates

- `certificates_enabled` (true). Toggle off to disable certificate issuance entirely (past certificates remain downloadable).

### 12.10 Ambassador program

- `ambassador_program_enabled` (true), `ambassador_reward_voucher_count` (5).

### 12.11 Feature flags

- `feature_partner_portal`, `feature_ambassador_portal`, `feature_counselor_booking`, `feature_pdf_reports`, `feature_progress_tracking`.

### 12.12 Integrations

- SMTP test button (sends a test email to `support@alo.com`).
- CRM test button (calls `CrmSyncService::ping()`).
- Stripe webhook test button.

### 12.13 Security

- `admin_mfa_required` (toggle).
- `rate_limit_login_per_min` (default 5).
- `rate_limit_api_per_min` (default 60).
- IP allowlist for admin portal (optional; comma-separated CIDR).
- Session timeout (default 60 minutes of inactivity).

### 12.14 Compliance wording

- The page displays (read-only) the canonical disclaimers: `practice_disclaimer`, `attempts_disclaimer`, `certificates_disclaimer`. These are seeded in `database/seed.sql` and can only be changed by a SUPER_ADMIN with a written justification, audit-logged.

---

## 13. Common Admin Tasks (quick recipes)

### 13.1 "A student hit the free-quota cap but is an ALO student"

1. `/admin/students` → search by email.
2. Open the student detail → confirm `alo_student_id` is set. If not, click **Link ALO Student ID** and enter the ID.
3. Wait for the next hourly CRM sync (or click **Sync now** in `/admin/crm`).
4. After the sync validates the ALO ID, the quota resets to `max_free_attempts = 3` automatically.

### 13.2 "A voucher code is not working"

1. `/admin/vouchers` → search by `voucher_code`.
2. Check `status` — if `revoked` or `redeemed`, explain to the student.
3. Check `expires_at` — if past, issue a new voucher.
4. If everything looks correct, check `issued_to` — if it was issued to a specific email and the student is using a different account, the redemption will fail.

### 13.3 "A question was reported as similar to an official exam item"

1. `/admin/questions` → search by `question_code`.
2. Click **Retire**. The question moves to `is_active = 0`; it is removed from all draft practice sets. Past attempts' reports continue to render the retired item.
3. Open a compliance incident: `/admin/audit` → filter `action = 'originality_violation_reported'` → add a note with the report details.
4. Notify the compliance admin by email.
5. Within 4 hours, the compliance admin posts a post-mortem in the audit log.

### 13.4 "CRM sync is failing"

1. `/admin/crm` → check the latest error message.
2. If "401 Unauthorized" → the API key has rotated; update `ALO_CRM_API_KEY` in `/home/aloeduca/config/english.env` and restart PHP-FPM (cPanel → MultiPHP Manager → Restart).
3. If "Connection timed out" → the CRM endpoint is unreachable from the server; check with ALO IT.
4. If "422 Unprocessable Entity" → a payload schema mismatch; check the most recent push payload in the log and contact the CRM team.

### 13.5 "The weekly update did not run"

1. `/admin/weekly-updates` → check the latest row's `status`.
2. If `skipped` → `weekly_update_enabled = false`; toggle it on.
3. If `skipped_concurrent` → a previous run hung; wait 30 minutes (the lock auto-expires) or kill the hung PHP process via cPanel → Processes.
4. If `failed` → open the failed step's `notes` JSON; fix the root cause; click **Re-run from failed step**.
5. If no row was created at all → the cron job itself did not fire. Verify with `crontab -l | grep weekly_question_update` and check `storage/logs/cron.log`.

### 13.6 "An examiner is on leave"

1. `/admin/questions` → filter `state = 'in_review'` and `reviewer_id = <examiner>`.
2. Bulk-select → **Re-assign reviewer** → pick a substitute.
3. Each re-assignment writes an audit row recording both the old and new reviewer.

### 13.7 "I need to issue 50 vouchers for an ambassador campaign"

1. `/admin/vouchers` → **Generate Vouchers**.
2. Type: **Free attempt**. Quantity: 50. Expiry: 90 days. Issued to: (the ambassador's email). Notes: "Q1 campaign — Ambassador XYZ".
3. Click **Generate**. Download the CSV. Send it to the ambassador (out-of-band; the codes are also visible in their portal).

### 13.8 "I need to take the platform into maintenance mode"

1. `/admin/settings → General` → toggle **Maintenance mode** ON.
2. Non-admin visitors see the maintenance page. Admins can still log in.
3. Perform the maintenance (DB migration, hotfix deploy, etc.).
4. Toggle maintenance mode OFF.
5. Verify with `curl https://english.aloeducation.com/health`.

---

## 14. Compliance Checklist for Admins (daily / weekly)

### Daily (5 minutes)

- [ ] Open `/admin` dashboard. Check the 8 KPI cards for anomalies.
- [ ] Check the **CRM sync status** card. If `error`, investigate.
- [ ] Check **Compliance flags**. If non-zero, open the audit log and triage.

### Weekly (Monday morning, 20 minutes)

- [ ] Open `/admin/weekly-updates`. Check the current week's pipeline progress.
- [ ] If `awaiting_approval`, publish or reject the batch.
- [ ] Check the **Bank health score**. If < 80, address the contributing factor.
- [ ] Check **Exams needing questions**. Commission authoring for any below-minimum exam.
- [ ] Open `/admin/reports` → **Originality compliance**. Sign the weekly compliance PDF.
- [ ] Review the **Reviewer performance** report. Re-balance load if SLA is breached.

### Monthly (1 hour)

- [ ] Review **Voucher performance** report. Adjust campaign budgets.
- [ ] Review **Pipeline conversion** report. Identify drop-off stages.
- [ ] Review **Audit summary**. Spot-check 5 privileged actions for legitimacy.
- [ ] Rotate the admin password (every 90 days).
- [ ] Review the admin user list. Remove departed staff. Revoke unused accounts.

---

## 15. Forbidden Actions

These actions are blocked by RBAC and/or by application-level guards. Even if you have SUPER_ADMIN, do NOT attempt to:

1. Disable the practice disclaimer or remove it from a public surface.
2. Change a question's `source` from `original` to anything else without a written compliance approval.
3. Disable the free-quota check entirely (only per-student overrides are allowed).
4. Bulk-delete audit log rows (the UI does not offer this; the DB has triggers preventing it).
5. Auto-publish weekly batches without review (the `weekly_update_auto_publish` toggle exists but is strongly recommended `false`; changing it requires compliance approval).
6. Add an official exam item to the bank (the duplicate check will block; if it slips through, retire it immediately and open a post-mortem).
7. Send the admin password or any secret via email or chat. Use the cPanel File Manager or SSH only.
8. Grant SUPER_ADMIN to a non-human account (the only non-human roles should be `CRM_SYNC_SERVICE` and `SUPPORT_STAFF`).

---

## 16. Where to Get Help

- **Engineering runbook:** `DEVELOPMENT-GUIDELINE.md` (root of the repo).
- **Deployment ops:** `docs/CPANEL_DEPLOYMENT_GUIDE.md`.
- **Question bank:** `docs/QUESTION_BANK_GUIDE.md`.
- **Weekly updates:** `docs/WEEKLY_UPDATE_GUIDE.md`.
- **Exam conduct (student-facing):** `docs/EXAM_CONDUCT_GUIDE.md`.
- **Support email:** `support@alo.com` (configured in `exam_settings.support_email`).
- **Compliance incidents:** escalate to the compliance admin within 4 hours of detection.

End of `docs/ADMIN_USER_GUIDE.md`.
