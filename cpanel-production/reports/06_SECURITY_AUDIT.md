# ALO English Test Platform — Security Audit

**Report ID:** 06_SECURITY_AUDIT
**Audit date:** Build 1.0.0
**Source files:** `.htaccess`, `.env.example`, `app/Middleware/*`, `app/Services/*`, `app/Core/Database.php`, `app/Core/Response.php`, `app/routes.php`, `DEVELOPMENT-GUIDELINE.md`

---

## 1. Secrets management

| Item | Implementation | Confirmed |
|---|---|---|
| Secrets file location | `/home/aloeduca/config/english.env` — **outside** both the web root and the application directory | ✅ |
| Permissions on the secrets directory | `chmod 700 /home/aloeduca/config` (documented in `docs/CPANEL_DEPLOYMENT_GUIDE.md` §3) | ✅ |
| Loading mechanism | `getenv()` calls inside `config/database.php` and `config/app.php` — no `$_ENV` direct access, no hard-coded secrets | ✅ |
| `.env.example` shipped (not `.env`) | Template only, no real values; every key has a placeholder | ✅ |
| `.env` blocked at the web layer | `.htaccess` `<FilesMatch>` rule denies any `^\.env$` or `^\.env\..*` request | ✅ |
| No secrets in source code | String audit on `app/`, `config/`, `cron/`, `scripts/` finds no API keys, no DB passwords, no SMTP credentials — all loaded from env at runtime | ✅ |
| CRM API key from env only | `CRM_API_KEY` env var consumed by `app/Middleware/CrmApiMiddleware.php`; constant-time comparison via `hash_equals` | ✅ |

## 2. Apache `.htaccess` hardening

The shipped `.htaccess` (7,126 bytes, 10 numbered sections) implements:

### 2.1 Basic hardening (§0)
- `Options -Indexes -MultiViews` — directory listing disabled.
- `ServerSignature Off` — Apache version hidden from error pages.
- `AddDefaultCharset UTF-8` — charset forced on every response.
- `IndexIgnore *` (mod_autoindex) — defense-in-depth against directory listing even if `Options` is overridden.

### 2.2 HTTPS + HSTS (§1)
- `RewriteCond %{HTTPS} !=on` + `RewriteCond %{HTTP:X-Forwarded-Proto} !=https` → `RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]` — every HTTP request is 301-redirected to HTTPS.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` header set on HTTPS responses (HSTS, 1 year, includeSubDomains, preload).

### 2.3 Security headers (§2)
| Header | Value |
|---|---|
| `X-Frame-Options` | `SAMEORIGIN` (clickjacking protection; also re-appended in §10 as belt-and-braces) |
| `X-Content-Type-Options` | `nosniff` (MIME sniffing disabled) |
| `X-XSS-Protection` | `1; mode=block` (legacy browser XSS filter) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(self), camera=(self), payment=(), usb=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Content-Security-Policy` | `default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'self'; img-src 'self' data:; media-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; connect-src 'self'; upgrade-insecure-requests` |
| `X-Powered-By` | unset (PHP version hidden) |
| `Server` | unset (Apache version hidden) |

### 2.4 Block sensitive files (§3)
`<FilesMatch>` denies requests matching: `^\.env$`, `^\.env\..*`, `composer.json`, `composer.lock`, `composer.phar`, `artisan`, `*.sql`, `*.bak`, `*.swp`, `*~`, `.gitignore`, `.gitattributes`, `.htpasswd`, `README.*`, `CHANGELOG.*`, `LICENSE.*`, `CONTRIBUTING.*`, dotfiles (`.git`, `.svn`, `.hg`, `.DS_Store`).

### 2.5 Block sensitive directories (§4)
- `mod_rewrite` rule returns 403 for any path under `storage/`, `storage/private`, `private`, `logs`, `database`, `app`, `config`, `cron`, `scripts`, `vendor`, `tests`, `reports`, `node_modules`.
- `mod_alias` `RedirectMatch 403` as a defense-in-depth fallback when `mod_rewrite` is not available.

### 2.6 Disable PHP execution inside uploads/storage (§5)
- `php_flag engine off` for `mod_php`, `mod_php7`, `mod_php8` — PHP execution disabled in upload/storage directories.
- `RewriteRule` returns 403 for any `.php`, `.phtml`, `.phps`, `.phar`, `.cgi`, `.pl`, `.py`, `.sh`, `.asp`, `.aspx`, `.jsp` file under `storage/` or `public/uploads/`.
- `<DirectoryMatch>` against `^.*/(storage/private|private|logs)/?$` denies ALL access to those directories.

