# ALO English Test Platform

Production-ready Next.js application for English exam practice. Features 32 exam types, a mock-test engine, automated scoring, and an AI agent workforce dashboard.

## Quick Start (Development)

```bash
bun install
cp .env.example .env
bun run db:generate
bun run db:migrate:dev
bun run db:seed
bun run dev
```

Open `http://localhost:3000`.

## Architecture

| Component | Choice |
|---|---|
| Operating System | Ubuntu 24.04 LTS |
| Runtime | Node.js 22 LTS |
| Package Manager | Bun |
| Framework | Next.js 16 (standalone output) |
| Database | SQLite (via Prisma ORM) |
| Reverse Proxy | Caddy |
| Process Manager | systemd |
| Application User | `aloenglish` |
| Source Directory | `/opt/alo-english-source` |
| Runtime Directory | `/opt/alo-english` |
| Application Port | 3000 |
| Service Name | `alo-english.service` |
| Backups | `/var/backups/alo-english` |
| Logs | systemd journal |

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server on port 3000 |
| `bun run build` | Production build (standalone) |
| `bun run start` | Start production server |
| `bun run lint` | ESLint |
| `bun run typecheck` | TypeScript type check |
| `bun run test` | Run smoke tests |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Apply production migrations (`migrate deploy`) |
| `bun run db:seed` | Seed database |
| `bun run verify` | Run full verification gate |
| `bun run backup` | Create database + uploads backup |
| `bun run healthcheck` | Check the health endpoint |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full staged deployment guide.

## Operations

See [OPERATIONS.md](./OPERATIONS.md) for daily/weekly/monthly operations.

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Security

See [SECURITY.md](./SECURITY.md).

## Practice Only Disclaimer

All content on this platform is original, exam-aligned practice material — not official exam content. Not affiliated with any official test publisher.
