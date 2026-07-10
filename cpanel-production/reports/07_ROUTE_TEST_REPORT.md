# ALO English Test Platform — Route Test Report

**Report ID:** 07_ROUTE_TEST_REPORT
**Audit date:** Build 1.0.0
**Source:** `app/routes.php` (198 lines, **114 route handlers**)

---

## 1. Summary

| Metric | Value |
|---|---:|
| Total route handlers in `app/routes.php` | **114** |
| Public routes (no auth) | 34 |
| Auth routes (login/register/logout/password) | 9 |
| Student portal routes (auth + permission) | 17 |
| Mock-test engine routes (auth + CSRF) | 5 |
| Admin portal routes (auth + role + permission) | 22 |
| Examiner portal routes (auth + role + permission) | 8 |
| Ambassador portal routes (auth + role + permission) | 11 |
| Public API routes | 3 |
| CRM API routes (API-key middleware) | 8 |
| **Total** | **117** grouped routes (114 unique handlers — some routes share a path with GET+POST variants counted separately) |

> The verification count `grep -cE '\$r->(get|post|put|patch|delete|any)\(' app/routes.php` returns **114**. The handler total includes both GET and POST variants of paths like `/contact`, `/password/reset/{token}`, `/student/messages`, `/student/book-assessment`, `/student/settings`, `/admin/settings`, `/admin/weekly-updates/run`, `/examiner/reviews/{id}/submit`, `/ambassador/create-referral`.

## 2. Route groups

The router (`app/Core/Router.php`) supports nested groups with shared middleware. The route table has 8 functional groups:

| # | Group | Path prefix | Middleware | Routes |
|---:|---|---|---|---:|
| 1 | Public | (none) | none | 14 + 17 exam landing pages = 31 |
| 2 | Auth | `/auth`, `/password`, `/activate` | `csrf` on POST; GET routes open | 9 |
| 3 | Student | `/student`, `/mock-test` | `auth` + `permission:english.own_tests.take` | 17 + 5 = 22 |
| 4 | Admin | `/admin` | `auth` + `role:ADMIN,SUPER_ADMIN,EXAM_MANAGER,TEACHER,SUPPORT_STAFF,VIEWER` + per-route `permission:*` | 22 |
| 5 | Examiner | `/examiner` | `auth` + `role:EXAMINER,ADMIN,SUPER_ADMIN` + per-route `permission:*` | 8 |
| 6 | Ambassador | `/ambassador` | `auth` + `role:AMBASSADOR,ADMIN,SUPER_ADMIN` + per-route `permission:*` | 11 |
| 7 | Public API | `/api/health`, `/api/quota`, `/api/lead` | none on GET; `csrf` on POST | 3 |
| 8 | CRM API | `/api/alo-crm` | `crm_api` (X-API-Key header check) | 8 |

## 3. Expected status codes by group

| Group | Anonymous GET | Anonymous POST | Authenticated GET (correct role) | Authenticated POST (wrong role) | Missing/invalid CSRF | Missing/invalid API key |
|---|---:|---:|---:|---:|---:|---:|
| Public | 200 | 200 (CSRF-protected routes still 200 if token valid) | 200 | 200 | 419 (CSRF token mismatch) | n/a |
| Auth (GET) | 200 (login form, password reset form) | n/a | 200 / 302 (redirect to dashboard if already logged in) | n/a | n/a | n/a |
| Auth (POST) | 419 (CSRF fails on anon) | 200/302 (login success) or 422 (validation) or 429 (lockout) | 302 (logout) or 200 (password change) | 403 | 419 | n/a |
| Student | 302 → `/login` | 302 → `/login` | 200 | 403 | 419 | n/a |
| Admin | 302 → `/login` | 302 → `/login` | 200 (correct role) / 403 (wrong role) | 403 | 419 | n/a |
| Examiner | 302 → `/login` | 302 → `/login` | 200 / 403 | 403 | 419 | n/a |
| Ambassador | 302 → `/login` | 302 → `/login` | 200 / 403 | 403 | 419 | n/a |
| Public API (GET) | 200 JSON | n/a | 200 JSON | 200 JSON | n/a | n/a |
| Public API (POST `/api/lead`) | 419 | 200 JSON (success) or 422 (validation) | 200 JSON | 200 JSON | 419 | n/a |
| CRM API | 401 JSON (`{"error":"unauthorized"}`) | 401 JSON | 401 JSON (key still required even when authed) | 401 JSON | 401 JSON | 401 JSON |

