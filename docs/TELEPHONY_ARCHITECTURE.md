# ALO Voice — Telephony Architecture

**Document:** `docs/TELEPHONY_ARCHITECTURE.md`
**Phase:** 0 (proposal — nothing in this document is implemented)
**Companion documents:** `VOICE_CONTACT_CENTER_AUDIT.md`, `PROVIDER_COMPATIBILITY.md`, `SECURITY_AND_COMPLIANCE.md`, `IMPLEMENTATION_ROADMAP.md`
**Date:** 2026-10-31

> **Nothing here has been built or measured.** Numbers labelled *target* are design budgets, not results. Capacity figures are deliberately absent: `SERVER-SPEC.md` does not record the host's CPU/RAM, and this audit environment (2 vCPU / 3 GB / no GPU) cannot produce representative measurements. Capacity is established only by the load tests defined in §12.

---

## 1. Scope and the one honest boundary

ALO builds the **software** half of a phone system: call control, routing, queues, agent and AI conversation, recording, analytics, CRM, billing. It does **not** own a telephone network. In Bangladesh, PSTN origination/termination and number assignment require a BTRC-licensed counterparty (today IPTSP / ICX / IGW; a unified licensing framework is replacing that — see `PROVIDER_COMPATIBILITY.md` §2).

Therefore the architecture has **two modes** from day one:

| Mode | What it proves | What it needs |
|---|---|---|
| **Lab mode** | Full signalling and media path over loopback/LAN: registration, inbound routing, IVR, queue, transfer, hold, conference, recording, barge-in, AI conversation, WebRTC softphone, load | Nothing external. FreeSWITCH + Kamailio + coturn + SIPp + two softphones on one LAN |
| **Carrier mode** | The same product, with a real phone number and a real person on the other end | A signed trunk/CPaaS contract, numbers, and legal sign-off (§9 of the audit) |

The product must never blur these. Every screen and every API response that depends on a carrier states which mode it is in, and the health panel reports the trunk as `UNCONFIGURED` rather than pretending.

---

## 2. Design principles

1. **The carrier is an adapter, never an assumption.** No business logic may branch on "Twilio" or "BTCL". If a provider disappears, the product loses numbers, not its data model.
2. **Audio is never fabricated.** If the media path is broken, the call fails visibly. No "simulated call" rows, no canned transcripts, no demo analytics in a production tenant.
3. **Every event is idempotent and attributable.** Call legs, DTMF, transfers and recordings arrive out of order and twice; state is derived, not patched.
4. **Tenant scope is a property of the audio path, not only of the API.** A tenant has its own SIP domain, its own number block, its own recording namespace and its own quotas.
5. **The AI is a participant, not the switch.** The switch owns the call; the orchestrator owns conversation. Killing the AI must leave a working phone system (this is the human-fallback requirement expressed architecturally).
6. **Fail closed on consent and privilege.** Recording, cloning, outbound dialing and number provisioning are off unless explicitly enabled *and* evidenced.
7. **Measure perceived latency, not model latency.** The metric that matters is time from end-of-user-speech to first audible byte.

---

## 3. Reference architecture

