# Security Audit

**Audit date:** 2026-10-10  
**Report status:** BLOCKED for production assurance  
**Scope:** Static source review and local pure tests only. No production database, secret, recording, or live host was accessed.

## Stronger controls present in source

- Passwords use `bcryptjs`; configured cost is clamped to 10–14, default 12 (`src/lib/auth.ts`).
- Session token verification uses HMAC-SHA256 and timing-safe comparison. Cookie is HTTP-only, SameSite=Lax, path `/`, and marked Secure in production; token expiry is 24 hours.
- Public registration forces `role: "STUDENT"`; it does not accept a role field. Passwords have a 12-character minimum.
- Attempt start/save/resume/submit and question retrieval call server-side auth and check ownership/frozen membership. Correct answer fields are omitted by the shared student question select. Listening transcripts are redacted.
- Payment GET is scoped to the current user; purchase POST returns 503 and performs no write.
- CRM role/scope helpers and pure tests exist. Partner dashboard reads use partner ownership and omit referred students' names, email, phone, notes, and application details.
- RAG ask input is now size-bounded and rate-limited in process memory. The public material list is limited to active/public records; material upload requires an authenticated admin role.
- Forgot-password was repaired in this branch: it no longer creates a reset token that cannot be delivered or logs a token. It returns 503 until verified email delivery is configured.
- Legacy synthetic sample question seeders are no longer in the default production seed chain and are guarded to require explicit opt-in, non-production mode, and a clearly named disposable test/sample SQLite target. Both core seed entry points now require `ADMIN_SEED_PASSWORD` to be supplied through a secret manager and never print generated credentials.
- `.env` is removed from the Git index in this working tree; `.env` and `.env.*` are ignored except `.env.example`. The local `.env` remains and was not read.

## Material findings and residual risk

### 1. Proxy does not enforce access control

`src/proxy.ts` adds security headers and returns `NextResponse.next()`. It does not authenticate, authorize, or redirect. The public route constants are an inventory/documentation source, not a guard. Security depends on every API handler enforcing its own auth/role/ownership; client-side page redirects are not a security boundary. The API inventory generator now labels the public list as “intended” and recognizes mixed GET/POST protection for `/api/rag/materials`.

**Action:** Keep route-level policy tests as the authoritative boundary; audit every handler, including newly added methods, with unauthenticated, wrong-role, wrong-owner, and cross-tenant cases.

### 2. Session revocation and MFA

The session is a stateless signed cookie. The schema has a `Session` model, but login does not create a revocable `Session` row; an obsolete comment claiming it did was corrected. A stolen token remains usable until expiry, account disablement, or signing-secret rotation. MFA fields/configuration, if present in schema, are not evidence of enforced MFA. Production `AUTH_SECRET` configuration was not inspected.

**Action:** Decide whether server-side session revocation and MFA are required; implement and test them before handling higher-risk records. Confirm a random secret of at least 32 characters via the hosting panel without printing it.

### 3. Rate limits are process-local and client IP is proxy-dependent

`src/lib/rate-limit.ts` stores counters in an in-memory Map. They reset on process restart and are not shared across instances. `getClientIp` trusts the first `X-Forwarded-For` value or `X-Real-IP`; no deployed proxy configuration was tested to prove these headers are overwritten by a trusted proxy. New RAG limits inherit these constraints.

**Action:** Configure trusted-proxy behavior and a shared rate limiter for multi-process/serverless deployments. Test spoofed forwarded headers, restart, and concurrent instances.

### 4. Security headers require live verification/hardening

The proxy sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and production-only HSTS/CSP. The CSP currently allows `unsafe-inline` and `unsafe-eval`, permits HTTPS images broadly, and does not include an `object-src 'none'` directive. No live response headers were inspected; Hostinger TLS/proxy behavior is unknown.

**Action:** Verify headers on staging, migrate to nonce/hash-based script/style policy where possible, restrict resource origins, add explicit object/base protections, and test Next.js compatibility.

### 5. CSRF, email verification, and identity proof

The session cookie uses SameSite=Lax, but no uniform CSRF token or origin-validation policy was verified across all mutating APIs. Registration does not verify email ownership. Quota role/identity checks do not establish ALO enrollment, phone ownership, government identity, or device uniqueness. No MFA/recovery delivery was tested.

**Action:** Define threat model and CSRF policy, verify email before relying on it for identity/quota, and implement only proportionate, privacy-reviewed identity checks.

### 6. Public surface and request/resource abuse

