# ALO Education — 90-Day SEO Growth Marketing Plan

> **Document type:** Implementable marketing & systems plan
> **Source framework:** ALO Education Elite 90-Day SEO Growth System Master Prompt (2,385 lines)
> **Owner:** SEO Growth Director + CRM Product Architect
> **Planning date:** July 9, 2026
> **Execution window:** July 9, 2026 → October 7, 2026 (90 days)
> **Primary market:** Bangladesh (priority local: Dhaka)
> **Timezone:** Asia/Dhaka
> **Primary site:** `aloeducation.com`
> **Storage location:** `cpanel-production/docs/SEO_MARKETING_90_DAY_PLAN.md`

---

## 0. Operating Principle (Master Prompt §64)

> AI researches and proposes.
> Official sources establish high-risk facts.
> Source Verification checks evidence.
> The Fact-Check Agent tests claims.
> A human expert reviews sensitive content.
> The SEO QA Agent checks page quality.
> The Publishing Agent releases approved work.
> Search Console measures visibility.
> Analytics measures site behavior.
> WEB_CRM measures business outcomes.
> Performance data decides what gets improved next.

The SEO program optimizes for **qualified students, strong consultations, good-fit applications, and successful enrolment outcomes** — not article count.

---

## 1. Executive Summary

### 1.1 Mission

Build the strongest realistic 90-day SEO growth system for ALO Education that:

1. Fixes technical SEO and crawl/indexation risks.
2. Creates a strong search architecture.
3. Builds high-intent destination, visa, admission, scholarship, and service content.
4. Improves visibility in traditional Google Search.
5. Improves eligibility and visibility for Google generative-AI search experiences.
6. Improves local visibility in Dhaka and other genuine service locations.
7. Creates real authority through university partnerships, student evidence, and original data.
8. Creates useful AI-powered lead magnets (Course Matcher, Visa Interview Practice).
9. Captures SEO-originated leads directly inside WEB_CRM.
10. Connects SEO activity to consultations, applications, offers, deposits, visa outcomes, and enrolments.
11. Automates research, monitoring, briefs, QA, and reporting with AI agents.
12. Prevents AI hallucinations and outdated immigration information.
13. Creates a human approval workflow for high-risk content.
14. Measures actual business outcomes instead of vanity metrics.
15. Produces a scalable SEO operating system for the next 12 months.

### 1.2 90-Day Objective

Establish a clean, indexed, well-architected, evidence-based content engine for ALO Education, anchored on 12–15 commercial/money pages, 12–18 researched support articles, 3–5 counsellor profiles, 6–10 genuine student stories, 1 original data report, 1 AI Course Matcher MVP, 1 AI Visa Interview Practice MVP, ongoing technical fixes, local SEO work, and authority acquisition. Volume is calibrated to team capacity — quality over quantity.

### 1.3 What Can Be Promised

* A complete technical baseline audit with P0/P1/P2/P3 prioritization.
* A research-backed content architecture and 30 money-page backlog.
* A working WEB_CRM SEO Growth module with 14 specialized AI agents and human approval gates.
* A freshness monitoring system for volatile immigration content.
* An attribution pipeline from first organic visit through enrolment.
* An executive dashboard that reports business outcomes, not vanity traffic.

### 1.4 What Cannot Be Promised

> The following promises are explicitly forbidden (Master Prompt §1, §54, §58):

* Number-one ranking, first-page ranking, or any specific ranking position.
* Visa approval, scholarship approval, university admission, or PR eligibility.
* Exact processing times.
* A specific SEO traffic percentage increase without baseline data.
* "98% visa success rate" or any quantified success claim without audited denominator, numerator, exclusions, date range, and approval.

Where baseline data exists, realistic targets are calculated. Where baseline data does not exist, we produce a baseline collection plan, leading indicators, lagging indicators, and a target-setting method.

---

## 2. Current-State Audit Framework

### 2.1 Audit Modes

**Mode A — Confirmed Public Findings** (no account access needed):
- Public crawl, robots.txt, sitemap inspection, rendered HTML, public PageSpeed Insights, public SERP sampling.

**Mode B — Likely Risks Requiring Access:**
- Suspected indexation gaps, duplicate content, crawl waste.

**Mode C — Exact Access Required:**
- GSC property, GA4 property, GBP manager, CRM lead data, server/CDN logs, backlink tools, rank tracker.

### 2.2 Audit Dimensions (Master Prompt §5)

| # | Dimension | Key checks | Output |
|---|-----------|------------|--------|
| 5.1 | **Indexation** | indexed URLs, non-indexed important URLs, duplicate pages, `/` vs `/Home`, HTTP vs HTTPS, www vs non-www, trailing-slash consistency, capitalization, parameterized pages, indexable filters, staging URLs, test pages, search pages, duplicate categories, low-value tag pages, orphan pages | Per-issue: evidence, affected URLs, severity, business impact, fix, dev effort, owner, deadline |
| 5.2 | **Crawling** | robots.txt, XML sitemap, sitemap accuracy, lastmod quality, blocked resources, noindex directives, robots meta, X-Robots-Tag, crawl depth, broken internal links, redirect chains, redirect loops, 404s, soft 404s, 5xx | Per-issue fix list + owner |
| 5.3 | **JavaScript rendering** | Compare raw HTML vs rendered DOM vs visible content for templates: homepage, destination, university, course, blog, service, tool, contact | SSR/SSG/hybrid recommendation only after identifying real problem |
| 5.4 | **Canonicalization** | duplicate routes, query parameters, filters, sorting, campaign params, pagination, duplicate homepage, duplicate course results | Canonical rules, index/noindex rules, redirect rules, sitemap inclusion rules |
| 5.5 | **Mobile SEO** | mobile/desktop parity, navigation, tap targets, viewport, primary content visibility, lazy loading, sticky CTAs, intrusive overlays, layout shifts, font readability | Per-template mobile defect list |
| 5.6 | **Core Web Vitals** | LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 (field data separately from lab). Investigate hero media, render-blocking, JS bundles, hydration, fonts, third-party, chat widgets, analytics, image formats, responsive images, CDN, route transitions, layout reservation | CWV pass-rate by template |
| 5.7 | **On-page metadata** | titles, meta descriptions, canonical, headings, duplicate titles, vague titles, intent mismatch, missing descriptions, repetitive templates | Single primary H1 per page as CMS standard (not an arbitrary heading count rule) |
| 5.8 | **Structured data** | Organization, BreadcrumbList, Article, BlogPosting, Course (only where it genuinely qualifies), VideoObject, LocalBusiness (only where truthful). Markup must match visible content; no fake reviews/ratings/schema spam; validate before release | Per-template schema validity report |
| 5.9 | **Images & video** | descriptive filenames, alt text, WebP/AVIF, responsive images, dimensions, lazy loading, image sitemap, video indexability, thumbnails, captions, transcripts | Image audit + remediation tickets |

### 2.3 Mandatory Current-Risk Checklist (Master Prompt §4)

Before publishing any sensitive content, verify:

1. UK Student visa terminology and current requirements.
2. UK Graduate visa duration rules — applications made on/before Dec 31, 2026 vs on/after Jan 1, 2027; doctoral qualification rules.
3. Canada Student Direct Stream status — do NOT publish a 2026 "SDS vs Non-SDS" article without checking whether SDS still exists.
4. Current Canada PGWP rules — eligibility, language rules, field-of-study rules, 2026 field-of-study list status.
5. Australia Student visa subclass 500 requirements.
6. Current Australia Genuine Student requirement.
7. Current U.S. F and M student visa guidance.
8. U.S. visa appointment information — clearly labeled as time-sensitive.
9. Whether FAQ rich results are currently supported — do NOT promise FAQ dropdown rich results.
10. Current Google rules about generative AI content and scaled content abuse.
11. Current Google generative AI Search optimization guidance.
12. Current GSC generative-AI reporting availability.
13. Current Google Indexing API eligibility — never use it for ordinary blog/destination/service pages unless official eligibility supports the page type.
14. Current Google structured-data supported feature list.
15. Google Business Profile policies.

> Any supplied old content that conflicts with current official sources MUST be corrected before publication.

---

## 3. Keyword Research System

### 3.1 Inputs (Master Prompt §6)

1. GSC query data
2. GSC landing-page data
3. Google Ads Keyword Planner (where account access exists)
4. Google Trends
5. Current Google SERPs
6. People Also Ask observations (where available)
7. Related search behavior
8. Competitor ranking pages
9. CRM search-originated lead data
10. CRM application and enrolment outcomes

### 3.2 Per-Keyword Fields Captured

`keyword`, `country`, `language`, `intent`, `funnel stage`, `destination`, `study level`, `service type`, `current ranking`, `current URL`, `impressions`, `clicks`, `CTR`, `average position`, `search-volume estimate and source`, `CPC estimate and source`, `competition metric and provider`, `lead count`, `qualified lead count`, `consultation count`, `application count`, `offer count`, `deposit count`, `visa count`, `enrolment count`, `revenue contribution if available`, `content status`, `cannibalization risk`, `recommended action`.

### 3.3 Opportunity Score Model (Master Prompt §7)

```
Opportunity Score = 0.25 × GSC_opportunity
                  + 0.20 × Verified_demand
                  + 0.20 × CRM_conversion_quality
                  + 0.15 × Business_value
                  + 0.10 × SERP_feasibility
                  + 0.10 × Content_freshness_urgency
```

**Component definitions:**

