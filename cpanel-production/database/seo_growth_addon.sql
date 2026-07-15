-- =====================================================================
-- ALO EDUCATION — SEO GROWTH SYSTEM DATABASE ADDON
-- ---------------------------------------------------------------------
-- Source: ALO Education Elite 90-Day SEO Growth System Master Prompt
--         Section 23 (Database Design) + Section 24 (AI Agent Architecture)
-- Adapter: Task ID SEO — ALO English Test Platform (WEB_CRM conventions)
--
-- This file creates the full SEO Growth schema as a non-destructive addon
-- to the existing exam_* platform tables. Every table uses the `seo_`
-- prefix to namespace the module cleanly from the exam/certificate
-- subsystems.
--
-- Design rules followed:
--   * InnoDB + utf8mb4_unicode_ci on every table.
--   * BIGINT UNSIGNED AUTO_INCREMENT primary keys.
--   * Logical foreign keys with ON DELETE CASCADE / SET NULL as appropriate.
--   * Indexes on every column used in WHERE / JOIN / ORDER BY.
--   * created_at / updated_at on every mutable table.
--   * JSON columns only where the master prompt explicitly requires
--     variable-shape data (required_topics_json, stage_history, etc).
--   * ENUMs for low-cardinality state columns (status, intent, severity).
--
-- CRITICAL COMPLIANCE NOTES (from Master Prompt §1, §2, §54, §58):
--   * No fabricated search volume, CPC, DA, traffic estimates.
--   * All high-risk claims require source_id + reviewer_id + status.
--   * No auto-publishing of high-risk immigration content
--     (seo_auto_publish=0, seo_human_review_required=1 in exam_settings).
--   * Every volatile fact carries effective_date / expiry_date / confidence.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. seo_projects  — one row per SEO program (ALO Education = primary)
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_projects (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name             VARCHAR(160) NOT NULL,
    domain           VARCHAR(255) NOT NULL,
    primary_country  VARCHAR(64)  NOT NULL DEFAULT 'Bangladesh',
    primary_language VARCHAR(8)   NOT NULL DEFAULT 'en',
    timezone         VARCHAR(64)  NOT NULL DEFAULT 'Asia/Dhaka',
    status           ENUM('planning','active','paused','completed','archived') NOT NULL DEFAULT 'planning',
    start_date       DATE NULL,
    end_date         DATE NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_project_domain (domain),
    KEY idx_seo_proj_status (status),
    KEY idx_seo_proj_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Top-level SEO program (one row per managed site / brand).';

-- =====================================================================
-- 2. seo_pages  — the page inventory (30 money-page seed + future)
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_pages (
    id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    project_id            BIGINT UNSIGNED NOT NULL,
    url                   VARCHAR(512) NOT NULL,
    normalized_url        VARCHAR(512) NOT NULL,
    slug                  VARCHAR(255) NOT NULL,
    page_type             ENUM('destination','visa','scholarship','university','course','service','tool','guide','counsellor','success_story','location','landing','hub','spoke','other') NOT NULL DEFAULT 'other',
    country               VARCHAR(64)  NULL,
    study_level           ENUM('foundation','undergraduate','postgraduate','research','pathway','all','unsure') NOT NULL DEFAULT 'all',
    topic_cluster         VARCHAR(96)  NULL,
    primary_keyword_id    BIGINT UNSIGNED NULL,
    search_intent         ENUM('informational','commercial_investigation','transactional','navigational','local','comparison') NOT NULL DEFAULT 'informational',
    funnel_stage          ENUM('awareness','consideration','decision','retention','support') NOT NULL DEFAULT 'awareness',
    status                ENUM('idea','research_pending','sources_collected','facts_verified','brief_ready','ai_drafted','fact_check','seo_qa','expert_review','approved','scheduled','published','index_status_pending','monitoring','update_required','archived') NOT NULL DEFAULT 'idea',
    owner_id              BIGINT UNSIGNED NULL,
    author_id             BIGINT UNSIGNED NULL,
    reviewer_id           BIGINT UNSIGNED NULL,
    canonical_url         VARCHAR(512) NULL,
    indexation_directive  ENUM('index','noindex','index_follow','noindex_follow','index_nofollow') NOT NULL DEFAULT 'index_follow',
    publication_date      DATETIME NULL,
    last_updated_at       DATETIME NULL,
    last_verified_at      DATETIME NULL,
    next_review_at        DATE NULL,
    commercial_score      TINYINT UNSIGNED NULL DEFAULT 0,
    content_quality_score TINYINT UNSIGNED NULL DEFAULT 0,
    technical_score       TINYINT UNSIGNED NULL DEFAULT 0,
    freshness_score       TINYINT UNSIGNED NULL DEFAULT 0,
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_page_url (project_id, normalized_url),
    KEY idx_seo_page_project (project_id),
    KEY idx_seo_page_status (status),
    KEY idx_seo_page_type (page_type),
    KEY idx_seo_page_country (country),
    KEY idx_seo_page_cluster (topic_cluster),
    KEY idx_seo_page_intent (search_intent),
    KEY idx_seo_page_funnel (funnel_stage),
    KEY idx_seo_page_next_review (next_review_at),
    KEY idx_seo_page_primary_kw (primary_keyword_id),
    CONSTRAINT fk_seo_page_project FOREIGN KEY (project_id)
        REFERENCES seo_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Page inventory + content workflow status (Master Prompt §38).';

-- =====================================================================
-- 3. seo_keywords  — keyword universe + scoring
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_keywords (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    project_id           BIGINT UNSIGNED NOT NULL,
    keyword              VARCHAR(255) NOT NULL,
    country_market       VARCHAR(64)  NULL,
    language             VARCHAR(8)   NOT NULL DEFAULT 'en',
    intent               ENUM('informational','commercial_investigation','transactional','navigational','local','comparison') NOT NULL DEFAULT 'informational',
    funnel_stage         ENUM('awareness','consideration','decision','retention','support') NOT NULL DEFAULT 'awareness',
    destination          VARCHAR(64)  NULL,
    search_volume        INT UNSIGNED NULL COMMENT 'NULL = DATA NOT AVAILABLE — REQUIRES TOOL OR ACCOUNT ACCESS',
    search_volume_source VARCHAR(160) NULL,
    CPC                  DECIMAL(10,2) NULL COMMENT 'NULL = DATA NOT AVAILABLE',
    CPC_source           VARCHAR(160) NULL,
    competition_metric   DECIMAL(6,2) NULL,
    competition_provider VARCHAR(64)  NULL,
    current_position     DECIMAL(6,2) NULL,
    current_url          VARCHAR(512) NULL,
    opportunity_score    DECIMAL(5,2) UNSIGNED NOT NULL DEFAULT 0 COMMENT '0-100 weighted (Master Prompt §7)',
    recommended_action   ENUM('CREATE','UPDATE','MERGE','REDIRECT','CONSOLIDATE','RETIRE','NOINDEX','WAIT','TEST_TITLE','IMPROVE_CTR','ADD_INTERNAL_LINKS') NOT NULL DEFAULT 'CREATE',
    last_scored_at       DATETIME NULL,
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_kw (project_id, keyword, country_market),
    KEY idx_seo_kw_project (project_id),
    KEY idx_seo_kw_destination (destination),
    KEY idx_seo_kw_intent (intent),
    KEY idx_seo_kw_funnel (funnel_stage),
    KEY idx_seo_kw_opportunity (opportunity_score),
    KEY idx_seo_kw_action (recommended_action),
    KEY idx_seo_kw_position (current_position),
    CONSTRAINT fk_seo_kw_project FOREIGN KEY (project_id)
        REFERENCES seo_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Keyword universe with weighted Opportunity Score (Master Prompt §6, §7).';

-- =====================================================================
-- 4. seo_keyword_page_map  — many-to-many keywords ↔ pages
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_keyword_page_map (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    keyword_id           BIGINT UNSIGNED NOT NULL,
    page_id              BIGINT UNSIGNED NOT NULL,
    relationship_type    ENUM('primary','secondary','tertiary','contextual','cannibal') NOT NULL DEFAULT 'secondary',
    confidence           DECIMAL(4,3) UNSIGNED NOT NULL DEFAULT 0.500,
    cannibalization_risk ENUM('none','low','medium','high') NOT NULL DEFAULT 'none',
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_kw_page (keyword_id, page_id),
    KEY idx_seo_kpm_page (page_id),
    KEY idx_seo_kpm_cannibal (cannibalization_risk),
    CONSTRAINT fk_seo_kpm_kw   FOREIGN KEY (keyword_id) REFERENCES seo_keywords(id) ON DELETE CASCADE,
    CONSTRAINT fk_seo_kpm_page FOREIGN KEY (page_id)    REFERENCES seo_pages(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Keyword-to-page mapping with cannibalization flag.';

-- =====================================================================
-- 5. seo_serp_snapshots  — point-in-time SERP captures
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_serp_snapshots (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    keyword_id    BIGINT UNSIGNED NOT NULL,
    searched_at   DATETIME NOT NULL,
    country       VARCHAR(64)  NULL,
    locale        VARCHAR(16)  NULL,
    device        ENUM('desktop','mobile','tablet') NOT NULL DEFAULT 'desktop',
    rank          SMALLINT UNSIGNED NOT NULL,
    result_url    VARCHAR(512) NULL,
    result_domain VARCHAR(255) NULL,
    result_title  VARCHAR(512) NULL,
    result_type   ENUM('organic','featured_snippet','people_also_ask','video','image','local_pack','ai_overview','news','shopping','other') NOT NULL DEFAULT 'organic',
    notes         TEXT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seo_serp_kw (keyword_id),
    KEY idx_seo_serp_date (searched_at),
    KEY idx_seo_serp_country (country),
    KEY idx_seo_serp_type (result_type),
    KEY idx_seo_serp_rank (rank),
    CONSTRAINT fk_seo_serp_kw FOREIGN KEY (keyword_id) REFERENCES seo_keywords(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='SERP snapshot per keyword — never auto-scrape without ToS check.';

-- =====================================================================
-- 6. seo_competitors  — competitor registry
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_competitors (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    project_id      BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(160) NOT NULL,
    domain          VARCHAR(255) NOT NULL,
    competitor_type ENUM('agency','publisher','university_platform','lead_aggregator','tool','government_portal','other') NOT NULL DEFAULT 'agency',
    country         VARCHAR(64)  NULL,
    notes           TEXT NULL,
    last_audited_at DATETIME NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_comp (project_id, domain),
    KEY idx_seo_comp_type (competitor_type),
    KEY idx_seo_comp_country (country),
    CONSTRAINT fk_seo_comp_project FOREIGN KEY (project_id)
        REFERENCES seo_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Competitor registry (Master Prompt §9). Never invent DA/DR.';

-- =====================================================================
-- 7. seo_sources  — verified source library (Tier A primary first)
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_sources (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    source_url         VARCHAR(512) NOT NULL,
    source_domain      VARCHAR(255) NOT NULL,
    page_title         VARCHAR(512) NULL,
    jurisdiction       VARCHAR(64)  NULL,
    topic              VARCHAR(160) NULL,
    source_type        ENUM('tier_a_primary','tier_b_authoritative','tier_c_journalism','tier_d_competitor','tier_e_ugc','internal','other') NOT NULL DEFAULT 'tier_b_authoritative',
    published_at       DATE NULL,
    updated_at         DATE NULL,
    retrieved_at       DATETIME NOT NULL,
    effective_date     DATE NULL,
    expiry_date        DATE NULL,
    content_hash       CHAR(64) NULL COMMENT 'SHA-256 of canonical source body for change detection',
    trust_level        ENUM('official','authoritative','reputable','contextual','unverified') NOT NULL DEFAULT 'reputable',
    verification_status ENUM('verified','needs_review','outdated','superseded','contradictory','high_risk') NOT NULL DEFAULT 'needs_review',
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_source_url (source_url),
    KEY idx_seo_source_domain (source_domain),
    KEY idx_seo_source_juris (jurisdiction),
    KEY idx_seo_source_topic (topic),
    KEY idx_seo_source_type (source_type),
    KEY idx_seo_source_trust (trust_level),
    KEY idx_seo_source_verification (verification_status),
    KEY idx_seo_source_effective (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Source library — Tier A first (GOV.UK, Canada.ca, homeaffairs.gov.au, etc.).';

-- =====================================================================
-- 8. seo_claims  — atomic factual claims attached to pages
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_claims (
    id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    page_id               BIGINT UNSIGNED NOT NULL,
    claim_text            TEXT NOT NULL,
    jurisdiction          VARCHAR(64)  NULL,
    volatility_level      ENUM('stable','medium','high','critical') NOT NULL DEFAULT 'medium',
    source_id             BIGINT UNSIGNED NULL,
    verified_at           DATETIME NULL,
    effective_date        DATE NULL,
    expiry_date           DATE NULL,
    confidence            ENUM('high','medium','low','unverified') NOT NULL DEFAULT 'unverified',
    human_review_required TINYINT(1) NOT NULL DEFAULT 1,
    reviewer_id           BIGINT UNSIGNED NULL,
    status                ENUM('pending','verified','needs_revision','rejected','outdated') NOT NULL DEFAULT 'pending',
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seo_claim_page (page_id),
    KEY idx_seo_claim_source (source_id),
    KEY idx_seo_claim_volatility (volatility_level),
    KEY idx_seo_claim_status (status),
    KEY idx_seo_claim_review_required (human_review_required),
    KEY idx_seo_claim_expiry (expiry_date),
    CONSTRAINT fk_seo_claim_page   FOREIGN KEY (page_id)   REFERENCES seo_pages(id)   ON DELETE CASCADE,
    CONSTRAINT fk_seo_claim_source FOREIGN KEY (source_id) REFERENCES seo_sources(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Atomic claims with source linkage + reviewer gate (Master Prompt §16, §54).';

-- =====================================================================
-- 9. seo_content_briefs  — research-backed briefs (Agent 6 output)
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_content_briefs (
    id                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    page_id                     BIGINT UNSIGNED NOT NULL,
    primary_intent              VARCHAR(120) NULL,
    target_audience             VARCHAR(160) NULL,
    page_goal                   VARCHAR(160) NULL,
    primary_cta                 VARCHAR(120) NULL,
    secondary_cta               VARCHAR(120) NULL,
    required_topics_json        JSON NULL,
    required_sources_json       JSON NULL,
    internal_link_targets_json  JSON NULL,
    unique_value_requirement    TEXT NULL,
    reviewer_requirement        ENUM('none','seo_editor','country_reviewer','legal','executive') NOT NULL DEFAULT 'seo_editor',
    status                      ENUM('draft','ready','assigned','consumed','archived') NOT NULL DEFAULT 'draft',
    created_by                  BIGINT UNSIGNED NULL,
    created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seo_brief_page (page_id),
    KEY idx_seo_brief_status (status),
    KEY idx_seo_brief_reviewer (reviewer_requirement),
    CONSTRAINT fk_seo_brief_page FOREIGN KEY (page_id)
        REFERENCES seo_pages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Content briefs — Agent 6 output (Master Prompt §30).';

-- =====================================================================
-- 10. seo_content_versions  — drafts + AI provenance (Agent 7)
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_content_versions (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    page_id              BIGINT UNSIGNED NOT NULL,
    version_number       INT UNSIGNED NOT NULL,
    content_body         MEDIUMTEXT NULL,
    created_by_type      ENUM('ai','human','hybrid') NOT NULL DEFAULT 'ai',
    created_by_id        BIGINT UNSIGNED NULL,
    model_provider       VARCHAR(64)  NULL,
    model_name           VARCHAR(96)  NULL,
    prompt_version_id    BIGINT UNSIGNED NULL,
    source_snapshot_ids  JSON NULL COMMENT 'JSON array of seo_sources.id used for this draft',
    forbidden_phrase_scan ENUM('pass','fail','not_run') NOT NULL DEFAULT 'not_run',
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seo_ver_page (page_id, version_number),
    KEY idx_seo_ver_created_by (created_by_type, created_by_id),
    KEY idx_seo_ver_model (model_provider, model_name),
    KEY idx_seo_ver_prompt (prompt_version_id),
    CONSTRAINT fk_seo_ver_page FOREIGN KEY (page_id)
        REFERENCES seo_pages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Draft versions with full AI provenance for audit (Master Prompt §31, §58).';

-- =====================================================================
-- 11. seo_content_reviews  — fact-check / SEO QA / expert review
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_content_reviews (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    content_version_id BIGINT UNSIGNED NOT NULL,
    reviewer_id        BIGINT UNSIGNED NULL,
    review_type        ENUM('fact_check','seo_qa','expert_review','country_review','legal','editorial','compliance') NOT NULL,
    score              TINYINT UNSIGNED NULL COMMENT '0-100 quality score',
    comments           TEXT NULL,
    status             ENUM('pass','pass_with_warnings','fail','blocked','pending') NOT NULL DEFAULT 'pending',
    reviewed_at        DATETIME NULL,
    created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seo_rev_version (content_version_id),
    KEY idx_seo_rev_type (review_type),
    KEY idx_seo_rev_status (status),
    KEY idx_seo_rev_reviewer (reviewer_id),
    CONSTRAINT fk_seo_rev_version FOREIGN KEY (content_version_id)
        REFERENCES seo_content_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Reviews across Fact-Check / SEO QA / Expert / Country / Legal (Master Prompt §32, §33, §17).';

-- =====================================================================
-- 12. seo_internal_links  — tracked internal link inventory
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_internal_links (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    source_page_id  BIGINT UNSIGNED NOT NULL,
    target_page_id  BIGINT UNSIGNED NOT NULL,
    anchor_text     VARCHAR(255) NOT NULL,
    link_context    VARCHAR(255) NULL COMMENT 'Surrounding sentence / heading',
    status          ENUM('active','suggested','rejected','broken','redirected','removed') NOT NULL DEFAULT 'active',
    confidence      DECIMAL(4,3) UNSIGNED NULL COMMENT '0-1 for AI-suggested links',
    last_checked_at DATETIME NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seo_il_source (source_page_id),
    KEY idx_seo_il_target (target_page_id),
    KEY idx_seo_il_status (status),
    KEY idx_seo_il_anchor (anchor_text(64)),
    CONSTRAINT fk_seo_il_source FOREIGN KEY (source_page_id) REFERENCES seo_pages(id) ON DELETE CASCADE,
    CONSTRAINT fk_seo_il_target FOREIGN KEY (target_page_id) REFERENCES seo_pages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Internal link inventory — hub-and-spoke (Master Prompt §18, §34).';

-- =====================================================================
-- 13. seo_backlinks  — inbound link tracking
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_backlinks (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    target_page_id    BIGINT UNSIGNED NULL,
    source_domain     VARCHAR(255) NOT NULL,
    source_url        VARCHAR(512) NOT NULL,
    anchor_text       VARCHAR(255) NULL,
    link_type         ENUM('editorial','outreach','partnership','directory','guest_post','ugc','sponsor','manual','unknown') NOT NULL DEFAULT 'unknown',
    acquired_at       DATETIME NULL,
    relationship_type ENUM('university_rep','partner_org','media_mention','alumni','digital_pr','none','other') NOT NULL DEFAULT 'none',
    status            ENUM('live','lost','pending','rejected','broken') NOT NULL DEFAULT 'pending',
    last_checked_at   DATETIME NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seo_bl_target (target_page_id),
    KEY idx_seo_bl_domain (source_domain),
    KEY idx_seo_bl_status (status),
    KEY idx_seo_bl_relationship (relationship_type),
    CONSTRAINT fk_seo_bl_target FOREIGN KEY (target_page_id) REFERENCES seo_pages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Backlinks — never fabricate; DA/DR intentionally NOT stored (Master Prompt §56).';

-- =====================================================================
-- 14. seo_outreach  — backlink + partnership outreach pipeline
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_outreach (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    target_organization VARCHAR(160) NOT NULL,
    contact_id           BIGINT UNSIGNED NULL,
    campaign_type        ENUM('university_rep_page','digital_pr','guest_content','partnership','alumni_story','local_citation','test_center','other') NOT NULL DEFAULT 'other',
    target_url           VARCHAR(512) NULL,
    requested_target_page VARCHAR(512) NULL COMMENT 'Page on ALO we want linked to',
    owner_id             BIGINT UNSIGNED NULL,
    outreach_date        DATE NULL,
    follow_up_date       DATE NULL,
    status               ENUM('planned','sent','replied','positive','negative','live','lost','rejected') NOT NULL DEFAULT 'planned',
    result               TEXT NULL,
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seo_out_status (status),
    KEY idx_seo_out_org (target_organization),
    KEY idx_seo_out_campaign (campaign_type),
    KEY idx_seo_out_followup (follow_up_date),
    KEY idx_seo_out_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Outreach pipeline (Master Prompt §20).';

-- =====================================================================
-- 15. seo_gsc_daily  — Google Search Console daily rollup
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_gsc_daily (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    project_id       BIGINT UNSIGNED NOT NULL,
    date             DATE NOT NULL,
    page             VARCHAR(512) NOT NULL,
    query            VARCHAR(255) NOT NULL,
    country          VARCHAR(8)  NULL,
    device           ENUM('desktop','mobile','tablet','unknown') NOT NULL DEFAULT 'unknown',
    search_appearance VARCHAR(64) NULL,
    clicks           INT UNSIGNED NOT NULL DEFAULT 0,
    impressions      INT UNSIGNED NOT NULL DEFAULT 0,
    ctr              DECIMAL(6,4) UNSIGNED NOT NULL DEFAULT 0,
    position         DECIMAL(6,2) UNSIGNED NOT NULL DEFAULT 0,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_gsc (project_id, date, page, query, country, device),
    KEY idx_seo_gsc_date (date),
    KEY idx_seo_gsc_page (page(255)),
    KEY idx_seo_gsc_query (query),
    KEY idx_seo_gsc_country (country),
    CONSTRAINT fk_seo_gsc_project FOREIGN KEY (project_id)
        REFERENCES seo_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='GSC daily sync — design around actual API/export constraints (§41).';

-- =====================================================================
-- 16. seo_ga4_daily  — GA4 daily rollup by landing page
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_ga4_daily (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    project_id       BIGINT UNSIGNED NOT NULL,
    date             DATE NOT NULL,
    landing_page     VARCHAR(512) NOT NULL,
    source           VARCHAR(64)  NULL,
    medium           VARCHAR(64)  NULL,
    campaign         VARCHAR(160) NULL,
    sessions         INT UNSIGNED NOT NULL DEFAULT 0,
    engaged_sessions INT UNSIGNED NOT NULL DEFAULT 0,
    generate_lead    INT UNSIGNED NOT NULL DEFAULT 0,
    qualified_leads  INT UNSIGNED NOT NULL DEFAULT 0,
    key_events       INT UNSIGNED NOT NULL DEFAULT 0,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_ga4 (project_id, date, landing_page, source, medium, campaign),
    KEY idx_seo_ga4_date (date),
    KEY idx_seo_ga4_page (landing_page(255)),
    KEY idx_seo_ga4_source_medium (source, medium),
    CONSTRAINT fk_seo_ga4_project FOREIGN KEY (project_id)
        REFERENCES seo_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='GA4 daily sync (Master Prompt §41).';

-- =====================================================================
-- 17. seo_ai_search_visibility  — generative-AI visibility (where available)
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_ai_search_visibility (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    project_id  BIGINT UNSIGNED NOT NULL,
    date        DATE NOT NULL,
    page        VARCHAR(512) NOT NULL,
    country     VARCHAR(8)  NULL,
    device      ENUM('desktop','mobile','tablet','unknown') NOT NULL DEFAULT 'unknown',
    impressions INT UNSIGNED NOT NULL DEFAULT 0,
    report_type VARCHAR(64) NOT NULL DEFAULT 'gsc_generative_ai',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_aisv (project_id, date, page, country, device, report_type),
    KEY idx_seo_aisv_date (date),
    KEY idx_seo_aisv_page (page(255)),
    KEY idx_seo_aisv_report_type (report_type),
    CONSTRAINT fk_seo_aisv_project FOREIGN KEY (project_id)
        REFERENCES seo_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='AI Search visibility — only available dimensions stored (Master Prompt §21, §49).';

-- =====================================================================
-- 18. seo_lead_attribution  — first-touch to enrolment pipeline
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_lead_attribution (
    id                                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    lead_id                            BIGINT UNSIGNED NOT NULL,
    first_landing_page                 VARCHAR(512) NULL,
    latest_landing_page                VARCHAR(512) NULL,
    first_source                       VARCHAR(64)  NULL,
    first_medium                       VARCHAR(64)  NULL,
    latest_source                      VARCHAR(64)  NULL,
    latest_medium                      VARCHAR(64)  NULL,
    utm_source                         VARCHAR(160) NULL,
    utm_medium                         VARCHAR(160) NULL,
    utm_campaign                       VARCHAR(160) NULL,
    utm_term                           VARCHAR(160) NULL,
    utm_content                        VARCHAR(160) NULL,
    approved_pseudonymous_analytics_id VARCHAR(128) NULL COMMENT 'Privacy-safe pseudonymous ID — never raw PII',
    first_visit_at                     DATETIME NULL,
    lead_created_at                    DATETIME NULL,
    content_cluster                    VARCHAR(96)  NULL,
    originating_page_id                BIGINT UNSIGNED NULL,
    created_at                         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_la_lead (lead_id),
    KEY idx_seo_la_first_page (first_landing_page(255)),
    KEY idx_seo_la_latest_page (latest_landing_page(255)),
    KEY idx_seo_la_cluster (content_cluster),
    KEY idx_seo_la_first_source (first_source, first_medium),
    KEY idx_seo_la_page (originating_page_id),
    CONSTRAINT fk_seo_la_page FOREIGN KEY (originating_page_id)
        REFERENCES seo_pages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='SEO-to-revenue attribution (Master Prompt §39, §40).';

-- =====================================================================
-- 19. seo_agent_runs  — AI agent execution log (14 SEO agents)
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_agent_runs (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_type       ENUM('orchestrator','technical_audit','search_opportunity','policy_research','source_verification','content_brief','draft','fact_check','seo_qa','internal_link','publishing','performance','freshness_watchdog','local_seo','authority') NOT NULL,
    task_id          VARCHAR(64) NULL COMMENT 'External task reference',
    status           ENUM('queued','running','completed','failed','blocked','cancelled') NOT NULL DEFAULT 'queued',
    input_hash       CHAR(64) NULL COMMENT 'SHA-256 of input payload for idempotency',
    prompt_version_id BIGINT UNSIGNED NULL,
    started_at       DATETIME NULL,
    completed_at     DATETIME NULL,
    model            VARCHAR(96)  NULL,
    token_usage      INT UNSIGNED NULL,
    estimated_cost   DECIMAL(10,4) NULL,
    output_summary   TEXT NULL,
    output_json      JSON NULL,
    error_message    TEXT NULL,
    requires_human_review TINYINT(1) NOT NULL DEFAULT 0,
    human_review_status ENUM('not_required','pending','approved','rejected') NOT NULL DEFAULT 'not_required',
    reviewer_id      BIGINT UNSIGNED NULL,
    reviewed_at      DATETIME NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seo_ar_agent (agent_type),
    KEY idx_seo_ar_status (status),
    KEY idx_seo_ar_task (task_id),
    KEY idx_seo_ar_input_hash (input_hash),
    KEY idx_seo_ar_review_status (human_review_status),
    KEY idx_seo_ar_created (created_at),
    CONSTRAINT fk_seo_ar_prompt FOREIGN KEY (prompt_version_id)
        REFERENCES seo_prompt_versions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Agent run log (Master Prompt §24-§37). No autonomous publishing.';

-- =====================================================================
-- 20. seo_prompt_versions  — versioned AI prompts
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_prompt_versions (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    prompt_name  VARCHAR(96)  NOT NULL,
    version      VARCHAR(32)  NOT NULL,
    prompt_body  MEDIUMTEXT   NOT NULL,
    created_by   BIGINT UNSIGNED NULL,
    approved_by  BIGINT UNSIGNED NULL,
    active_from  DATETIME     NULL,
    retired_at   DATETIME     NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seo_pv (prompt_name, version),
    KEY idx_seo_pv_active (active_from, retired_at),
    KEY idx_seo_pv_name (prompt_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Versioned AI prompts (Master Prompt §24).';

-- =====================================================================
-- 21. seo_alerts  — freshness, technical, agent alerts
-- =====================================================================
CREATE TABLE IF NOT EXISTS seo_alerts (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    alert_type   ENUM('freshness_urgent','freshness_review','source_changed','technical_p0','technical_p1','technical_p2','agent_failure','qa_failure','cannibalization','policy_changed','broken_link','lost_backlink','indexation_loss','review_request_due','custom') NOT NULL,
    severity     ENUM('info','warning','high','critical') NOT NULL DEFAULT 'warning',
    entity_type  VARCHAR(64)  NULL,
    entity_id    BIGINT UNSIGNED NULL,
    detected_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_to  BIGINT UNSIGNED NULL,
    status       ENUM('open','acknowledged','in_progress','resolved','wont_fix') NOT NULL DEFAULT 'open',
    resolution   TEXT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seo_alert_type (alert_type),
    KEY idx_seo_alert_severity (severity),
    KEY idx_seo_alert_status (status),
    KEY idx_seo_alert_assigned (assigned_to),
    KEY idx_seo_alert_detected (detected_at),
    KEY idx_seo_alert_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Alerts — freshness, technical, agent (Master Prompt §37, §44, §45).';

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- ---------------------------------------------------------------------
-- Seed 1: The ALO Education SEO project
-- ---------------------------------------------------------------------
INSERT INTO seo_projects (id, name, domain, primary_country, primary_language, timezone, status, start_date, end_date, created_at, updated_at) VALUES
(1, 'ALO Education', 'aloeducation.com', 'Bangladesh', 'en', 'Asia/Dhaka', 'active', '2026-07-09', '2026-10-07', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), updated_at=NOW();

-- ---------------------------------------------------------------------
-- Seed 2: 30 Money Pages (Master Prompt §12) — all status='idea'
-- Each row carries URL, page_type, country, search_intent, funnel_stage.
-- All opportunity scores are 0 — they will be recalculated by Agent 3 once
-- GSC/CRM baseline data is loaded.
-- ---------------------------------------------------------------------
INSERT INTO seo_pages (id, project_id, url, normalized_url, slug, page_type, country, study_level, topic_cluster, search_intent, funnel_stage, status, indexation_directive, created_at, updated_at) VALUES
-- 7 destination hubs
( 1, 1, '/study-in-uk',                  '/study-in-uk',                  'study-in-uk',                  'destination', 'United Kingdom',  'all', 'uk',         'commercial_investigation', 'decision',       'idea', 'index_follow', NOW(), NOW()),
( 2, 1, '/study-in-usa',                 '/study-in-usa',                 'study-in-usa',                 'destination', 'United States',   'all', 'usa',        'commercial_investigation', 'decision',       'idea', 'index_follow', NOW(), NOW()),
( 3, 1, '/study-in-canada',              '/study-in-canada',              'study-in-canada',              'destination', 'Canada',          'all', 'canada',     'commercial_investigation', 'decision',       'idea', 'index_follow', NOW(), NOW()),
( 4, 1, '/study-in-australia',           '/study-in-australia',           'study-in-australia',           'destination', 'Australia',       'all', 'australia',  'commercial_investigation', 'decision',       'idea', 'index_follow', NOW(), NOW()),
( 5, 1, '/study-in-ireland',             '/study-in-ireland',             'study-in-ireland',             'destination', 'Ireland',         'all', 'ireland',    'commercial_investigation', 'decision',       'idea', 'index_follow', NOW(), NOW()),
( 6, 1, '/study-in-dubai',               '/study-in-dubai',               'study-in-dubai',               'destination', 'United Arab Emirates','all','dubai',    'commercial_investigation', 'decision',       'idea', 'index_follow', NOW(), NOW()),
( 7, 1, '/study-in-new-zealand',         '/study-in-new-zealand',         'study-in-new-zealand',         'destination', 'New Zealand',     'all', 'new_zealand','commercial_investigation', 'decision',       'idea', 'index_follow', NOW(), NOW()),
-- 4 visa guides (UK, USA F1, Canada study permit, Australia subclass 500)
( 8, 1, '/uk/student-visa',              '/uk/student-visa',              'student-visa',                 'visa',        'United Kingdom',  'all', 'uk',         'informational',            'decision',       'idea', 'index_follow', NOW(), NOW()),
( 9, 1, '/usa/f1-student-visa',          '/usa/f1-student-visa',          'f1-student-visa',              'visa',        'United States',   'all', 'usa',        'informational',            'decision',       'idea', 'index_follow', NOW(), NOW()),
(10, 1, '/canada/study-permit',          '/canada/study-permit',          'study-permit',                 'visa',        'Canada',          'all', 'canada',     'informational',            'decision',       'idea', 'index_follow', NOW(), NOW()),
(11, 1, '/australia/student-visa',       '/australia/student-visa',       'student-visa',                 'visa',        'Australia',       'all', 'australia',  'informational',            'decision',       'idea', 'index_follow', NOW(), NOW()),
-- 3 affordable-university guides
(12, 1, '/uk/affordable-universities',   '/uk/affordable-universities',   'affordable-universities',      'university',  'United Kingdom',  'all', 'uk',         'commercial_investigation', 'consideration',  'idea', 'index_follow', NOW(), NOW()),
(13, 1, '/usa/affordable-universities',  '/usa/affordable-universities',  'affordable-universities',      'university',  'United States',   'all', 'usa',        'commercial_investigation', 'consideration',  'idea', 'index_follow', NOW(), NOW()),
(14, 1, '/canada/affordable-colleges',   '/canada/affordable-colleges',   'affordable-colleges',          'university',  'Canada',          'all', 'canada',     'commercial_investigation', 'consideration',  'idea', 'index_follow', NOW(), NOW()),
-- 2 English-language-options pages
(15, 1, '/uk/english-language-options',  '/uk/english-language-options',  'english-language-options',     'guide',       'United Kingdom',  'all', 'uk',         'informational',            'consideration',  'idea', 'index_follow', NOW(), NOW()),
(16, 1, '/usa/english-test-options',     '/usa/english-test-options',     'english-test-options',         'guide',       'United States',   'all', 'usa',        'informational',            'consideration',  'idea', 'index_follow', NOW(), NOW()),
-- 3 scholarship pages
(17, 1, '/usa/scholarships',             '/usa/scholarships',             'scholarships',                 'scholarship', 'United States',   'all', 'usa',        'commercial_investigation', 'consideration',  'idea', 'index_follow', NOW(), NOW()),
(18, 1, '/uk/scholarships',              '/uk/scholarships',              'scholarships',                 'scholarship', 'United Kingdom',  'all', 'uk',         'commercial_investigation', 'consideration',  'idea', 'index_follow', NOW(), NOW()),
(19, 1, '/canada/scholarships',          '/canada/scholarships',          'scholarships',                 'scholarship', 'Canada',          'all', 'canada',     'commercial_investigation', 'consideration',  'idea', 'index_follow', NOW(), NOW()),
-- Local + service pages
(20, 1, '/study-abroad-consultant-dhaka','/study-abroad-consultant-dhaka','study-abroad-consultant-dhaka','service',     'Bangladesh',      'all', 'local',      'local',                    'decision',       'idea', 'index_follow', NOW(), NOW()),
(21, 1, '/services/visa-guidance',       '/services/visa-guidance',       'visa-guidance',                'service',     NULL,              'all', 'services',   'transactional',            'decision',       'idea', 'index_follow', NOW(), NOW()),
(22, 1, '/services/university-admissions','/services/university-admissions','university-admissions',     'service',     NULL,              'all', 'services',   'transactional',            'decision',       'idea', 'index_follow', NOW(), NOW()),
-- High-conversion guides
(23, 1, '/guides/study-gap',             '/guides/study-gap',             'study-gap',                    'guide',       NULL,              'all', 'guides',     'informational',            'consideration',  'idea', 'index_follow', NOW(), NOW()),
(24, 1, '/canada/pgwp',                  '/canada/pgwp',                  'pgwp',                         'visa',        'Canada',          'all', 'canada',     'informational',            'decision',       'idea', 'index_follow', NOW(), NOW()),
(25, 1, '/uk/graduate-visa',             '/uk/graduate-visa',             'graduate-visa',                'visa',        'United Kingdom',  'all', 'uk',         'informational',            'decision',       'idea', 'index_follow', NOW(), NOW()),
-- AI tool MVPs
(26, 1, '/tools/visa-interview-practice', '/tools/visa-interview-practice','visa-interview-practice',     'tool',        NULL,              'all', 'tools',      'transactional',            'decision',       'idea', 'index_follow', NOW(), NOW()),
-- SOP review service
(27, 1, '/services/sop-review',          '/services/sop-review',          'sop-review',                   'service',     NULL,              'all', 'services',   'transactional',            'decision',       'idea', 'index_follow', NOW(), NOW()),
-- Financial guides
(28, 1, '/guides/education-financing',   '/guides/education-financing',   'education-financing',          'guide',       'Bangladesh',      'all', 'guides',     'informational',            'consideration',  'idea', 'index_follow', NOW(), NOW()),
(29, 1, '/visa/financial-evidence',      '/visa/financial-evidence',      'financial-evidence',           'guide',       NULL,              'all', 'visa',       'informational',            'decision',       'idea', 'index_follow', NOW(), NOW()),
-- Course matcher MVP
(30, 1, '/tools/course-matcher',         '/tools/course-matcher',         'course-matcher',               'tool',        NULL,              'all', 'tools',      'transactional',            'decision',       'idea', 'index_follow', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at=NOW();

-- ---------------------------------------------------------------------
-- Seed 3: 14 SEO AI agent types — one registry row per agent type
-- so the admin dashboard can show run counts per agent.
-- (These are NOT real exam_ai_agents; they are SEO-specific.)
-- We insert placeholder rows into seo_agent_runs with status='queued'
-- only as a registry, but more cleanly we store them as
-- `seo_prompt_versions` rows so prompts are versioned and discoverable.
-- ---------------------------------------------------------------------
INSERT INTO seo_prompt_versions (prompt_name, version, prompt_body, created_by, approved_by, active_from, created_at, updated_at) VALUES
('seo.orchestrator',           '1.0.0', '-- SEO ORCHESTRATOR: receive strategic objective, select agent sequence, enforce approval gates. NEVER skip SOURCE_VERIFICATION → FACT_CHECK → HUMAN_REVIEW for volatile immigration pages.', 1, 1, NOW(), NOW(), NOW()),
('seo.technical_audit',        '1.0.0', '-- TECHNICAL AUDIT AGENT: inputs = crawl data + rendered HTML + headers + sitemap + robots + GSC + PageSpeed. Output = issue list with severity, fix, owner, effort, deadline. Never recommend expensive migration without evidence.', 1, 1, NOW(), NOW(), NOW()),
('seo.search_opportunity',     '1.0.0', '-- SEARCH OPPORTUNITY AGENT: inputs = GSC queries/pages + CRM leads/applications + business priorities. Output = opportunity score (0-100) + recommended_action. Never invent volume.', 1, 1, NOW(), NOW(), NOW()),
('seo.policy_research',        '1.0.0', '-- POLICY RESEARCH AGENT: searches Tier-A official sources (GOV.UK, Canada.ca, homeaffairs.gov.au, travel.state.gov, Irish INIS, INZ). Captures claim, jurisdiction, effective_date, transition_date, confidence, volatility. Never rely on snippets.', 1, 1, NOW(), NOW(), NOW()),
('seo.source_verification',    '1.0.0', '-- SOURCE VERIFICATION AGENT: checks domain correctness, page relevance, jurisdiction, effective date, superseded status, primary vs secondary, whether claim follows from source. Flags outdated/superseded/contradictory/high_risk.', 1, 1, NOW(), NOW(), NOW()),
('seo.content_brief',          '1.0.0', '-- CONTENT BRIEF AGENT: produces research-backed brief (objective, audience, intent, keyword cluster, subtopics, SERP pattern, gap, unique value, sources, counsellor input, student story, original data, images, video, internal links, external official sources, CTA, conversion event, review frequency). Does NOT write the article.', 1, 1, NOW(), NOW(), NOW()),
('seo.draft',                  '1.0.0', '-- DRAFT AGENT: forbidden phrases = guaranteed visa, 100% success, easy PR, guaranteed scholarship, no bank statement, fastest visa, assured admission. Must use verified source data, original expert input, Bangladesh context, clear date labels, transparent limitations.', 1, 1, NOW(), NOW(), NOW()),
('seo.fact_check',             '1.0.0', '-- FACT-CHECK AGENT: classifies every sentence VERIFIED / NEEDS_SOURCE / OUTDATED / CONTRADICTORY / MISLEADING / OPINION / EXPERIENCE_CLAIM. Blocks publication when visa-rule claim lacks source, fee lacks current source, processing time lacks date, university policy lacks institutional source, success claim lacks audited evidence.', 1, 1, NOW(), NOW(), NOW()),
('seo.seo_qa',                 '1.0.0', '-- SEO QA AGENT: 24-point checklist (intent, unique value, unique title/desc, canonical, headings, sources, claims, dates, internal links, no cannibalization, CTA, conversion event, schema, images, alt text, author, reviewer, last reviewed, next review, no unsupported promise, mobile UX). Output = PASS / PASS_WITH_WARNINGS / FAIL.', 1, 1, NOW(), NOW(), NOW()),
('seo.internal_link',          '1.0.0', '-- INTERNAL LINK AGENT: identifies hub, child pages, contextual link opportunities, prevents over-optimization, finds orphans, broken links, redirected links. Output = source URL, target URL, recommended anchor, context, reason, confidence.', 1, 1, NOW(), NOW(), NOW()),
('seo.publishing',             '1.0.0', '-- PUBLISHING AGENT: may publish only when content approved + SEO QA passes + human reviewer approves + canonical generated + source records stored + URL unique + redirect impact checked. Post-publish: verify HTTP 200, rendered content, canonical, robots, title, schema, internal links, update sitemap, purge cache, queue GSC index-status check, schedule 7-day + 28-day review. Never misuse Indexing API for ordinary pages.', 1, 1, NOW(), NOW(), NOW()),
('seo.performance',            '1.0.0', '-- PERFORMANCE AGENT: weekly. Evaluates impressions/clicks/CTR/position movement, engagement, leads, qualified leads, consultations, applications, offers, visa outcomes, enrolments, pipeline value. Classifies page GROWING / STABLE / DECLINING / CTR_OPPORTUNITY / RANKING_OPPORTUNITY / CONVERSION_PROBLEM / CANNIBALIZATION_RISK / FRESHNESS_RISK. Recommends exactly one primary next action.', 1, 1, NOW(), NOW(), NOW()),
('seo.freshness_watchdog',     '1.0.0', '-- FRESHNESS WATCHDOG: cadences — visa policy 7d or event-triggered; processing times 24h-7d; fees 7d; scholarship deadline daily during close; university admissions 14d during intake; tuition 30d; evergreen 90-180d. On source content change: compare hash, identify affected claims/pages, create review tasks. Never auto-rewrite and publish high-risk policy without review.', 1, 1, NOW(), NOW(), NOW()),
('seo.local_seo',              '1.0.0', '-- LOCAL SEO AGENT: maintains GBP completeness, NAP consistency, review request workflow (triggered by CRM status VISA_APPROVED or ENROLLED with consent check), response rate tracking. Never create fake offices/reviews. Never pay for positive reviews.', 1, 1, NOW(), NOW(), NOW()),
('seo.authority',              '1.0.0', '-- AUTHORITY OPPORTUNITY AGENT: tracks university representative-page outreach, original-data PR opportunities, alumni story candidates, relevant partnerships. Backlinks = relevance + trust, never DA threshold manipulation. Avoids spam directories, paid link networks, mass guest-post farms, fake scholarships for links, automated comment links, exact-match anchor manipulation.', 1, 1, NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE prompt_body=VALUES(prompt_body), updated_at=NOW();

-- ---------------------------------------------------------------------
-- Seed 4: Tier-A official sources for the Source Library
-- (These are real, stable jurisdiction portals — NOT specific page
-- claims. Specific page URLs are added by the Policy Research Agent
-- during content production.)
-- ---------------------------------------------------------------------
INSERT INTO seo_sources (source_url, source_domain, page_title, jurisdiction, topic, source_type, retrieved_at, trust_level, verification_status, content_hash, created_at) VALUES
('https://www.gov.uk/browse/visas-immigration/student-visas',          'gov.uk',                   'UK Student visa — GOV.UK',                              'United Kingdom',  'student_visa',     'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW()),
('https://www.gov.uk/graduate-visa',                                   'gov.uk',                   'UK Graduate visa — GOV.UK',                             'United Kingdom',  'post_study_work',  'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW()),
('https://www.canada.ca/en/immigration-refugees-citizenship.html',     'canada.ca',                'IRCC — Immigration, Refugees and Citizenship Canada',  'Canada',          'study_permit',     'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW()),
('https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 'homeaffairs.gov.au', 'Australia Student visa (subclass 500)', 'Australia',       'student_visa',     'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW()),
('https://travel.state.gov/content/travel/en/us-visas/study.html',     'travel.state.gov',         'U.S. Student Visas — travel.state.gov',                 'United States',   'student_visa',     'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW()),
('https://www.ice.gov/docroot/sevis/index.htm',                        'ice.gov',                  'SEVP & SEVIS — U.S. Immigration and Customs Enforcement','United States',  'student_exchange', 'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW()),
('https://www.irishimmigration.ie/',                                   'irishimmigration.ie',      'Irish Immigration Service',                             'Ireland',         'immigration',      'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW()),
('https://www.immigration.govt.nz/',                                   'immigration.govt.nz',      'Immigration New Zealand',                               'New Zealand',     'immigration',      'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW()),
('https://developers.google.com/search/docs',                          'developers.google.com',    'Google Search Central documentation',                   NULL,              'seo',              'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW()),
('https://search.google.com/search-console',                           'search.google.com',        'Google Search Console',                                 NULL,              'seo',              'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW()),
('https://support.google.com/business/answer/3031730',                 'support.google.com',       'Google Business Profile policies',                      NULL,              'local_seo',        'tier_a_primary', NOW(), 'official',    'verified',    NULL, NOW())
ON DUPLICATE KEY UPDATE retrieved_at=NOW();

-- ---------------------------------------------------------------------
-- Seed 5: Competitor registry (Master Prompt §9)
-- DA/DR deliberately NOT stored. Only public domain + type.
-- ---------------------------------------------------------------------
INSERT INTO seo_competitors (project_id, name, domain, competitor_type, country, notes, last_audited_at, created_at, updated_at) VALUES
(1, 'IDP Bangladesh',          'idp.com',                  'agency',           'Bangladesh', 'Major international education agency with Bangladesh operations.', NULL, NOW(), NOW()),
(1, 'Shabuj Global',           'shabujglobal.com',         'agency',           'Bangladesh', 'Bangladesh-based study abroad consultancy.', NULL, NOW(), NOW()),
(1, 'MACES',                   'macesglobal.com',          'agency',           'Bangladesh', 'Bangladesh education consultancy.', NULL, NOW(), NOW()),
(1, "Mentors'",                'mentors.com.bd',           'agency',           'Bangladesh', 'Bangladesh education consultancy.', NULL, NOW(), NOW()),
(1, 'TCL Global',              'tclglobal.co.uk',          'agency',           'United Kingdom', 'UK-based education agency active in Bangladesh.', NULL, NOW(), NOW()),
(1, 'GoStudy',                 'gostudy.com',              'agency',           NULL,         'International education agency.', NULL, NOW(), NOW()),
(1, 'GSC Global Solutions',    'gscglobal.com.bd',         'agency',           'Bangladesh', 'Bangladesh education consultancy.', NULL, NOW(), NOW()),
(1, 'Eduvisors',               'eduvisors.com',            'agency',           NULL,         'International education consultancy.', NULL, NOW(), NOW()),
(1, 'Career Paths',            'careerpaths.com.bd',       'agency',           'Bangladesh', 'Bangladesh education consultancy.', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at=NOW();

-- ---------------------------------------------------------------------
-- Seed 6: SEO Growth Settings in exam_settings
-- ---------------------------------------------------------------------
INSERT INTO exam_settings (setting_key, setting_value, data_type, is_public, description, updated_by, created_at, updated_at) VALUES
('seo_growth_enabled',                 '1', 'bool',   0, 'Master switch — enables the SEO Growth module.', 1, NOW(), NOW()),
('seo_auto_publish',                   '0', 'bool',   0, 'CRITICAL: when 0, no AI-drafted content may auto-publish. AI may research and propose only.', 1, NOW(), NOW()),
('seo_human_review_required',          '1', 'bool',   0, 'CRITICAL: when 1, every volatile immigration page requires human expert review before publication.', 1, NOW(), NOW()),
('seo_high_risk_claim_policy',         '1', 'bool',   0, 'When 1, high-risk claims (guaranteed visa, success rates, etc.) require evidence + human approval.', 1, NOW(), NOW()),
('seo_default_review_cadence_visa_policy_days',     '7',  'int', 0, 'Freshness watchdog cadence for visa-policy sources (days).', 1, NOW(), NOW()),
('seo_default_review_cadence_processing_times_days','7',  'int', 0, 'Freshness watchdog cadence for processing-time sources (days).', 1, NOW(), NOW()),
('seo_default_review_cadence_fees_days',            '7',  'int', 0, 'Freshness watchdog cadence for fee sources (days).', 1, NOW(), NOW()),
('seo_default_review_cadence_tuition_days',         '30', 'int', 0, 'Freshness watchdog cadence for tuition sources (days).', 1, NOW(), NOW()),
('seo_default_review_cadence_evergreen_days',       '180','int', 0, 'Freshness watchdog cadence for evergreen content (days).', 1, NOW(), NOW()),
('seo_opportunity_score_weights', '{"gsc":25,"demand":20,"crm":20,"business_value":15,"serp":10,"freshness":10}', 'json', 0, 'Opportunity Score weighted model percentages (Master Prompt §7).', 1, NOW(), NOW()),
('seo_forbidden_phrases',             '["guaranteed visa","100% success","easy PR","guaranteed scholarship","no bank statement required","fastest visa","assured admission","98% visa success rate","highest success rate","best consultant","number one agency","visa in five days","all universities accept","IELTS not required"]', 'json', 0, 'Phrases forbidden in all SEO content (Master Prompt §31, §54).', 1, NOW(), NOW()),
('seo_review_request_consent_required','1', 'bool', 0, 'When 1, local review requests require explicit student consent.', 1, NOW(), NOW()),
('seo_index_api_restricted',          '1', 'bool', 0, 'When 1, the Google Indexing API may NOT be used for ordinary content pages (only eligible page types per current official eligibility).', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value), data_type=VALUES(data_type), description=VALUES(description), updated_at=NOW();

-- =====================================================================
-- END OF FILE — seo_growth_addon.sql
-- =====================================================================
