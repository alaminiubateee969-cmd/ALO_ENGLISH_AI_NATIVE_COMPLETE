-- =============================================================================
-- ALO English Test Platform - AI Agent Employee Addon (ai_agents_addon.sql)
-- =============================================================================
-- Project   : ALO English Test Platform (cPanel production package)
-- Engine    : InnoDB / utf8mb4_unicode_ci
-- Scope     : 10 tables for the AI Agent Employee workforce + seed data.
--             20 AI Agent Employees covering intake, eligibility, setup,
--             proctoring, exam operations, evaluation, scoring, feedback,
--             reports, CRM sync, voucher/payment, content authoring,
--             compliance, audit, and student support.
-- Usage     : (a) Import standalone into a database already running install.sql,
--             OR (b) the same content is appended to the end of install.sql
--             so that a single install.sql import creates everything.
-- Compliance: Original content only. No official exam items reproduced.
--             All public-facing labels use ONLY approved wording:
--               "ALO Evaluation System", "Digital Practice Session",
--               "ALO Practice Examiner", "Practice Interview Coach",
--               "Automated Practice Feedback", "Smart Score Report",
--               "ALO Estimated Score Engine".
--             No claim of "AI teacher", "bot", "robot", "fake human",
--             "real examiner", "official examiner", or "official score"
--             anywhere in the public-facing labels.
--             internal_label uses "Agent" terminology for admin-only display.
-- Disclosure: "Some practice tests, scoring, feedback, and interview
--             simulations may be supported by automated digital evaluation
--             tools. This is a practice platform only, not an official
--             exam result."
-- =============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY';
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
-- End of ai_agents_addon.sql
-- =============================================================================
