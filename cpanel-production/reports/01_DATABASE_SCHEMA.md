# ALO English Test Platform — Database Schema Audit

**Report ID:** 01_DATABASE_SCHEMA
**Audit date:** Build 1.0.0
**Source file:** `database/install.sql` (1,068 lines)
**Database engine:** MySQL 8.0

---

## 1. Schema-wide conventions

Every one of the 44 tables is declared with the identical hardening profile:

```sql
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='...';
```

| Property | Value | Confirmed across all 44 tables |
|---|---|---|
| Storage engine | `InnoDB` | YES (44/44) |
| Character set | `utf8mb4` | YES (44/44) — full Unicode incl. emoji |
| Collation | `utf8mb4_unicode_ci` | YES (44/44) — case-insensitive Unicode ordering |
| Primary keys | `BIGINT UNSIGNED AUTO_INCREMENT id` | YES (44/44) |
| Timestamps | `created_at` + (most) `updated_at` with `DEFAULT CURRENT_TIMESTAMP [ON UPDATE]` | YES |
| Soft delete | Selected tables use `status` ENUM instead of hard delete | YES |
| Foreign keys | 49 named FK constraints with explicit `ON DELETE` policy | YES |
| Indexes | 150 KEY / UNIQUE KEY / PRIMARY KEY declarations | YES |
| JSON columns | Used for flexible schema (settings, scoring rules, audit details, snapshots) | YES |

FK ON DELETE policies in use: `CASCADE` (child rows), `SET NULL` (optional links), `RESTRICT` (parent protection). All FKs are named `fk_<table>_<column>` for easy migration tracking.

## 2. Table inventory (44 tables)

Grouped by domain. Each table row shows: **table name — comment from `install.sql` — key columns & indexes**.

### 2.1 Identity, RBAC & terms (6 tables)

| # | Table | Comment | Key columns / indexes |
|---|---|---|---|
| 1 | `exam_users` | Auth identity for all portal users | `id`, `email` (UNIQUE), `phone`, `password_hash`, `status`, `last_login_at`, `failed_login_count`, `locked_until`. Indexes: `uq_user_email`, `idx_user_status`. |
| 2 | `exam_students` | Student profile linked to ALO CRM records | `id`, `user_id` (FK→exam_users), `alo_student_id`, `alo_application_id`, `ambassador_id`, `is_partner`. Indexes: `uq_student_user`, `idx_alo_student_id`. |
| 3 | `exam_roles` | Platform roles | `id`, `role_code` (UNIQUE), `name`, `description`. |
| 4 | `exam_permissions` | Granular permissions | `id`, `permission_code` (UNIQUE), `module`, `description`. |
| 5 | `exam_user_roles` | User-role assignments with optional scope | `id`, `user_id` (FK→exam_users), `role_id` (FK→exam_roles), `scope_json`. Indexes: `uq_user_role`, `idx_user_roles_user`. |
| 6 | `exam_terms_acceptance` | Terms & policy acceptance log | `id`, `user_id`, `terms_version`, `privacy_version`, `accepted_at`, `ip_address`. |

### 2.2 Exam catalog structure (4 tables)

| # | Table | Comment | Key columns / indexes |
|---|---|---|---|
| 7 | `exam_categories` | Top-level exam categories (5) | `id`, `category_code` (UNIQUE), `name`, `description`, `icon`. 5 rows seeded: English Proficiency, Study Abroad Entrance, University Internal, Visa/Interview, ALO Internal. |
| 8 | `exam_types` | 32 supported computer-based exam types | `id`, `type_code` (UNIQUE), `type_name`, `category_id` (FK→exam_categories), `style_label` (e.g., "IELTS-style practice test"), `duration_minutes`, `score_scale`, `is_active`. 32 rows seeded. |
| 9 | `exam_sections` | Sections per exam type | `id`, `exam_type_id` (FK), `section_name`, `duration_minutes`, `sort_order`, `instructions`. |
| 10 | `exam_modules` | Adaptive/static modules per section | `id`, `section_id` (FK→exam_sections), `module_code`, `is_adaptive`, `question_count`. FK: `fk_module_section`. |

### 2.3 Question bank (4 tables)

