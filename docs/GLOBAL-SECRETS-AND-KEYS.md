# GLOBAL SECRETS AND KEYS (§34/§37/§38/§39/§120) — 2026-09-18

## Scan performed (evidence)
- 12+ secret patterns (sk-, gsk_, hf_, AIza, ghp_, github_pat_, AKIA, PEM/OPENSSH key
  headers, Slack tokens, credentialed DB/queue URLs, hardcoded password assignments)
  across ALL 677 tracked files + bun.lock excluded-dependency pass: **0 real secrets**.
- `.env`/`.pem`/`.key` files tracked: NONE (only `.env.example`).

## Secrets inventory (this service)
| Secret | Storage | Rotation | Status |
|---|---|---|---|
| AUTH_SECRET | VPS .env + GitHub CI literal (ci-only) | on any suspicion + S-01 | CONFIGURED |
| AI provider keys | VPS .env (optional; may be absent — app runs rule-engine fallback) | provider schedule | CONFIGURED |
| DATABASE_URL | VPS .env | with S-01 remediation | CONFIGURED |
| VPS_SSH_KEY (deploy private key) | GitHub secret ONLY — never in repo/prompt/docs (verified absent) | rotate + re-fingerprint per §37 | CONFIGURED, audit value perms |
| SSH host fingerprints | NOT PINNED anywhere — deploy.yml uses ssh-keyscan (TOFU) | pin known_hosts entry §39 | WARNING S-08 |
| Admin seed password | printed by seed at deploy time — hash of an admin + test users EXISTS IN TRACKED db/custom.db | rotate all seeded users NOW (S-01) | **OWNER ACTION REQUIRED** |

## Absolute rules (restated, enforced by this registry)
No private key / password / token may enter: Git, prompts, logs, RAG, memory, chat, or docs.
No AI agent holds any secret above. Violations = incident (see GLOBAL-INCIDENT-RESPONSE.md).
