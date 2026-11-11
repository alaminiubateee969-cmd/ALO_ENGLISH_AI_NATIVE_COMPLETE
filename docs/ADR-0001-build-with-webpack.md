# ADR-0001 — Build production with webpack, not Turbopack

- **Status:** accepted
- **Date:** 2026-10-08
- **Deciders:** ALO English platform maintainers
- **Enforced by:** `scripts/check-manifest.mjs` (check 8) — CI fails if the flag is removed

## Context

Next.js 16 builds with Turbopack by default. The host's build container
(Hostinger Node.js Web App, automatic Git deployment from `main`) runs exactly:

```
npm install
npm run build
```

Every deploy failed in the same place, at the first stylesheet:

```
FATAL: An unexpected Turbopack error occurred.
Error [TurbopackInternalError]: [project]/src/app/globals.css [app-client] (css)

Caused by:
- creating new process
- node process exited before we could connect to it with exit status: 0

Debug info:
- Execution of <CssModule as Module>::references failed
- Execution of parse_css failed
- Execution of <PostCssTransformedAsset as Asset>::content failed
- Execution of PostCssTransformedAsset::process failed
- Execution of evaluate_webpack_loader failed
- creating new process
- node process exited before we could connect to it with exit status: 0
  Process output:
  Process error output:
```

The identical source tree and lockfile built cleanly in GitHub Actions and on
developer machines, in seconds. TypeScript passed, the dependency tree
installed, and `tailwindcss` / `@tailwindcss/postcss` were matching `^4`
releases. Nothing in the repository was broken.

## Root cause

Turbopack does not run PostCSS itself. It starts a pool of `node` worker
processes (`pool_entry-[turbopack-node]_transforms_postcss…`) and hands each one
a port. Every worker must then **connect back to the build over `127.0.0.1`
TCP**. The worker's entry script calls `process.exit(0)` when that socket
closes — which is precisely the observed signature: exit status `0`, with
nothing on either output stream.

The host's build container does not permit that loopback connection, so the
PostCSS worker dies before it can transform `src/app/globals.css`.

Two things follow from this:

1. It is not a CSS, Tailwind, PostCSS or dependency-version problem. Downgrading
   `@tailwindcss/postcss` — which superficially looks like the fix, because the
   panic names a CSS file — makes the build strictly worse.
2. **Any** webpack-style loader would trigger it, not just PostCSS. The failure
   point moves to whichever loader runs first.

## Decision

`package.json` builds production with webpack:

```json
"build": "next build --webpack && node scripts/finalize-standalone.mjs"
```

`next build --webpack` is Next.js 16's documented, supported opt-out of
Turbopack for production builds. Webpack runs `postcss-loader` **in-process**,
and Next's own build and prerender workers are forked with **IPC pipes**, so the
build needs no loopback TCP connection at any point.

`next dev` is unchanged and still uses Turbopack: local development has working
loopback, and Turbopack's dev speed is worth keeping.

## Alternatives considered

| Option | Verdict |
| --- | --- |
| `experimental.turbopackPluginRuntimeStrategy: "workerThreads"` | Runs the loader work on threads inside the build process, so nothing is spawned — and it does fix the panic. Rejected because it hits a native Node worker-thread bug that was only fixed in Node 24.13.1 / 25.4.0; on Node 22 it segfaults intermittently (roughly 1 build in 3), which the host also reports as a failed deploy. An intermittent failure is worse than a deterministic one. |
| Downgrade `@tailwindcss/postcss` to `^3.4.0` | Wrong fix. Tailwind v4 and its PostCSS plugin are intentionally matching `^4` releases; downgrading only the plugin breaks the build in a new way. |
| Remove `postcss.config.mjs` and pre-compile Tailwind with a CLI step | Avoids the worker, but splits the stylesheet pipeline in two, adds a build-time dependency, and makes `@theme` / `@custom-variant` in `globals.css` silently stop working if the pre-compile step is ever skipped. |
| Ask the host to allow loopback | Not available to us. The build container is managed infrastructure. |
| Pin to an older Next.js that defaults to webpack | Freezes the framework to work around a container restriction, and re-opens the same question at the next upgrade. |

## Consequences

- Production builds use webpack. Expect a longer build than Turbopack, and
  webpack's own warnings in the log. Both are acceptable; correctness of the
  deploy is not negotiable.
- The flag is load-bearing but looks like leftover cruft to anyone who has not
  read a deploy log. `scripts/check-manifest.mjs` fails CI if `build` stops
  containing `next build --webpack`, and the failure message points here.
- If Next.js later runs PostCSS natively inside Turbopack (no worker process),
  this decision can be revisited — by changing the flag **and** this ADR and the
  `check-manifest.mjs` guard together, in one commit, after a real deploy has
  been observed to succeed.

## References

- Deploy log for build `01a11943-20aa-73ee-8d8d-37f8cbcf320a` (`main` @ `c5ef20d`)
- `next build --help` → `--webpack   Builds using webpack.`
- `HOSTINGER_DEPLOYMENT.md` — the host pipeline this must survive
