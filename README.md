# ALO Education English Practice & CRM Platform

> A Next.js application codebase for English-test practice, learner resources, partner referrals, and CRM workflows. **Production and exam-content readiness have not been verified.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-indigo.svg)](https://www.prisma.io/)
[![CI](https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE/actions/workflows/ci.yml/badge.svg)](https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE/actions/workflows/ci.yml)

**Configured production hostname:** `https://english.aloeducation.com` — availability, current release, database, and deployment ownership have not been independently verified in this audit.

## What is in this repository

- Next.js App Router pages and API handlers for learner, partner, admin, and CRM workflows.
- Prisma schema and migrations for accounts, attempts, scores, quotas, CRM records, and related records.
- Server-side attempt creation, question freezing, autosave/resume, deadline calculation, ownership checks, and deterministic objective grading.
- Practice-only writing suggestions and speaking-conversation/transcription routes. These are not publisher-scored results; see the capability limits below.
- Study-material/RAG and learning-agent code. Provider availability, data quality, and production operation are not verified.
- Scripts for database checks, inventories, backups, listening-audio generation, and validation.

The exam catalog contains metadata for multiple products; metadata does **not** establish that a complete, current, licensed question bank exists. Legacy synthetic seed scripts are not part of the production seed command and now refuse to run unless explicitly opted into a clearly named disposable test/sample SQLite database.

## Capability and verification limits

| Area | Current code-level capability | Not established by this repository audit |
| --- | --- | --- |
| Exam attempts | Server creates persisted attempts, freezes questions, derives deadlines from server timestamps, checks ownership, and grades supported objective answer keys. | Production DB/question counts, end-to-end behavior against a generated Prisma client, official-length coverage, and score calibration. |
| Scores | Listening/reading practice indicators are calculated from objective answer accuracy. Responses disclose that they are not official scores. | Publisher-equivalent conversion tables, validated bands, human-rating calibration, or official results. |
| Writing | Local text heuristics return generic revision suggestions; no numeric writing score is persisted or returned. | Rubric-based IELTS/TOEFL/PTE/OET/etc. grading or human-validated feedback. |
| Speaking | Practice chat, TTS, and an ASR transcription route exist. | Securely persisted attempt recordings, acoustic/prosody analysis, pronunciation scoring, accent assessment, or numeric speaking results. Regional accent variation must not be treated as an error. |
| Listening media | A guarded generator validates MP3 structure/size before recording a local URL in the database. | Existing database asset counts, rights to scripts/voices, deployment availability, successful HTTP delivery, and browser playback. |
| Quotas/payments | Free-attempt/quota code exists. Payment-history reads are user-scoped. | Merchant credentials, checkout, signed webhooks, refunds, or provider-confirmed credits. Purchase POST is deliberately disabled and returns 503 without creating a payment or credit. |
| Authentication/security | HMAC session-cookie and route-level auth/role/ownership helpers exist; public inputs have some validation and rate limits. | Production secret configuration, server-side session revocation, full route-by-route security testing, MFA, and deployed headers. |
| CRM | CRUD routes, role checks, scoping helpers, and pure scope tests exist. | Database-backed isolation tests or verification against production student/CRM records. |
| Deployment/operations | Hostinger-related build/deployment instructions and CI workflows exist in source. | A successful current deployment, live health probe, backup/restore exercise, or production migration approval. |

Read the nine current audit reports in [`docs/`](./docs/):

- [Feature gap register](./docs/FEATURE_GAP_REGISTER.md)
- [Reference integration matrix](./docs/REFERENCE_INTEGRATION_MATRIX.md)
- [Exam coverage report](./docs/EXAM_COVERAGE_REPORT.md)
- [Audio coverage report](./docs/AUDIO_COVERAGE_REPORT.md)
- [AI evaluation report](./docs/AI_EVALUATION_REPORT.md)
- [Payment verification](./docs/PAYMENT_VERIFICATION.md)
- [Security audit](./docs/SECURITY_AUDIT.md)
- [Production deployment report](./docs/PRODUCTION_DEPLOYMENT_REPORT.md)
- [Regression checklist](./docs/REGRESSION_CHECKLIST.md)

These reports distinguish repository evidence from database, provider, legal, browser, and production evidence. A feature is not release-ready merely because a route, UI, seed declaration, or integration stub exists.

## Local development

Use Node.js 22 and a disposable local database. Never point migration, seed, test, or validation commands at production data.

```bash
npm install
cp .env.example .env.local
# Set AUTH_SECRET to a random value of at least 32 characters.
# Set DATABASE_URL to an explicitly disposable local SQLite database.
npm run db:generate
npm run db:migrate:dev
npm run prisma:seed
npm run dev
```

`npm run prisma:seed` creates core metadata (admin account, exam-type rows, settings, and quota); it does not create a question bank. The legacy sample question seeders are guarded and are not production content. Do not use them to represent official exams. An empty question bank is a blocker, not an invitation to substitute generated or mock questions.

Useful checks (run only with the required local tooling and a disposable database where applicable):

```bash
npm run lint
npm run typecheck
npm test
DATABASE_URL='file:./ci-test.db' npm run content:validate
npm run build
```

`content:validate` blocks if `DATABASE_URL` is absent and checks database answer-key shape/non-empty content; it does not prove official-format coverage, content licensing, or audio playback. `npm test` requires Bun. Prisma-dependent checks require a generated Prisma client and a safe database.

## Security and data handling

- Student attempt/question/result routes must enforce ownership server-side; correct answers are omitted from active-attempt responses.
- Role checks and CRM query scoping are implemented at handlers/helpers, not by the edge proxy. See the security report for residual risks and unverified routes.
- Session cookies are stateless HMAC tokens with a 24-hour lifetime; individual server-side session revocation is not implemented.
- Password recovery is intentionally unavailable until a verified email-delivery integration exists. No reset token is issued or logged.
- Do not place credentials or production data in Git. `.env` was removed from the index in this change; the local file was not read. Since it existed in repository history, rotate any real credential that may ever have been present. Git history was not rewritten.
- Do not apply production migrations without a reviewed, restorable backup and operator approval.

## Deployment

The repository contains Hostinger-oriented build and deployment instructions, but this audit does not verify the live host, its environment variables, its database, or the current release. Do not interpret a passing local check or configured GitHub workflow as proof of deployment. See [`HOSTINGER_DEPLOYMENT.md`](./HOSTINGER_DEPLOYMENT.md) and [`docs/PRODUCTION_DEPLOYMENT_REPORT.md`](./docs/PRODUCTION_DEPLOYMENT_REPORT.md).

## Inventories and references

The root `*_INVENTORY.csv` files are generated from checked-in source with:

```bash
npm run inventories
npm run inventories:check
```

They are source inventories, not proof of runtime authorization or deployed data. Official specification links and the disposition of the supplied reference repository are in [`docs/REFERENCE_INTEGRATION_MATRIX.md`](./docs/REFERENCE_INTEGRATION_MATRIX.md).
