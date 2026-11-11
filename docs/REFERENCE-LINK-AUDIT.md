# Supplied Reference Audit

**Audit date:** 2026-10-10 (UTC).  **Project:** ALO English / ALO Education.

## Scope and method

The supplied material contains many repeated links and repositories from unrelated product categories. Repeated GitHub repository destinations were normalized to one owner/repository entry before checking. The GitHub REST repository-metadata endpoint was queried for all **139 unique repository targets**. **136** were publicly readable; the top-level README endpoint was fetched for all 136, and the repository description plus the opening README text (up to 700 characters) were skimmed for product and feature fit. This is a reachability and triage audit—not a line-by-line security, source-code, dependency, trademark, or full-license review of 139 projects.

Three GitHub API lookups returned HTTP 404. That result does **not** prove whether those repositories are private, deleted, restricted, or mistyped. Non-GitHub pages were inspected from returned page/search previews; several previews were partial rather than full-site crawls. The Meta developer AI page returned HTTP 403 and could not be reviewed.

No repository was blindly merged or copied wholesale. The references span incompatible operating systems, reverse engineering, video generation, telecom, ERPs, CRMs, design systems, AI agents, and education products. Their licenses also vary; importing unrelated implementations would add supply-chain, security, maintenance, and license obligations without making ALO’s learner or partner flows better. Relevant design/feature patterns were implemented in ALO; out-of-scope systems are recorded below rather than represented as completed imports.

## GitHub repository checks

`README skim` means the top-level GitHub README endpoint was fetched and its opening text inspected for relevance. `NOASSERTION` is GitHub API metadata, not permission to reuse code. Rows marked `HTTP 404` could not be inspected beyond the failed lookup.

