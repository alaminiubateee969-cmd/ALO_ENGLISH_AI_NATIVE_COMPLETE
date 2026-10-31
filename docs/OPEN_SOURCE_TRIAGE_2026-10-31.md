# Open-Source Component Triage — Featured Repository Batch

**Document:** `docs/OPEN_SOURCE_TRIAGE_2026-10-31.md`
**Batch received:** 2026-10-31 (links supplied by the owner)
**Programme:** ALO AI Voice & Contact Center (Phase 0)
**Purpose:** decide, per repository, whether ALO may **depend on it in the product**, **use it to build the product**, **use it only as a reference**, or **must not use it** — with the licence evidence that justifies the decision.

> **Nothing in this list has been adopted, installed, cloned or tested.** Metadata below was read from the GitHub API on 2026-10-31 (licence SPDX id, stars, created date, latest push, open issues) and, where the decision hinges on it, from the repository's own `LICENSE` file. Capability claims in a README are the author's claims, not ALO's verification.
>
> **Stars are not maturity.** Several items here were created in 2026 and already carry hundreds to thousands of open issues. A popular repository is a lead, not a dependency.

---

## 1. Verdict in one table

| Component | Verified licence | Best use | Decision |
|---|---|---|---|
| `jamiepine/voicebox` | **MIT** | Local voice studio / TTS I/O stack | **EVALUATE — legally clean.** Audit the code before it touches tenant audio; not a dependency yet |
| `debpalash/VoiceStudio` | **AGPL-3.0** | EleveLabs-style local voice studio | **REFERENCE ONLY.** Cannot be embedded or operated as part of our service |
| `langgenius/dify` | **Modified Apache-2.0 + explicit ban on multi-tenant operation** | Agent/RAG platform | **DISQUALIFIED** for our product |
| `invoiceninja/invoiceninja` | **Elastic License 2.0** | Invoicing | **DISQUALIFIED** as embedded billing (hosted-service ban) |
| `metabase/metabase` | **AGPL-3.0** (+ commercial in `enterprise/`) | BI dashboards | **EXTERNAL SERVICE ONLY** — internal ops, never shipped |
| `wassgha/rescript` | **PolyForm Noncommercial 1.0.0** | Transcript-based audio/video editing | **EXCLUDED** (non-commercial) |
| `paperless-ngx` | **GPL-3.0** | Document archive/DMS | **OPTIONAL, EXTERNAL** — per-tenant add-on at most; not v1 |
| `D4Vinci/Scrapling` | **BSD-3-Clause** | Web crawling for KB ingestion | **EVALUATE (small spike)** — legal, but Python + must respect robots/ToS |
| `cloudflare/security-audit-skill` | **MIT** | Agent-driven security audit | **ADOPT (engineering workflow)** for Phase 7 prep |
| `aerovato/container` | **BSD-3-Clause** | Sandboxed agent workspaces | **ADOPT (engineering workflow, optional)** |
| `gitroomhq/postiz-app` | **AGPL-3.0** | Social scheduling | **OUT OF SCOPE** (and AGPL) |
| `dubinc/dub.link` | **NOASSERTION** (AGPL-family; verify) | Link attribution | **OUT OF SCOPE** |
| `obsproject/obs-studio` | **GPL-2.0** | Screen recording/streaming | **OUT OF SCOPE** |
| `KDE/kdenlive` | **GPL-3.0** | Video editing | **OUT OF SCOPE** |
| `harry0703/MoneyPrinterTurbo` | **MIT** | Short-video generation | **OUT OF SCOPE** (v1) |
| `mutonby/openshorts` | **MIT** | Short-video clipping (fork) | **OUT OF SCOPE** |
| `presenton/presenton` | **Apache-2.0** | Slide generation | **OUT OF SCOPE** |
| `every-app/open-seo` | **MIT** | SEO tooling | **OUT OF SCOPE** (marketing site, not voice) |
| `R8rly/show` | **CC-BY-SA-4.0** | Book/film content-rating standard | **OUT OF SCOPE** |
| `morluto/rea` | **MIT** | Reverse-engineering agent harness | **REFERENCE ONLY, with strict rules** (§7) |
| `network-tocoder/Local-REA-…-16GB-GPU` | **No licence** | REA fork | **MUST NOT USE** — no licence means all rights reserved |
| `anomalyco/opencode`, `ruvnet/ruflo`, `HKUDS/CLI-Anything`, `bisque-cloud/presenter`, `pvjbuilds/delegate-router`, `anshuxinha/karpathy-skills-extended`, `Panniantong/Agent-Reach` | MIT / Apache-2.0 | Coding agents, skills, CLI glue | **ENGINEERING TOOLING ONLY** (§6) — never a runtime dependency |
| `anthropics/claude-plugins-official`, `anthropics/knowledge-work-plugins`, `cursor/plugins`, `android/skills`, `K-Dense-AI/scientific-agent-skills` | Apache-2.0 / **none** / per-plugin | Plugin & skill catalogues | **ENGINEERING TOOLING ONLY**, with the supply-chain rules in §6.3 |
| `treg.to`, `testsprite.com`, `studio.tripo3d.ai`, Brahma Evo/Echo, APIQIK, Notion resource page | **No code / commercial service** | Various SaaS | **NOT AUDITABLE** — no licence to review; treat as marketing references |

