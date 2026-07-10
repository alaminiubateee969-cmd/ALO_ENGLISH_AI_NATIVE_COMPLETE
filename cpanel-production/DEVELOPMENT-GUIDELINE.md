# ALO English Test Platform — Development Guideline

**Document version:** 1.0.0
**Target environment:** cPanel shared hosting, PHP 8.2+, MySQL 8.0
**Production domain:** https://english.aloeducation.com
**Production document root:** `/home/aloeduca/english.aloeducation.com`
**Secrets location (outside web root):** `/home/aloeduca/config/english.env`
**Source repository:** ALO Education internal Git (mirror in cPanel Git™ Version Control)

> This document is the canonical engineering reference for everyone writing, reviewing, deploying, or auditing code on the ALO English Test Platform. Read it before opening a pull request. If you find a contradiction between this guideline and the live codebase, the **codebase wins for behavior** and a **PR must be opened to fix this guideline** within the same change set.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project name | ALO English Test Platform |
| Short name | ALO ETP |
| Domain | https://english.aloeducation.com |
| Production folder | `/home/aloeduca/english.aloeducation.com` |
| Secrets file | `/home/aloeduca/config/english.env` (outside web root) |
| Storage root (private) | `/home/aloeduca/english.aloeducation.com/storage/private/` (blocked from web) |
| Public web root | `/home/aloeduca/english.aloeducation.com/public/` |
| Platform name (public) | ALO English Test Platform |
| Platform version | `1.0.0` (stored in `exam_settings.platform_version`) |
| Support email | `support@alo.com` (stored in `exam_settings.support_email`) |
| Tech stack | PHP 8.2+, MySQL 8.0, vanilla PDO, Composer for autoloading, no framework lock-in |
| Supported exams | 32 across 5 categories (see §6) |
| Question bank | 100% original content, exam-aligned, practice-only |

### 1.1 Purpose

ALO English Test Platform is a **practice and self-assessment** service operated by ALO Education. It lets students:

- take **mock / practice** versions of 32 international English, study-abroad, university-placement, visa-interview, and ALO-internal exams;
- receive a **Smart Score Report** with skill breakdowns, model answers, and explanations;
- book follow-up **counseling sessions** with ALO advisors;
- track their **long-term progress** and redeem **vouchers** for paid attempts;
- be referred into the platform by **ambassadors** and partner students.

The platform is **not** an official testing center. It does **not** issue certificates that count as official language proficiency certifications, and it does **not** guarantee that any practice item will appear in a real exam. Every public surface carries the standard disclaimer:

> *Practice exam only. Estimated score only. Not official exam result. No guarantee that questions will appear in real exam.*

### 1.2 Public-facing product naming

Use these labels on every student-visible surface (UI, PDF reports, certificates, emails):

| Concept | Approved wording | Forbidden wording |
|---|---|---|
| Automated scorer | **ALO Estimated Score Engine** / **Smart Score Report** | "AI teacher", "real examiner", "official score" |
| Speaking practice | **ALO Practice Interview Coach** / **Automated Practice Feedback** | "fake human teacher", "real IELTS examiner" |
| Writing practice | **ALO Evaluation System** | "official writing examiner" |
| Mock session | **Digital Practice Session** | "real exam", "official exam sitting" |
| Examiner role | **ALO Practice Examiner** | "official examiner" |
| Practice items | **Original exam-aligned practice** | "guaranteed exam question", "real exam common", "official exam prediction" |

### 1.3 Compliance absolutes (read every time)

1. **Never** claim official partnership with IELTS, PTE, TOEFL, Duolingo, SAT, GRE, GMAT, LSAT, MCAT, ACT, OET, LanguageCert, Linguaskill, OIETC, or any other test publisher.
2. **Never** reproduce official exam items. Every question, passage, audio script, chart, and answer key in the bank must be **100% original** and authored or licensed by ALO.
3. **Always** label exam-aligned practice with the exact wording stored in `exam_types.style_label` (e.g. *"IELTS-style academic practice test"*, *"GRE-style practice test"*).
4. **Always** show the practice disclaimer on every practice set, attempt start screen, score report, and certificate. The canonical text is stored in `exam_settings.practice_disclaimer`, `attempts_disclaimer`, and `certificates_disclaimer`.
5. **Always** enforce the **free quota rule**: ALO-linked students get **3 free** attempts; public (non-ALO) students get **1 free** attempt. Quota is **shared across all 32 exams** and enforced server-side in the attempt-start controller (`app/Controllers/AttemptController.php::start()`). It is **never** trusted from the client.
6. **Never** store plaintext passwords, API keys, CRM tokens, or payment-gateway secrets in Git, SQL seed files, or PHP source. Secrets live only in `/home/aloeduca/config/english.env`.

---

## 2. Repository Layout (Where to Edit)

