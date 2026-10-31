# ALO Voice & Contact Center — Phase 0 Repository & Infrastructure Audit

**Document:** `docs/VOICE_CONTACT_CENTER_AUDIT.md`
**Product audited against:** ALO AI Voice & Contact Center master brief (Cloud Telephony + AI Voice + AI Contact Center)
**Repository:** `alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE`
**Commit inspected:** `3cb6a05` (`main`), branch `arena/b6df7d9a-alo-english-ai-native-complete`
**Audit date:** 2026-10-31 (Asia/Dhaka)
**Audit type:** read-only. No source file, database, migration, service or provider setting was changed in this phase.

---

## 0. Evidence boundary — read this before trusting anything below

The repository has an established convention (`docs/FEATURE_GAP_REGISTER.md`) of labelling every capability **VERIFIED / PARTIAL / MISSING / BROKEN / BLOCKED / NOT_TESTED**, and of refusing `VERIFIED` on the strength of source code alone. This audit follows the same rule.

**What was actually done in this phase**

| Activity | How | Result |
|---|---|---|
| Repository inspection | `git log`, file tree, full read of `package.json`, `prisma/schema.prisma`, `next.config.ts`, `server.js`, `src/lib/*`, `src/lib/crm/*`, `src/lib/ai/*`, `tests/`, `docs/`, `.github/workflows/`, `deploy/`, `cpanel-production/` | Complete for the areas listed in §2–§3 |
| Schema/migration parity | executed `node scripts/check-schema-migrations.mjs` | PASS — 64 models, 15 migrations, 67 tables, all scalar columns present |
| Inventory drift | executed `node scripts/generate-inventories.mjs --check` | PASS — 64 models, 107 API routes, 48 pages, manifest current |
| Project index drift | executed `node scripts/generate-project-index.mjs --check` | PASS |
| Existing test suite | **not executed** | No `node_modules`, no `bun` in this environment; `package.json` runs `bun test`. Prior repo docs claim 722 passing tests — that is **historical evidence, not re-verified here** |
| Production build | **not executed** | Same reason (dependencies not installed) |
| Database | **not present** (`db/` empty, no `.env`, no `*.db`) | No risk of touching owner data; also means no runtime data could be inspected |
| Production host (`103.231.239.79`) | **not contacted** | No SSH, no credentials, no traffic |
| Telephony / AI providers | **not contacted**; no account, no key | All provider statements below are from published documentation and are labelled as such |
| Local model benchmarking | **impossible in this environment** | 2 vCPU / 3 GB RAM / no GPU; outbound network is restricted to GitHub, npm and PyPI, so Hugging Face model weights cannot even be downloaded here |

**Consequence:** this document contains no invented call records, phone numbers, usage figures, WER/MOS numbers, latency numbers or billing data. Where a number appears, it is either (a) counted from this repository, or (b) quoted from a named public source and marked **unverified by us**.

---

## 1. Executive summary

**বাংলা সারসংক্ষেপ:** বর্তমান রিপোজিটরি একটি ইংরেজি পরীক্ষা ও CRM প্ল্যাটফর্ম — এতে কোনো টেলিফোনি, কোনো AI ভয়েস ইঞ্জিন, কোনো মাল্টি-টেন্যান্ট মডেল এবং কোনো রিয়েল-টাইম অডিও পথ নেই। ভয়েস কল সেন্টার তৈরির আগে যে ভিত্তিগুলো কাজে লাগবে (লগইন, পারমিশন, অডিট লগ, কনসেন্ট রেজিস্টার, ওয়েবহুক সিগনেচার, আউটবক্স কিউ, ডকুমেন্ট স্টোরেজ) সেগুলো বাস্তবে আছে এবং পরীক্ষিত। কিন্তু আসল টেলিফোনি ও ভয়েসের জন্য নতুন ইনফ্রাস্ট্রাকচার, নতুন ডাটাবেস (SQLite নয়) এবং বাংলাদেশে লাইসেন্সধারী ক্যারিয়ার পার্টনার দরকার। এই ডকুমেন্টে কোনো ভুয়া কল রেকর্ড, নাম্বার বা ব্যবহারের তথ্য নেই।

The repository is a **production-oriented English-exam and CRM platform** (Next.js 16 standalone, Prisma 6, SQLite, 64 models, 107 API routes, 41 test files, a disciplined audit/documentation culture). It is a genuinely good *foundation* for the administrative half of a contact center — identity, permissions, consent, audit, outbound messaging, document storage — and it contains **nothing** of the telephony half.

Three findings dominate the plan:

