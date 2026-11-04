# BDTECH360 Software Factory Control Center

## Scope and ownership

`/factory` is an authenticated ADMIN/SUPER_ADMIN control plane for BDTECH360 company definitions. It is part of this repository and uses the existing application database and host storage. No external SaaS builder, template marketplace or hosted control plane is required.

The factory is **not automatically a finished business application generator**. A template/module record describes a reviewed implementation contract; it does not manufacture missing CRM, HR, finance, telephony or provider code. Ordinary differences belong in versioned configuration. New business behaviour, external infrastructure and unavailable providers remain engineering work tracked in the Engineering Workspace.

## Implemented surfaces

- Company registry with relationship, industry, application/member counts and lifecycle state.
- Private semantic-versioned template and module libraries. No seed/demo catalogue is inserted.
- Five-step company wizard: company → approved template → modules → deployment/retention/branding → review. Submission creates a DRAFT and immutable configuration revision only.
- Server-side validation, shared control-plane provisioning, persisted checks, staging, explicit activation note and audit.
- Dedicated model fails closed with a BLOCKED provisioning run and no live release.
- Staged upgrades require an operator-written impact assessment and rollback plan. Rollback selects a persisted SUPERSEDED release and records approval.
- Company contacts list/read/create/update APIs and a contacts administration dialog. Every operation requires explicit active company membership and includes the company predicate.
- Persisted provisioning, deployment, release, health, backup, engineering-change and audit views.
- Integration Hub reads the existing licence/readiness registry and environment-key configuration. CONFIGURED is not CONNECTED and no delivery/provider success is inferred.
- Portable control-plane-only SQLite backup with SHA-256, file permissions, integrity check and application/company readback.

## Security boundary

Factory operator permission and customer-data permission are separate:

1. `requireFactoryOperator()` protects control-plane metadata APIs.
2. `requireTenantAccess(companyId, write)` requires a `FactoryMembership` for the current user, including ADMIN and SUPER_ADMIN users.
3. VIEWER membership is read-only; COMPANY_ADMIN and OPERATOR may write. Membership also requires an ACTIVE company.
4. Contact reads and writes use both the authorized company ID and record ID; successful reads and writes create factory audit events. A client-provided tenant ID alone never grants access.
5. An initial company administrator must reference an existing active user. The creating factory operator is not added automatically.
6. Inline password/secret/token/private-key/credential-value fields are rejected recursively. Host secret references and provider adapters remain external to company configuration.

New tenant reports, files, jobs, searches and integrations must use this same membership + server-side company-scope contract. Those module types are not implemented merely because a module definition can be registered.

## Lifecycle

```text
DRAFT → VALIDATED → PROVISIONING → STAGING → human activation → LIVE
                                  ↘ TEST_FAILED
LIVE → staged upgrade → human activation → LIVE
LIVE/DEGRADED → approved known-good rollback → ROLLED_BACK
```

Shared provisioning verifies that the current configuration exactly matches its immutable revision, that the application read succeeds only inside its company scope, and that approved template metadata can be read back. It creates real control-plane, membership, release and staging records. `CONTROL_PLANE_READY` records only those checks, not runtime/uptime health. “LIVE” here means activated in the internal shared control plane; it is not evidence of an external host deployment, provider connectivity or synthetic health metric.

Dedicated provisioning and dedicated upgrades require a real reviewed infrastructure adapter, which is not currently configured. No DNS, VM, container, serverless or external application deployment is claimed.

## Backup and recovery boundary

A factory backup contains only the selected application's company/application metadata, template version/module links, configuration revisions, releases, deployments and approvals. It deliberately excludes `FactoryContact`, ALO users, exams, questions, attempts and all other tenant business data. This prevents backup privileges from bypassing customer-data isolation.

The backup writer creates a fresh portable SQLite image and JSON definition under the configured backup directory, applies mode `0600`, reopens the image, runs `PRAGMA integrity_check`, verifies the company/application definition and object count, then records SHA-256 and size. A VERIFIED record is written only after those checks pass.

This is verified **backup-image readback**, not a production restore. Restoration requires a reviewed version-specific importer into an isolated database, conflict/tenant checks, application acceptance and explicit authorization. The UI has no live restore or overwrite action. Customer/ALO database backup and recovery remain governed by the existing operations runbooks, not by this metadata export.

## Local/disposable verification

Static and focused checks:

```bash
npm run typecheck
npm run lint
node scripts/check-schema-migrations.mjs
npx --yes bun test tests/factory.test.ts
```

The A–H drill requires a generated Prisma client and a fully migrated **new disposable** database. Its path guard refuses non-`/tmp` or non-acceptance database names:

```bash
export DATABASE_URL=file:/tmp/bdtech360-factory-acceptance.db
export APP_DATA_DIR=/tmp/bdtech360-factory-acceptance-data
npx prisma migrate deploy
FACTORY_ACCEPTANCE=1 \
FACTORY_ACCEPTANCE_OUTPUT=/tmp/bdtech360-factory-acceptance.json \
npx --yes bun scripts/factory-acceptance.ts
```

Never point this drill at development or production. The script covers migration registration, two asset versions, reusable definitions, shared/dedicated provisioning, scoped contacts, activation/upgrade/rollback, scoped backup readback and audit events. Its output is disposable evidence only.

## Dependencies and licences

This slice adds no package or external service dependency. It uses the repository's existing Next.js, Prisma, authentication and integration registry, plus Node's built-in `node:sqlite` (Node 22+). Existing third-party integration entries retain their declared licence/copying policy and hosted API terms. Provider adapters stay in their existing integration boundaries. New dedicated-host or tenant-provider adapters require separate licence/terms and security review before enablement.

## Production change control

The additive migration is not applied automatically by this implementation. Backup the actual production database, verify a separate restore drill, inspect migration impact and obtain explicit approval before migration or deployment. Do not reset the database or run seeders. Existing ALO/CRM/agent/exam routes and data remain in place.
