# ALO English — Project Brief

**Shareable one-pager for stakeholders · v1.1.0 · 2026-10-27**

---

## What it is

**ALO English** (english.aloeducation.com) is a complete, AI-native English-test-preparation and study-abroad CRM platform. Students practise every major computer-based English exam in one place — completely free, unlimited, 24/7; counsellors run the full lead-to-enrolment pipeline; partners refer and earn; and the whole business can be operated either through the dashboards or entirely by an AI agent over the API.

## The 20 exam types covered

IELTS (Academic & General), IELTS UKVI, PTE Core, PTE Academic, TOEFL iBT, Duolingo English Test, GRE, GMAT Focus, SAT, ACT, CAEL, CELPIP, OET, Cambridge B2 First, Cambridge C1 Advanced, Linguaskill, EF SET, Versant, iTEP, LanguageCert — each with its own exam blueprint, timed sections, and question formats (MCQ, fill-in, reorder, highlight, essay, speaking).

## What each role gets

| Portal | Highlights |
|---|---|
| **Student** | Exam catalogue, **unlimited free mock tests (24/7)** with autosave, instant deterministic scoring, history and progress, study-material library (per-exam guides, grammar, vocabulary), AI speaking practice, review queue, document vault, AI study chat |
| **Counsellor / Employee** | Lead capture + AI-scored priority call list (HOT/WARM/COLD), student pipeline, tasks, appointments, messages, applications, document review queue, consent register |
| **Teacher** | Purpose-built portal: student roster, recent exam results across every exam, study-material and practice links — read-only by design |
| **Partner** | Referral code, referral tracking, commission ledger, profile |
| **Admin** | Full CRM (users, **teachers**, universities, courses, scholarships, countries, branches, departments, partners, commissions, audit log), exam centre, learning content, analytics, SEO, settings, integrations |
| **Super-admin** | One-screen platform health: services, the internal AI-agent workforce, provider/integration status |

## The AI layer (open and honest)

- **14-agent internal workforce** (content generation, review, counselling, analytics…) with jobs, approvals, metrics, and guardrails — every AI action is auditable.
- **Deterministic-first design:** scoring, review queues, and fallbacks all work with zero AI configuration. AI enhances; it never blocks.
- **Provider-agnostic by design:** Groq, OpenRouter, Gemini, HuggingFace, or fully **self-hosted open-source models** (Ollama, vLLM, llama.cpp) and self-hosted LanguageTool grammar checking. Adding a provider is a one-line registry entry — the platform never locks to a single vendor.

## Technology

Next.js 16 (App Router, standalone output) · React 19 · TypeScript (strict, 0 errors) · Prisma 6 on SQLite (single-writer, additive-only migrations — 67 tables) · NextAuth credentials + RBAC · Tailwind CSS · 722 automated tests passing · audited question-provenance system that distinguishes licensed, synthetic, and AI-generated content.

## Delivery status

- **Production-ready:** public site, auth/RBAC (including the TEACHER role and portal), exam engine with **unlimited free practice for every learner, 24/7**, the free study-material library, CRM with full management UI (every dashboard button works), lead scoring, review queue, agent workforce, analytics, deployment pipeline.
- **Launch gates (content, not code):** licensed question bank to replace the synthetic seed (top priority), audio for 74 listening items (`npm run audio:generate`), one AI provider key. *Nothing is gated on payment — every feature is free and unlimited by policy.*
- **Deployment:** single VM (Ubuntu 22.04), PM2 fork on :3055, Nginx reverse proxy, Cloudflare SSL. Full spec in `SERVER-SPEC.md`; runbook in `deploy/README.md`.

## Documents in this repository

| Document | Purpose |
|---|---|
| `SERVER-SPEC.md` | Server specification + first-deploy commands |
| `deploy/README.md` | Deployment, update, backup, rollback runbook |
| `docs/AI_AGENT_OPERATION.md` | How an external AI agent operates the platform |
| `docs/AUDIT_BASELINE_2026-10-26.md` | Independent baseline audit (before repairs) |
| `docs/AUDIT_POST_REPAIR_2026-10-27.md` | Post-repair audit — everything verified, gates green |
| `PROJECT-INDEX.md` | Generated map of all API routes and pages (regenerated with every change) |

---

*Prepared as part of the complete project handover. All code, tests, migrations, documentation, and deployment tooling are in this repository — nothing withheld.*