| Component | Formula | Notes |
|-----------|---------|-------|
| GSC_opportunity | `normalize(impressions_growth_pct × CTR_uplift_potential × position_proximity_to_top10)` 0–100 | ALO already ranking positions 5–20 + growing impressions = highest score. |
| Verified_demand | `normalize(verified_search_volume × trend_slope)` 0–100 | Source of volume recorded. If no verified source → score = 0 (never invented). |
| CRM_conversion_quality | `normalize(qualified_leads / total_leads × enrolments / qualified_leads)` 0–100 | A high-volume term with poor CRM quality is down-ranked. |
| Business_value | `normalize(per_destination_revenue_weight × strategic_priority)` 0–100 | UK/Canada/USA = high; long-tail informational = lower. |
| SERP_feasibility | `normalize(intent_match × content_gap_fixable × competitor_authority_gap)` 0–100 | SERP dominated by official government portals = low feasibility for commercial interpretation. |
| Content_freshness_urgency | `normalize(policy_volatility × last_review_age_days)` 0–100 | PGWP, UK Graduate visa, Australia GS = high urgency. |

**Hard rule:** Never use a high search-volume term as top priority if CRM data shows poor student quality.

### 3.4 Allowed Keyword Actions

`CREATE`, `UPDATE`, `MERGE`, `REDIRECT`, `CONSOLIDATE`, `RETIRE`, `NOINDEX`, `WAIT`, `TEST_TITLE`, `IMPROVE_CTR`, `ADD_INTERNAL_LINKS`.

---

## 4. Seed Keyword Groups

> These are research seeds only. Every term must be validated against current demand, competition, SERP intent, and business value before promotion to production.

### 4.1 High-Conversion Seeds

- best study abroad agency in dhaka
- book free study abroad consultation
- study gap acceptable universities 2026
- education loan for study abroad bangladesh
- overseas education consultant near me
- study abroad consultant bangladesh
- study abroad consultant dhaka
- student visa consultant dhaka
- university admission consultant bangladesh

### 4.2 UK Seeds

- study in uk
- study in uk from bangladesh
- study in uk without ielts requirements
- uk student visa requirements
- uk student visa financial requirements
- affordable universities in uk
- scholarships in uk for bangladeshi students
- uk graduate visa
- uk post study work visa
- pre-CAS interview questions

### 4.3 USA Seeds

- study in usa
- f1 visa interview questions and answers
- usa universities accepting duolingo
- scholarships in usa for international students
- usa universities for bangladeshi students
- I-20 requirements
- SEVIS fee
- CPT vs OPT
- STEM OPT

### 4.4 Canada Seeds

- study in canada
- canada study permit requirements
- canada study permit bank statement requirements
- PGWP eligibility
- PGWP field of study
- cheapest colleges in canada
- scholarships in canada

### 4.5 Australia Seeds

- study in australia
- australia student visa subclass 500
- genuine student requirement
- scholarships in australia
- affordable universities in australia
- OSHC for international students

### 4.6 Ireland Seeds

- study in ireland
- ireland stamp 1g
- cost of living in dublin for students
- studying technology in ireland

### 4.7 New Zealand Seeds

- study in new zealand
- new zealand post study work route

### 4.8 Dubai Seeds

- study in dubai
- study in dubai: admissions, costs and financial-evidence requirements

---

## 5. Competitor Research Framework

### 5.1 Initial Competitor Set (Master Prompt §9)

| # | Competitor | Domain | Type |
|---|------------|--------|------|
| 1 | IDP Bangladesh | idp.com | agency |
| 2 | Shabuj Global | shabujglobal.com | agency |
| 3 | MACES | macesglobal.com | agency |
| 4 | Mentors' | mentors.com.bd | agency |
| 5 | TCL Global | tclglobal.co.uk | agency |
| 6 | GoStudy | gostudy.com | agency |
| 7 | GSC Global Solutions | gscglobal.com.bd | agency |
| 8 | Eduvisors | eduvisors.com | agency |
| 9 | Career Paths | careerpaths.com.bd | agency |
| 10 | Any domains repeatedly ranking in target SERPs | _discovered via SERP sampling_ | varies |

### 5.2 Per-Competitor Analysis Dimensions

organic visibility, indexed page types, destination architecture, city/location pages, university pages, course tools, scholarship tools, calculators, AI tools, lead forms, WhatsApp flows, consultation booking, trust evidence, student stories, counsellor profiles, university partner pages, content depth, publishing frequency, update dates, page speed, Core Web Vitals (where data is available), backlinks, digital PR, local SEO, GBP strength, internal linking, titles, SERP features, AI Search visibility (where observable).

### 5.3 Required Outputs

1. Competitor matrix
2. Keyword overlap
3. Page gap analysis
4. Content quality gap
5. Tool gap
6. Trust gap
7. Local SEO gap
8. Conversion gap
9. Backlink gap
10. "ALO can win here" list

> **Hard rule (Master Prompt §9, §58):** Do NOT invent DA or DR. If using a third-party authority metric, name the provider and retrieval date.

---

## 6. Site Architecture (Master Prompt §11)

### 6.1 Recommended Logical Architecture

```
/
├── study-abroad/
├── study-in-uk/
│   ├── student-visa/
│   ├── scholarships/
│   ├── affordable-universities/
│   ├── english-language-options/
│   ├── graduate-visa/
│   └── pre-cas-interview/
├── study-in-usa/
│   ├── f1-student-visa/
│   ├── f1-interview/
│   ├── scholarships/
│   ├── application-guide/
│   └── cpt-opt/
├── study-in-canada/
│   ├── study-permit/
│   ├── pgwp/
│   ├── pgwp-field-of-study/
│   └── scholarships/
├── study-in-australia/
│   ├── student-visa/
│   ├── genuine-student/
│   ├── scholarships/
│   └── cost-of-study/
├── study-in-ireland/
├── study-in-new-zealand/
├── study-in-dubai/
├── services/
│   ├── university-admissions/
│   ├── visa-guidance/
│   ├── scholarship-support/
│   └── course-matching/
├── tools/
│   ├── course-matcher/
│   ├── eligibility-checker/
│   ├── visa-interview-practice/
│   └── cost-estimator/
├── guides/
├── success-stories/
├── counsellors/
├── universities/
├── courses/
└── locations/
```

### 6.2 URL Migration Rules (Master Prompt §11)

Do NOT change existing successful URLs unnecessarily. For every URL migration:

1. Map old → new
2. Create 301 redirect
3. Update internal links
4. Update canonical
5. Update sitemap
6. Monitor Search Console

### 6.3 Things to Avoid (Master Prompt §58)

Never:
1. Change important URLs without redirects.
2. Copy competitor content.
3. Use AI to create hundreds of low-value pages.
4. Claim fixed minimum article word counts as a Google requirement.
5. Assume every query parameter must be removed.
6. Assume JavaScript automatically prevents indexing.
7. Promise FAQ rich-result dropdowns.
8. Misuse the Indexing API for ordinary pages.
9. Fabricate E-E-A-T signals, counsellor credentials, student stories, visa results, backlinks, or keyword data.
10. Auto-publish high-risk immigration claims.
11. Hide important copy inside graphics.
12. Create fake offices, fake reviews, fake city pages.
13. Over-optimize anchors.
14. Publish generic "SEO filler."

---

## 7. 30 Money-Page Backlog (Master Prompt §12)

> Treat as a seed backlog. Before implementation, classify each page as: Publish Now / Publish Later / Merge / Rewrite / Update Existing / Postpone / Retire. Validate keyword intent and cannibalization for each.