### 2.7 Clean URL routing (§6)
- Existing files/dirs served as-is.
- All other requests routed to `index.php` (front controller).

### 2.8 Static-asset caching (§7) + Compression (§8) + Charset/MIME safety (§9)
- `mod_expires` sets per-MIME cache durations (CSS/JS 7 days, images 30 days, fonts 1 year, JSON 0 seconds).
- `mod_deflate` compresses text/JS/CSS/JSON/SVG/fonts.
- `AddType application/octet-stream .env .sql .bak` forces download (never render) for sensitive extensions.

### 2.10 Misc hardening (§10)
- HTTP method allow-list: `TRACE`, `TRACK`, `DELETE`, `CONNECT`, `PUT`, `PATCH` denied with 403 (only GET/POST/HEAD allowed; the app uses POST for state changes and GET for reads; DELETE/PUT/PATCH are not used by the platform).
- `X-Frame-Options: SAMEORIGIN` re-appended as belt-and-braces.

## 3. Authentication

| Item | Implementation | Confirmed |
|---|---|---|
| Password hashing | `password_hash($password, PASSWORD_BCRYPT, ['cost' => 12])` in `app/Services/AuthService.php` lines 87, 182 | ✅ |
| Password verification | `password_verify($password, $user['password_hash'])` with constant-time comparison (line 65) | ✅ |
| Password rehash on login | `password_needs_rehash()` check on every successful login (line 86) — auto-upgrades hashes when the cost parameter is raised | ✅ |
| Rate limiting / lockout | After **5 failed attempts in 15 minutes** the account is locked (`locked_until` column on `exam_users`, `failed_login_count` incremented); login returns "Too many failed attempts. Try again later." (line 62) | ✅ |
| Session regeneration on login | `session_regenerate_id(true)` called on every successful login (AuthService line 96, AuthController line 128, RBACService line 113) — prevents session fixation | ✅ |
| Account activation | Email-verified token + phone OTP required before any attempt; `status` stays `pending` until both complete | ✅ |
| Password reset | Token-based, single-use, time-limited (24h), CSRF-protected (`/password/reset/{token}` GET + POST) | ✅ |

## 4. CSRF protection

| Item | Implementation | Confirmed |
|---|---|---|
| Token generation | `sodium_bin2hex(random_bytes(32))` in `app/Services/CSRFService.php` — cryptographically secure | ✅ |
| Token storage | Session-scoped, with `issued_at` timestamp; rotated every `MAX_AGE_SECONDS` (default 1 hour) | ✅ |
| Token verification | `hash_equals()` constant-time comparison (`app/Services/CSRFService.php` line 39+) | ✅ |
| Middleware enforcement | `app/Middleware/CSRFMiddleware.php` runs on every POST/PUT/DELETE; **all state-changing routes in `routes.php` include the `csrf` middleware tag** (auth/login, auth/register, auth/logout, contact, password/reset, mock-test/start, mock-test/save-answer, mock-test/submit, student/messages, student/book-assessment, student/settings, admin/settings, admin/weekly-updates/run, examiner/reviews/{id}/submit, ambassador/create-referral, api/lead) | ✅ |
| Hidden field helper | `CSRFService::hiddenField()` emits `<input type="hidden" name="_csrf_token" value="...">` with `htmlspecialchars` escaping (line 64) | ✅ |

## 5. Authorization (RBAC)

| Item | Implementation | Confirmed |
|---|---|---|
| Role middleware | `app/Middleware/RoleMiddleware.php` — accepts a comma-separated role list (e.g., `role:ADMIN,SUPER_ADMIN,EXAM_MANAGER`) | ✅ |
| Permission middleware | `app/Middleware/PermissionMiddleware.php` — accepts dotted permission codes (e.g., `permission:english.questions.manage`) | ✅ |
| Permission catalogue | `config/permissions.php` defines every permission code; RBAC matrix maps roles → permissions | ✅ |
| RBAC service | `app/Services/RBACService.php` — caches user roles + permissions in session, exposes `hasRole()` / `hasPermission()` helpers | ✅ |
| Applied on every protected route | All `/student`, `/admin`, `/examiner`, `/ambassador` route groups have `auth` + role/permission middleware at the group level; sub-routes may add additional permission tags (e.g., `/admin/questions` requires `english.questions.manage`, `/admin/audit-logs` requires `english.audit.view`) | ✅ |
| Public routes (no auth) | `/`, `/login`, `/register`, `/tests`, `/mock-tests`, `/pricing`, `/ambassador`, `/contact`, `/privacy`, `/terms`, `/exam-disclaimer`, `/how-exams-work`, `/computer-based-exams`, exam landing pages, `/api/health`, `/api/quota`, `/api/lead` (POST with CSRF) | ✅ |

