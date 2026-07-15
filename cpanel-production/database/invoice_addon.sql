-- ALO Labs AgentOS — Invoice System addon
-- Uses same branding as ALO Labs (hexagon logo, orange #FF6A00, blue #003399)

CREATE TABLE IF NOT EXISTS exam_invoices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_code VARCHAR(48) NOT NULL UNIQUE,
  student_id BIGINT UNSIGNED NULL,
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NULL,
  student_phone VARCHAR(32) NULL,
  invoice_type ENUM('mock_test_single','mock_test_bundle','prep_course','voucher','speaking_practice','writing_evaluation','custom') DEFAULT 'mock_test_single',
  description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'BDT',
  payment_status ENUM('pending','paid','cancelled','refunded') DEFAULT 'pending',
  payment_method VARCHAR(32) NULL,
  payment_transaction_id VARCHAR(128) NULL,
  paid_at DATETIME NULL,
  due_date DATE NULL,
  notes TEXT NULL,
  pdf_path VARCHAR(255) NULL,
  crm_synced TINYINT(1) DEFAULT 0,
  auto_generated TINYINT(1) DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_student (student_id), INDEX idx_status (payment_status), INDEX idx_code (invoice_code), INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice settings (ALO Labs AgentOS branding)
INSERT INTO exam_settings (setting_key, setting_value, is_secret, updated_by, created_at, updated_at) VALUES
('invoice_brand_name', 'ALO Labs AgentOS', 0, 1, NOW(), NOW()),
('invoice_brand_tagline', 'AI AGENT OPERATING SYSTEM', 0, 1, NOW(), NOW()),
('invoice_brand_color_orange', '#FF6A00', 0, 1, NOW(), NOW()),
('invoice_brand_color_blue', '#003399', 0, 1, NOW(), NOW()),
('invoice_currency', 'BDT', 0, 1, NOW(), NOW()),
('invoice_auto_generate', '1', 0, 1, NOW(), NOW()),
('invoice_payment_methods', 'bKash,Nagad,SSLCommerz,Stripe,Bank Transfer', 0, 1, NOW(), NOW()),
('invoice_contact_address', 'ALO Education, Dhaka, Bangladesh', 0, 1, NOW(), NOW()),
('invoice_contact_phone', '+880 9613-ALO-EDU', 0, 1, NOW(), NOW()),
('invoice_contact_website', 'https://english.aloeducation.com', 0, 1, NOW(), NOW()),
('invoice_contact_email', 'billing@aloeducation.com', 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at=NOW();
