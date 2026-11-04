# ALO English AI Platform — production recovery evidence report

**Date:** 2026-11-03  
**Requested production:** `https://english.alolabs.net`  
**Workspace branch:** `arena/37a5d16c-alo-english-ai-native-complete`  
**Base commit:** `78af8bb4315f6c6e27240857f08d0d94980b8103`  
**Status:** **NOT PRODUCTION-READY. Completion criteria are not demonstrated.**

## Scope and access boundary

The repository and current deployment records were audited before modification. The stated host checkout `/home/aloedu/projects/ALO_ENGLISH_AI_NATIVE_COMPLETE` is not mounted in this environment. Outbound access to the production origin and Prisma's binary host is blocked by sandbox policy. Consequently, no production database, account, service, schedule, email provider, or deployment was modified.

The active deployment configuration had targeted `english.aloeducation.com`; active runtime defaults, Hostinger records, public links, health-check workflow, and tests now target `english.alolabs.net`. Archived/legacy deployment documents were not treated as current configuration.

User-supplied production findings are 0 Questions, 0 PracticeSets, 0 ExamTypes, and 0 agent executions. **Those live counts could not be independently queried here and are not represented as measurements from this run.**

## PASS — demonstrated locally or in disposable databases

| Check | Evidence |
|---|---|
| Repository manifest | PASS: 435 source files scanned; scripts/lockfiles consistent |
| Generated indexes/inventories | PASS: project index and all four inventory checks match source (855 tracked files in generated manifest) |
| Prisma schema/migration parity | PASS: 64 models, 15 migrations, 67 migration-created tables inspected; 19 canonical question types consistent |
| TypeScript | PASS: `npm run typecheck`, exit 0 |
| ESLint | PASS: `npm run lint`, exit 0 |
| Script syntax / diff whitespace | PASS: all `scripts/*.mjs`, `bash -n scripts/backup.sh`, `git diff --check` |
| Source declaration identity | PASS: 176 declarations, 176 unique IDs |
| Conservative source structural audit | 131 structurally convertible; each rejected item has a per-item reason; audit correctly exits non-zero while 45 are rejected |
| Import dry-run | PASS: no rows created |
| Import staging | PASS: approved disposable fixture created inactive set; pre-write backup integrity `ok` |
| Import idempotency | PASS: second apply returned `NO_CHANGES`; one question remained |
| Duplicate/changed-ID protection | PASS: changed prompt under existing ID refused; existing content and admin hash unchanged |
| Import publication control | PASS: only explicit `--apply --publish` activated the set |
| Import rollback | PASS: only receipt-owned content removed; existing User=1, Session=1, Student=1 preserved |
| Safe exam-type initialization | PASS on disposable DB: dry-run, 22 inserted, rerun inserted 0; admin password `do-not-change` unchanged |
| Backup consistency | PASS: `VACUUM INTO`/SQLite backup plus copied-image integrity check; unsafe live-file `cp` fallback removed |
| Full disposable restore drill | PASS: 7 passed, 0 failed, 0 blocked; 64 tables restored and every schema model found |
| Focused exam/import/auth tests | PASS: 57/57 across grading, timers, selection, media gates, question UI/validation, speaking recorder cleanup, import safety, and worker token auth |
| Worker authentication | PASS: exact token accepted; missing, wrong, different-length, and unset-server-token cases fail closed; comparison uses `timingSafeEqual` |
| Agent registration/publication design | Code audit: 14 registered handlers; durable jobs/events/metrics/artifacts; ADMIN/SUPER_ADMIN or token worker auth; human `AgentApproval` precedes publication |
| Unconfigured password reset | PASS as fail-closed behavior: endpoint returns unavailable and issues no undisclosed token |
| `marketingos` source/services | No `marketingos` files or service definitions were changed by this work |

### Disposable import safety counts

The automated fixture began with User=1, Session=1, Student=1, ExamType=0, PracticeSet=0, Question=0. After staging: User=1, Session=1, Student=1, ExamType=1, PracticeSet=1, Question=1. After rollback: User=1, Session=1, Student=1, ExamType=0, PracticeSet=0, Question=0. This was synthetic test plumbing in a temporary database, not production content or an exam result.

## FAIL — actual failed checks or functional gaps

