# Implementation Roadmap — ALO Voice & Contact Center

**Document:** `docs/IMPLEMENTATION_ROADMAP.md`
**Phase:** 0 output. **No phase below has been started.**
**Date:** 2026-10-31
**Gate:** Phase 1 begins only after the owner answers §9 of `VOICE_CONTACT_CENTER_AUDIT.md` in writing.

---

## 0. Shape of the programme

Three things run in parallel from the start, because they have different clocks:

| Track | Clock | Why it is separate |
|---|---|---|
| **A — Legal & carrier** | weeks to months, outside our control | A licensed partner and counsel answers gate all real telephony. Start first, because it is the long pole |
| **B — Platform & product** | engineering-paced | Tenancy, auth, media layer, agent workspace, CRM, analytics, billing — all buildable and testable with no carrier |
| **C — Bangla voice quality** | hardware-dependent | Requires GPU time and a frozen test set; produces the go/no-go on autonomous AI calls |

**Sequencing principle:** build the *thin vertical slice* that can be demonstrated end-to-end in lab mode (WebRTC caller → IVR → queue → human agent → wrapped call → CRM record → transcript) **before** widening into campaigns, billing, cloning, and international numbers. A product that makes one honest internal call is worth more than fifteen screens of configuration.

**No demo data anywhere.** Every screen must be either (a) empty with an explanation of what will fill it, or (b) populated by a real, test-initiated call.

---

## 1. Phase map with gates

```
Phase 0  Audit & design            [DONE — awaiting approval]
   │  gate: owner answers 8 decisions
   ▼
Phase 1  Platform foundation       tenancy · auth · RBAC · metering · audit · adapters
   │  gate: isolation tests + security baseline pass
   ▼
Phase 2  Cloud telephony (lab)     media server · SIP edge · routing · IVR · queues · call state
   │  gate: lab acceptance tests + capacity measured  ──► carrier contract needed for PSTN
   ▼
Phase 3  AI voice engine           Bangla TTS/ASR measured · studio · voice library · consented cloning
   │  gate: native-speaker quality gate (owner-set thresholds)
   ▼
Phase 4  AI call agents            orchestrator · tools · handoff · inbound AI · outbound campaigns
   │  gate: frozen conversation regression + no-invented-commitment tests
   ▼
Phase 5  Human contact centre     agent workspace · supervisor · CRM · shared inbox · call intelligence
   │  gate: role/isolation/consent tests + supervisor-consent review
   ▼
Phase 6  SaaS, billing, developer  plans · metering · invoices · API keys · webhooks · docs
   │  gate: billing correctness + provider cost reconciliation
   ▼
Phase 7  Production validation    security audit · load · real telephony · restore · compliance review
   │  gate: explicit production approval (never implicit)
   ▼
Production
```

---

## 2. Phase detail

### Phase 0 — Audit and design **(this phase)**

**Objectives:** know what exists, state what does not, define the architecture and the plan, surface the legal blockers before money is spent.

**Deliverables (all produced):**
`VOICE_CONTACT_CENTER_AUDIT.md` · `TELEPHONY_ARCHITECTURE.md` · `BANGLA_VOICE_MODEL_EVALUATION.md` · `PROVIDER_COMPATIBILITY.md` · `SECURITY_AND_COMPLIANCE.md` · `IMPLEMENTATION_ROADMAP.md`

**Exit criteria:** owner has read the audit and answered §9.1–§9.8. No code written. No provider contacted.

---

### Phase 1 — Platform foundation

**Objective:** a multi-tenant skeleton that is provably isolated, with the operational plumbing every later phase depends on.

