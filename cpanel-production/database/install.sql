-- =============================================================================
-- ALO English Test Platform - MySQL 8.0 Schema (install.sql)
-- =============================================================================
-- Project  : ALO English Test Platform (cPanel production package)
-- Engine   : InnoDB / utf8mb4_unicode_ci
-- Scope    : 54 tables covering auth, students, exams, questions, practice sets,
--            mock attempts, scoring, speaking/writing review, CRM sync, vouchers,
--            payments, leads, marketing, weekly updates, versioning, approvals,
--            uploads, proctoring, audit, settings, terms, cron logs, plus 10
--            AI Agent Employee workforce tables (intake, eligibility, setup,
--            proctor, evaluation, scoring, feedback, reports, CRM sync,
--            content, compliance, audit, support).
-- Notes    : Original content only. No official exam items reproduced anywhere.
--            Practice-only disclaimers stored on practice sets, attempts, and reports.
-- =============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY';
SET foreign_key_checks = 0;

-- -----------------------------------------------------------------------------
-- Drop existing (idempotent reinstall)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS exam_cron_logs;
DROP TABLE IF EXISTS exam_terms_acceptance;
DROP TABLE IF EXISTS exam_settings;
DROP TABLE IF EXISTS exam_audit_logs;
DROP TABLE IF EXISTS exam_proctor_logs;
DROP TABLE IF EXISTS exam_uploads;
DROP TABLE IF EXISTS exam_admin_approvals;
DROP TABLE IF EXISTS exam_question_review_queue;
DROP TABLE IF EXISTS exam_question_versions;
DROP TABLE IF EXISTS exam_weekly_updates;
DROP TABLE IF EXISTS exam_crm_sync_logs;
DROP TABLE IF EXISTS exam_marketing_sources;
DROP TABLE IF EXISTS exam_consultation_bookings;
DROP TABLE IF EXISTS exam_leads;
DROP TABLE IF EXISTS exam_payments;
DROP TABLE IF EXISTS exam_voucher_usage;
DROP TABLE IF EXISTS exam_vouchers;
DROP TABLE IF EXISTS exam_free_quota;
DROP TABLE IF EXISTS exam_certificates;
DROP TABLE IF EXISTS exam_reports;
DROP TABLE IF EXISTS exam_feedback;
DROP TABLE IF EXISTS exam_writing_submissions;
DROP TABLE IF EXISTS exam_speaking_sessions;
DROP TABLE IF EXISTS exam_score_breakdown;
DROP TABLE IF EXISTS exam_scores;
DROP TABLE IF EXISTS exam_answers;
DROP TABLE IF EXISTS exam_attempt_sections;
DROP TABLE IF EXISTS exam_mock_attempts;
DROP TABLE IF EXISTS exam_practice_set_questions;
DROP TABLE IF EXISTS exam_practice_set_sections;
DROP TABLE IF EXISTS exam_practice_sets;
DROP TABLE IF EXISTS exam_question_media;
DROP TABLE IF EXISTS exam_question_options;
DROP TABLE IF EXISTS exam_questions;
DROP TABLE IF EXISTS exam_question_types;
DROP TABLE IF EXISTS exam_modules;
DROP TABLE IF EXISTS exam_sections;
DROP TABLE IF EXISTS exam_types;
DROP TABLE IF EXISTS exam_categories;
DROP TABLE IF EXISTS exam_user_roles;
DROP TABLE IF EXISTS exam_permissions;
DROP TABLE IF EXISTS exam_roles;
DROP TABLE IF EXISTS exam_students;
DROP TABLE IF EXISTS exam_users;

