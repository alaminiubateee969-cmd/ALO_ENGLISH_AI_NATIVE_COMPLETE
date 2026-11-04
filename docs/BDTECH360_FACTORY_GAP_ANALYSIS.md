# BDTECH360 Software Factory — gap analysis and acceptance plan

## Preserve and reuse

The implementation adds to the existing Next.js/Prisma application. It reuses authentication, user records, audit conventions, integration readiness, SQLite persistence/backups, agent approvals, and existing CRM/communication/exam features. No existing route, model, data, or service is removed.

## Factory boundary

The factory is a control plane, not a claim that every business module or deployment provider has already been built. Factory ADMIN/SUPER_ADMIN permissions manage factory metadata only. Customer records require explicit `FactoryMembership`; global roles receive no implicit tenant-data access.

## Delivery slices

1. **Control plane:** company registry, template/module versions, application configuration revisions, lifecycle events and engineering changes.
2. **Repeatable shared provisioning:** validated immutable template version + company configuration → isolated application/member/configuration records → real control-plane checks → staging → human activation.
3. **Isolation:** company-scoped contacts as the first reusable tenant-data module; all list/read/create/update operations require membership and company predicates.
4. **Releases:** dependency inventories, impact analysis, explicit release/rollback records and known-good template versions.
5. **Operations:** portable control-plane-only configuration/SQLite export with verified integrity and readback; integration readiness without secrets; audit and health based on persisted state. Customer/ALO records are excluded so backup cannot bypass tenant isolation.
6. **UI:** functional registry, libraries, company wizard, provisioning/deployment, release, integration, monitoring, backup, engineering and audit views.

## Explicit limitations

- `DEDICATED` provisioning records `BLOCKED` until an operator-supplied deployment adapter performs real infrastructure work. It never reports a fake live deployment.
- Built-in contacts demonstrate the isolation contract; the broader CRM/HR/finance/telephony catalogue is not represented as production-ready merely because a module definition can be created.
- Backup creation is real only when the SQLite backup and integrity check succeed. Restoration requires the documented isolated drill; the UI does not overwrite a live database.
- External provider connectivity and delivery use the existing readiness/adapters and remain unverified until actually tested.

## Acceptance mapping

- **A/H:** create/version one template; provision two differently configured applications; verify independent revisions and repeatability.
- **B:** shared company provisioning creates application/configuration/memberships and passes actual control-plane checks before approval.
- **C/G:** membership and role tests across list/read/write/report/file-style tenant operations; no global-role bypass; audit sensitive transitions.
- **D:** dependency impact query, staged release and known-good rollback.
- **E:** existing integration report distinguishes disabled providers from internal operation.
- **F:** backup hash/integrity plus isolated restore procedure.
- **UI/API:** statuses derive only from persisted lifecycle/deployment/health records.

Database-backed acceptance tests require a generated Prisma client and migrated disposable database. Static/unit checks are not substituted for unavailable integration results.
