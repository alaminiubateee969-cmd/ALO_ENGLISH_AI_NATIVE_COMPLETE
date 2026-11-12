# Deployment Guide

## Architecture
- OS: Ubuntu 24.04 LTS
- Runtime: Node.js 22 LTS
- Package Manager: Bun
- Framework: Next.js 16 standalone
- Database: SQLite via Prisma
- Reverse Proxy: Caddy
- Process Manager: systemd
- App User: aloenglish
- Port: 3000

## Steps
1. Create user: sudo useradd -r -m -d /opt/alo-english -s /bin/bash aloenglish
2. Upload source: scp alo-english-source.tar.gz aloenglish@server:/opt/alo-english-source/
3. Create .env from .env.example (generate AUTH_SECRET with openssl rand -base64 48)
4. Install: bun install --frozen-lockfile
5. Migrate: bun run db:migrate (prisma migrate deploy)
6. Seed: bun run db:seed (first deploy only)
7. Build: bun run build
8. Deploy: sudo bash scripts/install.sh
9. Configure Caddy: sudo cp server-config/Caddyfile.production /etc/caddy/Caddyfile
10. Verify: curl localhost:3000/api/health

## Rollback
bash scripts/rollback.sh
