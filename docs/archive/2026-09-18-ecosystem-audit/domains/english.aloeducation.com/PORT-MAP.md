# PORT-MAP — english.aloeducation.com
| Port | Bind | Owner | Source | Status |
|---|---|---|---|---|
| 3016 | 127.0.0.1 | alo-english (Next standalone) | deploy.yml APP_PORT/APP_HOST | CONFIGURED (CD truth); live bind OWNER VERIFY |
| 3000 | varies | alo-english (alternative docs architecture) | README/ecosystem/Caddyfile/nginx/scripts | CONFLICT S-03 |
| 3003 | 127.0.0.1 (implied) | examiner-stream sidecar | mini-services/examiner-stream | CONFIGURED in code; not in CD (S-04) |
| 81 | — | sandbox transform proxy | root Caddyfile | NEVER public (S-05) |
§10 collision check: PASS within map; live collision check requires VPS (owner).
SSH port: UNKNOWN by design — never infer from app ports (§9).
