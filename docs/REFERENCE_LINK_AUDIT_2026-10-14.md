# Reference Link Audit — 2026-10-14

**Scope:** every GitHub URL supplied in the reference list, plus the non-GitHub web resources in the same list.
**Method:** each repository was queried through the GitHub API (`gh api repos/<owner>/<name>`) on 2026-10-14 for existence, primary language, star count, license identifier, archived flag, last push date, and description. No repository was cloned and no third-party code was copied into this project.
**Rule applied:** a reference is only *actionable* if (a) it exists, (b) its license permits reuse in a commercial application, and (c) it addresses a capability this platform actually needs. Popularity is not relevance.

## 1. Existence check

| Result | Count |
| --- | --- |
| Links supplied (after de-duplication) | 138 |
| Resolve on GitHub | 134 |
| Do not resolve | 4 |

The four that do not resolve:

| Link as supplied | Status |
| --- | --- |
| `engralaminn-collab/alo-education-uk-final` | 404 — not accessible to this account (private, renamed, or deleted) |
| `engralaminn-collab/ukvi-ai-markting_n8n` | 404 — same |
| `engralaminn-collab/Ai-Markting-crm` (listed 3×) | 404 — same |
| `debbalash/VoiceStudio` | 404 — spelling; the real repository is `debpalash/VoiceStudio`, which **does** resolve |

The supplied list also contained heavy duplication (for example `omacom/omarchy`, `melgarafael/DeskcommCRM`, `Django-CRM/Django-CRM`, `GAIR-NLP/LiveTalk` and several `mureka.ai` / `gods-eye-view` links each appeared two or more times).

## 2. License check — the finding that matters most

This is the part that decides whether anything can be *implemented from* a reference or only *learned from*.

| License | Count | Can code be copied into this platform? |
| --- | --- | --- |
| MIT | 51 | Yes, with attribution |
| Apache-2.0 | 20 | Yes, with attribution + NOTICE |
| BSD-3-Clause / Unlicense / CC-BY-4.0 | 3 | Yes |
| **AGPL-3.0** | **10** | **No** — network-copyleft; using it in a hosted product obliges source disclosure under AGPL terms |
| **GPL-3.0** | **7** | **No** — copyleft; not compatible with a closed hosted product |
| LGPL-3.0 / LGPL-2.1 | 2 | Only as a separate, unmodified process/library, not linked into app code |
| NOASSERTION (custom/ambiguous) | 19 | Not without reading each licence file |
| **No licence at all** | **22** | **No** — default "all rights reserved"; nothing may be reused |

Copyleft references (do not copy code from): `ToolJet/ToolJet`, `firecrawl/firecrawl`, `frappe/crm`, `idurar/idurar-erp-crm`, `siyuan-note/siyuan`, `volcengine/OpenViking`, `DIYgod/RSSHub`, `BelledonneCommunications/linphone-iphone`, `0perationPrivacy/VoIP`, `elebumm/RedditVideoMakerBot`, `WEIFENG2333/VideoCaptioner`, `Kosinkadink/ComfyUI-VideoHelperSuite`, `ramon-victor/freegpt-webui`, `dunossauro/videomaker-helper`.

No-licence references (may be read for ideas only): `cursor/plugins`, `nabaleducation/EducationConsultancyWebsite`, `arupdas0825/studytra`, `Bhawana0218/NextStep-Abroad`, `ioi-labs/molx`, `brightdata/open-enrich`, `BraaMohammed/bricks`, `Odoo-mobile/crm`, `dennisivy/crash-course-CRM`, and 13 others listed in the appendix.

Also note: `huggingface/education-toolkit` and `ramon-victor/freegpt-webui` are **archived** by their owners.

## 3. Relevance classification

### A. Applicable — these map onto capabilities this platform has or needs

