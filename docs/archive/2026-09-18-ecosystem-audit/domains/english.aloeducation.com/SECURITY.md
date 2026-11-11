# SECURITY — english.aloeducation.com
PASS (code evidence): secret scan 0 hits; API auth centralized+complete (public allowlist
explicit); RAG isPublic ACL; GroqClient secret/PII-safe; CSP+HSTS+frame-ancestors none;
RBAC 9×44; audit logging in CRUD; systemd+sudo hardening; deploy scoped to one pm2 app.
OPEN: S-01 DB in Git (rotate+purge); S-02 SHA chain; S-04 sidecar governance (CORS *);
S-07 root-ssh docs; S-08 CI gates; §58 upload pipeline absent; §152 adversarial agent
tests absent; IDOR per-entity team-scoping spot-check TODO (factory enforces role, not
per-row ownership for every entity — sample-verified only).