| # | Table | Comment | Key columns / indexes |
|---|---|---|---|
| 11 | `exam_question_types` | 26+ question/response types | `id`, `type_code` (UNIQUE), `name`, `is_objective`, `scoring_method`. |
| 12 | `exam_questions` | Master question bank — 100% original content | `id`, `exam_type_id` (FK), `section_id` (FK), `question_type_id` (FK), `stem_text`, `passage_json`, `answer_key_json`, `difficulty`, `status` ENUM(`draft`,`in_review`,`approved`,`published`,`archived`), `version`, `created_by`, `reviewed_by`, `approved_by`, `is_published`, `originality_sha1`, `content_hash`. Indexes: `idx_q_exam_type`, `idx_q_section`, `idx_q_status`, `idx_q_published`, `uq_question_hash`. FKs: `fk_q_exam_type`, `fk_q_section`, `fk_q_type`. |
| 13 | `exam_question_options` | Multiple-choice options per question | `id`, `question_id` (FK→exam_questions, CASCADE), `option_letter`, `option_text`, `is_correct`, `sort_order`. |
| 14 | `exam_question_media` | Question media attachments | `id`, `question_id` (FK, CASCADE), `media_type`, `file_path`, `alt_text`. |

### 2.4 Practice sets (3 tables) — the curated "10 per exam × 32 exams = 320" catalogue

| # | Table | Comment | Key columns / indexes |
|---|---|---|---|
| 15 | `exam_practice_sets` | Curated practice sets (10 per exam × 32 exams = 320) | `id`, `set_code` (UNIQUE), `exam_type_id` (FK), `title`, `description`, `difficulty`, `total_duration_minutes`, `total_questions`, `scoring_rule_json`, `instructions`, `disclaimer`, `version`, `is_published`, `created_by`, `reviewed_by`, `approved_by`. Indexes: `uq_set_code`, `idx_ps_exam_type`, `idx_ps_published`. 320 rows seeded. |
| 16 | `exam_practice_set_sections` | Section definitions per practice set | `id`, `practice_set_id` (FK→exam_practice_sets, CASCADE), `section_id` (FK→exam_sections, SET NULL), `section_label`, `question_count`, `duration_minutes`, `sort_order`, `instructions`. FKs: `fk_pss_set`, `fk_pss_section`. 1,530 rows seeded. |
| 17 | `exam_practice_set_questions` | Question linking table for practice sets | `id`, `practice_set_id` (FK, CASCADE), `set_section_id` (FK→exam_practice_set_sections, CASCADE), `question_id` (FK→exam_questions, SET NULL), `sort_order`, `marks`. FKs: `fk_psq_set`, `fk_psq_section`, `fk_psq_question`. 480 rows seeded. |

### 2.5 Attempts & scoring (7 tables)

| # | Table | Comment | Key columns / indexes |
|---|---|---|---|
| 18 | `exam_mock_attempts` | Student mock test attempts | `id`, `student_id` (FK→exam_students, RESTRICT), `exam_type_id` (FK, RESTRICT), `practice_set_id` (FK→exam_practice_sets, SET NULL), `attempt_code` (UNIQUE), `status` ENUM(`not_started`,`in_progress`,`submitted`,`graded`,`expired`,`abandoned`), `started_at`, `submitted_at`, `time_spent_seconds`, `total_score`, `band_score`, `cefr_level`, `ip_address`, `device_fingerprint`, `voucher_id`. Indexes: `uq_attempt_code`, `idx_attempt_student`, `idx_attempt_status`, `idx_attempt_practice_set`. |
| 19 | `exam_attempt_sections` | Per-section tracking within an attempt | `id`, `attempt_id` (FK, CASCADE), `section_id`, `started_at`, `submitted_at`, `time_spent_seconds`, `section_score`. FK: `fk_as_attempt`. |
| 20 | `exam_answers` | Per-question student answers | `id`, `attempt_id` (FK→exam_mock_attempts, CASCADE), `question_id` (FK→exam_questions, SET NULL), `answer_json`, `time_spent_seconds`, `is_correct`, `marks_awarded`, `submitted_at`. FKs: `fk_ans_attempt`, `fk_ans_question`. |
| 21 | `exam_scores` | Final score for an attempt | `id`, `attempt_id` (UNIQUE FK→exam_mock_attempts), `total_score`, `band_score`, `cefr_level`, `pass_fail`, `score_engine_version`, `scored_at`. |
| 22 | `exam_score_breakdown` | Section/skill breakdown | `id`, `attempt_id` (FK), `section_name`, `skill`, `raw_score`, `scaled_score`, `band`. |
| 23 | `exam_speaking_sessions` | Speaking test sessions and AI grading | `id`, `attempt_id`, `prompt_text`, `audio_path`, `duration_seconds`, `ai_score`, `examiner_id`, `examiner_score`, `transcript_text`. |
| 24 | `exam_writing_submissions` | Writing task submissions and grading | `id`, `attempt_id`, `question_id`, `response_text`, `word_count`, `ai_score`, `examiner_id`, `examiner_score`, `feedback_json`. |