| Check | Evidence |
|---|---|
| Complete test suite | **694 passed, 4 failed, 4 module errors** out of 698. The four database-backed modules could not instantiate the ungenerated Prisma client. These are not counted as passes. |
| Source content release gate | `content:audit` exits 1: 45 of 176 declarations are structurally rejected. Categories overlap: 21 unsupported/incompatible scoring shapes, 23 missing verified audio, 6 duplicate normalized prompts. |
| Provenance release gate | `npm run content:provenance` fails: no real `prisma/question-provenance.json`; no bank is proven publishable. |
| Local content validation | `npm run content:validate` exits 2 because no local production `DATABASE_URL` is configured. The reported production empty-bank failure could not be rerun live. |
| Scored speaking workflow | The practice-exam UI asks for a typed transcript. Recording exists in separate live speaking practice, but an end-to-end recorded speaking response within a scored practice attempt is not demonstrated. |
| Production activation | No reviewed original bank is available to publish; zero source items are currently publishable under the new gate. |

## BLOCKED — requires production-host access, credentials, evidence, or external delivery

| Requirement | Blocker / required evidence |
|---|---|
| Actual deployed commit | Production host and health response unavailable. Local base commit is not deployment evidence. |
| Live database connection and exact file | Host environment unavailable; absolute `DATABASE_URL`, migration status, and resolved runtime path must be checked on host. |
| Live record counts and data preservation | No production DB access. Before/after counts for users, Super Admin, sessions, students, attempts, scores, and agent records remain unmeasured. |
| Production backup before writes | No production file access. No production backup was created; no production writes were attempted. The disposable restore drill is not a production backup. |
| Originality and legal publication rights | Source header is an assertion only. Independent originality review and rights evidence are absent for all 176. |
| Named human question/format/key review | No per-question approval record or valid provenance manifest. |
| Appropriate practice-set creation in production | Requires approved content and host backup/dry-run; not performed. |
| Production agent executions | No live DB/API access. The 14-agent runtime was code-audited, not activated or executed in production. |
| Authenticated scheduled worker | Token/cron host configuration unavailable. A cron template is supplied but not installed; no schedule is claimed. |
| Production monitoring and approval workflow | Requires authenticated live job execution plus `AgentJob`, event, metric, and approval records. |
| End-to-end production exam workflow | Registration, login, selection, timer, audio playback, speaking, writing, submission, grading, persistence, result reload, and analytics require a live reviewed bank and learner smoke account. Not demonstrated. |
| Password-reset email delivery | No SMTP provider or successful mailbox test. Delivery remains unavailable; no delivery claim is made. |
| Production build | `npm run build` stops in prebuild because `binaries.prisma.sh` is unreachable from this sandbox. Build/artifact smoke is not a pass. |
| Production HTTPS smoke | `curl https://english.alolabs.net/api/health` fails at TLS/socket access under sandbox network policy; no application health conclusion can be drawn. |
| Live `marketingos` and unrelated services | Host process panel unavailable. They were not touched, but live preservation cannot be certified. |

## Implemented recovery controls

- `scripts/audit-source-questions.mjs`: audits all source declarations, conservative source-to-canonical conversion, per-item eligibility, duplicate IDs/prompts, key/scoring shape, and listening evidence.
- `scripts/import-question-bank.mjs`: reviewed-bundle-only import; default dry-run; inactive staging; explicit publication; transactional all-or-nothing writes; stable-ID and normalized-prompt duplicate detection; verified pre-write backup; scoped rollback receipts; answer keys excluded from logs.
- `scripts/initialize-exam-types.mjs`: inserts only missing exam metadata and never requires or changes administrator credentials.
- `scripts/backup.sh`: consistent SQLite backup and integrity verification without unsafe live-copy fallback.
- `src/lib/agents/worker-auth.ts`: constant-time worker-token verification shared by worker GET/POST.
- `server-config/alo-english-agent-worker.cron`: host-specific, non-secret schedule template with overlap protection.
- `docs/PRODUCTION_RECOVERY_RUNBOOK.md`: exact operator procedure, bundle schema, validation, rollback, agent, email, and smoke-test requirements.

## Next authorized production sequence

1. On the production host, verify the deployed commit, absolute persistent database path, migration status, and all live counts.
2. Create a production backup and obtain a passing restore drill **before any write**.
3. Obtain named human originality, format, answer-key, and media review plus real provenance evidence. Do not convert the source header into a manifest automatically.
4. Dry-run and stage only approved content; validate it, run the complete test/build suite with Prisma engines available, then explicitly publish.
5. Configure and test authenticated worker execution before installing the schedule; verify durable execution and approval records.
6. Run real learner and admin smoke tests on `english.alolabs.net`, verify result persistence and analytics, test reset email to an operator-controlled mailbox, and confirm `marketingos`/other services remain healthy.

Until those steps produce evidence, students cannot be said to have real reviewed production exams end to end, the agent workflow cannot be called active, and production data preservation cannot be certified.