1. **There is no tenancy model and no tenancy enforcement layer.** `src/lib/rbac.ts` is titled "RBAC + Multi-Tenancy helpers", but `prisma/schema.prisma` contains **zero** `tenantId` / `businessId` / `organizationId` columns (verified by `grep`), and `Team`/`TeamMember` is a staff-grouping construct, not a data boundary. A multi-tenant voice SaaS cannot be layered on this without a new schema and a new enforcement layer. Claiming tenant isolation today would be false.
2. **The platform's data layer is SQLite in single-writer fork mode**, and the whole host is tuned around that (`SERVER-SPEC.md`: PM2 fork, `127.0.0.1:3055`, "never run cluster mode"). Real-time call state, concurrent agent sessions, usage metering at call granularity and per-tenant billing are write-heavy, multi-worker workloads. SQLite is not the right engine for the contact-center domain, and changing engine is a migration the owner must approve.
3. **Bangladesh does not allow ALO to terminate PSTN calls by itself.** Real phone numbers and calls require a licensed counterparty (today: IPTSP / ICX / IGW under ILDTS policy; a unified telecom licensing policy is replacing that framework, with IGW/ICX/IIG/NIX types to be phased out by 2027). BTRC's Call Center Licensing Guideline (2008) also constrains how call-center networks may interconnect and requires CDR availability and Government interception access. This is a **business/legal gate**, not an engineering one, and it is the single largest schedule risk in the programme.

Everything that can be validated without a carrier — Bangla TTS, Bangla ASR, LLM reasoning, IVR logic, routing, CRM, analytics, billing — can be built and measured **locally and honestly**. Everything that touches a real phone line waits for a carrier relationship.

---

## 2. What the repository actually is (counted, not assumed)

| Property | Value | How verified |
|---|---|---|
| Product | `alo-english-test-platform` v1.1.0 — English exam practice + study-abroad CRM | `package.json` |
| Framework | Next.js `^16.1.1` (App Router), React `^19`, TypeScript 5, Tailwind 4 | `package.json`, `src/app` |
| Build | `next build --webpack` → `output: "standalone"` + `scripts/finalize-standalone.mjs` | `next.config.ts`, `package.json` |
| Runtime entry | repository-root `server.js` → `.next/standalone/server.js`, `HOSTNAME=0.0.0.0` | `server.js` |
| Database | **SQLite** via Prisma 6.11 (`provider = "sqlite"`) | `prisma/schema.prisma` lines 1–12 |
| Models / tables | 64 models, 67 tables, 15 migrations, 1,716 lines of SQL | `check-schema-migrations.mjs` output |
| API routes | 107 handlers, 48 pages | `API_INVENTORY.csv`, `ROUTE_INVENTORY.csv` |
| Tests | 41 test files (`bun test tests/`) | `ls tests/*.test.ts` |
| Auth | bcrypt(12) + HMAC-SHA256 stateless cookie (24 h), `AUTH_SECRET` ≥ 32 chars | `src/lib/auth.ts` |
| Authorisation | legacy role strings + `Role`/`Permission`/`RolePermission` + `TeamMember`; object-level scope | `src/lib/rbac.ts`, `src/lib/crud-scope.ts` |
| Rate limiting | **in-process** sliding window (`Map`) | `src/lib/rate-limit.ts` |
| Audit log | insert-only `AuditLog` with a typed action union | `src/lib/audit.ts` |
| Background work | cron-triggered route handlers + `MessageOutbox` retry queue | `src/app/api/crm/messages/queue/run`, `src/lib/crm/outbox-runner.ts` |
| Realtime transport | **none** — no `ws`, no `socket.io`, no SSE in `src/lib` or `src/app` | `grep` |
| File storage | local filesystem under `UPLOAD_DIR`, content/version-addressed, outside web root | `src/lib/crm/document-storage.ts`, `src/lib/paths.ts` |
| AI | provider chain (local OpenAI-compatible → Groq → OpenRouter → Gemini → HuggingFace → rule engine); local endpoint has circuit breaker, queue, cache, token accounting | `src/lib/ai/providers/ai-provider.ts`, `src/lib/ai/local/endpoint.ts`, `src/lib/ai/routing/ModelRouter.ts` |
| RAG | `RagEngine` — **but it calls `z-ai-web-dev-sdk`**, i.e. an external vendor SDK, not a local index | `src/lib/ai/rag/RagEngine.ts` |
| Messaging | WhatsApp/Messenger/Instagram/SMS/email ingestion + idempotent outbox + consent gate + HMAC webhook verification | `src/lib/crm/*`, `tests/webhook-signature.test.ts` |
| Deployment | Ubuntu 22.04, PM2 fork, Nginx → `127.0.0.1:3055`, Cloudflare Flexible SSL; DB file outside the checkout; nightly `sqlite3 .backup` | `SERVER-SPEC.md`, `deploy/` |
| Legacy surface | `cpanel-production/` — 137 PHP files served to SUPER_ADMIN as deliverable artifacts | `FILE_MANIFEST.csv` |
| Optional submodule | `vendor/linkis` (Apache Linkis, Apache-2.0), **not initialised**, `LINKIS_ENABLED=false` by default | `.gitmodules`, `docs/LINKIS_INTEGRATION.md` |