| # | Title concept | Keyword | URL | Intent | CTA | Suggested classification |
|---|---------------|---------|-----|--------|-----|--------------------------|
| 1 | Study in UK 2026: Admissions, Visas & Top Universities | study in uk | `/study-in-uk` | informational/commercial investigation | Book Consultation | **Publish Now** (Week 3) |
| 2 | Study in USA 2026: F1 Visa & University Admissions | study in usa | `/study-in-usa` | informational/commercial | Book Consultation | **Publish Now** (Week 3) |
| 3 | Study in Canada 2026: Universities, Study Permits & Post-Graduation Options | study in canada | `/study-in-canada` | informational/commercial | Book Consultation | **Publish Now** (Week 4) |
| 4 | Study in Australia 2026: Admissions, Visa & Scholarships | study in australia | `/study-in-australia` | informational/commercial | Book Consultation | **Publish Now** (Week 4) |
| 5 | Study in Ireland: Universities & Graduate Options | study in ireland | `/study-in-ireland` | informational/commercial | Book Consultation | **Publish Later** (Week 8) |
| 6 | Study in Dubai: Universities, Admissions & Costs | study in dubai | `/study-in-dubai` | informational/commercial | Book Consultation | **Publish Later** (Week 9) |
| 7 | Study in New Zealand: Admissions Guide | study in new zealand | `/study-in-new-zealand` | informational/commercial | Book Consultation | **Publish Later** (Week 9) |
| 8 | UK Student Visa Process & Requirements | uk student visa process | `/uk/student-visa` | informational | Free Visa Evaluation | **Publish Now** (Week 5) — must use current "Student visa" terminology |
| 9 | F1 Student Visa USA: Interview Questions & Process | usa student visa process | `/usa/f1-student-visa` | informational | Start Mock Practice | **Publish Now** (Week 6) |
| 10 | Canada Study Permit Requirements & Checklist | canada study permit | `/canada/study-permit` | informational | Free Eligibility Evaluation | **Publish Now** (Week 7) |
| 11 | Australia Subclass 500 Student Visa Requirements | australia student visa | `/australia/student-visa` | informational | Free Visa Evaluation | **Publish Now** (Week 8) |
| 12 | Affordable Universities in the UK | cheapest universities in uk | `/uk/affordable-universities` | commercial | Apply / Check Eligibility | **Publish Now** (Week 5) — use "affordable" not "cheapest" |
| 13 | Affordable Universities in the USA | cheapest universities in usa | `/usa/affordable-universities` | commercial | Check Eligibility | **Publish Now** (Week 6) |
| 14 | Affordable Colleges and Universities in Canada | cheapest colleges in canada | `/canada/affordable-colleges` | commercial | Check Eligibility | **Publish Now** (Week 7) |
| 15 | English-Language Admission Options for UK Universities | study in uk without ielts | `/uk/english-language-options` | informational | Check Eligibility | **Publish Now** (Week 5) — never imply universal IELTS exemption; verify per-university |
| 16 | USA Universities and English-Test Options | usa universities accepting duolingo | `/usa/english-test-options` | informational | Check Eligibility | **Publish Now** (Week 6) — verify institution-by-institution |
| 17 | Scholarships in USA for International and Asian Students | scholarships in usa | `/usa/scholarships` | commercial | Find Scholarships | **Publish Now** (Week 6) |
| 18 | Scholarships in UK for International Students | scholarships in uk | `/uk/scholarships` | commercial | Find Scholarships | **Publish Now** (Week 5) |
| 19 | Canada Scholarships for International Students | scholarships in canada | `/canada/scholarships` | commercial | Find Scholarships | **Publish Now** (Week 7) |
| 20 | Study Abroad Consultant in Bangladesh / Dhaka | study abroad consultant | `/study-abroad-consultant-dhaka` | local/commercial | Book Appointment | **Publish Now** (Week 3) — validate local + national intent first |
| 21 | Student Visa Guidance Services | student visa consultant | `/services/visa-guidance` | transactional | Free Evaluation | **Publish Later** (Week 4) — avoid promising legal representation unless accurate |
| 22 | University Admission Assistance | university admission help | `/services/university-admissions` | transactional | Meet a Counsellor | **Publish Later** (Week 4) |
| 23 | Study Abroad with a Study Gap | study gap acceptable universities | `/guides/study-gap` | informational | Check Eligibility | **Publish Now** (Week 9) — no blanket acceptance rules |
| 24 | Canada PGWP Guide | PGWP Canada rules | `/canada/pgwp` | informational | Check Program Eligibility | **Publish Now** (Week 7) — high-frequency policy verification required |
| 25 | UK Graduate Visa Guide | uk post study work visa | `/uk/graduate-visa` | informational | Consult Expert | **Publish Now** (Week 5) — must show effective dates |
| 26 | AI Visa Interview Practice | visa interview practice | `/tools/visa-interview-practice` | transactional | Start Practice | **Publish MVP** (Week 6) — practice does NOT guarantee visa outcome |
| 27 | SOP Review and Guidance | sop writing services / SOP review | `/services/sop-review` | transactional | Review SOP | **Publish Later** (Week 9) — academic-integrity safeguards; no fabricated experiences |
| 28 | Education Financing for Study Abroad from Bangladesh | study abroad education loan | `/guides/education-financing` | informational | Explore Options | **Publish Later** (Week 9) — verify current financial products directly |
| 29 | Financial Evidence for Student Visa Applications | student visa bank statement | `/visa/financial-evidence` | informational | Get Country Checklist | **Publish Later** (Week 9) — separate rules by destination; never combine jurisdictions |
| 30 | Course Finder & AI University Matcher | course finder study abroad | `/tools/course-matcher` | transactional | Find My Course | **Publish MVP** (Week 8) — crawlable public landing content; control indexation of filter combinations |

---

## 8. 100-Topic Content Backlog (Master Prompt §14)

> SEED backlog. Do NOT blindly publish all 100. For each topic perform: fresh SERP research, GSC overlap analysis, cannibalization check, current-policy verification, CRM business-value review.

### 8.1 Cluster A — Decision and Foundations

| # | Topic | Classification |
|---|-------|----------------|
| A1 | UK vs Canada: Which is better for international students? | **Publish** |
| A2 | IELTS vs PTE vs Duolingo: How should a student choose? | **Publish** |
| A3 | Reasons students choose to study abroad in 2026 | **Publish** |
| A4 | Fall vs Spring Intake: Which should you choose? | **Publish** |
| A5 | How to write a strong Statement of Purpose | **Publish** |
| A6 | What is a CAS letter? | **Publish** |
| A7 | What is an I-20 form? | **Publish** |
| A8 | Total cost of studying abroad from Bangladesh | **Update Existing** (if a cost page exists) |
| A9 | How to discuss a study-abroad plan with your family | **Publish** |
| A10 | How to compare destinations for safety and student experience | **Publish** |
| A11 | Packing list for international students travelling to cold countries | **Publish** |
| A12 | How to prepare for culture shock | **Publish** |
| A13 | Finding part-time work as an international student | **Publish** |
| A14 | Health insurance for international students | **Publish** |
| A15 | How international students can prepare to open a bank account | **Publish** |
| A16 | How to identify misleading or fake education agents | **Publish** |

### 8.2 Cluster B — UK

| # | Topic | Classification |
|---|-------|----------------|
| B1 | Russell Group universities explained | **Publish** |
| B2 | Affordable UK cities for students | **Publish** |
| B3 | UK universities for Business and MBA programs | **Publish** |
| B4 | UK universities for Computer Science | **Publish** |
| B5 | UK Immigration Health Surcharge explained | **Publish** |
| B6 | Current UK dependant rules for students | **Publish** (high volatility — frequent review) |
| B7 | Pre-CAS credibility interview questions and preparation | **Publish** |
| B8 | UK universities for Master's programs | **Publish** |
| B9 | UK January intake options | **Publish** |
| B10 | UK May and September intake options | **Publish** |
| B11 | UK student accommodation guide | **Publish** |
| B12 | Manchester vs London for students | **Publish** |
| B13 | UK scholarships for Bangladeshi students | **Publish** |
| B14 | UK Student visa financial requirements and current evidence rules | **Publish** (high volatility) |
| B15 | UK Graduate visa current rules and effective dates | **Publish** (critical volatility) |
| B16 | What to do after a UK Student visa refusal | **Publish** |
| B17 | Part-time work options and work-right rules for students in the UK | **Publish** |

### 8.3 Cluster C — USA

| # | Topic | Classification |
|---|-------|----------------|
| C1 | F1 visa interview questions | **Publish** |
| C2 | How to prepare for an F1 visa interview | **Publish** |
| C3 | STEM OPT extension explained | **Publish** |
| C4 | Community college vs university in the USA | **Publish** |
| C5 | Highly selective U.S. university admission expectations for international students | **Publish** |
| C6 | GRE and GMAT requirements: current university trends | **Publish** |
| C7 | Working during and after study: on-campus work, CPT and OPT | **Publish** |
| C8 | Universities in Texas for international students | **Publish** |
| C9 | Universities in New York for international students | **Publish** |
| C10 | USA intake deadlines | **Publish** (time-sensitive — refresh) |
| C11 | Writing a U.S. college admission essay | **Publish** |
| C12 | How to request strong recommendation letters | **Publish** |
| C13 | U.S. visa refusal issues, including 214(b), using official sources | **Publish** |
| C14 | Financial and sponsor documentation for the I-20 and visa process | **Publish** |
| C15 | How to dress professionally and prepare for a visa interview | **Publish** |
| C16 | SEVIS fee explained | **Publish** |
| C17 | Scholarships and opportunities for women in STEM in the USA | **Publish** |

### 8.4 Cluster D — Canada

| # | Topic | Classification |
|---|-------|----------------|
| D1 | Canada study permit process | **Publish** |
| D2 | RETIRE OR REWRITE the old "SDS vs Non-SDS" topic after current-rule verification | **Retire or Rewrite** |
| D3 | Universities in Ontario | **Publish** |
| D4 | Universities in British Columbia | **Publish** |
| D5 | Immigration pathways after study: neutral factual overview | **Publish** (no "easy PR") |
| D6 | Co-op programs in Canada explained | **Publish** |
| D7 | Vancouver vs Toronto for students | **Publish** |
| D8 | Study-plan or letter-of-explanation guidance for Canadian applications | **Publish** |
| D9 | Current financial requirements for Canadian study permits | **Publish** (high volatility) |
| D10 | Finding affordable accommodation in Canada | **Publish** |
| D11 | Changing institutions or programs: current rules | **Publish** (high volatility) |
| D12 | Current spouse and family rules for international students | **Publish** (high volatility) |
| D13 | Compare provincial pathways after study without claiming "easy PR" | **Publish** |
| D14 | Diploma vs degree in Canada | **Publish** |
| D15 | Biometrics and medical examination process | **Publish** |
| D16 | Canada study permit processing-time research with date stamp and official source | **Publish** (very high volatility — refresh weekly) |

### 8.5 Cluster E — Australia and Other Destinations

| # | Topic | Classification |
|---|-------|----------------|
| E1 | Australia Genuine Student requirement explained | **Publish** (high volatility) |
| E2 | Regional study options in Australia and current policy implications | **Publish** |
| E3 | Sydney vs Melbourne for students | **Publish** |
| E4 | Australia subclass 500 processing-time research with date stamp | **Publish** (very high volatility) |
| E5 | Study areas and current skilled-migration context without promising PR | **Publish** |
| E6 | Ireland Stamp 1G guide | **Publish** |
| E7 | Studying technology in Ireland | **Publish** |
| E8 | Cost of living in Dublin for students | **Publish** |
| E9 | New Zealand post-study work route | **Publish** |
| E10 | Study in Dubai: admissions, costs and financial-evidence requirements | **Publish** |
| E11 | International branch campuses and transfer arrangements: verify each claim | **Publish** (each claim verified) |
| E12 | Study in Malta: visa process and costs | **Postpone** (low priority for 90 days) |
| E13 | English-language admission options in Europe | **Postpone** |
| E14 | Public vs private institutions in Australia | **Publish** |
| E15 | Australia OSHC explained | **Publish** |
| E16 | Australia scholarships for South Asian students | **Publish** |
| E17 | Study in Germany: costs, public universities and current requirements | **Postpone** |

### 8.6 Cluster F — High-Conversion Problems

