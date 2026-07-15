-- AI Agent Training & Update System addon
-- 7 tables: 6 training tables + exam_rule_versions

CREATE TABLE IF NOT EXISTS exam_ai_agent_training_modules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_code VARCHAR(64) NOT NULL UNIQUE,
  module_name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  pass_score DECIMAL(5,2) DEFAULT 80.00,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_ai_agent_training_runs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_id BIGINT UNSIGNED NOT NULL,
  module_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','running','passed','failed') DEFAULT 'pending',
  score DECIMAL(5,2) NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tr_agent FOREIGN KEY (agent_id) REFERENCES exam_ai_agents(id) ON DELETE CASCADE,
  CONSTRAINT fk_tr_module FOREIGN KEY (module_id) REFERENCES exam_ai_agent_training_modules(id) ON DELETE CASCADE,
  INDEX idx_agent (agent_id), INDEX idx_status (status), INDEX idx_module (module_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_ai_agent_knowledge_base (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_code VARCHAR(64) NOT NULL,
  kb_key VARCHAR(255) NOT NULL,
  kb_value TEXT NOT NULL,
  kb_type ENUM('rule','rubric','template','reference') DEFAULT 'rule',
  version INT DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_agent_kb (agent_code, kb_key),
  INDEX idx_agent_code (agent_code), INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_ai_agent_update_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_id BIGINT UNSIGNED NOT NULL,
  update_type ENUM('prompt','rule','rubric','kb','model') NOT NULL,
  old_version VARCHAR(64) NULL,
  new_version VARCHAR(64) NOT NULL,
  change_summary TEXT NULL,
  approved_by BIGINT UNSIGNED NULL,
  status ENUM('draft','pending_approval','approved','rejected','published') DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME NULL,
  CONSTRAINT fk_ul_agent FOREIGN KEY (agent_id) REFERENCES exam_ai_agents(id) ON DELETE CASCADE,
  INDEX idx_agent (agent_id), INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_ai_agent_model_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_code VARCHAR(64) NOT NULL,
  version VARCHAR(64) NOT NULL,
  is_active TINYINT(1) DEFAULT 0,
  config_json JSON NULL,
  released_at DATETIME NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agent_code (agent_code), INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_ai_agent_quality_scores (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  agent_id BIGINT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  accuracy_score DECIMAL(5,2) NULL,
  compliance_score DECIMAL(5,2) NULL,
  latency_score DECIMAL(5,2) NULL,
  overall_score DECIMAL(5,2) NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_agent_date (agent_id, date),
  CONSTRAINT fk_qs_agent FOREIGN KEY (agent_id) REFERENCES exam_ai_agents(id) ON DELETE CASCADE,
  INDEX idx_agent (agent_id), INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_rule_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  exam_type_id BIGINT UNSIGNED NULL,
  version VARCHAR(32) NOT NULL,
  rules_json JSON NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  approved_by BIGINT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_exam_type (exam_type_id), INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed 12 training modules
INSERT INTO exam_ai_agent_training_modules (module_code, module_name, description, pass_score) VALUES
('TC-M01-CONDUCT', 'Exam Conduct Rules', 'All 32 exam rules, timing, sections, scoring scales', 80.00),
('TC-M02-ORIGINALITY', 'Question Originality', 'No official exam content, original content creation rules', 85.00),
('TC-M03-SCORING', 'Scoring Rubric', 'Score mapping for all 32 exam types', 80.00),
('TC-M04-COMPLIANCE', 'Compliance Wording', 'Approved labels, forbidden terms, disclosure text', 85.00),
('TC-M05-QUOTA', 'Free Quota Enforcement', '3 ALO / 1 public, backend checks, no bypass', 80.00),
('TC-M06-REPORT', 'Report Generation', 'Smart Score Report, PDF, disclaimer, CRM sync', 80.00),
('TC-M07-CRM', 'CRM Sync', 'Field mapping, retry queue, pending sync handling', 80.00),
('TC-M08-WEEKLY', 'Weekly Update Process', 'Draft to review to approve to publish, no auto-publish', 85.00),
('TC-M09-SPEAKING', 'Speaking Evaluation Rubric', 'Fluency, pronunciation, grammar, lexical, coherence, confidence', 80.00),
('TC-M10-WRITING', 'Writing Evaluation Rubric', 'Task achievement, coherence, vocabulary, grammar', 80.00),
('TC-M11-INTERVIEW', 'Interview Evaluation Rubric', 'Credibility, finance, course knowledge, career plan', 80.00),
('TC-M12-ESCALATION', 'Student Support Escalation', 'Help responses, when to escalate to ALO advisor', 80.00)
ON DUPLICATE KEY UPDATE module_name=VALUES(module_name);