### 2.1 Honest verdict on the existing codebase

- **Engineering culture: strong.** Fail-closed scoping, provenance gates, additive-only migrations, "no fake data" rules, evidence-labelled audits, CI that provisions the database exactly as production does and boots the artifact. This is a better starting point than most greenfield projects.
- **Domain: unrelated.** There is no SIP stack, no media path, no ASR/TTS runtime, no call model, no queue engine, no agent-state machine. `grep -ri "sip|telephony|asterisk|freeswitch|webrtc|ivr"` returns only unrelated matches (a question-bank comment and reference-link docs). Zero telephony code exists.
- **Scale envelope: small.** Single box, single Next.js process, single SQLite writer, in-memory rate limits, cron-driven workers. Fine for an exam site; not fine for concurrent call state, WebSocket fan-out and per-second metering.

---

## 3. Reusable foundations (and exactly how they will be reused)

| Capability | Where | Status | Reuse in the voice product |
|---|---|---|---|
| Password hashing + signed session cookie | `src/lib/auth.ts` | VERIFIED (source) | Keep for console/agent login; **add server-side session revocation + MFA** (see §4.9) |
| Permission model (roles → permissions → role-permission) | `src/lib/rbac.ts`, `prisma` `Role/Permission/RolePermission` (seeded 9 roles / 44 permissions per `SECURITY.md`) | PARTIAL | Extend with voice-specific permissions (`calls.listen`, `calls.record.export`, `voices.clone.approve`, `numbers.provision`) |
| Object-level scoping, fail-closed | `src/lib/crud-scope.ts` | VERIFIED (tests exist per `tests/crud-scope.test.ts`) | Template for the tenant-scope helper. **But it scopes by role ownership, not by tenant** — cannot be reused as-is |
| Audit log, typed, insert-only | `src/lib/audit.ts`, `AuditLog` model | VERIFIED | Reuse verbatim for provisioning, recording access, transcript export, credit adjustments, cloning consent changes |
| Consent register with evidence requirement, global marketing opt-out, inbound "বন্ধ করুন" detection | `src/lib/crm/consent.ts`, `CommunicationConsent` | VERIFIED (30 tests per `docs/COMMUNICATION_HUB.md`) | **Directly reusable** — voice/recording consent is the same shape. Needs `VOICE`/`RECORDING` channel + purpose values and a call-scoped variant |
| Send-policy gate (consent, channel window, daily cap, quiet hours) | `src/lib/crm/messaging-policy.ts` | VERIFIED (12 tests) | Template for **dialing policy**: calling hours, attempt caps, DNC suppression, frequency limits |
| Idempotent outbound queue with bounded backoff | `src/lib/crm/outbound.ts`, `outbox-runner.ts`, `MessageOutbox` | VERIFIED (46 tests) | Template for the `CallJob` queue (outbound campaigns) and for webhook/event ingestion |
| Webhook signature verification, constant-time, multi-scheme | `src/lib/crm/webhook-signature.ts` | VERIFIED (forgery-focused tests) | Reuse for carrier and CPaaS event callbacks (Twilio-style `X-Twilio-Signature`, Meta `X-Hub-Signature-256`, generic HMAC) |
| Private, version-addressed document storage; traversal + tamper tests | `src/lib/crm/document-storage.ts` | VERIFIED (15 tests) | Pattern for recordings **only for prototypes** — production needs object storage + encryption + lifecycle policy (§4.8) |
| Phone identity matching with ambiguity guard, BD normalisation | `src/lib/crm/identity.ts` | VERIFIED (8 tests) | Reuse for inbound caller identification (`+8801…` normalisation) |
| Integration registry (licence + purpose + env var + degraded behaviour) | `src/lib/integrations/registry.ts` | VERIFIED (secret-leak test) | **Reuse as the pattern** for carrier/voice/payment adapters — one registry, licence, and honest "off" state |
| Local-model adapter with breaker + queue + cache | `src/lib/ai/local/endpoint.ts` | VERIFIED (source) | Reuse shape for the ASR/TTS service clients |
| Agent workforce with approval gates | `AgentDefinition/AgentJob/AgentApproval/AgentMetric`, `scripts/agent-worker.mjs` | PARTIAL | Reuse approval concept for privileged voice operations (number provisioning, cloning, campaign launch) |
| Migration/CI discipline | `scripts/check-schema-migrations.mjs`, `.github/workflows/ci.yml` | VERIFIED (that the script passes; CI not run here) | **Compulsory** for the new schema — every voice table must ship with a migration and parity must stay green |

**What must be resisted:** wiring voice tables into the existing SQLite schema "to move fast". Every subsequent console screen, report and billing calculation would inherit a data model that cannot isolate tenants or sustain concurrent call state, and the cost of fixing it grows with every week of use.

---

## 4. Hard blockers (each one is a decision, not a task)