| # | Topic | Classification |
|---|-------|----------------|
| F1 | How to explain a study gap | **Publish** |
| F2 | What options may exist after a visa refusal — country-specific, not universal | **Publish** |
| F3 | Education financing options in Bangladesh: verify every bank and product | **Publish** (verify directly) |
| F4 | Student-file banking services in Bangladesh: verify directly | **Publish** (verify directly) |
| F5 | Police clearance certificates for study-abroad applications | **Publish** |
| F6 | Demonstrating home-country ties in U.S. visa preparation | **Publish** |
| F7 | Preparing for airport and border-entry questions | **Publish** |
| F8 | Travel insurance vs health insurance for students | **Publish** |
| F9 | AI tools for international students, including genuine ALO tools | **Publish** |
| F10 | Replace any unsupported "98% visa success rate" article with audited transparent outcome reporting | **Rewrite or Retire** |
| F11 | Common university-application mistakes | **Publish** |
| F12 | How early should you apply for study abroad? | **Publish** |
| F13 | Can you study abroad with lower grades? Realistic options and limitations | **Publish** |
| F14 | Direct entry vs pathway programs | **Publish** |
| F15 | Genuine documented scholarship success story | **Publish** (verified facts + consent) |
| F16 | Genuine documented visa journey case study | **Publish** (only when facts and consent are verified) |
| F17 | When a professional study-abroad consultant may add value | **Publish** |

> **Total topic count:** 16 (A) + 17 (B) + 17 (C) + 16 (D) + 17 (E) + 17 (F) = **100** ✅

---

## 9. 90-Day Week-by-Week Execution Plan (Master Prompt §15)

> **Quality-first production range:** 12–15 commercial/money pages, 12–18 researched support articles, 3–5 strong counsellor profiles, 6–10 genuine student stories, 1 original data report, 1 AI Course Matcher MVP, 1 AI Visa Interview Practice MVP, ongoing technical fixes, local SEO work, authority acquisition.

### Week 1 — Baseline and Full Audit

**Deliverables:**
- Full crawl
- Indexation audit
- Rendering audit
- `/` vs alternate-home-route test
- Canonical audit
- robots audit
- Sitemap audit
- Page inventory
- Schema audit
- Core Web Vitals baseline
- GSC baseline
- GA4 baseline
- CRM organic-lead baseline
- Competitor seed list
- First keyword universe
- Issue backlog with P0/P1/P2/P3 priority labels

**Owner:** SEO Manager + Technical SEO Engineer + Analyst
**KPI:** Issue backlog complete, baseline metrics stored in `seo_gsc_daily` / `seo_ga4_daily` / `seo_lead_attribution`.

### Week 2 — Technical Foundation + CRM Schema

**Deliverables:**
- Fix P0 issues
- Canonical rules
- Redirects
- Sitemap generation
- Crawlable internal links
- Metadata templates
- Schema framework
- Monitoring
- **Inside WEB_CRM:** SEO Growth module, SEO database schema, role permissions, source verification library, content workflow statuses, audit logs

**Owner:** Developer + SEO Manager
**KPI:** P0 issues = 0, SEO Growth module accessible to admins.

### Week 3 — First Commercial Content Release

**Publish or significantly improve:**
1. Study in UK
2. Study in USA
3. Study Abroad Consultant in Dhaka / Bangladesh

**Add:** CTAs, attribution tracking, consultation conversion tracking, source records, reviewer records.

**Owner:** Content Brief Agent → Draft Agent → Fact-Check Agent → SEO QA Agent → Country Reviewer → Publishing Agent
**KPI:** 3 pages published; first organic-attributed leads captured.

### Week 4 — Remaining Destination Foundations

**Research and publish or update:**
1. Study in Canada
2. Study in Australia

**Also:** Optimize Google Business Profile; fix NAP inconsistency; create local review workflow; publish first counsellor profiles.

**Owner:** Local SEO Agent + Content team
**KPI:** GBP completeness ≥ 90%; 3 counsellor profiles live; NAP consistency verified.

### Week 5 — UK Cluster

**Build (data-prioritized):** UK Student visa; UK scholarships; affordable UK universities; English-language options; Graduate visa; Pre-CAS preparation.

**Create internal linking.** Add expert reviewer.

**Owner:** SEO Editor + Country Reviewer (UK)
**KPI:** 6 UK pages published; internal linking populated.

### Week 6 — USA Cluster + Interview MVP

**Build:** F1 Student visa guide; F1 interview preparation; scholarship guide; application guide.

**Launch Visa Interview Practice MVP** with: educational disclaimer, no guaranteed outcome language, session capture, consent-aware lead capture, CRM event tracking.

**Owner:** Developer + Content team + AI Agent Engineer
**KPI:** 4 USA pages + tool MVP live; CRM events firing.

### Week 7 — Canada Cluster + Policy Watcher

**Build:** Study permit guide; PGWP guide; PGWP field-of-study resource (where justified); scholarships resource.

**Launch policy-watch workflow.**

**Owner:** SEO Editor + Country Reviewer (Canada) + Freshness Watchdog
**KPI:** 4 Canada pages live; policy-watch job running daily.

### Week 8 — Australia Cluster + Course Matcher MVP

**Build:** Australia Student visa guide; Genuine Student guide; scholarships resource.

**Launch Course Matcher MVP** using: academic profile, desired level, subject, destination, budget, English score, intake preference. Never promise admission.

**Owner:** Developer + Content team + AI Agent Engineer
**KPI:** 3 Australia pages + Course Matcher MVP live.

### Week 9 — Trust Content

**Publish:** counsellor profiles; verified student stories; application timelines; "how we work" process page; transparent editorial and review policy.

**Also publish:** Study Gap guide (high-conversion); Education Financing guide; Financial Evidence guide; SOP Review service.

**Owner:** Content team + Counsellor Authors + Compliance Editor
**KPI:** 3–5 counsellor profiles, 6–10 verified student stories, editorial policy live.

### Week 10 — Authority Sprint

**Start:** university partner representative-page outreach; genuine local partnerships; test-center relationships; original data report; targeted digital PR; alumni-story outreach.

**Owner:** Authority Agent + Outreach Owner
**KPI:** N outreach requests sent; first university rep-page request submitted; original data report outline approved.

### Week 11 — Search Data Optimization

**Use early GSC signals.** Find pages gaining impressions, queries ranking 5–20, low-CTR opportunities, content gaps, cannibalization. Prioritize updates.

**Owner:** Performance Agent + SEO Manager
**KPI:** Opportunity score recalculation run; top-20 update queue created.

### Week 12 — CRO and Internal Linking

**Test:** CTA copy, CTA placement, eligibility-check CTA, WhatsApp CTA, consultation form length, trust evidence, student story placement.

**Audit internal links.**

**Owner:** CRO Specialist + Internal Link Agent
**KPI:** A/B test plan executed on top-5 pages; orphan-page count reduced to 0.

### Week 13 — Final Review and Next Quarter

**Produce:**
- Before/after technical report
- Indexation changes
- GSC performance changes
- Organic leads
- Qualified leads
- Consultations
- Applications
- Offer activity
- Visa outcomes (where time allows)
- Enrolment outcomes (where time allows)
- Page-level pipeline contribution
- Next 90-day prioritized backlog

**Owner:** SEO Manager + Analyst + Executive
**KPI:** 90-day report delivered; next 90-day backlog approved.

---

## 10. Content Quality Standards (Master Prompt §16, §17)

### 10.1 Required Value Types

Every major page must contain real value unavailable from generic AI summaries:

- Official source interpretation
- Bangladeshi student context
- Expert counsellor perspective
- Real student journey
- Genuine university relationship insight
- Local financial-process explanation
- Original CRM trend data
- Step-by-step decision framework
- Current deadlines
- Country comparison methodology
- Documented case experience

> Do NOT create content merely by rewriting competitors.

### 10.2 Content Evidence Model (Master Prompt §16)

For every high-risk claim, store:

```
CLAIM
SOURCE
JURISDICTION
RETRIEVED_AT
EFFECTIVE_DATE
EXPIRY_OR_REVIEW_DATE
REVIEWER
CONFIDENCE
```

This is implemented in the `seo_claims` table.

### 10.3 Author and Reviewer System (Master Prompt §17)

Counsellor profile pages may include: name, real job title, destinations handled, experience, qualifications (where verified), official training/accreditation (where verified), languages, office, areas of expertise, articles authored, articles reviewed.

> Never invent credentials.

For sensitive visa-information pages display:

```
Written by: [real author]
Reviewed by: [qualified internal reviewer]
Last reviewed: [date]
Sources checked: [official source list]
```

---

## 11. Internal Linking System (Master Prompt §18)

### 11.1 Hub-and-Spoke Architecture

Example:

```
/study-in-uk
   ↕
   ├── /uk/student-visa
   ├── /uk/scholarships
   ├── /uk/affordable-universities
   ├── /uk/english-language-options
   └── /uk/graduate-visa
```

### 11.2 Rules

1. Parent hub links to relevant child pages.
2. Child pages link contextually to parent hub.
3. Child pages may cross-link when genuinely useful.
4. Visa-related articles link to Visa Interview Practice where relevant.
5. University/course articles link to Course Matcher where relevant.
6. Scholarship articles link to eligibility or counselling flow.
7. Do NOT use the exact same anchor repeatedly in an unnatural way.
8. No important commercial page should be orphaned.
9. Track every internal link in the CRM (`seo_internal_links`).

### 11.3 Internal-Link Agent Logic

For every new or updated page:

1. Extract entities.
2. Identify related hubs.
3. Identify related spokes.
4. Find relevant contextual sentences.
5. Recommend source page.
6. Recommend target URL.
7. Recommend natural anchor.
8. Assign confidence.
9. Require review for low-confidence recommendations.