## 6. Audit logging

`app/Services/AuditService.php` writes an immutable row to `exam_audit_logs` on every privileged action. The service defines 28 named actions:

- **Auth:** `auth.login.success`, `auth.login.failed`, `auth.logout`, `auth.password_reset.request`, `auth.password_reset.done`, `auth.password.change`
- **Quota:** `quota.check`, `quota.consume`, `quota.adjust`
- **Attempt lifecycle:** `attempt.start`, `attempt.save`, `attempt.submit`, `attempt.autosubmit`
- **Vouchers:** `voucher.generate`, `voucher.redeem`
- **Question editorial:** `question.create`, `question.update`, `question.delete`, `question.publish`
- **Weekly update:** `weekly_update.run`
- **CRM:** `crm.sync`, `crm.push`
- **Settings & users:** `settings.update`, `user.create`, `user.update`, `user.suspend`
- **Files & data:** `file.upload`, `file.download`, `data.export`

Every audit row records: `actor_user_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `details_json`, `created_at`. The table is indexed on actor, entity, and created_at. The application has no UPDATE or DELETE path for `exam_audit_logs` — it is append-only.

## 7. Quota enforcement — tamper-proof, backend-only

`app/Services/QuotaService.php` is the **single source of truth** for the free-attempt quota rule:

- ALO students (verified via CRM): **3 free attempts** shared across ALL 32 exam types.
- Public students (no ALO link): **1 free attempt**.
- Partner students: 2 free attempts.
- Ambassador-referred students: 2 free attempts.

The service:

- Reads the student's quota row from `exam_free_quota` (UNIQUE on `email`).
- Uses `SELECT ... FOR UPDATE` inside a DB transaction — atomic decrement, no race conditions.
- Verifies quota **again on submit** (in case the row changed between start and submit).
- Logs every check to `exam_audit_logs` (`ACTION_QUOTA_CHECK`, `ACTION_QUOTA_CONSUME`, `ACTION_QUOTA_ADJUST`).
- Exposes `addQuota()` for admins to grant bonus quota — also audited.

**There is NO client-side override.** The student-facing `/api/quota` endpoint is read-only; the only writes happen inside `QuotaService::consumeFreeQuota()` which is invoked from `MockTestController::startAttempt()`.

## 8. SQL injection — prepared statements everywhere

- `app/Core/Database.php` exposes `one()`, `all()`, `scalar()`, `exists()`, `insert()`, `update()`, `delete()` helpers — every one uses `PDO::prepare()` + `execute($params)` with named placeholders (line 87–88).
- No `query()` or `exec()` call with string concatenation exists in the application code.
- All user input flows through bound parameters; the only string-interpolated SQL fragments are static column names and ORDER BY clauses validated against an allow-list.

## 9. XSS — output escaping

- `app/Core/Response.php` exposes an `e()` helper (line 108) which calls `htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8')`.
- All view templates use `e()` when rendering user-controlled data.
- `CSRFService::hiddenField()` escapes the token with `htmlspecialchars($token, ENT_QUOTES, 'UTF-8')`.
- Error pages (`Response::errorPage`) escape the message with `ENT_QUOTES`.
- The Content-Security-Policy header (§2.3) blocks inline scripts (`script-src 'self'`), making injected script execution difficult even if a template escaping bug were introduced.

## 10. File upload safety

- `app/Services/UploadService.php` validates uploads against:
  - **MIME type** allow-list (image/png, image/jpeg, image/webp, image/svg+xml, application/pdf, audio/mpeg, audio/wav, audio/webm, video/mp4).
  - **Extension** allow-list matched against the MIME list (no `.php`, `.phtml`, `.phar`, `.cgi`, `.pl`, `.py`, `.sh`, `.asp`, `.aspx`, `.jsp`).
  - **File size** limit (per-purpose, e.g., 5 MB for images, 25 MB for audio, 50 MB for video).
  - **Image dimension** validation (where applicable).
- Files are stored under `storage/private/{purpose}/` (web-blocked) — only the public-facing assets go to `public/uploads/`.
- `.htaccess` §5 disables PHP execution in `storage/` and `public/uploads/` (defense-in-depth).
- Every upload records a row in `exam_uploads` with the original filename, MIME, size, purpose, uploader, and timestamp; `ACTION_FILE_UPLOAD` audit event emitted.

## 11. Private storage protection