### 2.6 Feedback, reports, certificates (3 tables)

| # | Table | Comment | Key columns / indexes |
|---|---|---|---|
| 25 | `exam_feedback` | Consolidated feedback records | `id`, `attempt_id` (FK, CASCADE), `student_id` (FK, RESTRICT), `feedback_type`, `feedback_text`, `author_id`, `is_published`. FKs: `fk_fb_attempt`, `fk_fb_student`. |
| 26 | `exam_reports` | Generated PDF/HTML reports | `id`, `attempt_id` (FK, CASCADE), `report_code` (UNIQUE), `format` ENUM(`pdf`,`html`), `file_path`, `generated_at`. |
| 27 | `exam_certificates` | Practice completion certificates | `id`, `student_id` (FK, RESTRICT), `exam_type_id` (FK, RESTRICT), `attempt_id` (FK, SET NULL), `certificate_code` (UNIQUE), `issued_at`. FKs: `fk_cert_student`, `fk_cert_type`, `fk_cert_attempt`. |

### 2.7 Quota, vouchers, payments (5 tables)

| # | Table | Comment | Key columns / indexes |
|---|---|---|---|
| 28 | `exam_free_quota` | Free attempt quota per student/email/device (tamper-proof, backend-enforced) | `id`, `student_id` (FK→exam_students, SET NULL), `email` (UNIQUE), `phone`, `alo_student_id`, `total_free_allowed`, `total_free_used`, `device_fingerprint`, `last_ip`. Indexes: `uq_quota_email`, `idx_quota_alo`, `idx_quota_student`. FK: `fk_quota_student`. **Source of truth for the 1/2/3 free attempts rule.** |
| 29 | `exam_vouchers` | Voucher codes for free/paid attempts | `id`, `voucher_code` (UNIQUE), `voucher_type` ENUM(`free_mock`,`discount`,`full_test`,`scholarship`,`partner_credit`,`ambassador_reward`), `max_uses`, `uses_count`, `valid_from`, `valid_until`, `discount_percent`, `created_by`. |
| 30 | `exam_voucher_usage` | Voucher redemption history | `id`, `voucher_id` (FK), `student_id`, `attempt_id`, `used_at`, `ip_address`. |
| 31 | `exam_payments` | Payment records | `id`, `student_id` (FK, RESTRICT), `attempt_id` (FK, SET NULL), `amount`, `currency`, `gateway`, `gateway_txn_id`, `status`. FKs: `fk_pay_student`, `fk_pay_attempt`. |
| 32 | `exam_leads` | Marketing leads captured by the platform | `id`, `email`, `phone`, `name`, `source`, `exam_interest`, `ambassador_id`, `crm_lead_id`, `status`. |

### 2.8 CRM, marketing, bookings (3 tables)

| # | Table | Comment | Key columns / indexes |
|---|---|---|---|
| 33 | `exam_consultation_bookings` | Counselor consultation bookings | `id`, `student_id` (FK→exam_students, SET NULL), `lead_id` (FK→exam_leads, CASCADE), `counselor_id`, `scheduled_at`, `duration_minutes`, `status`, `notes`. FKs: `fk_book_student`, `fk_book_lead`. |
| 34 | `exam_marketing_sources` | Marketing source attribution | `id`, `source_code` (UNIQUE), `name`, `medium`, `cost_per_lead`, `is_active`. |
| 35 | `exam_crm_sync_logs` | ALO CRM two-way sync logs | `id`, `direction` ENUM(`push`,`pull`), `entity_type`, `entity_id`, `crm_record_id`, `status` ENUM(`pending`,`success`,`failed`,`retry`), `attempt_count`, `last_error`, `request_payload_json`, `response_payload_json`, `synced_at`. Indexes: `idx_crm_sync_status`, `idx_crm_sync_entity`. |

