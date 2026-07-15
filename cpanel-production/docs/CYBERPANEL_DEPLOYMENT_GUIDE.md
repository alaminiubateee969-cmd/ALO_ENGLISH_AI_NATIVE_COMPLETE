# CyberPanel + OpenLiteSpeed Deployment Guide
# ALO English Test Platform — english.aloeducation.com

## Server Environment
- **OS:** Ubuntu Server 22.04.5 LTS (x86_64)
- **Control Panel:** CyberPanel (OpenLiteSpeed)
- **Web Server:** OpenLiteSpeed (lshttpd)
- **Database:** MariaDB 10.11
- **Cache:** Redis + LiteSpeed Memcached
- **Public IP:** 103.231.239.79 (do NOT hardcode in source)
- **Server LAN IP:** 192.168.0.24
- **Router:** TP-Link Archer C6 (Router Mode — do NOT change to Access Point)
- **Ports forwarded:** 80 (HTTP), 443 (HTTPS), 8090 (CyberPanel)

## IMPORTANT — Do NOT
- Do NOT install or configure Apache (OpenLiteSpeed is the web server)
- Do NOT replace CyberPanel with cPanel
- Do NOT upgrade Ubuntu to 24.04 during this deployment
- Do NOT hardcode the public IP (103.231.239.79) in source code
- Do NOT change Router Mode to Access Point Mode

---

## Step 1: Create Website in CyberPanel

1. Login to CyberPanel: `https://192.168.0.24:8090` (or `https://103.231.239.79:8090`)
2. Go to: **Websites → Create Website**
3. Select Package: **Default**
4. Select Owner: **admin** (or your CyberPanel user)
5. Domain: `english.aloeducation.com`
6. Email: your email
7. PHP: **PHP 8.2** (or latest available)
8. Click **Create Website**

This creates:
- Document root: `/home/english.aloeducation.com/public_html/`
- (CyberPanel uses the domain name as the home folder name)

---

## Step 2: Upload Package

### Option A: Via CyberPanel File Manager
1. Go to: **Websites → List Websites → english.aloeducation.com → File Manager**
2. Navigate to `public_html/`
3. Upload `ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip`
4. Right-click → **Extract**
5. Move all extracted files into `public_html/` (so `index.php` is directly in `public_html/`)

### Option B: Via SSH (recommended for large files)
```bash
# Upload zip to server first (via SCP or FTP)
cd /home/english.aloeducation.com/public_html/
unzip ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip
# Ensure index.php is directly in public_html/
ls -la index.php .htaccess
```

---

## Step 3: Configure Rewrite Rules (OpenLiteSpeed)

**IMPORTANT:** OpenLiteSpeed does NOT use `.htaccess` for rewrite rules.

1. Go to: **Websites → List Websites → english.aloeducation.com → Rewrite Rules**
2. Paste the contents of `ols-rewrite-rules.conf` (from the package root)
3. Save

The key rules are:
```
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

Plus blocking rules for `.env`, `database/`, `storage/private/`, `logs/`, `config/`, etc.

---

## Step 4: Configure Security Contexts

In CyberPanel → **Websites → english.aloeducation.com → Context**, add denied contexts:

| URI | Path | Access |
|---|---|---|
| `/storage/private/` | `$VH_ROOT/storage/private/` | Denied |
| `/database/` | `$VH_ROOT/database/` | Denied |
| `/logs/` | `$VH_ROOT/logs/` | Denied |
| `/config/` | `$VH_ROOT/config/` | Denied |
| `/scripts/` | `$VH_ROOT/scripts/` | Denied |
| `/cron/` | `$VH_ROOT/cron/` | Denied |
| `/reports/` | `$VH_ROOT/reports/` | Denied |
| `/docs/` | `$VH_ROOT/docs/` | Denied |
| `/.env` | `$VH_ROOT/.env` | Denied |

---

## Step 5: Create .env File (OUTSIDE web root)

```bash
# Create the env file outside public_html
mkdir -p /home/english.aloeducation.com/config
nano /home/english.aloeducation.com/config/english.env
```

Paste from `.env.production.template` and set real values:
```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://english.aloeducation.com
APP_INSTALLED=1
APP_NAME="ALO English Test Platform"
APP_VERSION=1.0.0
APP_TIMEZONE=Asia/Dhaka

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=aloeduca_english_exam
DB_USERNAME=aloeduca_exam_admin
DB_PASSWORD=YOUR_REAL_PASSWORD_HERE
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

