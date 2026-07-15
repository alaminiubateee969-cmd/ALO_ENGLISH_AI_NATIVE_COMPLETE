-- AI Agent Governance Framework — 5-Step Control System
-- Ensures every AI agent operates with single objectives, memory isolation,
-- tool isolation, controlled decision pipeline, and feedback loops.

-- Step 1: Single Objective Lock — each agent has ONE responsibility only
CREATE TABLE IF NOT EXISTS exam_ai_agent_objectives (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_id BIGINT UNSIGNED NOT NULL,
  objective TEXT NOT NULL,
  measurable_output TEXT NOT NULL,
  allowed_workflows JSON NOT NULL,
  forbidden_workflows JSON NOT NULL,
  success_condition TEXT NOT NULL,
  failure_condition TEXT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  approved_by BIGINT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_obj_agent FOREIGN KEY (agent_id) REFERENCES exam_ai_agents(id) ON DELETE CASCADE,
  INDEX idx_agent (agent_id), INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Structured Memory Layer — permission-controlled memory
CREATE TABLE IF NOT EXISTS exam_ai_agent_memory (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_id BIGINT UNSIGNED NOT NULL,
  memory_type ENUM('current_task','infrastructure_sop','hosting_docs','department_knowledge','approved_rag','config_templates') NOT NULL,
  memory_key VARCHAR(255) NOT NULL,
  memory_value TEXT NOT NULL,
  access_level ENUM('private','department','system','public') DEFAULT 'private',
  is_approved TINYINT(1) DEFAULT 0,
  approved_by BIGINT UNSIGNED NULL,
  expires_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mem_agent FOREIGN KEY (agent_id) REFERENCES exam_ai_agents(id) ON DELETE CASCADE,
  UNIQUE KEY uk_agent_mem_type_key (agent_id, memory_type, memory_key),
  INDEX idx_agent (agent_id), INDEX idx_type (memory_type), INDEX idx_access (access_level), INDEX idx_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Tool Isolation — each tool module runs independently
CREATE TABLE IF NOT EXISTS exam_ai_agent_tools (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tool_code VARCHAR(64) NOT NULL UNIQUE,
  tool_name VARCHAR(255) NOT NULL,
  module ENUM('backup','monitoring','deployment','ai_runtime','database','email','crm','scoring','report','certificate','voucher','proctor') NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  fallback_tool_code VARCHAR(64) NULL,
  max_retries INT DEFAULT 3,
  timeout_seconds INT DEFAULT 30,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_module (module), INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tool isolation log — records when a tool fails and fallback is used
CREATE TABLE IF NOT EXISTS exam_ai_agent_tool_failures (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tool_code VARCHAR(64) NOT NULL,
  agent_id BIGINT UNSIGNED NULL,
  task_id BIGINT UNSIGNED NULL,
  error_message TEXT NOT NULL,
  fallback_used VARCHAR(64) NULL,
  fallback_succeeded TINYINT(1) NULL,
  platform_continued TINYINT(1) DEFAULT 1 COMMENT 'Platform did NOT stop — isolation worked',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tool (tool_code), INDEX idx_agent (agent_id), INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Controlled Decision Pipeline — every request follows 14 stages
CREATE TABLE IF NOT EXISTS exam_ai_decision_pipelines (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pipeline_code VARCHAR(64) NOT NULL UNIQUE,
  agent_id BIGINT UNSIGNED NULL,
  request_type VARCHAR(128) NOT NULL,
  input_data JSON NULL,
  current_stage ENUM('input','authentication','rbac','protection_mode','payment_guard','infra_validation','workflow_selection','ai_selection','tool_selection','execution','verification','logging','review','learning_suggestion','approval','completed','rejected') DEFAULT 'input',
  stage_history JSON NULL COMMENT 'JSON array of {stage, status, timestamp, notes}',
  output_data JSON NULL,
  status ENUM('pending','running','completed','rejected','failed') DEFAULT 'pending',
  rejection_reason TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_dp_agent FOREIGN KEY (agent_id) REFERENCES exam_ai_agents(id) ON DELETE SET NULL,
  INDEX idx_agent (agent_id), INDEX idx_status (status), INDEX idx_current_stage (current_stage), INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Feedback & Continuous Improvement — reports after every task
CREATE TABLE IF NOT EXISTS exam_ai_agent_feedback (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NULL,
  pipeline_id BIGINT UNSIGNED NULL,
  feedback_type ENUM('infrastructure','performance','security','resource','backup','error','optimization','learning') NOT NULL,
  report_data JSON NOT NULL,
  suggestions TEXT NULL,
  is_approved TINYINT(1) DEFAULT 0 COMMENT 'Permanent improvements require admin approval',
  approved_by BIGINT UNSIGNED NULL,
  approved_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fb_agent FOREIGN KEY (agent_id) REFERENCES exam_ai_agents(id) ON DELETE CASCADE,
  CONSTRAINT fk_fb_pipeline FOREIGN KEY (pipeline_id) REFERENCES exam_ai_decision_pipelines(id) ON DELETE SET NULL,
  INDEX idx_agent (agent_id), INDEX idx_type (feedback_type), INDEX idx_approved (is_approved), INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED: Single Objective Locks for all 21 agents
-- =====================================================
INSERT INTO exam_ai_agent_objectives (agent_id, objective, measurable_output, allowed_workflows, forbidden_workflows, success_condition, failure_condition, is_active, approved_by, created_at) VALUES
(1, 'Register student and check exam goal, target country, target score, ALO student status, free quota', 'Student intake record created with verified fields', '["student.register","quota.check","alo_verify"]', '["exam.score","report.generate","crm.delete","payment.process"]', 'Student registered with valid goal, country, score, and quota verified', 'Student data incomplete or quota check failed', 1, 1, NOW()),
(2, 'Verify 3 free mocks (ALO) or 1 free mock (public), check CRM match, validate ALO Student ID, prevent quota bypass', 'Eligibility decision: approved or blocked with reason', '["quota.verify","crm.match","alo_id.validate","bypass.prevent"]', '["exam.score","certificate.generate","report.delete"]', 'Correct free quota determined and bypass prevented', 'Quota bypass detected or ALO ID invalid', 1, 1, NOW()),
(3, 'Select exam type, practice set, assign sections, prepare timer, prepare instructions', 'Exam configuration object with set, sections, timer, instructions', '["exam.setup","set.select","timer.configure","instructions.prepare"]', '["exam.score","student.delete","crm.sync"]', 'Exam fully configured and ready to start', 'Setup incomplete or set not found', 1, 1, NOW()),
(4, 'Monitor timer, log tab switch, pause/resume, suspicious refresh, attempt integrity', 'Proctor integrity log with all events', '["proctor.monitor","tab_switch.log","pause.log","refresh.log","integrity.check"]', '["exam.score","certificate.generate","student.modify"]', 'All proctor events logged, no unfair blocking', 'Integrity compromise detected or timer failure', 1, 1, NOW()),
(5, 'Manage audio playback, listening section timing, prevent replay when rules disallow', 'Listening section completed with audio playback log', '["listening.play","listening.time","replay.prevent"]', '["reading.manage","writing.evaluate","speaking.evaluate"]', 'Listening section completed with no unauthorized replay', 'Audio playback failure or replay violation', 1, 1, NOW()),
(6, 'Manage passages, track reading answers, check completion', 'Reading section completed with answer tracking log', '["reading.display","answer.track","completion.check"]', '["listening.manage","writing.evaluate","speaking.evaluate"]', 'Reading section completed with all answers tracked', 'Passage display failure or incomplete tracking', 1, 1, NOW()),
(7, 'Review essays/writing, estimate score, give task achievement/coherence/vocabulary/grammar feedback, improvement plan', 'Writing evaluation result with 4 dimension scores + improvement plan', '["writing.evaluate","score.estimate","feedback.generate"]', '["speaking.evaluate","listening.manage","student.delete"]', 'Writing evaluated with estimated score + feedback + disclaimer', 'Evaluation failed or no disclaimer', 1, 1, NOW()),
(8, 'Conduct speaking practice, display examiner-style card, ask prompts, record answer, give fluency/pronunciation/grammar/lexical/coherence/confidence feedback', 'Speaking evaluation result with 6 dimension scores + tips', '["speaking.conduct","mic.check","recording.save","speaking.evaluate"]', '["writing.evaluate","listening.manage","reading.manage"]', 'Speaking evaluated with 6 scores + tips + disclaimer', 'Recording failed or no disclaimer', 1, 1, NOW()),
(9, 'Conduct UK credibility, CAS, visa, scholarship, admission interviews, follow-up questions, risk-level scoring', 'Interview evaluation with risk level + 4 quality scores + follow-up suggestions', '["interview.conduct","followup.generate","risk.score"]', '["writing.evaluate","listening.manage","proctor.monitor"]', 'Interview evaluated with risk level + disclaimer', 'Interview recording failed or no risk score', 1, 1, NOW()),
(10, 'Calculate estimated score, map by exam type, mark as estimated practice score only', 'Score result with exam-specific scale mapping', '["score.calculate","scale.map","practice.label"]', '["writing.evaluate","speaking.evaluate","certificate.revoke"]', 'Correct estimated score calculated with proper scale', 'Score calculation error or missing practice label', 1, 1, NOW()),
(11, 'Create strengths, weaknesses, next study plan, recommend next practice set, recommend counseling if needed', 'Feedback summary with strengths/weaknesses/plan/recommendation', '["feedback.generate","study_plan.create","counseling.recommend"]', '["exam.score","certificate.revoke","student.delete"]', 'Feedback with actionable study plan generated', 'Feedback generation failed', 1, 1, NOW()),
(12, 'Generate Smart Score Report, add disclaimer, create PDF, save report, sync to CRM if connected', 'Smart Score Report PDF with all sections + disclaimer', '["report.generate","pdf.create","report.save","crm.push"]', '["exam.score","student.delete","voucher.revoke"]', 'Report generated with disclaimer + PDF saved', 'Report generation failed or no disclaimer', 1, 1, NOW()),
(13, 'Send registration, exam attempt, score, weak area, counseling task to CRM; log pending if unavailable', 'CRM sync log entry (success or pending)', '["crm.sync","crm.retry","pending.log"]', '["crm.delete","student.modify","exam.score"]', 'Data synced to CRM or queued for retry', 'CRM sync failed and queue full', 1, 1, NOW()),
(14, 'Check voucher, check paid access, block over-quota free attempt, show payment/contact CTA', 'Voucher/payment decision: allowed or blocked with CTA', '["voucher.validate","payment.check","quota.block","cta.show"]', '["exam.score","report.generate","certificate.revoke"]', 'Correct access decision with CTA if blocked', 'Voucher validation failed or payment error', 1, 1, NOW()),
(15, 'Draft new original questions, never copy official exam content, tag difficulty, create explanations, send to review queue', 'Draft questions in review queue with difficulty + explanations', '["question.draft","difficulty.tag","explanation.create","review_queue.send"]', '["question.publish","official.copy","student.delete"]', 'Original questions drafted and sent to review', 'Official content detected or draft failed', 1, 1, NOW()),
(16, 'Every week draft new original questions, check duplicates/grammar/answer keys/readability, send to admin approval, do not auto-publish', 'Weekly update record with draft questions pending approval', '["weekly.draft","duplicate.check","grammar.check","answer_key.validate","approval.request"]', '["auto.publish","official.copy","student.delete"]', 'Drafts created and sent for approval (NOT auto-published)', 'Auto-publish attempted or official content detected', 1, 1, NOW()),
(17, 'Review question quality, flag weak/duplicate questions, flag official-content risk, flag unclear answer keys', 'Quality review report with flagged items', '["quality.review","duplicate.flag","official.flag","answer_key.flag"]', '["question.publish","auto.publish","student.delete"]', 'All questions reviewed with flags where needed', 'Quality review failed or missed official content', 1, 1, NOW()),
(18, 'Check no fake official wording, disclaimer exists, no real-examiner claim, no official partnership claim, no guaranteed real exam question', 'Compliance check result with violations list', '["compliance.scan","wording.check","disclaimer.verify","partnership.check"]', '["question.publish","certificate.generate","student.delete"]', 'All content compliant, no violations', 'Forbidden wording detected or disclaimer missing', 1, 1, NOW()),
(19, 'Log every attempt, scoring, quota use, report generation, admin action, weekly update', 'Audit log entries for all actions', '["audit.log","action.record","immutable.write"]', '["audit.delete","audit.modify","student.delete"]', 'All actions logged immutably', 'Audit log write failure', 1, 1, NOW()),
(20, 'Answer student help questions, explain how to start exam, quota, score report, escalate to ALO advisor if needed', 'Support response with answer or escalation', '["support.answer","exam.explain","quota.explain","escalate.advisor"]', '["exam.score","certificate.revoke","student.delete"]', 'Student question answered or escalated', 'Support response failed', 1, 1, NOW()),
(21, 'Auto-generate ALO Certify practice completion certificates after each mock test, create PDF, send email, sync CRM, log audit, include disclaimer', 'Certificate record with PDF + email + CRM sync + disclaimer', '["certificate.generate","pdf.create","email.send","crm.sync","audit.log"]', '["certificate.revoke","student.delete","exam.score","official.claim"]', 'Certificate auto-generated with disclaimer + emailed + synced', 'Certificate generation failed or no disclaimer', 1, 1, NOW())
ON DUPLICATE KEY UPDATE is_active=1, updated_at=NOW();

-- =====================================================
-- SEED: Tool Isolation modules
-- =====================================================
INSERT INTO exam_ai_agent_tools (tool_code, tool_name, module, is_active, fallback_tool_code, max_retries, timeout_seconds) VALUES
('TOOL-DB-WRITE', 'Database Write Tool', 'database', 1, NULL, 3, 30),
('TOOL-DB-READ', 'Database Read Tool', 'database', 1, NULL, 3, 15),
('TOOL-EMAIL-SMTP', 'Email SMTP Sender', 'email', 1, 'TOOL-EMAIL-QUEUE', 2, 30),
('TOOL-EMAIL-QUEUE', 'Email Queue Fallback', 'email', 1, NULL, 3, 10),
('TOOL-CRM-SYNC', 'CRM Sync API Client', 'crm', 1, 'TOOL-CRM-QUEUE', 2, 30),
('TOOL-CRM-QUEUE', 'CRM Queue Fallback', 'crm', 1, NULL, 3, 10),
('TOOL-SCORE-CALC', 'Scoring Calculator', 'scoring', 1, NULL, 3, 10),
('TOOL-REPORT-PDF', 'Report PDF Generator', 'report', 1, 'TOOL-REPORT-HTML', 2, 60),
('TOOL-REPORT-HTML', 'Report HTML Fallback', 'report', 1, NULL, 2, 30),
('TOOL-CERT-PDF', 'Certificate PDF Generator', 'certificate', 1, 'TOOL-CERT-HTML', 2, 60),
('TOOL-CERT-HTML', 'Certificate HTML Fallback', 'certificate', 1, NULL, 2, 30),
('TOOL-VOUCHER-VALIDATE', 'Voucher Validator', 'voucher', 1, NULL, 3, 10),
('TOOL-PROCTOR-MONITOR', 'Proctor Monitor', 'proctor', 1, NULL, 3, 5),
('TOOL-BACKUP-RUN', 'Backup Runner', 'backup', 1, NULL, 2, 120),
('TOOL-MONITOR-HEALTH', 'Health Monitor', 'monitoring', 1, NULL, 3, 15),
('TOOL-DEPLOY-UPLOAD', 'Deployment Uploader', 'deployment', 1, NULL, 2, 120),
('TOOL-AI-RUNTIME', 'AI Runtime Executor', 'ai_runtime', 1, 'TOOL-RULE-ENGINE', 3, 30),
('TOOL-RULE-ENGINE', 'Local Rule Engine Fallback', 'ai_runtime', 1, NULL, 3, 10)
ON DUPLICATE KEY UPDATE tool_name=VALUES(tool_name);

-- =====================================================
-- SEED: Memory layer permissions
-- =====================================================
INSERT INTO exam_ai_agent_memory (agent_id, memory_type, memory_key, memory_value, access_level, is_approved, approved_by, created_at) VALUES
(1, 'current_task', 'intake_sop', 'Step 1: Verify email. Step 2: Verify phone. Step 3: Check ALO student ID. Step 4: Check free quota. Step 5: Create student record.', 'department', 1, 1, NOW()),
(2, 'infrastructure_sop', 'quota_enforcement', 'ALO student: 3 free. Public: 1 free. Shared across all 32 exams. Check by email+phone+device+IP+session. Use SELECT FOR UPDATE.', 'system', 1, 1, NOW()),
(4, 'infrastructure_sop', 'proctor_rules', 'Log tab switches. Log pause/resume. Log refresh. Do NOT block unless configured. Flag suspicious activity for review.', 'system', 1, 1, NOW()),
(7, 'department_knowledge', 'writing_rubric', 'Score 4 dimensions: task_achievement (0-9), coherence (0-9), vocabulary (0-9), grammar (0-9). Include improvement plan. Add disclaimer.', 'department', 1, 1, NOW()),
(8, 'department_knowledge', 'speaking_rubric', 'Score 6 dimensions: fluency (0-100), pronunciation (0-100), grammar (0-100), lexical (0-100), coherence (0-100), confidence (0-100). Add disclaimer.', 'department', 1, 1, NOW()),
(18, 'config_templates', 'forbidden_terms', 'AI teacher, bot, robot, fake human, real examiner, official examiner, official score, guaranteed score, guaranteed real exam question, real exam common, official exam prediction, official exam content', 'system', 1, 1, NOW()),
(18, 'config_templates', 'approved_labels', 'ALO Practice Examiner, Digital Practice Session, ALO Practice Interview Coach, ALO Evaluation System, Smart Score Report, ALO Estimated Score Engine, Automated Practice Feedback, Digital Practice Examiner', 'system', 1, 1, NOW()),
(21, 'current_task', 'certificate_sop', 'After mock submit: 1. Generate cert code. 2. Create SHA-256 hash. 3. Generate PDF with ALO branding. 4. Send email if SMTP. 5. Sync CRM. 6. Log audit. 7. Include disclaimer.', 'department', 1, 1, NOW())
ON DUPLICATE KEY UPDATE memory_value=VALUES(memory_value), is_approved=1;

-- =====================================================
-- SETTINGS
-- =====================================================
INSERT INTO exam_settings (setting_key, setting_value, is_secret, updated_by, created_at, updated_at) VALUES
('governance_framework_enabled', '1', 0, 1, NOW(), NOW()),
('governance_single_objective_lock', '1', 0, 1, NOW(), NOW()),
('governance_memory_isolation', '1', 0, 1, NOW(), NOW()),
('governance_tool_isolation', '1', 0, 1, NOW(), NOW()),
('governance_decision_pipeline', '1', 0, 1, NOW(), NOW()),
('governance_feedback_loop', '1', 0, 1, NOW(), NOW()),
('governance_auto_learning', '0', 0, 1, NOW(), NOW() COMMENT 'AI may NOT permanently learn without approval'),
('governance_production_action_requires_approval', '1', 0, 1, NOW(), NOW()),
('governance_never_delete_customer_data', '1', 0, 1, NOW(), NOW()),
('governance_never_expose_secrets', '1', 0, 1, NOW(), NOW()),
('governance_never_bypass_approval', '1', 0, 1, NOW(), NOW()),
('governance_never_skip_logging', '1', 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at=NOW();