The cPanel production package mirrors the layout below. When a ticket references "edit the student dashboard", the corresponding folder in the table is where the change lands.

```
/home/aloeduca/english.aloeducation.com/        ← project root (= cPanel add-on domain doc root parent)
├── public/                                       ← web root (only this is served by Apache)
│   ├── index.php                                 ← front controller
│   ├── .htaccess                                 ← HTTPS redirect, security headers, routing
│   ├── assets/                                   ← compiled CSS/JS, fonts
│   │   ├── css/
│   │   ├── js/
│   │   └── img/                                  ← brand images, logos, illustrations
│   ├── uploads/                                  ← student-uploaded files (NO PHP execution)
│   │   ├── audio/                                ← speaking recordings (.webm, .ogg)
│   │   ├── images/                               ← uploaded images
│   │   └── documents/                            ← uploaded PDFs
│   └── robots.txt, favicon.ico, sitemap.xml
├── app/
│   ├── Controllers/
│   │   ├── PublicController.php                  ← public landing, exams catalog, pricing
│   │   ├── AuthController.php                    ← register, login, email/phone verify, RBAC
│   │   ├── StudentController.php                 ← student dashboard, results, vouchers, plan
│   │   ├── AdminController.php                   ← admin dashboard, students, reports, settings
│   │   ├── ExaminerController.php                ← writing/speaking queue, review screen
│   │   ├── AmbassadorController.php              ← referrals, vouchers, commission, marketing kit
│   │   ├── AttemptController.php                 ← exam engine: setup, start, answer, submit, score
│   │   ├── QuestionBankController.php            ← CRUD, import, review, publish, version
│   │   ├── PracticeSetController.php             ← practice-set CRUD + section assembly
│   │   ├── VoucherController.php                 ← generate, redeem, usage log
│   │   ├── QuotaController.php                   ← free-quota check + top-up
│   │   ├── CrmController.php                     ← CRM sync UI + manual retry
│   │   ├── ReportController.php                  ← PDF report generation, download
│   │   ├── UploadController.php                  ← secure upload, MIME check, virus-scan hook
│   │   ├── DownloadController.php                ← signed-URL download of private artifacts
│   │   ├── AuditController.php                   ← audit log viewer (admin only)
│   │   ├── WeeklyUpdateController.php            ← weekly content workflow UI + approve
│   │   └── HealthController.php                  ← /health endpoint
│   ├── Models/                                   ← 1:1 with tables (Eloquent-style PDO)
│   ├── Services/
│   │   ├── ExamEngine.php                        ← timer, autosave, scoring orchestration
│   │   ├── ScoringRules.php                      ← band/scaled/percent/rubric scorers
│   │   ├── FreeQuotaService.php                  ← ALO 3 / public 1 enforcement
│   │   ├── QuestionBankService.php               ← search, filter, duplicate detection
│   │   ├── WeeklyUpdateService.php               ← 12-step pipeline orchestration
│   │   ├── CrmSyncService.php                    ← two-way sync with ALO CRM
│   │   ├── PdfReportService.php                  ← Smart Score Report PDF
│   │   ├── VoucherService.php                    ← generation + redemption
│   │   ├── ProctorService.php                    ← tab-switch + integrity logging
│   │   └── AuditLogger.php                       ← writes exam_audit_logs
│   ├── Middleware/
│   │   ├── AuthMiddleware.php
│   │   ├── RbacMiddleware.php                    ← role + permission check
│   │   ├── CsrfMiddleware.php
│   │   ├── RateLimitMiddleware.php
│   │   └── SecurityHeadersMiddleware.php
│   ├── Views/
│   │   ├── public/                               ← landing, exam catalog, pricing, FAQ, lead
│   │   ├── student/                              ← dashboard, practice-tests, attempt, results, vouchers, plan, messages, settings
│   │   ├── admin/                                ← dashboard, students, questions, practice-sets, vouchers, crm, audit, reports, weekly-updates, settings
│   │   ├── examiner/                             ← dashboard, writing-queue, speaking-queue, review
│   │   ├── ambassador/                           ← dashboard, referrals, vouchers, commission, marketing-kit
│   │   ├── emails/                               ← verify, welcome, report-ready, voucher-issued
│   │   └── pdf/                                  ← score-report, certificate, weekly-summary
│   └── Helpers/                                  ← time, money, sanitizer, banner
├── routes/
│   ├── web.php                                   ← public + portal routes
│   └── api.php                                   ← /api/lead, /api/health, /api/quota, /api/crm-hook
├── config/
│   ├── app.php                                   ← non-secret config (cache TTLs, feature flags mirror)
│   ├── database.php                              ← reads from english.env
│   ├── routes.php                                ← route table cache
│   └── security.php                              ← CSP, headers, allowed upload MIMEs
├── database/
│   ├── install.sql                               ← schema + roles + categories + 32 exam_types
│   ├── seed.sql                                  ← permissions, question types, sections, modules, settings, admin user
│   ├── question_sets_seed.sql                    ← 320 practice sets + sections + sample questions
│   └── migrations/                               ← forward-only ALTER scripts (timestamped)
├── scripts/
│   ├── generate_audit_reports.php                ← weekly compliance/usage PDFs
│   ├── weekly_question_update.php                ← weekly content pipeline (cron-driven)
│   ├── crm_sync.php                              ← hourly CRM two-way sync (cron-driven)
│   ├── cleanup.php                               ← daily: expired attempts, temp uploads, old logs
│   ├── gen_question_sets.py                      ← Python generator for question_sets_seed.sql
│   └── lint_sql.sh                               ← sqlglot parse + paren-balance pre-commit hook
├── cron/
│   ├── weekly_question_update.sh                 ← wrapper invoked by cPanel Cron
│   ├── crm_sync.sh
│   └── cleanup.sh
├── storage/
│   ├── private/                                  ← BLOCKED from web (see §4.4)
│   │   ├── reports/                              ← generated PDF reports
│   │   ├── certificates/                         ← issued certificates
│   │   ├── audio/                                ← master copies of speaking recordings
│   │   └── exports/                              ← CSV/JSON exports for CRM
│   ├── logs/                                     ← app.log, audit.log, crm.log, cron.log
│   ├── cache/                                    ← view/route/permission cache
│   └── uploads/                                  ← quarantine bucket for virus-scan hook
├── docs/                                         ← this folder
├── dist/                                         ← build output: ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip
├── vendor/                                       ← Composer dependencies (not committed)
├── composer.json
├── composer.lock
├── .env.example                                  ← committed template (no real secrets)
├── .gitignore
├── .htaccess (project root)                      ← denies all if accessed outside public/
└── DEVELOPMENT-GUIDELINE.md                      ← this file
```

