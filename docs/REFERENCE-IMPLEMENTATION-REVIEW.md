# Reference implementation follow-up

**Review date:** 2026-10-11 (UTC)
**Project:** ALO English / ALO Education

This follow-up maps the references most relevant to the learner-facing product to specific ALO code. It complements `docs/REFERENCE-LINK-AUDIT.md` and `docs/REFERENCE_INTEGRATION_MATRIX.md`; it does not represent a line-by-line security, dependency, or license audit of every external repository.

## Direct website reference: alfaielts.com

The public Alfa IELTS homepage was reviewed, including its four skill modules, practice/test-type pathways, prominent practice calls to action, product/feature sections, FAQs, contact and app-download areas, and provider-independence disclosure. These are product and UX patterns, not permission to reproduce its brand, media, question bank, customer metrics, testimonials, or claims.

| Reference pattern | ALO implementation | Evidence boundary |
| --- | --- | --- |
| Clear English-practice landing page and primary action | `src/app/page.tsx` now leads with English-test practice, links directly to the active exam catalog and preparation overview, and keeps study-abroad help as a secondary path. | ALO does not claim that every listed exam has a complete mock or active question bank. The catalog is authoritative for current local set counts/status. |
| Listening, Reading, Writing and Speaking entry points | The home page has a responsive four-skill section. Each card leads to `/exam-prep` rather than claiming a particular unverified item is playable. | A skill label or exam-type row does not establish full coverage, media delivery, or score validity. |
| Practice → review → next-step journey | `src/components/site/student-journey-diagram.tsx` provides a semantic, responsive ordered-flow diagram with direct labels, keyboard-visible CTAs, and no chart/diagram service dependency. | The component uses original ALO UI and explanatory text; no upstream templates or protected visual assets were copied. |
| Mobile navigation and consistently visible actions | `src/components/site/site-header.tsx` has an expandable mobile menu, active-route state, login and practice actions, and minimum-size touch targets. `src/app/layout.tsx` adds a skip-to-content link. Primary orange CTAs use `#CC3F10` with white text; small orange labels use `#C2410C` on white/light backgrounds. | Selected color pairs meet text-contrast thresholds in the used light backgrounds, but keyboard/screen-reader behavior and full-page conformance still need browser/manual testing. Source-level markup is not a WCAG conformance claim. |
| Frequently asked questions and trust disclosure | The home page answers score, active-set, and getting-started questions; `src/app/language-prep/page.tsx` links to official test-provider information and separates provider facts from local practice availability. | Provider requirements change. Users are sent to current official sources; this application does not issue provider-certified results. |
| Downloadable partner campaign assets | `/partner/marketing` already hosts the ALO partner kit. `src/components/alo/ambassador-marketing-kit.tsx` now shows visual/text previews and supports copying text assets as well as downloading them. | Text/SVG generation is local and deterministic. It does not publish, schedule, email, or contact social platforms. Partner profile and tracked attribution still depend on the configured database. |
| Study-abroad planning and destination guidance | `/course-finder` collects subject, level, destination, and intake preferences, then carries them into the consultation form. `/destinations` links to government study/visa guidance. `/universities`, `/scholarships`, `/services`, and `/resources` now explain the available research paths and limits instead of promising unverified databases or outcomes. | The course planner is a consultation-brief builder, not a live course/university search or admissions predictor. Scholarship data is not searchable. Visa and admission rules remain the responsibility of official authorities. Destination-link reachability/content was not independently checked in this local implementation pass. |

### Study-planning integrity

The public study-abroad pages contained indefinite “database loading” placeholders, broad service guarantees, and destination-level visa/work claims without a verified source in this workspace. These were replaced with user-facing checklists, direct planning paths, and explicit evidence limits. The consultation form accepts only allowlisted course-finder values before pre-populating a user-editable message; `?interest=funding` creates a scholarship-research prompt. No institution, scholarship, immigration status, eligibility, price, or outcome was invented.

### Marketing-claim correction

The repository's current feature-gap register says that active exam counts, provenance/licensing, and official-format completeness are not verified. Accordingly, the downloadable partner materials and default marketing draft must not promise “original exam-aligned questions.” The following were changed:

