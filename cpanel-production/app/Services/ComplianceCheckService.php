<?php
/**
 * app/Services/ComplianceCheckService.php — Compliance guard for the platform.
 *
 * Enforces the platform's compliance rules:
 *   - No claim of "real examiner", "official examiner", "official score",
 *     "AI teacher", "guaranteed real exam", "real exam common",
 *     "official exam prediction", or "human teacher".
 *   - Every practice set, score report, feedback, and interview prompt
 *     must include the canonical practice-only disclosure.
 *   - Public-facing labels must use ONLY the approved wording set:
 *       "ALO Evaluation System", "Digital Practice Session",
 *       "ALO Practice Examiner", "Practice Interview Coach",
 *       "Automated Practice Feedback", "Smart Score Report",
 *       "ALO Estimated Score Engine".
 *
 * The check methods are pure (no DB writes) so they can be called inline
 * by every other service + controller before content is rendered or
 * persisted. A failing check logs a compliance warning via AuditService
 * (when called via logAndCheck).
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

final class ComplianceCheckService
{
    /**
     * Terms that MUST NEVER appear in any student-facing content.
     * Case-insensitive substring match.
     */
    public const FORBIDDEN_TERMS = [
        'real examiner',
        'official examiner',
        'official score',
        'ai teacher',
        'guaranteed real exam',
        'real exam common',
        'official exam prediction',
        'human teacher',
    ];

    /**
     * Approved public-facing labels (the only wording that may be shown to
     * students in connection with automated evaluation). Matches the
     * `public_label` column values seeded in exam_ai_agents.
     */
    public const APPROVED_LABELS = [
        'ALO Evaluation System',
        'Digital Practice Session',
        'ALO Practice Examiner',
        'Practice Interview Coach',
        'Automated Practice Feedback',
        'Smart Score Report',
        'ALO Estimated Score Engine',
    ];

    /** The canonical disclosure text shown on the platform. */
    public const DISCLOSURE_TEXT = 'Some practice tests, scoring, feedback, and interview simulations '
        . 'may be supported by automated digital evaluation tools. '
        . 'This is a practice platform only, not an official exam result.';

    /** The canonical practice-only disclaimer appended to every report. */
    public const DISCLAIMER_TEXT = 'Practice exam only. Estimated score only. '
        . 'Not an official exam result. No guarantee that questions will appear in real exam.';

    /**
     * Scan arbitrary text for forbidden terms.
     *
     * @return array{passed:bool, violations:array<int,array{term:string,position:int}>}
     */
    public static function checkContent(string $text): array
    {
        $violations = [];
        $lower = strtolower($text);
        foreach (self::FORBIDDEN_TERMS as $term) {
            $pos = strpos($lower, strtolower($term));
            if ($pos !== false) {
                $violations[] = ['term' => $term, 'position' => $pos];
            }
        }
        return [
            'passed'     => $violations === [],
            'violations' => $violations,
        ];
    }

    /**
     * Scan a full page (HTML / mixed content) for forbidden terms. Same
     * logic as checkContent() but exposed separately so callers can attach
     * a page identifier in audit logs.
     *
     * @return array{passed:bool, violations:array<int,array{term:string,position:int}>, checked_at:string}
     */
    public static function checkPage(string $pageContent): array
    {
        $result = self::checkContent($pageContent);
        $result['checked_at'] = date('Y-m-d H:i:s');
        return $result;
    }

    /**
     * Convenience: list of approved public-facing labels. Useful for
     * rendering admin UIs that filter agent labels.
     *
     * @return string[]
     */
    public static function getApprovedLabels(): array
    {
        return self::APPROVED_LABELS;
    }

    /**
     * Convenience: list of forbidden terms.
     *
     * @return string[]
     */
    public static function getForbiddenTerms(): array
    {
        return self::FORBIDDEN_TERMS;
    }

    /**
     * The canonical disclosure text. Always shown to students wherever
     * automated evaluation is mentioned.
     */
    public static function getDisclosureText(): string
    {
        return self::DISCLOSURE_TEXT;
    }

    /**
     * Full disclaimer (disclosure + practice-only line) — the canonical
     * string to append to every report, feedback, and interview output.
     */
    public static function getDisclaimer(): string
    {
        return self::DISCLOSURE_TEXT . ' ' . self::DISCLAIMER_TEXT;
    }

    /**
     * Check a piece of content AND log a compliance warning to the audit
     * log if any violation is found. Returns the check result unchanged
     * so callers can branch on `passed`.
     *
     * @param int|null    $actorUserId  admin/system actor (nullable)
     * @param string      $context      short context label e.g. 'agent_prompt', 'score_report'
     * @param int|string|null $entityId related entity id
     */
    public static function logAndCheck(
        ?int $actorUserId,
        string $context,
        string $text,
        int|string|null $entityId = null
    ): array {
        $result = self::checkContent($text);
        if (!$result['passed']) {
            AuditService::log($actorUserId, 'compliance.violation', $context, $entityId, [
                'violations' => array_map(fn ($v) => $v['term'], $result['violations']),
                'snippet'    => mb_substr($text, 0, 200),
            ]);
        }
        return $result;
    }

    /**
     * Validate that a public-facing label is in the approved set.
     * Returns true if approved.
     */
    public static function isApprovedLabel(string $label): bool
    {
        return in_array($label, self::APPROVED_LABELS, true);
    }

    /**
     * Sanitise a label: if it is NOT in the approved set, fall back to the
     * default "ALO Evaluation System". This guarantees no agent ever leaks
     * the internal "Agent" terminology to a student.
     */
    public static function sanitizeLabel(string $label): string
    {
        return self::isApprovedLabel($label) ? $label : 'ALO Evaluation System';
    }
}