---

## 2. The two voice-studio repositories (the only items that touch our core)

### 2.1 `jamiepine/voicebox` — MIT, 59 k stars, created 2026-01-25, 526 open issues

- **What it is (per README):** "the open-source AI voice studio… clone any voice, generate speech, dictate into any app… the full voice I/O stack, running locally."
- **Licence:** **MIT** (API-verified from `LICENSE`). MIT permits commercial use, modification, sublicensing and distribution with attribution and no warranty.
- **Why it is interesting to us:** it is the closest existing shape to Module C (Voice Generation Studio) + parts of Module D (dictation), and MIT means we may legally read, adapt and ship derived code.
- **Why it is not automatically our engine:**
  1. **It is a desktop-oriented application**, whereas we need a multi-tenant server-side synthesis service with per-tenant keys, quotas and audit. We would inherit an app, not a service contract.
  2. **Model licences do not transfer.** An MIT app that loads XTTS-v2 (CPML, non-commercial), MMS (CC-BY-NC) or any other checkpoint **does not launder that model's terms**. Our `BANGLA_VOICE_MODEL_EVALUATION.md` licence register still governs.
  3. **Bangla is not a solved problem there either.** The README's "clone any voice" is a product claim; there is no published bn-BD benchmark in what we read. It does not replace our frozen test sets.
  4. **Supply chain:** any code we take must be reviewed for telemetry, auto-update, model auto-download and outbound calls before it runs anywhere near tenant audio.

**Decision: EVALUATE in Phase 3** — (a) read its architecture for our studio service design, (b) run a one-day licence-and-security audit of the code we might reuse, (c) test it as a *local dev tool* for producing reference audio while our Bangla evaluation runs. Promote to a dependency only if our own service contract and the model licence register both agree.

### 2.2 `debpalash/VoiceStudio` — AGPL-3.0, 96 k stars, created 2026-04-09

- **What it is (per README):** on-device voice studio — clone, design, dub, dictate, transcribe, narrate.
- **Licence:** **AGPL-3.0** (API-verified).
- **The problem:** AGPL §13 extends copyleft to **network use**. If ALO modifies VoiceStudio and lets tenants interact with it over a network, ALO must offer those users the corresponding source — of the modified program. For a proprietary multi-tenant SaaS whose studio is a commercial differentiator, that is not a licence we can accept for embedded use.
- **Could it be an "external service" like our integration registry's AGPL entries?** Those entries are *third-party services we call*, not software we operate as part of the product. Here we would be **the operator**. "Run it unmodified behind an HTTP boundary" is sometimes argued to avoid §13, but that is a legal position, not an engineering fact, and it sits on the product's core surface. **Not acceptable without written legal opinion, and not worth one for a component we can otherwise build.**

**Decision: REFERENCE ONLY.** Read the UX and pipeline ideas; take no code; do not deploy it inside our platform.

> The same rule applies to any AGPL-licensed component that would sit on the **customer-facing voice path**. Our existing repository convention — "AGPL: EXTERNAL_SERVICE_ONLY" (`src/lib/integrations/registry.ts`) — is the correct default and this is the reason it exists.

---

## 3. Agent/RAG platform: `langgenius/dify` — DISQUALIFIED

This is the most seductive item in the batch ("build agentic workflows and RAG pipelines on one workspace"), and the licence is the reason we cannot use it.

**Verified `LICENSE` text:** *"Dify is licensed under a modified version of the Apache License 2.0, with the following additional conditions… **Multi-tenant service: Unless explicitly authorized by Dify in writing, you may not use the Dify source code to operate a multi-tenant environment.**"* — where a tenant is a workspace. There is a second condition about preserving branding/logo in the UI.

