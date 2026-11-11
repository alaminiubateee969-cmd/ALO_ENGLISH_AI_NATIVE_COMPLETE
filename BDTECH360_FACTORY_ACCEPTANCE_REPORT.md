# BDTECH360 Software Factory — acceptance evidence

**Date:** 2026-11-04  
**Branch:** `arena/37a5d16c-alo-english-ai-native-complete`  
**Overall status:** **IMPLEMENTATION PRESENT; END-TO-END ACCEPTANCE BLOCKED. NOT PRODUCTION-READY.**

No production migration, deployment, customer-data write, provider call or restore was performed. The results below distinguish executed checks from unexecuted database/API/browser acceptance.

## Executed gates

| Gate | Actual result | Evidence |
|---|---|---|
| TypeScript | **PASS** | `npm run typecheck`, zero errors |
| ESLint | **PASS** | `npm run lint`, zero errors |
| Schema/migration parity | **PASS** | 82 schema models, 16 migrations, 85 created tables; all model tables/scalar columns present; question vocabulary unchanged and valid |
| Generated source inventories/index | **PASS** | 82 model rows, 127 API routes, 49 pages; generated files match source |
| Factory focused tests | **PASS — 10/10** | Definition/domain/branding/retention validation, recursive secret rejection, semantic versions/acceptance criteria, lifecycle gates, tenant-scope code contract, dedicated fail-closed boundary, private route/no fake catalogue, real SQLite backup reopen/integrity/readback/wrong-company denial |
| Full repository tests | **PARTIAL — 704 PASS, 4 FAIL** | 708 tests across 47 files; the four failures are PrismaClient initialization in `agent-workforce`, `ai-teachers`, `exam-attempt`, and `rbac`, caused by the unavailable generated client |
| Production build | **BLOCKED** | `npm run build` stopped in prebuild: Prisma could not download `schema-engine` from `binaries.prisma.sh` because outbound TLS is unavailable |
| Generated-client/disposable DB acceptance | **BLOCKED** | Same Prisma engine download failure prevents a current generated client and migration-backed A–H execution |

## A–H acceptance matrix

| ID | Capability | Result | What is implemented / what remains unverified |
|---|---|---|---|
| **A** | Additive company registry, private versioned templates/modules and migration | **STATIC PASS / DB BLOCKED** | 18 additive models, migration and empty-by-default libraries compile and pass parity. Actual migration, CRUD and immutable-version DB behaviour await generated Prisma. |
| **B** | Configuration-driven company wizard and reusable definitions | **STATIC PASS / E2E BLOCKED** | Functional five-step UI and API create DRAFT company/application/configuration revision. Browser/API creation and two differently configured applications have not run against a database. |
| **C** | Repeatable shared provisioning and honest dedicated model | **UNIT/TYPE PASS / DB BLOCKED** | Real revision/company/template readback checks, staging records and activation gates are implemented. Dedicated writes BLOCKED and no release. Full lifecycle execution awaits the disposable drill. |
| **D** | Tenant isolation and customer administration | **FOCUSED PASS / DB BLOCKED** | Explicit membership has no global-role bypass; contacts list/read/create/update include company predicates; UI uses the same APIs. Actual cross-company API/session tests and future files/reports/jobs/search modules remain unverified or unimplemented. |
| **E** | Releases, impact, approval and known-good rollback | **STATIC PASS / DB BLOCKED** | Upgrades require written impact/rollback plans, independent staging and activation notes. Rollback requires a SUPERSEDED release. Actual v1→v2→v1 execution awaits Prisma. |
| **F** | Monitoring and integration readiness | **CONFIGURATION-ONLY PASS / PROVIDERS NOT TESTED** | Monitoring is persisted control-plane state, not invented metrics. Integration Hub reports existing environment readiness and licence metadata. No uptime, external health, email, webhook, call or delivery success is claimed. |
| **G** | Verified backup and recovery | **BACKUP-IMAGE UNIT PASS / APPLICATION+RESTORE BLOCKED** | A real temporary SQLite image passed integrity and scoped readback; wrong-company readback failed closed. Application-export execution and a reviewed isolated ORM import/restore drill remain blocked/unimplemented. Backups exclude tenant/ALO business tables. |
| **H** | Preserve ALO/CRM/agent/exam functionality and audit | **PARTIAL / FULL GATE BLOCKED** | Existing models/routes remain; factory additions are separate and 704 tests pass. Four Prisma-initialization failures plus blocked build prevent a clean preservation claim. Production counts/sessions/data were not accessed or changed. |

## Acceptance runner

`scripts/factory-acceptance.ts` is the executable disposable A–H drill. It refuses production-like paths and records actual PASS/FAIL output for migration registration, versioned assets, reusable definitions, shared/dedicated provisioning, scoped contacts, releases/rollback, backup readback and audit. It has **not** produced a successful run in this environment; do not treat its presence as acceptance evidence.

## Required before completion can be claimed

1. Make the pinned Prisma engines available through an approved cache/network path, generate the client and apply all migrations to a new disposable SQLite database.
2. Run `scripts/factory-acceptance.ts`; investigate every FAIL rather than editing evidence.
3. Exercise the actual wizard and APIs with authenticated ADMIN, explicit member, non-member and VIEWER sessions, including cross-company contacts and denial responses.
4. Add and execute an isolated portable-definition importer/recovery drill if recovery is required beyond backup readback.
5. Run the entire test suite and production build with zero failures; then perform approved staging browser acceptance.
6. Implement and verify dedicated infrastructure only if required. Keep it BLOCKED otherwise.
7. Production migration/deployment requires a separate verified production backup/restore drill and explicit user approval.

The earlier ALO recovery status remains unchanged and is documented in `PRODUCTION_RECOVERY_REPORT.md`; this factory work does not resolve those production blockers.
