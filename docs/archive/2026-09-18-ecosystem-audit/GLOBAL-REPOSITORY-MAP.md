# GLOBAL REPOSITORY MAP (§18/§19/§20) — 2026-09-18

## Repositories discovered
| Repo | Role | Verified facts |
|---|---|---|
| `alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE` | english.aloeducation.com app | remote VERIFIED; local HEAD `8121f03` == origin/main `8121f03` (VERIFIED via ls-remote); shallow clone (history truncated in sandbox); default branch main |
| every other domain in the registry | **NO repository discovered** | Owner must map each to its repo (OWNER ACTION REQUIRED) |

## Git state of this checkout (§20 — full inventory)
- Branch: `arena/01a0b208-alo-english-ai-native-complete` (work branch; main untouched)
- `git status`: clean before this audit's doc additions
- History: grafted/shallow — full history audit (`git log --all`, gitleaks on history)
  must be re-run on a FULL clone. NOT VERIFIED beyond depth-1.
- Uncommitted work destroyed: NONE. Force-push: NONE. Reset: NONE. (§20 honored)

## Repo hygiene findings (must fix — no destructive action taken)
1. `.gitignore` lists `cpanel-production/`, `english-aloeducation/`, `tool-results/`,
   `worklog.md`, `FINAL-PRODUCTION-PACKAGE.zip`, `*.tar.gz`, `*.db` as excluded — but all
   are ALREADY TRACKED (gitignore has no effect on tracked files). 677/677 files tracked.
2. Tracked artifacts that should not be in Git:
   - `db/custom.db` — **SQLite with 7 users (bcrypt hashes), emails, 1 session row,
     29 audit logs, RBAC tables** → PII + credential-material in Git. HIGH.
   - `FINAL-PRODUCTION-PACKAGE.zip` (3.3 MB), `english-aloeducation-web-crm-production.tar.gz`,
     `cpanel-production/dist/*.zip` (2×) — build/source archives in Git.
   - `.zscripts/dev.pid` — stale PID file.
   - `worklog.md` (242 KB agent log) + `tool-results/` (35 files) — AI-session residue.
3. `cpanel-production/` = an entire second (PHP) implementation of an ALO system tracked in
   this Node repo, including its own SQL seeds — ownership/classification review needed.

## Branch/CI mapping
- `main` → CI (lint/typecheck/smoke-tests/artifact) + Deploy (on push) — **both RED at 8121f03**
  (see docs/GLOBAL-CI-CD.md). Deploy therefore currently CANNOT ship main through Git.
