# DEPLOYMENT — english.aloeducation.com
Pipeline of record: `.github/workflows/deploy.yml` (push→main; manual dispatch).
Chain: gates(lint/type/tests/build) → exact-SHA checkout → SSH(secrets; key=VPS_SSH_KEY,
host from VPS_HOST, port from VPS_SSH_PORT) → rsync --delete (excl .env/*.db/uploads/logs)
→ VPS build (bun frozen, prisma generate) → pm2 delete+start ONLY `alo-english` @
127.0.0.1:3016 → wait local 200 (≤60s) → `ss -lntp` assert → public HTTPS 200 assert →
summary(SHA). Current status: **RED (tests)** → live site is out-of-band deployed (S-02).
Rollback: releases-symlink pattern exists for systemd path only; PM2 path lacks it (doc'd).