### 4.1 No tenancy model — BLOCKED
`grep -n "tenantId\|businessId\|organizationId" prisma/schema.prisma` → **0 matches**. `Team` is a staff grouping with `TeamMember`; it does not own phone numbers, calls, agents, recordings or knowledge bases. `src/lib/crud-scope.ts` scopes by role/ownership (counsellor sees own leads), which is *intra-organisation* access control, not *inter-organisation* isolation.

**Decision needed:** introduce `Business` (tenant) as the root entity with `tenantId` on every tenant-owned table, plus a single guard used by every query path. **Implementation must be a new database (PostgreSQL), not a column bolted onto SQLite.**

### 4.2 SQLite single-writer — BLOCKED for the contact-center domain
`SERVER-SPEC.md` §2 and §8 state the app must run as a **single PM2 fork** because "SQLite has a single writer". Contact-center workloads write per call leg, per DTMF digit, per queue transition, per heartbeat (agent presence every few seconds), per metering tick. Multiple media nodes and workers cannot share a SQLite file.

**Decision needed:** PostgreSQL (already installed on the host per `SERVER-SPEC.md` §1 but "not used by this app"), with Redis for call-state/presence. Optional: keep the exam platform on SQLite and give the voice product its **own** database and process — strongly preferred, because it avoids migrating a live exam platform's 64-model schema with zero user-visible benefit and non-trivial risk.

### 4.3 No telephony and no legal pathway to a phone number — BLOCKED (external)
Public BTRC material (quoted, not independently legal-verified):

- **IPTSP licence** is issued **only to ISP licensees**; international IP voice must transit licensed **ICX/IGW**; licensees "shall not bypass Licensed IGW and ICX"; VSAT/IIG transport of voice is prohibited; lawful interception (LI) equipment at the National Monitoring Centre is a licence obligation (BTRC *Amended Regulatory and Licensing Guidelines for IPTSP*, lims.btrc.gov.bd).
- **Call Center Licensing Guideline (BTRC, 2008)** distinguishes international call centres / HCC / HCCSP; requires separation of office lines from the call-centre network; permits interconnection between call centres of the *same* client only with prior approval; **prohibits interconnection between domestic and international call centres**; requires CDRs to be furnished to the Commission on demand; and grants "authorized Government law enforcing agencies … the right to intercept the traffic/data originated/terminated at the Call Centers/HCCSP".
- A **unified telecom licensing policy** is being drafted that replaces ILDTS 2010 with four categories (access, national infrastructure, international connectivity, non-terrestrial) plus a registration-based "telecom-enabled services" class, with **IGW/ICX/IIG/NIX licences phased out by 2027** (SAMENA/industry reporting, Sept–Oct 2026). *Framework in transition — every assumption below must be re-checked with counsel before contracting.*

**What this means for product design:** ALO can build and sell the software, but **cannot itself give a Bangladeshi business a phone number**. Numbers must be provisioned *through* a licensed partner, and the "network diagram" on our side ends at the partner's SDP/SIP trunk. The multi-tenant question — may one licensed call centre host multiple unrelated client businesses on our platform, or does each tenant need its own authorisation? — is **unresolved and legally material**. It must be answered by a Bangladeshi telecom lawyer before Phase 2 accepts a single tenant.

### 4.4 No real-time audio path and no media server — MISSING
No WebSocket server, no SIP stack, no RTP handling, no VAD, no jitter buffer, no streaming ASR/TTS client. Everything on the "Customer → Gateway → VAD → ASR → LLM → TTS → Customer" path is new. See `docs/TELEPHONY_ARCHITECTURE.md` §4.