| Work item | Detail | Depends on |
|---|---|---|
| Domain separation | New application (`apps/voice` or equivalent) + **new PostgreSQL database**; shared libraries only (auth primitives, audit, consent, webhook verification, logging). **The live exam platform is not migrated** | D-2 |
| Tenancy | `Business` root; `tenantId` on every tenant-owned table; Postgres RLS; central data-access guard; cross-tenant test suite | — |
| Auth hardening | TOTP MFA (agents/admins), server-side session table + revocation, step-up auth, Redis-backed rate limits | — |
| RBAC for voice | Permissions: `calls.view/listen/record.*`, `agents.*`, `voices.*`, `numbers.*`, `campaigns.*`, `kb.*`, `billing.*`, `tenants.*` | — |
| Agent/staff registry | Users, teams, skills, working hours, holiday calendar, presence model (server-owned FSM) | — |
| Usage metering | Append-only meter events (call seconds, TTS chars, ASR seconds, storage bytes, users) with idempotent aggregation | — |
| Audit & approvals | Reuse `AuditLog` pattern; approval table for privileged operations | — |
| Adapter framework | `AdapterDescriptor` + capability discovery + `health()` + contract-test harness (`PROVIDER_COMPATIBILITY.md` §9) | — |
| Provider registry UI | Shows configured/unconfigured and what degrades; no fake "connected" states | Adapter framework |
| Secret management | Per-tenant envelope encryption; secret rotation runbook | — |
| Observability baseline | Metrics, structured logs with PII redaction, health endpoints, alerting thresholds | — |
| CI extensions | Secret scanning, dependency audit, licence scan, tenancy test suite, schema/migration parity (existing) | — |

**Exit criteria:** two throwaway tenants created; every cross-tenant attack in `SECURITY_AND_COMPLIANCE.md` §4 fails; MFA + revocation demonstrated; meters aggregate with idempotency tests; audit covers all privileged actions; no exam-platform behaviour changed (its tests still pass).

**Estimate:** ~6–10 engineer-weeks (2 engineers), **excluding** legal/counsel time. *Estimate, not a commitment.*

---

### Phase 2 — Cloud telephony in lab mode

**Objective:** a real call, on real SIP/RTP, with no carrier — and honest measurement of what the switch can do.

| Work item | Detail |
|---|---|
| Media layer | FreeSWITCH nodes in containers; ESL event stream; audio forking to the pipeline; `record_session` (dual-channel) |
| SIP edge | Kamailio: TLS, dispatcher, per-tenant SIP domains, NAT, OPTIONS health, SIP rate limits/IPS |
| WebRTC | coturn + SIP.js agent softphone over WSS; ICE/TURN; Opus; DTLS-SRTP |
| Call model | `Call`/`CallLeg`/`CallEvent`; idempotent ingestion; derived status; reconciler |
| Routing | Versioned routing plans (data, not files), validator, simulator, publish/rollback |
| IVR | Node types: play/collect/speak/queue/ring group/transfer/voicemail/webhook/business hours/holiday |
| Queues | Strategies, priorities, max wait, overflow, callback; Redis counters + Postgres snapshots |
| Agent basics | Registration, presence FSM, answer/reject, mute/hold/transfer/conference, disposition, wrap-up |
| Voicemail + missed call | Storage, notification, callback task |
| Recording | Policy engine + `RecordingConsentDecision` gate + object storage + access control (default off) |
| Test environment | SIPp scenarios, softphones, packet capture, fake carrier adapter, PESQ/POLQA |
| Capacity measurement | All §12 tests from `TELEPHONY_ARCHITECTURE.md`; publish measured numbers or "unmeasured" |

**Exit criteria:** lab acceptance suite green (inbound routing, IVR, queue, transfer, hold, conference, recording gate, media-quality checks); failure drills behave as documented; **capacity figures published with the test that produced them**; a written statement of what still requires a carrier.

**Estimate:** ~10–16 engineer-weeks (2–3 engineers), plus ops time for the host.

**Parallel (Track A):** sign the carrier. Nothing in Phase 2 needs it — but Phase 2's *value* to a customer does.

---

### Phase 3 — AI voice engine (Bangla first)

**Objective:** a measured Bangla voice capability, or a documented decision that it is not ready.

