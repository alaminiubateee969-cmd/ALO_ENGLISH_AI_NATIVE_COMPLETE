# ALO ENGLISH TEST PLATFORM — FINAL PRODUCTION GUIDE
## cPanel Development Package — Complete Deployment Instructions

---

## ═══════════════════════════════════════════════════════
## PACKAGE SUMMARY
## ═══════════════════════════════════════════════════════

**File:** `ALO-ENGLISH-CPANEL-PRODUCTION.zip`
**Size:** 473 KB
**Files:** 167
**SHA-256:** `b2833e7c632ebb66229286fc1cc6c8abba5fbffd405d1cd4da32fbc5903c44cd`
**Forbidden files:** 0 (no .env, no .git, no node_modules, no logs)

### What's Inside:
| Category | Count |
|---|---|
| PHP files | 88 |
| SQL files | 10 |
| View files | 19 |
| Config files | 4 |
| Cron jobs | 6 |
| Scripts | 5 |
| Docs | 14 |
| Reports | 12 |
| CSS/JS | 2 |
| Root files | 6 (index.php, .htaccess, .env.example, ols-rewrite-rules.conf, DEVELOPMENT-GUIDELINE.md, DEPLOYMENT-CHECKLIST.md) |

---

## ═══════════════════════════════════════════════════════
## HOW TO RUN ON YOUR SERVER
## ═══════════════════════════════════════════════════════

### Server Requirements:
- Ubuntu 22.04 LTS
- CyberPanel + OpenLiteSpeed
- MariaDB 10.11
- PHP 8.2+
- User: aloedu

### Step 1: Upload the zip
```bash
# Upload ALO-ENGLISH-CPANEL-PRODUCTION.zip to your server
# Via CyberPanel File Manager or SCP:
scp ALO-ENGLISH-CPANEL-PRODUCTION.zip aloedu@103.231.239.79:/home/english.aloeducation.com/
```

### Step 2: Extract
```bash
cd /home/english.aloeducation.com/
unzip ALO-ENGLISH-CPANEL-PRODUCTION.zip
# Verify index.php is in the root
ls -la index.php .htaccess
```

### Step 3: Create .env (OUTSIDE web root)
```bash
mkdir -p /home/english.aloeducation.com/config
cp .env.example /home/english.aloeducation.com/config/english.env
nano /home/english.aloeducation.com/config/english.env
```
Set these values:
```
DB_PASSWORD=YOUR_REAL_PASSWORD
CRM_SHARED_SECRET=YOUR_REAL_SECRET
APP_KEY=GENERATE_64_CHAR_RANDOM_STRING
```

### Step 4: Configure OpenLiteSpeed Rewrite Rules
1. Login to CyberPanel: https://192.168.0.24:8090
2. Websites → english.aloeducation.com → Rewrite Rules
3. Paste contents of `ols-rewrite-rules.conf`
4. Save

### Step 5: Create MariaDB Database
```bash
mysql -u root -p
CREATE DATABASE aloeduca_english_exam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aloeduca_exam_admin'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON aloeduca_english_exam.* TO 'aloeduca_exam_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 6: Import SQL (in this exact order)
```bash
cd /home/english.aloeducation.com
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/install.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/seed.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/question_sets_seed.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/ai_agents_addon.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/no_human_mode_addon.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/ai_agent_training_addon.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/certificate_addon.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/ai_governance_addon.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/invoice_addon.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/seo_growth_addon.sql
```

### Step 7: Set Permissions
```bash
cd /home/english.aloeducation.com
chmod 644 index.php .htaccess .env.example
find . -type d -exec chmod 755 {} \;
find . -name "*.php" -exec chmod 644 {} \;
chmod -R 770 storage/ logs/
chown -R nobody:nobody storage/ logs/
chmod 600 /home/english.aloeducation.com/config/english.env
```

### Step 8: Issue SSL
CyberPanel → Websites → english.aloeducation.com → SSL → Issue SSL (Let's Encrypt)

### Step 9: Configure Cron Jobs
```bash
crontab -e
```
Add:
```bash
0 2 * * 0 cd /home/english.aloeducation.com && php cron/weekly_question_update.php >> logs/cron-weekly.log 2>&1
0 * * * * cd /home/english.aloeducation.com && php cron/crm_sync.php >> logs/cron-crm.log 2>&1
0 3 * * * cd /home/english.aloeducation.com && php cron/cleanup_expired_sessions.php >> logs/cron-cleanup.log 2>&1
0 6 * * * cd /home/english.aloeducation.com && php cron/send_pending_reports.php >> logs/cron-reports.log 2>&1
0 */4 * * * cd /home/english.aloeducation.com && php cron/retry_failed_sync.php >> logs/cron-retry.log 2>&1
```

### Step 10: Restart OpenLiteSpeed
```bash
systemctl restart lsws
```

### Step 11: Test
```bash
# Public pages should return 200
curl -s -o /dev/null -w "%{http_code}" https://english.aloeducation.com/
curl -s -o /dev/null -w "%{http_code}" https://english.aloeducation.com/api/health.php