---

## 12. Local SEO System (Master Prompt §19)

### 12.1 Per-Office Profile

For each genuine physical office maintain: exact business name, address, phone, office hours, holiday hours, website, appointment route, genuine photos, services, appropriate category, map location.

Ensure consistency between: website, Google Business Profile, major trusted citations, social profiles.

> Never create fake offices. Never create fake location pages. Create a location page ONLY when the business genuinely serves or operates from that location and can provide useful unique local information.

### 12.2 Review Request Workflow

**Trigger candidate:** CRM student pipeline enters `VISA_APPROVED` or `ENROLLED`.

Then:
1. Check consent eligibility.
2. Check whether a review request was already sent.
3. Send a personalized neutral request.
4. Never ask only happy students while suppressing others.
5. Never pay for positive reviews.
6. Store request date.
7. Allow one appropriate reminder.
8. Record response where available.

> **Hard rule (Master Prompt §50):** Never offer payment for positive reviews; never ask staff to create fake reviews; never gate requests only to students predicted to leave positive reviews.

---

## 13. Authority & Backlink Strategy (Master Prompt §20)

### 13.1 Priority 1 — University Relationships

For genuine partner universities, ask whether ALO can be listed on: authorized representative pages, agent pages, country representative pages, partner directories.

Track per relationship: institution, relationship owner, contact, page, request date, follow-up date, status, live link, target page.

### 13.2 Priority 2 — Original Data

**Create:** *ALO Bangladesh Study Abroad Intent Report 2026*.

Privacy-safe aggregated findings: destination interest, study level interest, subject interest, scholarship interest, average planning lead time, major student questions, intake interest.

Requirements: anonymized, sufficient sample, methodology, sample period, limitations, no re-identification, management approval.

### 13.3 Priority 3 — Digital PR

Pitch genuine findings to: education media, Bangladesh news publications, university communications teams, EdTech publications.

> Never manufacture survey statistics.

### 13.4 Priority 4 — Relevant Partnerships

Potential relationship categories: language-test preparation centers, student organizations, university career centers, education platforms, legitimate international education associations.

### 13.5 Priority 5 — Alumni Stories

Invite former students to share genuine experiences. Do NOT require exact-match anchor text. Do NOT manipulate testimonials.

### 13.6 Backlink Checklist (Master Prompt §56)

Before outreach ask:
- Is the site genuinely relevant?
- Is the relationship real?
- Would a user benefit from the link?
- Is the content worthy of citation?
- Is the placement natural?
- Is the claim truthful?
- Is the campaign compliant?

**Avoid:** spam directories, paid link networks, mass guest-post farms, fake scholarships created solely for links, automated comment links, exact-match anchor manipulation.

---

## 14. AI Search Visibility Strategy (Master Prompt §21)

Treat AI Search optimization as an extension of excellent SEO, NOT a collection of hacks.

Focus on:
1. Indexable pages
2. Crawlable public content
3. Unique first-hand experience
4. Expert interpretation
5. Original data
6. Clear technical structure
7. Useful headings
8. Strong images and videos
9. Local business accuracy
10. Factual source transparency
11. Content freshness
12. Internal entity consistency

**Do NOT:**
- Create hundreds of near-duplicate pages to cover every query variation.
- Claim that `llms.txt` is required for Google Search visibility.
- "Chunk" content mechanically only for AI systems.

> Write for human decision-making.

Track dedicated generative-AI visibility in Search Console WHERE the reporting feature is available for the property.

---

## 15. WEB_CRM SEO Module (Master Prompt §22)

### 15.1 Menu Structure

```
WEB_CRM
│
├── Students
├── Leads
├── Applications
├── Universities
├── Courses
├── Counsellors
│
└── SEO Growth
    ├── Executive Dashboard
    ├── Technical Health
    ├── Keyword Intelligence
    ├── Search Opportunities
    ├── Competitor Research
    ├── Content Planner
    ├── Source Library
    ├── Claims Registry
    ├── AI Research
    ├── Content Briefs
    ├── Drafts
    ├── Fact Checking
    ├── Expert Review
    ├── SEO QA
    ├── Publishing Queue
    ├── Internal Links
    ├── Content Freshness
    ├── Backlinks
    ├── Outreach
    ├── Local SEO
    ├── Search Performance
    ├── AI Search Visibility
    ├── Conversion Attribution
    ├── Experiments
    ├── Alerts
    └── Agent Operations
```

### 15.2 Database Tables

All 21 tables created in `database/seo_growth_addon.sql`:

`seo_projects`, `seo_pages`, `seo_keywords`, `seo_keyword_page_map`, `seo_serp_snapshots`, `seo_competitors`, `seo_sources`, `seo_claims`, `seo_content_briefs`, `seo_content_versions`, `seo_content_reviews`, `seo_internal_links`, `seo_backlinks`, `seo_outreach`, `seo_gsc_daily`, `seo_ga4_daily`, `seo_ai_search_visibility`, `seo_lead_attribution`, `seo_agent_runs`, `seo_prompt_versions`, `seo_alerts`.

### 15.3 Roles & Permissions (Master Prompt §61)

| Role | Permissions |
|------|-------------|
| SEO_ADMIN | Full control; can approve prompt versions and memory changes |
| SEO_MANAGER | Manage backlog, assign work, override AI suggestions with audit |
| SEO_EDITOR | Edit drafts, run SEO QA |
| COUNTRY_REVIEWER | Approve country-specific visa-policy pages |
| COUNSELLOR_AUTHOR | Author counsellor-profile + student-story content |
| DEVELOPER | Resolve technical SEO tasks |
| ANALYST | Read all dashboards; export data |
| PUBLISHER | Release approved versions only |
| VIEW_ONLY | Read dashboards |

**Example flow:** AI drafts → SEO Editor edits → Country Reviewer approves visa-policy pages → Publisher releases approved versions → Developer resolves technical tasks. All approvals logged.

---

## 16. 14 AI Agent Specifications (Master Prompt §24–§37)

> Do NOT build one giant uncontrolled agent. Build specialized agents coordinated by an Orchestrator.

### 16.1 Agent 1 — SEO Orchestrator

| Field | Value |
|-------|-------|
| **Purpose** | Receive strategic objective; select agent sequence; manage dependencies; enforce approval gates; prevent autonomous high-risk publishing. |
| **Inputs** | task, page, country, priority, current state, data dependencies. |
| **Outputs** | execution plan, assigned agents, status, blockers, required human approvals. |
| **Failure conditions** | Missing inputs; circular agent dependency; missing human approval for volatile immigration page. |
| **Human approval gate** | The Orchestrator must NEVER skip SOURCE VERIFICATION → FACT CHECK → HUMAN REVIEW for volatile immigration pages. |
| **Logging** | Every plan + agent assignment written to `seo_agent_runs` with `agent_type='orchestrator'`. |

### 16.2 Agent 2 — Technical Audit Agent

| Field | Value |
|-------|-------|
| **Purpose** | Identify technical SEO issues from crawl/render/headers/sitemap/robots/GSC/PageSpeed. |
| **Inputs** | Crawl data, rendered HTML, response headers, sitemap, robots.txt, GSC data, PageSpeed data (where available). |
| **Outputs** | Per issue: issue type, affected URLs, evidence, severity, SEO impact, user impact, recommended fix, acceptance test, owner, effort, deadline. |
| **Failure conditions** | No crawl access; rendering test inconclusive. |
| **Human approval gate** | Never recommend expensive migration without evidence. |
| **Logging** | `seo_agent_runs.agent_type='technical_audit'`; issues logged as `seo_alerts` with type `technical_p0`/`p1`/`p2`. |

### 16.3 Agent 3 — Search Opportunity Agent

| Field | Value |
|-------|-------|
| **Purpose** | Identify top opportunities using weighted Opportunity Score (§3.3). |
| **Inputs** | GSC queries/pages, CTR, position, CRM leads/qualified leads/applications/offers/enrolments, business priorities. |
| **Outputs** | Opportunity, current page, recommended action, content gap, priority score, business justification, supporting data. |
| **Failure conditions** | GSC data missing; CRM data missing (downgrade to lead-only model and flag). |
| **Human approval gate** | Never auto-promote a keyword to production — proposal only. |
| **Logging** | `seo_agent_runs.agent_type='search_opportunity'`; results written to `seo_keywords.opportunity_score`. |

**Example decision (Master Prompt §27):**

> Query cluster: Canada PGWP eligibility
> Position: 12–15
> Impressions: growing
> CRM: high-quality Canada leads
> Current page: existing PGWP guide
> Decision: UPDATE EXISTING PAGE
> (Not: create five overlapping PGWP articles.)

### 16.4 Agent 4 — Policy Research Agent

| Field | Value |
|-------|-------|
| **Purpose** | Research volatile information from official sources. |
| **Rules** | (1) Search official sources first; (2) Identify effective dates; (3) Identify transition dates; (4) Compare old and new rules; (5) Never rely on snippets alone; (6) Retrieve actual source; (7) Store claims separately; (8) Assign volatility. |
| **Output JSON schema** | `{ claim, jurisdiction, topic, current_rule_summary, effective_date, transition_date, official_source, retrieved_at, confidence, volatility, human_review_required: true }` |
| **Failure conditions** | Official source unreachable; secondary source only; transition date ambiguous. |
| **Human approval gate** | ALL output requires human review (`human_review_required=true`). |
| **Logging** | `seo_agent_runs.agent_type='policy_research'`; claims written to `seo_claims`. |

### 16.5 Agent 5 — Source Verification Agent