### 4.5 No Bangla voice engine of any kind — MISSING
The only speech in the repo is `scripts/generate-listening-audio.mjs`, which shells out to **`edge-tts`** (a Python package calling Microsoft's hosted Edge TTS service) to synthesise English listening assets locally into `public/audio/listening/`. That is: (a) English only, (b) a **hosted third-party service**, not local inference, (c) explicitly documented as requiring outbound internet, and (d) *not* licensed for commercial redistribution of the resulting audio in the way the product would need. There is **no Bangla TTS, no ASR, no diarisation, no voice cloning, no speaker identification** in the repository.

**Decision needed:** approve the model shortlist and the evaluation protocol in `docs/BANGLA_VOICE_MODEL_EVALUATION.md`, and provide the hardware to measure it.

### 4.6 The existing "local-first AI" story is partly untrue — PARTIAL
`src/lib/ai/local/endpoint.ts` is a genuinely good local-inference client (breaker, queue, cache, token accounting) — but it is **off by default** (`AI_LOCAL_MODEL_ENABLED`), and `src/lib/ai/rag/RagEngine.ts` imports **`z-ai-web-dev-sdk`** and calls `ZAI.create()` for the assistant/RAG answers. So the platform's "ask the handbook" feature depends on an external vendor SDK even when no provider key is configured. Any claim that the current stack is fully local would be inaccurate.

### 4.7 No knowledge-base indexing for tenancy — MISSING
`RagEngine` retrieves `StudyMaterial` chunks with an `isPublic` flag — no tenant scoping, no document permissions, no per-document versioning of the index, no retrieval audit log. Module K's requirements (tenant isolation, source references, retrieval audit) are entirely new work.

### 4.8 Recording storage, retention and consent enforcement — MISSING
There is no recording concept at all: no model, no storage adapter, no retention policy, no encryption-at-rest story beyond filesystem permissions, no dual-channel requirement, no consent gate tied to a specific call, no legal-hold. The document-storage module is the right *shape* (outside web root, authorised download route, audit each access) and the wrong *scale* (local disk, no object storage, no lifecycle).

### 4.9 Authentication hardening gaps — PARTIAL
- `mfaEnabled` / `mfaSecret` columns **exist**, but `grep -rln "mfaEnabled\|totp\|MFA" src` returns **no implementation**. MFA is a schema placeholder, nothing more. The brief requires MFA for privileged accounts.
- Sessions are stateless HMAC cookies with a fixed 24 h TTL; there is **no revocation** (documented as an accepted risk in `docs/FEATURE_GAP_REGISTER.md` FR-003). An agent who is dismissed keeps access until expiry unless `AUTH_SECRET` is rotated (which logs everyone out).
- Rate limiting is **in-process memory** — per-instance, resets on deploy, useless across nodes.
- `src/proxy.ts` explicitly does **not** authenticate: every route must enforce auth itself. For a voice platform with carrier webhooks and audio endpoints, a central authentication gate is required.

### 4.10 No object storage, no message broker, no observability stack — MISSING
Recordings, transcripts and model audio need object storage with lifecycle rules. Campaigns, call events and metering need a durable queue (the DB outbox pattern is fine at CRM volumes; it will not carry per-second call telemetry). There is no metrics/tracing pipeline (the repo's `docs/OPEN-SOURCE-AUDIT.md` lists OpenTelemetry only as a *reference*, not a dependency).

### 4.11 Host capacity is unknown — BLOCKED for any capacity claim
`SERVER-SPEC.md` documents OS, Node, PM2, Nginx, Cloudflare, ports — **not CPU cores, RAM, disk or bandwidth**. Local TTS/ASR sizing, concurrent-call capacity and even whether the existing exam site will survive co-tenancy on the same box cannot be stated. This sandbox (2 vCPU / 3 GB / no GPU) is *evidence-gathering only* and must never be used to quote capacity.

---

## 5. Capability matrix — 15 modules vs. what exists today

Legend for **Runs locally?**: `LOCAL` = can be built, tested and demoed with no carrier and no paid API; `EXTERNAL` = fundamentally requires licensed external infrastructure; `HYBRID` = logic local, legs/numbers external.

| # | Module | Today | Reuse | Must build | Runs locally? |
|---|---|---|---|---|---|
| A | Cloud Business Phone System | **MISSING** (0 telephony code) | Audit, RBAC, consent | Media server, SIP edge, dialplan-as-data, number inventory, call state machine, IVR engine, queues, transfers, voicemail | **HYBRID** — internal/extensions/WebRTC-local calls can be fully local; PSTN legs need a licensed trunk |
| B | AI Voice Agent Platform | **MISSING** (LLM adapter only) | provider chain, local endpoint, approval pattern | Agent config model, prompt/flow engine, tool calling, orchestration, barge-in, handoff, summaries | **LOCAL** (text/WebRTC) |
| C | Bangla Voice Generation Studio | **MISSING** (English edge-tts script only) | recorder, MP3 validation utils | TTS service, voice library, prosody controls, pronunciation dictionary, batch/streaming, voice design, consented cloning | **LOCAL** (needs GPU/CPU sizing) |
| D | Multilingual ASR | **MISSING** | — | Streaming + batch ASR service, diarisation, punctuation, custom vocabulary, correction workflow | **LOCAL** |
| E | Inbound AI Call Center | **MISSING** | consent, identity, CRM writes | IVR/AI receptionist flow, language+intent, lookup, actions, transfer, recording, summary, CRM + tasks | **HYBRID** |
| F | Outbound AI Calling | **MISSING** | outbox/idempotency, send-policy, consent | Campaign model, contact lists, scheduler with time zones, retry/attempt limits, DNC, dialing-hours, outcome classification | **HYBRID** (WebRTC-local campaigns possible; PSTN needs trunk + compliance) |
| G | Human Agent Contact Center | **MISSING** | RBAC, audit | Agent workspace, presence state machine, softphone, supervisor monitor/whisper/barge (consented), QA review | **HYBRID** |
| H | CRM & Customer 360 | **PARTIAL** — lead/student/appointment/task/note CRM exists for the education domain | `crud.ts`, `crud-scope.ts`, `Lead`, `Student`, `TimelineEntry`, `DuplicateDetection`-ish logic | Voice-specific customer model, call-to-CRM association, tenant scoping, CSV import/export, external CRM connectors | **LOCAL** |
| I | Omnichannel | **PARTIAL** — WhatsApp/Messenger/Instagram/SMS/email ingestion, consent, outbox, templates | Almost all of `src/lib/crm/*` | Voice channel in the unified timeline, shared inbox UI, AI-assisted reply with human approval | **LOCAL** (provider credentials external) |
| J | AI Call Intelligence | **MISSING** | LLM adapter, evaluation rubrics | Transcript pipeline, summariser, intent/topic/sentiment (labelled as estimates), QA scoring, evidence links | **LOCAL** |
| K | Agent Knowledge Base | **PARTIAL/broken** — `RagEngine` exists but is external-SDK and single-tenant | chunk model, upload path | Local embedding + vector index, tenant isolation, permissions, versioning, re-index, retrieval audit, "don't invent prices" guard | **LOCAL** |
| L | Super Admin Center | **PARTIAL** — super-admin dashboards, health screen, agent registry, settings, audit | dashboards, `/api/health`, `/super-admin/health` | Global tenant view, provider health, number inventory, usage/billing admin, cost reconciliation | **LOCAL** |
| — | Multi-tenancy | **MISSING** (§4.1) | — | Tenant root entity + enforcement + per-tenant secrets | **LOCAL** |
| — | Billing & usage | **MISSING** (FreeQuota + Payment stubs; payment route deliberately 503) | Payment stub's honesty | Metering, plans, credits, invoices, adjustments, provider cost reconciliation | **LOCAL** (payment provider external) |
| — | Developer platform | **MISSING** | audit, webhook signature | API keys (scoped, hashed), rate limits, idempotency, signed webhooks, docs, SDK | **LOCAL** |

---

## 6. Local vs. external — the honest split

**Can be built and *proven* with zero external dependency (no carrier, no paid API):**
tenant model · auth/RBAC/MFA · agent registry · usage metering · audit · Bangla TTS & ASR services (on suitable hardware) · voice generation studio · voice library & design · consented cloning workflow · knowledge base & retrieval · IVR/flow engine · queueing & routing algorithms · AI conversation orchestration over **WebRTC** (browser-to-browser / browser-to-softphone) · agent workspace · supervisor tools · CRM · omnichannel inbox · call intelligence · admin console · billing engine (with a fake, clearly-labelled payment adapter) · developer API · latency and load measurement harness.

**Cannot exist without licensed external infrastructure:**
real Bangladeshi PSTN numbers (DID) · inbound calls from mobile/landline · outbound termination to mobile/landline · international termination · caller-ID (CLI) presentation rights · SMS sender-ID/masking · WhatsApp Business messaging (Meta approval) · e-mail deliverability · payment capture · lawful-interception obligations that attach to a licensed operator.

**Test SIP environment (Phase 2 entry condition):** a lab FreeSWITCH/Asterisk pair plus at least one softphone and a SIPp load generator can exercise *signalling and media* end-to-end over loopback/LAN with **no carrier at all** — that is how inbound routing, queues, transfers, hold, recording and barge-in must be validated *before* a real number is attached. This satisfies "use a test SIP environment before connecting production numbers" without pretending a demo call is a phone call.

---

## 7. Licence and dependency audit

**Existing dependencies (from `package.json`):** Next.js (MIT), React (MIT), Prisma (Apache-2.0), Zod (MIT), bcryptjs (MIT), Tailwind (MIT), Radix UI (MIT), recharts (MIT), sharp (Apache-2.0), `z-ai-web-dev-sdk` (**vendor SDK — terms unknown; must be reviewed, and it is on the critical path for RAG**). No copyleft dependency is currently bundled. `vendor/linkis` is Apache-2.0 and uninitialised.

**Candidate voice/telephony components — licence status as published (all must be re-verified at pin time):**

| Component | Purpose | Licence (published) | Commercial consequence |
|---|---|---|---|
| FreeSWITCH | media server / softswitch | **MPL 1.1** | Permissive-leaning; MPL files stay MPL, no obligation to open our code. Preferred for a closed-source product |
| Asterisk | PBX / media | **GPLv2** (+ Sangoma commercial dual-licence) | Copyleft; distributing a derived/modified binary triggers source obligations. Safe as an unmodified separate process, risky as embedded/extended |
| Kamailio | SIP edge/proxy | **GPLv2+** (some BSD parts) | Run as a separate process at the edge; do not link |
| FreePBX | Asterisk GUI | **GPLv3+** | Not recommended for embedding |
| SIP.js / JsSIP | browser SIP | **MIT** | Safe |
| coturn | TURN/STUN for WebRTC | BSD-3 (verify) | Safe |
| Piper (engine) | TTS | **MIT (archived `rhasspy/piper`)** → **GPL-3.0 (active `OHF-Voice/piper1-gpl`)** | **Licence changed in 2025.** Active engine is copyleft → embedding in a proprietary SaaS needs legal review; per-voice model licences vary and must be checked individually (`MODEL_CARD`) |
| XTTS v2 (Coqui) | TTS/cloning | code MPL-2.0; **weights CPML — non-commercial** | **Excluded** from production; Coqui dissolved in 2024, so no commercial licence can be bought |
| Meta MMS-TTS (`mms-tts-ben`) | Bangla TTS | **CC-BY-NC 4.0** | **Excluded** from production (non-commercial) |
| Indic Parler-TTS (AI4Bharat) | Indic TTS incl. Bengali | **Apache-2.0**, gated | Candidate. Trained on IndicTTS (predominantly Indian Bengali) → **accent mismatch risk for bn-BD**; gating terms must be confirmed |
| Orpheus 3B Bangla fine-tunes | Bangla TTS | repo declares **Apache-2.0**, but base is **Llama-3.2-3B-Instruct** (Llama community licence + gated access) | Inherited upstream terms; acceptable-use and redistribution must be reviewed. Heavy (3B) → GPU |
| Bangla VITS checkpoints (e.g. `EMTIAZZ/bangladeshi-bangla-tts-vits`) | bn-BD TTS | declared **Apache-2.0** | Candidate; **training-data provenance and speaker consent unknown** → cannot be used until documented |
| `BanglaTTS` (PyPI) | bn TTS wrapper | MIT (wrapper) | Wrapper licence says nothing about the model it fetches |
| `zabir-nabil/bangla-tts` | bn TTS | **GPL-3.0** | Copyleft — reference only |
| Whisper / faster-whisper | ASR | **MIT** (weights MIT) | Safe |
| Bangla Whisper fine-tunes (e.g. `BuzzASR/bengali`, MIT per its listing) | ASR | **MIT** (verify per checkpoint) | Candidates; quality claims must be re-measured on Bangladeshi audio |
| edge-tts (current listening-audio generator) | TTS | Microsoft service terms | **Not a production voice source**; terms cover personal/non-commercial style use and the service is undocumented/unsupported for product synthesis |
| Silero VAD | VAD | MIT (verify) | Candidate for streaming VAD |

Two rules follow, and they should be written into the repo as policy:

1. **A model's code licence is not its weight licence, and a weight licence is not a voice-rights licence.** All three must be recorded before a voice is exposed to a customer.
2. **No copyleft component may be embedded in the proprietary runtime without written legal approval**; process-level use (Kamailio, FreeSWITCH via network APIs) is the acceptable default.

---

## 8. Risk register (Phase 0)

Severity × likelihood are qualitative; each risk names the decision that closes it.

| ID | Risk | Likelihood | Impact | Mitigation | Decision owner |
|---|---|---|---|---|---|
| R-01 | No licensed BD telephony partner → no real calls, product remains a demo | High | Critical | Contract a licensed IPTSP/ICX/IGW partner (or ASP/HCC model); do not promise numbers before a contract exists | Owner + counsel |
| R-02 | BTRC Call-Centre/interconnection rules forbid multi-tenant hosting under one licence | Medium | Critical | Written legal opinion before Phase 2 accepts tenants; design per-tenant SIP domain so a per-tenant authorisation model is possible | Owner + counsel |
| R-03 | Regulatory framework in transition (unified licensing policy; IGW/ICX phase-out by 2027) | High | High | Architecture must treat "carrier" as a replaceable adapter; no regulatory logic hard-coded | Owner |
| R-04 | PDPA 2026 obligations (consent, purpose limitation, data-subject rights, possible localisation of confidential data, no mandated breach notification per commentary) | High | High | Consent-first design already exists; hosting in BD by default; DPO, records of processing, DSR workflow, DPAs with every provider | Owner + counsel |
| R-05 | Bangla voice quality insufficient (Whisper-class ASR is weak on Bangla; TTS options are Indian-accented or unproven) | High | High | Measure before promising (`BANGLA_VOICE_MODEL_EVALUATION.md`); keep adapters swappable; human fallback always available | Owner (accepts quality gate) |
| R-06 | Model licence blocks commercial use (XTTS/CPML, MMS/CC-BY-NC, Piper GPL, Llama terms) | Medium | High | Licence register per model; exclude NC models from the runtime; written review before deployment | Owner + counsel |
| R-07 | Voice cloning misuse → legal/reputational harm | Medium | Critical | Consent + identity verification + revocation + audit + abuse detection; cloning **off by default** per tenant; no celebrity voices | Owner |
| R-08 | Recording without valid consent → legal exposure | Medium | Critical | Per-call consent evidence; recording disabled by default; jurisdiction policy engine; retention + deletion | Owner + counsel |
| R-09 | SQLite cannot carry call state / metering | High | High | PostgreSQL for the voice product; Redis for live state; **new database, additive, no migration of the exam platform** | Owner |
| R-10 | Tenant data leakage in a shared platform | Medium | Critical | `tenantId` everywhere + central guard + Postgres RLS + cross-tenant tests in CI + adversarial review | Engineering |
| R-11 | Host capacity insufficient (unknown CPU/RAM; exam site co-tenancy) | High | High | Measure the host; separate voice hardware; never quote capacity before load test | Owner |
| R-12 | AI invents prices/policies/commitments on a live call | High | High | Retrieval-grounded answers only, mandatory citations, confidence threshold → clarify or hand off, no free-text commitments, transcript review | Engineering |
| R-13 | AI falsely claims an action/transfer succeeded | Medium | High | Tool results are the only source of truth; "transferred" only after a confirmed SIP event; failure paths scripted | Engineering |
| R-14 | Provider outage during a campaign/call | Medium | Medium | Adapter-level circuit breakers, graceful degradation, queue pause, operator alerting | Engineering |
| R-15 | Cost blowout (PSTN minutes, GPU hours, TTS characters) | Medium | Medium | Hard usage caps per tenant, pre-flight cost estimate, kill switch, provider-cost reconciliation | Owner |
| R-16 | Secret sprawl across carriers/tenants | Medium | High | Central secret manager, per-tenant credentials envelope-encrypted, no secrets in DB plaintext, rotation runbook | Engineering |
| R-17 | No MFA / no session revocation on privileged accounts | High | High | Implement TOTP + server-side session table + step-up auth for provisioning/cloning/refunds | Engineering |
| R-18 | Phase 0 documents drift from reality | Medium | Medium | Every phase closes with an evidence table; docs are re-audited at each gate (repo convention) | Engineering |
| R-19 | Owner expectation gap: "CallHippo clone in a sprint" | High | High | This document: 15 modules, new data layer, external dependencies, phased gates | Owner |
| R-20 | Legal intercept requests / surveillance pressure on a platform we operate | Low | Critical | We are not a licensed operator; LI attaches to the carrier. Written policy: no covert monitoring features; comply only via lawful process with counsel | Owner + counsel |

---

## 9. Decisions required before Phase 1

These are blocking. None can be answered by engineering alone.

1. **Scope of "voice" for the first release.** Recommended: *AI inbound receptionist + human agent workspace over WebRTC + Bangla TTS/ASR studio, in one tenant, on internal/test SIP.* Outbound PSTN campaigns, international numbers and voice cloning come later. (Cheapest path to something real and defensible.)
2. **Domain separation.** Recommended: the voice product is a **separate application + PostgreSQL database** in the same monorepo, sharing only libraries (auth primitives, consent, audit, webhook verification) — **the live exam platform is not migrated**.
3. **Telephony partner.** Who is the licensed counterparty, which licence class (IPTSP/ICX/IGW/ASP/HCC), and does it permit multi-tenant hosting? Until answered: **no phone numbers, no real calls, no PDPA-compliant recording of real people.**
4. **Hosting region and capacity.** Confirm CPU/RAM/GPU on `alo-server-lap`, and whether voice may share that host. Provide separate hardware if not.
5. **Voice-model shortlist & quality bar.** Approve the candidates in `BANGLA_VOICE_MODEL_EVALUATION.md` and the numeric acceptance thresholds (WER/CER/MOS/latency) — including the possibility that **no local model passes** and Phase 3 stays in "human-agent + recorded prompts" mode.
6. **Recording & cloning policy.** Default state for both (recommend: recording **off** until a tenant sets a consent-bearing policy; cloning **off** by default and never without a signed consent record and a revocation path).
7. **Billing model.** What is metered (call minutes, AI minutes, TTS characters, ASR seconds, storage, users) and whether any of it may be invoiced before provider costs are actually known. Recommended: meters first, money later.
8. **Approval workflow for privileged operations** (number provisioning, campaign activation, cloning approval, credit adjustment): who signs, in which system, with what audit trail.

---

## 10. What Phase 0 deliberately did not do

- No dependency installation, no `npm install`, no model download, no container images pulled.
- No schema change, no migration, no database creation or modification.
- No telephony configuration, no SIP registration, no number request, no trial signup, no paid service activated.
- No changes to `prisma/`, `src/`, `deploy/`, `.github/`, or any production setting.
- No fabricated dashboards, demo call records, sample numbers, sample analytics or sample billing.
- No claim that any voice/telephony capability works — because none does yet.

**Phase 0 deliverables:** this audit, `TELEPHONY_ARCHITECTURE.md`, `BANGLA_VOICE_MODEL_EVALUATION.md`, `PROVIDER_COMPATIBILITY.md`, `SECURITY_AND_COMPLIANCE.md`, `IMPLEMENTATION_ROADMAP.md`.

**Status: STOPPED at the Phase 0 gate. Phase 1 does not begin until decisions §9.1–§9.8 are answered in writing.**
