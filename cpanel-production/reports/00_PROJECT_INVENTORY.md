# ALO English Test Platform — Project Inventory

**Report ID:** 00_PROJECT_INVENTORY
**Audit date:** Build 1.0.0
**Author:** Task ID `REPORTS` (Production packaging agent)
**Source package:** `/home/z/my-project/cpanel-production/`

---

## 1. Project identity

| Field | Value |
|---|---|
| Project name | ALO English Test Platform |
| Short name | ALO ETP |
| Public platform name | ALO English Test Platform |
| Version | `1.0.0` (stored in `exam_settings.platform_version`) |
| Production domain | https://english.aloeducation.com |
| Production document root (web root) | `/home/aloeduca/english.aloeducation.com/public/` |
| Production application root | `/home/aloeduca/english.aloeducation.com/` |
| Private secrets file (outside web root) | `/home/aloeduca/config/english.env` |
| Private storage root | `/home/aloeduca/english.aloeducation.com/storage/private/` (blocked from web by `.htaccess`) |
| Final production zip (documented) | `dist/ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip` |
| Rollback archive | `dist/archive/` |

## 2. Purpose

ALO English Test Platform is a **practice and self-assessment** service operated by ALO Education. It lets students:

- Take mock / practice versions of **32 international and internal exams** across 5 categories.
- Receive a Smart Score Report with skill breakdowns, model answers, and explanations.
- Book follow-up counseling sessions with ALO advisors.
- Track long-term progress and redeem vouchers for paid attempts.
- Be referred into the platform by ambassadors and partner students.

The platform is **not** an official testing center. Every public surface carries the standard disclaimer: *"Practice exam only. Estimated score only. Not official exam result. No guarantee that questions will appear in real exam."*

## 3. Tech stack