### 2.1 Where to edit (quick matrix)

| You want to change… | Edit these paths |
|---|---|
| Public landing page (hero, exams, pricing, FAQ) | `app/Views/public/landing.php`, `app/Controllers/PublicController.php`, `public/assets/css/public.css`, `public/assets/img/` |
| Exam catalog (32 exams, 5 categories) | `app/Views/public/exam-catalog.php`, `app/Services/ExamEngine.php::catalog()`, data sourced from `exam_types` + `exam_categories` |
| Student dashboard | `app/Views/student/dashboard.php`, `app/Controllers/StudentController.php::dashboard()` |
| Admin dashboard | `app/Views/admin/dashboard.php`, `app/Controllers/AdminController.php::dashboard()` |
| Examiner dashboard (writing + speaking queues) | `app/Views/examiner/*`, `app/Controllers/ExaminerController.php` |
| Ambassador dashboard | `app/Views/ambassador/*`, `app/Controllers/AmbassadorController.php` |
| Exam engine (setup, timer, autosave, submit) | `app/Controllers/AttemptController.php`, `app/Services/ExamEngine.php`, `public/assets/js/exam-engine.js` |
| Question bank (CRUD, types, tags, review) | `app/Controllers/QuestionBankController.php`, `app/Services/QuestionBankService.php`, `app/Views/admin/questions/*` |
| Scoring rules (band / scaled / percent / rubric) | `app/Services/ScoringRules.php`, scoring rule JSON stored per practice set in `exam_practice_sets.scoring_rule_json` |
| Free quota rules (3 ALO / 1 public) | `app/Services/FreeQuotaService.php`, `app/Controllers/AttemptController.php::start()`, settings `free_quota_alo`, `free_quota_public`, `free_quota_partner`, `free_quota_ambassador_referred` |
| CRM sync (two-way with ALO CRM) | `app/Services/CrmSyncService.php`, `app/Controllers/CrmController.php`, `scripts/crm_sync.php`, `exam_crm_sync_logs` |
| Upload logic (speaking audio, images, PDFs) | `app/Controllers/UploadController.php`, `app/Services/ProctorService.php`, `public/uploads/` (web-accessible, no PHP), `storage/private/audio/` (master copies) |
| Download logic (reports, certificates, exports) | `app/Controllers/DownloadController.php`, `storage/private/reports/`, signed-URL helper in `app/Helpers/signed_url.php` |
| Cron jobs (weekly update, CRM sync, cleanup) | `scripts/weekly_question_update.php`, `scripts/crm_sync.php`, `scripts/cleanup.php`, wrappers in `cron/*.sh`, registered in cPanel → Cron Jobs |
| Database schema | `database/install.sql` (full rebuild), `database/migrations/` (incremental), regenerate `question_sets_seed.sql` via `scripts/gen_question_sets.py` |
| Assets / images / brand | `public/assets/img/`, `public/assets/css/`, `public/assets/js/`, source design files kept outside repo |
| Routes (web + API) | `routes/web.php`, `routes/api.php`, cached in `config/routes.php` |
| Controllers | `app/Controllers/*.php` (one per resource; thin — business logic lives in `app/Services/`) |
| Views / templates | `app/Views/{public,student,admin,examiner,ambassador,emails,pdf}/` |
| Settings (feature flags, prices, disclaimers) | `exam_settings` table, edited via Admin → Settings UI; defaults seeded in `database/seed.sql` |
| Audit logging | `app/Services/AuditLogger.php` writes to `exam_audit_logs`; every mutating controller action calls it |
| Email templates (verify, welcome, report-ready, voucher-issued) | `app/Views/emails/*.php`, sent via `app/Services/Mailer.php` (SMTP creds in `english.env`) |
| PDF report (Smart Score Report) | `app/Views/pdf/score-report.php`, `app/Services/PdfReportService.php` (TCPDF or Dompdf) |

