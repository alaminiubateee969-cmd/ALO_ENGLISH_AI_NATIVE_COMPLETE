# Legacy deployment guides — archived

> **ARCHIVED. None of these describe how this project is deployed.**
>
> Production is Hostinger, deployed automatically from `main`. The only current
> guide is [`../../../HOSTINGER_DEPLOYMENT.md`](../../../HOSTINGER_DEPLOYMENT.md).

## Why these are here

Until 2026-10-08 the repository root carried **six** deployment documents
describing **four different production targets** for the **same domain**,
`english.aloeducation.com`:

| Document | Claimed production target | Status |
| --- | --- | --- |
| `HOSTINGER_DEPLOYMENT.md` | Hostinger Node.js Web App, automatic Git deploy from `main` | **Current — the real one** |
| `DEPLOYMENT.md` | Ubuntu 24.04 + Bun + Caddy + systemd on a VPS you manage | Kept at the root, now headed by a warning that it is the *optional* self-managed path |
| `DEPLOYMENT_GUIDE.md` | Ubuntu 24.04 + Bun + Caddy + systemd, condensed | Archived here |
| `VPS-DEPLOYMENT-GUIDE.md` | VPS `115.187.18.239` + WHM on port 2087 | Archived here |
| `SERVER-DEPLOYMENT-103.231.239.79.md` | Server `103.231.239.79` | Archived here |
| `CPANEL_DEPLOYMENT_GUIDE.md` | cPanel shared hosting, `public_html/` | Archived here |

Two of those name a different server IP for the same domain. A third instructs
you to upload source through the cPanel File Manager. Anyone deploying from the
repository root had to guess which document was true, and the guess determined
whether the site came up at all.

The 2026-09-18 ecosystem audit recorded this as finding **S-06**, "two
conflicting VPS IPs", and **S-03**, "port story conflict". See
[`../2026-09-18-ecosystem-audit/README.md`](../2026-09-18-ecosystem-audit/README.md).

## What is in each file

- **`DEPLOYMENT_GUIDE.md`** — a condensed duplicate of `DEPLOYMENT.md`: the same
  Ubuntu/Bun/Caddy/systemd architecture in fewer words, so the two could (and
  did) drift apart.
- **`VPS-DEPLOYMENT-GUIDE.md`** — DNS zone records, WHM setup and a
  Node.js-app walkthrough for `115.187.18.239`, the address the retired GitHub
  Actions SSH deployment targeted. That workflow no longer exists, and
  `scripts/check-manifest.mjs` now fails CI if any workflow reintroduces it.
- **`SERVER-DEPLOYMENT-103.231.239.79.md`** — the same class of guide for a
  *second* server address. Kept because it records that a second host was in
  play, which is the point of the conflict.
- **`CPANEL_DEPLOYMENT_GUIDE.md`** — deploying the standalone Next.js build into
  `public_html/` on cPanel shared hosting. This does not work: the artifact is a
  long-running Node server that needs a supervised process and a writable
  database path outside the document root, neither of which a cPanel document
  root provides. The separate `cpanel-production/` directory is a legacy PHP
  application, not this one; `/api/deliverable` and `/api/deliverables` serve
  its files to `SUPER_ADMIN` and nothing else reads it.

## If you are trying to deploy

Read [`../../../HOSTINGER_DEPLOYMENT.md`](../../../HOSTINGER_DEPLOYMENT.md).

If you deliberately want to run this on infrastructure you control yourself,
read [`../../../DEPLOYMENT.md`](../../../DEPLOYMENT.md) — and note the two rules
that apply to every deployment of the standalone artifact, because
`.next/standalone/server.js` calls `process.chdir(__dirname)`:

1. `DATABASE_URL` must be an **absolute** path.
2. `APP_DATA_DIR` must point **outside** the release directory.

See [`../../../src/lib/paths.ts`](../../../src/lib/paths.ts).

Do not run two of these paths against the same domain at once. Two authoritative
deployments is how configuration drift and data loss happen.
