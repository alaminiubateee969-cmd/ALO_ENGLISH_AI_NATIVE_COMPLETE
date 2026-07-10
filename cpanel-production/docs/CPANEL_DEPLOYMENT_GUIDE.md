# ALO English Test Platform — cPanel Deployment Guide

**Audience:** DevOps engineers, cPanel account administrators, ALO IT staff.
**Target hosting:** cPanel shared hosting on the `aloeduca` account.
**Target domain:** https://english.aloeducation.com
**Target document root:** `/home/aloeduca/english.aloeducation.com/public/`
**Secrets file:** `/home/aloeduca/config/english.env` (outside web root)
**Estimated deployment time:** 60–90 minutes for a fresh install; 15–20 minutes for an update.

> This guide assumes you have cPanel access (Username: `aloeduca`), SSH access (optional but recommended), and the production zip from `dist/ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip`.

---

## 1. Pre-deployment Checklist

Before you start:

- [ ] You have the latest production zip (`dist/ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip`) built per `DEVELOPMENT-GUIDELINE.md` §5.6.
- [ ] You have cPanel credentials for the `aloeduca` account.
- [ ] You have the production MySQL DB name, DB user, and DB password ready (planned in advance).
- [ ] You have the ALO CRM API key (for `ALO_CRM_API_KEY`).
- [ ] You have the SMTP credentials for transactional email (e.g. ALO's mail server or SendGrid).
- [ ] You have a strong admin password (min 16 chars; will be hashed with bcrypt `cost=12`).
- [ ] You have notified ALO marketing of the maintenance window (if any).
- [ ] You have a rollback plan: the previous zip is archived in `dist/archive/` and the previous DB is backed up (see §11).

---

## 2. Step 1 — Upload the Production Zip

### 2.1 Via cPanel File Manager

1. Log in to cPanel (`https://cpanel.aloeducation.com` or the host's cPanel URL) as `aloeduca`.
2. Open **Files → File Manager**.
3. Navigate to `/home/aloeduca/` (the account root — NOT `public_html`).
4. Click **Upload** and select `ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip`.
5. Wait for the upload to complete (the zip is ~50–100 MB depending on the question seed size).
6. Right-click the zip → **Extract** → target directory: `/home/aloeduca/english.aloeducation.com/`.
7. Confirm the extracted structure:
   ```
   /home/aloeduca/english.aloeducation.com/
   ├── public/
   ├── app/
   ├── routes/
   ├── config/
   ├── database/
   ├── scripts/
   ├── cron/
   ├── storage/
   ├── docs/
   ├── composer.json
   ├── .env.example
   ├── .htaccess
   └── DEVELOPMENT-GUIDELINE.md
   ```
8. Delete the uploaded zip from `/home/aloeduca/` (keep a copy in `dist/archive/` on your local machine for rollback).

### 2.2 Via SSH (preferred for repeat deployments)

```bash
ssh aloeduca@aloeducation.com
cd /home/aloeduca/
# Option A: scp from your local machine
# (run locally) scp dist/ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip aloeduca@aloeducation.com:/home/aloeduca/

# Option B: pull from a private artifact store
wget -q https://artifacts.alo.com/alo-english-test/1.0.0/ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip

unzip -q ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip -d /home/aloeduca/english.aloeducation.com/
rm ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip
```

---

## 3. Step 2 — Configure `.env` at `/home/aloeduca/config/english.env`

The `.env` file lives **outside** the project root for security. The application reads it via `parse_ini_file()` in `config/database.php`.

### 3.1 Create the config directory

```bash
mkdir -p /home/aloeduca/config
chmod 700 /home/aloeduca/config
```

### 3.2 Create `english.env`

```bash
nano /home/aloeduca/config/english.env
```

Content (replace placeholder values with real secrets):

```ini
; ALO English Test Platform — production secrets
; NEVER commit this file. NEVER paste its contents into chat or email.
; Permissions: 600, owner aloeduca:aloeduca

[app]
APP_ENV       = production
APP_DEBUG     = false
APP_URL       = https://english.aloeducation.com
APP_KEY       = base64:REPLACE_WITH_32_BYTE_BASE64_KEY
APP_TIMEZONE  = UTC

[database]
DB_HOST       = localhost
DB_PORT       = 3306
DB_NAME       = aloeduca_english_test
DB_USER       = aloeduca_etp_app
DB_PASSWORD   = REPLACE_WITH_STRONG_DB_PASSWORD
DB_SSL        = false

[mail]
MAIL_HOST     = smtp.alo.com
MAIL_PORT     = 587
MAIL_USERNAME = no-reply@alo.com
MAIL_PASSWORD = REPLACE_WITH_SMTP_PASSWORD
MAIL_ENCRYPTION = tls
MAIL_FROM     = no-reply@alo.com
MAIL_FROM_NAME = "ALO English Test Platform"

[crm]
ALO_CRM_API_KEY = REPLACE_WITH_CRM_API_KEY
ALO_CRM_ENDPOINT = https://crm.alo.com/api/v2

[payments]
STRIPE_SECRET_KEY  = REPLACE_WITH_STRIPE_SECRET
STRIPE_PUBLISHABLE_KEY = REPLACE_WITH_STRIPE_PUBLISHABLE
STRIPE_WEBHOOK_SECRET = REPLACE_WITH_STRIPE_WEBHOOK_SECRET

[security]
CSRF_TOKEN_TTL_SECONDS = 3600
SIGNED_URL_TTL_SECONDS = 60
RATE_LIMIT_LOGIN_PER_MIN = 5
RATE_LIMIT_API_PER_MIN = 60

[logging]
LOG_CHANNEL = file
LOG_LEVEL   = warning
LOG_PATH    = /home/aloeduca/english.aloeducation.com/storage/logs/app.log
```

### 3.3 Lock down permissions

```bash
chmod 600 /home/aloeduca/config/english.env
chown aloeduca:aloeduca /home/aloeduca/config/english.env
```

Verify:

```bash
ls -l /home/aloeduca/config/english.env
# Expected: -rw------- 1 aloeduca aloeduca ... english.env
```

### 3.4 Generate `APP_KEY`

If you don't already have a 32-byte base64 key, generate one:

```bash
php -r "echo 'base64:' . base64_encode(random_bytes(32)) . PHP_EOL;"
```

Paste the output into `APP_KEY`.

---

## 4. Step 3 — Create the MySQL Database and User

### 4.1 Via cPanel

1. cPanel → **Databases → MySQL® Databases**.
2. **Create New Database**: `aloeduca_english_test` → **Create Database**.
3. **MySQL Users → Add New User**:
   - Username: `aloeduca_etp_app`
   - Password: a strong 24+ char password (use cPanel's generator)
   - **Create User**.
4. **Add User to Database**:
   - User: `aloeduca_etp_app`
   - Database: `aloeduca_english_test`
   - **Add**.
5. **Manage User Privileges** — grant ONLY:
   - `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `INDEX`, `ALTER`, `CREATE TEMPORARY TABLES`, `LOCK TABLES`
   - Do NOT grant `DROP`, `GRANT`, `REFERENCES`, `EXECUTE`, `CREATE VIEW`, `SHOW VIEW`, `CREATE ROUTINE`, `ALTER ROUTINE`, `TRIGGER`, `EVENT`.
   - The schema-install step (§5) uses a separate `aloeduca_schema` user (or the account owner) with `DROP`+`CREATE` for one-time install only.
6. Update `DB_PASSWORD` in `/home/aloeduca/config/english.env` to match.

### 4.2 Via SSH (CLI)

```bash
mysql -u aloeduca_root -p <<'SQL'
CREATE DATABASE aloeduca_english_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aloeduca_etp_app'@'localhost' IDENTIFIED BY 'REPLACE_WITH_STRONG_DB_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, INDEX, ALTER, CREATE TEMPORARY TABLES, LOCK TABLES
  ON aloeduca_english_test.* TO 'aloeduca_etp_app'@'localhost';
FLUSH PRIVILEGES;
SQL
```

---

## 5. Step 4 — Import `install.sql`, `seed.sql`, `question_sets_seed.sql`

### 5.1 Order matters

Always import in this exact order:

1. `database/install.sql` — creates the 44 tables + seeds roles, categories, and 32 exam_types.
2. `database/seed.sql` — seeds permissions, question types, sections, modules, settings, the sample admin user, and the SUPER_ADMIN role grant.
3. `database/question_sets_seed.sql` — seeds 320 practice sets, 1,530 set-sections, 480 sample questions, and 480 question-links.

### 5.2 Via cPanel phpMyAdmin

1. cPanel → **Databases → phpMyAdmin**.
2. Select `aloeduca_english_test` in the left sidebar.
3. **Import** tab → choose `install.sql` from `/home/aloeduca/english.aloeducation.com/database/install.sql` → **Go**.
4. Wait for "Import has been successfully finished."
5. Repeat for `seed.sql`, then `question_sets_seed.sql`.

### 5.3 Via SSH (preferred)

```bash
cd /home/aloeduca/english.aloeducation.com/database/

# Install schema + base seed
mysql -u aloeduca_etp_app -p aloeduca_english_test < install.sql
mysql -u aloeduca_etp_app -p aloeduca_english_test < seed.sql

# Question-set seed (large file — ~1 MB)
mysql -u aloeduca_etp_app -p aloeduca_english_test < question_sets_seed.sql
```

> If the `aloeduca_etp_app` user lacks the `DROP` privilege (which it should), `install.sql`'s `DROP TABLE IF EXISTS` statements will fail on a re-install. For a fresh install, the `DROP` is a no-op (tables don't exist yet) so this is fine. For a re-install, use a temporary schema-admin user, or comment out the DROP block.

### 5.4 Verify the install

```bash
mysql -u aloeduca_etp_app -p aloeduca_english_test -e "
  SELECT COUNT(*) AS tables_count FROM information_schema.tables WHERE table_schema='aloeduca_english_test';
  SELECT COUNT(*) AS roles FROM exam_roles;
  SELECT COUNT(*) AS categories FROM exam_categories;
  SELECT COUNT(*) AS exam_types FROM exam_types;
  SELECT COUNT(*) AS permissions FROM exam_permissions;
  SELECT COUNT(*) AS question_types FROM exam_question_types;
  SELECT COUNT(*) AS sections FROM exam_sections;
  SELECT COUNT(*) AS settings FROM exam_settings;
  SELECT COUNT(*) AS practice_sets FROM exam_practice_sets;
  SELECT COUNT(*) AS questions FROM exam_questions;
"
```

Expected:

```
tables_count: 44
roles: 11
categories: 5
exam_types: 32
permissions: 58
question_types: 58
sections: 153
settings: 43
practice_sets: 320
questions: 480
```

### 5.5 Replace the placeholder admin password

`seed.sql` ships a placeholder bcrypt hash (`$2y$12$REPLACE_WITH_BCRYPT_HASH_OF_REAL_ADMIN_PASSWORD.…`). Replace it before going live.

Generate a real hash:

```bash
php -r "echo password_hash('YOUR_REAL_ADMIN_PASSWORD', PASSWORD_BCRYPT, ['cost' => 12]) . PHP_EOL;"
```

Update the row:

```sql
UPDATE exam_users
SET password_hash = '$2y$12$...your real hash...',
    email_verified_at = NOW(),
    status = 'active'
WHERE email = 'admin@alo.com';
```

(Run this via phpMyAdmin or `mysql -e`.)

---

## 6. Step 5 — Set File and Folder Permissions

From the project root:

```bash
cd /home/aloeduca/english.aloeducation.com/

# Directories: 755
find . -type d -not -path './vendor/*' -exec chmod 755 {} \;

# Files: 644
find . -type f -not -path './vendor/*' -exec chmod 644 {} \;

# Storage subdirectories: 700 (private)
chmod 700 storage/private
chmod 700 storage/logs
chmod 700 storage/cache
chmod 700 storage/uploads

# Public uploads: 755 (web-writable, but no PHP execution)
chmod 755 public/uploads
chmod 755 public/uploads/audio
chmod 755 public/uploads/images
chmod 755 public/uploads/documents

# Cron wrappers: 700
chmod 700 cron/*.sh

# Scripts: 755
chmod 755 scripts/*.php scripts/*.sh scripts/*.py

# .env (already 600 from step 3.3)
chmod 600 /home/aloeduca/config/english.env

# Owner: aloeduca for everything
chown -R aloeduca:aloeduca .
```

### 6.1 Verify

```bash
ls -la /home/aloeduca/config/english.env
# -rw------- 1 aloeduca aloeduca ... english.env

ls -ld /home/aloeduca/english.aloeducation.com/storage/private
# drwx------ 2 aloeduca aloeduca ... storage/private

ls -ld /home/aloeduca/english.aloeducation.com/public/uploads
# drwxr-xr-x 2 aloeduca aloeduca ... public/uploads
```

---

## 7. Step 6 — Install Composer Dependencies

```bash
cd /home/aloeduca/english.aloeducation.com/

# Use the cPanel-provided PHP 8.2+ binary
/opt/cpanel/ea-php82/root/usr/bin/php /opt/cpanel/composer/bin/composer install \
    --no-dev --optimize-autoloader --classmap-authoritative
```

If `composer` is not on PATH, cPanel provides it at `/opt/cpanel/composer/bin/composer`. Verify with `which composer` or `ls /opt/cpanel/composer/bin/composer`.

### 7.1 Verify

```bash
ls -l vendor/autoload.php
# Should exist and be owned by aloeduca

/opt/cpanel/ea-php82/root/usr/bin/php -r "require 'vendor/autoload.php'; echo 'ok';"
# Should print: ok
```

---

## 8. Step 7 — Configure cPanel Add-on Domain

1. cPanel → **Domains → Domains**.
2. Find `english.aloeducation.com` (or click **Create a New Domain** if it does not exist).
3. **Document Root**: `/home/aloeduca/english.aloeducation.com/public`.
4. Save.

### 8.1 Force HTTPS

1. cPanel → **Domains → Domains** → click **Manage** on `english.aloeducation.com`.
2. Toggle **Force HTTPS Redirect** to **ON**.
3. Verify with `curl -I http://english.aloeducation.com/` → should return `301` to `https://`.

The `public/.htaccess` also has a `RewriteRule` for HTTPS (belt-and-braces), but cPanel's toggle is the primary mechanism on shared hosting.

---

## 9. Step 8 — Configure Cron Jobs

cPanel → **Cron Jobs → Add New Cron Job**.

### 9.1 Weekly question update (Monday 02:00)

- **Common Settings:** `0 2 * * 1`
- **Command:**
  ```bash
  /bin/bash /home/aloeduca/english.aloeducation.com/cron/weekly_question_update.sh >> /home/aloeduca/english.aloeducation.com/storage/logs/cron.log 2>&1
  ```

`cron/weekly_question_update.sh`:
```bash
#!/bin/bash
set -e
cd /home/aloeduca/english.aloeducation.com
export PATH=/opt/cpanel/ea-php82/root/usr/bin:$PATH
php scripts/weekly_question_update.php
```

### 9.2 CRM sync (every hour)

- **Common Settings:** `0 * * * *`
- **Command:**
  ```bash
  /bin/bash /home/aloeduca/english.aloeducation.com/cron/crm_sync.sh >> /home/aloeduca/english.aloeducation.com/storage/logs/cron.log 2>&1
  ```

`cron/crm_sync.sh`:
```bash
#!/bin/bash
set -e
cd /home/aloeduca/english.aloeducation.com
export PATH=/opt/cpanel/ea-php82/root/usr/bin:$PATH
php scripts/crm_sync.php
```

### 9.3 Cleanup (daily 03:30)

- **Common Settings:** `30 3 * * *`
- **Command:**
  ```bash
  /bin/bash /home/aloeduca/english.aloeducation.com/cron/cleanup.sh >> /home/aloeduca/english.aloeducation.com/storage/logs/cron.log 2>&1
  ```

`cron/cleanup.sh`:
```bash
#!/bin/bash
set -e
cd /home/aloeduca/english.aloeducation.com
export PATH=/opt/cpanel/ea-php82/root/usr/bin:$PATH
php scripts/cleanup.php
```

### 9.4 Audit reports (Monday 04:00)

- **Common Settings:** `0 4 * * 1`
- **Command:**
  ```bash
  /opt/cpanel/ea-php82/root/usr/bin/php /home/aloeduca/english.aloeducation.com/scripts/generate_audit_reports.php >> /home/aloeduca/english.aloeducation.com/storage/logs/cron.log 2>&1
  ```

### 9.5 Verify cron registration

```bash
crontab -l | grep -E 'weekly_question_update|crm_sync|cleanup|generate_audit_reports'
```

Expect four lines. Each job writes a row to `exam_cron_logs` on execution; check the admin **Audit → Cron Logs** screen after the first run.

---

## 10. Step 9 — Test Routes

Run these from your local machine (replace `english.aloeducation.com` if testing on a staging domain).

### 10.1 Public routes

```bash
curl -I https://english.aloeducation.com/                            # 200
curl -I https://english.aloeducation.com/exams                       # 200
curl -I https://english.aloeducation.com/login                       # 200
curl -I https://english.aloeducation.com/register                    # 200
curl -I https://english.aloeducation.com/health                      # 200 (JSON)
```

### 10.2 Health endpoint body

```bash
curl -s https://english.aloeducation.com/health | jq .
```

Expected JSON (all booleans `true`):

```json
{
  "ok": true,
  "app": "ALO English Test Platform",
  "version": "1.0.0",
  "env_loaded": true,
  "database_connected": true,
  "storage_writable": true,
  "crm_sync_configured": true,
  "ai_configured": true,
  "free_quota": {
    "alo": 3,
    "public": 1,
    "partner": 2,
    "ambassador_referred": 2
  }
}
```

If `database_connected = false`, check `DB_*` in `/home/aloeduca/config/english.env` and the user's grants.
If `storage_writable = false`, re-run §6 permissions.
If `env_loaded = false`, check that `english.env` exists at `/home/aloeduca/config/english.env` and is readable by the PHP user.

### 10.3 Portal routes (after login)

- `/student` → student dashboard.
- `/admin` → admin dashboard (requires `SUPER_ADMIN` or `ADMIN` role).
- `/examiner` → examiner dashboard (requires `EXAMINER` role).
- `/ambassador` → ambassador dashboard (requires `AMBASSADOR` role).

### 10.4 API routes

```bash
# Lead capture
curl -X POST https://english.aloeducation.com/api/lead \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","phone":"+10000000000","message":"deployment test"}'
# Expect: {"lead_id": N, "status":"queued"}

# Quota check (requires student auth token)
curl -s https://english.aloeducation.com/api/quota -H 'Authorization: Bearer <token>' | jq .
```

### 10.5 Take a real mock end-to-end

1. Register a fresh student at `/register`.
2. Verify email and phone.
3. Take a 1-question IELTS Academic mock from the dashboard.
4. Submit. Verify the Smart Score Report renders and the PDF downloads.
5. Check the `exam_mock_attempts` row in the DB: `status = 'completed'`, `started_at` and `submitted_at` set.
6. Check `exam_free_quota.used_free_attempts = 1` for the student's email.

---

## 11. Step 10 — Security Checks

### 11.1 Block `.env`

```bash
curl -I https://english.aloeducation.com/.env
# Expected: 404 (file is outside web root) OR 403 if any stray .env exists in public/

curl -I https://english.aloeducation.com/config/../../../config/english.env
# Expected: 404 or 403 — path traversal blocked by Apache
```

### 11.2 Block `storage/private/`

```bash
curl -I https://english.aloeducation.com/storage/private/reports/sample.pdf
# Expected: 403 Forbidden
```

### 11.3 Force HTTPS

```bash
curl -I http://english.aloeducation.com/
# Expected: 301 -> https://english.aloeducation.com/
```

### 11.4 Security headers

```bash
curl -sI https://english.aloeducation.com/ | grep -iE 'strict-transport|x-content-type|x-frame|referrer-policy|content-security'
```

Expect:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

### 11.5 No PHP execution in uploads

Create a `test.php` containing `<?php echo 'exec'; ?>` and try to upload it via the speaking-recording endpoint. Expected: rejected by `UploadController` (MIME check). If somehow a `.php` lands in `public/uploads/`:

```bash
curl https://english.aloeducation.com/uploads/test.php
# Expected: returns the file as text/plain (no execution)
```

### 11.6 Directory listing off

```bash
curl -I https://english.aloeducation.com/assets/
# Expected: 403 Forbidden (no autoindex)

curl -I https://english.aloeducation.com/storage/
# Expected: 403 Forbidden
```

### 11.7 Admin login protected

- Verify MFA challenge if enabled (`exam_settings.admin_mfa_required`).
- Verify the rate limiter: 5 failed logins in 1 minute from one IP → 15-minute lockout.
- Verify the sample admin password placeholder (`$2y$12$REPLACE_WITH_BCRYPT_HASH...`) is **no longer in the DB** (you replaced it in §5.5).

```sql
SELECT password_hash FROM exam_users WHERE email='admin@alo.com';
-- Should NOT contain the literal string "REPLACE_WITH_BCRYPT_HASH"
```

### 11.8 Student free quota working

- Register a fresh public student (no ALO Student ID).
- Take 1 IELTS mock → success.
- Attempt a 2nd mock → must be blocked with the quota-exhausted message.
- Check `exam_free_quota.used_free_attempts = 1`.

### 11.9 CRM sync not crashing

Trigger the CRM sync manually:

```bash
/opt/cpanel/ea-php82/root/usr/bin/php /home/aloeduca/english.aloeducation.com/scripts/crm_sync.php
```

Then check:

```sql
SELECT entity_type, status, created_at, error_message
FROM exam_crm_sync_logs
ORDER BY id DESC LIMIT 5;
```

If the CRM endpoint is unreachable, the most recent row may be `status = 'pending'` or `status = 'retry'` — that is acceptable. `status = 'error'` requires investigation.

### 11.10 Weekly update cron configured

```bash
crontab -l | grep weekly_question_update
# Expect: 0 2 * * 1 /bin/bash /home/aloeduca/english.aloeducation.com/cron/weekly_question_update.sh ...
```

Run a dry run:

```bash
/opt/cpanel/ea-php82/root/usr/bin/php /home/aloeduca/english.aloeducation.com/scripts/weekly_question_update.php --dry-run
```

Verify a row appears in `exam_weekly_updates` with `status = 'dry_run'` and `notes` containing the preview.

---

## 12. Step 11 — Final Smoke Tests (User-facing)

Run through the full student journey as if you were a real user:

1. Register at `/register` with a fresh email.
2. Click the verification link in the email.
3. Enter the SMS OTP.
4. Land on the student dashboard. Verify the **Free Quota** card shows `0 / 1` used (public).
5. Browse `/exams`. Verify 32 exams across 5 categories render with the wording *"X-style practice test"*.
6. Open the IELTS Academic landing page. Verify the disclaimer is visible.
7. Start a mock. Verify the timer starts, the disclaimer checkbox is required, the question palette works, autosave fires.
8. Submit. Verify the Smart Score Report renders with the disclaimer on page 1.
9. Download the PDF. Open it. Verify the disclaimer is on page 1.
10. Open `/admin` as `admin@alo.com` with the real password. Verify the dashboard loads, the 8 KPIs render, the audit log captured your login.
11. Open `/examiner` as an examiner user. Verify the writing queue and speaking queue render.
12. Open `/ambassador` as an ambassador user. Verify the referral link, recent referrals, and commission render.
13. On mobile (390px width), repeat steps 4–9. Verify responsive layout.

---

## 13. Step 12 — Rollback Plan

If anything is broken and cannot be fixed in 30 minutes, roll back:

### 13.1 Code rollback

```bash
cd /home/aloeduca/
mv english.aloeducation.com english.aloeducation.com.broken
unzip -q dist/archive/ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION_<previous_version>.zip -d english.aloeducation.com
# Re-run §6 (permissions), §7 (composer install), and re-link the .env (it's already in /home/aloeduca/config/)
```

### 13.2 Database rollback

If a schema migration broke the DB:

```bash
mysql -u aloeduca_root -p aloeduca_english_test < /home/aloeduca/backups/aloeduca_english_test_<timestamp>.sql
```

(DB backups are taken before every deploy — see §1 pre-deployment checklist.)

### 13.3 Cron rollback

If a new cron entry is misbehaving, comment it out in cPanel → Cron Jobs and re-add the previous entry.

### 13.4 Communication

- Set `status.aloeducation.com` to "Degraded Performance" or "Outage" as appropriate.
- Notify `support@alo.com` and the ALO marketing team.
- Open a post-mortem within 24 hours.

---

## 14. Post-deployment Monitoring (first 48 hours)

- **Hourly:** check `storage/logs/app.log` for `ERROR` and `CRITICAL` lines.
- **Hourly:** check `exam_cron_logs` — every hourly CRM sync should write a row.
- **Daily:** check `exam_audit_logs` for unusual patterns (mass deletions, unexpected admin actions).
- **Monday 02:00 (first weekly run):** watch `exam_weekly_updates` for the pipeline's 12-step progress.
- **Monday 04:00:** check `storage/private/reports/audit/` for the new compliance PDF.
- **End of week 1:** review the bank health score and reviewer performance.

---

## 15. Common Issues and Fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| `curl /health` returns `database_connected: false` | `DB_*` env vars wrong, or DB user lacks privileges | Check `english.env`; verify grants in cPanel → MySQL Databases |
| 500 on every page | `storage/logs/` not writable, or `vendor/autoload.php` missing | Re-run §6 permissions and §7 composer install |
| 404 on `/student` etc. | cPanel document root points to project root, not `public/` | Fix in cPanel → Domains → Document Root |
| Cron jobs not firing | cPanel cron disabled, or path to PHP binary wrong | Verify with `crontab -l`; use `/opt/cpanel/ea-php82/root/usr/bin/php` |
| HTTPS not enforced | cPanel "Force HTTPS Redirect" off | Toggle on in cPanel → Domains |
| `storage/private` returns 200 | `.htaccess` not read (AllowOverride off) | Add `<Directory>` block in cPanel Apache config; or contact host |
| `public/uploads` allows PHP | `.htaccess` in `public/uploads/` missing or `mod_php` overrides | Verify `php_flag engine off` and `RemoveHandler` directives |
| CRM sync `status = error` | API key wrong, or endpoint blocked by firewall | Verify `ALO_CRM_API_KEY` and `ALO_CRM_ENDPOINT` in `english.env` |
| Weekly update `status = held` | Fewer than `weekly_update_publish_threshold` approved items | Wait for reviewers, or admin lowers threshold with justification |
| Admin login locked out | 5 failed attempts in 1 minute | Wait 15 minutes, or clear `exam_rate_limits` for the IP |
| PDF report download fails | Signed URL expired (>60s) or IP changed | Re-request the download link |

---

## 16. Sign-off

The deployment is complete when:

- [ ] All §10 routes return expected status codes.
- [ ] `/health` JSON shows all booleans `true` and the correct free-quota values.
- [ ] All §11 security checks pass.
- [ ] All §12 smoke tests pass.
- [ ] Cron jobs are registered (§9) and the first hourly CRM sync wrote a row to `exam_crm_sync_logs`.
- [ ] The previous-version zip and DB dump are stored in `dist/archive/` and `/home/aloeduca/backups/` respectively (for rollback).
- [ ] The deploying engineer signs the release ticket and a second engineer reviews.

End of `docs/CPANEL_DEPLOYMENT_GUIDE.md`.