Our product is, by definition, a multi-tenant platform (`VOICE_CONTACT_CENTER_AUDIT.md` §4.1). Using Dify as the orchestration or knowledge layer would either break that condition or force a commercial licence negotiation for the core of the product — with a vendor who can change terms. It also brings a parallel data model (its own workspaces, users, datasets) that would fight our tenancy model rather than reinforce it.

**Decision: no product dependency.** If a tenant ever wants Dify-like visual agent building, the honest options are (a) build the workflow builder on our own orchestrator, or (b) run a **licensed, per-tenant, single-tenant** Dify instance as a separate product they buy — not silently inside ALO Voice.

---

## 4. Knowledge base / document handling

| Item | Licence | Assessment |
|---|---|---|
| `paperless-ngx` | GPL-3.0 | Excellent DMS, but GPL-3.0 + a completely separate data model. If a tenant wants document archiving, integrate as an **external** system via API. Not v1; not on the call path |
| `D4Vinci/Scrapling` | BSD-3-Clause | Legitimate for "website content where authorized" (Module K). Constraints: Python (our runtime is Node/TS) → out-of-process crawler; must honour `robots.txt`, ToS, rate limits, and a per-tenant allowlist; must never crawl a tenant's competitors on their behalf without authorisation. **Spike only** if website ingestion becomes a real requirement |

Nothing here changes the Phase 3 plan: knowledge base = local embeddings + vector index, tenant-scoped, permissioned, with retrieval audit.

---

## 5. Billing, analytics and social — all confirmed out of the product

| Item | Licence | Why it cannot be the product's component |
|---|---|---|
| `invoiceninja` | **Elastic License 2.0** — *"You may not provide the software to third parties as a hosted or managed service…"* | Our SaaS **is** a hosted service. Also has licence-key functionality that may not be circumvented. **Build our own** invoicing (already the plan, Phase 6) |
| `metabase` | **AGPL-3.0** outside `enterprise/`, commercial inside | Fine as an **internal** ops dashboard that only ALO staff use (we are the only network user). Never ship it to tenants as embedded analytics. Our tenant-facing analytics are our own code |
| `dub.link` | NOASSERTION (AGPL-family) | Link attribution — not a voice capability |
| `postiz` | AGPL-3.0 | Social scheduling — out of scope |
| `open-seo` | MIT | Marketing site tooling, not the voice product |

---

## 6. Engineering tooling (useful, but never a runtime dependency)

### 6.1 Worth adopting now

| Tool | Licence | Use |
|---|---|---|
| `cloudflare/security-audit-skill` | MIT | A structured, machine-readable security-audit workflow. Directly useful as **input to Phase 7** (`SECURITY_AND_COMPLIANCE.md` §15 checklist) — and for reviewing our own code before the external pen test |
| `aerovato/container` | BSD-3-Clause | Persistent Linux workspaces for agents — the right way to run any third-party skill without giving it the host or our secrets |

### 6.2 Optional / situational

`anomalyco/opencode` (MIT), `ruvnet/ruflo` (MIT), `HKUDS/CLI-Anything` (Apache-2.0), `Panniantong/Agent-Reach` (MIT), `pvjbuilds/delegate-router` (MIT), `bisque-cloud/presenter` (MIT), `anshuxinha/karpathy-skills-extended` (MIT): all legitimate developer aids for **how we build**, none of which belong in a call path, a tenant's data flow, or a production image.

### 6.3 Supply-chain rules for agent skills and plugins (applies to every "skills" repo here)

1. **A skill is executable content.** Review it like a dependency, not like a blog post: read the scripts, check for network egress, credential access, and `git`/`npm`/`pip` hooks.
2. **Pin to a commit**, not to a branch; record the commit in the repo. `cursor/plugins` has **no licence file** — nothing from it may be copied; treat as read-only inspiration.
3. **Run in a sandbox** (`aerovato/container`, a container, or a throwaway VM) with no production secrets and no inbound access to tenant data.
4. **No skill gets carrier, model or billing credentials.** If a workflow needs them, it calls an ALO tool with an explicit, scoped interface.
5. **Prefer first-party.** `anthropics/claude-plugins-official` is a *directory*; licence per plugin varies even though the repo is Apache-2.0. Same for the knowledge-work plugin set.
6. **Do not install "skills" into the production application.** They live in our development toolchain; the product has no plugin loader.

---

## 7. The reverse-engineering repositories — permitted use, and the line

The brief already sets the rule: *"Study publicly observable product capabilities and independently implement comparable functionality… Do not simply reproduce CallHippo's branding, copyrighted UI, proprietary code, or protected assets."* The REA repositories are tooling for exactly that kind of study, so they need explicit boundaries.

