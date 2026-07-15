-- ALO Certify — Certificate Auto-Send System addon
-- Extends exam_certificates table + adds Certificate Agent + auto-send workflow

-- Add certificate auto-send fields to existing exam_certificates table
ALTER TABLE exam_certificates
  ADD COLUMN IF NOT EXISTS certificate_type ENUM('completion','score_report','readiness','achievement') DEFAULT 'completion',
  ADD COLUMN IF NOT EXISTS student_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS exam_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS overall_score VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS band_estimate VARCHAR(16) NULL,
  ADD COLUMN IF NOT EXISTS cefr_level VARCHAR(8) NULL,
  ADD COLUMN IF NOT EXISTS module_scores JSON NULL,
  ADD COLUMN IF NOT EXISTS pdf_path VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS email_sent TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_sent_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS crm_synced TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_generated TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS agent_id BIGINT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS template_version VARCHAR(16) DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS practice_disclaimer TEXT NULL;

-- Certificate auto-send settings
INSERT INTO exam_settings (setting_key, setting_value, is_secret, updated_by, created_at, updated_at)
VALUES
('certificate_auto_send', '1', 0, 1, NOW(), NOW()),
('certificate_email_template', 'Dear {student_name},\n\nCongratulations on completing your {exam_name} practice test!\n\nYour estimated score: {overall_score} (Band {band_estimate}, CEFR {cefr_level})\n\nYour certificate is attached to this email.\n\nPractice disclaimer: This is a practice certificate only. Estimated score. Not an official exam result. No guarantee that questions will appear in real exam.\n\nSome practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools.\n\nBest regards,\nALO Education English Test Platform', 0, 1, NOW(), NOW()),
('certificate_brand_name', 'ALO Certify', 0, 1, NOW(), NOW()),
('certificate_template_version', '1.0', 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at=NOW();

-- Add Certificate Agent (21st AI Agent Employee)
INSERT INTO exam_ai_agents (agent_code, agent_name, department, responsibility, exam_scope, is_active, public_label, internal_label, can_auto_execute, requires_admin_approval, created_at, updated_at)
VALUES (
  'AGENT-CERTIFICATE-01',
  'Certificate Agent',
  'Operations',
  'Auto-generates ALO Certify practice completion certificates after each mock test. Creates PDF with ALO branding, sends via email, syncs to CRM, logs to audit. Includes practice-only disclaimer.',
  'ALL',
  1,
  'Smart Score Report',
  'Certificate Agent',
  1,
  0,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE is_active=1, updated_at=NOW();

-- Certificate template prompts for the agent
INSERT INTO exam_ai_agent_prompts (agent_code, prompt_key, prompt_text, is_active, version, created_at, updated_at)
VALUES
('AGENT-CERTIFICATE-01', 'certificate_generation', 'Generate a practice completion certificate for {student_name} who completed {exam_name} with estimated score {overall_score} (Band {band_estimate}, CEFR {cefr_level}). Include ALO Education branding, practice-only disclaimer, verification hash, and date. Certificate type: {certificate_type}.', 1, 1, NOW(), NOW()),
('AGENT-CERTIFICATE-01', 'certificate_email', 'Send certificate email to {student_email} with subject "Your ALO Certify Practice Certificate - {exam_name}". Attach PDF. Include practice disclaimer. Do not claim official exam result.', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at=NOW();