-- -----------------------------------------------------------------------------
-- 1. exam_users  (auth identity)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_users (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_code         VARCHAR(32)  NOT NULL,
    name              VARCHAR(150) NOT NULL,
    email             VARCHAR(190) NOT NULL,
    phone             VARCHAR(40)  NULL,
    password_hash     VARCHAR(255) NOT NULL,
    status            ENUM('active','suspended','pending','deleted') NOT NULL DEFAULT 'pending',
    email_verified_at DATETIME     NULL,
    last_login_at     DATETIME     NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_phone (phone),
    KEY idx_users_code (user_code),
    KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Auth identity for all portal users';

-- -----------------------------------------------------------------------------
-- 2. exam_students  (student profile, ALO CRM linkage)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_students (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_code        VARCHAR(32)  NOT NULL,
    user_id             BIGINT UNSIGNED NOT NULL,
    alo_student_id      VARCHAR(64)  NULL,
    alo_lead_id         VARCHAR(64)  NULL,
    alo_application_id  VARCHAR(64)  NULL,
    alo_partner_id      VARCHAR(64)  NULL,
    ambassador_id       BIGINT UNSIGNED NULL,
    name                VARCHAR(150) NOT NULL,
    email               VARCHAR(190) NOT NULL,
    phone               VARCHAR(40)  NULL,
    country_interest    VARCHAR(64)  NULL,
    course_interest     VARCHAR(120) NULL,
    test_goal           VARCHAR(120) NULL,
    profile_status      ENUM('incomplete','draft','submitted','verified','rejected') NOT NULL DEFAULT 'incomplete',
    eligibility_status  ENUM('unknown','eligible','review','ineligible') NOT NULL DEFAULT 'unknown',
    status              ENUM('active','suspended','graduated','archived') NOT NULL DEFAULT 'active',
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_students_code (student_code),
    KEY idx_students_alo_student (alo_student_id),
    KEY idx_students_alo_application (alo_application_id),
    KEY idx_students_ambassador (ambassador_id),
    KEY idx_students_user (user_id),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES exam_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student profile linked to ALO CRM records';

-- -----------------------------------------------------------------------------
-- 3. exam_roles
-- -----------------------------------------------------------------------------
CREATE TABLE exam_roles (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    role_code   VARCHAR(48)  NOT NULL,
    role_name   VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    is_system   TINYINT(1)   NOT NULL DEFAULT 0,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Platform roles';

-- -----------------------------------------------------------------------------
-- 4. exam_permissions
-- -----------------------------------------------------------------------------
CREATE TABLE exam_permissions (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    permission_code VARCHAR(64)  NOT NULL,
    permission_name VARCHAR(120) NOT NULL,
    module          VARCHAR(48)  NOT NULL,
    description     VARCHAR(255) NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_perms_code (permission_code),
    KEY idx_perms_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Granular permissions';

-- -----------------------------------------------------------------------------
-- 5. exam_user_roles
-- -----------------------------------------------------------------------------
CREATE TABLE exam_user_roles (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL,
    role_id    INT UNSIGNED    NOT NULL,
    scope      ENUM('global','exam_type','student','partner') NOT NULL DEFAULT 'global',
    scope_ref  VARCHAR(64) NULL,
    granted_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by BIGINT UNSIGNED NULL,
    expires_at DATETIME    NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_role (user_id, role_id, scope, scope_ref),
    KEY idx_ur_role (role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES exam_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES exam_roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User-role assignments with optional scope';

-- -----------------------------------------------------------------------------
-- 6. exam_categories  (5 top-level categories)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_categories (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    code        VARCHAR(32)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cat_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Top-level exam categories (5)';

-- -----------------------------------------------------------------------------
-- 7. exam_types  (32 exams)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_types (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    type_code        VARCHAR(32)  NOT NULL,
    type_name        VARCHAR(120) NOT NULL,
    category_id      INT UNSIGNED NOT NULL,
    description      VARCHAR(500) NULL,
    duration_minutes INT          NOT NULL DEFAULT 0,
    score_scale      VARCHAR(64)  NOT NULL,
    style_label      VARCHAR(120) NOT NULL,
    is_active        TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order       INT          NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_type_code (type_code),
    KEY idx_type_category (category_id),
    KEY idx_type_active (is_active),
    CONSTRAINT fk_type_category FOREIGN KEY (category_id) REFERENCES exam_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='32 supported computer-based exam types';

-- -----------------------------------------------------------------------------
-- 8. exam_sections  (sections inside an exam type)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_sections (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    exam_type_id     INT UNSIGNED NOT NULL,
    section_code     VARCHAR(48)  NOT NULL,
    section_name     VARCHAR(120) NOT NULL,
    description      VARCHAR(255) NULL,
    duration_minutes INT          NOT NULL DEFAULT 0,
    question_count   INT          NOT NULL DEFAULT 0,
    sort_order       INT          NOT NULL DEFAULT 0,
    is_active        TINYINT(1)   NOT NULL DEFAULT 1,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_section_type_code (exam_type_id, section_code),
    KEY idx_section_type (exam_type_id),
    CONSTRAINT fk_section_type FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sections per exam type';

-- -----------------------------------------------------------------------------
-- 9. exam_modules  (sub-modules within a section, e.g. SAT module 1 / module 2)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_modules (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    section_id       INT UNSIGNED NOT NULL,
    module_code      VARCHAR(48)  NOT NULL,
    module_name      VARCHAR(120) NOT NULL,
    duration_minutes INT          NOT NULL DEFAULT 0,
    question_count   INT          NOT NULL DEFAULT 0,
    sort_order       INT          NOT NULL DEFAULT 0,
    is_adaptive      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_module_section_code (section_id, module_code),
    KEY idx_module_section (section_id),
    CONSTRAINT fk_module_section FOREIGN KEY (section_id) REFERENCES exam_sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Adaptive/static modules per section';

-- -----------------------------------------------------------------------------
-- 10. exam_question_types  (26+ CBT item types)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_question_types (
    id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
    type_code         VARCHAR(48)  NOT NULL,
    type_name         VARCHAR(120) NOT NULL,
    response_format   ENUM('single_mcq','multi_mcq','numeric','text','long_text','audio','reorder','matching','dropdown','grid_in','quant_comparison','data_sufficiency','speaking','writing','file_upload') NOT NULL,
    is_graded_auto    TINYINT(1)   NOT NULL DEFAULT 1,
    description       VARCHAR(255) NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_qtype_code (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='26+ question/response types';

-- -----------------------------------------------------------------------------
-- 11. exam_questions  (master question bank)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_questions (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    question_code       VARCHAR(64)  NOT NULL,
    exam_type_id        INT UNSIGNED NOT NULL,
    section_id          INT UNSIGNED NULL,
    question_type_id    INT UNSIGNED NOT NULL,
    question_text       TEXT         NOT NULL,
    question_html       MEDIUMTEXT   NULL,
    passage_text        MEDIUMTEXT   NULL,
    audio_path          VARCHAR(255) NULL,
    image_path          VARCHAR(255) NULL,
    correct_answer_json JSON         NULL,
    explanation         MEDIUMTEXT   NULL,
    difficulty          ENUM('easy','medium','hard','advanced') NOT NULL DEFAULT 'medium',
    score_value         DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    negative_marking    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tags                VARCHAR(255) NULL,
    is_active           TINYINT(1)   NOT NULL DEFAULT 1,
    version             INT          NOT NULL DEFAULT 1,
    created_by          BIGINT UNSIGNED NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_question_code (question_code),
    KEY idx_q_exam_type (exam_type_id),
    KEY idx_q_section (section_id),
    KEY idx_q_type (question_type_id),
    KEY idx_q_difficulty (difficulty),
    KEY idx_q_active (is_active),
    CONSTRAINT fk_q_exam_type FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_q_section FOREIGN KEY (section_id) REFERENCES exam_sections(id) ON DELETE SET NULL,
    CONSTRAINT fk_q_type FOREIGN KEY (question_type_id) REFERENCES exam_question_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master question bank - 100% original content';

-- -----------------------------------------------------------------------------
-- 12. exam_question_options
-- -----------------------------------------------------------------------------
CREATE TABLE exam_question_options (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id    BIGINT UNSIGNED NOT NULL,
    option_label   VARCHAR(8)   NOT NULL,
    option_text    TEXT         NOT NULL,
    is_correct     TINYINT(1)   NOT NULL DEFAULT 0,
    option_order   INT          NOT NULL DEFAULT 0,
    explanation    VARCHAR(500) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_qopt_q_label (question_id, option_label),
    KEY idx_qopt_question (question_id),
    CONSTRAINT fk_qopt_question FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Multiple-choice options per question';

-- -----------------------------------------------------------------------------
-- 13. exam_question_media
-- -----------------------------------------------------------------------------
CREATE TABLE exam_question_media (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id    BIGINT UNSIGNED NOT NULL,
    media_type     ENUM('image','audio','video','passage','diagram','transcript') NOT NULL,
    storage_path   VARCHAR(255) NOT NULL,
    caption        VARCHAR(255) NULL,
    duration_ms    INT          NULL,
    sort_order     INT          NOT NULL DEFAULT 0,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_media_question (question_id),
    CONSTRAINT fk_media_question FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Question media attachments';

-- -----------------------------------------------------------------------------
-- 14. exam_practice_sets
-- -----------------------------------------------------------------------------
CREATE TABLE exam_practice_sets (
    id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    set_code              VARCHAR(48)  NOT NULL,
    exam_type_id          INT UNSIGNED NOT NULL,
    title                 VARCHAR(180) NOT NULL,
    description           VARCHAR(500) NULL,
    difficulty            ENUM('easy','medium','hard','advanced') NOT NULL DEFAULT 'medium',
    total_duration_minutes INT         NOT NULL DEFAULT 0,
    total_questions       INT          NOT NULL DEFAULT 0,
    scoring_rule_json     JSON         NULL,
    instructions          MEDIUMTEXT   NULL,
    disclaimer            VARCHAR(500) NOT NULL,
    version               INT          NOT NULL DEFAULT 1,
    is_published          TINYINT(1)   NOT NULL DEFAULT 0,
    created_by            BIGINT UNSIGNED NULL,
    reviewed_by           BIGINT UNSIGNED NULL,
    approved_by           BIGINT UNSIGNED NULL,
    created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_set_code (set_code),
    KEY idx_set_exam_type (exam_type_id),
    KEY idx_set_published (is_published),
    KEY idx_set_difficulty (difficulty),
    CONSTRAINT fk_set_exam_type FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Curated practice sets (10 per exam x 32 exams = 320)';

-- -----------------------------------------------------------------------------
-- 15. exam_practice_set_sections
-- -----------------------------------------------------------------------------
CREATE TABLE exam_practice_set_sections (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    practice_set_id   BIGINT UNSIGNED NOT NULL,
    section_id        INT UNSIGNED NULL,
    section_label     VARCHAR(120) NOT NULL,
    question_count    INT          NOT NULL DEFAULT 0,
    duration_minutes  INT          NOT NULL DEFAULT 0,
    sort_order        INT          NOT NULL DEFAULT 0,
    instructions      VARCHAR(500) NULL,
    PRIMARY KEY (id),
    KEY idx_pss_set (practice_set_id),
    KEY idx_pss_section (section_id),
    CONSTRAINT fk_pss_set FOREIGN KEY (practice_set_id) REFERENCES exam_practice_sets(id) ON DELETE CASCADE,
    CONSTRAINT fk_pss_section FOREIGN KEY (section_id) REFERENCES exam_sections(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Section definitions per practice set';

-- -----------------------------------------------------------------------------
-- 16. exam_practice_set_questions
-- -----------------------------------------------------------------------------
CREATE TABLE exam_practice_set_questions (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    practice_set_id BIGINT UNSIGNED NOT NULL,
    set_section_id  BIGINT UNSIGNED NULL,
    question_id     BIGINT UNSIGNED NULL,
    section_label   VARCHAR(120) NULL,
    sort_order      INT          NOT NULL DEFAULT 0,
    is_sample       TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_psq_set_q_order (practice_set_id, question_id, sort_order),
    KEY idx_psq_set (practice_set_id),
    KEY idx_psq_section (set_section_id),
    KEY idx_psq_question (question_id),
    CONSTRAINT fk_psq_set FOREIGN KEY (practice_set_id) REFERENCES exam_practice_sets(id) ON DELETE CASCADE,
    CONSTRAINT fk_psq_section FOREIGN KEY (set_section_id) REFERENCES exam_practice_set_sections(id) ON DELETE CASCADE,
    CONSTRAINT fk_psq_question FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Question linking table for practice sets';

-- -----------------------------------------------------------------------------
-- 17. exam_mock_attempts
-- -----------------------------------------------------------------------------
CREATE TABLE exam_mock_attempts (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attempt_code        VARCHAR(48)  NOT NULL,
    student_id          BIGINT UNSIGNED NOT NULL,
    practice_set_id     BIGINT UNSIGNED NULL,
    exam_type_id        INT UNSIGNED NOT NULL,
    status              ENUM('in_progress','paused','submitted','expired','abandoned','graded') NOT NULL DEFAULT 'in_progress',
    started_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at        DATETIME     NULL,
    expires_at          DATETIME     NULL,
    time_used_seconds   INT          NOT NULL DEFAULT 0,
    overall_score       DECIMAL(6,2) NULL,
    band_estimate       VARCHAR(8)   NULL,
    cefr_estimate       VARCHAR(4)   NULL,
    free_or_paid        ENUM('free','paid','voucher','scholarship') NOT NULL DEFAULT 'free',
    source              ENUM('web','mobile','partner','ambassador','admin') NOT NULL DEFAULT 'web',
    crm_student_id      VARCHAR(64)  NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attempt_code (attempt_code),
    KEY idx_attempt_student (student_id),
    KEY idx_attempt_status (status),
    KEY idx_attempt_exam_type (exam_type_id),
    KEY idx_attempt_practice_set (practice_set_id),
    CONSTRAINT fk_attempt_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_attempt_practice_set FOREIGN KEY (practice_set_id) REFERENCES exam_practice_sets(id) ON DELETE SET NULL,
    CONSTRAINT fk_attempt_exam_type FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student mock test attempts';

-- -----------------------------------------------------------------------------
-- 18. exam_attempt_sections
-- -----------------------------------------------------------------------------
CREATE TABLE exam_attempt_sections (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attempt_id        BIGINT UNSIGNED NOT NULL,
    section_label     VARCHAR(120) NOT NULL,
    started_at        DATETIME     NULL,
    submitted_at      DATETIME     NULL,
    time_used_seconds INT          NOT NULL DEFAULT 0,
    section_score     DECIMAL(6,2) NULL,
    PRIMARY KEY (id),
    KEY idx_as_attempt (attempt_id),
    CONSTRAINT fk_as_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Per-section tracking within an attempt';

-- -----------------------------------------------------------------------------
-- 19. exam_answers
-- -----------------------------------------------------------------------------
CREATE TABLE exam_answers (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attempt_id      BIGINT UNSIGNED NOT NULL,
    question_id     BIGINT UNSIGNED NULL,
    set_section_id  BIGINT UNSIGNED NULL,
    answer_json     JSON         NULL,
    text_answer     MEDIUMTEXT   NULL,
    audio_path      VARCHAR(255) NULL,
    is_correct      TINYINT(1)   NULL,
    score_awarded   DECIMAL(5,2) NULL,
    time_spent_seconds INT       NOT NULL DEFAULT 0,
    flagged         TINYINT(1)   NOT NULL DEFAULT 0,
    answered_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ans_attempt (attempt_id),
    KEY idx_ans_question (question_id),
    CONSTRAINT fk_ans_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_ans_question FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Per-question student answers';

-- -----------------------------------------------------------------------------
-- 20. exam_scores
-- -----------------------------------------------------------------------------
CREATE TABLE exam_scores (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attempt_id      BIGINT UNSIGNED NOT NULL,
    overall_score   DECIMAL(6,2) NULL,
    overall_band    VARCHAR(8)   NULL,
    cefr_level      VARCHAR(4)   NULL,
    percentile      DECIMAL(5,2) NULL,
    graded_at       DATETIME     NULL,
    graded_by       BIGINT UNSIGNED NULL,
    report_path     VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_score_attempt (attempt_id),
    CONSTRAINT fk_score_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Final score for an attempt';

-- -----------------------------------------------------------------------------
-- 21. exam_score_breakdown
-- -----------------------------------------------------------------------------
CREATE TABLE exam_score_breakdown (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    score_id        BIGINT UNSIGNED NOT NULL,
    dimension       VARCHAR(64)  NOT NULL,
    raw_score       DECIMAL(6,2) NULL,
    scaled_score    DECIMAL(6,2) NULL,
    band            VARCHAR(8)   NULL,
    feedback        VARCHAR(500) NULL,
    PRIMARY KEY (id),
    KEY idx_sb_score (score_id),
    CONSTRAINT fk_sb_score FOREIGN KEY (score_id) REFERENCES exam_scores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Section/skill breakdown';

-- -----------------------------------------------------------------------------
-- 22. exam_speaking_sessions
-- -----------------------------------------------------------------------------
CREATE TABLE exam_speaking_sessions (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attempt_id      BIGINT UNSIGNED NULL,
    student_id      BIGINT UNSIGNED NOT NULL,
    question_id     BIGINT UNSIGNED NULL,
    section_label   VARCHAR(120) NULL,
    audio_path      VARCHAR(255) NULL,
    duration_seconds INT         NOT NULL DEFAULT 0,
    transcript_text MEDIUMTEXT   NULL,
    fluency_score   DECIMAL(4,2) NULL,
    pronunciation_score DECIMAL(4,2) NULL,
    grammar_score   DECIMAL(4,2) NULL,
    vocabulary_score DECIMAL(4,2) NULL,
    coherence_score DECIMAL(4,2) NULL,
    overall_band    VARCHAR(8)   NULL,
    ai_feedback_json JSON        NULL,
    status          ENUM('pending','ai_graded','examiner_review','finalized','failed') NOT NULL DEFAULT 'pending',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_speak_attempt (attempt_id),
    KEY idx_speak_student (student_id),
    KEY idx_speak_status (status),
    CONSTRAINT fk_speak_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_speak_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Speaking test sessions and AI grading';

-- -----------------------------------------------------------------------------
-- 23. exam_writing_submissions
-- -----------------------------------------------------------------------------
CREATE TABLE exam_writing_submissions (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attempt_id        BIGINT UNSIGNED NULL,
    student_id        BIGINT UNSIGNED NOT NULL,
    question_id       BIGINT UNSIGNED NULL,
    section_label     VARCHAR(120) NULL,
    response_text     MEDIUMTEXT   NOT NULL,
    word_count        INT          NOT NULL DEFAULT 0,
    task_achievement  DECIMAL(4,2) NULL,
    coherence_cohesion DECIMAL(4,2) NULL,
    lexical_resource DECIMAL(4,2) NULL,
    grammar_accuracy DECIMAL(4,2) NULL,
    overall_band      VARCHAR(8)   NULL,
    ai_feedback_json  JSON         NULL,
    examiner_id       BIGINT UNSIGNED NULL,
    examiner_feedback MEDIUMTEXT   NULL,
    status            ENUM('pending','ai_graded','examiner_review','resubmitted','finalized') NOT NULL DEFAULT 'pending',
    submitted_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at       DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_write_attempt (attempt_id),
    KEY idx_write_student (student_id),
    KEY idx_write_status (status),
    CONSTRAINT fk_write_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_write_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Writing task submissions and grading';

-- -----------------------------------------------------------------------------
-- 24. exam_feedback
-- -----------------------------------------------------------------------------
CREATE TABLE exam_feedback (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attempt_id   BIGINT UNSIGNED NULL,
    student_id   BIGINT UNSIGNED NOT NULL,
    feedback_type ENUM('ai','examiner','system','counselor') NOT NULL DEFAULT 'ai',
    dimension    VARCHAR(64)  NULL,
    content      MEDIUMTEXT   NOT NULL,
    rating       TINYINT      NULL,
    authored_by  BIGINT UNSIGNED NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_fb_attempt (attempt_id),
    KEY idx_fb_student (student_id),
    CONSTRAINT fk_fb_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_fb_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Consolidated feedback records';

-- -----------------------------------------------------------------------------
-- 25. exam_reports
-- -----------------------------------------------------------------------------
CREATE TABLE exam_reports (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    report_code   VARCHAR(48)  NOT NULL,
    attempt_id    BIGINT UNSIGNED NOT NULL,
    student_id    BIGINT UNSIGNED NOT NULL,
    report_type   ENUM('score','diagnostic','weekly','progress','counselor','visa_pack') NOT NULL DEFAULT 'score',
    pdf_path      VARCHAR(255) NULL,
    summary_json  JSON         NULL,
    generated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_report_code (report_code),
    KEY idx_report_attempt (attempt_id),
    KEY idx_report_student (student_id),
    CONSTRAINT fk_report_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Generated PDF/HTML reports';

-- -----------------------------------------------------------------------------
-- 26. exam_certificates
-- -----------------------------------------------------------------------------
CREATE TABLE exam_certificates (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    certificate_code VARCHAR(48) NOT NULL,
    student_id      BIGINT UNSIGNED NOT NULL,
    attempt_id      BIGINT UNSIGNED NULL,
    exam_type_id    INT UNSIGNED NOT NULL,
    issued_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    certificate_url VARCHAR(255) NULL,
    verification_hash VARCHAR(64) NULL,
    status          ENUM('issued','revoked','replaced') NOT NULL DEFAULT 'issued',
    PRIMARY KEY (id),
    UNIQUE KEY uq_cert_code (certificate_code),
    KEY idx_cert_student (student_id),
    CONSTRAINT fk_cert_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cert_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE SET NULL,
    CONSTRAINT fk_cert_type FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Practice completion certificates';

-- -----------------------------------------------------------------------------
-- 27. exam_free_quota  (free attempts enforced per email/device)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_free_quota (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id          BIGINT UNSIGNED NULL,
    email               VARCHAR(190) NOT NULL,
    phone               VARCHAR(40)  NULL,
    alo_student_id      VARCHAR(64)  NULL,
    total_free_allowed  INT          NOT NULL DEFAULT 1,
    total_free_used     INT          NOT NULL DEFAULT 0,
    device_fingerprint  VARCHAR(255) NULL,
    last_ip             VARCHAR(45)  NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_quota_email (email),
    KEY idx_quota_alo (alo_student_id),
    KEY idx_quota_student (student_id),
    CONSTRAINT fk_quota_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Free attempt quota per student/email/device';

-- -----------------------------------------------------------------------------
-- 28. exam_vouchers
-- -----------------------------------------------------------------------------
CREATE TABLE exam_vouchers (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    voucher_code      VARCHAR(48)  NOT NULL,
    voucher_type      ENUM('free_mock','discount','full_test','scholarship','partner_credit','ambassador_reward') NOT NULL DEFAULT 'free_mock',
    student_id        BIGINT UNSIGNED NULL,
    partner_id        VARCHAR(64)  NULL,
    ambassador_id     BIGINT UNSIGNED NULL,
    alo_application_id VARCHAR(64) NULL,
    usage_limit       INT          NOT NULL DEFAULT 1,
    used_count        INT          NOT NULL DEFAULT 0,
    expires_at        DATETIME     NULL,
    status            ENUM('active','redeemed','expired','revoked') NOT NULL DEFAULT 'active',
    created_by        BIGINT UNSIGNED NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_voucher_code (voucher_code),
    KEY idx_voucher_student (student_id),
    KEY idx_voucher_ambassador (ambassador_id),
    CONSTRAINT fk_voucher_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Voucher codes for free/paid attempts';

-- -----------------------------------------------------------------------------
-- 29. exam_voucher_usage
-- -----------------------------------------------------------------------------
CREATE TABLE exam_voucher_usage (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    voucher_id   BIGINT UNSIGNED NOT NULL,
    student_id   BIGINT UNSIGNED NOT NULL,
    attempt_id   BIGINT UNSIGNED NULL,
    redeemed_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address   VARCHAR(45)  NULL,
    PRIMARY KEY (id),
    KEY idx_vu_voucher (voucher_id),
    KEY idx_vu_student (student_id),
    CONSTRAINT fk_vu_voucher FOREIGN KEY (voucher_id) REFERENCES exam_vouchers(id) ON DELETE CASCADE,
    CONSTRAINT fk_vu_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_vu_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Voucher redemption history';

-- -----------------------------------------------------------------------------
-- 30. exam_payments
-- -----------------------------------------------------------------------------
CREATE TABLE exam_payments (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_code      VARCHAR(48)  NOT NULL,
    student_id        BIGINT UNSIGNED NOT NULL,
    attempt_id        BIGINT UNSIGNED NULL,
    amount            DECIMAL(10,2) NOT NULL,
    currency          VARCHAR(3)   NOT NULL DEFAULT 'USD',
    gateway           ENUM('stripe','paypal','razorpay','manual','partner') NOT NULL DEFAULT 'stripe',
    gateway_ref       VARCHAR(128) NULL,
    status            ENUM('pending','success','failed','refunded','disputed') NOT NULL DEFAULT 'pending',
    paid_at           DATETIME     NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pay_code (payment_code),
    KEY idx_pay_student (student_id),
    KEY idx_pay_status (status),
    CONSTRAINT fk_pay_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Payment records';

-- -----------------------------------------------------------------------------
-- 31. exam_leads
-- -----------------------------------------------------------------------------
CREATE TABLE exam_leads (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    lead_code       VARCHAR(48)  NOT NULL,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(190) NOT NULL,
    phone           VARCHAR(40)  NULL,
    country_interest VARCHAR(64) NULL,
    course_interest VARCHAR(120) NULL,
    test_goal       VARCHAR(120) NULL,
    source          VARCHAR(64)  NULL,
    ambassador_id   BIGINT UNSIGNED NULL,
    partner_id      VARCHAR(64)  NULL,
    status          ENUM('new','contacted','qualified','enrolled','lost','duplicate') NOT NULL DEFAULT 'new',
    crm_lead_id     VARCHAR(64)  NULL,
    notes           TEXT         NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_lead_code (lead_code),
    KEY idx_lead_email (email),
    KEY idx_lead_ambassador (ambassador_id),
    KEY idx_lead_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Marketing leads captured by the platform';

-- -----------------------------------------------------------------------------
-- 32. exam_consultation_bookings
-- -----------------------------------------------------------------------------
CREATE TABLE exam_consultation_bookings (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id      BIGINT UNSIGNED NULL,
    lead_id         BIGINT UNSIGNED NULL,
    counselor_id    BIGINT UNSIGNED NULL,
    slot_at         DATETIME     NOT NULL,
    duration_minutes INT         NOT NULL DEFAULT 30,
    channel         ENUM('video','phone','in_person','chat') NOT NULL DEFAULT 'video',
    status          ENUM('requested','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'requested',
    notes           TEXT         NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_book_student (student_id),
    KEY idx_book_lead (lead_id),
    KEY idx_book_slot (slot_at),
    CONSTRAINT fk_book_student FOREIGN KEY (student_id) REFERENCES exam_students(id) ON DELETE SET NULL,
    CONSTRAINT fk_book_lead FOREIGN KEY (lead_id) REFERENCES exam_leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Counselor consultation bookings';

-- -----------------------------------------------------------------------------
-- 33. exam_marketing_sources
-- -----------------------------------------------------------------------------
CREATE TABLE exam_marketing_sources (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    source_code   VARCHAR(48)  NOT NULL,
    source_name   VARCHAR(120) NOT NULL,
    channel       ENUM('organic','paid_search','social','email','referral','partner','ambassador','event','direct') NOT NULL DEFAULT 'direct',
    utm_source    VARCHAR(64)  NULL,
    utm_medium    VARCHAR(64)  NULL,
    utm_campaign  VARCHAR(120) NULL,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mkt_code (source_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Marketing source attribution';

-- -----------------------------------------------------------------------------
-- 34. exam_crm_sync_logs
-- -----------------------------------------------------------------------------
CREATE TABLE exam_crm_sync_logs (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    sync_code       VARCHAR(48)  NOT NULL,
    direction       ENUM('inbound','outbound') NOT NULL DEFAULT 'outbound',
    entity_type     VARCHAR(48)  NOT NULL,
    entity_id       VARCHAR(64)  NULL,
    crm_entity_id   VARCHAR(64)  NULL,
    endpoint        VARCHAR(255) NULL,
    status          ENUM('queued','success','failed','retry','skipped') NOT NULL DEFAULT 'queued',
    request_payload MEDIUMTEXT   NULL,
    response_payload MEDIUMTEXT  NULL,
    error_message   VARCHAR(500) NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_crm_entity (entity_type, entity_id),
    KEY idx_crm_status (status),
    KEY idx_crm_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ALO CRM two-way sync logs';

-- -----------------------------------------------------------------------------
-- 35. exam_weekly_updates  (platform content cadence reporting)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_weekly_updates (
    id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    update_code              VARCHAR(48)  NOT NULL,
    week_start               DATE         NOT NULL,
    week_end                 DATE         NOT NULL,
    exam_types_updated_json  JSON         NULL,
    questions_added          INT          NOT NULL DEFAULT 0,
    questions_approved       INT          NOT NULL DEFAULT 0,
    questions_rejected       INT          NOT NULL DEFAULT 0,
    status                   ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
    created_by               BIGINT UNSIGNED NULL,
    created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_week_code (update_code),
    KEY idx_week_range (week_start, week_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Weekly content update register';

-- -----------------------------------------------------------------------------
-- 36. exam_question_versions  (versioned question content)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_question_versions (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id     BIGINT UNSIGNED NOT NULL,
    version         INT          NOT NULL,
    snapshot_json   JSON         NOT NULL,
    changed_by      BIGINT UNSIGNED NULL,
    change_reason   VARCHAR(255) NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_qv_q_version (question_id, version),
    CONSTRAINT fk_qv_question FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Question content version history';

-- -----------------------------------------------------------------------------
-- 37. exam_question_review_queue
-- -----------------------------------------------------------------------------
CREATE TABLE exam_question_review_queue (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id   BIGINT UNSIGNED NOT NULL,
    review_stage  ENUM('draft','peer_review','examiner_review','editorial','approved','rejected') NOT NULL DEFAULT 'draft',
    reviewer_id   BIGINT UNSIGNED NULL,
    comments      TEXT         NULL,
    status        ENUM('pending','in_review','approved','rejected','needs_revision') NOT NULL DEFAULT 'pending',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_rq_question (question_id),
    KEY idx_rq_status (status),
    CONSTRAINT fk_rq_question FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Question editorial review workflow';

-- -----------------------------------------------------------------------------
-- 38. exam_admin_approvals
-- -----------------------------------------------------------------------------
CREATE TABLE exam_admin_approvals (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    entity_type   VARCHAR(48)  NOT NULL,
    entity_id     BIGINT UNSIGNED NOT NULL,
    action        VARCHAR(48)  NOT NULL,
    requested_by  BIGINT UNSIGNED NOT NULL,
    reviewed_by   BIGINT UNSIGNED NULL,
    status        ENUM('pending','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending',
    comments      TEXT         NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at   DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_aa_entity (entity_type, entity_id),
    KEY idx_aa_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Admin approval workflow records';

-- -----------------------------------------------------------------------------
-- 39. exam_uploads
-- -----------------------------------------------------------------------------
CREATE TABLE exam_uploads (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    uploader_id     BIGINT UNSIGNED NULL,
    entity_type     VARCHAR(48)  NOT NULL,
    entity_id       BIGINT UNSIGNED NULL,
    file_name       VARCHAR(255) NOT NULL,
    storage_path    VARCHAR(255) NOT NULL,
    mime_type       VARCHAR(80)  NULL,
    size_bytes      BIGINT       NULL,
    purpose         VARCHAR(64)  NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_up_entity (entity_type, entity_id),
    KEY idx_up_uploader (uploader_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Generic upload tracking';

-- -----------------------------------------------------------------------------
-- 40. exam_proctor_logs
-- -----------------------------------------------------------------------------
CREATE TABLE exam_proctor_logs (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attempt_id    BIGINT UNSIGNED NOT NULL,
    event_type    VARCHAR(48)  NOT NULL,
    event_details JSON         NULL,
    severity      ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
    snapshot_path VARCHAR(255) NULL,
    occurred_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pl_attempt (attempt_id),
    KEY idx_pl_severity (severity),
    CONSTRAINT fk_pl_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Proctoring/anti-cheat event log';

-- -----------------------------------------------------------------------------
-- 41. exam_audit_logs
-- -----------------------------------------------------------------------------
CREATE TABLE exam_audit_logs (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_user_id   BIGINT UNSIGNED NULL,
    action          VARCHAR(64)  NOT NULL,
    entity_type     VARCHAR(48)  NULL,
    entity_id       VARCHAR(64)  NULL,
    ip_address      VARCHAR(45)  NULL,
    user_agent      VARCHAR(255) NULL,
    details_json    JSON         NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_actor (actor_user_id),
    KEY idx_audit_entity (entity_type, entity_id),
    KEY idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Platform audit trail';

-- -----------------------------------------------------------------------------
-- 42. exam_settings  (key/value config)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_settings (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    setting_key   VARCHAR(96)  NOT NULL,
    setting_value MEDIUMTEXT   NULL,
    data_type     ENUM('string','int','bool','json','float') NOT NULL DEFAULT 'string',
    is_public     TINYINT(1)   NOT NULL DEFAULT 0,
    description   VARCHAR(255) NULL,
    updated_by    BIGINT UNSIGNED NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Platform configuration store';

-- -----------------------------------------------------------------------------
-- 43. exam_terms_acceptance
-- -----------------------------------------------------------------------------
CREATE TABLE exam_terms_acceptance (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id       BIGINT UNSIGNED NOT NULL,
    terms_version VARCHAR(32)  NOT NULL,
    policy_type   ENUM('terms','privacy','disclaimer','marketing','data_sharing') NOT NULL DEFAULT 'terms',
    accepted_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address    VARCHAR(45)  NULL,
    user_agent    VARCHAR(255) NULL,
    PRIMARY KEY (id),
    KEY idx_ta_user (user_id),
    CONSTRAINT fk_ta_user FOREIGN KEY (user_id) REFERENCES exam_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Terms & policy acceptance log';

-- -----------------------------------------------------------------------------
-- 44. exam_cron_logs
-- -----------------------------------------------------------------------------
CREATE TABLE exam_cron_logs (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    job_code      VARCHAR(64)  NOT NULL,
    started_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at   DATETIME     NULL,
    status        ENUM('running','success','failed','timeout') NOT NULL DEFAULT 'running',
    output        MEDIUMTEXT   NULL,
    error_message VARCHAR(500) NULL,
    duration_ms   INT          NULL,
    PRIMARY KEY (id),
    KEY idx_cron_job (job_code),
    KEY idx_cron_status (status),
    KEY idx_cron_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Scheduled job execution log';

SET foreign_key_checks = 1;

-- =============================================================================
-- SEED: exam_roles (11 roles)
-- =============================================================================
INSERT INTO exam_roles (role_code, role_name, description, is_system, sort_order) VALUES
('SUPER_ADMIN',       'Super Administrator',  'Full platform control including security and billing', 1, 1),
('ADMIN',             'Administrator',        'Platform administration excluding security-critical', 1, 2),
('EXAM_MANAGER',      'Exam Manager',         'Curates exams, questions, and practice sets',         1, 3),
('EXAMINER',          'Examiner',             'Reviews speaking & writing submissions',              1, 4),
('TEACHER',           'Teacher',              'Manages assigned student cohorts',                    1, 5),
('STUDENT',           'Student',              'Takes practice and mock tests',                       1, 6),
('PARTNER_STUDENT',   'Partner Student',      'Student admitted via a partner organization',         1, 7),
('AMBASSADOR',        'Ambassador',           'Refers students and earns vouchers',                  1, 8),
('CRM_SYNC_SERVICE',  'CRM Sync Service',     'Service account for ALO CRM two-way sync',            1, 9),
('SUPPORT_STAFF',     'Support Staff',        'Tier-1 customer support',                             1, 10),
('VIEWER',            'Viewer',               'Read-only analytics access',                          1, 11);

-- =============================================================================
-- SEED: exam_categories (5 categories)
-- =============================================================================
INSERT INTO exam_categories (code, name, description, sort_order) VALUES
('english',       'English Proficiency',     'Language proficiency tests (IELTS, PTE, TOEFL, Duolingo, etc.)', 1),
('study-abroad',  'Study Abroad Entrance',   'Standardized entrance tests (SAT, ACT, GRE, GMAT, LSAT, MCAT)', 2),
('university',    'University Internal',     'University placement, foundation, and scholarship tests',         3),
('visa',          'Visa / Interview',        'Credibility, CAS, visa, and admission interview practice',        4),
('alo-internal',  'ALO Internal',            'ALO counselor, readiness, diagnostic and document checks',       5);

-- =============================================================================
-- SEED: exam_types (32 exams across 5 categories)
--   category_id mapping: 1=english, 2=study-abroad, 3=university, 4=visa, 5=alo-internal
--   exam_type_id mapping (used by question_sets_seed.sql):
--     1=IELTS Academic, 2=IELTS General, 3=IELTS UKVI, 4=PTE Academic,
--     5=TOEFL iBT, 6=Duolingo English Test, 7=OIETC, 8=OET,
--     9=LanguageCert, 10=Linguaskill, 11=ALO Placement,
--     12=Digital SAT, 13=ACT, 14=GRE General, 15=GMAT Focus, 16=LSAT, 17=MCAT,
--     18=English Placement, 19=Math Placement, 20=Foundation Year, 21=Pre-Master, 22=Scholarship Test,
--     23=UK Credibility Interview, 24=CAS Interview, 25=Visa Interview, 26=Scholarship Visa Interview, 27=Admission Interview,
--     28=ALO Counselor Check, 29=ALO Student Readiness, 30=ALO English Diagnostic, 31=ALO Document Readiness, 32=ALO Visa Readiness
-- =============================================================================
INSERT INTO exam_types (type_code, type_name, category_id, description, duration_minutes, score_scale, style_label, is_active, sort_order) VALUES
-- English Proficiency (11)
('IELTS-ACAD',    'IELTS Academic',                  1, 'Academic English proficiency - Listening, Reading, Writing, Speaking',                  180, 'Band 0-9',       'IELTS-style academic practice test',           1,  1),
('IELTS-GEN',     'IELTS General Training',          1, 'General Training English proficiency for migration and work',                            165, 'Band 0-9',       'IELTS-style general training practice test',  1,  2),
('IELTS-UKVI',    'IELTS for UKVI',                  1, 'UKVI-approved Secure English Language Test (SELT)',                                      180, 'Band 0-9',       'IELTS UKVI-style practice test',              1,  3),
('PTE-ACAD',      'PTE Academic',                    1, 'Computer-based academic English proficiency test',                                       120, '10-90',          'PTE-style academic practice test',            1,  4),
('TOEFL-IBT',     'TOEFL iBT',                       1, 'Internet-based Test of English as a Foreign Language',                                   117, '0-120',          'TOEFL iBT-style practice test',               1,  5),
('DUOLINGO',      'Duolingo English Test',           1, 'Adaptive computer-based English proficiency test',                                        60, '10-160',         'Duolingo-style practice test',                1,  6),
('OIETC',         'OIETC',                           1, 'Online International English Test Certificate',                                           90, 'A1-C1',          'OIETC-style practice test',                   1,  7),
('OET',           'Occupational English Test',       1, 'Healthcare-profession English proficiency test',                                         165, 'A-E (0-500)',    'OET-style practice test',                     1,  8),
('LANGCERT',      'LanguageCert International ESOL', 1, 'International ESOL English proficiency certification',                                   165, 'A1-C2',          'LanguageCert-style practice test',            1,  9),
('LINGUASKILL',   'Linguaskill (Bulats)',            1, 'Adaptive business/general English proficiency test',                                     90, 'A1-C2',          'Linguaskill-style practice test',             1, 10),
('ALO-PLACE',     'ALO Placement Test',              1, 'ALO internal English placement for course level recommendation',                         90, 'A1-C2',          'ALO placement-style practice test',           1, 11),
-- Study Abroad Entrance (6)
('SAT',           'Digital SAT',                     2, 'Adaptive college admissions test (Reading/Writing + Math)',                              134, '400-1600',       'SAT-style practice test',                     1, 12),
('ACT',           'ACT',                             2, 'US college admissions test (English, Math, Reading, Science)',                           175, '1-36',           'ACT-style practice test',                     1, 13),
('GRE',           'GRE General Test',                2, 'Graduate school admissions (Verbal, Quant, Analytical Writing)',                         165, '130-170',        'GRE-style practice test',                     1, 14),
('GMAT',          'GMAT Focus Edition',              2, 'Business school admissions (Quant, Verbal, Data Insights)',                              135, '205-805',        'GMAT-style practice test',                    1, 15),
('LSAT',          'LSAT',                            2, 'Law school admissions test (Logical Reasoning, Reading, Logic Games)',                   175, '120-180',        'LSAT-style practice test',                    1, 16),
('MCAT',          'MCAT',                            2, 'Medical school admissions test (CARS, Bio, Chem/Phys, Psych/Soc)',                       375, '472-528',        'MCAT-style practice test',                    1, 17),
-- University Internal (5)
('ENG-PLACE',     'English Placement',               3, 'University internal English placement test',                                              60, 'A1-C2',          'University English placement-style practice', 1, 18),
('MATH-PLACE',    'Math Placement',                  3, 'University internal math placement test',                                                 90, '0-100',          'University math placement-style practice',    1, 19),
('FOUNDATION',    'Foundation Year Test',            3, 'Foundation program entry test',                                                          120, 'A1-C2',          'Foundation program-style practice test',      1, 20),
('PRE-MASTER',    'Pre-Master Test',                 3, 'Pre-Masters program entry test',                                                         120, 'A1-C2',          'Pre-masters program-style practice test',     1, 21),
('SCHOLARSHIP',   'Scholarship Test',                3, 'University scholarship qualifying test',                                                  90, '0-100',          'University scholarship-style practice test',  1, 22),
-- Visa / Interview (5)
('UK-CRED',       'UK Credibility Interview',        4, 'UK student visa credibility interview preparation',                                       30, 'Pass/Fail',      'UK credibility interview-style practice',     1, 23),
('CAS',           'CAS Interview',                   4, 'Confirmation of Acceptance for Studies interview preparation',                            30, 'Pass/Fail',      'CAS interview-style practice',                1, 24),
('VISA-INT',      'Visa Interview',                  4, 'General student visa interview preparation',                                              30, 'Pass/Fail',      'Visa interview-style practice',               1, 25),
('VISA-SCHOLAR',  'Scholarship Visa Interview',      4, 'Visa interview for scholarship-funded students',                                          30, 'Pass/Fail',      'Scholarship visa interview-style practice',   1, 26),
('ADMISSION',     'Admission Interview',             4, 'University admission interview preparation',                                              30, 'Pass/Fail',      'Admission interview-style practice',          1, 27),
-- ALO Internal (5)
('ALO-COUNSEL',   'ALO Counselor Check',             5, 'Counselor-led student readiness checkpoint',                                              45, 'Pass/Fail',      'ALO counselor check practice',                1, 28),
('ALO-READINESS', 'ALO Student Readiness',           5, 'End-to-end student readiness assessment',                                                 45, 'Pass/Fail',      'ALO student readiness practice',              1, 29),
('ALO-DIAG',      'ALO English Diagnostic',          5, 'Diagnostic English test for new ALO students',                                            60, 'A1-C2',          'ALO English diagnostic practice',             1, 30),
('ALO-DOC',       'ALO Document Readiness',          5, 'Document completeness and authenticity check',                                            30, 'Pass/Fail',      'ALO document readiness practice',             1, 31),
('ALO-VISA-READY','ALO Visa Readiness',              5, 'Visa pack readiness review before submission',                                            45, 'Pass/Fail',      'ALO visa readiness practice',                 1, 32);

-- =============================================================================
-- AI AGENT EMPLOYEE WORKFORCE (appended from ai_agents_addon.sql)
-- =============================================================================
-- Scope    : 10 agent tables + 20 AI Agent Employees seed + sample tasks, logs,
--            performance, approvals, and prompt library rows.
-- Compliance: Original content only. No official exam items reproduced.
--             All public-facing labels use ONLY approved wording:
--               "ALO Evaluation System", "Digital Practice Session",
--               "ALO Practice Examiner", "Practice Interview Coach",
--               "Automated Practice Feedback", "Smart Score Report",
--               "ALO Estimated Score Engine".
--             No claim of "AI teacher", "bot", "robot", "fake human",
--             "real examiner", "official examiner", or "official score"
--             appears anywhere in the public-facing labels.
--             internal_label uses "Agent" terminology for admin-only display.
-- Disclosure: "Some practice tests, scoring, feedback, and interview
--             simulations may be supported by automated digital evaluation
--             tools. This is a practice platform only, not an official
--             exam result."
-- =============================================================================

SET foreign_key_checks = 0;

-- -----------------------------------------------------------------------------
-- Drop existing agent tables (idempotent reinstall, reverse dependency order)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS exam_ai_agent_audit;
DROP TABLE IF EXISTS exam_ai_agent_performance;
DROP TABLE IF EXISTS exam_ai_agent_prompts;
DROP TABLE IF EXISTS exam_ai_agent_approvals;
DROP TABLE IF EXISTS exam_ai_agent_failures;
DROP TABLE IF EXISTS exam_ai_agent_settings;
DROP TABLE IF EXISTS exam_ai_agent_reviews;
DROP TABLE IF EXISTS exam_ai_agent_logs;
DROP TABLE IF EXISTS exam_ai_agent_tasks;
DROP TABLE IF EXISTS exam_ai_agents;

-- -----------------------------------------------------------------------------
-- 1. exam_ai_agents  (AI Agent Employee master register)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_ai_agents (
    id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_code              VARCHAR(48)  NOT NULL,
    agent_name              VARCHAR(150) NOT NULL,
    department              VARCHAR(80)  NOT NULL,
    responsibility          VARCHAR(500) NOT NULL,
    exam_scope              JSON         NOT NULL,
    is_active               TINYINT(1)   NOT NULL DEFAULT 1,
    public_label            VARCHAR(120) NOT NULL,
    internal_label          VARCHAR(120) NOT NULL,
    can_auto_execute        TINYINT(1)   NOT NULL DEFAULT 0,
    requires_admin_approval TINYINT(1)   NOT NULL DEFAULT 1,
    created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ai_agents_code (agent_code),
    KEY idx_ai_agents_code (agent_code),
    KEY idx_ai_agents_active (is_active),
    KEY idx_ai_agents_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI Agent Employee master register (admin-only "Agent" terminology)';

-- -----------------------------------------------------------------------------
-- 2. exam_ai_agent_tasks  (queued / running / completed agent jobs)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_ai_agent_tasks (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    task_code      VARCHAR(48)  NOT NULL,
    agent_id       BIGINT UNSIGNED NOT NULL,
    attempt_id     BIGINT UNSIGNED NULL,
    task_type      VARCHAR(80)  NOT NULL,
    payload        JSON         NULL,
    status         ENUM('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
    result         JSON         NULL,
    started_at     DATETIME     NULL,
    completed_at   DATETIME     NULL,
    error_message  TEXT         NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ai_tasks_code (task_code),
    KEY idx_ai_tasks_agent (agent_id),
    KEY idx_ai_tasks_status (status),
    KEY idx_ai_tasks_attempt (attempt_id),
    CONSTRAINT fk_ai_tasks_agent   FOREIGN KEY (agent_id)   REFERENCES exam_ai_agents(id)        ON DELETE CASCADE,
    CONSTRAINT fk_ai_tasks_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent task queue (one row per dispatched agent job)';

-- -----------------------------------------------------------------------------
-- 3. exam_ai_agent_logs  (operational log per agent action, append-only)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_ai_agent_logs (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_id     BIGINT UNSIGNED NOT NULL,
    attempt_id   BIGINT UNSIGNED NULL,
    action       VARCHAR(120) NOT NULL,
    entity_type  VARCHAR(80)  NOT NULL,
    entity_id    BIGINT UNSIGNED NULL,
    details      JSON         NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ai_logs_agent (agent_id),
    KEY idx_ai_logs_attempt (attempt_id),
    KEY idx_ai_logs_created (created_at),
    CONSTRAINT fk_ai_logs_agent   FOREIGN KEY (agent_id)   REFERENCES exam_ai_agents(id)     ON DELETE CASCADE,
    CONSTRAINT fk_ai_logs_attempt FOREIGN KEY (attempt_id) REFERENCES exam_mock_attempts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent operational log (append-only)';

-- -----------------------------------------------------------------------------
-- 4. exam_ai_agent_reviews  (question quality / scoring review queue)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_ai_agent_reviews (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_id         BIGINT UNSIGNED NOT NULL,
    question_id      BIGINT UNSIGNED NULL,
    review_type      VARCHAR(80)  NOT NULL,
    status           ENUM('pending','approved','rejected','flagged') NOT NULL DEFAULT 'pending',
    reviewer_user_id BIGINT UNSIGNED NULL,
    notes            TEXT         NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at      DATETIME     NULL,
    PRIMARY KEY (id),
    KEY idx_ai_reviews_agent (agent_id),
    KEY idx_ai_reviews_status (status),
    KEY idx_ai_reviews_question (question_id),
    CONSTRAINT fk_ai_reviews_agent    FOREIGN KEY (agent_id)    REFERENCES exam_ai_agents(id)  ON DELETE CASCADE,
    CONSTRAINT fk_ai_reviews_question FOREIGN KEY (question_id) REFERENCES exam_questions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent-generated review items (content quality / scoring reviews)';

-- -----------------------------------------------------------------------------
-- 5. exam_ai_agent_settings  (per-agent runtime configuration)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_ai_agent_settings (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_code    VARCHAR(48)  NOT NULL,
    setting_key   VARCHAR(120) NOT NULL,
    setting_value TEXT         NULL,
    is_secret     TINYINT(1)   NOT NULL DEFAULT 0,
    updated_by    BIGINT UNSIGNED NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ai_settings_agent_key (agent_code, setting_key),
    KEY idx_ai_settings_agent_code (agent_code),
    CONSTRAINT fk_ai_settings_updated_by FOREIGN KEY (updated_by) REFERENCES exam_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Per-agent runtime configuration (secrets are flagged, not decrypted on read)';

-- -----------------------------------------------------------------------------
-- 6. exam_ai_agent_failures  (agent error tracking + resolution status)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_ai_agent_failures (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_id      BIGINT UNSIGNED NOT NULL,
    task_id       BIGINT UNSIGNED NULL,
    error_type    VARCHAR(80)  NOT NULL,
    error_message TEXT         NOT NULL,
    stack_trace   MEDIUMTEXT   NULL,
    resolved      TINYINT(1)   NOT NULL DEFAULT 0,
    resolved_at   DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ai_failures_agent (agent_id),
    KEY idx_ai_failures_resolved (resolved),
    KEY idx_ai_failures_task (task_id),
    CONSTRAINT fk_ai_failures_agent FOREIGN KEY (agent_id) REFERENCES exam_ai_agents(id)      ON DELETE CASCADE,
    CONSTRAINT fk_ai_failures_task  FOREIGN KEY (task_id)  REFERENCES exam_ai_agent_tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Agent error tracking and resolution log';

-- -----------------------------------------------------------------------------
-- 7. exam_ai_agent_approvals  (admin approval queue for sensitive agent tasks)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_ai_agent_approvals (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_id       BIGINT UNSIGNED NOT NULL,
    task_id        BIGINT UNSIGNED NULL,
    requested_by   BIGINT UNSIGNED NOT NULL,
    approval_type  VARCHAR(80)  NOT NULL,
    payload        JSON         NULL,
    status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    approved_by    BIGINT UNSIGNED NULL,
    approved_at    DATETIME     NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ai_approvals_status (status),
    KEY idx_ai_approvals_agent (agent_id),
    KEY idx_ai_approvals_task (task_id),
    CONSTRAINT fk_ai_approvals_agent      FOREIGN KEY (agent_id)     REFERENCES exam_ai_agents(id)      ON DELETE CASCADE,
    CONSTRAINT fk_ai_approvals_task       FOREIGN KEY (task_id)      REFERENCES exam_ai_agent_tasks(id) ON DELETE SET NULL,
    CONSTRAINT fk_ai_approvals_requested  FOREIGN KEY (requested_by) REFERENCES exam_users(id)         ON DELETE RESTRICT,
    CONSTRAINT fk_ai_approvals_approved   FOREIGN KEY (approved_by)  REFERENCES exam_users(id)         ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Admin approval queue for tasks requiring human sign-off';

-- -----------------------------------------------------------------------------
-- 8. exam_ai_agent_prompts  (versioned prompt library per agent)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_ai_agent_prompts (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_code   VARCHAR(48)  NOT NULL,
    prompt_key   VARCHAR(120) NOT NULL,
    prompt_text  MEDIUMTEXT   NOT NULL,
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    version      INT          NOT NULL DEFAULT 1,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ai_prompts_agent (agent_code),
    KEY idx_ai_prompts_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Versioned prompt library per agent (writing / speaking / interview prompts)';

-- -----------------------------------------------------------------------------
-- 9. exam_ai_agent_performance  (daily performance rollup per agent)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_ai_agent_performance (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_id             BIGINT UNSIGNED NOT NULL,
    date                 DATE         NOT NULL,
    tasks_total          INT          NOT NULL DEFAULT 0,
    tasks_completed      INT          NOT NULL DEFAULT 0,
    tasks_failed         INT          NOT NULL DEFAULT 0,
    avg_duration_seconds INT          NOT NULL DEFAULT 0,
    success_rate         DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ai_perf_agent_date (agent_id, date),
    KEY idx_ai_perf_agent (agent_id),
    KEY idx_ai_perf_date (date),
    CONSTRAINT fk_ai_perf_agent FOREIGN KEY (agent_id) REFERENCES exam_ai_agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daily agent performance rollup';

-- -----------------------------------------------------------------------------
-- 10. exam_ai_agent_audit  (immutable audit trail of agent activity)
-- -----------------------------------------------------------------------------
CREATE TABLE exam_ai_agent_audit (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_id        BIGINT UNSIGNED NOT NULL,
    actor_user_id   BIGINT UNSIGNED NULL,
    action          VARCHAR(120) NOT NULL,
    entity_type     VARCHAR(80)  NOT NULL,
    entity_id       BIGINT UNSIGNED NULL,
    ip_address      VARCHAR(45)  NULL,
    details         JSON         NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ai_audit_agent (agent_id),
    KEY idx_ai_audit_created (created_at),
    KEY idx_ai_audit_actor (actor_user_id),
    CONSTRAINT fk_ai_audit_agent FOREIGN KEY (agent_id)      REFERENCES exam_ai_agents(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_audit_actor FOREIGN KEY (actor_user_id) REFERENCES exam_users(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Immutable audit trail for all sensitive agent activity';

-- =============================================================================
-- Seed: 20 AI Agent Employees
-- =============================================================================
-- public_label values are restricted to the approved compliance wording set.
-- internal_label uses "Agent" terminology for admin-only display surfaces.
-- Auto-increment agent IDs (referenced by later seeds) are sequential 1..20
-- in the order below.
-- =============================================================================
INSERT INTO exam_ai_agents
    (agent_code, agent_name, department, responsibility, exam_scope, is_active, public_label, internal_label, can_auto_execute, requires_admin_approval)
VALUES
('AGENT-INTAKE-01',     'Exam Intake Agent',         'Intake',          'Registers student, checks exam goal, target country, target score, ALO student status, free quota', '["ALL"]', 1, 'ALO Evaluation System',       'Exam Intake Agent',         1, 0),
('AGENT-ELIGIBILITY-01','Exam Eligibility Agent',    'Intake',          'Verifies 3 free mocks (ALO) or 1 free mock (public), checks CRM match, validates ALO Student ID, prevents quota bypass', '["ALL"]', 1, 'ALO Evaluation System',       'Exam Eligibility Agent',    1, 0),
('AGENT-SETUP-01',      'Exam Setup Agent',          'Operations',      'Selects exam type, practice set, assigns sections, prepares timer, prepares instructions', '["ALL"]', 1, 'ALO Evaluation System',       'Exam Setup Agent',          1, 0),
('AGENT-PROCTOR-01',    'Digital Proctor Agent',     'Operations',      'Monitors timer, logs tab switch, pause/resume, suspicious refresh, attempt integrity', '["ALL"]', 1, 'Digital Practice Session',    'Digital Proctor Agent',     1, 0),
('AGENT-LISTENING-01',  'Listening Test Agent',      'Exam Operations', 'Manages audio playback, listening section timing, prevents replay when rules disallow', '["ALL"]', 1, 'ALO Evaluation System',       'Listening Test Agent',      1, 0),
('AGENT-READING-01',    'Reading Test Agent',        'Exam Operations', 'Manages passages, tracks reading answers, checks completion', '["ALL"]', 1, 'ALO Evaluation System',       'Reading Test Agent',        1, 0),
('AGENT-WRITING-01',    'Writing Evaluation Agent',  'Evaluation',      'Reviews essays/writing, estimates score, gives task achievement/coherence/vocabulary/grammar feedback, improvement plan', '["ALL"]', 1, 'Automated Practice Feedback', 'Writing Evaluation Agent',  0, 1),
('AGENT-SPEAKING-01',   'Speaking Interview Agent',  'Evaluation',      'Conducts speaking practice, professional examiner-style card, exam-style prompts, records answer, fluency/pronunciation/grammar/lexical/coherence/confidence feedback', '["ALL"]', 1, 'ALO Practice Examiner',       'Speaking Interview Agent',  0, 1),
('AGENT-INTERVIEW-01',  'Interview Practice Agent',  'Evaluation',      'UK credibility, CAS, visa, scholarship, admission interviews, follow-up questions, risk-level scoring', '["VisaInterview"]', 1, 'Practice Interview Coach',    'Interview Practice Agent',  0, 1),
('AGENT-SCORING-01',    'Scoring Agent',             'Evaluation',      'Calculates estimated score, maps by exam (IELTS 0-9, PTE 10-90, TOEFL 0-120, etc.), marks as estimated practice score only', '["ALL"]', 1, 'ALO Estimated Score Engine',  'Scoring Agent',             1, 0),
('AGENT-FEEDBACK-01',   'Feedback Agent',            'Evaluation',      'Creates strengths, weaknesses, next study plan, recommends next practice set, recommends counseling if needed', '["ALL"]', 1, 'Automated Practice Feedback', 'Feedback Agent',            1, 0),
('AGENT-REPORT-01',     'Report Agent',              'Operations',      'Generates Smart Score Report, adds disclaimer, creates PDF, saves report, syncs to CRM if connected', '["ALL"]', 1, 'Smart Score Report',          'Report Agent',              1, 0),
('AGENT-CRM-01',        'CRM Sync Agent',            'Integration',     'Sends registration, exam attempt, score, weak area, counseling task to CRM; logs pending if CRM unavailable', '["ALL"]', 1, 'ALO Evaluation System',       'CRM Sync Agent',            1, 0),
('AGENT-VOUCHER-01',    'Voucher & Payment Agent',   'Operations',      'Checks voucher, checks paid access, blocks over-quota free attempt, shows payment/contact CTA', '["ALL"]', 1, 'ALO Evaluation System',       'Voucher & Payment Agent',   1, 0),
('AGENT-QUESTION-01',   'Question Bank Agent',       'Content',         'Drafts new original questions, never copies official exam content, tags difficulty, creates explanations, sends to review queue', '["ALL"]', 1, 'ALO Evaluation System',       'Question Bank Agent',       0, 1),
('AGENT-WEEKLY-01',     'Weekly Update Agent',       'Content',         'Every week drafts new original questions, checks duplicates/grammar/answer keys/readability, sends to admin approval, does not auto-publish', '["ALL"]', 1, 'ALO Evaluation System',       'Weekly Update Agent',       0, 1),
('AGENT-QUALITY-01',    'Quality Review Agent',      'Content',         'Reviews question quality, flags weak/duplicate questions, flags official-content risk, flags unclear answer keys', '["ALL"]', 1, 'ALO Evaluation System',       'Quality Review Agent',      0, 1),
('AGENT-COMPLIANCE-01', 'Compliance Agent',          'Compliance',      'Checks no fake official wording, disclaimer exists, no real-examiner claim, no official partnership claim, no guaranteed real exam question', '["ALL"]', 1, 'ALO Evaluation System',       'Compliance Agent',          1, 0),
('AGENT-AUDIT-01',      'Audit Agent',               'Compliance',      'Logs every attempt, scoring, quota use, report generation, admin action, weekly update', '["ALL"]', 1, 'ALO Evaluation System',       'Audit Agent',               1, 0),
('AGENT-SUPPORT-01',    'Support Agent',             'Support',         'Answers student help questions, explains how to start exam, quota, score report, escalates to ALO advisor if needed', '["ALL"]', 1, 'ALO Evaluation System',       'Support Agent',             1, 0);

-- =============================================================================
-- Seed: 8 sample agent tasks (one per active agent type, varied statuses)
-- =============================================================================
-- attempt_id is left NULL because attempt rows are not part of the base install
-- seed; with foreign_key_checks = 0 the FK is recorded but inactive until the
-- parent row exists. Agents are referenced by auto-increment id (1..20).
-- =============================================================================
INSERT INTO exam_ai_agent_tasks
    (task_code, agent_id, attempt_id, task_type, payload, status, result, started_at, completed_at, error_message, created_at)
VALUES
('TASK-INTAKE-20250101-001',   1,  NULL, 'student_intake',
    '{"student_id":1001,"exam_goal":"IELTS","target_country":"UK","target_score":"7.0","alo_student_id":"ALO-12345"}',
    'completed',
    '{"registered":true,"student_id":1001,"alo_quota_remaining":3}',
    '2025-01-19 08:00:00', '2025-01-19 08:00:12', NULL, '2025-01-19 08:00:00'),

('TASK-ELIG-20250101-001',     2,  NULL, 'eligibility_check',
    '{"student_id":1001,"alo_student_id":"ALO-12345","exam_type":"IELTS","quota_remaining":3}',
    'completed',
    '{"eligible":true,"quota_remaining":3,"reason":"ALO student, 3 free mocks available"}',
    '2025-01-19 08:00:13', '2025-01-19 08:00:18', NULL, '2025-01-19 08:00:13'),

('TASK-SETUP-20250101-001',    3,  NULL, 'exam_setup',
    '{"exam_type":"IELTS","practice_set_id":5,"sections":["listening","reading","writing","speaking"],"timer_minutes":175}',
    'completed',
    '{"attempt_id":1,"configured":true,"sections_assigned":4}',
    '2025-01-19 08:00:19', '2025-01-19 08:00:25', NULL, '2025-01-19 08:00:19'),

('TASK-PROCTOR-20250101-001',  4,  NULL, 'proctor_monitoring',
    '{"attempt_id":1,"monitoring":["tab_switch","refresh","pause","resume"],"integrity_checks":true}',
    'running',
    NULL,
    '2025-01-19 08:00:26', NULL, NULL, '2025-01-19 08:00:26'),

('TASK-SCORING-20250101-001', 10,  NULL, 'scoring_calculation',
    '{"attempt_id":1,"exam_type":"IELTS","sections":["listening","reading","writing","speaking"]}',
    'completed',
    '{"overall_band":"6.5","listening":7.0,"reading":6.5,"writing":6.0,"speaking":6.5,"is_estimated":true,"disclaimer":"Estimated practice score only, not an official exam result"}',
    '2025-01-19 10:30:00', '2025-01-19 10:30:11', NULL, '2025-01-19 10:30:00'),

('TASK-FEEDBACK-20250101-001',11,  NULL, 'feedback_generation',
    '{"attempt_id":1,"overall_band":"6.5","focus_areas":["writing","speaking"]}',
    'completed',
    '{"strengths":["good lexical resource","clear paragraphing"],"weaknesses":["task response in writing","pronunciation of consonant clusters"],"next_practice_set_id":6,"recommend_counseling":false}',
    '2025-01-19 10:30:12', '2025-01-19 10:30:24', NULL, '2025-01-19 10:30:12'),

('TASK-REPORT-20250101-001',  12,  NULL, 'report_generation',
    '{"attempt_id":1,"report_format":"pdf","include_disclaimer":true,"sync_to_crm":true}',
    'pending',
    NULL,
    NULL, NULL, NULL, '2025-01-19 10:30:25'),

('TASK-CRM-20250101-001',     13,  NULL, 'crm_sync',
    '{"entity_type":"attempt","entity_id":1,"crm_endpoint":"/api/v1/attempts","payload_size_bytes":4280}',
    'failed',
    NULL,
    '2025-01-19 10:31:00', '2025-01-19 10:31:05',
    'CRM endpoint timeout after 5000ms; request queued for retry on next cron tick',
    '2025-01-19 10:31:00');

-- =============================================================================
-- Seed: 5 sample agent operational logs
-- =============================================================================
INSERT INTO exam_ai_agent_logs
    (agent_id, attempt_id, action, entity_type, entity_id, details, created_at)
VALUES
(1,  NULL, 'registered_student',         'student',    1001, '{"exam_goal":"IELTS","target_country":"UK"}',                                '2025-01-19 08:00:12'),
(4,  NULL, 'flagged_tab_switch',         'attempt',       1, '{"switch_count":1,"section":"reading","severity":"low"}',                    '2025-01-19 09:14:33'),
(10, NULL, 'scored_attempt',             'attempt',       1, '{"overall_band":"6.5","is_estimated":true}',                                 '2025-01-19 10:30:11'),
(12, NULL, 'queued_report_generation',   'report',     NULL, '{"attempt_id":1,"format":"pdf","include_disclaimer":true}',                  '2025-01-19 10:30:25'),
(13, NULL, 'crm_sync_failed',            'integration',NULL, '{"endpoint":"/api/v1/attempts","http_status":null,"reason":"timeout"}',      '2025-01-19 10:31:05');

-- =============================================================================
-- Seed: 3 sample agent performance rollups (scoring, writing, speaking)
-- =============================================================================
INSERT INTO exam_ai_agent_performance
    (agent_id, date, tasks_total, tasks_completed, tasks_failed, avg_duration_seconds, success_rate, created_at)
VALUES
(10, '2025-01-19', 42, 40, 2,  12, 95.24, '2025-01-20 00:05:00'),  -- AGENT-SCORING-01
( 7, '2025-01-19', 18, 18, 0,  85, 100.00,'2025-01-20 00:05:00'),  -- AGENT-WRITING-01
( 8, '2025-01-19', 15, 14, 1,  72,  93.33,'2025-01-20 00:05:00');  -- AGENT-SPEAKING-01

-- =============================================================================
-- Seed: 2 sample admin approvals (one pending, one approved)
-- =============================================================================
-- requested_by / approved_by reference exam_users.id (1 = platform admin).
-- With foreign_key_checks = 0 the FK is recorded but inactive until the user
-- row exists (seed.sql seeds exam_users).
-- =============================================================================
INSERT INTO exam_ai_agent_approvals
    (agent_id, task_id, requested_by, approval_type, payload, status, approved_by, approved_at, created_at)
VALUES
(16, NULL, 1, 'question_publication',
    '{"batch_id":"WU-2025-W03","question_count":12,"source":"weekly_update","auto_publish":false}',
    'pending', NULL, NULL, '2025-01-19 23:50:00'),                 -- AGENT-WEEKLY-01 pending
(12, NULL, 1, 'report_distribution',
    '{"attempt_id":1,"report_format":"pdf","include_disclaimer":true,"sync_to_crm":true}',
    'approved', 1, '2025-01-19 10:31:30', '2025-01-19 10:30:26');  -- AGENT-REPORT-01 approved

-- =============================================================================
-- Seed: 3 sample prompts (writing eval, speaking eval, interview sim)
-- -----------------------------------------------------------------------------
-- Every prompt embeds the platform compliance disclaimer:
--   "Some practice tests, scoring, feedback, and interview simulations may be
--    supported by automated digital evaluation tools. This is a practice
--    platform only, not an official exam result."
-- No claim of "AI teacher", "bot", "robot", "real examiner", "official
-- examiner", or "official score" appears anywhere in the prompt text.
-- =============================================================================
INSERT INTO exam_ai_agent_prompts
    (agent_code, prompt_key, prompt_text, is_active, version, created_at, updated_at)
VALUES
('AGENT-WRITING-01',
 'writing_evaluation_v1',
 'You are an automated writing evaluation tool for the ALO English Test Platform. Your task is to review a student practice essay and provide structured feedback across task achievement, coherence and cohesion, lexical resource, and grammatical range and accuracy. You will also estimate a practice score band using the rubric provided.\n\nCompliance rules:\n- This is a practice platform only, not an official exam result.\n- Do not claim to be a real examiner, an official examiner, or an official scoring service.\n- Do not reproduce any official exam prompt or content.\n- All feedback must be original, neutral, and practice-focused.\n- Disclosure: Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools. This is a practice platform only, not an official exam result.\n\nOutput format: JSON with keys task_achievement, coherence_and_cohesion, lexical_resource, grammatical_range_and_accuracy, estimated_band, strengths, weaknesses, improvement_plan.',
 1, 1, '2025-01-01 00:00:00', '2025-01-01 00:00:00'),

('AGENT-SPEAKING-01',
 'speaking_evaluation_v1',
 'You are an automated speaking practice evaluator for the ALO English Test Platform. Your task is to review a recorded student speaking response and provide structured feedback across fluency and coherence, lexical resource, grammatical range and accuracy, and pronunciation. You will also produce a practice score band estimate.\n\nCompliance rules:\n- This is a practice platform only, not an official exam result.\n- Do not claim to be a real examiner, an official examiner, or an official scoring service.\n- Do not reproduce any official exam prompt or content.\n- All feedback must be original, neutral, and practice-focused.\n- Disclosure: Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools. This is a practice platform only, not an official exam result.\n\nOutput format: JSON with keys fluency_and_coherence, lexical_resource, grammatical_range_and_accuracy, pronunciation, estimated_band, strengths, weaknesses, improvement_plan.',
 1, 1, '2025-01-01 00:00:00', '2025-01-01 00:00:00'),

('AGENT-INTERVIEW-01',
 'interview_simulation_v1',
 'You are an automated interview practice coach for the ALO English Test Platform. Your task is to conduct a practice interview (UK credibility, CAS, visa, scholarship, or admission style) by presenting one question at a time, then evaluating the student response with follow-up questions and a risk-level score.\n\nCompliance rules:\n- This is a practice platform only, not an official exam result.\n- Do not claim to be a real examiner, an official examiner, or an official interviewer.\n- Do not reproduce any official exam prompt or content.\n- All output must be original, neutral, and practice-focused.\n- Disclosure: Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools. This is a practice platform only, not an official exam result.\n\nOutput format: JSON with keys interview_type, current_question, question_number, follow_up_questions, risk_level, feedback, next_action.',
 1, 1, '2025-01-01 00:00:00', '2025-01-01 00:00:00');

-- =============================================================================
-- End of install.sql
-- =============================================================================
