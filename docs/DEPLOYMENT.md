# Deployment
Ubuntu 24.04 + Node 22 + Bun + Next.js 16 standalone + SQLite/Prisma + Caddy + systemd.
Deploy: scp zip → extract → bun install → db:migrate → db:seed → build → install.sh
Cron: daily question generation at 2 AM, backup at 3 AM.
