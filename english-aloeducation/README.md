# English.ALOEducation.com Web_CRM

> The unified English-learning, exam-preparation, and CRM platform for **ALO Education** — built with Next.js 16, Prisma, MariaDB, and NextAuth.

Public site · student portal · admin CRM · teacher / examiner / ambassador / employee portals — all from a single Next.js app.

---

## ✨ Features

- **Marketing site** — hero, exam catalog, mock tests, pricing, contact form, certificate verification.
- **Authentication** — NextAuth (Credentials provider, JWT sessions) with role-based access control.
- **Student portal** — dashboard, courses, exam attempts, certificates, payments, assignments, messages, settings.
- **Admin CRM** — KPIs, student management, course catalog, leads pipeline, payments, exam-attempt monitoring, system settings.
- **Teacher portal** — classes, assignments, submissions grading.
- **Examiner portal** — writing & speaking review queues with band-score feedback.
- **Ambassador portal** — referral links, voucher issuance, conversion tracking.
- **Employee portal** — assigned leads, vouchers, notifications.
- **AI features** — mock-test scoring, AI tutor, AI speaking coach, AI writing evaluator (placeholders wired into the API layer).
- **Verifiable certificates** — public `/verify/[hash]` lookup page with a per-certificate unique hash.
- **Production-ready** — systemd service, nginx reverse proxy, automated deploy script, Prisma seed.

---

## 🧱 Tech stack

| Layer        | Technology                                                |
| ------------ | --------------------------------------------------------- |
| Framework    | Next.js 16 (App Router, RSC, Server Components)           |
| Runtime      | Bun (production), Node.js (dev)                           |
| Language     | TypeScript 5                                              |
| Styling      | Tailwind CSS 3 (ALO brand palette: navy / blue / orange)  |
| Auth         | NextAuth v4 (Credentials + JWT, Prisma adapter)           |
| ORM          | Prisma 5                                                   |
| Database     | MariaDB / MySQL                                           |
| Validation   | Zod                                                        |
| Passwords    | bcryptjs                                                   |
| Process mgmt | systemd + nginx                                           |

---

## 🎨 Brand palette

| Token              | Hex       | Tailwind class      |
| ------------------ | --------- | ------------------- |
| Navy (primary)     | `#0B1F3A` | `bg-alo-navy`       |
| Blue (secondary)   | `#0057B8` | `bg-alo-blue`       |
| Orange (accent)    | `#E8501A` | `bg-alo-orange`     |
| Royal blue         | `#0B63CE` | `bg-alo-royal`      |

All brand colors are defined in `tailwind.config.ts` under the `alo` namespace.

---

## 📁 Project structure

```
english-aloeducation/
├── prisma/
│   ├── schema.prisma         # Full DB schema (40+ models)
│   └── seed.ts               # Idempotent seed: admin, exam types, courses, questions, mock tests, settings
├── nginx/
│   └── english-aloeducation.conf   # Reverse proxy + SSL + security headers
├── systemd/
│   └── english-aloeducation.service
├── scripts/
│   └── deploy.sh             # One-command deploy
├── src/
│   ├── app/
│   │   ├── (public)          # /, /login, /register, /courses, /exams, /pricing, /about, /contact, /verify/[hash]
│   │   ├── student/          # /student/dashboard, courses, exams, certificates, payments, assignments, messages, settings
│   │   ├── admin/            # /admin/dashboard, students, courses, leads, payments, exam-attempts, settings
│   │   ├── teacher/          # /teacher/dashboard, classes, assignments
│   │   ├── examiner/         # /examiner/dashboard, writing-review, speaking-review
│   │   ├── ambassador/       # /ambassador/dashboard, referrals
│   │   ├── employee/         # /employee/dashboard
│   │   ├── api/              # REST routes (courses, exams, students, leads, payments, certificates, …)
│   │   ├── layout.tsx        # Root layout (Inter font, metadata)
│   │   ├── globals.css       # Tailwind layers + brand utilities
│   │   ├── not-found.tsx     # 404
│   │   └── error.tsx         # Root error boundary
│   ├── components/
│   │   └── portal/           # PortalShell, Card, StatTile, EmptyState, CopyButton
│   ├── lib/
│   │   ├── auth.ts           # NextAuth config + role-augmented session types
│   │   ├── prisma.ts         # PrismaClient singleton
│   │   └── utils.ts          # cn(), generateCode(), formatCurrency(), formatDate()
│   └── middleware.ts         # Role-based route protection
├── tests/
│   └── health.test.ts        # Smoke test (bun:test)
├── .env.example
├── next-env.d.ts
├── package.json
└── README.md
```