### 2.9 Weekly update workflow (3 tables)

| # | Table | Comment | Key columns / indexes |
|---|---|---|---|
| 36 | `exam_weekly_updates` | Weekly content update register | `id`, `update_code` (UNIQUE), `week_start`, `week_end`, `exam_types_updated_json`, `questions_added`, `questions_approved`, `questions_rejected`, `status` ENUM(`draft`,`published`,`archived`), `created_by`. Indexes: `uq_week_code`, `idx_week_range`. UNIQUE(week_start, week_end) ensures one-run-per-week idempotency. |
| 37 | `exam_question_versions` | Question content version history | `id`, `question_id`, `version`, `snapshot_json`, `changed_by`, `changed_at`, `change_reason`. Every published question keeps a full content snapshot per version. |
| 38 | `exam_question_review_queue` | Question editorial review workflow | `id`, `question_id`, `status` ENUM(`draft`,`in_review`,`approved`,`rejected`,`needs_revision`), `assigned_reviewer_id`, `submitted_at`, `reviewed_at`, `reviewer_notes`. |
| 39 | `exam_admin_approvals` | Admin approval workflow records | `id`, `entity_type`, `entity_id`, `requested_by`, `approval_status` ENUM(`pending`,`approved`,`rejected`), `approved_by`, `approved_at`, `notes`. |

### 2.10 Operational tables (5 tables)

| # | Table | Comment | Key columns / indexes |
|---|---|---|---|
| 40 | `exam_uploads` | Generic upload tracking | `id`, `user_id`, `file_name`, `file_path`, `mime_type`, `size_bytes`, `purpose`, `uploaded_at`. |
| 41 | `exam_proctor_logs` | Proctoring/anti-cheat event log | `id`, `attempt_id`, `event_type`, `event_data_json`, `severity`, `occurred_at`. Events: tab-switch, window-blur, fullscreen-exit, copy-attempt, paste-attempt, idle, network-drop. |
| 42 | `exam_audit_logs` | Platform audit trail | `id`, `actor_user_id`, `action` VARCHAR(64), `entity_type`, `entity_id`, `ip_address`, `user_agent`, `details_json`, `created_at`. Indexes: `idx_audit_actor`, `idx_audit_entity`, `idx_audit_created`. 28 named actions in `AuditService` (login, logout, password, quota, attempt, voucher, question, weekly_update, crm, settings, user, file, data_export). |
| 43 | `exam_settings` | Platform configuration store (key/value) | `id`, `setting_key` (UNIQUE), `setting_value` MEDIUMTEXT, `data_type` ENUM(`string`,`int`,`bool`,`json`,`float`), `is_public` TINYINT, `description`. |
| 44 | `exam_cron_logs` | Scheduled job execution log | `id`, `job_name`, `started_at`, `finished_at`, `status` ENUM(`running`,`success`,`failed`), `output`, `error`. Indexes: `idx_cron_job`, `idx_cron_status`. |

## 3. Cross-table integrity summary

- **49 foreign key constraints** explicitly named and enforced by InnoDB.
- **150 indexes** declared (PRIMARY KEY + UNIQUE KEY + KEY): hot paths covered for `email`, `student_id`, `attempt_id`, `practice_set_id`, `exam_type_id`, `status`, `created_at`, `code` fields.
- **`ON DELETE` policies**:
  - `CASCADE` for child rows that cannot exist without parent (e.g., `exam_answers.attempt_id`).
  - `SET NULL` for optional references (e.g., `exam_attempts.practice_set_id`).
  - `RESTRICT` for parent-protection (e.g., `exam_attempts.student_id` — cannot delete a student who has attempts).
