# GLOBAL CI/CD (§88/§87/§121/§157) — 2026-09-18

## Current pipelines (this repo — VERIFIED from workflow files + run history)
### ci.yml — "CI" (push/PR to main|master)
checkout → bun install --frozen-lockfile → prisma generate → **lint** → **typecheck** →
**smoke tests** → build (fails on TS errors; in-memory DB) → artifact verify →
script `bash -n` validation → systemd-analyze + visudo checks → (main only) source
tar.gz artifact + sha256.
- Latest run on main `8121f03`: **FAILED at "Smoke tests"** (lint+typecheck PASS).
  Root cause output unavailable from API at audit time — reproduce with `bun test tests/`.
- Excludes from artifact: .env, *.db, node_modules, cpanel-production, tool-results… ✅

### deploy.yml — "Deploy ALO English to VPS" (push main + manual)
quality gates (same as CI) → checkout exact SHA → SSH via GitHub secrets →
`rsync -az --delete` (excluding .env, *.db, uploads, logs) to `$VPS_PATH` →
remote: bun install + prisma generate + build → stop ONLY pm2 `alo-english` →
start with PORT=3016 HOSTNAME=127.0.0.1 → wait for local 200 → `ss -lntp` check →
public HTTPS 200 check → summary prints SHA/port.
- Latest run on main: **FAILED at "Run tests"** (same test suite) → **deploy correctly
  blocked** (§121 working as intended) — BUT this means the currently-live site was NOT
  shipped by this pipeline → Git↔production SHA chain broken (S-02).

## Target chain (§88) — status per stage for this service
AI BUILDER ✅(local) → GIT ✅ → GITHUB ✅ → PR ✅(this audit) → CI ❌RED → SECURITY ⚠️
(no secret-scan/SAST/dep-audit/SBOM jobs yet — add gitleaks+audit+semgrep per §77/§78/§121)
→ REVIEW 🟡 → MERGE (blocked) → PROD GATE 🟡(unformalized) → VPS 🟡(secrets-based)
→ EXACT SHA ✅(echoed) → BUILD ✅ → HEALTH ✅(in-pipeline).

## Required CI additions (next change-set)
1. gitleaks (local + history on full clone) 2. `bun audit`/dependency gate 3. semgrep
(optional, policy baseline) 4. SBOM (syft or bun/cyclonedx) 5. environment protection
rule on production deploy (human approval §71/§122) 6. pin actions to SHAs (§87)
7. ssh known_hosts pinning (§39).