# Private files should return 403/404
curl -s -o /dev/null -w "%{http_code}" https://english.aloeducation.com/.env
curl -s -o /dev/null -w "%{http_code}" https://english.aloeducation.com/database/install.sql
```

### Step 12: Create Admin User
```bash
cd /home/english.aloeducation.com
php scripts/reset_admin_password.php admin@aloeducation.com
# This generates a temporary password and prints it once
```

---

## ═══════════════════════════════════════════════════════
## WHERE TO MAKE CHANGES
## ═══════════════════════════════════════════════════════

| What you want to change | File path |
|---|---|
| Homepage text | `views/public/index.php` |
| Login page | `views/public/login.php` |
| Register page | `views/public/register.php` |
| Pricing page | `views/public/pricing.php` |
| Contact page | `views/public/contact.php` |
| Privacy policy | `views/public/privacy.php` |
| Terms of service | `views/public/terms.php` |
| Exam disclaimer | `views/public/exam-disclaimer.php` |
| Exam landing pages | `views/public/exam-page.php` |
| How exams work | `views/public/how-exams-work.php` |
| Computer-based exams page | `views/public/computer-based-exams.php` |
| Ambassador page | `views/public/ambassador.php` |
| Tests listing | `views/public/tests.php` |
| Student dashboard | `views/student/dashboard.php` |
| Admin dashboard | `views/admin/dashboard.php` |
| Examiner dashboard | `views/examiner/dashboard.php` |
| Ambassador dashboard | `views/ambassador/dashboard.php` |
| Website header | `views/layouts/header.php` |
| Website footer | `views/layouts/footer.php` |
| CSS styles | `public/css/style.css` |
| JavaScript | `public/js/main.js` |
| Database schema | `database/install.sql` |
| Seed data | `database/seed.sql` |
| Practice sets | `database/question_sets_seed.sql` |
| AI agent config | `database/ai_agents_addon.sql` |
| No-human mode | `database/no_human_mode_addon.sql` |
| Exam rules | `docs/ALL_EXAM_RULES_MATRIX.md` |
| App config | `config/app.php` |
| Database config | `config/database.php` |
| Exam settings | `config/exams.php` |
| Permissions | `config/permissions.php` |
| Routes (URLs) | `app/routes.php` |
| Auth logic | `app/Services/AuthService.php` |
| Quota enforcement | `app/Services/QuotaService.php` |
| Exam engine | `app/Services/TestEngineService.php` |
| Scoring | `app/Services/ScoringService.php` |
| CRM sync | `app/Services/CRMIntegrationService.php` |
| Certificates | `app/Services/CertificateService.php` |
| Invoices | `app/Services/InvoiceService.php` |
| AI governance | `app/Services/AiGovernanceService.php` |
| Weekly updates | `cron/weekly_question_update.php` |
| Environment variables | `.env.example` (copy to config/english.env) |
| OLS rewrite rules | `ols-rewrite-rules.conf` |
| .htaccess (Apache) | `.htaccess` |

---

## ═══════════════════════════════════════════════════════
## DATABASE TABLES (54 + addons)
## ═══════════════════════════════════════════════════════

### Core Tables (install.sql):
exam_users, exam_students, exam_roles, exam_permissions, exam_user_roles, exam_types, exam_categories, exam_sections, exam_modules, exam_question_types, exam_questions, exam_question_options, exam_question_media, exam_practice_sets, exam_practice_set_sections, exam_practice_set_questions, exam_mock_attempts, exam_attempt_sections, exam_answers, exam_scores, exam_score_breakdown, exam_speaking_sessions, exam_writing_submissions, exam_feedback, exam_reports, exam_certificates, exam_free_quota, exam_vouchers, exam_voucher_usage, exam_payments, exam_leads, exam_consultation_bookings, exam_marketing_sources, exam_crm_sync_logs, exam_weekly_updates, exam_question_versions, exam_question_review_queue, exam_admin_approvals, exam_uploads, exam_proctor_logs, exam_audit_logs, exam_settings, exam_terms_acceptance, exam_cron_logs

### AI Agent Tables (ai_agents_addon.sql):
exam_ai_agents, exam_ai_agent_tasks, exam_ai_agent_logs, exam_ai_agent_reviews, exam_ai_agent_settings, exam_ai_agent_failures, exam_ai_agent_approvals, exam_ai_agent_prompts, exam_ai_agent_performance, exam_ai_agent_audit

### Training Tables (ai_agent_training_addon.sql):
exam_ai_agent_training_modules, exam_ai_agent_training_runs, exam_ai_agent_knowledge_base, exam_ai_agent_update_logs, exam_ai_agent_model_versions, exam_ai_agent_quality_scores, exam_rule_versions

### Governance Tables (ai_governance_addon.sql):
exam_ai_agent_objectives, exam_ai_agent_memory, exam_ai_agent_tools, exam_ai_agent_tool_failures, exam_ai_decision_pipelines, exam_ai_agent_feedback

### Other Addons:
- certificate_addon.sql: Extends exam_certificates table
- invoice_addon.sql: Creates exam_invoices table
- seo_growth_addon.sql: Creates 21 SEO tables
- no_human_mode_addon.sql: Adds columns to existing tables

---

## ═══════════════════════════════════════════════════════
## SQL IMPORT ORDER (CRITICAL)
## ═══════════════════════════════════════════════════════

1. `database/install.sql` — Creates all 54 core tables
2. `database/seed.sql` — Seeds roles, permissions, settings, exam types
3. `database/question_sets_seed.sql` — 320 practice sets
4. `database/ai_agents_addon.sql` — 10 AI agent tables + 20 agents
5. `database/no_human_mode_addon.sql` — No-human mode columns + settings
6. `database/ai_agent_training_addon.sql` — 7 training tables + 12 modules
7. `database/certificate_addon.sql` — Certificate columns + Certificate Agent
8. `database/ai_governance_addon.sql` — 6 governance tables + objective locks
9. `database/invoice_addon.sql` — Invoice table + settings
10. `database/seo_growth_addon.sql` — 21 SEO tables + seed data

---

## ═══════════════════════════════════════════════════════
## DAILY / WEEKLY / MONTHLY TASKS
## ═══════════════════════════════════════════════════════

### Daily:
- Check CyberPanel → Server Status → Services (OpenLiteSpeed, MariaDB running)
- Check logs: `tail -20 logs/php-error.log`
- Check cron: `tail -5 logs/cron-crm.log logs/cron-weekly.log`

### Weekly:
- Review weekly question drafts (Admin → Question Bank)
- Approve or reject draft questions (never auto-publish)
- Check AI agent governance dashboard
- Review CRM sync logs

### Monthly:
- Backup database: `mysqldump -u aloeduca_exam_admin -p aloeduca_english_exam > backup-$(date +%Y%m%d).sql`
- Run verification: `php scripts/verify_production.php`
- Update question bank with new original questions
- Review audit logs

---

## ═══════════════════════════════════════════════════════
## VERIFICATION CHECKLIST
## ═══════════════════════════════════════════════════════

After deployment, verify:

- [ ] `https://english.aloeducation.com/` returns 200
- [ ] `https://english.aloeducation.com/api/health.php` returns JSON
- [ ] `https://english.aloeducation.com/ielts` returns 200
- [ ] `https://english.aloeducation.com/login` returns 200
- [ ] `https://english.aloeducation.com/register` returns 200
- [ ] `https://english.aloeducation.com/.env` returns 403/404
- [ ] `https://english.aloeducation.com/database/install.sql` returns 403/404
- [ ] `https://english.aloeducation.com/storage/private/` returns 403/404
- [ ] Database has 54+ tables
- [ ] Database has 32 exam types
- [ ] Database has 320 practice sets
- [ ] Database has 20+ AI agents
- [ ] `no_human_exam_mode` setting = 1
- [ ] `free_quota_alo` setting = 3
- [ ] `free_quota_public` setting = 1
- [ ] Admin user created via `php scripts/reset_admin_password.php`
- [ ] Cron jobs configured
- [ ] SSL certificate issued
- [ ] OpenLiteSpeed running

