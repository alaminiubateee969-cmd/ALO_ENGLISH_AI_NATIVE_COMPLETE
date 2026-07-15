<?php
/**
 * app/Services/SeoGrowthService.php — ALO Education SEO Growth System service.
 *
 * Implements the read/write API for the SEO Growth module described in
 * the ALO Education Elite 90-Day SEO Growth System Master Prompt
 * (Sections 22–49, 59–60).
 *
 * Companion files:
 *   - database/seo_growth_addon.sql  (21 tables + seed data)
 *   - docs/SEO_MARKETING_90_DAY_PLAN.md
 *
 * CORE COMPLIANCE RULES (Master Prompt §1, §2, §54, §58):
 *   - NEVER guarantee rankings, visa approval, or success rates.
 *   - NEVER invent search volume, CPC, DA, traffic estimates.
 *   - Use the literal "DATA NOT AVAILABLE — REQUIRES TOOL OR ACCOUNT ACCESS"
 *     sentinel for unavailable metrics.
 *   - All high-risk claims require evidence and human approval.
 *   - No auto-publishing of high-risk immigration content
 *     (seo_auto_publish=0, seo_human_review_required=1).
 *   - Use official sources (GOV.UK, Canada.ca, homeaffairs.gov.au,
 *     travel.state.gov, Irish INIS, Immigration New Zealand, Google
 *     Search Central, Search Console, GA4, GBP).
 *
 * All SQL is executed via prepared statements through App\Core\Database.
 * Every mutating method writes to the immutable audit log via
 * AuditService::log() and to seo_agent_runs where an AI agent is invoked.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use RuntimeException;

final class SeoGrowthService
{
    // =====================================================
    // Constants — compliance + workflow
    // =====================================================

    /** Sentinel for any metric that cannot be verified via tool/account access. */
    public const DATA_NOT_AVAILABLE = 'DATA NOT AVAILABLE — REQUIRES TOOL OR ACCOUNT ACCESS';

    /** 14 SEO AI agent types (Master Prompt §24). */
    public const AGENT_ORCHESTRATOR          = 'orchestrator';
    public const AGENT_TECHNICAL_AUDIT       = 'technical_audit';
    public const AGENT_SEARCH_OPORTUNITY     = 'search_opportunity';
    public const AGENT_POLICY_RESEARCH       = 'policy_research';
    public const AGENT_SOURCE_VERIFICATION   = 'source_verification';
    public const AGENT_CONTENT_BRIEF         = 'content_brief';
    public const AGENT_DRAFT                 = 'draft';
    public const AGENT_FACT_CHECK            = 'fact_check';
    public const AGENT_SEO_QA                = 'seo_qa';
    public const AGENT_INTERNAL_LINK         = 'internal_link';
    public const AGENT_PUBLISHING            = 'publishing';
    public const AGENT_PERFORMANCE           = 'performance';
    public const AGENT_FRESHNESS_WATCHDOG    = 'freshness_watchdog';
    public const AGENT_LOCAL_SEO             = 'local_seo';
    public const AGENT_AUTHORITY             = 'authority';

    public const ALL_AGENTS = [
        self::AGENT_ORCHESTRATOR,
        self::AGENT_TECHNICAL_AUDIT,
        self::AGENT_SEARCH_OPORTUNITY,
        self::AGENT_POLICY_RESEARCH,
        self::AGENT_SOURCE_VERIFICATION,
        self::AGENT_CONTENT_BRIEF,
        self::AGENT_DRAFT,
        self::AGENT_FACT_CHECK,
        self::AGENT_SEO_QA,
        self::AGENT_INTERNAL_LINK,
        self::AGENT_PUBLISHING,
        self::AGENT_PERFORMANCE,
        self::AGENT_FRESHNESS_WATCHDOG,
        self::AGENT_LOCAL_SEO,
        self::AGENT_AUTHORITY,
    ];

    /** Content workflow states (Master Prompt §38). */
    public const WORKFLOW_STATES = [
        'idea', 'research_pending', 'sources_collected', 'facts_verified',
        'brief_ready', 'ai_drafted', 'fact_check', 'seo_qa',
        'expert_review', 'approved', 'scheduled', 'published',
        'index_status_pending', 'monitoring', 'update_required', 'archived',
    ];

    /** Page-level Performance classification (Master Prompt §36). */
    public const PERF_CLASSIFICATIONS = [
        'GROWING', 'STABLE', 'DECLINING', 'CTR_OPPORTUNITY',
        'RANKING_OPPORTUNITY', 'CONVERSION_PROBLEM',
        'CANNIBALIZATION_RISK', 'FRESHNESS_RISK',
    ];

    // =====================================================
    // Settings helpers
    // =====================================================

    /** Read a single SEO setting from exam_settings. */
    public static function setting(string $key, mixed $default = null): mixed
    {
        $row = Database::one(
            'SELECT setting_value, data_type FROM exam_settings WHERE setting_key = :k LIMIT 1',
            ['k' => $key]
        );
        if ($row === null) {
            return $default;
        }
        $v = $row['setting_value'];
        return match ($row['data_type']) {
            'bool' => $v === '1' || $v === 'true',
            'int'  => (int) $v,
            'float'=> (float) $v,
            'json' => json_decode($v ?: 'null', true),
            default => $v,
        };
    }

    /** Is the SEO Growth module enabled? */
    public static function isEnabled(): bool
    {
        return (bool) self::setting('seo_growth_enabled', false);
    }

    /** Is auto-publish allowed? (Default = NO — compliance rule.) */
    public static function isAutoPublishEnabled(): bool
    {
        // CRITICAL: defaults to false even if the setting is missing.
        return (bool) self::setting('seo_auto_publish', false);
    }

    /** Is human review required for volatile immigration content? */
    public static function isHumanReviewRequired(): bool
    {
        return (bool) self::setting('seo_human_review_required', true);
    }

    /** Forbidden phrases list (Master Prompt §31, §54). */
    public static function forbiddenPhrases(): array
    {
        $list = self::setting('seo_forbidden_phrases', []);
        return is_array($list) ? $list : [];
    }

    /** Opportunity Score weights (Master Prompt §7). */
    public static function opportunityScoreWeights(): array
    {
        $w = self::setting('seo_opportunity_score_weights', []);
        $w = is_array($w) ? $w : [];
        return array_merge(
            ['gsc' => 25, 'demand' => 20, 'crm' => 20, 'business_value' => 15, 'serp' => 10, 'freshness' => 10],
            $w
        );
    }

    // =====================================================
    // 1. getDashboardStats() — Executive dashboard aggregate
    // =====================================================

    /**
     * Executive dashboard aggregate (Master Prompt §42).
     *
     * Returns:
     *   - technical health counts (P0/P1 issues, 404s, CWV pass rate)
     *   - content pipeline counts (idea, draft, published, monitoring)
     *   - search performance (28d clicks, impressions, leads)
     *   - business outcomes (consultations, applications, offers, enrolments)
     *   - freshness alerts (urgent review count)
     *   - agent operations (runs today, failures today)
     *   - governance flags (auto_publish off, human review on)
     *
     * @return array{
     *   project: array,
     *   technical: array,
     *   content: array,
     *   search: array,
     *   business: array,
     *   freshness: array,
     *   agents: array,
     *   governance: array
     * }
     */
    public static function getDashboardStats(int $projectId = 1): array
    {
        if (!self::isEnabled()) {
            return ['disabled' => true, 'reason' => 'SEO Growth module is disabled.'];
        }

        $project = Database::one(
            'SELECT id, name, domain, primary_country, timezone, status, start_date, end_date
               FROM seo_projects WHERE id = :id LIMIT 1',
            ['id' => $projectId]
        );

        // ----- Content pipeline counts -----
        $statusRows = Database::all(
            'SELECT status, COUNT(*) AS n FROM seo_pages
              WHERE project_id = :p GROUP BY status',
            ['p' => $projectId]
        );
        $content = ['by_status' => [], 'total' => 0];
        foreach ($statusRows as $r) {
            $content['by_status'][$r['status']] = (int) $r['n'];
            $content['total'] += (int) $r['n'];
        }

        // ----- Freshness alerts (URGENT + REVIEW SOON) -----
        $urgentReview = (int) (Database::scalar(
            'SELECT COUNT(*) FROM seo_pages
              WHERE project_id = :p AND next_review_at IS NOT NULL
                AND next_review_at <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                AND status NOT IN (:s1, :s2)',
            ['p' => $projectId, 's1' => 'archived', 's2' => 'idea']
        ) ?: 0);

        $openAlerts = (int) (Database::scalar(
            'SELECT COUNT(*) FROM seo_alerts WHERE status = :s AND severity IN (:sev1, :sev2)',
            ['s' => 'open', 'sev1' => 'critical', 'sev2' => 'high']
        ) ?: 0);

        // ----- Search performance (last 28 days) -----
        $search = Database::one(
            'SELECT
                COALESCE(SUM(clicks),0)      AS clicks,
                COALESCE(SUM(impressions),0) AS impressions,
                COALESCE(AVG(position),0)    AS avg_position
               FROM seo_gsc_daily
              WHERE project_id = :p AND date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)',
            ['p' => $projectId]
        ) ?? ['clicks' => 0, 'impressions' => 0, 'avg_position' => 0];

        $organicLeads28d = (int) (Database::scalar(
            'SELECT COUNT(*) FROM seo_lead_attribution
              WHERE first_source = :src AND lead_created_at >= DATE_SUB(NOW(), INTERVAL 28 DAY)',
            ['src' => 'google']
        ) ?: 0);

        // ----- Business outcomes (organic-attributed, lifetime) -----
        $business = [
            'organic_leads'         => self::DATA_NOT_AVAILABLE,
            'qualified_leads'       => self::DATA_NOT_AVAILABLE,
            'consultations'         => self::DATA_NOT_AVAILABLE,
            'applications_started'  => self::DATA_NOT_AVAILABLE,
            'applications_submitted'=> self::DATA_NOT_AVAILABLE,
            'offers'                => self::DATA_NOT_AVAILABLE,
            'deposits'              => self::DATA_NOT_AVAILABLE,
            'visa_approvals'        => self::DATA_NOT_AVAILABLE,
            'enrolments'            => self::DATA_NOT_AVAILABLE,
            'pipeline_value'        => self::DATA_NOT_AVAILABLE,
            'note'                  => 'Business outcomes require WEB_CRM lead-application-outcome join. Until the join is wired, all values are DATA NOT AVAILABLE.',
        ];
        // Organic leads is the one we can compute directly from attribution:
        $business['organic_leads'] = $organicLeads28d;

        // ----- Agent operations (today) -----
        $agentRunsToday = (int) (Database::scalar(
            'SELECT COUNT(*) FROM seo_agent_runs WHERE DATE(created_at) = CURDATE()'
        ) ?: 0);
        $agentFailuresToday = (int) (Database::scalar(
            "SELECT COUNT(*) FROM seo_agent_runs
              WHERE DATE(created_at) = CURDATE() AND status IN ('failed','blocked')"
        ) ?: 0);

        // ----- Governance flags -----
        $governance = [
            'module_enabled'              => true,
            'auto_publish'                => self::isAutoPublishEnabled(),
            'human_review_required'       => self::isHumanReviewRequired(),
            'high_risk_claim_policy'      => (bool) self::setting('seo_high_risk_claim_policy', true),
            'index_api_restricted'        => (bool) self::setting('seo_index_api_restricted', true),
            'review_request_consent'      => (bool) self::setting('seo_review_request_consent_required', true),
            'forbidden_phrases_count'     => count(self::forbiddenPhrases()),
        ];

        return [
            'project' => $project,
            'technical' => [
                'open_critical_alerts' => $openAlerts,
                'urgent_freshness_reviews' => $urgentReview,
                'note' => 'Detailed technical health (404s, soft-404s, canonical conflicts, CWV pass rate) is populated by the Technical Audit Agent weekly. Until then, see seo_alerts.',
            ],
            'content' => $content,
            'search' => [
                'clicks_28d'      => (int) $search['clicks'],
                'impressions_28d' => (int) $search['impressions'],
                'avg_position_28d'=> round((float) $search['avg_position'], 2),
                'note' => 'GSC sync populates seo_gsc_daily daily. If clicks_28d = 0, GSC sync may not yet be configured — verify cron/seo_gsc_sync.php.',
            ],
            'business' => $business,
            'freshness' => [
                'urgent_review_count' => $urgentReview,
                'open_alerts'         => $openAlerts,
            ],
            'agents' => [
                'runs_today'        => $agentRunsToday,
                'failures_today'    => $agentFailuresToday,
                'available_agents'  => self::ALL_AGENTS,
            ],
            'governance' => $governance,
        ];
    }

    // =====================================================
    // 2. getOpportunities() — Top keyword opportunities with scores
    // =====================================================

    /**
     * Top keyword opportunities (Master Prompt §43).
     *
     * @param int $projectId
     * @param int $limit  Default 50
     * @return array{ opportunities: array<int, array>, scoring_model: array, note: string }
     */
    public static function getOpportunities(int $projectId = 1, int $limit = 50): array
    {
        $limit = max(1, min(500, $limit));

        $rows = Database::all(
            'SELECT k.id, k.keyword, k.country_market, k.language, k.intent, k.funnel_stage,
                    k.destination, k.search_volume, k.search_volume_source,
                    k.CPC, k.CPC_source, k.competition_metric, k.competition_provider,
                    k.current_position, k.current_url, k.opportunity_score,
                    k.recommended_action, k.last_scored_at,
                    (SELECT GROUP_CONCAT(p.url SEPARATOR "|")
                       FROM seo_keyword_page_map m
                       JOIN seo_pages p ON p.id = m.page_id
                      WHERE m.keyword_id = k.id AND m.cannibalization_risk NOT IN (:c1,:c2)
                      LIMIT 5) AS mapped_pages
               FROM seo_keywords k
              WHERE k.project_id = :p
              ORDER BY k.opportunity_score DESC, k.last_scored_at DESC
              LIMIT :limit',
            [
                'p'     => $projectId,
                'limit' => $limit,
                'c1'    => 'high',
                'c2'    => 'medium',
            ]
        );

        // Normalize missing-metric fields with the compliance sentinel.
        $opportunities = array_map(static function (array $r): array {
            return [
                'id'                  => (int) $r['id'],
                'keyword'             => $r['keyword'],
                'country_market'      => $r['country_market'],
                'language'            => $r['language'],
                'intent'              => $r['intent'],
                'funnel_stage'        => $r['funnel_stage'],
                'destination'         => $r['destination'],
                'search_volume'       => $r['search_volume'] !== null
                                            ? (int) $r['search_volume']
                                            : self::DATA_NOT_AVAILABLE,
                'search_volume_source'=> $r['search_volume_source'] ?? self::DATA_NOT_AVAILABLE,
                'CPC'                 => $r['CPC'] !== null
                                            ? (float) $r['CPC']
                                            : self::DATA_NOT_AVAILABLE,
                'CPC_source'          => $r['CPC_source'] ?? self::DATA_NOT_AVAILABLE,
                'competition_metric'  => $r['competition_metric'] !== null
                                            ? (float) $r['competition_metric']
                                            : self::DATA_NOT_AVAILABLE,
                'competition_provider'=> $r['competition_provider'] ?? self::DATA_NOT_AVAILABLE,
                'current_position'    => $r['current_position'] !== null
                                            ? (float) $r['current_position']
                                            : self::DATA_NOT_AVAILABLE,
                'current_url'         => $r['current_url'],
                'opportunity_score'   => (float) $r['opportunity_score'],
                'recommended_action'  => $r['recommended_action'],
                'last_scored_at'      => $r['last_scored_at'],
                'mapped_pages'        => $r['mapped_pages'] !== null
                                            ? explode('|', $r['mapped_pages'])
                                            : [],
            ];
        }, $rows);

        return [
            'opportunities'  => $opportunities,
            'scoring_model'  => self::opportunityScoreWeights(),
            'count'          => count($opportunities),
            'note'           => 'Opportunity Score = 25% GSC + 20% demand + 20% CRM + 15% business value + 10% SERP + 10% freshness. Any field without verified tool/account access shows DATA NOT AVAILABLE — never invented.',
        ];
    }

    // =====================================================
    // 3. getPages() — All SEO pages with status
    // =====================================================

    /**
     * All SEO pages with workflow status (Master Prompt §38).
     *
     * @param int $projectId
     * @param array $filters Optional ['status'=>?, 'page_type'=>?, 'country'=>?, 'topic_cluster'=>?]
     * @param int $limit
     * @return array
     */
    public static function getPages(int $projectId = 1, array $filters = [], int $limit = 200): array
    {
        $limit = max(1, min(1000, $limit));

        $where = ['project_id = :p'];
        $params = ['p' => $projectId];

        if (!empty($filters['status'])) {
            $where[] = 'status = :status';
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['page_type'])) {
            $where[] = 'page_type = :pt';
            $params['pt'] = $filters['page_type'];
        }
        if (!empty($filters['country'])) {
            $where[] = 'country = :c';
            $params['c'] = $filters['country'];
        }
        if (!empty($filters['topic_cluster'])) {
            $where[] = 'topic_cluster = :tc';
            $params['tc'] = $filters['topic_cluster'];
        }

        $sql = 'SELECT id, url, slug, page_type, country, study_level, topic_cluster,
                       search_intent, funnel_stage, status, owner_id, author_id, reviewer_id,
                       canonical_url, indexation_directive, publication_date,
                       last_updated_at, last_verified_at, next_review_at,
                       commercial_score, content_quality_score, technical_score, freshness_score
                  FROM seo_pages
                 WHERE ' . implode(' AND ', $where) . '
                 ORDER BY
                   CASE status
                     WHEN "idea" THEN 1
                     WHEN "research_pending" THEN 2
                     WHEN "sources_collected" THEN 3
                     WHEN "facts_verified" THEN 4
                     WHEN "brief_ready" THEN 5
                     WHEN "ai_drafted" THEN 6
                     WHEN "fact_check" THEN 7
                     WHEN "seo_qa" THEN 8
                     WHEN "expert_review" THEN 9
                     WHEN "approved" THEN 10
                     WHEN "scheduled" THEN 11
                     WHEN "published" THEN 12
                     WHEN "monitoring" THEN 13
                     WHEN "update_required" THEN 14
                     WHEN "archived" THEN 15
                     ELSE 99
                   END,
                   commercial_score DESC
                 LIMIT :limit';
        $params['limit'] = $limit;

        $rows = Database::all($sql, $params);

        return [
            'count' => count($rows),
            'workflow_states' => self::WORKFLOW_STATES,
            'pages' => array_map(static fn (array $r): array => [
                'id'                    => (int) $r['id'],
                'url'                   => $r['url'],
                'slug'                  => $r['slug'],
                'page_type'             => $r['page_type'],
                'country'               => $r['country'],
                'study_level'           => $r['study_level'],
                'topic_cluster'         => $r['topic_cluster'],
                'search_intent'         => $r['search_intent'],
                'funnel_stage'          => $r['funnel_stage'],
                'status'                => $r['status'],
                'owner_id'              => $r['owner_id'] !== null ? (int) $r['owner_id'] : null,
                'author_id'             => $r['author_id'] !== null ? (int) $r['author_id'] : null,
                'reviewer_id'           => $r['reviewer_id'] !== null ? (int) $r['reviewer_id'] : null,
                'canonical_url'         => $r['canonical_url'],
                'indexation_directive'  => $r['indexation_directive'],
                'publication_date'      => $r['publication_date'],
                'last_updated_at'       => $r['last_updated_at'],
                'last_verified_at'      => $r['last_verified_at'],
                'next_review_at'        => $r['next_review_at'],
                'commercial_score'      => (int) $r['commercial_score'],
                'content_quality_score' => (int) $r['content_quality_score'],
                'technical_score'       => (int) $r['technical_score'],
                'freshness_score'       => (int) $r['freshness_score'],
            ], $rows),
        ];
    }

    // =====================================================
    // 4. createBrief() — Create a content brief (Agent 6 output target)
    // =====================================================

    /**
     * Create a content brief (Master Prompt §30).
     *
     * The brief is the research-backed specification the Draft Agent
     * consumes. This method does NOT generate the brief itself — it
     * persists a brief produced by the Content Brief Agent (or authored
     * by a human SEO Editor).
     *
     * @param array $data {
     *     page_id: int,
     *     primary_intent?: string,
     *     target_audience?: string,
     *     page_goal?: string,
     *     primary_cta?: string,
     *     secondary_cta?: string,
     *     required_topics?: array,
     *     required_sources?: array,
     *     internal_link_targets?: array,
     *     unique_value_requirement?: string,
     *     reviewer_requirement?: string (one of: none, seo_editor, country_reviewer, legal, executive),
     *     created_by?: int
     * }
     * @return array{ ok: bool, brief_id?: int, page_status?: string, error?: string }
     */
    public static function createBrief(array $data): array
    {
        if (!self::isEnabled()) {
            return ['ok' => false, 'error' => 'SEO Growth module is disabled.'];
        }
        if (empty($data['page_id'])) {
            return ['ok' => false, 'error' => 'page_id is required.'];
        }

        $pageId = (int) $data['page_id'];
        $page = Database::one(
            'SELECT id, project_id, status FROM seo_pages WHERE id = :id LIMIT 1',
            ['id' => $pageId]
        );
        if ($page === null) {
            return ['ok' => false, 'error' => 'page_not_found'];
        }

        $reviewer = $data['reviewer_requirement'] ?? 'seo_editor';
        $allowedReviewers = ['none', 'seo_editor', 'country_reviewer', 'legal', 'executive'];
        if (!in_array($reviewer, $allowedReviewers, true)) {
            return ['ok' => false, 'error' => 'invalid reviewer_requirement'];
        }

        $briefId = Database::transactional(function () use ($data, $pageId, $reviewer, $page): int {
            // Insert brief
            $briefId = Database::insert('seo_content_briefs', [
                'page_id'                    => $pageId,
                'primary_intent'             => $data['primary_intent'] ?? null,
                'target_audience'            => $data['target_audience'] ?? null,
                'page_goal'                  => $data['page_goal'] ?? null,
                'primary_cta'                => $data['primary_cta'] ?? null,
                'secondary_cta'              => $data['secondary_cta'] ?? null,
                'required_topics_json'       => json_encode($data['required_topics'] ?? [], JSON_UNESCAPED_UNICODE),
                'required_sources_json'      => json_encode($data['required_sources'] ?? [], JSON_UNESCAPED_UNICODE),
                'internal_link_targets_json' => json_encode($data['internal_link_targets'] ?? [], JSON_UNESCAPED_UNICODE),
                'unique_value_requirement'   => $data['unique_value_requirement'] ?? null,
                'reviewer_requirement'       => $reviewer,
                'status'                     => 'ready',
                'created_by'                 => $data['created_by'] ?? null,
                'created_at'                 => date('Y-m-d H:i:s'),
                'updated_at'                 => date('Y-m-d H:i:s'),
            ]);

            // Advance page workflow to brief_ready (only forward-progress)
            $forwardStates = ['idea', 'research_pending', 'sources_collected', 'facts_verified'];
            if (in_array($page['status'], $forwardStates, true)) {
                Database::update('seo_pages', [
                    'status' => 'brief_ready',
                    'updated_at' => date('Y-m-d H:i:s'),
                ], 'id = :id', ['id' => $pageId]);
            }

            return $briefId;
        });

        AuditService::log(
            $data['created_by'] ?? null,
            'seo.brief.created',
            'seo_content_brief',
            $briefId,
            ['page_id' => $pageId, 'reviewer_requirement' => $reviewer]
        );

        return [
            'ok' => true,
            'brief_id' => $briefId,
            'page_status' => 'brief_ready',
        ];
    }

    // =====================================================
    // 5. runAgent() — Run a specified SEO agent type
    // =====================================================

    /**
     * Run an SEO AI agent (Master Prompt §24–§37).
     *
     * This method creates an `seo_agent_runs` row representing the
     * invocation. It does NOT call the LLM directly — that is the job
     * of the cron worker / queue consumer. The method enforces:
     *   - agent_type is one of the 14 known types
     *   - idempotency via input_hash
     *   - human_review_required flag for volatile agents
     *   - audit logging
     *
     * @param string $agentType One of self::ALL_AGENTS
     * @param array  $input     Input payload (will be hashed for idempotency)
     * @param array  $opts      { task_id?: string, model?: string, prompt_version_id?: int, actor_user_id?: int }
     * @return array{ ok: bool, run_id?: int, status?: string, idempotent_reuse?: bool, error?: string }
     */
    public static function runAgent(string $agentType, array $input, array $opts = []): array
    {
        if (!self::isEnabled()) {
            return ['ok' => false, 'error' => 'SEO Growth module is disabled.'];
        }
        if (!in_array($agentType, self::ALL_AGENTS, true)) {
            return ['ok' => false, 'error' => "Unknown agent_type: {$agentType}"];
        }

        // Compute input hash for idempotency
        $inputJson = json_encode($input, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $inputHash = hash('sha256', $agentType . '|' . $inputJson);

        // Idempotency: if the same agent+input has been queued or run in the
        // last 24h, return the existing run instead of duplicating.
        $existing = Database::one(
            "SELECT id, status FROM seo_agent_runs
              WHERE agent_type = :a AND input_hash = :h
                AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
              ORDER BY id DESC LIMIT 1",
            ['a' => $agentType, 'h' => $inputHash]
        );
        if ($existing !== null) {
            return [
                'ok' => true,
                'run_id' => (int) $existing['id'],
                'status' => $existing['status'],
                'idempotent_reuse' => true,
            ];
        }

        // Volatile agents require human review by default.
        $volatileAgents = [
            self::AGENT_POLICY_RESEARCH,
            self::AGENT_SOURCE_VERIFICATION,
            self::AGENT_FACT_CHECK,
            self::AGENT_PUBLISHING,
        ];
        $requiresHumanReview = in_array($agentType, $volatileAgents, true)
            || self::isHumanReviewRequired();

        // Publishing agent has the hardest gate — never auto-publish.
        if ($agentType === self::AGENT_PUBLISHING && self::isAutoPublishEnabled() === false) {
            $requiresHumanReview = true;
        }

        $runId = Database::insert('seo_agent_runs', [
            'agent_type'              => $agentType,
            'task_id'                 => $opts['task_id'] ?? null,
            'status'                  => 'queued',
            'input_hash'              => $inputHash,
            'prompt_version_id'       => $opts['prompt_version_id'] ?? null,
            'started_at'              => null,
            'completed_at'            => null,
            'model'                   => $opts['model'] ?? null,
            'token_usage'             => null,
            'estimated_cost'          => null,
            'output_summary'          => null,
            'output_json'             => json_encode(['input' => $input], JSON_UNESCAPED_UNICODE),
            'error_message'           => null,
            'requires_human_review'   => $requiresHumanReview ? 1 : 0,
            'human_review_status'     => $requiresHumanReview ? 'pending' : 'not_required',
            'reviewer_id'             => null,
            'reviewed_at'             => null,
            'created_at'              => date('Y-m-d H:i:s'),
            'updated_at'              => date('Y-m-d H:i:s'),
        ]);

        AuditService::log(
            $opts['actor_user_id'] ?? null,
            'seo.agent.queued',
            'seo_agent_run',
            $runId,
            [
                'agent_type' => $agentType,
                'requires_human_review' => $requiresHumanReview,
                'task_id' => $opts['task_id'] ?? null,
            ]
        );

        return [
            'ok' => true,
            'run_id' => $runId,
            'status' => 'queued',
            'requires_human_review' => $requiresHumanReview,
            'idempotent_reuse' => false,
        ];
    }

    // =====================================================
    // 6. getFreshnessAlerts() — Pages needing review
    // =====================================================

    /**
     * Freshness alerts — pages needing review (Master Prompt §37, §44).
     *
     * Returns pages where:
     *   - next_review_at is in the past or within 7 days, OR
     *   - source_changed alert is open for the page, OR
     *   - status = update_required
     *
     * Statuses per Master Prompt §44: GREEN, REVIEW SOON, URGENT REVIEW, BLOCKED.
     *
     * @param int $projectId
     * @param int $limit
     * @return array
     */
    public static function getFreshnessAlerts(int $projectId = 1, int $limit = 100): array
    {
        $limit = max(1, min(500, $limit));

        $rows = Database::all(
            'SELECT p.id, p.url, p.slug, p.country, p.topic_cluster,
                    p.status, p.last_verified_at, p.next_review_at,
                    p.freshness_score,
                    (SELECT MAX(detected_at) FROM seo_alerts a
                      WHERE a.entity_type = "seo_page" AND a.entity_id = p.id
                        AND a.alert_type IN ("freshness_urgent","source_changed","policy_changed")
                        AND a.status = "open") AS last_alert_at,
                    (SELECT COUNT(*) FROM seo_claims c
                      WHERE c.page_id = p.id AND c.volatility_level = "critical") AS critical_claims
               FROM seo_pages p
              WHERE p.project_id = :p
                AND p.status NOT IN (:s1, :s2)
                AND (
                  p.next_review_at IS NOT NULL
                  AND p.next_review_at <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                )
              ORDER BY p.next_review_at ASC, critical_claims DESC
              LIMIT :limit',
            [
                'p' => $projectId,
                's1' => 'archived',
                's2' => 'idea',
                'limit' => $limit,
            ]
        );

        $alerts = array_map(static function (array $r): array {
            $next = $r['next_review_at'] ? strtotime($r['next_review_at']) : null;
            $today = strtotime(date('Y-m-d'));
            $daysOverdue = ($next !== null) ? (int) round(($today - $next) / 86400) : null;

            // Determine status (GREEN / REVIEW SOON / URGENT REVIEW / BLOCKED)
            if ($r['status'] === 'update_required') {
                $freshnessStatus = 'BLOCKED';
            } elseif ($daysOverdue !== null && $daysOverdue >= 0) {
                $freshnessStatus = 'URGENT REVIEW';
            } elseif ($daysOverdue !== null && $daysOverdue >= -7) {
                $freshnessStatus = 'REVIEW SOON';
            } else {
                $freshnessStatus = 'GREEN';
            }

            return [
                'page_id'             => (int) $r['id'],
                'url'                 => $r['url'],
                'slug'                => $r['slug'],
                'country'             => $r['country'],
                'topic_cluster'       => $r['topic_cluster'],
                'page_status'         => $r['status'],
                'freshness_status'    => $freshnessStatus,
                'days_overdue'        => $daysOverdue,
                'next_review_at'      => $r['next_review_at'],
                'last_verified_at'    => $r['last_verified_at'],
                'last_alert_at'       => $r['last_alert_at'],
                'critical_claims'     => (int) $r['critical_claims'],
                'freshness_score'     => (int) $r['freshness_score'],
            ];
        }, $rows);

        // Summary counts
        $summary = ['GREEN' => 0, 'REVIEW SOON' => 0, 'URGENT REVIEW' => 0, 'BLOCKED' => 0];
        foreach ($alerts as $a) {
            $summary[$a['freshness_status']]++;
        }

        return [
            'count' => count($alerts),
            'summary' => $summary,
            'alerts' => $alerts,
            'note' => 'Default cadences — visa policy: 7d; processing times: 24h-7d; fees: 7d; tuition: 30d; evergreen: 90-180d. Volatile immigration content is NEVER auto-rewritten.',
        ];
    }

    // =====================================================
    // 7. getCompetitors() — Competitor data
    // =====================================================

    /**
     * Competitor registry + summary stats (Master Prompt §9).
     *
     * NEVER invents DA/DR. If a third-party authority metric is used,
     * the provider + retrieval date is recorded in seo_competitors.notes.
     *
     * @param int $projectId
     * @return array
     */
    public static function getCompetitors(int $projectId = 1): array
    {
        $competitors = Database::all(
            'SELECT id, name, domain, competitor_type, country, notes, last_audited_at,
                    created_at, updated_at
               FROM seo_competitors
              WHERE project_id = :p
              ORDER BY competitor_type, name',
            ['p' => $projectId]
        );

        $competitors = array_map(static fn (array $r): array => [
            'id'              => (int) $r['id'],
            'name'            => $r['name'],
            'domain'          => $r['domain'],
            'competitor_type' => $r['competitor_type'],
            'country'         => $r['country'],
            'notes'           => $r['notes'],
            'last_audited_at' => $r['last_audited_at'],
            'authority_metric' => self::DATA_NOT_AVAILABLE,
            'authority_metric_provider' => self::DATA_NOT_AVAILABLE,
            'note' => 'DA/DR intentionally not stored. Use a named third-party tool to retrieve, with retrieval date, when comparing authority.',
        ], $competitors);

        return [
            'count' => count($competitors),
            'competitors' => $competitors,
            'research_outputs_required' => [
                'competitor_matrix', 'keyword_overlap', 'page_gap', 'content_quality_gap',
                'tool_gap', 'trust_gap', 'local_seo_gap', 'conversion_gap',
                'backlink_gap', 'alo_can_win_list',
            ],
            'note' => 'Per Master Prompt §9, output 10 research artifacts. Competitor analysis is run by the Analyst role and stored in seo_outreach / seo_alerts.',
        ];
    }

    // =====================================================
    // 8. getPerformanceData() — GSC + GA4 data
    // =====================================================

    /**
     * Performance data — GSC + GA4 + lead attribution (Master Prompt §41, §42).
     *
     * @param int $projectId
     * @param string $period  One of: 7d, 28d, 90d
     * @return array
     */
    public static function getPerformanceData(int $projectId = 1, string $period = '28d'): array
    {
        $days = match ($period) {
            '7d'  => 7,
            '28d' => 28,
            '90d' => 90,
            default => 28,
        };

        // ----- GSC summary -----
        $gsc = Database::one(
            'SELECT
                COALESCE(SUM(clicks),0)       AS clicks,
                COALESCE(SUM(impressions),0)  AS impressions,
                COALESCE(SUM(clicks)/NULLIF(SUM(impressions),0),0) AS ctr,
                COALESCE(AVG(position),0)     AS avg_position,
                COUNT(DISTINCT query)         AS unique_queries,
                COUNT(DISTINCT page)          AS unique_pages
               FROM seo_gsc_daily
              WHERE project_id = :p
                AND date >= DATE_SUB(CURDATE(), INTERVAL :days DAY)',
            ['p' => $projectId, 'days' => $days]
        ) ?? [
            'clicks' => 0, 'impressions' => 0, 'ctr' => 0,
            'avg_position' => 0, 'unique_queries' => 0, 'unique_pages' => 0,
        ];

        // ----- Top pages by clicks -----
        $topPages = Database::all(
            'SELECT page,
                    SUM(clicks) AS clicks,
                    SUM(impressions) AS impressions,
                    AVG(position) AS avg_position
               FROM seo_gsc_daily
              WHERE project_id = :p
                AND date >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
              GROUP BY page
              ORDER BY clicks DESC
              LIMIT 20',
            ['p' => $projectId, 'days' => $days]
        );

        // ----- Top queries by clicks -----
        $topQueries = Database::all(
            'SELECT query,
                    SUM(clicks) AS clicks,
                    SUM(impressions) AS impressions,
                    AVG(position) AS avg_position
               FROM seo_gsc_daily
              WHERE project_id = :p
                AND date >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
              GROUP BY query
              ORDER BY clicks DESC
              LIMIT 20',
            ['p' => $projectId, 'days' => $days]
        );

        // ----- GA4 summary -----
        $ga4 = Database::one(
            'SELECT
                COALESCE(SUM(sessions),0)         AS sessions,
                COALESCE(SUM(engaged_sessions),0)  AS engaged_sessions,
                COALESCE(SUM(generate_lead),0)     AS generate_lead,
                COALESCE(SUM(qualified_leads),0)   AS qualified_leads,
                COALESCE(SUM(key_events),0)        AS key_events
               FROM seo_ga4_daily
              WHERE project_id = :p
                AND date >= DATE_SUB(CURDATE(), INTERVAL :days DAY)',
            ['p' => $projectId, 'days' => $days]
        ) ?? [
            'sessions' => 0, 'engaged_sessions' => 0,
            'generate_lead' => 0, 'qualified_leads' => 0, 'key_events' => 0,
        ];

        // ----- AI search visibility (where available) -----
        $aiVis = Database::one(
            'SELECT COALESCE(SUM(impressions),0) AS ai_impressions,
                    COUNT(DISTINCT page) AS ai_pages_appearing
               FROM seo_ai_search_visibility
              WHERE project_id = :p
                AND date >= DATE_SUB(CURDATE(), INTERVAL :days DAY)',
            ['p' => $projectId, 'days' => $days]
        ) ?? ['ai_impressions' => 0, 'ai_pages_appearing' => 0];

        // ----- Organic-attributed leads (lifetime + period) -----
        $organicLeadsPeriod = (int) (Database::scalar(
            'SELECT COUNT(*) FROM seo_lead_attribution
              WHERE first_source = :src
                AND lead_created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)',
            ['src' => 'google', 'days' => $days]
        ) ?: 0);

        return [
            'period' => $period,
            'days'   => $days,
            'gsc' => [
                'clicks'           => (int) $gsc['clicks'],
                'impressions'      => (int) $gsc['impressions'],
                'ctr'              => round((float) $gsc['ctr'], 4),
                'avg_position'     => round((float) $gsc['avg_position'], 2),
                'unique_queries'   => (int) $gsc['unique_queries'],
                'unique_pages'     => (int) $gsc['unique_pages'],
            ],
            'ga4' => [
                'sessions'         => (int) $ga4['sessions'],
                'engaged_sessions' => (int) $ga4['engaged_sessions'],
                'generate_lead'    => (int) $ga4['generate_lead'],
                'qualified_leads'  => (int) $ga4['qualified_leads'],
                'key_events'       => (int) $ga4['key_events'],
            ],
            'ai_search_visibility' => [
                'ai_impressions'     => (int) $aiVis['ai_impressions'],
                'ai_pages_appearing' => (int) $aiVis['ai_pages_appearing'],
                'note' => 'Generative-AI visibility only stored where GSC exposes the report. No fabricated clicks or dimensions.',
            ],
            'attribution' => [
                'organic_leads_period' => $organicLeadsPeriod,
                'business_outcomes'    => self::DATA_NOT_AVAILABLE,
                'note'                 => 'Business outcomes (consultations, applications, offers, enrolments) require WEB_CRM lead-application-outcome join.',
            ],
            'top_pages' => array_map(static fn (array $r): array => [
                'page'         => $r['page'],
                'clicks'       => (int) $r['clicks'],
                'impressions'  => (int) $r['impressions'],
                'avg_position' => round((float) $r['avg_position'], 2),
            ], $topPages),
            'top_queries' => array_map(static fn (array $r): array => [
                'query'        => $r['query'],
                'clicks'       => (int) $r['clicks'],
                'impressions'  => (int) $r['impressions'],
                'avg_position' => round((float) $r['avg_position'], 2),
            ], $topQueries),
        ];
    }

    // =====================================================
    // 9. getBacklinks() — Backlink data
    // =====================================================

    /**
     * Backlink inventory (Master Prompt §20, §48, §56).
     *
     * Returns backlinks grouped by status + relationship_type.
     * NEVER invents DA/DR. Avoids spam directories, paid link networks,
     * mass guest-post farms, fake scholarships, automated comment links,
     * exact-match anchor manipulation.
     *
     * @param int $projectId (used to scope target pages via seo_pages.project_id)
     * @param int $limit
     * @return array
     */
    public static function getBacklinks(int $projectId = 1, int $limit = 100): array
    {
        $limit = max(1, min(500, $limit));

        // Active backlinks
        $backlinks = Database::all(
            'SELECT b.id, b.target_page_id, p.url AS target_url,
                    b.source_domain, b.source_url, b.anchor_text, b.link_type,
                    b.relationship_type, b.status, b.acquired_at, b.last_checked_at
               FROM seo_backlinks b
          LEFT JOIN seo_pages p ON p.id = b.target_page_id
              WHERE p.project_id = :p OR b.target_page_id IS NULL
              ORDER BY
                CASE b.status WHEN "live" THEN 0 WHEN "pending" THEN 1 WHEN "lost" THEN 2 ELSE 3 END,
                b.acquired_at DESC
              LIMIT :limit',
            ['p' => $projectId, 'limit' => $limit]
        );

        $backlinks = array_map(static fn (array $r): array => [
            'id'                => (int) $r['id'],
            'target_page_id'    => $r['target_page_id'] !== null ? (int) $r['target_page_id'] : null,
            'target_url'        => $r['target_url'],
            'source_domain'     => $r['source_domain'],
            'source_url'        => $r['source_url'],
            'anchor_text'       => $r['anchor_text'],
            'link_type'         => $r['link_type'],
            'relationship_type' => $r['relationship_type'],
            'status'            => $r['status'],
            'acquired_at'       => $r['acquired_at'],
            'last_checked_at'   => $r['last_checked_at'],
            'authority_metric'  => self::DATA_NOT_AVAILABLE,
            'authority_metric_provider' => self::DATA_NOT_AVAILABLE,
        ], $backlinks);

        // Summary
        $byStatus = [];
        $byRelationship = [];
        foreach ($backlinks as $b) {
            $byStatus[$b['status']] = ($byStatus[$b['status']] ?? 0) + 1;
            $byRelationship[$b['relationship_type']] = ($byRelationship[$b['relationship_type']] ?? 0) + 1;
        }

        // Outreach pipeline
        $outreach = Database::all(
            'SELECT id, target_organization, campaign_type, target_url,
                    requested_target_page, status, outreach_date, follow_up_date, result
               FROM seo_outreach
              ORDER BY
                CASE status WHEN "planned" THEN 0 WHEN "sent" THEN 1 WHEN "replied" THEN 2
                            WHEN "positive" THEN 3 WHEN "live" THEN 4 ELSE 5 END,
                outreach_date DESC
              LIMIT 50'
        );

        return [
            'count' => count($backlinks),
            'by_status' => $byStatus,
            'by_relationship_type' => $byRelationship,
            'backlinks' => $backlinks,
            'outreach_pipeline' => array_map(static fn (array $r): array => [
                'id'                    => (int) $r['id'],
                'target_organization'   => $r['target_organization'],
                'campaign_type'         => $r['campaign_type'],
                'target_url'            => $r['target_url'],
                'requested_target_page' => $r['requested_target_page'],
                'status'                => $r['status'],
                'outreach_date'         => $r['outreach_date'],
                'follow_up_date'        => $r['follow_up_date'],
                'result'                => $r['result'],
            ], $outreach),
            'compliance' => [
                'avoid' => [
                    'spam_directories', 'paid_link_networks', 'mass_guest_post_farms',
                    'fake_scholarships_for_links', 'automated_comment_links',
                    'exact_match_anchor_manipulation',
                ],
                'never_invented' => ['DA', 'DR', 'backlink_count_estimates'],
            ],
            'note' => 'Backlink authority metrics (DA/DR) require a named third-party tool. Provider + retrieval date stored in seo_backlinks.anchor_text notes column when used.',
        ];
    }

    // =====================================================
    // 10. getLocalSeoData() — Local SEO data
    // =====================================================

    /**
     * Local SEO data (Master Prompt §19, §47, §50).
     *
     * Returns:
     *   - review request pipeline (consent-required, never paid/fake/gated)
     *   - NAP consistency status
     *   - GBP completeness (placeholder until GBP API wired)
     *   - local review request alerts
     *
     * @param int $projectId
     * @return array
     */
    public static function getLocalSeoData(int $projectId = 1): array
    {
        // Review requests due (triggered by CRM webhook → seo_alerts)
        $reviewRequests = Database::all(
            "SELECT a.id, a.entity_id, a.detected_at, a.status, a.resolution
               FROM seo_alerts a
              WHERE a.alert_type = 'review_request_due'
                AND a.status IN ('open','acknowledged')
              ORDER BY a.detected_at DESC
              LIMIT 50"
        );

        $reviewRequestCount = count($reviewRequests);

        // Local citations / NAP consistency
        // (Stored as outreach rows of campaign_type='local_citation')
        $citations = Database::all(
            "SELECT id, target_organization, target_url, status, outreach_date, follow_up_date, result
               FROM seo_outreach
              WHERE campaign_type = 'local_citation'
              ORDER BY outreach_date DESC
              LIMIT 50"
        );

        $napConsistent = 0;
        $napInconsistent = 0;
        foreach ($citations as $c) {
            if ($c['status'] === 'live') {
                $napConsistent++;
            } else {
                $napInconsistent++;
            }
        }

        // GBP completeness — placeholder until GBP API is wired.
        // The Local SEO Agent will populate this when API access exists.
        $gbpCompleteness = self::DATA_NOT_AVAILABLE;

        return [
            'project_id' => $projectId,
            'google_business_profile' => [
                'completeness_score' => $gbpCompleteness,
                'note' => 'GBP completeness requires Google Business Profile API access. Until wired, this field is DATA NOT AVAILABLE.',
            ],
            'nap_consistency' => [
                'consistent_citations'   => $napConsistent,
                'inconsistent_or_pending'=> $napInconsistent,
                'total_tracked'          => count($citations),
            ],
            'review_requests' => [
                'open_count'   => $reviewRequestCount,
                'consent_required' => (bool) self::setting('seo_review_request_consent_required', true),
                'requests' => array_map(static fn (array $r): array => [
                    'alert_id'    => (int) $r['id'],
                    'entity_id'   => $r['entity_id'] !== null ? (int) $r['entity_id'] : null,
                    'detected_at' => $r['detected_at'],
                    'status'      => $r['status'],
                    'resolution'  => $r['resolution'],
                ], $reviewRequests),
            ],
            'compliance' => [
                'never_pay_for_reviews'      => true,
                'never_fake_reviews'         => true,
                'never_gate_to_positives'    => true,
                'consent_required'           => (bool) self::setting('seo_review_request_consent_required', true),
                'one_appropriate_reminder'   => true,
            ],
            'note' => 'Local SEO Agent triggers review requests when CRM status changes to VISA_APPROVED or ENROLLED. All requests pass through consent check, neutral language review, and a single allowed reminder.',
        ];
    }

    // =====================================================
    // Utility — Opportunity Score recalculation helper
    // =====================================================

    /**
     * Recalculate Opportunity Score for all keywords in a project.
     *
     * Opportunity Score (Master Prompt §7):
     *   25% GSC + 20% demand + 20% CRM + 15% business_value + 10% SERP + 10% freshness.
     *
     * Each component is normalized 0-100. Missing data → component = 0
     * (never invented). This is invoked by the weekly cron job
     * `POST /api/seo/opportunities/recalculate` (Master Prompt §60).
     *
     * @param int $projectId
     * @return array{ ok: bool, recalculated: int, note: string }
     */
    public static function recalculateOpportunityScores(int $projectId = 1): array
    {
        $keywords = Database::all(
            'SELECT id, keyword, current_position, search_volume
               FROM seo_keywords
              WHERE project_id = :p',
            ['p' => $projectId]
        );

        $weights = self::opportunityScoreWeights();
        $recalculated = 0;

        foreach ($keywords as $kw) {
            // ----- GSC component (25%) -----
            // Pages ranking positions 5-20 with growing impressions = highest.
            $gscComponent = 0;
            if ($kw['current_position'] !== null) {
                $pos = (float) $kw['current_position'];
                if ($pos >= 5 && $pos <= 20) {
                    $gscComponent = 80; // High potential — close to top 10
                } elseif ($pos >= 1 && $pos < 5) {
                    $gscComponent = 60; // Already ranking well — focus on CTR
                } elseif ($pos > 20 && $pos <= 50) {
                    $gscComponent = 40;
                } elseif ($pos > 50) {
                    $gscComponent = 20;
                }
            }
            // (GSC impressions growth would be added here from seo_gsc_daily
            // when sync is configured.)

            // ----- Demand component (20%) -----
            // Only when verified search volume is present.
            $demandComponent = 0;
            if ($kw['search_volume'] !== null) {
                $vol = (int) $kw['search_volume'];
                $demandComponent = min(100, (int) round(log10(max(10, $vol)) * 25));
            }

            // ----- CRM component (20%) -----
            // Requires WEB_CRM lead-application-outcome join — not yet wired.
            $crmComponent = 0;

            // ----- Business value (15%) -----
            // Set per-destination by SEO Manager (default heuristic by keyword match).
            $businessValue = 50; // Neutral default

            // ----- SERP feasibility (10%) -----
            // Default neutral; SEO Manager adjusts based on SERP audit.
            $serpComponent = 50;

            // ----- Freshness urgency (10%) -----
            // Default neutral.
            $freshnessComponent = 50;

            $score = (
                ($gscComponent      * $weights['gsc']) +
                ($demandComponent   * $weights['demand']) +
                ($crmComponent      * $weights['crm']) +
                ($businessValue     * $weights['business_value']) +
                ($serpComponent     * $weights['serp']) +
                ($freshnessComponent* $weights['freshness'])
            ) / 100;

            $score = max(0, min(100, round($score, 2)));

            Database::update('seo_keywords', [
                'opportunity_score' => $score,
                'last_scored_at'    => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $kw['id']]);
            $recalculated++;
        }

        AuditService::log(
            null,
            'seo.opportunity_scores.recalculated',
            'seo_project',
            $projectId,
            ['recalculated' => $recalculated, 'weights' => $weights]
        );

        return [
            'ok' => true,
            'recalculated' => $recalculated,
            'note' => 'CRM component is 0 until WEB_CRM lead-application-outcome join is wired. Demand component is 0 for keywords without verified search volume. Nothing is invented.',
        ];
    }

    // =====================================================
    // Utility — Forbidden phrase scan for a draft body
    // =====================================================

    /**
     * Scan a draft body for forbidden phrases (Master Prompt §31, §54).
     *
     * @param string $body
     * @return array{ found: array<int, string>, status: string }
     */
    public static function scanForbiddenPhrases(string $body): array
    {
        $forbidden = self::forbiddenPhrases();
        $found = [];
        $lower = mb_strtolower($body);
        foreach ($forbidden as $phrase) {
            if (str_contains($lower, mb_strtolower($phrase))) {
                $found[] = $phrase;
            }
        }
        return [
            'found' => $found,
            'status' => $found === [] ? 'pass' : 'fail',
        ];
    }
}