| Work item | Detail |
|---|---|
| Evaluation harness | Frozen datasets, normalisation v1, runners, metrics, rater tooling (`BANGLA_VOICE_MODEL_EVALUATION.md` §8) |
| Baseline measurements | faster-whisper large-v3; Indic Parler-TTS; bn-BD VITS; Bangla Whisper/LoRA candidates — on the frozen sets |
| Reporting | Per-candidate report with WER/CER/MOS/CI/agreement, entity accuracy, telephony-band and code-switch results, latency, licence + voice-rights status |
| TTS service | Streaming synthesis, sentence chunking, prosody controls, pronunciation dictionary, output formats |
| ASR service | Streaming + batch, punctuation, timestamps, custom vocabulary, confidence, correction workflow |
| Studio UI | Text→speech, long-form, batch, preview, history, download, per-tenant voice library |
| Post-processing | Noise removal, isolation, enhancement, silence removal, segmentation, SRT/VTT (separate module, off the live path) |
| Voice design | Characteristic-based personas (no real-person impersonation) |
| Consented cloning | Consent + ID verification + approval + provenance + revocation + abuse detection (default off) |
| Knowledge base | Local embeddings + vector index, tenant-scoped, permissions, versioning, re-index, retrieval audit |

**Exit criteria:** owner-approved thresholds met (or the fallback product decision recorded); every shipped voice has a complete licence + rights record; latency measured through the real pipeline; cloning unavailable unless its full consent chain is working.

**Inputs from the 2026-10-31 repository batch:** `jamiepine/voicebox` (MIT) is an approved **reference implementation** to read and audit in this phase; `debpalash/VoiceStudio` (AGPL-3.0) is reference-only and may not be deployed or embedded; `langgenius/dify` is excluded because its licence forbids multi-tenant operation. Rationale and the full licence register additions are in `OPEN_SOURCE_TRIAGE_2026-10-31.md`.

**Estimate:** ~8–14 engineer-weeks + GPU time; **high variance** — model quality is the unknown.

---

### Phase 4 — AI agents and outbound

**Objective:** a conversation that can be trusted on a live call.

| Work item | Detail |
|---|---|
| Agent builder | Full config per brief Module B; versioned; publish/rollback; permissions per agent |
| Orchestrator | Turn-taking, barge-in/cancel, context, tool calls, budgets, loop detection, handoff |
| Tools | `lookup_customer`, `verify_customer`, `check_order`, `book_appointment`, `create_task`, `send_sms`, `transfer_to_human` — typed, idempotent, approval rules |
| Inbound AI receptionist | Language detection + explicit menu, intent, grounding, actions, transfer with context |
| Handoff | Reason codes, transcript package, queue fallback, transfer-failure handling, truthful announcements |
| Summaries & outcomes | Structured call outcome, summary, actions, CRM writes, follow-up tasks |
| Outbound campaigns | Contact lists, scheduling (timezone/holidays), retry/attempt rules, DNC, dialing windows, approval-to-launch, kill switch, outcome classification |
| Conversation regression suite | Frozen multi-turn conversations (Bangla + bn-EN) run for every prompt/model change, asserting grounding, refusal and handoff behaviours |

**Exit criteria:** zero "invented commitment" in the regression suite; barge-in latency within budget; handoff works in both directions; outbound cannot start without approval + suppression report; every AI claim traceable to a tool result or citation.

**Estimate:** ~10–16 engineer-weeks.

---

### Phase 5 — Human contact centre, CRM, intelligence

**Objective:** the half of the product a business actually runs day to day.

| Work item | Detail |
|---|---|
| Agent workspace | Full softphone + customer context + history + notes + KB + tasks + wrap-up |
| Supervisor | Live board, queue monitoring, distribution controls, listen/whisper/barge with consent + indicator + audit, QA review, coaching |
| CRM & Customer 360 | Voice-first customer model, call association, dedupe, custom fields, segmentation, pipeline, import/export |
| Shared inbox | Voice + WhatsApp + SMS + email + web chat in one timeline, assignment, templates, internal notes, AI-assisted replies with human approval |
| Call history & recordings | Search, filters, playback, export (step-up), retention controls |
| Transcription viewer | Timestamps, speakers, confidence, correction, SRT/VTT export |
| Call intelligence | Summaries, intent/topic/objection/action extraction, QA scoring, keyword & repeated-issue detection, CSAT signals — all with evidence links and "estimate" labelling |
| Analytics | Queue SLA, abandonment, AHT, first-contact resolution, agent performance, AI-contained rate, cost per call |

**Exit criteria:** role/isolation/consent tests pass; every intelligence output links to its evidence; supervisor features visibly disclosed to agents; recordings inaccessible without permission + audit.

