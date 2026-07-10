# ALO English Test Platform — Live cPanel Deployment Checklist

## Target
- **Domain:** https://english.aloeducation.com
- **cPanel account:** aloeduca
- **Document root:** /home/aloeduca/english.aloeducation.com
- **Secrets file (outside web root):** /home/aloeduca/config/english.env
- **Main ALO CRM:** https://crm.aloeducation.com
- **Main ALO website:** https://aloeducation.com

## Step 1: Backup
```bash
cd /home/aloeduca
cp -r english.aloeducation.com english.aloeducation.com.backup-$(date +%Y%m%d-%H%M%S)
```

## Step 2: Upload & Extract
1. Login to cPanel → File Manager
2. Navigate to `/home/aloeduca/english.aloeducation.com`
3. Upload `ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip`
4. Extract inside the folder
5. Confirm `index.php` and `.htaccess` are directly inside the folder

## Step 3: Create .env (outside web root)
Create `/home/aloeduca/config/english.env` using `.env.production.template` as reference.
Set `DB_PASSWORD`, `CRM_SHARED_SECRET`, `APP_KEY` to real values.

## Step 4: Create MySQL Database
- Database name: `aloeduca_english_exam`
- Username: `aloeduca_exam_admin`
- Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
- Grant ALL privileges

## Step 5: Import SQL (in this exact order)
```bash
cd /home/aloeduca/english.aloeducation.com
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/install.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/seed.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/question_sets_seed.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/ai_agents_addon.sql
mysql -u aloeduca_exam_admin -p aloeduca_english_exam < database/no_human_mode_addon.sql
```

## Step 6: Verify Database
```sql
-- Should return 54
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
-- Should return 1
SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_public';
```

## Step 7: Set Permissions
```bash
chmod 644 index.php .htaccess .env.example
chmod 755 app config database views public cron scripts docs reports api
chmod -R 600 storage/private/
chmod 644 storage/*/.gitkeep
chmod 600 /home/aloeduca/config/english.env
```

## Step 8: Configure Cron Jobs
```bash
# Weekly question update (Sunday 2 AM)
0 2 * * 0 cd /home/aloeduca/english.aloeducation.com && php cron/weekly_question_update.php
# CRM sync (hourly)
0 * * * * cd /home/aloeduca/english.aloeducation.com && php cron/crm_sync.php
# Cleanup expired sessions (daily 3 AM)
0 3 * * * cd /home/aloeduca/english.aloeducation.com && php cron/cleanup_expired_sessions.php
# Send pending reports (daily 6 AM)
0 6 * * * cd /home/aloeduca/english.aloeducation.com && php cron/send_pending_reports.php
# Retry failed sync (every 4 hours)
0 */4 * * * cd /home/aloeduca/english.aloeducation.com && php cron/retry_failed_sync.php
```

## Step 9: Run Verification Script
```bash
cd /home/aloeduca/english.aloeducation.com
php scripts/verify_production.php
```

## Step 10: Run Full Test Commands
See the "Live Test Commands" section below.

## Step 11: Live Route Test
```bash
for url in \
"https://english.aloeducation.com" \
"https://english.aloeducation.com/api/health" \
"https://english.aloeducation.com/ielts" \
"https://english.aloeducation.com/computer-based-exams" \
"https://english.aloeducation.com/login" \
"https://english.aloeducation.com/register"; do
  code="$(curl -L -s -o /dev/null -w "%{http_code}" --max-time 20 "$url")"
  echo "$url => $code"
done
```

## Step 12: Private Access Test (should all be 403/404)
```bash
for url in \
"https://english.aloeducation.com/.env" \
"https://english.aloeducation.com/database/install.sql" \
"https://english.aloeducation.com/storage/private/" \
"https://english.aloeducation.com/logs/"; do
  code="$(curl -L -s -o /dev/null -w "%{http_code}" --max-time 20 "$url")"
  echo "$url => $code"
done
```