```
                       ┌──────────────────────────── browser / mobile ────────────────────────────┐
                       │  Agent workspace (Next.js)         Customer (PSTN or WebRTC)             │
                       │  SIP.js over WSS · Opus · mic/speaker                                     │
                       └───────────┬───────────────────────────────┬──────────────────────────────┘
                                   │ WSS (signalling)              │ SIP/RTP via carrier
                                   │ UDP (media, ICE/TURN)         │
                    ┌──────────────▼──────────────┐        ┌───────▼──────────────┐
                    │  coturn (TURN/STUN)         │        │ Licensed carrier     │
                    │  dedicated UDP ports        │        │ (SIP trunk / CPaaS)  │
                    └──────────────┬──────────────┘        └───────┬──────────────┘
                                   │                               │ SIP + RTP (G.711/Opus)
                          ┌────────▼───────────────────────────────▼────────┐
                          │  Kamailio  — SIP edge / registrar / SBC          │
                          │  TLS, NAT, topology hiding, per-tenant domains,  │
                          │  abuse/rate limits, OPTIONS keepalive, dispatcher │
                          └────────┬───────────────────────────┬─────────────┘
                                   │                           │
                    ┌──────────────▼─────────┐      ┌──────────▼─────────────┐
                    │ FreeSWITCH media node A │ ...  │ FreeSWITCH media node B │   (horizontal)
                    │ dialplan-as-data, ESL   │      │ record_session, queues  │
                    └──────┬──────────┬───────┘      └──────────┬──────────────┘
                           │ ESL events│ audio fork (20 ms PCM/16 kHz)
                           │           │
        ┌──────────────────▼───┐   ┌───▼──────────────────────────────┐
        │ call-event ingestion │   │ voice pipeline service (per call)│
        │ (idempotent, ordered │   │ VAD → ASR(stream) → orchestrator │
        │  per call) → Postgres│   │ → LLM → TTS(stream) → back to FS │
        └──────────┬───────────┘   └───┬───────────────┬──────────────┘
                   │                   │               │
                   │            ┌──────▼──────┐  ┌─────▼───────┐
                   │            │ ASR workers │  │ TTS workers │  (GPU or CPU pool)
                   │            └─────────────┘  └─────────────┘
                   │
   ┌───────────────▼──────────────────────────────────────────────────────────────┐
   │ Control plane — Next.js app (console/API) + workers                          │
   │ tenancy · RBAC · agents · campaigns · numbers · metering · billing · audit   │
   └───────┬───────────────────────┬──────────────────────┬───────────────────────┘
           │                       │                      │
     ┌─────▼─────┐          ┌──────▼──────┐        ┌──────▼───────┐
     │ PostgreSQL│          │   Redis     │        │ Object store │
     │ system of │          │ presence,   │        │ recordings,  │
     │ record    │          │ call state, │        │ transcripts, │
     │           │          │ rate limits │        │ TTS output   │
     └───────────┘          └─────────────┘        └──────────────┘
```

**Component choices and why**

| Layer | Choice | Rationale | Alternative |
|---|---|---|---|
| SIP edge | **Kamailio** (GPLv2+, run as a separate process) | TLS termination, NAT handling, per-tenant domains, dispatcher/load-balancing, OPTIONS health, SIP-layer abuse controls. It does not do media, which is exactly the separation we want | OpenSIPS (GPLv2); both acceptable |
| Media server | **FreeSWITCH** (**MPL 1.1**) | The licence is the deciding factor for a closed-source commercial product: MPL files stay MPL, but no obligation attaches to our own code. Strong ESL event model, `mod_audio_stream`-class forking for AI audio, mature `record_session`, conferencing, queues | **Asterisk (GPLv2)** with ARI + AudioSocket/External Media — equally capable technically, bigger ecosystem, but copyleft obligations need written legal sign-off before embedding |
| WebRTC client | **SIP.js (MIT)** over WSS | Browser-native WebRTC, no plugin, MIT licence, works with PJSIP (Asterisk) and Sofia (FreeSWITCH) | JsSIP (MIT) |
| NAT traversal | **coturn** (BSD-3) | Mandatory for real users behind CGNAT/mobile networks | managed TURN (external dependency) |
| System of record | **PostgreSQL** | Multi-writer, transactional call state, row-level security for tenancy, mature backup | existing SQLite (rejected: single writer) |
| Live state | **Redis** | Presence, queue counters, per-call scratch state, distributed rate limiting, pub/sub for supervisor events | none (in-process maps break on second node) |
| Media/artefact storage | **S3-compatible object storage** (self-hostable: MinIO, AGPL — external-service use only) | Recordings are large, need lifecycle/retention, must not live on the app disk | local filesystem only for lab mode |
| Async work | PostgreSQL outbox + worker (Phase 2) → Redis Streams/NATS when volume justifies | Reuse of the proven `MessageOutbox` idempotency pattern | RabbitMQ / NATS |

**Deployment topology options**