- **UNIQUE constraints** enforce: unique emails, unique attempt codes, unique set codes, unique voucher codes, unique week_code/week_range for weekly updates, unique quota per email.
- **JSON columns** are used (not TEXT blobs) for: `scoring_rule_json`, `details_json`, `exam_types_updated_json`, `snapshot_json`, `request_payload_json`, `response_payload_json`, `passage_json`, `answer_key_json`, `feedback_json`, `scope_json`. MySQL 8 native JSON type validation applies.

## 4. Seed defaults (`seed.sql`)

`seed.sql` (separate file, run after `install.sql`) loads:

- 5 `exam_categories` (English Proficiency, Study Abroad Entrance, University Internal, Visa/Interview, ALO Internal).
- 32 `exam_types` with `style_label` set to the approved compliance wording (e.g., "IELTS-style practice test", "PTE-style practice test", "Duolingo-style practice test").
- `exam_sections` per exam type ( Listening / Reading / Writing Task 1 / Writing Task 2 / Speaking Part 1–3 etc. as appropriate per exam).
- 26+ `exam_question_types` covering all 40+ TypeScript-declared question types (multiple-choice, true-false-not-given, matching-headings, fill-blanks, short-answer, sentence-completion, matching-features, reading-mcq, writing-task1, writing-task2, speaking-part1/2/3, read-aloud, repeat-sentence, describe-image, summarize-written-text, essay, reorder-paragraphs, write-from-dictation, read-and-select, listen-and-select, writing-sample, speaking-sample, complete-the-sentence, vocabulary-in-context, text-completion, sentence-equivalence, quantitative-comparison, grid-in, data-sufficiency, critical-reasoning, sentence-correction, data-insights, logic-game, issue-task, central-idea, standard-english, data-interpretation).
- Default RBAC: roles (`SUPER_ADMIN`, `ADMIN`, `EXAM_MANAGER`, `TEACHER`, `EXAMINER`, `SUPPORT_STAFF`, `AMBASSADOR`, `VIEWER`, `STUDENT`) and the full permission catalogue in `config/permissions.php`.
- A default admin user (password from env) — see `scripts/reset_admin_password.php` for resets.
- Default `exam_settings` keys: `platform_version=1.0.0`, `support_email`, `weekly_update_enabled=true`, `weekly_update_day=monday`, `weekly_update_time=02:00`, `weekly_update_questions_target=20`, `weekly_update_reviewer_required=true`, `weekly_update_auto_publish=false`, `attempt_default_buffer_minutes=5`, `terms_version`, `privacy_version`, free quota defaults.

## 5. Practice set seed (`question_sets_seed.sql`)

Run **after** `install.sql` and `seed.sql`. Idempotent under `INSERT IGNORE`.

| Insert target | Rows seeded |
|---|---:|
| `exam_practice_sets` | 320 |
| `exam_practice_set_sections` | 1,530 |
| `exam_questions` (placeholder originals for published sets) | 480 |
| `exam_practice_set_questions` (links) | 480 |

See report `03_QUESTION_SET_AUDIT.md` for the per-exam breakdown.

## 6. Confirmations

| Item | Confirmed |
|---|---|
| All 44 tables use `ENGINE=InnoDB` | ✅ |
| All 44 tables use `DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` | ✅ |
| 49 named FK constraints with explicit `ON DELETE` policies | ✅ |
| 150 KEY/UNIQUE/PRIMARY index declarations | ✅ |
| UNIQUE constraints on all natural keys (email, codes, week range) | ✅ |
| Native JSON columns (not TEXT) for structured payloads | ✅ |
| `exam_practice_sets` comment explicitly states "10 per exam × 32 exams = 320" | ✅ |
| `exam_audit_logs` indexes on actor, entity, created_at for fast filtering | ✅ |
| `exam_weekly_updates` UNIQUE(week_start, week_end) for idempotent cron | ✅ |
| `exam_free_quota` UNIQUE(email) — single source of truth for quota | ✅ |
| `exam_question_versions` snapshot history per question | ✅ |
| `exam_crm_sync_logs` tracks push/pull + retry | ✅ |

---

**Schema audit status:** COMPLETE. 44 tables, 49 FKs, 150 indexes, all InnoDB + utf8mb4_unicode_ci.