ALO_MAIN_SITE=https://aloeducation.com
ALO_CRM_URL=https://crm.aloeducation.com
CRM_API_URL=https://crm.aloeducation.com/api
CRM_SHARED_SECRET=YOUR_REAL_SECRET_HERE

NO_HUMAN_EXAM_MODE=true
EVALUATION_MODE=automated
EVALUATION_PROVIDER=local_rule_engine
EXTERNAL_AI_ENABLED=false

FREE_QUOTA_ALO=3
FREE_QUOTA_PUBLIC=1

MAIL_ENABLED=false
PAYMENT_ENABLED=false
```

```bash
chmod 600 /home/english.aloeducation.com/config/english.env
```

**Note:** The `index.php` checks for the env file at `ALO_ENV_FILE` env var, then `../config/english.env`, then `.env` in the docroot. Set the `ALO_ENV_FILE` environment variable in CyberPanel PHP settings to point to the real path.

---

## Step 6: Create MariaDB Database

1. Go to: **CyberPanel → Databases → Create Database**
2. Database name: `aloeduca_english_exam`
3. Username: `aloeduca_exam_admin`
4. Password: (strong password)
5. Click **Create Database**

Or via SSH:
```bash
mysql -u root -p
CREATE DATABASE aloeduca_english_exam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aloeduca_exam_admin'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON aloeduca_english_exam.* TO 'aloeduca_exam_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Step 7: Import SQL (in order)

```bash
cd /home/english.aloeducation.com/public_html

mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/install.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/seed.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/question_sets_seed.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/ai_agents_addon.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/no_human_mode_addon.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/ai_agent_training_addon.sql
```

**Note:** MariaDB 10.11 is compatible with the MySQL 8 SQL syntax used in these files. If you encounter `JSON` type issues, replace `JSON` with `LONGTEXT` in install.sql.

---

## Step 8: Verify Database

```sql
-- Should return 61 (54 + 7 training tables)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='aloeduca_english_exam';
-- Should return 32
SELECT COUNT(*) FROM exam_types;
-- Should return 320
SELECT COUNT(*) FROM exam_practice_sets;
-- Should return 20
SELECT COUNT(*) FROM exam_ai_agents;
-- Should return 1
SELECT setting_value FROM exam_settings WHERE setting_key='no_human_exam_mode';
-- Should return 3
SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_alo';
```

---

## Step 9: Set Permissions

```bash
cd /home/english.aloeducation.com/public_html

# Files readable, not writable by web server
chmod 644 index.php .env.example .env.production.template
chmod 644 ols-rewrite-rules.conf DEPLOYMENT-CHECKLIST.md DEVELOPMENT-GUIDELINE.md

# Directories executable
find . -type d -exec chmod 755 {} \;

# PHP files readable
find . -name "*.php" -exec chmod 644 {} \;

# Storage writable by web server
chmod -R 755 storage/
chmod -R 770 storage/private/ storage/reports/ storage/recordings/ storage/submissions/
chown -R nobody:nobody storage/  # OpenLiteSpeed runs as nobody

# Logs writable
chmod 770 logs/
chown nobody:nobody logs/

# Env file secure
chmod 600 /home/english.aloeducation.com/config/english.env
```

---

## Step 10: Configure SSL (Let's Encrypt via CyberPanel)

