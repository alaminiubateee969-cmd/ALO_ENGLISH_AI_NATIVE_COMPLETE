<?php
/**
 * app/Services/DigitalProctorService.php — Anti-cheat event log + integrity.
 *
 * Logs proctoring events (tab switch, pause, resume, refresh, window blur)
 * to `exam_proctor_logs` AND mirrors each event to `exam_ai_agent_logs`
 * through the AGENT-PROCTOR-01 employee (so the agent workforce has a
 * unified operational trail).
 *
 * Severity is inferred from event type + frequency:
 *   - info: pause, resume, proctor_start, refresh (single)
 *   - warning: tab_switch, window_blur, repeated refresh
 *   - critical: flagged suspicion, multi-tab pattern
 *
 * Public-facing label is "Digital Practice Session" — never "AI proctor".
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

final class DigitalProctorService
{
    public const EVENT_TAB_SWITCH    = 'tab_switch';
    public const EVENT_PAUSE         = 'pause';
    public const EVENT_RESUME        = 'resume';
    public const EVENT_REFRESH       = 'refresh';
    public const EVENT_WINDOW_BLUR   = 'window_blur';
    public const EVENT_PROCTOR_START = 'proctor_start';
    public const EVENT_FLAG          = 'flag_suspicious';

    public const SEVERITY_INFO     = 'info';
    public const SEVERITY_WARNING  = 'warning';
    public const SEVERITY_CRITICAL = 'critical';

    /**
     * Log a single proctoring event.
     *
     * @param int    $attemptId
     * @param string $eventType   one of the EVENT_* constants (or custom label)
     * @param array  $details     structured JSON details (count, section, ts)
     */
    public static function logEvent(int $attemptId, string $eventType, array $details = []): void
    {
        $severity = self::inferSeverity($attemptId, $eventType, $details);
        $now = date('Y-m-d H:i:s');

        Database::insert('exam_proctor_logs', [
            'attempt_id'    => $attemptId,
            'event_type'    => $eventType,
            'event_details' => json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'severity'      => $severity,
            'snapshot_path' => $details['snapshot_path'] ?? null,
            'occurred_at'   => $now,
        ]);

        // Mirror into the AI Agent operational log via AGENT-PROCTOR-01 so the
        // agent workforce has one unified trail. Never throws.
        $proctor = AiAgentEmployeeService::getAgent('AGENT-PROCTOR-01');
        if ($proctor !== null) {
            AiAgentEmployeeService::logAgent(
                (int) $proctor['id'],
                'proctor_event:' . $eventType,
                $attemptId,
                [
                    'severity' => $severity,
                    'details'  => $details,
                    'occurred_at' => $now,
                ]
            );
        }

        AuditService::log(null, 'proctor.event', 'attempt', $attemptId, [
            'event_type' => $eventType,
            'severity'   => $severity,
            'details'    => $details,
        ]);
    }

    /**
     * Build an integrity report for an attempt: counts of each event type,
     * severity totals, suspicious pattern detection, and a final integrity
     * verdict (clean / review / critical).
     *
     * @return array{
     *   attempt_id:int, events:array<string,int>, severities:array<string,int>,
     *   total_events:int, suspicious_patterns:array<int,string>,
     *   verdict:string, generated_at:string
     * }
     */
    public static function getIntegrityReport(int $attemptId): array
    {
        $rows = Database::all(
            'SELECT event_type, severity, COUNT(*) AS n
               FROM exam_proctor_logs
              WHERE attempt_id = :aid
              GROUP BY event_type, severity
              ORDER BY event_type',
            ['aid' => $attemptId]
        );

        $events = [];
        $severities = [self::SEVERITY_INFO => 0, self::SEVERITY_WARNING => 0, self::SEVERITY_CRITICAL => 0];
        $total = 0;
        foreach ($rows as $r) {
            $type = (string) $r['event_type'];
            $sev  = (string) $r['severity'];
            $n    = (int) $r['n'];
            $events[$type] = ($events[$type] ?? 0) + $n;
            if (isset($severities[$sev])) {
                $severities[$sev] += $n;
            }
            $total += $n;
        }

        $suspicious = self::detectSuspiciousPatterns($attemptId, $events);

        $verdict = 'clean';
        if ($severities[self::SEVERITY_CRITICAL] > 0 || count($suspicious) >= 2) {
            $verdict = 'critical';
        } elseif ($severities[self::SEVERITY_WARNING] >= 3 || count($suspicious) >= 1) {
            $verdict = 'review';
        }

        return [
            'attempt_id'          => $attemptId,
            'events'              => $events,
            'severities'          => $severities,
            'total_events'        => $total,
            'suspicious_patterns' => array_values($suspicious),
            'verdict'             => $verdict,
            'generated_at'        => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * Flag an attempt as suspicious. Writes a critical proctor log entry
     * and a follow-up task for the Audit Agent (AGENT-AUDIT-01).
     */
    public static function flagSuspicious(int $attemptId, string $reason): void
    {
        self::logEvent($attemptId, self::EVENT_FLAG, [
            'reason'   => $reason,
            'severity' => self::SEVERITY_CRITICAL,
        ]);

        $auditAgent = AiAgentEmployeeService::getAgent('AGENT-AUDIT-01');
        if ($auditAgent !== null) {
            AiAgentEmployeeService::createTask(
                (int) $auditAgent['id'],
                'integrity_review',
                $attemptId,
                [
                    'attempt_id' => $attemptId,
                    'reason'     => $reason,
                    'flagged_at' => date('Y-m-d H:i:s'),
                ]
            );
        }

        AuditService::log(null, 'proctor.flag_suspicious', 'attempt', $attemptId, [
            'reason' => $reason,
        ]);
    }

    // ---------- Helpers ----------

    /**
     * Infer severity for an event:
     *   - flag_suspicious        → critical
     *   - tab_switch / window_blur→ warning (escalates to critical if >5 in attempt)
     *   - refresh                 → info on first, warning if >3, critical if >10
     *   - pause / resume / start  → info
     */
    private static function inferSeverity(int $attemptId, string $eventType, array $details): string
    {
        if ($eventType === self::EVENT_FLAG) {
            return self::SEVERITY_CRITICAL;
        }
        if (in_array($eventType, [self::EVENT_TAB_SWITCH, self::EVENT_WINDOW_BLUR], true)) {
            $count = (int) Database::scalar(
                'SELECT COUNT(*) FROM exam_proctor_logs
                  WHERE attempt_id = :aid AND event_type = :t',
                ['aid' => $attemptId, 't' => $eventType]
            );
            return $count >= 5 ? self::SEVERITY_CRITICAL : self::SEVERITY_WARNING;
        }
        if ($eventType === self::EVENT_REFRESH) {
            $count = (int) Database::scalar(
                'SELECT COUNT(*) FROM exam_proctor_logs
                  WHERE attempt_id = :aid AND event_type = :t',
                ['aid' => $attemptId, 't' => $eventType]
            );
            if ($count >= 10) {
                return self::SEVERITY_CRITICAL;
            }
            if ($count >= 3) {
                return self::SEVERITY_WARNING;
            }
            return self::SEVERITY_INFO;
        }
        return self::SEVERITY_INFO;
    }

    /**
     * Detect suspicious patterns in the event counts.
     * Returns an array of human-readable pattern descriptions.
     *
     * @param array<string,int> $events
     * @return string[]
     */
    private static function detectSuspiciousPatterns(int $attemptId, array $events): array
    {
        $patterns = [];
        if (($events[self::EVENT_TAB_SWITCH] ?? 0) >= 3) {
            $patterns[] = 'repeated_tab_switching';
        }
        if (($events[self::EVENT_WINDOW_BLUR] ?? 0) >= 3) {
            $patterns[] = 'repeated_window_blur';
        }
        if (($events[self::EVENT_REFRESH] ?? 0) >= 5) {
            $patterns[] = 'excessive_refresh';
        }
        if (($events[self::EVENT_PAUSE] ?? 0) >= 10) {
            $patterns[] = 'excessive_pause';
        }
        if (($events[self::EVENT_FLAG] ?? 0) >= 1) {
            $patterns[] = 'manual_flag';
        }
        return $patterns;
    }
}