- `storage/private/` directory is **blocked from the web** by three independent layers:
  1. `mod_rewrite` `RewriteRule` returning 403 for `^storage/private/`.
  2. `mod_alias` `RedirectMatch 403` as a fallback.
  3. `<DirectoryMatch>` denying all access to `storage/private`, `private`, and `logs` directories.
- Production path `/home/aloeduca/english.aloeducation.com/storage/private/` is the only location where student audio recordings, submission files, and proctor logs are stored.
- The platform never serves a file from `storage/private/` directly — downloads go through a controller that checks RBAC, logs `ACTION_FILE_DOWNLOAD`, and streams the file via `readfile()`.

## 12. CRM API integration

| Item | Implementation |
|---|---|
| API key storage | `CRM_API_KEY` env var (loaded from `/home/aloeduca/config/english.env`); never written to the database, never logged |
| Authentication | `app/Middleware/CrmApiMiddleware.php` requires an `X-API-Key` header on every `/api/alo-crm/*` request; constant-time comparison via `hash_equals` |
| Routes protected | All 8 routes under the `/api/alo-crm` route group in `routes.php` (lines 188–197): `/health`, `/sync-student`, `/check-eligibility`, `/push-result`, `/push-voucher-usage`, `/push-feedback`, `/push-message`, `/referral-lead` |
| Outbound calls | `app/Services/CRMIntegrationService.php` makes outbound HTTPS calls to the ALO CRM base URL (also from env); retries up to 3× on failure with exponential backoff |
| Sync log | Every push/pull is recorded in `exam_crm_sync_logs` with `direction`, `entity_type`, `entity_id`, `crm_record_id`, `status` (`pending`,`success`,`failed`,`retry`), `attempt_count`, `last_error`, request/response payloads, `synced_at` |
| Cron retry | `cron/retry_failed_sync.php` re-attempts failed sync logs every 15 minutes |
| Audit | Every successful/failed sync emits `ACTION_CRM_SYNC` or `ACTION_CRM_PUSH` audit event |

## 13. Proctoring & integrity

`exam_proctor_logs` records browser-emitted events during an attempt:

- Tab-switch / window-blur (focus loss)
- Fullscreen exit
- Copy attempt, paste attempt
- Idle (no input for > N seconds)
- Network drop (RTT exceeds threshold or websocket disconnect)
- Browser refresh (handled gracefully via autosave resume)

Each event logs: `attempt_id`, `event_type`, `event_data_json`, `severity`, `occurred_at`. The Smart Score Report flags suspicious patterns to the student and (for paid attempts) to the examiner review queue. Proctor logs do **not** include webcam frames or screen captures — the platform does not record video.

## 14. Confirmations

| Item | Confirmed |
|---|---|
| `.env` outside web root at `/home/aloeduca/config/english.env` | ✅ |
| `.htaccess` blocks `.env`, `composer.*`, `*.sql`, `*.bak`, dotfiles | ✅ |
| `.htaccess` blocks `storage/private`, `private`, `logs`, `database`, `app`, `config`, `cron`, `scripts`, `vendor` directories | ✅ |
| `Options -Indexes` + `IndexIgnore *` (directory listing disabled) | ✅ |
| HTTPS 301 redirect + HSTS 1-year preload | ✅ |
| Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, COOP, CSP | ✅ |
| PHP execution disabled in `storage/` and `public/uploads/` | ✅ |
| CSRF on all state-changing requests (POST/PUT/DELETE) | ✅ |
| `password_hash` bcrypt cost=12 + `password_verify` + `password_needs_rehash` | ✅ |
| `session_regenerate_id(true)` on login | ✅ |
| Rate limiting: lockout after 5 failed attempts in 15 min | ✅ |
| RBAC (role + permission middleware) on every protected route | ✅ |
| Audit logging on every privileged action (28 named actions) | ✅ |
| Prepared statements (PDO) everywhere — no string-interpolated SQL with user input | ✅ |
| `htmlspecialchars` output escaping in views and helpers | ✅ |
| Upload MIME + extension + size validation | ✅ |
| Private storage protected by 3 independent layers | ✅ |
| CRM API key from env only; constant-time comparison | ✅ |
| QuotaService is backend-enforced, tamper-proof (atomic transaction + re-check on submit) | ✅ |
| No secrets in source code (verified by string audit) | ✅ |
| HTTP method allow-list (TRACE/TRACK/DELETE/CONNECT/PUT/PATCH denied) | ✅ |

---

**Security audit status:** COMPLETE. All 21 critical security controls in place and verified against source code.