1. Go to: **CyberPanel → Websites → List Websites → english.aloeducation.com → SSL**
2. Select **Issue SSL** (Let's Encrypt)
3. Wait for certificate to be issued
4. Enable **Force HTTPS** in CyberPanel vhost settings

---

## Step 11: Configure Cron Jobs

```bash
crontab -e
```

Add:
```bash
# Weekly question update (Sunday 2 AM)
0 2 * * 0 cd /home/english.aloeducation.com/public_html && php cron/weekly_question_update.php >> logs/cron-weekly.log 2>&1

# CRM sync (hourly)
0 * * * * cd /home/english.aloeducation.com/public_html && php cron/crm_sync.php >> logs/cron-crm.log 2>&1

# Cleanup expired sessions (daily 3 AM)
0 3 * * * cd /home/english.aloeducation.com/public_html && php cron/cleanup_expired_sessions.php >> logs/cron-cleanup.log 2>&1

# Send pending reports (daily 6 AM)
0 6 * * * cd /home/english.aloeducation.com/public_html && php cron/send_pending_reports.php >> logs/cron-reports.log 2>&1

# Retry failed sync (every 4 hours)
0 */4 * * * cd /home/english.aloeducation.com/public_html && php cron/retry_failed_sync.php >> logs/cron-retry.log 2>&1
```

---

## Step 12: Set ALO_ENV_FILE in CyberPanel PHP Settings

1. Go to: **CyberPanel → Websites → List Websites → english.aloeducation.com → vHost Conf**
2. Add this to the PHP section:
```
env ALO_ENV_FILE=/home/english.aloeducation.com/config/english.env
```
3. Save and restart OpenLiteSpeed

Or alternatively, create a symlink:
```bash
ln -s /home/english.aloeducation.com/config/english.env /home/english.aloeducation.com/public_html/.env
```

---

## Step 13: Restart OpenLiteSpeed

```bash
systemctl restart lsws
# or via CyberPanel: Server Status → Services → OpenLiteSpeed → Restart
```

---

## Step 14: Test Routes

```bash
# From the server
for url in \
"https://english.aloeducation.com" \
"https://english.aloeducation.com/api/health" \
"https://english.aloeducation.com/ielts" \
"https://english.aloeducation.com/computer-based-exams" \
"https://english.aloeducation.com/login" \
"https://english.aloeducation.com/register"; do
  code="$(curl -L -s -o /dev/null -w "%{http_code}" --max-time 20 "$url" 2>/dev/null || echo ERR)"
  echo "$url => $code"
done
```

Expected: all should return **200**.

---

## Step 15: Test Private File Blocking

```bash
for url in \
"https://english.aloeducation.com/.env" \
"https://english.aloeducation.com/database/install.sql" \
"https://english.aloeducation.com/storage/private/" \
"https://english.aloeducation.com/logs/" \
"https://english.aloeducation.com/config/"; do
  code="$(curl -L -s -o /dev/null -w "%{http_code}" --max-time 20 "$url" 2>/dev/null || echo ERR)"
  echo "$url => $code"
done
```

Expected: all should return **403** or **404**.

---

## Step 16: Run Verification Script

```bash
cd /home/english.aloeducation.com/public_html
php scripts/verify_production.php
```

---

## Troubleshooting

### OpenLiteSpeed 404 errors
- Ensure rewrite rules are entered in CyberPanel → Rewrite Rules (NOT .htaccess)
- Ensure `RewriteRule ^ index.php [QSA,L]` is present
- Restart OpenLiteSpeed after changes

### PHP errors
- Check PHP version: `php -v` (must be 8.2+)
- Check error log: `/home/english.aloeducation.com/logs/php-error.log`
- Ensure LSPHP is running (CyberPanel → Server Status → Services)

### MariaDB connection errors
- Verify database credentials in `.env`
- Test connection: `mysql -u aloeduca_exam_admin -p aloeduca_english_exam`
- Check MariaDB is running: `systemctl status mariadb`

### SSL issues
- Ensure DNS for `english.aloeducation.com` points to `103.231.239.79`
- Use CyberPanel SSL manager to issue Let's Encrypt certificate
- Ensure port 443 is forwarded on the TP-Link router

### Permission issues
- OpenLiteSpeed runs as `nobody` user
- Ensure `nobody` can read all PHP files
- Ensure `nobody` can write to `storage/` and `logs/`