| Reference | Licence | What is actually reusable | Where it lands in this repo |
| --- | --- | --- | --- |
| `cathrynlavery/diagram-design` | MIT | 44 diagram types as self-contained HTML + inline SVG, no Mermaid | New `src/components/diagrams/*` used by `/resources`, `/language-prep`, `/exam-prep` |
| `tt-a1i/archify` | MIT | Idea/plan → interactive diagram rendering patterns | Same component set; authoring flow for study-roadmap visuals |
| `every-app/open-seo` | MIT | SEO audit surface: metadata, sitemap, robots, keyword/gap reporting | `src/app/sitemap.ts`, `src/app/robots.ts`, per-route `generateMetadata`, a `/admin` SEO panel |
| `coreyhaines31/marketingskills` | MIT | Marketing agent skills: CRO, copywriting, SEO, analytics, growth experiments | Prompt/skill packs behind `src/lib/agents/registry.ts`; extends existing `src/lib/marketing-kit.ts` |
| `umami-software/umami` | MIT | Privacy-first, self-hostable web analytics (fits the platform's no-tracking posture) | Self-hosted service + a first-party `/api/analytics` bridge; no PII in the app DB |
| `chatwoot/chatwoot` | NOASSERTION (self-host terms) | Omni-channel support inbox (web, WhatsApp, email) | Alternative to building `src/app/api/crm/messages` escalation; integrate as external service |
| `TryGhost/Ghost` | MIT | Blog/newsletter publishing with memberships | Content-marketing site at a subdomain, or a `/blog` route fed by the Ghost API |
| `ArnasDon/wacrm` | MIT | WhatsApp shared-inbox + pipeline UI patterns (TypeScript) | UI patterns for `/admin`, CRM lead pipeline and message threads |
| `melgarafael/DeskcommCRM` | MIT | Agentic CRM + WhatsApp (WAHA) architecture, TypeScript | Same; agent-assist patterns for the CRM side |
| `trycompai/crm` | MIT | Agent-first CRM data model and UX (TypeScript) | Reference for lead/deal pipeline modelling alongside existing Prisma CRM models |
| `twentyhq/twenty` | NOASSERTION | Object/field metadata model for flexible CRM entities | Data-model reference only; do not copy code |
| `Django-CRM/Django-CRM` | MIT | Multi-tenant CRM entity/permission design | Design reference; stack differs (Python/SvelteKit) |
| `languagetool-org/languagetool` | LGPL-2.1 | Grammar/style/style-checking engine, 25+ languages | Run as a **separate HTTP service** consumed by writing practice for concrete grammar feedback |
| `blader/humanizer` | MIT | Heuristics for removing AI-sounding prose | Quality filter for AI-drafted marketing copy and study material |
| `public-apis/public-apis` | MIT | Curated catalogue of free public APIs | Sourcing list for integrations (news, country/visa data, dictionaries) |
| `firecrawl/firecrawl` + `firecrawl/web-agent` + `ioi-labs/molx` | AGPL / AGPL / no licence | Structured web research for official exam-board and visa-rule updates | Integrate as an external service or reimplement; do not vendor the code |
| `clawnify/OpenProspector`, `brightdata/open-enrich`, `BraaMohammed/bricks`, `parthasarathy123/n8n-gtm-lead-enrichment` | MIT / none / none / none | Lead enrichment + dedup pipelines for the CRM | Pattern source for a lead-scoring/enrichment job; only `OpenProspector` is MIT |
| `nashsu/llm_wiki`, `siyuan-note/siyuan` | NOASSERTION / AGPL | Document → organised knowledge base, agent-usable | Reference for the existing `studymaterial` / RAG surface; do not copy code |
| `huggingface/education-toolkit` | Apache-2.0 (archived) | Teaching-material structure (tutorials, slides, translations) | Pattern for learner-facing course content pages |
| `nabaleducation/EducationConsultancyWebsite`, `arupdas0825/studytra`, `Bhawana0218/NextStep-Abroad` | none / none / none | Study-abroad IA, roadmap/visa/cost/timeline UX, admin dashboard layout | UX/IA reference for `/destinations`, `/course-finder`, `/universities`, `/scholarships`, `/student` — visual ideas only, no code |
| `volcengine/OpenViking`, `akitaonrails/ai-memory`, `sulabhdubey/rta-smriti-brain`, `Artistsyn/cortex_suite` | AGPL / per-repo / per-repo / none | Agent memory + RAG patterns | Design reference for `src/lib/ai/learning/*` and `learning-memory`; OpenViking is AGPL |
| `ToolJet/ToolJet` | AGPL-3.0 | Internal-tool builder concept | Concept only — an admin builder is already covered by `/admin` |
| `CapSoftware/Cap` | NOASSERTION | Screen-recording UX | Only relevant if recorded-speaking-test review is ever needed |

### B. Not applicable to this platform (with the reason)

| Theme | References | Why not |
| --- | --- | --- |
| Desktop/Linux ricing, OS tooling | `omacom/omarchy`, `Lakr233/vphone-cli`, `AprilNEA/OpenLogi`, `vastsa/PI-Desktop` | Desktop/OS utilities; a web exam platform has no surface for them |
| Lower-level graphics / C++ / systems | `fmtlib/fmt`, `armory3d/armorpaint`, `YutaroHayakawa/ipftrace2` | Unrelated language and problem domain |
| Video generation, editing, dubbing, avatars | `heygen-com/hyperframes`, `Lightricks/LTX-Video`, `Tencent-Hunyuan/HunyuanVideo`, `zai-org/CogVideo`, `MeiGen-AI/InfiniteTalk`, `GAIR-NLP/LiveTalk`, `OpenTalker/video-retalking`, `remotion-dev/remotion`, `harry0703/MoneyPrinterTurbo`, `elebumm/RedditVideoMakerBot`, `YaoFANGUK/video-subtitle-remover`, `WEIFENG2333/VideoCaptioner`, `Augani/openreel-video`, `jitsi/jitsi-videobridge`, `HITsz-TMG/VideoClaw`, `HKUDS/VideoAgent`, `LoSealL/VideoSuperResolution`, `meituan-longcat/LongCat-Video`, `ATH-MaaS/Pixelle-Video`, `MarkTechStation/VideoCode`, `3b1b/videos`, `ytdl-org/youtube-dl`, `bradautomates/claude-video`, `qdrzwd/VideoRecorder` + ~10 more `VideoMaker*` repos | Video production pipelines. This platform pre-recorded listening audio and text/graphical exam UI; nothing here serves that |
| Telephony / VoIP / SMS | `BelledonneCommunications/linphone-iphone`, `0perationPrivacy/VoIP`, `developerspace-samples/VoIP-Call-Sample`, `NdoleStudio/httpsms`, `NdoleStudio/httpsms-node`, `domovinatv/sms.domovina.ai`, `sibnerian/electron-promise-ipc` | Real telephony stacks; out of scope for an exam/CRM web app |
| Model training & foundation models | `jingyaogong/minimind`, `google-research/timesfm`, `zai-org/GLM-5`, `FoundationAgents/MetaGPT` | Training/serving research code; this platform consumes provider APIs |
| Coding-agent harnesses & agent-marketplace tooling | `affaan-m/ECC`, `ruvnet/ruflo`, `cline/cline`, `Gitlawb/openclaude`, `cursor/plugins`, `anthropics/claude-plugins-community`, `templetongroup/radiant`, `timharris707/modeldeck`, `mksglu/context-mode`, `EfficientStreet/hindsight` | Developer-tooling for coding agents, not product features |
| Video/RSS/knowledge apps, note apps | `DIYgod/RSSHub`, `Onyx-Dev-Labs/doodle-note` | Separate products |
| Payments/accounting/security/unrelated | `VonHoltenCodes/SlowBooks-Pro-2026`, `dani-garcia/vaultwarden`, `bugcrowd/bugcrowd_university`, `nwuzmedoutlook/university`, `alsk1992/CloddsBot`, `tinystruct/smalltalk`, `ramon-victor/freegpt-webui`, `songguoxs/gpt4o-image-prompts`, `GetGoAPI/Free-GPT-Grok-Gemini-Claude-API`, `teremterem/claude-code-gpt-5-codex`, `Lin-jun-xiang/docGPT-langchain`, `meta-models/meta-model-cookbook`, `K-Dense-AI/scientific-agent-skills`, `EfficientStreet/youtube-subscriptions-ingest`, `bilawalsidhu/gods-eye-view`, `JetBrains/go-modern-guidelines`, `THU-MAIC/OpenMAIC`,  `crmeb/CRMEB`, `ChurchCRM/CRM`, `oroinc/crm`, `oroinc/crm-application`, `Odoo-mobile/crm`, `fatfreecrm/fat_free_crm`, `guifav/market-intelligence-radar`, `workwithlos-ui/dave`, `Kayforkind/reimagine-it`, `Bilal-Belli/videoMakerBOT`, `Nncstudio/VideoMakerPro`, `seed0001/videoMaker`, `shubhamdevhouse/Animated-VideoMaker`, `viniciusenari/slideshow-videomaker`, `burhankocabiyik/videomaker`, `wtz2017/VideoMaker`, `WuTao-CS/VideoMaker`, `mohamed11sk/Email-markting`, `knsoftic/Email_Markting`, `0voice/audio_video_streaming`, `leandromoreira/digital_video_introduction`, `thu-ml/CRM`, `nextcloud/server` | Wrong domain, or a separate product with no reusable surface here |

Two name-driven false positives worth recording: `thu-ml/CRM` is *"Single Image to 3D Textured Mesh"* research, not a CRM; `crmeb/CRMEB` is an e-commerce mall, not a CRM.

### C. Non-GitHub URLs in the same list

| URL | Nature | Verdict |
| --- | --- | --- |
| `buffer.com` | Commercial social-media scheduling SaaS | Marketing tooling choice, not code |
| `openrouter.ai` + `/blog/tutorials/build-tool-calling-agent-loop` | Model-routing provider + a tool-calling agent-loop tutorial | **Relevant** — `.env.example` already carries `OPENROUTER_API_KEY`; the loop pattern matches `src/lib/agents/` |
| `coder.qwen.ai`, `astryx.atmeta.com`, `developer.meta.com/ai` | Vendor products/docs | Not code |
| `cline.bot` | Commercial coding agent | Not product code |
| `stackoverflow.com` | Q&A site | Not code |
| `mureka.ai` | Commercial AI music service | Not relevant (no music surface) |
| `enerpize.com`, `aipraktor.com`, `supercool.com`, `join.supercool.com` | Commercial websites | Competitive/inspiration reference only |

## 5. Implementation status (updated 2026-10-14)

Section 3A is a checklist, not a reading list. This is where each actionable row
stands now, in the order the checklist puts them. "Implemented" means code, tests
and a failure mode that is honest when the external service is absent — not a
screen that renders.

| Reference | Status | Where |
| --- | --- | --- |
| `cathrynlavery/diagram-design`, `tt-a1i/archify` | Implemented | `src/components/diagrams/*` (4 diagrams, `tests/diagrams-render.test.tsx`) used by `/resources`, `/language-prep` and `/exam-prep` |
| `every-app/open-seo` | Implemented | `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/public-routes.ts`, and the audit surface: `src/lib/seo/audit.ts` + `src/lib/seo/metadata.ts` + `tests/seo-audit.test.ts` (metadata, duplicates, keyword cannibalisation, sitemap drift) read by the `/admin/seo` panel. Two public pages that had no metadata of their own got route layouts (`/exam-prep`, `/ask-handbook`) and six got real descriptions instead of a title-only stub. Titles are measured as **rendered** — the audit counts the layout's `%s — ALO Education` suffix, which is what a search result actually truncates |
| `coreyhaines31/marketingskills` | Implemented | `src/lib/agents/skills/*` (marketing skill pack + `copy-guard` safe-claims checker) behind `src/lib/agents/registry.ts` |
| `umami-software/umami` | Implemented as a first-party bridge | `src/lib/analytics/events.ts`, `/api/analytics/events` beacon, `/api/admin/analytics`, `/admin/analytics`, `AnalyticsCounter` table + migration `20261014180000`. Aggregate counters only: no cookie, session, IP, user-agent or free text can enter the table, and the rules are enforced in the module and tested |
| `TryGhost/Ghost` | Implemented in-repo, Ghost kept as the external option | `/blog` and `/blog/<slug>` over a `BlogPost` table (migration `20261014190000`), `src/lib/content/blog.ts` and `tests/blog.test.ts`. Publishing runs the claims checker (`copy-guard`) and the machine-prose filter (`humanizer`) before a post can go live: a claim violation cannot be acknowledged away, a style flag can be, and the acknowledgement is recorded on the row and in the audit entry. A deployment that prefers an external CMS can still point at Ghost (`GHOST_API_URL`) |
| `ArnasDon/wacrm`, `melgarafael/DeskcommCRM`, `trycompai/crm` | Implemented as UI + data model | Consent register `/employee/consent`, review queue `/employee/review-queue`, lead pipeline under `/api/crm/*`, stage board `/employee/pipeline` (`src/lib/crm/pipeline.ts` — a lead whose status is not a known stage gets its own flagged column rather than vanishing), priority call list `/api/crm/leads/priority` |
| `languagetool-org/languagetool` | Implemented as a separate service | `src/lib/writing/grammar.ts` (LGPL: called over HTTP, never linked), `/api/grammar/check`, writing-practice panel on `/language-prep` |
| `blader/humanizer` | Implemented | `src/lib/copy/humanizer.ts` + `tests/copy-style.test.ts`: an AI-tell style filter that reports and never rewrites, run over the repository's own copy |
| `public-apis/public-apis` | Implemented as a registry | `src/lib/integrations/registry.ts` + `/api/admin/integrations`: every external service with its licence, copying policy, environment variables and — the part that matters — what stops working without it |
| `clawnify/OpenProspector` (MIT) | Implemented | `src/lib/crm/lead-score.ts` + `/api/crm/leads/priority`: explainable lead prioritisation. Deliberately not a prediction of admission, funding or visa outcome, and the reasons never echo the lead's own data |
| firecrawl / molx / siyuan / OpenViking / ToolJet / Cap | Read-only reference | Copyleft or unlicensed; nothing copied. Firecrawl and Chatwoot are recorded in `src/lib/integrations/registry.ts` as external-service-only, with the licence and the copying policy on the row, so the reasoning survives in code rather than only in this document |
| Study-abroad IA references (unlicensed) | Visual/IA reference only | Public pages redesigned against them; no code taken |

**What this section cannot fix.** Nothing here supplies an authorised question
bank, validated band-score calibration, a merchant account, email delivery or a
verified host deployment. Those remain the release blockers listed in section 4,
and no amount of reference code changes them.

## 4. Conclusion

1. **Existence:** 134 of 138 links resolve; 4 do not (three are inaccessible `engralaminn-collab` repositories, one is a typo).
2. **Legality:** 41 of 134 references are copyleft (19) or carry no licence (22). That alone makes "implement all of them" impossible — 22 have no licence at all, and copying from them would create legal exposure for a commercial product.
3. **Relevance:** roughly two dozen references touch this platform's domain, and most of those are *design or architecture references in a different stack* (Python, PHP, Ruby, Go, Java, Vue), not drop-in code. Section A lists them, with the destination for each.
4. **Nothing in the list supplies the platform's actual release blockers:** an authorised question bank, validated band-score calibration, merchant/payment credentials, email delivery, or a verified production deployment. No amount of porting reference code changes that.

## Appendix — every reference checked

| Repository | Language | Stars | Licence | Last push |
| --- | --- | --- | --- | --- |
| `public-apis/public-apis` | Python | 488393 | MIT | 2026-10-13 |
| `affaan-m/ECC` | JavaScript | 278528 | MIT | 2026-10-12 |
| `firecrawl/firecrawl` | TypeScript | 191189 | AGPL-3.0 | 2026-10-13 |
| `ytdl-org/youtube-dl` | Python | 141295 | Unlicense | 2026-02-19 |
| `harry0703/MoneyPrinterTurbo` | Python | 130520 | MIT | 2026-10-13 |
| `tt-a1i/archify` | JavaScript | 83011 | MIT | 2026-10-13 |
| `ruvnet/ruflo` | TypeScript | 74551 | MIT | 2026-10-13 |
| `FoundationAgents/MetaGPT` | Python | 70839 | MIT | 2026-01-21 |
| `cline/cline` | TypeScript | 70277 | Apache-2.0 | 2026-10-13 |
| `dani-garcia/vaultwarden` | Rust | 68987 | AGPL-3.0 | 2026-10-10 |
| `remotion-dev/remotion` | TypeScript | 63861 | NOASSERTION | 2026-10-13 |
| `jingyaogong/minimind` | Python | 63688 | Apache-2.0 | 2026-09-22 |
| `heygen-com/hyperframes` | TypeScript | 62675 | Apache-2.0 | 2026-10-13 |
| `twentyhq/twenty` | TypeScript | 58290 | NOASSERTION | 2026-10-13 |
| `blader/humanizer` | Python | 56548 | MIT | 2026-09-28 |
| `TryGhost/Ghost` | TypeScript | 55532 | MIT | 2026-10-13 |
| `bilawalsidhu/gods-eye-view` | JavaScript | 55207 | NOASSERTION | 2026-10-13 |
| `coreyhaines31/marketingskills` | JavaScript | 54553 | MIT | 2026-10-13 |
| `cathrynlavery/diagram-design` | HTML | 53961 | MIT | 2026-10-13 |
| `K-Dense-AI/scientific-agent-skills` | Python | 48722 | MIT | 2026-10-12 |
| `siyuan-note/siyuan` | TypeScript | 46745 | AGPL-3.0 | 2026-10-13 |
| `DIYgod/RSSHub` | TypeScript | 46513 | AGPL-3.0 | 2026-10-13 |
| `omacom/omarchy` | Shell | 44767 | MIT | 2026-10-13 |
| `ToolJet/ToolJet` | HTML | 41090 | AGPL-3.0 | 2026-10-13 |
| `THU-MAIC/OpenMAIC` | TypeScript | 40650 | MIT | 2026-10-13 |
| `volcengine/OpenViking` | Python | 39828 | AGPL-3.0 | 2026-10-13 |
| `umami-software/umami` | TypeScript | 39350 | MIT | 2026-10-13 |
| `chatwoot/chatwoot` | Ruby | 37760 | NOASSERTION | 2026-10-13 |
| `nextcloud/server` | PHP | 37083 | AGPL-3.0 | 2026-10-13 |
| `google-research/timesfm` | Python | 34451 | Apache-2.0 | 2026-09-29 |
| `Twigpine/openclaude` | TypeScript | 33829 | NOASSERTION | 2026-10-13 |
| `ATH-MaaS/Pixelle-Video` | Python | 28977 | Apache-2.0 | 2026-06-14 |
| `mksglu/context-mode` | TypeScript | 28135 | NOASSERTION | 2026-10-13 |
| `fmtlib/fmt` | C++ | 25882 | MIT | 2026-10-11 |
| `AprilNEA/OpenLogi` | Rust | 23521 | Apache-2.0 | 2026-10-13 |
| `every-app/open-seo` | TypeScript | 23468 | MIT | 2026-10-08 |
| `CapSoftware/Cap` | Rust | 23279 | NOASSERTION | 2026-10-13 |
| `nashsu/llm_wiki` | TypeScript | 20630 | NOASSERTION | 2026-09-28 |
| `bradautomates/claude-video` | Python | 18488 | MIT | 2026-09-25 |
| `leandromoreira/digital_video_introduction` | Jupyter Notebook | 16358 | BSD-3-Clause | 2026-09-02 |
| `WEIFENG2333/VideoCaptioner` | Python | 16228 | GPL-3.0 | 2026-09-12 |
| `Lakr233/vphone-cli` | Swift | 15276 | MIT | 2026-10-13 |
| `languagetool-org/languagetool` | Java | 15127 | LGPL-2.1 | 2026-10-13 |
| `YaoFANGUK/video-subtitle-remover` | Python | 13282 | Apache-2.0 | 2026-06-30 |
| `zai-org/CogVideo` | Python | 13078 | Apache-2.0 | 2025-11-04 |
| `Tencent-Hunyuan/HunyuanVideo` | Python | 12618 | NOASSERTION | 2026-10-08 |
| `elebumm/RedditVideoMakerBot` | Python | 12541 | GPL-3.0 | 2026-10-13 |
| `3b1b/videos` | Python | 11352 | NOASSERTION | 2026-09-29 |
| `trycompai/crm` | TypeScript | 11278 | MIT | 2026-09-11 |
| `cursor/plugins` | TypeScript | 11207 | NO-LICENSE | 2026-10-13 |
| `Lightricks/LTX-Video` | Python | 11092 | Apache-2.0 | 2026-01-05 |
| `crmeb/CRMEB` | Vue | 9409 | Apache-2.0 | 2026-09-05 |
| `akitaonrails/ai-memory` | Rust | 9229 | MIT | 2026-10-13 |
| `meituan-longcat/LongCat-Video` | Python | 9176 | MIT | 2026-05-27 |
| `idurar/idurar-erp-crm` | JavaScript | 8879 | AGPL-3.0 | 2026-08-14 |
| `MeiGen-AI/InfiniteTalk` | Python | 8059 | Apache-2.0 | 2026-05-22 |
| `zai-org/GLM-5` | none | 7319 | Apache-2.0 | 2026-09-24 |
| `OpenTalker/video-retalking` | Python | 7293 | Apache-2.0 | 2024-08-05 |
| `vastsa/PI-Desktop` | TypeScript | 6778 | LGPL-3.0 | 2026-10-13 |
| `0voice/audio_video_streaming` | none | 6255 | NO-LICENSE | 2024-05-20 |
| `NdoleStudio/httpsms` | Go | 6002 | AGPL-3.0 | 2026-10-06 |
| `ramon-victor/freegpt-webui` | Python | 5602 | GPL-3.0 | 2023-09-26 |
| `armory3d/armorpaint` | C | 5366 | NOASSERTION | 2026-10-13 |
| `Augani/openreel-video` | TypeScript | 5353 | MIT | 2026-10-03 |
| `anthropics/claude-plugins-community` | JavaScript | 4639 | Apache-2.0 | 2026-10-13 |
| `melgarafael/DeskcommCRM` | TypeScript | 4563 | MIT | 2026-10-13 |
| `MarkTechStation/VideoCode` | Jupyter Notebook | 4245 | NO-LICENSE | 2025-08-13 |
| `songguoxs/gpt4o-image-prompts` | JavaScript | 3845 | NO-LICENSE | 2026-01-08 |
| `JetBrains/go-modern-guidelines` | Go | 3834 | Apache-2.0 | 2026-09-10 |
| `frappe/crm` | Vue | 3784 | AGPL-3.0 | 2026-10-13 |
| `fatfreecrm/fat_free_crm` | Ruby | 3633 | NOASSERTION | 2026-10-12 |
| `jitsi/jitsi-videobridge` | Kotlin | 3107 | Apache-2.0 | 2026-10-13 |
| `alsk1992/CloddsBot` | TypeScript | 2968 | MIT | 2026-10-02 |
| `bugcrowd/bugcrowd_university` | none | 2807 | CC-BY-4.0 | 2026-08-26 |
| `ArnasDon/wacrm` | TypeScript | 2547 | MIT | 2026-10-13 |
| `Django-CRM/Django-CRM` | Python | 2448 | MIT | 2026-10-02 |
| `HKUDS/VideoAgent` | Python | 1942 | MIT | 2026-07-22 |
| `Kosinkadink/ComfyUI-VideoHelperSuite` | Python | 1878 | GPL-3.0 | 2026-09-02 |
| `HITsz-TMG/VideoClaw` | Python | 1857 | MIT | 2026-08-26 |
| `qdrzwd/VideoRecorder` | Java | 1791 | Apache-2.0 | 2023-08-08 |
| `LoSealL/VideoSuperResolution` | Python | 1687 | MIT | 2020-09-11 |
| `firecrawl/web-agent` | TypeScript | 1246 | MIT | 2026-04-19 |
| `nwuzmedoutlook/university` | none | 1219 | Apache-2.0 | 2026-09-28 |
| `oroinc/crm-application` | PHP | 1015 | NOASSERTION | 2026-10-13 |
| `ChurchCRM/CRM` | PHP | 967 | MIT | 2026-10-13 |
| `thu-ml/CRM` | Python | 702 | MIT | 2024-11-28 |
| `oroinc/crm` | PHP | 687 | NOASSERTION | 2026-10-13 |
| `BelledonneCommunications/linphone-iphone` | Swift | 660 | GPL-3.0 | 2026-09-17 |
| `VonHoltenCodes/SlowBooks-Pro-2026` | Python | 644 | NOASSERTION | 2026-10-13 |
| `dennisivy/crash-course-CRM` | Python | 584 | NO-LICENSE | 2026-01-29 |
| `YutaroHayakawa/ipftrace2` | C | 410 | NOASSERTION | 2024-04-14 |
| `huggingface/education-toolkit` | Jupyter Notebook | 389 | Apache-2.0 | 2023-09-29 |
| `tinystruct/smalltalk` | Java | 354 | NO-LICENSE | 2026-08-15 |
| `GAIR-NLP/LiveTalk` | Python | 353 | NOASSERTION | 2026-01-02 |
| `HM-RunningHub/ComfyUI_RH_APICall` | Python | 302 | NO-LICENSE | 2026-05-09 |
| `0perationPrivacy/VoIP` | JavaScript | 298 | GPL-3.0 | 2026-07-29 |
| `Lin-jun-xiang/docGPT-langchain` | Python | 261 | MIT | 2023-11-13 |
| `teremterem/claude-code-gpt-5-codex` | Python | 239 | MIT | 2026-07-22 |
| `GetGoAPI/Free-GPT-Grok-Gemini-Claude-API` | TypeScript | 214 | MIT | 2025-12-04 |
| `Kayforkind/reimagine-it` | JavaScript | 207 | MIT | 2026-10-10 |
| `EfficientStreet/youtube-subscriptions-ingest` | Python | 182 | MIT | 2026-08-14 |
| `Onyx-Dev-Labs/doodle-note` | TypeScript | 180 | MIT | 2026-10-13 |
| `EfficientStreet/hindsight` | none | 173 | MIT | 2026-08-20 |
| `meta-models/meta-model-cookbook` | Python | 161 | MIT | 2026-10-07 |
| `Odoo-mobile/crm` | Java | 149 | NO-LICENSE | 2017-01-03 |
| `dunossauro/videomaker-helper` | Python | 135 | GPL-3.0 | 2025-02-05 |
| `timharris707/modeldeck` | JavaScript | 116 | NOASSERTION | 2026-10-08 |
| `templetongroup/radiant` | JavaScript | 114 | MIT | 2026-10-06 |
| `sulabhdubey/rta-smriti-brain` | Python | 94 | MIT | 2026-10-13 |
| `Artistsyn/cortex_suite` | Rust | 84 | NO-LICENSE | 2026-10-08 |
| `BraaMohammed/bricks` | TypeScript | 70 | NO-LICENSE | 2026-09-02 |
| `sibnerian/electron-promise-ipc` | TypeScript | 69 | MIT | 2023-03-04 |
| `NdoleStudio/httpsms-node` | TypeScript | 32 | MIT | 2026-10-01 |
| `developerspace-samples/VoIP-Call-Sample` | Java | 32 | Apache-2.0 | 2022-07-16 |
| `burhankocabiyik/videomaker` | JavaScript | 28 | NO-LICENSE | 2026-04-30 |
| `arupdas0825/studytra` | JavaScript | 27 | NO-LICENSE | 2026-07-03 |
| `ioi-labs/molx` | Go | 21 | NO-LICENSE | 2026-08-07 |
| `wtz2017/VideoMaker` | C | 20 | NO-LICENSE | 2020-06-11 |
| `WuTao-CS/VideoMaker` | Python | 17 | NOASSERTION | 2025-03-04 |
| `clawnify/OpenProspector` | TypeScript | 14 | MIT | 2026-10-10 |
| `shubhamdevhouse/Animated-VideoMaker` | JavaScript | 13 | MIT | 2022-06-02 |
| `brightdata/open-enrich` | TypeScript | 12 | NO-LICENSE | 2026-05-30 |
| `viniciusenari/slideshow-videomaker` | Python | 11 | MIT | 2022-06-08 |
| `domovinatv/sms.domovina.ai` | Go | 3 | NO-LICENSE | 2026-05-11 |
| `guifav/market-intelligence-radar` | TypeScript | 3 | MIT | 2026-09-25 |
| `Bhawana0218/NextStep-Abroad` | TypeScript | 2 | NO-LICENSE | 2026-07-06 |
| `Bilal-Belli/videoMakerBOT` | Python | 2 | MIT | 2023-03-30 |
| `Nncstudio/VideoMakerPro` | Java | 2 | NO-LICENSE | 2023-11-04 |
| `seed0001/videoMaker` | Python | 2 | NO-LICENSE | 2026-08-16 |
| `knsoftic/Email_Markting` | PHP | 0 | NO-LICENSE | 2026-09-08 |
| `mohamed11sk/Email-markting` | PHP | 0 | NO-LICENSE | 2026-06-01 |
| `nabaleducation/EducationConsultancyWebsite` | TypeScript | 0 | NO-LICENSE | 2026-09-18 |
| `parthasarathy123/n8n-gtm-lead-enrichment` | none | 0 | MIT | 2026-07-13 |
| `workwithlos-ui/dave` | Python | 0 | MIT | 2026-06-17 |

_Not listed above (4): `engralaminn-collab/alo-education-uk-final`, `engralaminn-collab/ukvi-ai-markting_n8n`, `engralaminn-collab/Ai-Markting-crm`, `debbalash/VoiceStudio` — 404 at audit time._