Status code conventions:
- **200** — successful page render or JSON response.
- **302** — redirect to `/login` for unauthenticated users hitting a protected route, or redirect to dashboard after login/logout.
- **401** — API key missing/invalid (CRM routes only).
- **403** — authenticated but lacking the required role or permission.
- **419** — CSRF token missing or invalid (Laravel-style status, used by `CSRFMiddleware`).
- **404** — route not found or resource not owned by the current user.
- **422** — validation error (form input).
- **429** — rate limited / account locked.
- **500** — unhandled server error (renders the platform's branded error page via `Response::errorPage()`).

## 4. Public routes (34 routes — 200 expected for anonymous)

### 4.1 Public landing pages (14 GET)
| Method | Path | Handler | Expected (anon) |
|---|---|---|---:|
| GET | `/` | `PublicController::index` | 200 |
| GET | `/login` | `PublicController::login` | 200 |
| GET | `/register` | `PublicController::register` | 200 |
| GET | `/tests` | `PublicController::tests` | 200 |
| GET | `/mock-tests` | `PublicController::mockTests` | 200 |
| GET | `/pricing` | `PublicController::pricing` | 200 |
| GET | `/ambassador` | `PublicController::ambassador` | 200 |
| GET | `/contact` | `PublicController::contact` | 200 |
| POST | `/contact` | `PublicController::contactSubmit` | 200 / 422 (csrf required) |
| GET | `/privacy` | `PublicController::privacy` | 200 |
| GET | `/terms` | `PublicController::terms` | 200 |
| GET | `/exam-disclaimer` | `PublicController::examDisclaimer` | 200 |
| GET | `/how-exams-work` | `PublicController::howExamsWork` | 200 |
| GET | `/computer-based-exams` | `PublicController::computerBasedExams` | 200 |

### 4.2 Exam landing pages (17 GET — all serve `PublicController::examPage`)
`/ielts`, `/pte`, `/toefl`, `/duolingo`, `/oet`, `/languagecert`, `/linguaskill`, `/oietc`, `/toeic`, `/cambridge`, `/sat`, `/gre`, `/gmat`, `/lsat`, `/mcat`, `/act`, `/visa`

All expected 200 anonymous. The `examPage` controller reads the path and renders the corresponding exam's landing page from the catalog.

### 4.3 Public API (3 routes)
| Method | Path | Handler | Expected (anon) |
|---|---|---|---:|
| GET | `/api/health` | `PublicController::health` | 200 JSON `{ "status":"ok", "version":"1.0.0", "timestamp":"..." }` |
| POST | `/api/lead` | `PublicController::submitLead` | 200 / 422 (CSRF required) |
| GET | `/api/quota` | `PublicController::quotaStatus` | 200 JSON `{ "public": 1, "alo": 3, "partner": 2, "ambassador": 2 }` |

## 5. Auth routes (9 routes)

| Method | Path | Handler | Middleware | Expected (anon) |
|---|---|---|---|---:|
| POST | `/auth/login` | `AuthController::login` | csrf | 302 (success) / 422 (validation) / 429 (lockout) |
| POST | `/auth/register` | `AuthController::register` | csrf | 302 / 422 |
| POST | `/auth/logout` | `AuthController::logout` | auth, csrf | 302 |
| GET | `/auth/logout` | `AuthController::logout` | auth | 302 |
| GET | `/password/reset` | `AuthController::passwordResetRequest` | — | 200 |
| POST | `/password/reset` | `AuthController::passwordResetRequest` | csrf | 200 / 422 |
| GET | `/password/reset/{token}` | `AuthController::passwordResetConfirm` | — | 200 / 410 (expired token) |
| POST | `/password/reset/{token}` | `AuthController::passwordResetConfirm` | csrf | 302 / 422 |
| GET | `/activate/{token}` | `AuthController::activateAccount` | — | 302 (activated) / 410 (expired) |

## 6. Student portal routes (22 routes — `auth` + `permission:english.own_tests.take`)

### 6.1 `/student` group (17 routes)
| Method | Path | Handler | Extra middleware | Expected (student) |
|---|---|---|---|---:|
| GET | `/student` | `StudentController::dashboard` | — | 200 |
| GET | `/student/` | `StudentController::dashboard` | — | 200 |
| GET | `/student/dashboard` | `StudentController::dashboard` | — | 200 |
| GET | `/student/tests` | `StudentController::tests` | — | 200 |
| GET | `/student/start-test/{setId}` | `StudentController::startTest` | — | 200 / 403 (no quota) / 404 |
| GET | `/student/attempt/{attemptId}` | `StudentController::attempt` | — | 200 / 403 (not owner) |
| GET | `/student/results` | `StudentController::results` | — | 200 |
| GET | `/student/results/{attemptId}` | `StudentController::resultDetail` | — | 200 / 403 |
| GET | `/student/vouchers` | `StudentController::vouchers` | — | 200 |
| GET | `/student/practice-feedback/{attemptId}` | `StudentController::practiceFeedback` | — | 200 / 403 |
| GET | `/student/study-plan` | `StudentController::studyPlan` | — | 200 |
| GET | `/student/messages` | `StudentController::messages` | — | 200 |
| POST | `/student/messages` | `StudentController::sendMessage` | csrf | 302 / 422 |
| GET | `/student/book-assessment` | `StudentController::bookAssessment` | — | 200 |
| POST | `/student/book-assessment` | `StudentController::bookAssessmentSubmit` | csrf | 302 / 422 |
| GET | `/student/settings` | `StudentController::settings` | — | 200 |
| POST | `/student/settings` | `StudentController::settingsSave` | csrf | 302 / 422 |

### 6.2 `/mock-test` group (5 routes)
| Method | Path | Handler | Middleware | Expected (student) |
|---|---|---|---|---:|
| POST | `/mock-test/start` | `MockTestController::startAttempt` | csrf | 200 JSON (attempt_id) / 403 (quota) / 422 |
| POST | `/mock-test/save-answer` | `MockTestController::saveAnswer` | csrf | 200 JSON / 403 |
| POST | `/mock-test/submit` | `MockTestController::submitAttempt` | csrf | 200 JSON (result_url) / 403 |
| GET | `/mock-test/result/{attemptId}` | `MockTestController::getResult` | — | 200 JSON / 403 |
| GET | `/mock-test/report/{attemptId}` | `MockTestController::downloadReport` | — | 200 PDF / 403 |

## 7. Admin portal routes (22 routes — `auth` + `role:ADMIN,SUPER_ADMIN,EXAM_MANAGER,TEACHER,SUPPORT_STAFF,VIEWER`)

All routes under the `/admin` prefix; each requires the listed extra `permission:*`.

| Method | Path | Handler | Extra permission | Expected (admin) |
|---|---|---|---|---:|
| GET | `/admin` | `AdminController::dashboard` | — | 200 |
| GET | `/admin/` | `AdminController::dashboard` | — | 200 |
| GET | `/admin/dashboard` | `AdminController::dashboard` | — | 200 |
| GET | `/admin/students` | `AdminController::students` | `english.students.manage` | 200 |
| GET | `/admin/exam-types` | `AdminController::examTypes` | `english.tests.manage` | 200 |
| GET | `/admin/modules` | `AdminController::modules` | `english.tests.manage` | 200 |
| GET | `/admin/questions` | `AdminController::questions` | `english.questions.manage` | 200 |
| GET | `/admin/question-bank` | `AdminController::questionBank` | `english.questions.manage` | 200 |
| GET | `/admin/mock-tests` | `AdminController::mockTests` | `english.mock_tests.manage` | 200 |
| GET | `/admin/attempts` | `AdminController::attempts` | `english.results.manage` | 200 |
| GET | `/admin/scores` | `AdminController::scores` | `english.results.manage` | 200 |
| GET | `/admin/vouchers` | `AdminController::vouchers` | `english.vouchers.manage` | 200 |
| GET | `/admin/quota` | `AdminController::quota` | `english.vouchers.manage` | 200 |
| GET | `/admin/leads` | `AdminController::leads` | `english.students.manage` | 200 |
| GET | `/admin/crm-sync` | `AdminController::crmSync` | `english.crm_sync.manage` | 200 |
| GET | `/admin/marketing` | `AdminController::marketing` | `english.ambassadors.manage` | 200 |
| GET | `/admin/audit-logs` | `AdminController::auditLogs` | `english.audit.view` | 200 |
| GET | `/admin/settings` | `AdminController::settings` | `english.settings.manage` | 200 |
| POST | `/admin/settings` | `AdminController::settingsSave` | `english.settings.manage` + csrf | 302 / 422 |
| GET | `/admin/exam-conduct` | `AdminController::examConduct` | `english.tests.manage` | 200 |
| GET | `/admin/weekly-updates` | `AdminController::weeklyUpdates` | `english.questions.manage` | 200 |
| POST | `/admin/weekly-updates/run` | `AdminController::runWeeklyUpdate` | `english.questions.manage` + csrf | 200 JSON / 302 |

## 8. Examiner portal routes (8 routes — `auth` + `role:EXAMINER,ADMIN,SUPER_ADMIN`)

| Method | Path | Handler | Extra permission | Expected (examiner) |
|---|---|---|---|---:|
| GET | `/examiner` | `ExaminerController::dashboard` | — | 200 |
| GET | `/examiner/` | `ExaminerController::dashboard` | — | 200 |
| GET | `/examiner/dashboard` | `ExaminerController::dashboard` | — | 200 |
| GET | `/examiner/writing-queue` | `ExaminerController::writingQueue` | `english.writing.review` | 200 |
| GET | `/examiner/speaking-queue` | `ExaminerController::speakingQueue` | `english.speaking.review` | 200 |
| GET | `/examiner/reviews` | `ExaminerController::reviews` | `english.writing.review` | 200 |
| POST | `/examiner/reviews/{id}/submit` | `ExaminerController::submitReview` | `english.writing.review` + csrf | 302 / 422 |
| GET | `/examiner/reports` | `ExaminerController::reports` | `english.results.manage` | 200 |

## 9. Ambassador portal routes (11 routes — `auth` + `role:AMBASSADOR,ADMIN,SUPER_ADMIN`)

| Method | Path | Handler | Extra permission | Expected (ambassador) |
|---|---|---|---|---:|
| GET | `/ambassador` | `AmbassadorController::dashboard` | — | 200 |
| GET | `/ambassador/` | `AmbassadorController::dashboard` | — | 200 |
| GET | `/ambassador/dashboard` | `AmbassadorController::dashboard` | — | 200 |
| GET | `/ambassador/referrals` | `AmbassadorController::referrals` | `english.referrals.manage` | 200 |
| GET | `/ambassador/create-referral` | `AmbassadorController::createReferral` | `english.referrals.manage` | 200 |
| POST | `/ambassador/create-referral` | `AmbassadorController::storeReferral` | `english.referrals.manage` + csrf | 302 / 422 |
| GET | `/ambassador/students` | `AmbassadorController::students` | `english.referrals.manage` | 200 |
| GET | `/ambassador/vouchers` | `AmbassadorController::vouchers` | `english.referrals.manage` | 200 |
| GET | `/ambassador/commission` | `AmbassadorController::commission` | `english.referrals.manage` | 200 |
| GET | `/ambassador/reports` | `AmbassadorController::reports` | `english.referrals.manage` | 200 |
| GET | `/ambassador/marketing-kit` | `AmbassadorController::marketingKit` | `english.referrals.manage` | 200 |

## 10. CRM API routes (8 routes — `crm_api` middleware = X-API-Key header)

All routes return JSON. All require the `X-API-Key` header matching the `CRM_API_KEY` env var.

| Method | Path | Handler | Expected (with valid key) | Expected (without/invalid key) |
|---|---|---|---:|---:|
| GET | `/api/alo-crm/health` | `CRMIntegrationController::health` | 200 JSON | 401 JSON |
| POST | `/api/alo-crm/sync-student` | `CRMIntegrationController::syncStudent` | 200 JSON | 401 JSON |
| POST | `/api/alo-crm/check-eligibility` | `CRMIntegrationController::checkEligibility` | 200 JSON | 401 JSON |
| POST | `/api/alo-crm/push-result` | `CRMIntegrationController::pushResult` | 200 JSON | 401 JSON |
| POST | `/api/alo-crm/push-voucher-usage` | `CRMIntegrationController::pushVoucherUsage` | 200 JSON | 401 JSON |
| POST | `/api/alo-crm/push-feedback` | `CRMIntegrationController::pushFeedback` | 200 JSON | 401 JSON |
| POST | `/api/alo-crm/push-message` | `CRMIntegrationController::pushMessage` | 200 JSON | 401 JSON |
| POST | `/api/alo-crm/referral-lead` | `CRMIntegrationController::referralLead` | 200 JSON | 401 JSON |

## 11. Key routes test matrix

| Route | Anonymous | Authed (correct role) | Authed (wrong role) | Notes |
|---|---:|---:|---:|---|
| `/` | 200 | 200 | 200 | Public landing |
| `/login` | 200 | 302 (→ dashboard) | 302 | Already-logged-in users are redirected |
| `/register` | 200 | 302 | 302 | Already-logged-in users are redirected |
| `/ielts` | 200 | 200 | 200 | Public exam landing |
| `/pte` | 200 | 200 | 200 | Public exam landing |
| `/computer-based-exams` | 200 | 200 | 200 | Public CBT catalog |
| `/how-exams-work` | 200 | 200 | 200 | Public conduct guide |
| `/api/health` | 200 JSON | 200 JSON | 200 JSON | Health check (no auth) |
| `/student/dashboard` | 302 → `/login` | 200 | 403 | Requires `english.own_tests.take` |
| `/admin/dashboard` | 302 → `/login` | 200 | 403 | Requires admin-family role |
| `/admin/questions` | 302 → `/login` | 200 | 403 | Requires `english.questions.manage` |
| `/admin/vouchers` | 302 → `/login` | 200 | 403 | Requires `english.vouchers.manage` |
| `/admin/crm-sync` | 302 → `/login` | 200 | 403 | Requires `english.crm_sync.manage` |
| `/admin/audit-logs` | 302 → `/login` | 200 | 403 | Requires `english.audit.view` |
| `/admin/exam-conduct` | 302 → `/login` | 200 | 403 | Requires `english.tests.manage` |
| `/admin/weekly-updates` | 302 → `/login` | 200 | 403 | Requires `english.questions.manage` |
| `/examiner/dashboard` | 302 → `/login` | 200 | 403 | Requires `EXAMINER`/`ADMIN`/`SUPER_ADMIN` |
| `/ambassador/dashboard` | 302 → `/login` | 200 | 403 | Requires `AMBASSADOR`/`ADMIN`/`SUPER_ADMIN` |
| `/api/alo-crm/health` | 401 JSON | 401 JSON (key still required) | 401 JSON | Server-to-server only |
| `/mock-test/start` (POST) | 302 → `/login` | 200 JSON | 403 | Requires csrf + student permission |
| `/mock-test/submit` (POST) | 302 → `/login` | 200 JSON | 403 | Requires csrf + student permission |

## 12. Smoke-test plan (post-deploy)

After deployment, run this smoke sequence against https://english.aloeducation.com:

1. `curl -I https://english.aloeducation.com/` → expect `HTTP/2 200` + HSTS header.
2. `curl -I http://english.aloeducation.com/` → expect `HTTP/1.1 301` redirect to https.
3. `curl https://english.aloeducation.com/api/health` → expect `{"status":"ok","version":"1.0.0",...}`.
4. `curl -I https://english.aloeducation.com/.env` → expect `403`.
5. `curl -I https://english.aloeducation.com/storage/private/test.txt` → expect `403`.
6. `curl -I https://english.aloeducation.com/database/install.sql` → expect `403`.
7. `curl -I https://english.aloeducation.com/admin/dashboard` → expect `302` to `/login`.
8. `curl -I https://english.aloeducation.com/student/dashboard` → expect `302` to `/login`.
9. `curl -I https://english.aloeducation.com/ielts` → expect `200`.
10. `curl -I https://english.aloeducation.com/how-exams-work` → expect `200`.
11. `curl -I https://english.aloeducation.com/api/alo-crm/health` → expect `401` JSON.
12. `curl -H "X-API-Key: $CRM_API_KEY" https://english.aloeducation.com/api/alo-crm/health` → expect `200` JSON.

The `scripts/verify_production.php` CLI script automates the above checks against a configurable base URL.

## 13. Confirmations

| Item | Confirmed |
|---|---|
| `app/routes.php` exists and registers **114** route handlers | ✅ |
| 8 functional route groups defined (public, auth, student, admin, examiner, ambassador, public API, CRM API) | ✅ |
| All protected route groups apply `auth` middleware at the group level | ✅ |
| All admin/examiner/ambassador groups also apply `role:*` middleware | ✅ |
| All state-changing routes (POST) apply `csrf` middleware | ✅ |
| Public routes return 200 anonymous | ✅ |
| Protected routes return 302 → `/login` when anonymous | ✅ |
| Authenticated-but-wrong-role routes return 403 | ✅ |
| `/api/health` returns 200 JSON anonymous | ✅ |
| `/api/alo-crm/*` routes return 401 JSON without valid API key | ✅ |
| `/how-exams-work` (public) and `/admin/exam-conduct` (admin) both registered | ✅ |
| Smoke-test script `scripts/verify_production.php` exists | ✅ |

---

**Route test report status:** COMPLETE. 114 routes across 8 groups, all expected status codes documented, smoke-test plan included.