| Repository | Check | API license | Primary language | GitHub description |
|---|---|---|---|---|
| [0perationPrivacy/VoIP](https://github.com/0perationPrivacy/VoIP) | Metadata + README skim | GPL-3.0 | JavaScript | Web Base Telnyx/Twilio VoIP Interface enabling SMS, MMS and Voice calls using the providers API Keys and self-hosting the application. |
| [0voice/audio_video_streaming](https://github.com/0voice/audio_video_streaming) | Metadata + README skim | NOASSERTION | — | 音视频流媒体权威资料整理，500+份文章，论文，视频，实践项目，协议，业界大神名单。 |
| [3b1b/videos](https://github.com/3b1b/videos) | Metadata + README skim | NOASSERTION | Python | Code for the manim-generated scenes used in 3blue1brown videos |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | Metadata + README skim | MIT | JavaScript | The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond. |
| [akitaonrails/ai-memory](https://github.com/akitaonrails/ai-memory) | Metadata + README skim | MIT | Rust | Solution for long term memory for agent coding CLIs and to facilitate handoff between different agent vendors |
| [alsk1992/CloddsBot](https://github.com/alsk1992/CloddsBot) | Metadata + README skim | MIT | TypeScript | Open Source AI trading agent that operates autonomously across 1000+ markets - Polymarket, Kalshi, Binance, Hyperliquid, Solana DEXs, 5 EVM chains. Scans    for edge, executes instantly, manages risk while you sleep. Agent commerce protocol for machine-to-machine payments. Self-hosted. Built on Claude. |
| [anthropics/claude-plugins-community](https://github.com/anthropics/claude-plugins-community) | Metadata + README skim | Apache-2.0 | JavaScript | Community plugin marketplace for Claude Cowork and Claude Code. Read-only mirror — submit plugins at clau.de/plugin-directory-submission. |
| [AprilNEA/OpenLogi](https://github.com/AprilNEA/OpenLogi) | Metadata + README skim | Apache-2.0 | Rust | ⚡️A native, local-first alternative to Logitech Options+, written in Rust 🦀 — remap buttons, DPI, and SmartShift over HID++. No account, no telemetry. |
| [armory3d/armorpaint](https://github.com/armory3d/armorpaint) | Metadata + README skim | NOASSERTION | C | Graphics Creation Tools |
| [ArnasDon/wacrm](https://github.com/ArnasDon/wacrm) | Metadata + README skim | MIT | TypeScript | Self-hostable CRM template for WhatsApp — shared inbox, contacts, sales pipelines, broadcasts, and no-code automations. Fork it, brand it, host it. |
| [Artistsyn/cortex_suite](https://github.com/Artistsyn/cortex_suite) | Metadata + README skim | NOASSERTION | Rust | Local MCP servers that give coding agents a reliable project memory. quartz-ctx serves live code structure in 10 languages, cross-language calls included; cortex keeps learned patterns and traps, pushes them into the agent's context at edits and failing builds, and measures outcomes and token cost from real sessions. No network, no API keys. |
| [arupdas0825/studytra](https://github.com/arupdas0825/studytra) | Metadata + README skim | NOASSERTION | JavaScript | 🎓 Studytra — Study Abroad Execution Platform Built for Indian students who want to study in Germany, USA, or Canada without paying consultancies. Powered by Gemini AI — gives structured roadmaps, visa guidance, cost breakdowns, loan comparisons, and timeline planning in one place. |
| [ATH-MaaS/Pixelle-Video](https://github.com/ATH-MaaS/Pixelle-Video) | Metadata + README skim | Apache-2.0 | Python | 🚀 AI 全自动短视频引擎 \| AI Fully Automated Short Video Engine |
| [Augani/openreel-video](https://github.com/Augani/openreel-video) | Metadata + README skim | MIT | TypeScript | OpenReel Video - Professional browser-based video editor. Open source CapCut alternative. 100% browser-based, no installation, no cloud uploads, no watermarks. |
| [BelledonneCommunications/linphone-iphone](https://github.com/BelledonneCommunications/linphone-iphone) | Metadata + README skim | GPL-3.0 | Swift | Linphone is a free VoIP and video softphone based on the SIP protocol. Mirror of linphone-iphone (git://git.linphone.org/linphone-iphone.git) |
| [Bhawana0218/NextStep-Abroad](https://github.com/Bhawana0218/NextStep-Abroad) | Metadata + README skim | NOASSERTION | TypeScript | Help Study Abroad Admin Dashboard |
| [Bilal-Belli/videoMakerBOT](https://github.com/Bilal-Belli/videoMakerBOT) | Metadata + README skim | MIT | Python | This desktop python program allows you to put your talk script and image slides. He will talk about the given script and make the video (each image with the corresponding talk script). |
| [bilawalsidhu/gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view) | Metadata + README skim | NOASSERTION | JavaScript | A spy satellite simulator in your browser, except the data is real. Live open source spatial intelligence on a photorealistic 3D globe. |
| [blader/humanizer](https://github.com/blader/humanizer) | Metadata + README skim | MIT | Python | Agent skill that removes signs of AI-generated writing from text |
| [BraaMohammed/bricks](https://github.com/BraaMohammed/bricks) | Metadata + README skim | NOASSERTION | TypeScript | Bricks is the open-source, fully local alternative to Clay.com. It combines AI agents, advanced web scraping, and Puppeteer automation to turn raw CSV data into actionable business intelligence — without subscriptions, vendor lock-in, or sending your data to the cloud. |
| [bradautomates/claude-video](https://github.com/bradautomates/claude-video) | Metadata + README skim | MIT | Python | Give Claude the ability to watch any video. /watch downloads, extracts frames, transcribes, hands it all to Claude. |
| [brightdata/open-enrich](https://github.com/brightdata/open-enrich) | Metadata + README skim | NOASSERTION | TypeScript |  |
| [bugcrowd/bugcrowd_university](https://github.com/bugcrowd/bugcrowd_university) | Metadata + README skim | CC-BY-4.0 | — | Open source education content for the researcher community |
| [burhankocabiyik/videomaker](https://github.com/burhankocabiyik/videomaker) | Metadata + README skim | NOASSERTION | JavaScript | AI video studio. Topic to product video — fal.ai (Seedance 2.0, Kling v2.1) + Remotion. |
| [CapSoftware/Cap](https://github.com/CapSoftware/Cap) | Metadata + README skim | NOASSERTION | Rust | Open source Loom alternative. Beautiful, shareable screen recordings. |
| [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) | Metadata + README skim | MIT | HTML | Editorial diagram design for Claude Code, Codex, GitHub Copilot, Factory Droid, and Pi. 44 diagram types. Self-contained HTML + SVG. No shadows. No Mermaid slop. |
| [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | Metadata + README skim | NOASSERTION | Ruby | Open-source live-chat, email support, omni-channel desk. An alternative to Intercom, Zendesk, Salesforce Service Cloud etc. 🔥💬 |
| [ChurchCRM/CRM](https://github.com/ChurchCRM/CRM) | Metadata + README skim | MIT | PHP | Free, open-source church management software for people, families, groups, events, attendance, giving, volunteers, and more. No subscription. Your data is yours. |
| [clawnify/OpenProspector](https://github.com/clawnify/OpenProspector) | Metadata + README skim | MIT | TypeScript | The open-source Clay alternative — find and enrich B2B leads on your own provider keys, at cost with no per-lead markup. |
| [cline/cline](https://github.com/cline/cline) | Metadata + README skim | Apache-2.0 | TypeScript | Autonomous coding agent as an SDK, IDE extension, or CLI assistant. |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | Metadata + README skim | MIT | JavaScript | Marketing skills for Claude Code and AI agents. CRO, copywriting, SEO, analytics, and growth engineering. |
| [crmeb/CRMEB](https://github.com/crmeb/CRMEB) | Metadata + README skim | Apache-2.0 | Vue | 🔥CRMEB开源商城免费开源多语言商城系统，Tp6框架商城，系统可商用；包含小程序商城、H5商城、公众号商城、PC商城、App，支持分销、拼团、砍价、秒杀、优惠券、积分、会员等级、小程序直播、页面DIY，前后端分离，方便二开，更有详细使用文档、接口文档、数据字典、二开文档/视频教程，欢迎大家提出宝贵意见和建议 |
| [cursor/plugins](https://github.com/cursor/plugins) | Metadata + README skim | NOASSERTION | TypeScript | Cursor plugin specification and official plugins |
| [dani-garcia/vaultwarden](https://github.com/dani-garcia/vaultwarden) | Metadata + README skim | AGPL-3.0 | Rust | Unofficial Bitwarden compatible server written in Rust, formerly known as bitwarden_rs |
| [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio) | Metadata + README skim | AGPL-3.0 | Python | VoiceStudio is the open-source, fully-local ElevenLabs alternative — voice cloning, voice design, video dubbing, dictation, transcription & audiobook creation in 646 languages. |
| [dennisivy/crash-course-CRM](https://github.com/dennisivy/crash-course-CRM) | Metadata + README skim | NOASSERTION | Python | Django customer management platform |
| [developerspace-samples/VoIP-Call-Sample](https://github.com/developerspace-samples/VoIP-Call-Sample) | Metadata + README skim | Apache-2.0 | Java | An android application that includes ConnectionService binding to handle incoming & outgoing calls. It helps to know the use ConnectionService in Android. |
| [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) | Metadata + README skim | AGPL-3.0 | TypeScript | 🧡 Everything is RSSible |
| [Django-CRM/Django-CRM](https://github.com/Django-CRM/Django-CRM) | Metadata + README skim | MIT | Python | Open Source CRM for Startups and enterprises. Django + SvelteKit · Self-hosted · Multi-tenant · Free forever |
| [domovinatv/sms.domovina.ai](https://github.com/domovinatv/sms.domovina.ai) | Metadata + README skim | NOASSERTION | Go | Free SMS gateway for domovina.ai — built on NdoleStudio/httpsms (git subtree), deployed via Coolify on Oracle Cloud ARM behind Cloudflare Tunnel. |
| [dunossauro/videomaker-helper](https://github.com/dunossauro/videomaker-helper) | Metadata + README skim | GPL-3.0 | Python | Simplify your video editing workflow with Python 📹 |
| [EfficientStreet/hindsight](https://github.com/EfficientStreet/hindsight) | Metadata + README skim | MIT | — | A self-improvement skill for AI coding assistants — reviews a session end-to-end and saves only the durable process lessons as persistent memory. |
| [EfficientStreet/youtube-subscriptions-ingest](https://github.com/EfficientStreet/youtube-subscriptions-ingest) | Metadata + README skim | MIT | Python | Pull YouTube subscription metadata into a real cross-linked knowledge graph in your second-brain vault |
| [elebumm/RedditVideoMakerBot](https://github.com/elebumm/RedditVideoMakerBot) | Metadata + README skim | GPL-3.0 | Python | Create Reddit Videos with just✨ one command ✨ |
| [engralaminn-collab/Ai-Markting-crm](https://github.com/engralaminn-collab/Ai-Markting-crm) | HTTP 404; inaccessible | — | — | gh: Not Found (HTTP 404) |
| [engralaminn-collab/alo-education-uk-final](https://github.com/engralaminn-collab/alo-education-uk-final) | HTTP 404; inaccessible | — | — | gh: Not Found (HTTP 404) |
| [engralaminn-collab/ukvi-ai-markting_n8n](https://github.com/engralaminn-collab/ukvi-ai-markting_n8n) | HTTP 404; inaccessible | — | — | gh: Not Found (HTTP 404) |
| [every-app/open-seo](https://github.com/every-app/open-seo) | Metadata + README skim | MIT | TypeScript | Open source alternative to Semrush and Ahrefs |
| [fatfreecrm/fat_free_crm](https://github.com/fatfreecrm/fat_free_crm) | Metadata + README skim | NOASSERTION | Ruby | Ruby on Rails CRM platform |
| [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) | Metadata + README skim | AGPL-3.0 | TypeScript | Supercharge your AI agents with data from the web and beyond. Building the library for superintelligence. 🔥 |
| [firecrawl/web-agent](https://github.com/firecrawl/web-agent) | Metadata + README skim | MIT | TypeScript | 🔥 Open-source web data agent optimized for structured web research |
| [fmtlib/fmt](https://github.com/fmtlib/fmt) | Metadata + README skim | MIT | C++ | A modern formatting library |
| [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) | Metadata + README skim | MIT | Python | 🌟 The Multi-Agent Framework: First AI Software Company, Towards Natural Language Programming |
| [frappe/crm](https://github.com/frappe/crm) | Metadata + README skim | AGPL-3.0 | Vue | Fully featured, open source CRM |
| [GAIR-NLP/LiveTalk](https://github.com/GAIR-NLP/LiveTalk) | Metadata + README skim | NOASSERTION | Python |  |
| [GetGoAPI/Free-GPT-Grok-Gemini-Claude-API](https://github.com/GetGoAPI/Free-GPT-Grok-Gemini-Claude-API) | Metadata + README skim | MIT | TypeScript | Access GPT-5, o4, Claude 4.5 & Gemini 3 via one API. The best OpenRouter alternative. 国内直连/无需梯子/支持支付宝/Crypto. Get Free Key: |
| [Gitlawb/openclaude](https://github.com/Gitlawb/openclaude) | Metadata + README skim | NOASSERTION | TypeScript | runs anywhere. uses anything |
| [google-research/timesfm](https://github.com/google-research/timesfm) | Metadata + README skim | Apache-2.0 | Python | TimesFM (Time Series Foundation Model) is a pretrained time-series foundation model developed by Google Research for time-series forecasting. |
| [guifav/market-intelligence-radar](https://github.com/guifav/market-intelligence-radar) | Metadata + README skim | MIT | TypeScript | Open-source market intelligence radar — automated news monitoring, entity extraction, enrichment and CRM matching |
| [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | Metadata + README skim | MIT | Python | 利用 AI 大模型和自动化工作流，根据主题或关键词一键生成高清短视频。Generate HD short videos from a topic or keyword with an automated AI workflow. |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Metadata + README skim | Apache-2.0 | TypeScript | Write HTML. Render video. Built for agents. |
| [HITsz-TMG/VideoClaw](https://github.com/HITsz-TMG/VideoClaw) | Metadata + README skim | MIT | Python | 🚀 AI 全自动化视频生成员工 \| Your First AIGC Coworker. Chat an Idea. Get a Film. 🦞 |
| [HKUDS/VideoAgent](https://github.com/HKUDS/VideoAgent) | Metadata + README skim | MIT | Python | [EMNLP2026] "VideoAgent: All-in-One Agentic Framework for Video Understanding and Editing, and Remaking" |
| [HM-RunningHub/ComfyUI_RH_APICall](https://github.com/HM-RunningHub/ComfyUI_RH_APICall) | Metadata + README skim | NOASSERTION | Python | This is a ComfyUI plugin that makes it easier to call and run workflows from RunningHub in your local ComfyUI setup. |
| [huggingface/education-toolkit](https://github.com/huggingface/education-toolkit) | Metadata + README skim | Apache-2.0 | Jupyter Notebook | Educational materials for universities |
| [idurar/idurar-erp-crm](https://github.com/idurar/idurar-erp-crm) | Metadata + README skim | AGPL-3.0 | JavaScript | Free Open Source ERP CRM Software Accounting Invoicing \| Node.Js React |
| [ioi-labs/molx](https://github.com/ioi-labs/molx) | Metadata + README skim | NOASSERTION | Go | Open-source, self-hosted alternative to Firecrawl. Scrape, search, batch-process, and LLM-enrich web content through a simple HTTP API. |
| [JetBrains/go-modern-guidelines](https://github.com/JetBrains/go-modern-guidelines) | Metadata + README skim | Apache-2.0 | Go | Help AI coding agents write modern Go |
| [jingyaogong/minimind](https://github.com/jingyaogong/minimind) | Metadata + README skim | Apache-2.0 | Python | 🧠 Train a 64M-parameter LLM from scratch in just 2h! |
| [jitsi/jitsi-videobridge](https://github.com/jitsi/jitsi-videobridge) | Metadata + README skim | Apache-2.0 | Kotlin | Jitsi Videobridge is a WebRTC compatible video router or SFU that lets build highly scalable video conferencing infrastructure (i.e., up to hundreds of conferences per server). |
| [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills) | Metadata + README skim | MIT | Python | Turn any AI agent into an AI Scientist. The #1 Agent Skills library for science, used by 250,000+ scientists worldwide. 177 ready-to-use validated skills plus 100+ scientific databases covering biology, chemistry, medicine, and drug discovery. Compatible with Cursor, Claude Code, Codex, Pi, Antigravity, and the open Agent Skills standard. |
| [Kayforkind/reimagine-it](https://github.com/Kayforkind/reimagine-it) | Metadata + README skim | MIT | JavaScript | Kayforkind Content-Derived Design CLI. HTML in, standalone HTML out from the source's own nouns, dates, numbers, and colors. Not the reimagineit.ai interview SaaS. |
| [knsoftic/Email_Markting](https://github.com/knsoftic/Email_Markting) | Metadata + README skim | NOASSERTION | PHP |  |
| [Kosinkadink/ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite) | Metadata + README skim | GPL-3.0 | Python | Nodes related to video workflows |
| [Lakr233/vphone-cli](https://github.com/Lakr233/vphone-cli) | Metadata + README skim | MIT | Swift | Run a virtual iPhone on an Apple Silicon Mac. |
| [languagetool-org/languagetool](https://github.com/languagetool-org/languagetool) | Metadata + README skim | LGPL-2.1 | Java | Style and Grammar Checker for 25+ Languages |
| [leandromoreira/digital_video_introduction](https://github.com/leandromoreira/digital_video_introduction) | Metadata + README skim | BSD-3-Clause | Jupyter Notebook | A hands-on introduction to video technology: image, video, codec (av1, vp9, h265) and more (ffmpeg encoding). Translations: 🇺🇸 🇨🇳 🇯🇵 🇮🇹 🇰🇷 🇷🇺 🇧🇷 🇪🇸 |
| [Lightricks/LTX-Video](https://github.com/Lightricks/LTX-Video) | Metadata + README skim | Apache-2.0 | Python | Official repository for LTX-Video |
| [Lin-jun-xiang/docGPT-langchain](https://github.com/Lin-jun-xiang/docGPT-langchain) | Metadata + README skim | MIT | Python | 🔐Free GPT-3.5 chat with your docs (PDF, WORD, CSV, TXT) |
| [LoSealL/VideoSuperResolution](https://github.com/LoSealL/VideoSuperResolution) | Metadata + README skim | MIT | Python | A collection of state-of-the-art video or single-image super-resolution architectures, reimplemented in tensorflow. |
| [MarkTechStation/VideoCode](https://github.com/MarkTechStation/VideoCode) | Metadata + README skim | NOASSERTION | Jupyter Notebook |  |
| [MeiGen-AI/InfiniteTalk](https://github.com/MeiGen-AI/InfiniteTalk) | Metadata + README skim | Apache-2.0 | Python | ​​Unlimited-length talking video generation​​ that supports image-to-video and video-to-video generation |
| [meituan-longcat/LongCat-Video](https://github.com/meituan-longcat/LongCat-Video) | Metadata + README skim | MIT | Python |  |
| [melgarafael/DeskcommCRM](https://github.com/melgarafael/DeskcommCRM) | Metadata + README skim | MIT | TypeScript | Open-source AI sales OS — self-hosted CRM with native AI agents + WhatsApp (WAHA). Open alternative to Kommo, Octadesk & Intercom for any business that sells by chat. MCP-ready, multi-tenant, LGPD. |
| [meta-models/meta-model-cookbook](https://github.com/meta-models/meta-model-cookbook) | Metadata + README skim | MIT | Python | Developer recipes for Meta Model API — agentic workflows, multi-agent orchestration patterns, and use case examples with cost comparisons. Colab notebooks + standalone Python files. |
| [mksglu/context-mode](https://github.com/mksglu/context-mode) | Metadata + README skim | NOASSERTION | TypeScript | Context window optimization for AI coding agents. Sandboxes tool output (98% reduction), persists session memory, and   enforces routing across 17 platforms via MCP + hooks. |
| [mohamed11sk/Email-markting](https://github.com/mohamed11sk/Email-markting) | Metadata + README skim | NOASSERTION | PHP |  |
| [morluto/rea](https://github.com/morluto/rea) | Metadata + README skim | MIT | TypeScript | Reverse engineer anything with agents, from app behavior down to native binaries. |
| [nabaleducation/EducationConsultancyWebsite](https://github.com/nabaleducation/EducationConsultancyWebsite) | Metadata + README skim | NOASSERTION | TypeScript | United Education Webiste |
| [nashsu/llm_wiki](https://github.com/nashsu/llm_wiki) | Metadata + README skim | NOASSERTION | TypeScript | LLM Wiki is a cross-platform desktop application that turns your documents into an organized, interlinked knowledge base — automatically. Instead of traditional RAG (retrieve-and-answer from scratch every time), the LLM incrementally builds and maintains a persistent wiki from your sources。 |
| [NdoleStudio/httpsms](https://github.com/NdoleStudio/httpsms) | Metadata + README skim | AGPL-3.0 | Go | Send and receive SMS messages using your Android phone programmatically via a simple HTTP API |
| [NdoleStudio/httpsms-node](https://github.com/NdoleStudio/httpsms-node) | Metadata + README skim | MIT | TypeScript | Node client for the httpSMS API https://httpsms.com |
| [nextcloud/server](https://github.com/nextcloud/server) | Metadata + README skim | AGPL-3.0 | PHP | ☁️ Nextcloud server, a safe home for all your data |
| [Nncstudio/VideoMakerPro](https://github.com/Nncstudio/VideoMakerPro) | Metadata + README skim | NOASSERTION | Java | VideoMakerPro |
| [nwuzmedoutlook/university](https://github.com/nwuzmedoutlook/university) | Metadata + README skim | Apache-2.0 | — | :octocat:120+国内高校课程资源纯手工整理，欢迎补充、修订 |
| [Odoo-mobile/crm](https://github.com/Odoo-mobile/crm) | Metadata + README skim | NOASSERTION | Java | Odoo CRM |
| [omacom/omarchy](https://github.com/omacom/omarchy) | Metadata + README skim | MIT | Shell | Beautiful, Modern & Opinionated Linux |
| [Onyx-Dev-Labs/doodle-note](https://github.com/Onyx-Dev-Labs/doodle-note) | Metadata + README skim | MIT | TypeScript | Privacy-first, local-first meeting capture and AI notes. |
| [OpenTalker/video-retalking](https://github.com/OpenTalker/video-retalking) | Metadata + README skim | Apache-2.0 | Python | [SIGGRAPH Asia 2022] VideoReTalking: Audio-based Lip Synchronization for Talking Head Video Editing In the Wild |
| [oroinc/crm](https://github.com/oroinc/crm) | Metadata + README skim | NOASSERTION | PHP | Main OroCRM package with core functionality. |
| [oroinc/crm-application](https://github.com/oroinc/crm-application) | Metadata + README skim | NOASSERTION | PHP | OroCRM - an open-source Customer Relationship Management application. |
| [parthasarathy123/n8n-gtm-lead-enrichment](https://github.com/parthasarathy123/n8n-gtm-lead-enrichment) | Metadata + README skim | MIT | — | n8n workflow for Apify lead sourcing, Clay enrichment callbacks, Zoho CRM deduplication, validation, and review routing. |
| [public-apis/public-apis](https://github.com/public-apis/public-apis) | Metadata + README skim | MIT | Python | A collective list of free APIs |
| [qdrzwd/VideoRecorder](https://github.com/qdrzwd/VideoRecorder) | Metadata + README skim | Apache-2.0 | Java | android视频录制，模仿微视，支持按下录制、抬起暂停。进度条断点显示。 |
| [ramon-victor/freegpt-webui](https://github.com/ramon-victor/freegpt-webui) | Metadata + README skim | GPL-3.0 | Python | GPT 3.5/4 with a Chat Web UI. No API key required. |
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | Metadata + README skim | NOASSERTION | TypeScript | 🎥      Make videos programmatically with React |
| [ruvnet/ruflo](https://github.com/ruvnet/ruflo) | Metadata + README skim | MIT | TypeScript | 🌊 The original agent harness. Deploy intelligent multi-player swarms, coordinate autonomous workflows, and build conversational AI systems. Features adaptive memory, self-learning intelligence, federation, vector RAG integration, and native Claude Code / Codex / Hermes and many more Integrated |
| [seed0001/videoMaker](https://github.com/seed0001/videoMaker) | Metadata + README skim | NOASSERTION | Python |  |
| [shubhamdevhouse/Animated-VideoMaker](https://github.com/shubhamdevhouse/Animated-VideoMaker) | Metadata + README skim | MIT | JavaScript | Create animatied text videos like Animoto using NodeJS -> ImageMagick & Ffmpeg |
| [sibnerian/electron-promise-ipc](https://github.com/sibnerian/electron-promise-ipc) | Metadata + README skim | MIT | TypeScript | Promise-flavored IPC calls in Electron. 100% test coverage. |
| [siyuan-note/siyuan](https://github.com/siyuan-note/siyuan) | Metadata + README skim | AGPL-3.0 | TypeScript | An open-source, privacy-first, self-hosted knowledge workspace where humans and AI agents work together 开源、隐私优先、自托管的知识工作空间，让人与智能体在此协作 |
| [songguoxs/gpt4o-image-prompts](https://github.com/songguoxs/gpt4o-image-prompts) | Metadata + README skim | NOASSERTION | JavaScript | Nano Banana(nanobanana),GPT-5(GPT5),GPT-4o(GPT4o) Image Prompts，Nanobanana Prompts，nanobanana提示词 |
| [sulabhdubey/rta-smriti-brain](https://github.com/sulabhdubey/rta-smriti-brain) | Metadata + README skim | MIT | Python | Local-first, evidence-aware project memory for AI coding agents. |
| [templetongroup/radiant](https://github.com/templetongroup/radiant) | Metadata + README skim | MIT | JavaScript | A local coding harness for Mac. Chat with coding agents across cloud and local models, watch every tool call in a live activity feed, and drive a real terminal — in one window. Free and MIT licensed. |
| [Tencent-Hunyuan/HunyuanVideo](https://github.com/Tencent-Hunyuan/HunyuanVideo) | Metadata + README skim | NOASSERTION | Python | HunyuanVideo: A Systematic Framework For Large Video Generation Model |
| [teremterem/claude-code-gpt-5-codex](https://github.com/teremterem/claude-code-gpt-5-codex) | Metadata + README skim | MIT | Python | Run Anthropic's Claude Code CLI with OpenAI models such as GPT-5-Codex, GPT-5.1, and others via a local LiteLLM proxy. |
| [THU-MAIC/OpenMAIC](https://github.com/THU-MAIC/OpenMAIC) | Metadata + README skim | MIT | TypeScript | Open Multi-Agent Interactive Classroom — Get an immersive, multi-agent learning experience in just one click |
| [thu-ml/CRM](https://github.com/thu-ml/CRM) | Metadata + README skim | MIT | Python | [ECCV 2024] Single Image to 3D Textured Mesh in 10 seconds with Convolutional Reconstruction Model. |
| [timharris707/modeldeck](https://github.com/timharris707/modeldeck) | Metadata + README skim | NOASSERTION | JavaScript | macOS menu bar app that tracks usage limits across all your Claude Code and Codex CLI accounts — live "% left" meters per rate-limit window, reset countdowns, low-capacity alerts, and one-click account switching. Local-first: no cloud, no telemetry, credentials never touched. Native SwiftUI + a localhost Node daemon. |
| [tinystruct/smalltalk](https://github.com/tinystruct/smalltalk) | Metadata + README skim | NOASSERTION | Java | A tinystruct-based chat module which integrated with @OpenAI GPT-4 / 3.5-turbo / ChatGPT. @tinystruct |
| [ToolJet/ToolJet](https://github.com/ToolJet/ToolJet) | Metadata + README skim | AGPL-3.0 | HTML | Open-source foundation of ToolJet AI - the enterprise app generation platform for internal tools, dashboards, business applications, workflows and AI agents. Build visually, from a prompt, or from Claude Code, Codex and Cursor over MCP 🚀 |
| [trycompai/crm](https://github.com/trycompai/crm) | Metadata + README skim | MIT | TypeScript | Comp AI CRM is an open source, CRM designed for AI agents. Agentic-first CRM. |
| [TryGhost/Ghost](https://github.com/TryGhost/Ghost) | Metadata + README skim | MIT | TypeScript | Independent technology for modern publishing, memberships, subscriptions and newsletters. |
| [tt-a1i/archify](https://github.com/tt-a1i/archify) | Metadata + README skim | MIT | JavaScript | Turn any idea, plan, or codebase into a beautiful interactive diagram. An agent skill for Claude Code, Codex, and more. |
| [twentyhq/twenty](https://github.com/twentyhq/twenty) | Metadata + README skim | NOASSERTION | TypeScript | The open alternative to Salesforce, designed for AI. |
| [umami-software/umami](https://github.com/umami-software/umami) | Metadata + README skim | MIT | TypeScript | Umami is a privacy-first analytics platform. Traffic, campaigns, behavior, conversions, and revenue in one place — no cookies, no surveillance, self-hosted or in the cloud. |
| [vastsa/PI-Desktop](https://github.com/vastsa/PI-Desktop) | Metadata + README skim | LGPL-3.0 | TypeScript | Local-first AI coding agent desktop: Electron + Rust host core + pi Agent Harness + user-installable plugins |
| [viniciusenari/slideshow-videomaker](https://github.com/viniciusenari/slideshow-videomaker) | Metadata + README skim | MIT | Python | Python scripts that take a set of pictures and an audio track and turn them into a slideshow video. |
| [volcengine/OpenViking](https://github.com/volcengine/OpenViking) | Metadata + README skim | AGPL-3.0 | Python | Self-evolving Context Database for AI Agents. Unify Agent Memory, Knowledge RAG and Skills. |
| [VonHoltenCodes/SlowBooks-Pro-2026](https://github.com/VonHoltenCodes/SlowBooks-Pro-2026) | Metadata + README skim | NOASSERTION | Python | Free, source-available accounting: double-entry bookkeeping, invoicing, US payroll, inventory, bank feeds - desktop app with built-in multi-user Server Edition (no Docker needed). A QuickBooks 2003 Pro replacement. No cloud, no caps. |
| [WEIFENG2333/VideoCaptioner](https://github.com/WEIFENG2333/VideoCaptioner) | Metadata + README skim | GPL-3.0 | Python | 🎬 卡卡字幕助手 \| VideoCaptioner - 基于 LLM 的智能字幕助手 - 视频字幕生成、断句、校正、字幕翻译全流程处理！- A powered tool for easy and efficient video subtitling. |
| [workwithlos-ui/dave](https://github.com/workwithlos-ui/dave) | Metadata + README skim | MIT | Python | DAVE — Data Acquisition and Validation Engine. Production-ready AI-powered scraping: URL to clean, validated, structured data. |
| [wtz2017/VideoMaker](https://github.com/wtz2017/VideoMaker) | Metadata + README skim | NOASSERTION | C | Video Making base on OpenGL ES + OpenSL ES + SurfaceTexture + SurfaceView + MediaCodec + MediaMuxer + AudioRecord + lame + rtmpdump + WePlayer. |
| [WuTao-CS/VideoMaker](https://github.com/WuTao-CS/VideoMaker) | Metadata + README skim | NOASSERTION | Python | This is the official implementation of  VideoMaker: Zero-shot Customized Video Generation with the Inherent Force of Video Diffusion Models |
| [YaoFANGUK/video-subtitle-remover](https://github.com/YaoFANGUK/video-subtitle-remover) | Metadata + README skim | Apache-2.0 | Python | 基于AI的图片/视频硬字幕去除、文本水印去除，无损分辨率生成去字幕、去水印后的图片/视频文件。无需申请第三方API，本地实现。AI-based tool for removing hard-coded subtitles and text-like watermarks from videos or Pictures. |
| [ytdl-org/youtube-dl](https://github.com/ytdl-org/youtube-dl) | Metadata + README skim | Unlicense | Python | Command-line program to download videos from YouTube.com and other video sites |
| [YutaroHayakawa/ipftrace2](https://github.com/YutaroHayakawa/ipftrace2) | Metadata + README skim | NOASSERTION | C | A packet oriented Linux kernel function call tracer |
| [zai-org/CogVideo](https://github.com/zai-org/CogVideo) | Metadata + README skim | Apache-2.0 | Python | text and image to video generation: CogVideoX (2024) and CogVideo (ICLR 2023) |
| [zai-org/GLM-5](https://github.com/zai-org/GLM-5) | Metadata + README skim | Apache-2.0 | — | GLM-5: From Vibe Coding to Agentic Engineering |

### License-metadata counts

| GitHub API license value | Repositories |
|---|---:|
| `MIT` | 52 |
| `NOASSERTION` | 41 |
| `Apache-2.0` | 20 |
| `AGPL-3.0` | 11 |
| `GPL-3.0` | 7 |
| `BSD-3-Clause` | 1 |
| `CC-BY-4.0` | 1 |
| `LGPL-2.1` | 1 |
| `LGPL-3.0` | 1 |
| `Unlicense` | 1 |
| `HTTP 404 / no metadata` | 3 |

## Selected fit review and integration decisions

| Reference | What the inspected material describes | ALO decision |
|---|---|---|
| [`morluto/rea`](https://github.com/morluto/rea) | MIT-licensed REA CLI/MCP reverse-engineering suite. The README describes evidence-backed static/runtime inspection; the published `rea-agents` package requires Node 22.19+, 24.11+, or 26+. | Integrated as an **optional, version-pinned developer audit command**, not as learner-facing runtime code: `npm run audit:rea` invokes `rea-agents@6.3.0` and limits default output to a concise summary. REA was run against a staged source-only copy of the checkout; the filtered run reported 288 relevant files, 286 parsed JavaScript files, 0 parse failures, and 4,164 static findings. This is not a claim that every finding was manually verified. An earlier unfiltered evidence JSON was 290 MB and was intentionally kept outside the repository. No REA source tree or native-analysis dependency was copied into the application. |
| [`cathrynlavery/diagram-design`](https://github.com/cathrynlavery/diagram-design) | MIT-licensed editorial diagram skill with 44 self-contained HTML/SVG types; its README emphasizes direct labels and no shadows/Mermaid. | Added `src/components/site/student-journey-diagram.tsx`: a responsive, semantic four-step practice journey with a small decorative SVG connector, direct labels, keyboard-visible CTA focus, and no diagram-renderer dependency. The implementation is original; no upstream diagram templates were copied. |
| [`coreyhaines31/marketingskills`](https://github.com/coreyhaines31/marketingskills) | MIT-licensed agent skills for CRO, copywriting, SEO, analytics, and growth work. | Adopted the useful constraint—not its code—of clear briefs and reviewable claims. Added deterministic templates, editable drafts, local saves, downloads, and safe-claims guidance. The Studio expressly does not call an AI model, publish, or schedule. |
| [`ToolJet/ToolJet`](https://github.com/ToolJet/ToolJet), [`frappe/crm`](https://github.com/frappe/crm), and other CRM/admin products | Internal-tool/CRM patterns; some inspected projects identify AGPL or other reciprocal licenses. | No source code imported. ALO keeps its existing CRM/API model and added an admin-only partner-account linking endpoint with role and ownership checks. |
| Education, study-abroad and university-guidance repositories | READMEs describe separate products, toolkits, directories and study-planning experiences; country/program/visa claims vary and may become stale. | No external university inventory, testimonials, outcome metrics or visa-policy claims were copied. Home-page numeric success/placement claims and time-sensitive destination promises were removed from the edited surface. Current official provider/government requirements should still be checked before publication. |
| Social publishing, AI coding, voice/video, ERP, telecom, OS, model/API and other unrelated repositories/pages | The referenced materials include schedulers, code agents, local OS utilities, media generators, inbox automation, API gateways, ERP and communication systems. | These are not implemented as ALO product features. No credentials, external model calls, social publishing, email campaigns, video rendering, telephony or scheduling integrations were fabricated. |

## Non-GitHub page previews

The non-repository references reviewed in this session included the direct [Alfa IELTS](https://alfaielts.com/) homepage (four-skill practice paths, product/feature sections, practice calls to action, FAQs, contact/app-download areas, and its provider-independence disclosure), Buffer (social publishing/content/community/analytics), Qwen Coder (web coding assistant), Stack Overflow’s questions index, Mureka (AI music), Astryx/StyleX (design-system patterns), Cline (coding agent), OpenRouter (model API and tool-call guidance), Enerpize (ERP), AiPraktor (Bengali/English social-commerce inbox automation), and SuperCool AI media/production pages. These were treated as product/feature descriptions, not vetted service contracts; no source code or integration credentials were imported. The supplied `developer.meta.com/ai` page could not be inspected because it returned HTTP 403. Page-preview text is not a substitute for a complete site or legal review. The follow-up implementation mapping for Alfa IELTS and the design/marketing references is in `docs/REFERENCE-IMPLEMENTATION-REVIEW.md`.

## ALO work connected to this audit

- Referral codes are normalized, unique partner identifiers. Registration and public lead forms submit `ref`; server routes validate active partners and store attribution on CRM leads. Public consultation/contact forms now submit to `/api/lead` and report real success/failure rather than claiming an unsaved request was stored locally.
- Partner CRM can link/unlink an active `PARTNER` user via `PUT /api/crm/partners/:id/user`; the handler requires ADMIN, checks role/status, and prevents one account being attached to multiple partner profiles.
- `/partner/dashboard` shows aggregate referral/commission totals and limited recent referral fields, not referred students’ names or contact data. `/partner/marketing` creates downloadable SVG, Markdown and text assets containing the partner’s code/link.
- The AI OS Marketing Studio creates editable, deterministic drafts, stores them in the current browser, and exports text; it makes no AI-generation or publishing claim.
- The public home page now includes a responsive practice-flow diagram and avoids the edited surface’s unverified placement/visa statistics and time-sensitive visa promises.

## Verification limits / next operational steps

- The 139-entry GitHub review remains a metadata/README-opening-text triage, not a full source, security, or legal audit. Non-GitHub page previews were partial; the Meta AI page returned HTTP 403. The 404/blocked entries remain unresolved, and a 404 does not establish why a repository is inaccessible.
- In the current 2026-10-11 UTC follow-up, `npm run lint` and the focused TypeScript check of changed UI modules passed. The selected non-database suites passed **98 tests / 289 expectations**. `npm run inventories:check` and `git diff --check` were rerun after the final docs and inventory refresh.
- The full `npm run typecheck` is currently blocked because the generated Prisma client is unavailable (`@prisma/client` has no `PrismaClient` export in this postinstall-skipped workspace). `tests/exam-attempt.test.ts` and `tests/rbac.test.ts` also require that client and a migrated database. A previous Prisma-engine download attempt was blocked by the sandbox's outbound-host restrictions. No production build or database-backed API round trip is claimed.
- `npm run content:validate` cannot run successfully without `DATABASE_URL`. The new public routes returned HTTP 200 locally; consultation query-prefill was visible in server-rendered HTML, but the client-side submit interaction, accessibility, and production host were not tested.
- The migration in `prisma/migrations/20261010000000_partner_referral_code/` has **not** been applied. After Prisma engine access and a safe development database are available, generate the client, apply migrations in a development environment, then exercise registration → referral attribution → partner dashboard/download end to end.
- The REA static analysis was executed locally and did not run the analyzed application. Its unfiltered evidence output was not retained in Git; use `npm run audit:rea` for a pinned, source-only, summary-filtered report.
- No blanket permission to reuse external source code is implied. The new destination guidance links have not been independently checked for current reachability/content; official rules should be verified by users with the relevant authority.