---

## ═══════════════════════════════════════════════════════
## TROUBLESHOOTING
## ═══════════════════════════════════════════════════════

| Problem | Solution |
|---|---|
| 404 on all pages | OLS rewrite rules not configured → paste ols-rewrite-rules.conf in CyberPanel |
| 500 internal error | Check `logs/php-error.log` → likely DB connection issue |
| Database connection failed | Verify .env DB credentials match MariaDB user |
| CSS not loading | Check `public/css/style.css` exists and is readable |
| Can't login | Run `php scripts/reset_admin_password.php admin@aloeducation.com` |
| CRM sync failing | Normal if CRM unavailable — system saves locally and retries |
| Email not sending | Set MAIL_ENABLED=true and configure SMTP in .env |
| Certificate not generating | Check `exam_settings.no_human_exam_mode = 1` in database |
| 503 service unavailable | Restart: `systemctl restart lsws && systemctl restart mariadb` |

---

## ═══════════════════════════════════════════════════════
## FINAL STATUS
## ═══════════════════════════════════════════════════════

**Package:** ALO-ENGLISH-CPANEL-PRODUCTION.zip
**Size:** 473 KB | 167 files | 0 forbidden files
**Ready for:** CyberPanel + OpenLiteSpeed + MariaDB on Ubuntu 22.04

This zip contains ONLY the cPanel development files needed to run the platform. No Node.js, no Next.js, no test databases, no node_modules — just PHP, SQL, views, config, cron, scripts, docs.