---

## 🚀 Quick start (development)

### Prerequisites

- Node.js 20+ (or Bun 1.1+)
- MariaDB 10.6+ / MySQL 8
- `openssl` (for generating the NextAuth secret)

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and generate a NEXTAUTH_SECRET:
#   openssl rand -base64 32
```

### 3. Initialize the database

```bash
bun run db:generate     # Generate Prisma client
bun run db:push         # Create all tables from schema.prisma
bun run db:seed         # Seed admin user + exam types + courses + questions + mock tests + settings
```

Default admin credentials after seeding:

```
Email:    admin@aloeducation.com
Password: ChangeMe123!
```

### 4. Start the dev server

```bash
bun run dev
# → http://127.0.0.1:3002
```

---

## 🧪 Tests

```bash
bun test
```

A smoke test lives in `tests/health.test.ts` and is run with `bun:test`.

---

## 🚢 Production deployment

The production target is a single Linux server running:

- **MariaDB** for the database
- **Bun** running the Next.js standalone server (`server.js`) on `127.0.0.1:3002`
- **systemd** to manage the process
- **nginx** as the public-facing reverse proxy (TLS via Let's Encrypt)

### 1. Server prerequisites

```bash
# Create deploy user
sudo useradd -m -s /bin/bash aloedu

# Install Bun
curl -fsSL https://bun.sh/install | bash -s -- --home /home/aloedu/.bun
sudo chown -R aloedu:aloedu /home/aloedu/.bun

# Install MariaDB
sudo apt install -y mariadb-server

# Install nginx + certbot
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Place the codebase

```bash
sudo mkdir -p /var/www/english-aloeducation
sudo chown aloedu:aloedu /var/www/english-aloeducation

# As aloedu:
cd /var/www/english-aloeducation
git clone <repo-url> .
cp .env.example .env
# Edit .env with production values
```

### 3. Create the database

```sql
CREATE DATABASE english_aloeducation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aloedu'@'localhost' IDENTIFIED BY 'CHANGE_ME';
GRANT ALL PRIVILEGES ON english_aloeducation.* TO 'aloedu'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Install systemd service

```bash
sudo cp systemd/english-aloeducation.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable english-aloeducation
```

### 5. Install nginx config + issue certificate

```bash
sudo cp nginx/english-aloeducation.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/english-aloeducation.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d english.aloeducation.com
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Deploy

```bash
bash scripts/deploy.sh
```

The deploy script will:

1. `bun install --frozen-lockfile`
2. `bun run db:generate`
3. `bun run db:push`
4. `bun run db:seed` (idempotent)
5. `bun run build`
6. `sudo systemctl restart english-aloeducation`
7. `sudo nginx -t && sudo systemctl reload nginx`
8. Curl `/api/health` to confirm the app is up

---

## 🔐 Security notes

- All passwords are hashed with bcryptjs (12 rounds).
- NextAuth JWT sessions carry the user's `role` for middleware-enforced RBAC.
- `middleware.ts` blocks role-mismatched access (e.g. a student hitting `/admin/*`).
- nginx enforces HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and a strict CSP.
- Login / register endpoints are rate-limited (10 r/m per IP).
- File uploads are capped at 50 MB (audio recordings for speaking tests).
- All `Setting` rows flagged `isSecret: true` are masked in the admin UI.

---

## 📜 Available scripts

| Script             | Description                                  |
| ------------------ | -------------------------------------------- |
| `bun run dev`      | Start the Next.js dev server on port 3002    |
| `bun run build`    | Production build                              |
| `bun run start`    | Start the production Next.js server          |
| `bun run lint`     | Run ESLint                                    |
| `bun run test`     | Run `bun:test` test suite                     |
| `bun run db:generate` | Generate Prisma client                     |
| `bun run db:push`  | Push schema → database                        |
| `bun run db:seed`  | Seed the database with sample data           |
| `bun run db:migrate` | Create & apply a Prisma migration          |
| `bun run db:studio` | Open Prisma Studio                           |

---

## 📞 Support

- **Email:** support@aloeducation.com
- **Website:** https://english.aloeducation.com
- **Head office:** Banani, Dhaka 1213, Bangladesh

---

© ALO Education. All rights reserved.
