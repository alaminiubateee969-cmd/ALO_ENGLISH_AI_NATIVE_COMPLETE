# Ecosystem inspection — 2026-09-18

> **ARCHIVED. Read [`../README.md`](../README.md) first.**
>
> This is an inspection-only audit of the ALO ecosystem taken on 2026-09-18
> against this repository at commit `8121f03`. It made no production changes.
> It describes infrastructure that has **since been retired** — a GitHub Actions
> workflow that SSHed and rsynced to a VPS, a Node process manager on port 3016,
> `server.aloeducation.com`, two conflicting VPS addresses — so treat every
> statement about deployment, ports and pipelines as historical.
>
> Production today is Hostinger, deployed automatically from `main`. See
> [`../../../HOSTINGER_DEPLOYMENT.md`](../../../HOSTINGER_DEPLOYMENT.md).

## Provenance

Recovered from the branches `arena/01a0b208-alo-english-ai-native-complete`
(commit `84aa386`, "audit: full ecosystem inspection — domain registry, global
maps, security findings (inspection mode)") and
`arena/01a0ee4c-alo-english-ai-native-complete`, both merged into `main` on
2026-10-08. Those branches share no common ancestor with `main` — see
[`../../BRANCH-CONSOLIDATION.md`](../../BRANCH-CONSOLIDATION.md) — so the
documents were carried across explicitly and placed here rather than in
`docs/` directly.

The audit covered nine root domains and roughly fifteen applications, of which
this repository is one. That is the other reason it is archived rather than
filed as current documentation: most of what it maps is not this project.

## Contents

| | |
| --- | --- |
| `GLOBAL-FINAL-AUDIT.md` | **Start here.** Totals, all 18 findings, 12 owner actions |
| `GLOBAL-SECURITY.md`, `GLOBAL-SECRETS-AND-KEYS.md`, `GLOBAL-AI-AGENT-SECURITY.md` | Security findings and secret handling |
| `GLOBAL-DOMAIN-MAP.md`, `GLOBAL-SUBDOMAIN-MAP.md`, `GLOBAL-DNS-MAP.md`, `GLOBAL-TLS-MAP.md` | Domain, DNS and certificate inventory |
| `DOMAIN-REGISTRY.yaml` | The machine-readable source the domain maps were generated from |
| `GLOBAL-ARCHITECTURE.md`, `GLOBAL-PORT-MAP.md`, `GLOBAL-PROCESS-MAP.md`, `GLOBAL-PROXY-MAP.md` | Runtime topology as observed on 2026-09-18 |
| `GLOBAL-CI-CD.md`, `GLOBAL-RELEASE-MANIFEST.md`, `GLOBAL-ROLLBACK.md`, `GLOBAL-BACKUP-AND-RECOVERY.md`, `GLOBAL-INCIDENT-RESPONSE.md` | Pipeline and operations — **describes the retired VPS deploy** |
| `GLOBAL-DATABASE-MAP.md`, `GLOBAL-ENVIRONMENT-VARIABLES.md`, `GLOBAL-CENTRAL-CONFIGURATION.md`, `GLOBAL-PERMISSION-MATRIX.md` | Data and configuration inventory |
| `GLOBAL-AI-AGENT-REGISTRY.md`, `GLOBAL-MCP-REGISTRY.md`, `GLOBAL-TOOL-REGISTRY.md`, `PROTECTED-SERVICES.md` | Agent, MCP and tool inventory |
| `GLOBAL-REPOSITORY-MAP.md` | Repository inventory across the ecosystem |
| `domains/english.aloeducation.com/` | The seven per-domain documents for this application specifically |

## Status of its findings as of 2026-10-08

The audit's two critical findings were both about deployment integrity, and both
are what the 2026-10-08 consolidation work addressed. Recorded here so the
archive answers the obvious question — "was any of this acted on?"

| ID | Finding | Status |
| --- | --- | --- |
| **S-01** | Committed SQLite database with password hashes and PII | **Partly closed.** `db/custom.db` is untracked (`d810121`) and `.gitignore` now covers it, so it no longer ships. It remains in git history; the audit's recommendation to purge it by rewriting history and to rotate the seeded passwords is **still open** and needs an owner decision, because it requires a force-push to `main`. |
| **S-02** | `main` red, live site of unknown provenance | **Closed.** The build panic is fixed (`bd83ef9`, ADR-0001), CI now reproduces the host's exact npm pipeline and boots the artifact (`279068b`), and `deploy.yml` records a GitHub deployment per release and probes the live health endpoint. |
| S-03 | Port story conflict (3016 vs 3000) | **Closed by retirement.** The VPS path is gone; production is `PORT=3000` on Hostinger. |
| S-04 | `mini-services/examiner-stream` ungoverned | **Open.** Still tracked, still not deployed by any pipeline. Decide: productionize or remove. |
| S-05 | `:81` transform proxy must never go public | Not applicable — sandbox-only, never deployed. |
| S-06 | Two conflicting VPS addresses in the docs | **Closed.** Both removed; `README.md` no longer names a VPS (`f999cff`). The four root guides that still disagreed about where production is — `DEPLOYMENT_GUIDE.md`, `CPANEL_DEPLOYMENT_GUIDE.md`, `VPS-DEPLOYMENT-GUIDE.md` (`115.187.18.239` + WHM :2087) and `SERVER-DEPLOYMENT-103.231.239.79.md` — are archived under [`../legacy-deployment-guides/`](../legacy-deployment-guides/). `HOSTINGER_DEPLOYMENT.md` is the single source of truth. |
| S-07 | Root-SSH instructions in documentation | **Closed.** Removed from `README.md` (`f999cff`). |
| S-08 | CI hardening gaps — action SHA pinning, no secret-scan / SAST / dependency-audit / SBOM gates | **Open.** Recommended next step; deliberately not bundled into the consolidation work, since a new gate that blocks PRs is its own decision. |
| S-09 | Foreign PHP application and release archives tracked in git | **Partly closed.** Archives, tarballs, scratch output and the sibling Next.js project are untracked (`d810121`). `cpanel-production/` is **still tracked deliberately**: `/api/deliverable` and `/api/deliverables` serve from it for `SUPER_ADMIN`. Its `dist/` and `logs/` are excluded, and `server-config/README.md` plus the API's own 404 message now say what it is. |
| S-10 | Public capability metadata exposure | **Open.** |
| S-11 | Live database drift (12 exam types observed vs 20 seeded) | **Partly closed.** `HOSTINGER_DEPLOYMENT.md` now states the exact first-deploy seed sequence and how to verify `examTypes` via `/api/health`. Reconciling the live database is an owner action. |

Of the twelve owner actions, items 2, 4 and 7 are closed or retired by the above.
Item 3 (rotate the seeded passwords, purge `db/custom.db` from history) is the
one that still needs an explicit owner decision.
