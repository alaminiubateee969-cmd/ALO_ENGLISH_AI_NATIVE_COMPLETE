# GLOBAL SECURITY (§100/§141/§169/§179) — 2026-09-18

## Security boundary principle (in force)
MODEL ≠ SECURITY BOUNDARY. All enforcement below lives in code/infra, not prompts (§1).

## Evidence-based findings — this repository
### PASS (code-verified)
| Control | Evidence |
|---|---|
| Secrets hygiene | `git grep` sweeps for 12 secret classes over 677 tracked files: **0 hits**. Only placeholders (`YOUR_PASSWORD`, `user:password@`). `.env` never tracked. |
| Auth on APIs | All 72 `/api/*` routes: centralized `requireAuth/requireRole` (`lib/crud.ts`, `lib/auth`) or `requireSession+requirePermission` (`lib/rbac`), or documented public allowlist in `src/proxy.ts`. CRM = role-gated; RBAC admin = permission-gated. IDOR surface reduced by factory pattern (§133/§134). |
| RAG authorization | `RagEngine.retrieveContext` hard-filters `isActive:true, isPublic:true` — similarity never bypasses ACL (§51). |
| AI secrets | `GroqClient`: env-only key, never logs key/PII, 30 s timeout clamp, null-fallback (§34). |
| Security headers | `proxy.ts`: CSP (frame-ancestors 'none'), HSTS (prod), nosniff, DENY, Referrer/Permissions-Policy. Also mirrored in next.config.ts. |
| Process least-privilege design | systemd unit: dedicated `aloenglish` user, ProtectSystem=strict, NoNewPrivileges, cap-bounding; sudoers: only `systemctl` verbs for this unit + caddy reload + journalctl read (§35/§36). |
| Deploy blast radius | `deploy.yml` touches ONLY `pm2` app `alo-english` in `$VPS_PATH`; rsync excludes `.env`, `*.db`, logs, uploads; concurrency group prevents parallel deploys (§92/§93). |

### FAIL / WARNING (with owner actions)
| ID | Severity | Finding | Action |
|---|---|---|---|
| S-01 | HIGH | `db/custom.db` committed to Git: user PII, bcrypt hashes, session token, audit logs | Purge from Git (history rewrite on a FULL clone), rotate admin + seeded passwords, move DB to runtime-only path (§57) |
| S-02 | HIGH | `main` CI + Deploy RED (smoke tests fail) → live site is running out-of-band-deployed code; Git↔prod SHA chain BROKEN (§89/§124) | Fix tests, re-run pipeline, verify live SHA == main SHA |
| S-03 | MEDIUM | Port architecture conflict 3016 (CD) vs 3000 (docs) — same service, two stories | Owner confirms live bind; delete losing architecture docs |
| S-04 | MEDIUM | `examiner-stream` (3003): not started by CD; `cors: origin:"*"`; only routable via sandbox `XTransformPort` hack | Give it a real prod route + auth-scoped CORS + add to CD or formally disable |
| S-05 | MEDIUM | Root `Caddyfile` :81 query-driven port-forward | Never deploy publicly; firewall/loopback only (§63) |
| S-06 | MEDIUM | Two different VPS IPs in docs (103.231.239.79 / 115.187.18.239), both unverified | Owner confirms real host(s); update docs |
| S-07 | LOW | README instructs `ssh root@…` | Use dedicated deploy user + restricted sudo (docs already contain the good pattern) |
| S-08 | LOW | GH Actions pinned by tag (`@v4`) not SHA; `ssh-keyscan` TOFU; no gitleaks/SAST/dep-scan/SBOM in CI | Pin SHAs (§87), pin host key (§39), add gates (§77/§121/§157) |
| S-09 | LOW | 3.3 MB zip + tar.gz + second PHP app (`cpanel-production/`) tracked in repo | Classify: extract to separate repo or remove (§23) |
| S-10 | INFO | `/api/agents/status` public → exposes capability metadata (`canAutoExecute`…) | Decide if internal-only (§140) |
| S-11 | INFO | Live DB drift: `examTypes:12` vs seed `20`; live version "1.0.0" == repo | Re-seed or reconcile data; document intended dataset |

## Cross-domain boundary (§100/§179) — current posture
Only ONE domain's code is in Git here. No shared secrets, DBs, or deploy paths are visible
in this repo → no accidental cross-domain coupling FOUND. Boundaries for the other 14
domains are UNVERIFIED pending repos/VPS inventory. Nothing may be marked "isolated"
without that evidence (§174).

## Agent-model rule (§170)
MODEL → AGENT → POLICY → CAPABILITY → TOOL → SANDBOX → EXECUTOR → AUDIT.
No path in this repo lets the model reach root, other projects' data, or its own policy
(see GLOBAL-AI-AGENT-SECURITY.md).