| Layer | Technology |
|---|---|
| Server language | PHP 8.2+ (strict types declared in every file) |
| Database | MySQL 8.0 (InnoDB, utf8mb4_unicode_ci) |
| Data access | Vanilla PDO with prepared statements everywhere (no ORM) |
| Web server | Apache 2.4 (cPanel shared hosting) |
| Frontend | HTML5 / CSS3 / vanilla JavaScript (no JS framework lock-in) |
| Autoloading | Composer PSR-4 (`App\` namespace) |
| Cron | cPanel cron jobs calling PHP CLI scripts in `cron/` |
| External integrations | ALO CRM (two-way sync via API key), optional AI grading hook |
| Framework | None — custom 3-layer MVC router (Router / Controllers / Services / Core) |

No framework lock-in. No npm build step on the server. The cPanel package is fully self-contained.

## 4. Folder structure tree

```
cpanel-production/
├── .env.example
├── .htaccess
├── DEVELOPMENT-GUIDELINE.md
├── index.php
├── app/
│   ├── Controllers/          (8 PHP files)
│   ├── Core/                 (3 PHP files: Database, Response, Router)
│   ├── Middleware/           (5 PHP files)
│   ├── Models/               (empty dir reserved for future Eloquent-style models)
│   ├── Services/             (10 PHP files)
│   └── routes.php
├── config/                   (4 PHP files: app, database, exams, permissions)
├── cron/                     (6 PHP files)
├── database/                 (3 SQL files: install, seed, question_sets_seed)
├── dist/                     (production zip build target, empty in repo)
├── docs/                     (5 markdown docs)
├── logs/                     (runtime logs, gitignored)
├── public/                   (document root — assets, css, images, js)
│   ├── assets/
│   ├── css/
│   ├── images/
│   └── js/
├── reports/                  (8 production reports + this 9th route test report)
├── scripts/                  (5 PHP CLI + 1 Python generator)
├── storage/                  (private file storage, web-blocked)
│   ├── imports/
│   ├── private/              (NEVER web-served)
│   ├── recordings/
│   ├── reports/
│   └── submissions/
└── views/                    (server-rendered PHP templates)
    ├── admin/
    ├── ambassador/
    ├── examiner/
    ├── layouts/
    ├── public/
    └── student/
```

## 5. File counts per folder

| Folder | Files | Notes |
|---|---:|---|
| `.` (root) | 4 | `.env.example`, `.htaccess`, `DEVELOPMENT-GUIDELINE.md`, `index.php` |
| `app/Controllers/` | 8 | Admin, Ambassador, Auth, CRMIntegration, Examiner, MockTest, Public, Student |
| `app/Core/` | 3 | Database, Response, Router |
| `app/Middleware/` | 5 | Auth, CSRF, CrmApi, Permission, Role |
| `app/Models/` | 0 | reserved for future use |
| `app/Services/` | 10 | Audit, Auth, CRMIntegration, CSRF, Quota, RBAC, Scoring, TestEngine, Upload, Voucher |
| `app/` (routes.php) | 1 | single route table |
| `config/` | 4 | app, database, exams, permissions |
| `cron/` | 6 | _bootstrap, cleanup_expired_sessions, crm_sync, retry_failed_sync, send_pending_reports, weekly_question_update |
| `database/` | 3 | install.sql, seed.sql, question_sets_seed.sql |
| `dist/` | 0 | build target (zip produced here on release) |
| `docs/` | 5 | ADMIN_USER_GUIDE, CPANEL_DEPLOYMENT_GUIDE, EXAM_CONDUCT_GUIDE, QUESTION_BANK_GUIDE, WEEKLY_UPDATE_GUIDE |
| `logs/` | 0 | runtime only |
| `public/` (incl. subfolders) | 0 | static assets copied at deploy time from `src/` |
| `reports/` | 9 | this file + 8 audit reports (00–08) |
| `scripts/` | 6 | _cli_bootstrap, gen_question_sets.py, generate_audit_reports, install_database, reset_admin_password, verify_production |
| `storage/` (incl. subfolders) | 0 | runtime only |
| `views/` (incl. subfolders) | 0 | view templates rendered by controllers (templates shipped inside `views/`) |
| **TOTAL** | **55** | excludes `reports/` self-count: 55 + 9 = 64 once reports are written |

> **Note on PHP file count.** There are **43 PHP source files** in the cPanel package (8 controllers + 3 core + 5 middleware + 10 services + 1 routes + 4 config + 6 cron + 5 scripts + 1 index). The brief estimated 45; the actual shipped count is 43 PHP files. The 2-file delta comes from the platform shipping a single combined `routes.php` and a single `_cli_bootstrap.php` shared by all scripts.

## 6. Total lines of code

| Layer | Lines |
|---|---:|
| PHP source | 6,762 |
| SQL (install + seed + question_sets_seed) | 4,426 |
| Markdown docs + guideline | 3,558 |
| Python helper (`scripts/gen_question_sets.py`) | ~366 |
| **Total source LOC** | **~15,112** |

`install.sql` is 1,068 lines; `question_sets_seed.sql` is 2,905 lines.

## 7. Documentation (6 markdown files)

| # | File | Lines | Purpose |
|---|---|---:|---|
| 1 | `DEVELOPMENT-GUIDELINE.md` | 615 | Canonical engineering reference (identity, structure, conventions, compliance absolutes) |
| 2 | `docs/CPANEL_DEPLOYMENT_GUIDE.md` | 746 | Step-by-step cPanel upload, env, cron, smoke test, rollback |
| 3 | `docs/EXAM_CONDUCT_GUIDE.md` | 778 | Equipment, before/during/after workflow, per-exam reference, compliance wording |
| 4 | `docs/ADMIN_USER_GUIDE.md` | 566 | Day-to-day admin operations (questions, vouchers, quota, CRM, audit) |
| 5 | `docs/QUESTION_BANK_GUIDE.md` | 574 | Question lifecycle, types, weekly refresh, review workflow |
| 6 | `docs/WEEKLY_UPDATE_GUIDE.md` | 279 | Cron pipeline, settings, dashboard, versioning, rollback |

## 8. PHP files (43 total, listed)

### 8.1 Controllers (8)
1. `app/Controllers/AdminController.php`
2. `app/Controllers/AmbassadorController.php`
3. `app/Controllers/AuthController.php`
4. `app/Controllers/CRMIntegrationController.php`
5. `app/Controllers/ExaminerController.php`
6. `app/Controllers/MockTestController.php`
7. `app/Controllers/PublicController.php`
8. `app/Controllers/StudentController.php`

### 8.2 Core (3)
9. `app/Core/Database.php`
10. `app/Core/Response.php`
11. `app/Core/Router.php`

### 8.3 Middleware (5)
12. `app/Middleware/AuthMiddleware.php`
13. `app/Middleware/CSRFMiddleware.php`
14. `app/Middleware/CrmApiMiddleware.php`
15. `app/Middleware/PermissionMiddleware.php`
16. `app/Middleware/RoleMiddleware.php`

### 8.4 Services (10)
17. `app/Services/AuditService.php`
18. `app/Services/AuthService.php`
19. `app/Services/CRMIntegrationService.php`
20. `app/Services/CSRFService.php`
21. `app/Services/QuotaService.php`
22. `app/Services/RBACService.php`
23. `app/Services/ScoringService.php`
24. `app/Services/TestEngineService.php`
25. `app/Services/UploadService.php`
26. `app/Services/VoucherService.php`

### 8.5 Routing (1)
27. `app/routes.php`

### 8.6 Config (4)
28. `config/app.php`
29. `config/database.php`
30. `config/exams.php`
31. `config/permissions.php`

### 8.7 Cron (6)
32. `cron/_bootstrap.php`
33. `cron/cleanup_expired_sessions.php`
34. `cron/crm_sync.php`
35. `cron/retry_failed_sync.php`
36. `cron/send_pending_reports.php`
37. `cron/weekly_question_update.php`

### 8.8 Scripts (5 PHP + 1 Python)
38. `scripts/_cli_bootstrap.php`
39. `scripts/generate_audit_reports.php`
40. `scripts/install_database.php`
41. `scripts/reset_admin_password.php`
42. `scripts/verify_production.php`

### 8.9 Front controller (1)
43. `index.php`

## 9. SQL files (3)

| # | File | Lines | Purpose |
|---|---|---:|---|
| 1 | `database/install.sql` | 1,068 | Schema for all 44 tables (InnoDB, utf8mb4_unicode_ci), FKs, indexes, seed defaults |
| 2 | `database/seed.sql` | ~453 | Exam categories (5), exam types (32), sections, modules, question types, default roles + permissions, default admin user, default settings |
| 3 | `database/question_sets_seed.sql` | 2,905 | 320 practice sets + 1,530 set-section rows + 480 original placeholder questions + 480 question-link rows. Idempotent under `INSERT IGNORE`. |

## 10. Reports (9 — including this one)

| # | File | Purpose |
|---|---|---|
| 00 | `reports/00_PROJECT_INVENTORY.md` | This file — complete inventory |
| 01 | `reports/01_DATABASE_SCHEMA.md` | All 44 tables, columns, indexes, FKs |
| 02 | `reports/02_EXAM_CATALOG.md` | All 32 exams across 5 categories |
| 03 | `reports/03_QUESTION_SET_AUDIT.md` | 320 sets, 96 published, 224 draft, 1,530 sections, 480 questions |
| 04 | `reports/04_WEEKLY_UPDATE_WORKFLOW.md` | 12-step pipeline, cron, dashboard, versioning |
| 05 | `reports/05_EXAM_CONDUCT_GUIDE_AUDIT.md` | 778-line guide, 12-field template, 32 exams |
| 06 | `reports/06_SECURITY_AUDIT.md` | .htaccess, env, CSRF, auth, RBAC, audit, uploads, headers |
| 07 | `reports/07_ROUTE_TEST_REPORT.md` | All 114 routes, expected status codes |
| 08 | `reports/08_FINAL_PRODUCTION_STATUS.md` | Final 17-item QA checklist (A–Q) |

## 11. cPanel deployment paths (production)

| Item | Path |
|---|---|
| Account home | `/home/aloeduca/` |
| Application root | `/home/aloeduca/english.aloeducation.com/` |
| Public document root | `/home/aloeduca/english.aloeducation.com/public/` |
| Front controller | `/home/aloeduca/english.aloeducation.com/public/index.php` |
| Private secrets env file | `/home/aloeduca/config/english.env` |
| Private storage | `/home/aloeduca/english.aloeducation.com/storage/private/` |
| Application logs | `/home/aloeduca/english.aloeducation.com/storage/logs/app.log` |
| Final production zip (documented) | `dist/ALO_ENGLISH_TEST_PLATFORM_CPANEL_PRODUCTION.zip` |
| Rollback archive | `dist/archive/` |

The private env file (`/home/aloeduca/config/english.env`) lives **outside** the application directory and **outside** the web root — it is loaded by `config/database.php` via `getenv()` and is never web-served. Permissions `chmod 700 /home/aloeduca/config`.

## 12. Inventory summary

- **55 source files** shipped in the cPanel package (excluding the 9 reports written by this task).
- **43 PHP files**, **3 SQL files**, **6 markdown docs**, **1 Python generator**, **1 .htaccess**, **1 .env.example**.
- **~15,112 lines** of source code across PHP, SQL, MD and Python.
- **44 database tables** (InnoDB + utf8mb4_unicode_ci, 49 FKs, 150 indexes).
- **32 exam types** across 5 categories.
- **320 practice sets** (10 per exam × 32 exams).
- **114 route handlers** in `app/routes.php`.
- **6 cron jobs** (weekly update, CRM sync x2, session cleanup, pending reports, retry failed sync).
- **9 production reports** (this inventory + 8 audits).

---

**Inventory status:** COMPLETE.