---

## 3. Coding Standards

1. **PHP 8.2+ features allowed:** readonly properties, enums, first-class callable syntax, named args. Disallowed: eval, `exec`, `shell_exec`, `system`, `passthru` (use `Symfony Process` via Composer if a subprocess is unavoidable).
2. **PDO, never `mysqli_*` directly.** All queries use prepared statements. The PDO instance is built once in `config/database.php` from `english.env` and injected via the service container.
3. **Controllers stay thin.** A controller method should: parse input → call a service → render a view. Business logic goes in `app/Services/`. Side-effects (DB writes, emails, CRM calls) happen in services, never in views.
4. **Views escape by default.** Use `e()` helper for output; never concatenate user input into HTML. No inline SQL in views.
5. **CSRF on every POST.** `CsrfMiddleware` injects a token; forms must include `<?= csrf_field() ?>`. AJAX calls read the token from `<meta name="csrf-token">`.
6. **RBAC on every portal route.** `RbacMiddleware` checks `exam_permissions` joined through `exam_roles` → `exam_user_roles`. The student, admin, examiner, and ambassador portals each have a default role; SUPER_ADMIN bypasses checks.
7. **Audit on every mutating action.** Controllers call `AuditLogger::log($actorId, $entityType, $entityId, $action, $before, $after)` before returning. Writes go to `exam_audit_logs`.
8. **Naming:** PascalCase classes, camelCase methods/variables, snake_case DB columns and table names, kebab-case URLs (`/student/practice-tests`).
9. **PSR-12 + PSR-4 autoloading.** Composer's PSR-4 mapping: `"ALO\\": "app/"`. Run `composer dump-autoload` after adding a class.
10. **No `var_dump`, no `echo` debug in production paths.** Use `storage/logs/app.log` via `app/Helpers/logger.php`.
11. **Type hints everywhere.** All method signatures declare parameter and return types. Strict types enabled at the top of every PHP file: `declare(strict_types=1);`.
12. **Tests:** PHPUnit in `tests/` (Unit + Feature). Minimum coverage targets: `FreeQuotaService` 100%, `ScoringRules` 90%, `AttemptController` 80%.

---

## 4. cPanel Deployment Rules

### 4.1 Runtime requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| PHP | 8.2 | 8.3 |
| MySQL | 8.0 | 8.0.x (latest patch) |
| PHP extensions | pdo_mysql, mbstring, openssl, gd, fileinfo, intl, zip, curl, exif | + imagick (PDF rendering) |
| PHP memory_limit | 256M | 512M |
| PHP max_execution_time | 120s | 180s (for PDF generation) |
| PHP upload_max_filesize | 25M | 50M (speaking audio) |
| PHP post_max_size | 25M | 50M |
| cPanel account | `aloeduca` | — |
| Add-on domain | `english.aloeducation.com` → `public/` | — |

### 4.2 Secrets handling

- The live `.env` lives at `/home/aloeduca/config/english.env` — **outside** the project's web root and **outside** Git.
- `config/database.php` and `config/app.php` read this file via `parse_ini_file()` and fall back to `getenv()`.
- The committed `.env.example` contains only keys with placeholder values.
- **Never** commit `.env`, `*.local.env`, or any file whose name ends in `.env` other than `.env.example`. The `.gitignore` blocks them.
- **Never** paste a real API key, SMTP password, or DB password into a commit message, an issue, a screenshot, or a Slack message. Use the cPanel "Files → File Manager" or SSH to edit `english.env` directly.
- If a secret is rotated, set the new value in `english.env`, restart the PHP-FPM process via cPanel "MultiPHP Manager", and verify with `curl https://english.aloeducation.com/health`.

### 4.3 HTTPS + security headers