| Field | Value |
|-------|-------|
| **Purpose** | For every source, verify domain correctness, page relevance, jurisdiction, current date, effective date, whether superseded, primary vs secondary, whether claim follows from source. |
| **Outputs** | Flag as `verified` / `outdated` / `superseded` / `unclear` / `secondary_only` / `contradictory` / `high_risk`. |
| **Failure conditions** | URL exists but claim does not follow from source content. |
| **Human approval gate** | High-risk sources require human review. |
| **Logging** | `seo_agent_runs.agent_type='source_verification'`; updates `seo_sources.verification_status`. |

> **Hard rule (Master Prompt §29):** Never approve a claim merely because a URL exists.

### 16.6 Agent 6 — Content Brief Agent

| Field | Value |
|-------|-------|
| **Purpose** | Produce research-backed brief. Does NOT write the article. |
| **Outputs** | Page objective, audience, primary search intent, secondary intents, funnel stage, primary keyword cluster, related subtopics, existing ranking page, SERP pattern, content gap, unique value required, official facts required, sources required, counsellor input required, student story requirement, original data opportunity, image requirement, video requirement, internal links, external official sources, CTA, conversion event, review frequency. |
| **Failure conditions** | SERP research inconclusive; no official source available for required fact. |
| **Human approval gate** | Briefs for visa-policy pages require Country Reviewer sign-off before drafting. |
| **Logging** | `seo_agent_runs.agent_type='content_brief'`; brief written to `seo_content_briefs`. |

### 16.7 Agent 7 — Draft Agent

| Field | Value |
|-------|-------|
| **Purpose** | Produce draft from brief using verified sources + original expert input. |
| **NEVER invent** | Visa success rates, admissions success rates, processing times, tuition, fees, scholarship amounts, deadlines, work rights, English-test waivers, university policies, bank requirements, visa probability, PR probability. |
| **Forbidden unsupported phrases** | guaranteed visa, 100% success, easy PR, guaranteed scholarship, no bank statement required, fastest visa, assured admission. |
| **Required** | Verified source data, original expert input, useful structure, specific Bangladesh context, clear date labels for volatile facts, transparent limitations. |
| **Failure conditions** | Brief missing required source; forbidden phrase detected. |
| **Human approval gate** | All drafts require fact-check + SEO QA + expert review before publication. |
| **Logging** | `seo_agent_runs.agent_type='draft'`; version written to `seo_content_versions` with `forbidden_phrase_scan` status. |

### 16.8 Agent 8 — Fact-Check Agent

| Field | Value |
|-------|-------|
| **Purpose** | Review every factual sentence. |
| **Classification** | VERIFIED / NEEDS_SOURCE / OUTDATED / CONTRADICTORY / MISLEADING / OPINION / EXPERIENCE_CLAIM. |
| **Per-failure output** | Exact sentence, problem, source required, proposed correction. |
| **Blocks publication when** | Visa-rule claim lacks source; fee lacks current source; processing time lacks date; university policy lacks institutional source; success claim lacks audited evidence. |
| **Failure conditions** | Insufficient source library for the claim. |
| **Human approval gate** | Failed fact-check blocks draft progression. |
| **Logging** | `seo_agent_runs.agent_type='fact_check'`; review written to `seo_content_reviews` with `review_type='fact_check'`. |

### 16.9 Agent 9 — SEO QA Agent

| Field | Value |
|-------|-------|
| **Purpose** | 24-point pre-approval checklist. |
| **Checklist** | Search intent satisfied; unique value present; title unique; meta description unique; canonical correct; main heading clear; heading structure useful; official sources present; high-risk claims verified; dates included where needed; internal links included; no cannibalization issue; CTA present; conversion event mapped; schema matches content; images reviewed; alt text reviewed; author identified; reviewer identified; last reviewed date set; next review date set; no unsupported promise; mobile UX reviewed. |
| **Output** | PASS / PASS_WITH_WARNINGS / FAIL. |
| **Failure conditions** | Any FAIL item present. |
| **Human approval gate** | FAIL blocks publication; WARNINGS require SEO Editor acknowledgement. |
| **Logging** | `seo_agent_runs.agent_type='seo_qa'`; review written to `seo_content_reviews` with `review_type='seo_qa'`. |

### 16.10 Agent 10 — Internal Link Agent

| Field | Value |
|-------|-------|
| **Purpose** | Run after draft approval and after publication. |
| **Tasks** | Identify parent hub; identify child pages; identify contextual link opportunities; prevent over-optimization; find orphan pages; find broken links; find redirects still linked internally. |
| **Output** | source URL, target URL, recommended anchor, context, reason, confidence. |
| **Failure conditions** | Page graph unavailable. |
| **Human approval gate** | Low-confidence suggestions require SEO Editor review. |
| **Logging** | `seo_agent_runs.agent_type='internal_link'`; suggestions written to `seo_internal_links` with `status='suggested'`. |

### 16.11 Agent 11 — Publishing Agent

| Field | Value |
|-------|-------|
| **Purpose** | Publish only fully-approved content. |
| **May publish only when** | Content is approved; SEO QA passes; required human reviewer approves; canonical is generated; source records are stored; URL is unique; redirect impact is checked. |
| **After publishing** | (1) Verify HTTP 200; (2) Verify rendered content; (3) Verify canonical; (4) Verify robots directives; (5) Verify title; (6) Verify schema; (7) Verify internal links; (8) Update sitemap; (9) Purge necessary cache; (10) Queue Search Console index-status check; (11) Schedule 7-day review; (12) Schedule 28-day performance review. |
| **Failure conditions** | Any post-publish verification fails. |
| **Human approval gate** | All volatile immigration content requires human approval before publish. |
| **Logging** | `seo_agent_runs.agent_type='publishing'`; page status transitions to `published` in `seo_pages`. |

> **Hard rule (Master Prompt §35):** Do NOT misuse Google's Indexing API for standard content pages.

### 16.12 Agent 12 — Performance Agent

| Field | Value |
|-------|-------|
| **Purpose** | Weekly evaluation of search + business outcomes. |
| **Evaluates** | Impressions change, clicks change, CTR change, position movement, landing-page engagement, lead generation, qualified leads, consultations, applications, offer activity, visa outcomes, enrolments, pipeline value. |
| **Classification** | GROWING / STABLE / DECLINING / CTR_OPPORTUNITY / RANKING_OPPORTUNITY / CONVERSION_PROBLEM / CANNIBALIZATION_RISK / FRESHNESS_RISK. |
| **Output** | Exactly ONE primary next action per page. |
| **Failure conditions** | GSC or GA4 sync missing for the week. |
| **Human approval gate** | Recommendations are advisory; SEO Manager selects execution. |
| **Logging** | `seo_agent_runs.agent_type='performance'`; recommendations written to `seo_alerts`. |

### 16.13 Agent 13 — Freshness Watchdog

| Field | Value |
|-------|-------|
| **Purpose** | Monitor volatile content for source changes. |
| **Cadences (starting operational rules)** | Visa policy: 7 days or event-triggered. Processing times: 24h–7d. Fees: 7d. Scholarship deadline: daily during closing period. University admissions: 14d during active intake. Tuition: 30d. Evergreen: 90–180d. |
| **On source content change** | (1) Compare source hash; (2) Identify affected claims; (3) Identify affected pages; (4) Create review tasks; (5) Do NOT auto-rewrite and publish high-risk policy content without review. |
| **Failure conditions** | Source unreachable; hash comparison inconclusive. |
| **Human approval gate** | Auto-rewrite of high-risk policy content is FORBIDDEN. |
| **Logging** | `seo_agent_runs.agent_type='freshness_watchdog'`; alerts written to `seo_alerts` with type `freshness_urgent` / `freshness_review` / `source_changed` / `policy_changed`. |

### 16.14 Agent 14 — Local SEO Agent

| Field | Value |
|-------|-------|
| **Purpose** | Maintain GBP completeness, NAP consistency, review request workflow. |
| **Outputs** | GBP completeness report, NAP consistency report, review request triggers. |
| **Failure conditions** | GBP API access unavailable. |
| **Human approval gate** | All review requests require consent check + neutral language review. |
| **Logging** | `seo_agent_runs.agent_type='local_seo'`; alerts written to `seo_alerts` with type `review_request_due`. |

> **Hard rules (Master Prompt §50):** Never offer payment for positive reviews; never ask staff to create fake reviews; never gate requests only to predicted-positive students.

### 16.15 Agent 15 — Authority Opportunity Agent

| Field | Value |
|-------|-------|
| **Purpose** | Surface authority opportunities: university rep-page outreach, digital PR pitches, alumni story candidates, relevant partnerships. |
| **Outputs** | Outreach candidates with reason + confidence + suggested pitch. |
| **Failure conditions** | No current partner-university list available. |
| **Human approval gate** | All outreach sent by a human owner. |
| **Logging** | `seo_agent_runs.agent_type='authority'`; suggestions written to `seo_outreach` with `status='planned'`. |

> (The Master Prompt §24 lists 15 specialized agents coordinated by the Orchestrator. This spec covers all 15.)

---

## 17. Content Workflow States (Master Prompt §38)

```
IDEA
  ↓
RESEARCH_PENDING
  ↓
SOURCES_COLLECTED
  ↓
FACTS_VERIFIED
  ↓
BRIEF_READY
  ↓
AI_DRAFTED
  ↓
FACT_CHECK
  ↓
SEO_QA
  ↓
EXPERT_REVIEW
  ↓
APPROVED
  ↓
SCHEDULED
  ↓
PUBLISHED
  ↓
INDEX_STATUS_PENDING
  ↓
MONITORING
  ↓
UPDATE_REQUIRED  |  ARCHIVED
```

Every transition must record: actor, timestamp, notes, source version (where relevant).

These states are stored in `seo_pages.status` as an ENUM.

---

## 18. Analytics & Attribution

### 18.1 SEO-to-Revenue Funnel (Master Prompt §40)

