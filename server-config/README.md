# server-config/ — optional self-managed deployment

**These files are not used by production.**

`https://english.aloeducation.com` runs on Hostinger, which terminates TLS,
supervises the process and manages the environment itself. The authoritative
guide is [`../HOSTINGER_DEPLOYMENT.md`](../HOSTINGER_DEPLOYMENT.md).

What is here supports the *other* path described in
[`../DEPLOYMENT.md`](../DEPLOYMENT.md): running this same artifact on a server
you administer yourself. Use it only if you deliberately chose to self-host.

| File | Used by | Purpose |
| --- | --- | --- |
| `alo-english.service` | systemd | Unit file with security hardening, staged-release paths and restart policy |
| `Caddyfile.production` | Caddy | Reverse proxy to `127.0.0.1:3000`, automatic TLS, security headers |
| `alo-english.nginx` | nginx | The same reverse proxy for hosts that run nginx instead of Caddy |
| `sudo-policy` | sudoers | Lets the `aloenglish` user restart only this one service, nothing else |

CI validates all four — `bash -n` over `scripts/*.sh`, `systemd-analyze verify`
and `visudo -c -f` in `.github/workflows/ci.yml` — so they cannot rot silently
while nobody deploys with them.

## Do not point these at production

Running a self-managed instance and the Hostinger instance against the same
domain, or against the same database, produces two authoritative deployments.
That is how configuration drift and data loss happen, and it is the reason
`.github/workflows/deploy.yml` no longer deploys anywhere and
`scripts/check-manifest.mjs` fails the build if any workflow reintroduces an
SSH, rsync or process-manager deployment step.

If you self-host, note the two rules that apply to every deployment of the
standalone artifact, because `.next/standalone/server.js` calls
`process.chdir(__dirname)`:

1. `DATABASE_URL` must be an **absolute** path.
2. `APP_DATA_DIR` must point outside the release directory.

See `../DEPLOYMENT.md` and `../src/lib/paths.ts`.