**Estimate:** ~12–18 engineer-weeks.

---

### Phase 6 — SaaS, billing, developer platform

| Work item | Detail |
|---|---|
| Plans & limits | Subscription, numbers, AI minutes, PSTN minutes, TTS chars, ASR seconds, storage, users; trials |
| Metering → invoicing | Meters → usage ledger → invoice; credits; manual adjustments with approval + audit; void/reissue |
| Provider cost reconciliation | Import provider invoices/CDRs, match to meters, report variance — **no margin claims without this** |
| Payments | Provider adapter with signature-verified webhooks and idempotency; enabled only after contract |
| Developer API | API keys (scoped/hashed), rate limits, idempotency keys, pagination, error taxonomy, OpenAPI, SDK skeleton |
| Webhooks out | Signed, retried with backoff, delivery log, replay |
| Docs | API reference, quickstarts, webhook catalogue, status page |

**Exit criteria:** invoice totals recomputed by an independent query match the ledger to the paisa in tests; a provider invoice reconciles with explained variance; a webhook cannot be forged; API keys cannot cross tenants.

**Estimate:** ~8–12 engineer-weeks.

---

### Phase 7 — Production validation

| Item | Evidence required |
|---|---|
| Security audit / penetration test | Report; criticals and highs closed |
| Tenant isolation re-test | Independent attempt to break it |
| Load & soak | Measured capacity, published with method |
| Real telephony pilot | 1–2 tenants, small volume, real numbers, consent-managed recording, monitored |
| Bangla quality in the wild | Native-speaker review of real calls; WER on real 8 kHz audio |
| Failure recovery | Kill media node/Redis/ASR/trunk drills with documented outcomes |
| Backup/restore | Restore drill from a real backup into a clean environment |
| Compliance review | Counsel sign-off on the §15 checklist in `SECURITY_AND_COMPLIANCE.md` |
| Documentation accuracy | Every claim in the docs re-verified against the running system |

**Estimate:** ~4–8 engineer-weeks, plus external audit lead time.

**Production approval is a separate, explicit owner decision.** A green Phase 7 checklist is evidence, not permission.

---

## 3. Recommended scope cut (what "version 1" should actually be)

The brief lists fifteen modules. Shipping all of them at once is how products become demos. Recommended v1:

**In:** tenancy · auth+MFA · phone number inventory · inbound SIP → IVR → queue → human agent (WebRTC) → wrap-up → CRM record · call history · recording (policy-gated, default off) · transcript + summary for human-handled calls · Bangla TTS studio (measured voices) · knowledge base for agent assist · basic analytics · usage meters (not invoices).

**Out of v1:** autonomous AI outbound campaigns · international numbers · voice cloning · payment capture · reseller/multi-level tenancy · social channels beyond WhatsApp · music/SFX generation · mobile apps.

**Why:** v1 proves the *hard* thing (a real call, a real agent, a real record, measurable Bangla voice). Everything excluded is additive once the core is trusted.

---

## 4. Dependency and decision ledger

| ID | Decision / dependency | Needed by | Owner | Status |
|---|---|---|---|---|
| D-1 | v1 scope (§3) approved | Phase 1 start | Owner | **OPEN** |
| D-2 | Separate app + PostgreSQL, exam platform untouched | Phase 1 start | Owner | **OPEN** |
| D-3 | Licensed carrier partner + licence class | Phase 2 end (PSTN), Phase 7 (pilot) | Owner + counsel | **OPEN** |
| D-4 | Counsel opinion: per-tenant licensing, recording basis, PDPA classification/localisation | Phase 2 (design), Phase 3 (AI placement) | Owner | **OPEN** |
| D-5 | Host CPU/RAM/GPU inventory; voice co-tenancy decision | Phase 2 capacity | Owner/ops | **OPEN** |
| D-6 | Voice shortlist + numeric quality bar | Phase 3 start | Owner | **OPEN** |
| D-7 | Recording default policy + cloning policy | Phase 2/3 | Owner + counsel | **OPEN** |
| D-8 | Billing dimensions + whether to invoice before reconciliation exists | Phase 6 | Owner | **OPEN** |
| D-9 | Approver matrix for privileged operations | Phase 1 | Owner | **OPEN** |
| D-10 | GPU procurement or rented evaluation budget | Phase 3 | Owner | **OPEN** |