- **T1 — single box (lab/pilot):** Kamailio + FreeSWITCH + app + Postgres + Redis + coturn on one host. Acceptable for ≤ pilot volumes *after* measurement. Single point of failure; no HA claim.
- **T2 — split media/control:** media nodes (stateful, near the carrier's PoP) + stateless control plane + managed Postgres/Redis + object storage. This is the first production shape.
- **T3 — HA:** Kamailio pair with a shared VIP + dispatcher, ≥2 media nodes, Postgres primary/standby with PITR, Redis HA, object storage with versioning. Required before any contractual availability commitment.

---

## 4. Real-time media path

### 4.1 Audio contract

| Leg | Codec | Sample rate | Frame | Notes |
|---|---|---|---|---|
| PSTN / SIP trunk | G.711 µ-law or A-law | 8 kHz | 20 ms (160 samples) | Narrowband. **All Bangla ASR evaluation must include 8 kHz telephone-band audio**, not only clean 16 kHz studio audio |
| WebRTC (agent/customer) | Opus | 48 kHz (decoded to 16 kHz for ASR) | 20 ms | Wideband; DTLS-SRTP mandatory |
| Internal AI bus | PCM 16-bit little-endian | 16 kHz mono | 20 ms (320 samples) | One canonical format into and out of ASR/TTS |
| Recording | 2-channel WAV/PCM (caller L, agent/AI R) → compressed archive | 8/16 kHz | — | Stereo split is required for diarisation-free attribution |

Transcoding is a CPU cost: G.711 ↔ PCM16 ↔ Opus. Media nodes should avoid unnecessary re-encoding (pass-through where both legs agree).

### 4.2 Pipeline stages

1. **Fork** — media node taps both directions (caller and agent/AI) to the voice pipeline over a local socket/WebSocket. Forking must not increase jitter on the live call.
2. **VAD** — energy + model-based (e.g. Silero VAD, MIT — verify) with a 200 ms hangover; emits `speech_start` / `speech_end` with timestamps.
3. **ASR** — streaming; partial hypotheses every ~150–300 ms; finalises on `speech_end` or 700 ms of silence. Must expose confidence per segment.
4. **Orchestrator** — conversation state machine: turn taking, context window, tool calls, guardrails, escalation. Issues a cancel signal on barge-in.
5. **LLM** — local OpenAI-compatible server (llama.cpp/Ollama/vLLM), streamed tokens; the repo's `src/lib/ai/local/endpoint.ts` already models breaker + queue + cache for this.
6. **TTS** — sentence-level streaming; first audio chunk must arrive before the full sentence is synthesised. Must support `stop()` within ~150 ms.
7. **Playback** — media node plays the TTS stream into the call leg; barge-in flushes the buffer and cancels generation.

### 4.3 Latency budget (design targets, to be measured, not claims)

| Stage | Target (p50) | Target (p95) | Notes |
|---|---|---|---|
| End-of-speech detection (VAD hangover) | 200 ms | 350 ms | Tunable trade-off against clipping the last syllable |
| ASR final hypothesis after end-of-speech | 150 ms | 300 ms | Streaming, not batch |
| Orchestrator + first LLM token (local 8B-class, KV warm) | 300 ms | 600 ms | Depends entirely on GPU; CPU-only will miss this |
| First TTS audio chunk (first sentence) | 150 ms | 350 ms | Streaming TTS required |
| Network + jitter buffer + playback start | 80 ms | 150 ms | Media node near carrier |
| **Perceived response (end-of-speech → first audible byte)** | **≤ 900 ms** | **≤ 1,500 ms** | The only number users judge |
| Barge-in: speech detected → AI audio stopped | — | 150 ms | Includes LLM cancellation |
| ASR partial latency (for captions) | 300 ms | 600 ms | |

**If p95 exceeds 1.5 s the AI path is not shippable for a natural phone conversation** — the fallback is human agent / scripted IVR, and the product must say so rather than shipping a laggy agent.

### 4.4 Failure and recovery behaviours (must be designed, not discovered)

| Failure | Behaviour |
|---|---|
| ASR unavailable | Orchestrator plays a short apology, offers DTMF menu / human transfer; call continues; incident raised |
| LLM unavailable / breaker open | Fall back to scripted flow + retrieval-only answer; never silence |
| TTS unavailable | Fall back to pre-synthesised prompts for essential steps; escalate to human |
| Audio fork socket drops | Reconnect with backoff; if AI leg lost, keep human/AI bridge alive or transfer to queue |
| Media node dies | Kamailio dispatcher removes it; in-flight calls are lost (documented); new calls route to healthy nodes; alert |
| Carrier trunk down | Outbound pauses campaigns, inbound cannot arrive (carrier-side); health panel shows `DOWN`; no fake entries created |
| Redis unavailable | Existing calls continue from local state; presence/routing degrade; new routing uses Postgres snapshot; alert |
| Clock/timestamp skew | All events carry both monotonic and wall-clock times; duration is computed from monotonic |
| Recording write fails | Call continues; recording marked `FAILED` with reason; never a zero-byte "recording" row |

### 4.5 Jitter, echo and noise

- Fixed 20 ms packetisation, adaptive jitter buffer on the media node, RTP timeout ≥ 5 s before declaring media loss.
- Echo: AEC is **not** the server's job for PSTN (the carrier/handset handles it); for WebRTC agents use the browser's AEC and a headset requirement in the agent guide.
- Noise: optional server-side noise reduction / voice isolation is a **post-processing** feature (Module C) and must be off by default in the live path until its added latency is measured.

---

## 5. Call state machine and event model

### 5.1 Canonical call record

`Call` (one logical call) → `CallLeg` (1..n; each SIP dialog: customer, agent, AI, supervisor-monitor, transfer target) → `CallEvent` (append-only).

```
Call.status:
  CREATED → RINGING → ANSWERED → IN_PROGRESS → {HELD ⇄ IN_PROGRESS} → {TRANSFERRING → IN_PROGRESS}
          → COMPLETED
  Terminal failure paths: BUSY | NO_ANSWER | REJECTED | FAILED | CANCELLED | ABANDONED (caller hung up in queue)
  Post-processing: COMPLETED → (transcript/summary pending) → ANALYSED
```

Rules:

- **One writer per call.** Events for a call are partitioned by call id and applied by a single consumer, in sequence, so no two workers can diverge.
- **Idempotency.** Every event carries `(provider, provider_event_id)` unique; replays are discarded. This mirrors `src/lib/crm/automation.ts`.
- **Derived state.** `Call.status` is a projection of events; a periodic reconciler compares projections against carrier CDRs and reports drift (a *measured* number, not a promise).
- **Duration** is computed from the moment the media path is established (answered), not from INVITE. Ring time, talk time, hold time, wrap time and queue wait are separate columns — billing depends on exactly this distinction.
- **Dispositions** (`ANSWERED_BY_AI`, `TRANSFERRED_TO_HUMAN`, `ABANDONED_IN_QUEUE`, `VOICEMAIL`, …) are a closed enum; free-text notes live elsewhere.

### 5.2 Why event-sourced

Contact-centre reporting counts events (offered, answered, abandoned, transferred, hold count), and every one of those is derivable from the event log but *not* recoverable from a “current status” column. It also gives us an audit trail that satisfies both PDPA accountability and BTRC CDR expectations without a second system.

---

## 6. Multi-tenancy in the telephony layer

| Layer | Tenant boundary |
|---|---|
| SIP | One **SIP domain per tenant** (`tenant-<id>.sip.alo.example`). Registrations, credentials and dialplan entry points are scoped by domain. Carrier trunk is shared; the tenant is selected by the DID (or by trunk credentials per tenant) |
| Number inventory | `PhoneNumber.tenantId` + `providerAccountId`; a number can be reassigned only through an audited operation |
| Dialplan | **Data, not files.** Route/IVR/queue definitions are rows (`RoutingPlanVersion`), validated, previewed in a simulator, and only then published. Published plans are immutable; a call records the plan version it ran under |
| Media node routing | Kamailio dispatcher selects a media node; the node's dialplan looks up tenant by domain/DID from Redis cache of the control plane |
| Recording namespace | `s3://alo-recordings/<tenantId>/<yyyy>/<mm>/<callId>-<legId>.wav.enc` — key prefix is the tenant; access is granted only by a signed URL issued after a permission check |
| Quotas | Per tenant: concurrent calls, minutes/month, TTS characters, ASR seconds, storage GB, campaign size. Enforced at admission (SIP 503 with reason) and metered continuously |
| Secrets | Per-tenant carrier credentials, API keys, webhook secrets: envelope-encrypted (KEK in KMS/secret manager), never returned by any API, rotatable |
| AI context | Knowledge base, prompts, tools, memory are all tenant-keyed; retrieval must carry `tenantId` in the query, not in a post-filter |

**Open legal question carried into the design:** BTRC's call-centre guideline prohibits interconnecting call centres of *different* clients. If the regulator's view is that each ALO tenant is a distinct "client", then a single trunk hosting many tenants may be non-compliant in Bangladesh. The architecture therefore supports **per-tenant trunk credentials** as a first-class mode (§7.2), so the answer is a configuration, not a rewrite.

---

## 7. Provider abstraction

### 7.1 The contract

Two families, because they are genuinely different products:

```ts
// Telephony carrier for numbers + PSTN legs. Trunk-based.
interface SipTrunkProvider {
  readonly id: string;                       // 'bd-iptsp-a' | 'cp-aaa' | 'lab-freeswitch'
  readonly capabilities: TrunkCapabilities;  // declared, checked at runtime
  listAvailableCountries(): Promise<CountryAvailability[]>;
  provisionNumber(req: NumberRequest): Promise<ProvisionedNumber>;   // requires approval
  releaseNumber(numberId: string): Promise<void>;                    // requires approval
  // Trunks are configured, not called: returns the SIP credentials/material to place in the media node
  getTrunkConfig(tenantId: string): Promise<TrunkConfig>;
  fetchCdrs(range: DateRange): Promise<CdrRecord[]>;                 // reconciliation
  subscribeEvents?(endpoint: string): Promise<void>;
}

// CPaaS: media flows over WebSocket to us; numbers + legs via REST.
interface CpaasProvider {
  readonly id: string;
  originateCall(req: OriginateRequest): Promise<{ providerCallId: string }>;
  hangup(providerCallId: string): Promise<void>;
  transfer(providerCallId: string, target: TransferTarget): Promise<void>;
  streamMedia(providerCallId: string): MediaStreamHandle;  // inbound WS with PCM frames
  verifyWebhook(headers: Headers, rawBody: string): boolean;  // reuse webhook-signature.ts
}

type TrunkCapabilities = {
  inbound: boolean; outbound: boolean;
  numberTypes: Array<'DID_LOCAL' | 'DID_NATIONAL' | 'TOLL_FREE' | 'MOBILE' | 'INTERNATIONAL'>;
  callerIdPresentation: boolean;
  recordingAtCarrier: boolean;
  mediaStreaming: boolean;      // if false, audio forking happens on our media node
  sms: boolean;
  codecs: Array<'PCMU' | 'PCMA' | 'OPUS' | 'G722'>;
};
```

**Rules**

- Capabilities are **declared and asserted**: a feature that needs `callerIdPresentation` is hidden/disabled for a provider that does not have it, with a stated reason — same philosophy as `src/lib/integrations/registry.ts`.
- Unconfigured is a first-class state. With no trunk, the app must run in lab mode and say so.
- No provider SDK is called directly from business logic; adapters are the only outbound seam (mirroring `src/lib/ai/providers/ai-provider.ts`'s "single place that makes an outbound model call").
- Every adapter ships with a **contract test suite** (recorded fixtures) so a provider swap is a test run, not an incident.

### 7.2 Trunk topologies supported

1. **Shared trunk, DID-routed (default):** one carrier trunk; tenant selected by DID. Simplest; may be legally constrained in BD (§6).
2. **Per-tenant trunk credentials:** each tenant's own SIP account at the carrier; strongest isolation and the safe answer if regulation requires per-client separation.
3. **CPaaS per tenant:** tenant brings its own Twilio/Telnyx sub-account; we consume media streams. Fastest international path, highest per-minute cost.
4. **Lab:** FreeSWITCH internal domain only; no trunk; calls only between registered endpoints.

### 7.3 Number lifecycle

`REQUESTED → (approval) → PROVISIONING → ACTIVE → SUSPENDED → RELEASED` with a mandatory approval record for `REQUESTED→PROVISIONING` and `ACTIVE→RELEASED`, provider acknowledgement captured, and a nightly reconciliation against the provider's inventory. **A number exists in our database only after the provider confirms it exists on their side.**

---

## 8. IVR, routing and queues

- **Routing plans** are versioned JSON/YAML validated by a schema (Zod), with a **simulator**: given a caller (number, time, language, VIP flag), show the path taken and the estimated wait, without placing a call. This is how routing is tested before real traffic.
- **Node types:** `play`, `collect` (DTMF, bounded retries), `speak` (TTS), `ai_agent`, `queue`, `ring_group`, `transfer` (blind/attended), `voicemail`, `webhook` (with timeout + failure branch), `business_hours`, `holiday`, `hangup`.
- **Queues:** strategies `ring_all`, `longest_idle`, `round_robin`, `fewest_calls`, `skill_weighted`; priority from caller tag (VIP), wait-time boost, max wait, overflow to voicemail/callback/AI, and per-queue SLA counters. Queue entries live in Redis with Postgres snapshots for reporting.
- **Callback** (queue callback and missed-call recovery) is an outbound call and therefore subject to §10 policy.
- **Language selection** on entry (`1` বাংলা, `2` English) with AI auto-detect as a secondary signal, never as the only one.

---

## 9. Human agent path

- **Softphone:** SIP.js in the agent workspace, WSS signalling, Opus, device selection, mute, hold (re-INVITE with music-on-hold), DTMF, transfer (blind/attended), conference (3-way), wrap-up timer.
- **Presence FSM:** `OFFLINE → LOGIN → AVAILABLE ⇄ BUSY → WRAP_UP → (BREAK) → OFFLINE`, with server-owned transitions (a client cannot mark itself available while it has an active call). Presence heartbeats in Redis with TTL; a missed heartbeat marks the agent `UNREACHABLE` after 2 intervals.
- **Delivery:** the switch offers calls only to `AVAILABLE` agents with matching queue/skill and remaining concurrency; offer timeout returns the call to the queue and records `RING_NO_ANSWER` (this is a metric, not a silent retry).
- **Supervisor:** live board (queue depth, longest wait, agent states), listen / whisper / barge **only** where policy and per-call consent permit, with a visible indicator to the agent and an audit record for every intervention. No hidden monitoring.
- **Dispositions & wrap-up:** mandatory disposition per call, configurable wrap time, notes, task creation.
- **Degradation:** if WSS is unreachable, the agent must be told plainly and the queue must stop offering calls to them.

---

## 10. AI agent path

- One orchestrator per call, state in Redis, transcript appended to Postgres per turn.
- **Grounding:** answers about prices/policies/orders only from tenant knowledge base or business tools; every such answer stores the source chunk/record ids. If retrieval confidence < threshold → ask a clarifying question or transfer. The AI must never invent a price, a policy or a commitment (Module K).
- **Tools:** `lookup_customer`, `verify_customer` (step-up), `create_task`, `book_appointment`, `check_order`, `send_sms`, `transfer_to_human`. Each tool declares `requiresConsent`, `requiresHumanApproval`, `idempotencyKey`, `timeout`, and a typed error surface.
- **Truthful outcomes:** the agent may say "I've booked your appointment" **only** after the tool returns success with an id. On failure it says what happened and offers the human path. Transfer is announced only after the switch confirms the target leg is ringing.
- **Handoff package:** reason code, language, transcript so far, extracted entities, sentiment estimate (labelled as an estimate), customer match, queue/skill target. No transfer without context.
- **Limits:** max call duration, max turns, max tool calls, loop detection, per-call token/minute budget, and a hard stop that hands off rather than rambling.

---

## 11. Recording, consent and retention (architecture view; legal detail in `SECURITY_AND_COMPLIANCE.md`)

1. Recording is **disabled by default**, per tenant, and requires a configured jurisdiction policy (announcement text + lawful basis + retention).
2. Before recording starts, the media node writes a `RecordingConsentDecision` row: who consented, on what basis, which announcement version was played, at what second. **No row → no recording.**
3. Storage: object storage, server-side encryption with per-tenant keys, dual-channel, checksummed; DB holds metadata + checksum, never audio bytes.
4. Access: permission (`calls.recording.listen` / `.export`), tenant check, purpose check, signed URL with short TTL, and an audit row for every listen/export (reuse `src/lib/audit.ts` patterns).
5. Retention: per-tenant policy (default conservative), automated deletion job with dry-run report, legal-hold override, and a deletion receipt.
6. Deletion on data-subject request: recordings + transcripts + derived summaries, with a tombstone row proving deletion.

---

## 12. Reliability, capacity and measurement

**No capacity numbers are published in this document.** Instead, the measurement procedure that must produce them:

| Test | Method | Pass criterion |
|---|---|---|
| Signalling capacity | SIPp: OPTIONS/REGISTER/INVITE at increasing CPS against the edge | Error-free at target CPS with p95 setup < 300 ms |
| Concurrent media | SIPp `uac`/`uas` scenarios with RTP echo or file playback; N concurrent calls per media node | CPU < 70%, 0 packet loss, RTP jitter < 30 ms at target N |
| Transcoded calls | G.711 ↔ Opus with recording + audio fork enabled | Same as above at reduced N; document the ratio |
| AI pipeline latency | 200 scripted utterances through the real pipeline | p50 ≤ 900 ms / p95 ≤ 1.5 s end-of-speech → first audio |
| ASR/TTS throughput | Real-time factor (RTF) on the target hardware, per model | RTF < 0.5 with headroom for 2× burst |
| Failure drills | Kill media node / Redis / ASR / trunk mid-call | Documented behaviour matches §4.4; alarms fire |
| Long soak | 8 h at 60% target load | No memory growth, no file-descriptor leak, no orphaned calls |
| Drift | Compare our call durations/dispositions to carrier CDRs for 24 h | ≥ 99% match, discrepancies listed and explained |

**Network requirements (must be verified with the host/ISP, not assumed)**

| Port/proto | Purpose | Exposure |
|---|---|---|
| 5060/udp, 5060/tcp | SIP (lab only; production uses TLS) | Restrict to carrier IPs |
| 5061/tcp (TLS) | SIP/TLS to carrier and from WebRTC clients (via WSS termination) | Public, TLS 1.2+ |
| 443/tcp (WSS) | Agent/customer SIP over WebSocket | Public via edge proxy; **must not** be Cloudflare "Flexible" |
| 10000–20000/udp (configurable) | RTP media | Public; **SIP ALG on any NAT device must be disabled** |
| 3478/udp + 5349/tls | TURN/STUN | Public |
| 7443/tcp | ESL/control (internal) | Private |

**Cloudflare caveat (current deployment):** the existing site runs behind Cloudflare with **Flexible SSL** (`SERVER-SPEC.md` §1). That is unacceptable for WSS agent audio (plaintext origin leg) and unsuitable for SIP/RTP, which must bypass the proxy entirely (DNS-only/grey-cloud, or a separate non-proxied hostname). Upgrading to Full (Strict) with a real origin certificate is a prerequisite for Phase 2, and it is already a recommended action in `SERVER-SPEC.md` §4.

---

## 13. Test SIP environment (Phase 2 entry condition)

| Element | Purpose |
|---|---|
| FreeSWITCH + Kamailio on one LAN | Full stack under test |
| Two SIP softphones (e.g. Linphone/Bria) + one browser SIP.js client | Registration, calls, hold, transfer, conference |
| SIPp scenarios | Load, out-of-order messages, CANCEL, re-INVITE, 486/603, media timeout |
| RTP capture (tcpdump + Wireshark) | Verify codecs, packetisation, one-way audio, DTMF (RFC 2833), SRTP |
| Recording playback verification | Dual-channel files, correct durations, checksums |
| Objective voice quality | PESQ/POLQA on loopback (measures the media path, not the carrier) |
| Fake carrier adapter | A test double that emulates CDRs/webhooks, including duplicates and out-of-order delivery |

Exit criteria for Phase 2: all of §12's lab tests pass, plus an honest written statement of what remains unverified until a real trunk is connected (echo, carrier-side CLI, international routing, real-network jitter).

---

## 14. What would make this architecture wrong (and how we would know)

- **Asterisk is chosen instead of FreeSWITCH** → only licence posture changes; ARI External Media/AudioSocket replaces ESL + audio fork. The contract in §7 is unaffected.
- **The carrier offers media streaming (CPaaS)** → the media node can be bypassed for those tenants; we keep FreeSWITCH for SIP-trunk tenants.
- **Local AI cannot meet the latency budget** → the orchestrator gains a "hybrid" mode (local ASR/TTS, remote LLM only with explicit tenant opt-in and data-processing terms). This must be a *tenant-visible setting*, not a silent default.
- **Regulation requires per-tenant trunks** → §7.2 mode 2, already supported.
- **Bangla ASR quality fails the gate** → product ships as human-agent + IVR + AI-assist (suggested replies to the agent) rather than autonomous AI calls. This is a legitimate, honest product; a degraded AI that mis-hears customers is not.