```
Organic Search Visit
  ↓
Lead
  ↓
Qualified Lead
  ↓
Consultation
  ↓
Application Started
  ↓
Application Submitted
  ↓
Offer Received
  ↓
Deposit Paid
  ↓
Visa Outcome
  ↓
Enrolment
```

**Executive question:** Which SEO pages and topic clusters create valuable student outcomes? (Not: which pages receive the most traffic?)

### 18.2 GSC + GA4 Pipeline (Master Prompt §41)

**Mode A — MVP:** Search Console API + GA4 reports or API/export + WEB_CRM database.

Daily jobs: sync Search Console, sync Analytics, refresh landing-page metrics, refresh opportunity scores, refresh attribution aggregates.

**Mode B — Scalable Analytics:** Search Console bulk export + GA4 BigQuery export + warehouse transformations + CRM export or secure warehouse sync + BI reporting.

**Document differences between:** Search Console clicks vs GA4 sessions; canonical URL reporting; timezone differences; attribution differences. Never force incompatible metrics to match artificially.

### 18.3 Recommended Website + CRM Events (Master Prompt §39)

**Website:** `consultation_cta_click`, `whatsapp_cta_click`, `generate_lead`, `course_match_started`, `course_match_completed`, `eligibility_check_started`, `eligibility_check_completed`, `visa_mock_started`, `visa_mock_completed`, `consultation_booked`.

**CRM:** `qualify_lead`, `disqualify_lead`, `working_lead`, `application_started`, `application_submitted`, `offer_received`, `deposit_paid`, `visa_approved`, `enrolled`, `close_convert_lead`, `close_unconvert_lead`.

> Map recommended GA4 lead events correctly. Use custom events for business-specific milestones. Never place raw PII into analytics IDs. Follow consent, privacy, and applicable data-protection requirements.

### 18.4 Executive Dashboard (Master Prompt §42)

Shows: Organic Clicks, Organic Sessions, Organic Leads, Qualified Leads, Consultations, Applications Started, Applications Submitted, Offers, Deposits, Visa Approvals, Enrolments, Organic Pipeline Value, Revenue per Landing Page (where available), Lead-to-Application Rate, Application-to-Offer Rate, Topic-Cluster Performance.

Period comparisons: last 7 days, last 28 days, previous 28 days, 90-day trend.

### 18.5 Sub-Dashboards

- **Search Opportunity Dashboard (§43):** Page, Topic Cluster, Clicks, Impressions, CTR, Position, Leads, Qualified Leads, Applications, Offers, Enrolments, Pipeline Value, Freshness Risk, Opportunity Score, Recommended Action.
- **Content Freshness Dashboard (§44):** Page, Country, Topic, Last Source Check, Last Human Review, Next Review, Volatility, Changed Source Detected, Status (GREEN / REVIEW SOON / URGENT REVIEW / BLOCKED), Owner.
- **Technical Health Dashboard (§45):** indexed critical pages, indexation exclusions, 404s, soft 404s, 5xx, canonical conflicts, noindex mistakes, sitemap errors, orphan pages, broken links, redirect chains, CWV pass rate, schema errors.
- **AI Agent Operations Dashboard (§46):** runs by agent, successful runs, failures, average processing cost, unsupported claims detected, policy changes detected, drafts awaiting review, QA failure rate, publication turnaround, prompt version performance.
- **Local SEO Dashboard (§47):** GBP completeness, NAP consistency, review count, review velocity, response rate, rating trend, profile actions (where available), local landing-page leads, consultation bookings.
- **Authority Dashboard (§48):** partner link opportunities, outreach sent, replies, links earned, links lost, digital PR mentions, university representative listings, student story participation, original research coverage.
- **AI Search Visibility Dashboard (§49):** generative-AI impressions (where available), pages appearing, country, device, date trend. Do NOT fabricate clicks or dimensions the report does not expose.

---

## 19. High-Risk Claim Policy (Master Prompt §54)

### 19.1 Claims Requiring Evidence + Human Approval

- "98% visa success rate"
- "highest success rate"
- "best consultant"
- "number one agency"
- "guaranteed visa"
- "visa in five days"
- "no bank statement required"
- "easy PR"
- "guaranteed scholarship"
- "all universities accept"
- "IELTS not required"

### 19.2 Quantified Business Claim Requirements

For any quantified business claim, require:
- dataset
- date range
- denominator
- numerator
- exclusions
- calculation method
- approval

**Example:** Do NOT say "98% visa success rate" unless an auditable calculation exists.

### 19.3 Implementation

- All forbidden phrases stored in `exam_settings.seo_forbidden_phrases` (JSON array).
- Draft Agent runs `forbidden_phrase_scan` and stores result in `seo_content_versions.forbidden_phrase_scan`.
- Any high-risk claim triggers `seo_claims.human_review_required=1` and blocks publication until reviewer approves.
- `seo_auto_publish=0` and `seo_human_review_required=1` in `exam_settings` enforce the gate globally.

---

## 20. KPI Framework (Master Prompt §62, Deliverable 15)

### 20.1 Leading Indicators

- Indexability (indexed critical pages count)
- Impressions (28-day sum vs previous 28-day)
- Pages gaining queries
- Positions (pages moving from 5–20 into top 10)
- CTR
- Tool usage (Course Matcher starts; Visa Interview Practice starts)

### 20.2 Mid-Funnel

- Leads (organic-attributed)
- Qualified leads
- Consultation bookings
- Application starts

### 20.3 Lagging

- Applications submitted
- Offers received
- Deposits paid
- Visa outcomes
- Enrolments
- Revenue

---

## 21. Risk Register (Master Prompt §62, Deliverable 18)

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|------|-----------|--------|------------|-------|
| 1 | Policy freshness — immigration rule changes not detected | High | Critical | Freshness Watchdog daily hash comparison on Tier-A sources; `seo_claims.expiry_date` enforcement; alerts escalate to Country Reviewer | SEO Manager |
| 2 | AI hallucination — fabricated visa rule / fee / deadline | Medium | Critical | Draft Agent forbidden-phrase scan; Fact-Check Agent blocks publication; human approval gate on every volatile page | Compliance Editor |
| 3 | Search spam — mass low-value AI pages | Medium | High | `seo_auto_publish=0`; Publisher may release only approved versions; weekly cannibalization audit | SEO Manager |
| 4 | Duplicate content / canonical conflicts | Medium | Medium | Technical Audit Agent weekly; canonical rules enforced at CMS layer | Developer |
| 5 | Cannibalization — multiple ALO pages competing for same query | Medium | High | Keyword-page map `cannibalization_risk` flag; Internal Link Agent detects overlap | SEO Editor |
| 6 | Incorrect immigration content published | Low | Critical | Country Reviewer approval gate for all visa-policy pages; Source Verification Agent blocks unverified claims | Country Reviewer |
| 7 | Tracking loss — GSC/GA4 sync failure | Medium | High | Daily sync job + dead-letter queue; alert on 24h gap | Analyst |
| 8 | Cross-domain attribution — leads attributed to wrong channel | Medium | Medium | First-touch model in `seo_lead_attribution`; UTM standards documented | Analyst |
| 9 | Review policy violation — paid/fake/gated reviews | Low | High | Local SEO Agent consent-check; manual review of every review request; never pay for reviews | Local SEO Agent owner |
| 10 | Data privacy — PII in analytics IDs | Low | Critical | Pseudonymous analytics ID only; privacy review on every new event | Compliance Editor |
| 11 | Overproduction — too many articles, too little quality | Medium | Medium | Quality-first production range (12–15 money pages, 12–18 support articles); weekly capacity check | SEO Manager |
| 12 | Developer capacity — technical backlog exceeds capacity | High | Medium | P0/P1/P2/P3 prioritization; weekly capacity planning | SEO Manager + Developer |

---

## 22. API Contracts (Master Prompt §59)

> Adapt to the existing WEB_CRM stack (PHP routing in `app/routes.php` → controllers → services). Every endpoint specifies: authorization, request, response, validation, idempotency, audit log behavior, error states.

### 22.1 Endpoint List

| # | Method | Path | Purpose |
|---|--------|------|---------|
| 1 | GET | `/api/seo/projects/{id}/dashboard` | Executive dashboard aggregate |
| 2 | GET | `/api/seo/opportunities` | Top keyword opportunities with scores |
| 3 | POST | `/api/seo/research/run` | Trigger a research pipeline (Policy Research + Source Verification) |
| 4 | GET | `/api/seo/sources` | List verified sources |
| 5 | POST | `/api/seo/sources/verify` | Verify a single source URL |
| 6 | POST | `/api/seo/briefs` | Create a content brief |
| 7 | POST | `/api/seo/drafts` | Create a draft version |
| 8 | POST | `/api/seo/fact-check` | Run Fact-Check Agent on a version |
| 9 | POST | `/api/seo/qa` | Run SEO QA Agent on a version |
| 10 | POST | `/api/seo/reviews/{id}/approve` | Approve a review (human gate) |
| 11 | POST | `/api/seo/publications/schedule` | Schedule a publication |
| 12 | POST | `/api/seo/publications/publish` | Publish an approved version (Publisher role only) |
| 13 | GET | `/api/seo/pages/{id}/performance` | Page-level GSC+GA4+CRM performance |
| 14 | POST | `/api/seo/sync/gsc` | Trigger GSC daily sync |
| 15 | POST | `/api/seo/sync/analytics` | Trigger GA4 daily sync |
| 16 | POST | `/api/seo/source-watch/run` | Trigger Freshness Watchdog hash comparison |
| 17 | POST | `/api/seo/internal-links/suggest` | Run Internal Link Agent on a page |
| 18 | POST | `/api/seo/opportunities/recalculate` | Recalculate Opportunity Scores |
| 19 | POST | `/api/seo/webhooks/lead-status-changed` | CRM webhook → trigger review request, attribution update |
| 20 | GET | `/api/seo/agents/runs` | Agent operations dashboard data |