`OPEN` means "the programme is blocked on this". None can be closed by engineering alone.

---

## 5. Team shape (assumption, to be confirmed)

| Role | Phase 1–2 | Phase 3–5 | Notes |
|---|---|---|---|
| Backend/platform engineer | 2 | 2 | Tenancy, call model, adapters, metering |
| Telephony/media engineer | 1 | 1 | FreeSWITCH/Kamailio/WebRTC — a specialist skill; the single hardest hire |
| ML/voice engineer | 0.5 | 1–2 | ASR/TTS evaluation and serving |
| Frontend engineer | 1 | 1–2 | Console, agent workspace, studio |
| DevOps/SRE | 0.5 | 0.5–1 | Host, containers, observability, backups |
| QA | 0.5 | 1 | Telephony test harness, regression conversations |
| Product/design | 0.5 | 0.5 | Scope discipline, UI |
| Counsel (external) | as needed | as needed | Telecom + data protection |
| Native Bangla raters | — | 5+ | Evaluation only, blinded |

Estimates in §2 assume roughly this shape. With a smaller team, phases serialise; the order does not change.

---

## 6. What will be measured before it is claimed

| Claim | Test that must exist first |
|---|---|
| "Supports N concurrent calls" | SIPp load test at N with CPU/jitter/packet-loss report |
| "Bangla ASR is accurate" | Frozen-set WER/CER with normaliser version and per-utterance evidence |
| "Bangla TTS sounds natural" | Blinded MOS with ≥5 raters, CI, agreement, error tags |
| "Low latency" | End-of-speech → first audible byte, p50/p95, through the real pipeline |
| "Tenant-isolated" | Adversarial cross-tenant test suite + pen-test finding closed |
| "Records securely" | Consent gate proof, encryption proof, access-audit sample, retention drill |
| "Bills accurately" | Ledger recomputation tests + provider invoice reconciliation |
| "Handles outages" | Kill-switch drills with documented behaviour |

---

## 7. Programme risks (beyond the Phase 0 register)

| Risk | Effect on plan | Response |
|---|---|---|
| Carrier negotiation slips | PSTN slips; lab work continues | Keep Phases 1–2 carrier-free by design; demo in lab mode with a clear "not a phone call" label |
| No telephony specialist available | Phase 2 slows badly | Hire/contract before Phase 2; a generalist will produce a fragile switch |
| Bangla ASR/TTS misses the bar | Autonomous AI calls are not shippable | Fallback product (human agent + IVR + AI assist) is specified and is a legitimate v1 |
| GPU unavailable | Latency budget missed; hosted fallback pressure | Rent evaluation time; size before buying; make hosted AI an explicit tenant setting |
| Regulatory change mid-programme (2026 unified policy) | Partner/licence assumptions change | Adapter + regulatory-profile fields; no regulatory logic in code |
| Scope creep from "CallHippo parity" | Everything half-built | §3 scope cut, written v1 definition, change control |
| Recording enabled too early on real customers | Legal exposure | Default off; per-call consent row; counsel gate before pilot |

---

## 8. Immediate next actions after approval (first two weeks)

1. Owner answers D-1, D-2, D-5, D-6, D-7, D-9 (days 1–3).
2. Open counsel engagement with the eight questions in `SECURITY_AND_COMPLIANCE.md` §16 (day 1; long lead).
3. Open carrier conversations with the due-diligence dossier in `PROVIDER_COMPATIBILITY.md` §10 (day 1; long lead).
4. Inventory the host (CPU, RAM, disk, bandwidth, GPU) and decide co-tenancy (day 2).
5. Stand up Phase 1 repository skeleton: new app, new Postgres, tenancy schema, isolation test harness (week 1).
6. Freeze the Bangla evaluation dataset specification and begin consent collection for speakers/raters (week 1–2).
7. Boot a lab FreeSWITCH + Kamailio pair **only** to validate the environment (no product code yet) and record baseline host capability (week 2).

**Nothing in this list touches a production system, activates a paid service, or creates a phone number.**
