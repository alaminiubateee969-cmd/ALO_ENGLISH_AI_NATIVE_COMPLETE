# Provider Compatibility & Adapter Strategy

**Document:** `docs/PROVIDER_COMPATIBILITY.md`
**Phase:** 0 — research and compatibility assessment. **No provider has been contacted, trialled or contracted.**
**Date:** 2026-10-31

> Every provider statement below comes from **public documentation or public regulator material**, and is marked accordingly. Nothing was verified in a provider portal, and no capability was tested by ALO. A capability marked **CONFIRM** must be confirmed **in writing, in the contract**, before it is relied on. Pricing is deliberately absent: publishing a number we have not signed for would be a fabrication.

---

## 1. Method

| Step | What was done |
|---|---|
| Regulatory envelope | Read BTRC's published IPTSP guideline and call-centre guideline, plus public reporting on the 2026 unified licensing policy; read Bangladesh's PDPA 2026 coverage |
| Provider categories | Mapped the three real ways a Bangladeshi business gets a call: local licensed operator, hosted PBX + local trunk, international CPaaS |
| Capability fields | Chosen so that each maps to a product feature (number types, media streaming, CLI, recording, SMS, webhooks, portability) |
| Verification status | `DOC` = documented publicly · `CONFIRM` = must be confirmed in writing · `UNKNOWN` = no public basis · `NO` = publicly not supported |
| What was *not* done | No signup, no sandbox, no test call, no price quote, no legal opinion |

---

## 2. The regulatory envelope (this decides the architecture)

| Instrument | What it constrains | Consequence for ALO |
|---|---|---|
| **Bangladesh Telecommunication Act 2001** + BTRC licensing | Only licensees may originate/terminate public telephony. Unlicensed international termination ("VoIP bypass") is unlawful | ALO is a **software vendor**, not a carrier. Numbers and termination must come through a licensee |
| **IPTSP Guideline (amended 2009, BTRC)** | IPTSP licence is issued **only to ISP licensees**; international IP voice must transit **ICX/IGW**; "shall not bypass Licensed IGW and ICX"; no voice over VSAT/IIG; **lawful interception (LI)** equipment at the National Monitoring Centre is a licence obligation; subscriber confidentiality duty | Multi-tenant hosting must sit behind a licensed partner's compliant network. LI is the **operator's** obligation — ALO must not build covert monitoring, and must be technically able to support a lawful, documented request routed through the licensee |
| **Call Center Licensing Guideline (BTRC, 2008)** | International call centre / HCC / HCCSP classes; **separation of office lines from the call-centre network**; interconnection between call centres of the **same client** only, with prior approval; **domestic↔international call-centre interconnection prohibited**; CDRs furnished to the Commission on demand; law-enforcement interception right over traffic originated/terminated at the call centre | **Open question that can block the SaaS model in BD:** is each ALO tenant a separate "client" requiring separate authorisation, or is ALO the client hosting its own teams? Legal opinion required. The architecture supports per-tenant trunks if the answer is "separate" (`TELEPHONY_ARCHITECTURE.md` §7.2) |
| **Unified telecom licensing policy (2026, in transition)** | Reported to replace ILDTS 2010 with four categories + registration-based "telecom-enabled services"; **IGW/ICX/IIG/NIX licence types to be phased out by 2027**; LI only under valid judicial/quasi-judicial authorisation | The partner's licence class may change during our build. **Do not hard-code any regulatory model**; capacity and legal assumptions must be re-validated per contract term |
| **Personal Data Protection Act 2026** (Personal Data Protection Ordinance gazetted Nov 2025 → Act, April 2026; reported as Law 63 of 2026) | Consent, purpose limitation, data-subject rights, regulator under the PMO, penalties; commentary reports **no mandatory breach notification to individuals** and that **confidential/restricted data must be stored in Bangladesh** with limited cross-border transfer | Call recordings and transcripts are personal data of the most sensitive operational kind. **Host in Bangladesh by default**; cross-border AI processing is a decision requiring consent/contract basis. See `SECURITY_AND_COMPLIANCE.md` §4 |
| **SMS sender-ID registration (BD)** | Public operator/carrier documentation states that from **8 Sept 2025** messages with unregistered Sender IDs to Grameenphone, Robi/Axiata and TeleTalk are blocked; an Alphanumeric Sender ID must be registered | SMS is not a "just add an aggregator" feature in BD: masking/sender-ID registration is a prerequisite, and lead times must be planned |

