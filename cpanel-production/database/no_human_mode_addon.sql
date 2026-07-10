-- =============================================================================
-- No-Human Practice Exam Mode — Schema Addon
-- -----------------------------------------------------------------------------
-- Task ID: NO-HUMAN
-- Purpose: Adds evaluation_mode, evaluation_provider, confidence, and
--          human-review fields to the practice exam pipeline so the ALO
--          English Test Platform can serve a complete practice attempt
--          end-to-end (intake → scoring → feedback → report) without
--          blocking the student on human review.
--
-- Compliance:
--   - All reports always include the practice-only disclaimer.
--   - human_review_optional=1 (never blocks report release).
--   - external AI is OPTIONAL; local_rule_engine is the default and works
--     without any API key.
--
-- Apply order:
--   This file is idempotent for the settings INSERTs (ON DUPLICATE KEY
--   UPDATE). The ALTER TABLE statements below should be run ONCE. If a
--   column already exists, the statement can be skipped — MySQL 8 does
--   not support `ADD COLUMN IF NOT EXISTS`, so each ALTER is a single
--   forward-only statement. A safe pattern is:
--
--       mysql ... < no_human_mode_addon.sql
--
--   and on a second run, ignore the "Duplicate column name" errors.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Settings: no_human_exam_mode + evaluation provider defaults
-- -----------------------------------------------------------------------------
-- NOTE: exam_settings schema uses `is_public` (0 = admin-only, 1 = public).
-- The settings below are admin-only platform config flags.
INSERT INTO exam_settings (setting_key, setting_value, is_public, updated_by, created_at, updated_at)
VALUES ('no_human_exam_mode', '1', 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE setting_value = '1', updated_at = NOW();

INSERT INTO exam_settings (setting_key, setting_value, is_public, updated_by, created_at, updated_at)
VALUES ('evaluation_mode', 'automated', 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE setting_value = 'automated', updated_at = NOW();

INSERT INTO exam_settings (setting_key, setting_value, is_public, updated_by, created_at, updated_at)
VALUES ('evaluation_provider', 'local_rule_engine', 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE setting_value = 'local_rule_engine', updated_at = NOW();

INSERT INTO exam_settings (setting_key, setting_value, is_public, updated_by, created_at, updated_at)
VALUES ('human_review_default', 'optional', 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE setting_value = 'optional', updated_at = NOW();

-- -----------------------------------------------------------------------------
-- 2. exam_mock_attempts — No-Human mode tracking on the attempt itself
-- -----------------------------------------------------------------------------
-- Run once. If a column already exists, skip the statement.
ALTER TABLE exam_mock_attempts
    ADD COLUMN evaluation_mode         VARCHAR(32)  DEFAULT 'automated',
    ADD COLUMN evaluation_provider     VARCHAR(64)  DEFAULT 'local_rule_engine',
    ADD COLUMN no_human_mode           TINYINT(1)   DEFAULT 1,
    ADD COLUMN agent_confidence_score  DECIMAL(5,2) DEFAULT NULL,
    ADD COLUMN human_review_required   TINYINT(1)   DEFAULT 0,
    ADD COLUMN human_review_optional   TINYINT(1)   DEFAULT 1,
    ADD COLUMN final_report_status     VARCHAR(32)  DEFAULT 'auto_generated';

-- -----------------------------------------------------------------------------
-- 3. exam_scores — Automated scoring provenance + review recommendation
-- -----------------------------------------------------------------------------
ALTER TABLE exam_scores
    ADD COLUMN scoring_provider        VARCHAR(64)  DEFAULT 'local_rule_engine',
    ADD COLUMN scoring_confidence      DECIMAL(5,2) DEFAULT NULL,
    ADD COLUMN automated_feedback_json JSON         NULL,
    ADD COLUMN review_recommendation   VARCHAR(32)  DEFAULT 'none';

-- -----------------------------------------------------------------------------
-- 4. exam_speaking_sessions — Per-dimension agent scores + provider
-- -----------------------------------------------------------------------------
-- NOTE: fluency_score, pronunciation_score, grammar_score, vocabulary_score,
--       coherence_score already exist on the base table (DECIMAL(4,2)).
--       This ALTER adds the NEW no-human-mode columns only. If the existing
--       DECIMAL(4,2) columns were renamed/removed in a future migration,
--       add them back as INT here.
ALTER TABLE exam_speaking_sessions
    ADD COLUMN evaluation_provider     VARCHAR(64)  DEFAULT 'local_rule_engine',
    ADD COLUMN confidence_score        INT          DEFAULT NULL,
    ADD COLUMN answer_completeness     INT          DEFAULT NULL,
    ADD COLUMN agent_feedback_json     JSON         NULL;

-- -----------------------------------------------------------------------------
-- 5. exam_writing_submissions — Per-dimension agent scores + provider
-- -----------------------------------------------------------------------------
-- NOTE: word_count already exists on the base table (INT NOT NULL DEFAULT 0).
--       This ALTER adds the NEW no-human-mode columns only.
ALTER TABLE exam_writing_submissions
    ADD COLUMN evaluation_provider     VARCHAR(64)  DEFAULT 'local_rule_engine',
    ADD COLUMN task_score              DECIMAL(3,1) DEFAULT NULL,
    ADD COLUMN coherence_score         DECIMAL(3,1) DEFAULT NULL,
    ADD COLUMN vocabulary_score        DECIMAL(3,1) DEFAULT NULL,
    ADD COLUMN grammar_score           DECIMAL(3,1) DEFAULT NULL,
    ADD COLUMN agent_feedback_json     JSON         NULL;

-- -----------------------------------------------------------------------------
-- 6. exam_ai_agent_tasks — Provenance + auto-completion flags
-- -----------------------------------------------------------------------------
ALTER TABLE exam_ai_agent_tasks
    ADD COLUMN requires_human          TINYINT(1)   DEFAULT 0,
    ADD COLUMN auto_completed          TINYINT(1)   DEFAULT 0,
    ADD COLUMN confidence_score        DECIMAL(5,2) DEFAULT NULL,
    ADD COLUMN fallback_used           TINYINT(1)   DEFAULT 0,
    ADD COLUMN provider_used           VARCHAR(64)  DEFAULT 'local_rule_engine';

-- =============================================================================
-- End of no_human_mode_addon.sql
-- =============================================================================