**Permitted:**
- Observing and documenting **publicly visible behaviour** of a competitor's product (screens you can reach with your own account, public docs, public marketing, published API docs).
- Writing down capability requirements derived from that observation, in our own words, and designing our own implementation.

**Not permitted:**
- Decompiling, disassembling, or extracting code or assets from a proprietary client (the `Local-REA…` project explicitly targets "down to native binaries" — that is the line).
- Circumventing authentication, licence checks, rate limits, or anti-tampering.
- Scraping in breach of terms of service or `robots.txt`.
- Reproducing UI layouts pixel-for-pixel, copying icon sets, copy text, or brand assets.
- Using `network-tocoder/Local-REA-…`: the repository has **no licence file**, which under default copyright means **no rights granted**. Its code, prompts and weights may not be copied or reused.

**Clean-room note:** if we ever reuse knowledge from this exercise, keep the artefacts separate — capability notes in `docs/` (ours), implementation written without the competitor's source in front of the author, reviewable in git history. That is what makes "independently implement" defensible rather than rhetorical.

---

## 8. Unverifiable entries

`treg.to` (a rating registry site), `testsprite.com` (commercial AI testing SaaS), `studio.tripo3d.ai` (3D asset SaaS), Brahma Evo/Echo (demo sites), APIQIK (paid API marketplace), the Notion resource page, and the Netlify demo: these carry **no source code and no licence we can review**. They are not components. Any claim about them in a future document must be sourced from their own published terms, not assumed.

---

## 9. What this batch changes in the plan

| Change | Where | Effect |
|---|---|---|
| Add `voicebox` (MIT) as a Phase 3 **reference implementation** + code-audit candidate | `BANGLA_VOICE_MODEL_EVALUATION.md` §8, roadmap Phase 3 | Small. Does **not** replace the Bangla shortlist or the licence register |
| Record the Dify multi-tenant clause as a hard no | `SECURITY_AND_COMPLIANCE.md` §11 vendor register | Prevents a future "just use Dify" shortcut |
| Keep billing in-house (Invoice Ninja ELv2 confirmed unusable as a hosted component) | roadmap Phase 6 | None — matches the existing plan |
| Add `security-audit-skill` to Phase 7 preparation | roadmap Phase 7 | Positive: cheaper pre-audit |
| Add supply-chain rules for agent skills | this document + Phase 1 CI hardening | Small policy addition |
| Everything else | — | **No architectural change.** The Phase 0 design stands |

**Net effect on Phase 0 conclusions: none.** No item in this batch supplies the two things the programme is actually waiting for — a licensed Bangladeshi telephony partner and a measured bn-BD voice model. It does supply useful tooling and two genuinely instructive voice-studio codebases to read.

---

## 10. Licence register additions (paste into the Phase 3 register)

| Component | Licence | Permitted use | Obligation | Decision |
|---|---|---|---|---|
| voicebox | MIT | Read, adapt, ship with attribution | Keep copyright + permission notice | EVALUATE |
| VoiceStudio | AGPL-3.0 | **Not permitted** in our service | — | REFERENCE ONLY |
| dify | Modified Apache-2.0 | Single-tenant only, **no multi-tenant** without written permission | Branding preserved; commercial licence otherwise | NOT USED |
| Invoice Ninja | ELv2 | **Not permitted** as hosted service | — | NOT USED |
| Rescript | PolyForm Noncommercial | Non-commercial only | — | NOT USED |
| Metabase | AGPL-3.0 / commercial | Internal ALO use only | Offer source to network users if modified | EXTERNAL, INTERNAL |
| paperless-ngx | GPL-3.0 | External system integration only | — | DEFERRED |
| Scrapling | BSD-3-Clause | Out-of-process crawler | Attribution; robots/ToS compliance | SPIKE |
| security-audit-skill | MIT | Engineering workflow | Attribution | ADOPT (dev) |
| container | BSD-3-Clause | Engineering workflow | Attribution | ADOPT (dev) |
| Local-REA fork | **None** | **No rights** | — | DO NOT USE |

---

## 11. Open questions for the owner

1. Was the intent of this batch **(a)** "evaluate these for ALO Voice", or **(b)** "use these to speed up how you build"? This document assumes both, with tooling kept out of the product.
2. Does ALO accept **MIT/BSD attribution** in an "Open-source components" screen for the product? (Required if we reuse any voicebox code.)
3. Is a **commercial Dify licence** or an AGPL exception ever acceptable as a strategic option, or is in-house the permanent rule? (Recommendation: in-house.)
4. Should website ingestion for the knowledge base be in v1 at all? (Recommendation: no — documents and FAQs first, crawling later, with per-tenant authorisation.)