**Bottom line:** telephony in Bangladesh is a **partnership-and-paperwork** problem before it is an engineering problem. The plan that follows treats every carrier as an interchangeable adapter precisely so that a change in licence class, partner or policy does not invalidate the product.

---

## 3. Provider categories and how each plugs in

| Category | Examples (publicly known; not endorsed) | What they give us | Adapter type | Realistic role for ALO |
|---|---|---|---|---|
| **Licensed local IPTSP / ISP-telecom** | BTCL, Ranks, Amber IT, Link3, ICC, Triangle, Agni, MetroNet (verify licence status in BTRC's licensee register before any discussion) | BD DIDs (e.g. 096xx ranges), SIP trunk, local termination, sometimes managed PBX/IVR | `SipTrunkProvider` | **Primary path for Bangladeshi numbers.** Commercial terms and per-tenant options must be negotiated |
| **Licensed ICX / IGW** | a small number of licensees | International termination/origination, regulated margins, LI compliance | `SipTrunkProvider` (indirect, via IPTSP partner) | Only through an IPTSP/ASP partner; ALO cannot contract these directly |
| **Hosted PBX vendors** | 3CX-style hosted PBX, regional cloud PBX resellers | PBX features, sometimes numbers, rarely open APIs | none (compete) | Not a fit: we are building the PBX layer |
| **International CPaaS** | Twilio, Telnyx, Plivo, Vonage | Global numbers, programmable voice, **media streams over WebSocket**, SIP trunking, SMS/WhatsApp APIs | `CpaasProvider` | **Fastest route to a demonstrable real call** (international numbers, or BD numbers where available), **most expensive per minute**, and BD regulatory requirements still apply to the number |
| **Self-hosted open source** | FreeSWITCH, Asterisk, Kamailio, coturn | Full control, zero licence fees, complete media access | our own media layer | **Core of the product**, always present |

**Decision:** the product is built on the self-hosted media layer (FreeSWITCH + Kamailio) so that nothing essential depends on a CPaaS, and *trunk/CPaaS adapters are how it reaches the PSTN*. This is the only arrangement that satisfies "keep external telephony providers replaceable".

---

## 4. Telephony capability matrix

Legend: `DOC` documented publicly · `CONFIRM` must be written into the contract · `UNKNOWN` no public basis · `NO` publicly unsupported · `—` not applicable.

| Capability | Local IPTSP partner | International CPaaS | Self-hosted (lab) |
|---|---|---|---|
| BD local DID (e.g. 096xx) | **CONFIRM** (range, quantity, lead time) | `DOC` limited: Twilio publishes BD **local** number requirements (local address proof per prefix) and lists BD local numbers, but availability/quantity must be confirmed | `NO` (no PSTN) |
| BD mobile numbers (for outbound campaigns) | **CONFIRM** — regulatory restrictions on mobile-number CLI likely | **CONFIRM** | `NO` |
| International DID | **CONFIRM** (via IGW/partner) | `DOC` broad coverage; per-country KYC | `NO` |
| Inbound calls to our app | `DOC` (SIP trunk → our SBC) | `DOC` (REST + webhooks) or SIP | `DOC` (internal only) |
| Outbound termination | `DOC` via partner; **rates CONFIRM** | `DOC`; **rates CONFIRM** | `NO` |
| SIP trunk (BYO carrier) | `DOC` | `DOC` (Elastic SIP Trunking-style) | `DOC` |
| Media streaming to our AI (WebSocket audio) | **CONFIRM** — many IPTSPs offer plain SIP/RTP only; then *our* media node does the forking | `DOC` (bidirectional media streams are a core CPaaS feature; verify codec/format per vendor) | `DOC` (ESL + audio fork) |
| SIPREC / carrier-side recording | `CONFIRM` | `DOC`/`CONFIRM` | our own `record_session` |
| Caller-ID (CLI) presentation | **CONFIRM** — presentation rules differ per operator | **CONFIRM** per country | internal only |
| DTMF (RFC 2833 / SIP INFO) | `CONFIRM` | `DOC` | `DOC` |
| Number portability (in) | `DOC` (Twilio's BD page lists portability available; operator practice varies) | `CONFIRM` | — |
| Two-way SMS | **CONFIRM** — Twilio's BD page states two-way SMS is **not supported** | `NO`/limited per same page | — |
| SMS sender ID | **CONFIRM** — registration mandatory (GP/Robi/TelTalk) | `DOC` (registration required; Twilio documents the deadline/blocking) | — |
| CDRs for reconciliation | `CONFIRM` (BTRC requires them to be available to the Commission; we need them too) | `DOC` | our own |
| Webhook events | typically none (SIP only) | `DOC` | our own |
| SLA / support | **CONFIRM** | `DOC` (tiered) | ours |
| Contractual per-tenant separation | **CONFIRM** — this is the §2 open question | `DOC` (sub-accounts) | ours |

**Consequence for the adapter design:** a `SipTrunkProvider` may have **no webhooks at all** and no media streaming. Therefore the product's default is *SIP in, our media node handles media*; CPaaS media streaming is an optimisation, not a requirement.

---

## 5. Number acquisition — what the customer will actually experience

1. Tenant requests a number (type, city/prefix, language, purpose).
2. ALO validates: does the requirement have a lawful basis? Is the tenant verified? Is the purpose permitted (no spam, no impersonation)?
3. Request goes to the licensed partner with KYC documents (business registration, address proof — the standards published by carriers for BD local numbers require a local address within the number's prefix area).
4. Partner provisions; ALO records the provider reference, activation date, cost basis and the approval record.
5. Number becomes `ACTIVE` only after provider confirmation; until then the UI shows `PROVISIONING` with the partner's reference.
6. Release/port-out follows the same audited path.

**Never**: show a "buy number" button that creates a local database row and no phone number. That is the single most common way telephony demos become fraud.

---

## 6. Voice-AI provider compatibility

| Requirement | Local self-hosted (target) | Hosted API (fallback only) |
|---|---|---|
| Streaming TTS (first chunk < 350 ms) | Must be built per model; VITS-class streams by sentence chunk | Usually good |
| Streaming ASR with partials | faster-whisper / Conformer streaming — **must be measured** | Usually good |
| Bangla quality | **Unknown until measured** (`BANGLA_VOICE_MODEL_EVALUATION.md`) | Vendor claims; must be tested on the same frozen sets |
| Data residency | Stays in BD host | Cross-border transfer → PDPA analysis + tenant opt-in |
| Cost model | Infrastructure (GPU hours) | Per character/second — must be metered and capped |
| Licence | Per-model review | Contract review |
| Offline/degraded operation | Works without internet | Fails when the network does |
| Vendor lock-in | Low (adapter) | High if voice ids/embeddings live only with vendor |

**Rule:** hosted AI may be used only as (a) an evaluation baseline, or (b) a tenant-visible opt-in fallback with a documented data-transfer basis. It may never be the silent default, because the brief requires local-first inference.

---

## 7. Omnichannel providers

| Channel | Provider path | Publicly documented requirements | Status |
|---|---|---|---|
| **WhatsApp** | Meta **Cloud API** directly, or via a BSP | Verified Meta Business account; a phone number not already on WhatsApp; verified display name; **message templates pre-approved** for business-initiated messages; **24-hour customer-service window** for free-form replies; **opt-in required**; per-conversation pricing; quality rating and messaging tiers | Repo already has ingestion + outbox + consent for WhatsApp; **template approval and business verification are external lead times** |
| **SMS (BD)** | Local aggregator or CPaaS | Alphanumeric Sender ID registration (GP/Robi/TelTalk), opt-in, STOP handling in Bangla, no two-way SMS on some routes | Code exists (`outbound-providers.ts`); **registration is the blocker** |
| **Facebook Messenger / Instagram** | Meta Graph API | App review, page permissions, 24-hour messaging window rules | Ingestion exists; app review external |
| **Email** | SMTP/transactional provider | SPF/DKIM/DMARC; opt-in; unsubscribe | Not required for MVP |
| **Web chat** | our own (WebSocket) | Consent banner, retention policy | Build locally |

---

## 8. Payment providers

| Provider | Public posture | Adapter notes |
|---|---|---|
| bKash / Nagad (MFS) | Merchant onboarding + agreement required | `PaymentProvider` adapter; webhook signature verification; reconciliation file |
| SSLCommerz / bank gateways | Merchant account required | same |
| Stripe / international cards | Requires entity + KYC; FX and cross-border rules apply | same |

The repo's current payment route deliberately returns **503** and creates nothing. That behaviour stays until a provider is contracted, signature verification is implemented, and reconciliation is tested. **No fee, rate or margin may be shown to a tenant before the provider's actual invoice is in hand.**

---

## 9. Adapter contract, capability discovery and degradation

```ts
type Capability =
  | 'inbound' | 'outbound' | 'did_local' | 'did_national' | 'did_international'
  | 'caller_id_presentation' | 'media_streaming' | 'carrier_recording'
  | 'dtmf_rfc2833' | 'transfer_blind' | 'transfer_attended' | 'siprec'
  | 'sms_mt' | 'sms_mo' | 'number_port_in' | 'webhooks' | 'cdr_api';

interface AdapterDescriptor {
  id: string;
  kind: 'SIP_TRUNK' | 'CPAAS' | 'MESSAGING' | 'AI' | 'PAYMENT';
  capabilities: Capability[];
  /** What the product loses when this adapter is absent, in user words. */
  degrades: string[];
  /** Env/secret names only — never values. */
  requires: string[];
  /** Which regulatory model the adapter expects, so a change is visible. */
  regulatoryProfile?: 'BD_IPTSP' | 'BD_ICX_IGW' | 'CPAAS_GLOBAL' | 'LAB';
}
```

Rules:
1. Every adapter registers a descriptor at build time; the admin UI renders **only** the features the capabilities support, and explains the missing ones.
2. A feature request that the active adapter cannot satisfy returns a typed `CAPABILITY_UNAVAILABLE` with the reason — never a silent no-op.
3. **Contract tests** (recorded request/response fixtures, including duplicates, out-of-order webhooks, partial failures and signature failures) run in CI for every adapter. This mirrors the repo's existing webhook-signature and outbound-adapter test discipline.
4. Every adapter has a `health()` that the `/super-admin` panel shows; `UNCONFIGURED` is a distinct, normal state.

---

## 10. Provider selection rubric (score each candidate; do not average away a blocker)

| Criterion | Weight | Why | Hard fail conditions |
|---|---|---|---|
| Licence/regulatory compliance in BD | **gate** | Illegal termination or non-compliant recording ends the product | No valid licence; refusal to document compliance |
| Per-tenant separation | **gate** | Determines whether the SaaS model is even lawful (§2) | Cannot support separate trunks/clients |
| Number availability & portability | 20 % | Without numbers there is no product | No BD DIDs without an unrealistic contract |
| Media access (SIP/RTP or streaming) | 15 % | Required for AI audio path | Closed media (no SIP/RTP, no stream) |
| Reliability & SLA | 15 % | Calls are real-time | No SLA, no status page, single PoP for BD |
| Cost transparency | 10 % | We refuse to invent margins | Opaque per-second rates |
| Data residency & DPA | 10 % | PDPA 2026 | Refuses DPA / data outside BD with no basis |
| CDR/API quality | 10 % | Billing and reconciliation | No CDR access |
| Support quality & escalation | 10 % | Live calls break | No named escalation path |
| Exit/portability | 10 % | Replaceability is a requirement | Long lock-in, no number port-out |

**Due-diligence dossier per provider (must exist before signature):** licence certificate + validity, DPA with subprocessor list and data locations, SLA + credits, security posture (SOC2/ISO evidence or equivalent), incident notice terms, number port-out process, CDR format samples, media/streaming technical spec (codecs, packetisation, sample rates, SRTP), lawful-intercept interface expectations, pricing schedule with currency and taxes, termination terms, and a written answer to the per-tenant-separation question.

---

## 11. Unknowns that must be closed (tracked as blocking)

| # | Unknown | Blocks | Who answers |
|---|---|---|---|
| U-1 | Which licensed partner, which licence class, what DB numbers, what lead time | Real calls | Owner + partner |
| U-2 | May one licensed call-centre/trunk host multiple unrelated tenant businesses? | Multi-tenant SaaS in BD | BD telecom counsel |
| U-3 | Does the 2026 unified policy change the partner's obligations during our contract? | Architecture stability | Counsel, revisited per term |
| U-4 | PDPA 2026: is a call recording "confidential data" that must stay in BD? What is the lawful basis for recording? Is cross-border AI processing permitted with consent? | Hosting + AI placement | Counsel |
| U-5 | Can the partner's LI obligations be satisfied without ALO building surveillance features? | Product ethics/legal | Counsel + partner |
| U-6 | CPaaS BD number availability and any address-proof requirements for our tenants | Fast-demo path | CPaaS sales (written) |
| U-7 | Carrier-side recording consent/announcement requirements in BD | Recording feature | Counsel |
| U-8 | Actual per-minute, per-number, per-SMS costs | Any pricing/MRR claim | Signed schedule |
| U-9 | Host CPU/RAM/GPU and whether voice may share the exam host | Everything capacity-related | Owner/ops |
| U-10 | GPU procurement vs rented evaluation time | Phase 3 timeline | Owner |