`public/.htaccess` MUST enforce:

```apache
# 1) Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# 2) Strict Transport Security + security headers
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "geolocation=(), microphone=(self), camera=(self)"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self' https://crm.alo.com; frame-ancestors 'self'; base-uri 'self'; object-src 'none'"
```

The CSP allows `microphone=(self)` because speaking practice requires mic capture, and `media-src 'self' blob:` for the recorded audio preview.

### 4.4 Block `storage/private/` from the web

Apache config (project-root `.htaccess` AND a `<Directory>` block in cPanel's "Apache Handlers" if available):

```apache
# storage/private is NEVER served
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^storage/private/ - [F,L]
</IfModule>

# Disable directory listing globally
Options -Indexes
```

Plus a `.htaccess` inside `storage/private/` itself:

```apache
Require all denied
```

Downloads from `storage/private/` go exclusively through `DownloadController::serve()` which validates a signed URL (`?token=...`) with a 60-second TTL and an IP pin.

### 4.5 No PHP execution in `public/uploads/`

`public/uploads/.htaccess`:

```apache
php_flag engine off
RemoveHandler .php .phtml .pht .php3 .php4 .php5 .php7 .phps
AddType text/plain .php .phtml .pht .php3 .php4 .php5 .php7
Options -ExecCGI -Indexes
```

`UploadController` additionally:

1. validates `Content-Type` against `config/security.php['allowed_mime']`;
2. re-encodes images via `gd` (strips embedded payloads);
3. writes to `storage/uploads/quarantine/` first, then moves to `public/uploads/<subdir>/` only after the virus-scan hook returns clean;
4. stores the original master (for audio and PDFs) in `storage/private/` and only serves a transient copy via `public/uploads/`.

### 4.6 `Options -Indexes` everywhere

Every directory that does not contain an `index.php` or `index.html` MUST have `Options -Indexes` set either via `.htaccess` in that directory or via the global project-root `.htaccess`.

### 4.7 Permissions

| Path | Permission | Owner |
|---|---|---|
| `/home/aloeduca/config/english.env` | `600` | `aloeduca:aloeduca` |
| `/home/aloeduca/english.aloeducation.com/storage/private/` | `700` | `aloeduca` |
| `/home/aloeduca/english.aloeducation.com/storage/logs/` | `700` | `aloeduca` |
| `/home/aloeduca/english.aloeducation.com/public/uploads/` | `755` | `aloeduca` |
| All PHP files | `644` | `aloeduca` |
| All directories (other than storage) | `755` | `aloeduca` |
| `composer`, `php` CLI | system | — |

Never chmod to `777`. cPanel will reject it and the account may be flagged.

### 4.8 Database connection

- The MySQL user granted to the ALO ETP database has only `SELECT, INSERT, UPDATE, DELETE, INDEX, ALTER, CREATE TEMPORARY TABLES, LOCK TABLES`. `DROP` and `GRANT` are **not** granted; schema teardown happens via a separate `aloeduca_schema` user used only for installs.
- PDO is configured with `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION`, `PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC`, `PDO::ATTR_EMULATE_PREPARES => false`.
- All tables use `InnoDB` and `utf8mb4_unicode_ci`. `sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY'` is set at session start in `config/database.php`.

---

## 5. Build & Check Commands

Run these from the project root (`/home/z/my-project/cpanel-production/` during development; `/home/aloeduca/english.aloeducation.com/` after deployment).

### 5.1 Generate audit reports

```bash
php scripts/generate_audit_reports.php
```

Produces weekly compliance + usage PDFs in `storage/private/reports/audit/`. Required before any release tag — the auditor signs off on the report before the tag is pushed.

### 5.2 Lint every PHP file (excluding vendor)

```bash
find . -type f -name '*.php' -not -path './vendor/*' -print0 | xargs -0 -n 1 php -l
```

CI fails on any "No syntax errors detected" line missing. Use `xargs -0 -n 1` so each file gets its own `php -l` invocation and a parse error in one file does not hide errors in others.

### 5.3 Run PHPUnit

```bash
vendor/bin/phpunit --testdox
```

Targets: `FreeQuotaService` 100%, `ScoringRules` 90%, `AttemptController` 80%. CI fails below the floor.

### 5.4 Lint SQL files (pre-commit)

```bash
./scripts/lint_sql.sh
```

Wraps `sqlglot parse --dialect mysql` over `database/install.sql`, `database/seed.sql`, `database/question_sets_seed.sql` and checks paren balance. Fails on any unbalanced statement.

### 5.5 Re-generate practice-set seed (only when exam catalog changes)

```bash
python3 scripts/gen_question_sets.py
```

Emits `database/question_sets_seed.sql` (320 practice sets, 1,530 sections, 480 questions, 480 links). Re-run only when an exam is added or its section list changes — never as part of a normal release.

### 5.6 Build the production zip

```bash
zip -r dist/ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip . \
    -x './.git/*' \
    -x './.env' \
    -x './storage/private/*' \
    -x './storage/logs/*' \
    -x './storage/cache/*' \
    -x './storage/uploads/quarantine/*' \
    -x './tests/*' \
    -x './dist/*' \
    -x './node_modules/*' \
    -x './.vscode/*' \
    -x './.idea/*'
```

Exclusions:

- `.git/` — version history never ships.
- `.env` — secrets never ship; deployer restores `english.env` manually.
- `storage/private/`, `storage/logs/`, `storage/cache/`, `storage/uploads/quarantine/` — runtime data, must be re-created on the target.
- `tests/`, `dist/`, IDE folders — not needed at runtime.

The zip is uploaded to cPanel → File Manager → `english.aloeducation.com/` and extracted in place (see `docs/CPANEL_DEPLOYMENT_GUIDE.md`).

### 5.7 Composer install (production)

```bash
composer install --no-dev --optimize-autoloader --classmap-authoritative
```

Run after extracting the zip on the server. Dev dependencies (PHPUnit, etc.) are not installed.

### 5.8 Pre-release checklist (run all, in order)

```bash
# 1. SQL lint
./scripts/lint_sql.sh

# 2. PHP lint
find . -type f -name '*.php' -not -path './vendor/*' -print0 | xargs -0 -n 1 php -l

# 3. PHPUnit
vendor/bin/phpunit --testdox

# 4. Audit reports
php scripts/generate_audit_reports.php

# 5. Build zip
zip -r dist/ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip . \
    -x './.git/*' './.env' './storage/private/*' './storage/logs/*' './tests/*' './dist/*'
```

---

## 6. Exam Catalog — 32 Exams Across 5 Categories

Mirrors `exam_types` seeded in `database/install.sql`. Each exam carries a `style_label` of the form *"X-style practice test"* that is surfaced on every public card, landing page, attempt start screen, score report, and certificate.

### 6.1 English Proficiency (11)

| # | Type code | Name | Style label |
|---|---|---|---|
| 1 | `IELTS-ACAD` | IELTS Academic | IELTS-style academic practice test |
| 2 | `IELTS-GEN` | IELTS General Training | IELTS-style general training practice test |
| 3 | `IELTS-UKVI` | IELTS for UKVI | IELTS UKVI-style practice test |
| 4 | `PTE-ACAD` | PTE Academic | PTE-style academic practice test |
| 5 | `TOEFL-IBT` | TOEFL iBT | TOEFL iBT-style practice test |
| 6 | `DUOLINGO` | Duolingo English Test | Duolingo-style practice test |
| 7 | `OIETC` | OIETC | OIETC-style practice test |
| 8 | `OET` | Occupational English Test | OET-style practice test |
| 9 | `LANGCERT` | LanguageCert International ESOL | LanguageCert-style practice test |
| 10 | `LINGUASKILL` | Linguaskill (Bulats) | Linguaskill-style practice test |
| 11 | `ALO-PLACE` | ALO Placement Test | ALO placement-style practice test |

### 6.2 Study Abroad Entrance (6)

| # | Type code | Name | Style label |
|---|---|---|---|
| 12 | `SAT` | Digital SAT | SAT-style practice test |
| 13 | `ACT` | ACT | ACT-style practice test |
| 14 | `GRE` | GRE General Test | GRE-style practice test |
| 15 | `GMAT` | GMAT Focus Edition | GMAT-style practice test |
| 16 | `LSAT` | LSAT | LSAT-style practice test |
| 17 | `MCAT` | MCAT | MCAT-style practice test |

### 6.3 University Internal (5)

| # | Type code | Name | Style label |
|---|---|---|---|
| 18 | `ENG-PLACE` | English Placement | University English placement-style practice |
| 19 | `MATH-PLACE` | Math Placement | University math placement-style practice |
| 20 | `FOUNDATION` | Foundation Year Test | Foundation program-style practice test |
| 21 | `PRE-MASTER` | Pre-Master Test | Pre-masters program-style practice test |
| 22 | `SCHOLARSHIP` | Scholarship Test | University scholarship-style practice test |

### 6.4 Visa / Interview (5)

| # | Type code | Name | Style label |
|---|---|---|---|
| 23 | `UK-CRED` | UK Credibility Interview | UK credibility interview-style practice |
| 24 | `CAS` | CAS Interview | CAS interview-style practice |
| 25 | `VISA-INT` | Visa Interview | Visa interview-style practice |
| 26 | `VISA-SCHOLAR` | Scholarship Visa Interview | Scholarship visa interview-style practice |
| 27 | `ADMISSION` | Admission Interview | Admission interview-style practice |

### 6.5 ALO Internal (5)

| # | Type code | Name | Style label |
|---|---|---|---|
| 28 | `ALO-COUNSEL` | ALO Counselor Check | ALO counselor check practice |
| 29 | `ALO-READINESS` | ALO Student Readiness | ALO student readiness practice |
| 30 | `ALO-DIAG` | ALO English Diagnostic | ALO English diagnostic practice |
| 31 | `ALO-DOC` | ALO Document Readiness | ALO document readiness practice |
| 32 | `ALO-VISA-READY` | ALO Visa Readiness | ALO visa readiness practice |

---

## 7. Free Quota Rule (canonical)

| Setting key | Default | Who it applies to |
|---|---|---|
| `free_quota_alo` | `3` | Students whose `exam_students.alo_student_id` is non-null |
| `free_quota_public` | `1` | Students with no ALO link, no partner link, no ambassador referrer |
| `free_quota_partner` | `2` | Students flagged `is_partner_student = 1` |
| `free_quota_ambassador_referred` | `2` | Students whose `ambassador_id` is non-null |

- Quota is **shared across all 32 exams**. Taking an IELTS mock consumes one slot of the same pool that a GRE mock draws from.
- Quota is enforced **server-side** in `AttemptController::start()` → `FreeQuotaService::checkAndReserve()`. The client-side counter is decorative only.
- A `status = 'completed'` attempt decrements the quota; an `abandoned` or `expired` attempt is refunded by `cleanup.php` nightly.
- Once the free quota is exhausted, the student must redeem a **voucher** (issued by an ambassador or admin) or pay the per-attempt price (`exam_settings.paid_attempt_price_usd` = `9.00` USD by default).
- The free-quota rule is also surfaced in `/api/health` so that an external CRM or marketing dashboard can verify the platform is enforcing it.

---

## 8. Cron Jobs

Registered in cPanel → Cron Jobs. All wrappers live in `cron/` and are simple `cd && php` invocations so that path/environment drift on the server does not silently break a job.

| Schedule | Wrapper | Script | Purpose |
|---|---|---|---|
| `0 2 * * 1` (Mon 02:00) | `cron/weekly_question_update.sh` | `scripts/weekly_question_update.php` | Runs the 12-step weekly content pipeline (generate → review → approve → publish → CRM sync) |
| `0 * * * *` (every hour) | `cron/crm_sync.sh` | `scripts/crm_sync.php` | Two-way sync with ALO CRM (leads, attempts, vouchers, students) |
| `30 3 * * *` (daily 03:30) | `cron/cleanup.sh` | `scripts/cleanup.php` | Expire abandoned attempts (`attempt_expiry_hours`), purge temp uploads, rotate logs, refund unfulfilled quota slots |
| `0 4 * * 1` (Mon 04:00) | — | `scripts/generate_audit_reports.php` | Generate weekly audit PDFs in `storage/private/reports/audit/` |

Each job writes a row in `exam_cron_logs` (`started_at`, `finished_at`, `exit_code`, `output_summary`, `rows_affected`). Admin → Audit → Cron Logs lists them.

---

## 9. Production Checklist (run after every deploy)

Run all of these in order. **Do not announce "deployed" until every box is checked.**

- [ ] **DB connected.** `curl -s https://english.aloeducation.com/health | jq .database_connected` → `true`.
- [ ] **Tables installed.** `mysql -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='alo_english_test';"` → `44`.
- [ ] **Seed imported.** `SELECT COUNT(*) FROM exam_roles` → `11`; `SELECT COUNT(*) FROM exam_categories` → `5`; `SELECT COUNT(*) FROM exam_types` → `32`.
- [ ] **Question-set seed imported.** `SELECT COUNT(*) FROM exam_practice_sets` → `320` (96 published + 224 draft); `SELECT COUNT(*) FROM exam_questions` → `480` (sample originals).
- [ ] **Admin login protected.** Login as `admin@alo.com` with the real bcrypt-hashed password (set during deployment, NOT the placeholder in `seed.sql`). Verify MFA challenge if enabled.
- [ ] **Student quota working.** Register a fresh public student; take 1 IELTS mock (success); attempt a second (must be blocked with the quota-exhausted message); check `exam_free_quota.used_free_attempts = 1`.
- [ ] **ALO quota working.** Set `exam_students.alo_student_id` on the test account; verify the quota counter resets to 3 free.
- [ ] **Routes tested.** `/`, `/login`, `/register`, `/student`, `/admin`, `/examiner`, `/ambassador`, `/api/health`, `/api/lead` (POST) — all return expected status codes.
- [ ] **Private storage blocked.** `curl -I https://english.aloeducation.com/storage/private/reports/sample.pdf` → `403 Forbidden`.
- [ ] **Uploads have no PHP execution.** Upload a `test.php` via the speaking-recording endpoint; verify it is renamed to `test.php.txt` (or rejected) and that requesting it returns the file as `text/plain` (no execution).
- [ ] **HTTPS redirect.** `curl -I http://english.aloeducation.com/` → `301` to `https://`.
- [ ] **Security headers.** `curl -sI https://english.aloeducation.com/` includes `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy`.
- [ ] **Directory listing off.** `curl https://english.aloeducation.com/assets/` → `403` (no autoindex).
- [ ] **CRM sync not crashing.** Trigger `php scripts/crm_sync.php` manually; verify a row appears in `exam_crm_sync_logs` with `status = 'success'` (or `pending` if CRM is unreachable, but NOT `error`).
- [ ] **Weekly update cron configured.** `crontab -l | grep weekly_question_update` shows the Monday 02:00 entry; run the script manually with `--dry-run` and verify a row appears in `exam_weekly_updates`.
- [ ] **Audit log firing.** As admin, change a setting; verify a row appears in `exam_audit_logs`.
- [ ] **Disclaimers present.** Visit `/` and confirm the practice disclaimer is in the footer; start an attempt and confirm the disclaimer is on the start screen; submit and confirm the disclaimer is on the score report.
- [ ] **Practice-only wording.** Search the rendered HTML of `/` for "official exam" — must return ZERO matches (other than inside a disclaimer that says "not official").
- [ ] **Email verify works.** Register a new student; verify the verification email arrives and the link activates the account.
- [ ] **PDF report downloads.** Complete a mock; download the Smart Score Report PDF; open it; confirm the disclaimer is on page 1.
- [ ] **Composer autoloader optimized.** `composer dump-autoload --classmap-authoritative` ran after deploy; `vendor/composer/autoload_classmap.php` is up to date.
- [ ] **Cron logs writing.** Wait for the next hourly CRM cron; verify a row in `exam_cron_logs`.

Sign-off: the deploying engineer pastes the checklist output into the release ticket. A second engineer reviews and merges the ticket before the release is announced.

---

## 10. Git Workflow

1. `main` is always deployable. Direct pushes to `main` are blocked; only PRs merge.
2. Branch naming: `feat/<short-slug>`, `fix/<short-slug>`, `docs/<short-slug>`, `chore/<short-slug>`.
3. PR title format: `[<area>] <imperative summary>` — e.g. `[quota] refund abandoned attempts within 24h`.
4. Every PR MUST:
   - pass CI (PHP lint + PHPUnit + SQL lint);
   - include or update a test for the change;
   - bump `exam_settings.platform_version` if user-visible;
   - be reviewed by one engineer outside the author's team.
5. Secrets in a commit = immediate key rotation + revert + post-mortem.
6. Database schema changes go in `database/migrations/<YYYYMMDDHHMM>_<slug>.sql` AND in `database/install.sql` (so a fresh install reflects the same shape). The migration runs forward only; rollbacks are new migrations.

---

## 11. Compliance Wording — Quick Reference

| Use this | Do NOT use this |
|---|---|
| "X-style practice test" (per `exam_types.style_label`) | "official exam", "real exam questions" |
| "Practice estimate only" | "official score", "guaranteed score" |
| "Original exam-aligned practice" | "official exam content", "real exam content" |
| "Not official exam content" | (the positive form, "official exam content") |
| "No guarantee of real-exam repetition" | "common real-exam questions" |
| "ALO Practice Examiner" | "real IELTS examiner" |
| "Digital Practice Session" | "real exam sitting" |
| "Smart Score Report" | "official score report" |
| "ALO Evaluation System" | "official writing examiner" |
| "Practice Interview Coach" | "fake human teacher" |
| "Automated Practice Feedback" | "AI teacher that grades like a human" |
| "Estimated Score Engine" | "guaranteed score predictor" |

---

## 12. Related Documents

- `docs/EXAM_CONDUCT_GUIDE.md` — exam-by-exam conduct instructions, equipment guide, before/during/after workflow.
- `docs/QUESTION_BANK_GUIDE.md` — question types, difficulty, tags, originality, review workflow, versioning, import/export, duplicate detection.
- `docs/WEEKLY_UPDATE_GUIDE.md` — 12-step weekly content pipeline, admin settings, dashboard metrics.
- `docs/CPANEL_DEPLOYMENT_GUIDE.md` — step-by-step cPanel deployment, MySQL setup, cron registration, security verification.
- `docs/ADMIN_USER_GUIDE.md` — admin portal end-user guide (students, questions, vouchers, CRM, audit, reports, weekly approvals, settings).

---

## 13. Change Log

| Version | Date | Notes |
|---|---|---|
| 1.0.0 | 2025-01 | Initial guideline for cPanel production package release 1.0.0. |

End of `DEVELOPMENT-GUIDELINE.md`.