- Replaced that unsupported language in the poster, social/story assets, caption pack, WhatsApp copy, and default campaign facts with catalog-dependent, preparation-only language.
- Added copy actions and previews to the partner kit without adding external publishing or AI-generation claims.
- Added regression assertions so generated partner assets keep the referral URL, warn that results are not official, and avoid the unsupported alignment claim.

## Relevant repository families

| Family/reference examples | ALO treatment |
| --- | --- |
| Diagram patterns — `cathrynlavery/diagram-design`, `tt-a1i/archify` | Implemented as a small accessible ALO practice journey rather than importing an agent-oriented diagram authoring tool or its templates. |
| Marketing skills — `coreyhaines31/marketingskills`, partner/ambassador references | ALO has a deterministic, editable Marketing Studio and referral-linked partner assets. No social API, scheduler, external model call, or automatic publishing is implied. |
| IELTS/test-preparation and education resources — Alfa IELTS, Hugging Face Education Toolkit, OpenMAIC, study-abroad sites | ALO routes learners to its active catalog and public handbook. No third-party question banks, proprietary screenshots, university inventories, testimonials, or visa claims were copied. |
| CRM and internal-tool products — ToolJet, Frappe CRM, Twenty, Django CRM, and other listed CRMs | ALO retains its own Prisma/role/ownership implementation. These complete CRM products are not interchangeable UI components; no repository was bulk-merged. |
| Coding-agent plugins, context and model projects — Cursor/Claude plugins, Cline, ECC, OpenRouter, memory/RAG projects | Treated as developer tooling or optional architecture references, not as learner-facing content or a reason to add unapproved credentials/providers. Existing AI/RAG routes remain subject to their configuration and data-processing gates. |
| Video, voice, telephony, SMS, scraping, ERP, OS and other unrelated projects | Not imported as ALO features. Some require native clients, user consent, provider credentials, licensing review, or materially different product scope. A nonfunctional provider integration has not been fabricated. |

The repository-level audit covers 139 normalized GitHub destinations with metadata and README-opening-text triage; 136 were publicly readable at that audit point and three returned HTTP 404. That triage is not a complete source-code or legal audit, and HTTP 404 does not establish whether a repository is private, deleted, restricted, or mistyped. Non-GitHub page previews were partial for some sites. See `docs/REFERENCE-LINK-AUDIT.md` for the repository rows and known limits.

## Verification and remaining external gates

- `npm ci --ignore-scripts --no-audit --no-fund` installed the locked packages. `npm run lint` passed. `npm run inventories:check` and `git diff --check` passed after the final app, documentation, and inventory updates. A focused TypeScript check covering the changed public pages, navigation, forms, diagram, and marketing-kit modules passed after the latest app-code changes.
- `npx bun test` passed **98 tests and 289 expectations** across the selected non-database suites, including the partner-marketing regression suite. The two Prisma/database-backed suites were not run because this workspace has no generated Prisma client or migrated test database.
- The full `npm run typecheck` remains blocked by the ungenerated Prisma client (`@prisma/client` exports no `PrismaClient` in the postinstall-skipped workspace). `npm run content:validate` remains blocked because `DATABASE_URL` is unset. No production build or database-backed round trip is claimed.
- The local Next development server returned HTTP 200 for the changed public routes `/`, `/language-prep`, `/contact`, `/course-finder`, `/destinations`, `/services`, `/scholarships`, `/universities`, `/resources`, and `/book-consultation`. A server-rendered consultation request contained valid course preferences and the funding-interest prompt. This confirms route rendering and query prefill only; it does not test the client-side submit interaction, accessibility, device behavior, or production hosting.
- The new government destination links are identified as official starting points in code but were not independently opened or checked for reachability/current content during this implementation pass.
- Keyboard/screen-reader, visual-regression, mobile-device, production-host, partner-login/download, provider-delivery, and deployment checks remain outstanding unless recorded separately in current CI/deployment evidence.
- The active question-bank/provenance and score-validation blockers in `docs/FEATURE_GAP_REGISTER.md` remain release blockers. No implementation here changes those facts or enables payments, authenticated email, third-party AI, or official score claims.
- No competitor branding, logo, customer data, screenshots, app-store buttons, contact data, question content, or testimonials were copied. Only general UX patterns were adapted.