`/api/rag/ask` is public and can invoke a configured model; the new 10-per-15-minute limit is process-local and IP-derived. `getClientIp` trust needs hosting confirmation. Public lead capture also has an in-memory rate limit. The health route exposes basic database connection and active exam-type count. No production abuse or cost-limit test was run.

**Action:** Apply per-account/per-IP and provider spending controls, bound all request bodies, review public data returned by health/material/catalog endpoints, and use trusted proxy headers.

### 7. Password reset and secret history

The current forgot-password endpoint is safely blocked until email delivery exists. A previous source implementation generated a reset token and printed it to logs; the current branch removes that path. `reset-password` still consumes existing unexpired tokens, if any exist in an unqueried database.

`.env` was tracked before this change. The file contents were not read and Git history has not been rewritten. Any real credential ever committed must be treated as exposed and rotated by the operator.

**Action:** Rotate any historical real secrets. Review and expire outstanding reset tokens only after a safe, approved database procedure; do not inspect production contents in a report.

### 8. Recordings, provider data, and privacy

The transcription route validates Base64 syntax and caps decoded audio at 10 MB, then sends audio to the configured ASR provider. It says it does not persist the recording. No full capture-to-provider data-flow, retention, consent, deletion, encryption-at-rest, or provider contractual terms were verified. A transcript is not an acoustic score.

**Action:** Document consent, purpose, provider, data region/retention, access controls, deletion, and incident handling before live recording or AI processing.

### 9. Legacy illustrative UI data

Unused prototype components under `src/components/alo/portals.tsx`, `src/components/alo/student-portal.tsx`, and static `platform-data.ts`/`agent-data.ts` include illustrative students, scores, testimonials, agent counts, confidence buckets, review queues, and payment claims. Repository search found no imports of the portal exports into current App Router pages; the active home route is `src/app/page.tsx`, and active admin pages use API data. These fixtures must not be connected or presented as real records. The unused scripted chatbot was updated to disclose it is scripted and not make unsupported scoring/payment/CRM promises.

**Action:** Retire or keep these prototypes clearly isolated from production imports; add a CI check preventing demo data from entering routed pages.

## Verification status

Re-verified 2026-10-19 after the full audit and repair pass.

- **PASS:** `node scripts/check-schema-migrations.mjs` — 46 models, 8 migrations, 48 created tables, parity OK, and the question-type vocabulary check passes.
- **PASS:** `node scripts/generate-inventories.mjs --check` and `node scripts/generate-project-index.mjs --check` — no drift.
- **PASS:** `node scripts/check-manifest.mjs` — 318 source files scanned, 2 workflows checked, scripts and lockfiles consistent.
- **PASS:** `npx tsc --noEmit` exits 0 with no errors, and `npx eslint .` exits 0 with no findings.
- **PASS:** `bun test tests/` — **151 pass, 0 fail, 696 assertions across 14 files**, including the six pure CRM scope tests, the RBAC suite, the exam-attempt suite, and the 18 new AI-evaluation-layer tests.
- **PASS:** `npm run build` compiles successfully and produces a 91.6 MB standalone artifact; `node scripts/smoke-standalone.mjs` boots it and passes 8/8 checks.
- **PASS (live, against a seeded disposable database):** login -> start attempt -> submit -> attempt `SCORED` -> the evaluation agent produced a document for both the writing and the speaking section -> both persisted and read back through `GET /api/attempts/:id/evaluation`. A 114-probe API smoke produced 0 unexpected 5xx responses; the 20 x 401/403 are the authentication and authorization layer working.
- **PASS (model path):** with a local OpenAI-compatible provider standing in for a real credential, the evaluation agent produced `WRITING/groq` and `SPEAKING/groq` results, the prompt sent to the provider was captured and inspected, a criterion key invented by the model was dropped, and an answer that commented only on out-of-scope criteria was rejected in favour of the local rule engine. **No live provider credential was used.**
- **PASS:** `npm audit` reports 5 high advisories, 0 critical, 0 moderate, 0 low. All five are one dev-only root cause — `braces@3.0.3`, for which no fixed version has been published, reached through `eslint-config-next`. It does not ship to production.
- **NOT VERIFIED:** Production secrets, production headers, production database access isolation, email reset, MFA, deployed rate limits, privacy retention, the audio/recording lifecycle, browser rendering and accessibility, and penetration testing.
- **NOT VERIFIED:** The GitHub Actions runner is outside this sandbox's reach, so CI has not been observed on this branch.

No deployment, production data review, or secret inspection was performed. See `docs/PRODUCTION_DEPLOYMENT_REPORT.md` for the exact local execution results and release blockers, and `docs/AUDIT_REPORT_2026-10-19.md` for the full field-by-field audit.