### 22.2 Cross-Cutting Requirements

- **Authorization:** RBAC via `RoleMiddleware` + `PermissionMiddleware`. Roles per §15.3.
- **Validation:** All inputs validated at controller layer; JSON schema for request bodies.
- **Idempotency:** POST endpoints accept `Idempotency-Key` header; `seo_agent_runs.input_hash` prevents duplicate agent runs.
- **Audit log:** Every mutating call writes to `exam_audit_logs` via `AuditService::log()` and to `seo_agent_runs` when an agent is invoked.
- **Error states:** Standardized JSON error envelope `{ "error": { "code", "message", "details" } }` via `App\Core\Response`.

### 22.3 Example Contract: `POST /api/seo/briefs`

**Authorization:** `SEO_MANAGER` or `SEO_EDITOR`.

**Request:**
```json
{
  "page_id": 24,
  "primary_intent": "informational",
  "target_audience": "Bangladeshi students planning Canada PGWP",
  "page_goal": "Explain current PGWP eligibility and field-of-study rules",
  "primary_cta": "Check Program Eligibility",
  "secondary_cta": "Book Consultation",
  "required_topics": ["PGWP eligibility", "field-of-study list 2026 status", "language requirements", "application process"],
  "required_sources": ["canada.ca IRCC PGWP page"],
  "internal_link_targets": ["/study-in-canada", "/canada/study-permit"],
  "unique_value_requirement": "Bangladeshi student perspective + ALO CRM trend data on Canada PGWP questions",
  "reviewer_requirement": "country_reviewer"
}
```

**Response (201):**
```json
{
  "id": 145,
  "page_id": 24,
  "status": "ready",
  "created_by": 7,
  "created_at": "2026-07-12T08:30:00+06:00"
}
```

**Validation:** `page_id` must exist; `reviewer_requirement` must be in allowed enum.

**Idempotency:** `Idempotency-Key` header; duplicate within 24h returns existing brief.

**Audit log:** `seo.brief.created` written via `AuditService::log()`.

**Error states:**
- `400` — invalid request body
- `403` — insufficient role
- `404` — page_id not found
- `409` — page already has an active brief

---

## 23. Scheduled Jobs (Master Prompt §60)

### 23.1 Daily

| Job | Cron | Purpose | Idempotency |
|-----|------|---------|-------------|
| Search Console sync | `0 2 * * *` | Pull yesterday's GSC data into `seo_gsc_daily` | UNIQUE on (project_id, date, page, query, country, device) |
| Analytics sync | `0 3 * * *` | Pull yesterday's GA4 data into `seo_ga4_daily` | UNIQUE on (project_id, date, landing_page, source, medium, campaign) |
| Source-change watcher (volatile) | `0 5 * * *` | Hash-compare Tier-A sources flagged as volatile | Skips unchanged hashes; creates alert on change |
| Broken-publication checks | `0 6 * * *` | HTTP-check every published URL; alert on non-200 | Logs to `seo_alerts` with type `technical_p1` |
| Stale-review detection | `0 7 * * *` | Find drafts in `fact_check`/`seo_qa`/`expert_review` > 5 days | Alert assigned reviewer |

### 23.2 Weekly

| Job | Cron | Purpose |
|-----|------|---------|
| Opportunity scoring | `0 1 * * 1` | Recalculate all `seo_keywords.opportunity_score` |
| Ranking movement review | `0 2 * * 1` | Performance Agent run per page |
| CTR opportunity review | `0 3 * * 1` | Identify pages with impressions but low CTR |
| Internal link review | `0 4 * * 1` | Internal Link Agent on entire published corpus |
| Content decay review | `0 5 * * 1` | Identify pages with declining impressions |
| Backlink status check | `0 6 * * 1` | HTTP-check every `seo_backlinks.source_url` |

### 23.3 Monthly

| Job | Cron | Purpose |
|-----|------|---------|
| Full technical crawl | `0 0 1 * *` | Re-run Technical Audit Agent |
| Competitor gap refresh | `0 1 1 * *` | Refresh competitor SERP sampling |
| Local SEO audit | `0 2 1 * *` | GBP completeness + NAP consistency |
| Content inventory review | `0 3 1 * *` | Audit entire `seo_pages` corpus |
| KPI review | `0 4 1 * *` | Generate executive dashboard export |
| 90-day rolling forecast | `0 5 1 * *` | Forecast next quarter using current trajectory |

### 23.4 Operational Requirements

- Use queue retries (max 3) with exponential backoff.
- Dead-letter handling: failed jobs land in `seo_alerts` with type `agent_failure`.
- Idempotency: every job checks a unique key before insert.
- All job runs logged in `seo_agent_runs`.

---

## Appendix A — Definition of Done (Master Prompt §62, Deliverable 19)

- **Technical fix:** Issue resolved; acceptance test passes; alert closed; audit log entry present.
- **Content page:** Brief created; sources verified; draft fact-checked; SEO QA passed; expert review complete (where required); published; sitemap updated; 7-day + 28-day reviews scheduled.
- **Policy update:** Freshness Watchdog detected change; affected claims flagged; Country Reviewer re-reviewed; page updated; new effective_date recorded; alert closed.
- **New AI tool:** MVP launched; educational disclaimer present; no guaranteed outcome language; CRM event tracking firing; consent-aware lead capture; audit log working.
- **CRM feature:** Code merged; permissions configured; audit logs firing; documentation updated; release notes published.
- **Analytics integration:** Sync job running daily; data validated against source; dashboard rendering; alert on 24h data gap.
- **Backlink campaign:** Outreach logged in `seo_outreach`; live link verified in `seo_backlinks`; relationship type recorded; no spam directory / paid link / mass guest-post farm used.

---

## Appendix B — First 20 SEO Execution Tickets (Master Prompt §62, Deliverable 17, abbreviated)

| # | Title | Priority | Owner Type |
|---|-------|----------|-----------|
| 1 | Run full crawl + indexation audit | P0 | Technical SEO Engineer |
| 2 | Fix `/` vs `/Home` duplicate homepage | P0 | Developer |
| 3 | Implement canonical rules across templates | P0 | Developer |
| 4 | Generate XML sitemap with accurate lastmod | P0 | Developer |
| 5 | Audit robots.txt for blocked important resources | P0 | Technical SEO Engineer |
| 6 | Audit JS rendering on destination + course templates | P0 | Technical SEO Engineer + Developer |
| 7 | Establish GSC + GA4 baseline | P0 | Analyst |
| 8 | Build WEB_CRM SEO Growth module menu | P1 | Developer |
| 9 | Create 30 money-page inventory in `seo_pages` | P1 | SEO Editor |
| 10 | Author UK destination page (Page 1) | P1 | Content team + Country Reviewer (UK) |
| 11 | Author USA destination page (Page 2) | P1 | Content team + Country Reviewer (USA) |
| 12 | Author Study Abroad Consultant Dhaka (Page 20) | P1 | Content team + Local SEO Agent |
| 13 | Optimize Google Business Profile | P1 | Local SEO Agent |
| 14 | Fix NAP inconsistency across citations | P1 | Local SEO Agent |
| 15 | Publish first 3 counsellor profiles | P1 | Counsellor Authors |
| 16 | Launch Visa Interview Practice MVP | P1 | Developer + AI Agent Engineer |
| 17 | Launch Course Matcher MVP | P1 | Developer + AI Agent Engineer |
| 18 | Build Source Verification Agent workflow | P1 | AI Agent Engineer |
| 19 | Configure Freshness Watchdog daily job | P1 | AI Agent Engineer + DevOps |
| 20 | Build Executive Dashboard | P1 | Analyst + Developer |

> Each ticket must contain: TITLE, PROBLEM, USER STORY, SCOPE, ACCEPTANCE CRITERIA, DEPENDENCIES, PRIORITY, OWNER TYPE, TEST PLAN. (Stored as CRM tickets.)

---

## Appendix C — Settings Reference

All SEO Growth settings live in `exam_settings`:

| Setting | Default | Purpose |
|---------|---------|---------|
| `seo_growth_enabled` | `1` | Master switch for the SEO Growth module |
| `seo_auto_publish` | `0` | CRITICAL: no AI-drafted content auto-publishes |
| `seo_human_review_required` | `1` | CRITICAL: volatile immigration pages require human review |
| `seo_high_risk_claim_policy` | `1` | High-risk claims require evidence + approval |
| `seo_default_review_cadence_visa_policy_days` | `7` | Freshness cadence |
| `seo_default_review_cadence_processing_times_days` | `7` | Freshness cadence |
| `seo_default_review_cadence_fees_days` | `7` | Freshness cadence |
| `seo_default_review_cadence_tuition_days` | `30` | Freshness cadence |
| `seo_default_review_cadence_evergreen_days` | `180` | Freshness cadence |
| `seo_opportunity_score_weights` | JSON | Weighted score model percentages |
| `seo_forbidden_phrases` | JSON array | Phrases forbidden in all content |
| `seo_review_request_consent_required` | `1` | Review requests require explicit consent |
| `seo_index_api_restricted` | `1` | Indexing API NOT used for ordinary pages |

---

## Document Control

| Field | Value |
|-------|-------|
| Document version | 1.0 |
| Created | 2026-07-09 (Asia/Dhaka) |
| Source framework | ALO Education Elite 90-Day SEO Growth System Master Prompt (2,385 lines) |
| Schema companion | `cpanel-production/database/seo_growth_addon.sql` |
| Service companion | `cpanel-production/app/Services/SeoGrowthService.php` |
| Review cadence | Quarterly + event-triggered on policy change |
| Owner | SEO Growth Director + CRM Product Architect |

> **End of 90-Day SEO Growth Marketing Plan.**
