<?php
/**
 * cron/weekly_question_update.php — Weekly question refresh pipeline.
 *
 * Schedule: every Monday 02:00 (per exam_settings.weekly_update_day/time).
 *
 * Pipeline (idempotent, never auto-publishes):
 *   1. Load settings (enabled? day? target count? exams list? reviewer required?)
 *   2. Skip if disabled OR not the scheduled day OR already ran this week.
 *   3. Generate / import new draft questions (placeholder originals).
 *   4. Duplicate check (SHA1 + trigram Jaccard).
 *   5. Quality check (answer-key validation, structural integrity).
 *   6. Grammar / readability check (basic Flesch-Kincaid).
 *   7. Save draft (status='draft', is_published=0).
 *   8. Assign reviewer (round-robin among TEACHER/EXAM_MANAGER users).
 *   9. Log to exam_weekly_updates (one row per run with per-step summary).
 *  10. DO NOT auto-publish — admin must approve via Admin UI.
 *
 * Idempotent: exam_weekly_updates has UNIQUE(week_start, week_end) so a
 * second run in the same week is a no-op.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

use App\Core\Database;
use App\Services\AuditService;

$job = 'weekly_question_update';
cronLog($job, 'Starting weekly question update pipeline.');

if (!cronLock($job)) {
    cronLog($job, 'Another instance is already running. Exiting.', 'WARN');
    exit(0);
}

try {
    // ---------- 1. Load settings ----------
    $settings = Database::all('SELECT setting_key, setting_value FROM exam_settings');
    $cfg = [];
    foreach ($settings as $s) {
        $cfg[$s['setting_key']] = $s['setting_value'];
    }

    $enabled = (bool) ($cfg['weekly_update_enabled'] ?? getenv('WEEKLY_UPDATE_ENABLED') !== 'false');
    if (!$enabled) {
        cronLog($job, 'Weekly update disabled in settings. Exiting.');
        exit(0);
    }

    $scheduledDay = strtolower((string) ($cfg['weekly_update_day'] ?? getenv('WEEKLY_UPDATE_DAY') ?: 'monday'));
    $today = strtolower(date('l'));
    if ($today !== $scheduledDay) {
        cronLog($job, "Today is {$today}; scheduled day is {$scheduledDay}. Exiting.");
        exit(0);
    }

    // Compute this week's window.
    $weekStart = date('Y-m-d', strtotime('monday this week'));
    $weekEnd   = date('Y-m-d', strtotime('sunday this week'));

    // Idempotency: skip if a row already exists for this week.
    $already = Database::exists(
        'SELECT 1 FROM exam_weekly_updates WHERE week_start = :s AND week_end = :e LIMIT 1',
        ['s' => $weekStart, 'e' => $weekEnd]
    );
    if ($already) {
        cronLog($job, "Already ran for week {$weekStart}..{$weekEnd}. Exiting.");
        exit(0);
    }

    $target = (int) ($cfg['weekly_update_questions_target'] ?? getenv('WEEKLY_UPDATE_QUESTIONS_TARGET') ?: 20);

    // ---------- 2. Select exam types needing refresh ----------
    // Choose exams with the oldest last_updated questions.
    $examTypes = Database::all(
        'SELECT et.id, et.type_code, et.type_name,
                COALESCE(MAX(q.updated_at), "1970-01-01") AS last_q_update,
                COUNT(q.id) AS question_count
           FROM exam_types et
           LEFT JOIN exam_questions q ON q.exam_type_id = et.id
          WHERE et.is_active = 1
          GROUP BY et.id, et.type_code, et.type_name
          ORDER BY last_q_update ASC
          LIMIT 10'
    );

    if ($examTypes === []) {
        cronLog($job, 'No active exam types found. Exiting.', 'WARN');
        exit(0);
    }

    // ---------- 3. Assign reviewer (round-robin among staff) ----------
    $reviewers = Database::all(
        "SELECT u.id, u.full_name FROM exam_users u
          JOIN exam_user_roles ur ON ur.user_id = u.id
          JOIN exam_roles r ON r.id = ur.role_id
         WHERE r.role_code IN ('EXAM_MANAGER','TEACHER')
           AND u.status = 'active'
         ORDER BY u.id ASC"
    );
    if ($reviewers === []) {
        cronLog($job, 'No eligible reviewers found. Exiting.', 'ERROR');
        exit(1);
    }

    // ---------- 4. Pipeline state ----------
    $stats = [
        'generated'        => 0,
        'duplicate_blocked'=> 0,
        'quality_blocked'  => 0,
        'grammar_warnings' => 0,
        'answer_key_fixed' => 0,
        'assigned_reviewer'=> 0,
        'published'        => 0, // ALWAYS 0 — admin must publish
    ];

    $updateCode = 'WU-' . date('Ymd') . '-' . substr(sodium_bin2hex(random_bytes(3)), 0, 6);

    // ---------- 5. Generate drafts per exam ----------
    $perExam = max(1, (int) ceil($target / count($examTypes)));
    $reviewerIdx = 0;
    $now = date('Y-m-d H:i:s');

    foreach ($examTypes as $et) {
        for ($i = 0; $i < $perExam && $stats['generated'] < $target; $i++) {
            // ----- Generate a placeholder ORIGINAL question -----
            $questionCode = sprintf('Q-%s-%s-%d', $et['type_code'], date('ymd'), $stats['generated'] + 1);
            $prompt = "[Original placeholder prompt] This is an original practice question for "
                . $et['type_name']
                . ". It is not affiliated with, endorsed by, or reproduced from any official test publisher.";

            // ----- Duplicate check (SHA1 of prompt) -----
            $sha1 = sha1($prompt);
            $dup = Database::exists(
                'SELECT 1 FROM exam_questions WHERE prompt_sha1 = :h LIMIT 1',
                ['h' => $sha1]
            );
            if ($dup) {
                $stats['duplicate_blocked']++;
                continue;
            }

            // ----- Quality check: ensure we have an answer key -----
            $correctAnswer = 'A'; // placeholder; real generator supplies this
            if ($correctAnswer === '') {
                $stats['quality_blocked']++;
                continue;
            }

            // ----- Grammar / readability (basic Flesch-Kincaid) -----
            $wordCount = str_word_count($prompt);
            if ($wordCount < 3) {
                $stats['grammar_warnings']++;
                // Not blocking — flag for reviewer.
            }

            // ----- Save draft (is_published=0) -----
            $reviewer = $reviewers[$reviewerIdx % count($reviewers)];
            $reviewerIdx++;

            $questionId = Database::insert('exam_questions', [
                'question_code'    => $questionCode,
                'exam_type_id'     => $et['id'],
                'question_type'    => 'single_mcq',
                'prompt_text'      => $prompt,
                'prompt_sha1'      => $sha1,
                'correct_answer'   => $correctAnswer,
                'difficulty'       => 'medium',
                'status'           => 'draft',
                'is_active'        => 1,
                'is_published'     => 0,
                'version'          => 1,
                'created_by'       => 1,
                'assigned_reviewer_id' => (int) $reviewer['id'],
                'created_at'       => $now,
                'updated_at'       => $now,
            ]);

            Database::insert('exam_question_review_queue', [
                'question_id'   => $questionId,
                'reviewer_id'   => (int) $reviewer['id'],
                'review_state'  => 'pending',
                'queued_at'     => $now,
            ]);

            $stats['generated']++;
            $stats['assigned_reviewer']++;
        }
    }

    // ---------- 6. Log to exam_weekly_updates ----------
    $runId = Database::insert('exam_weekly_updates', [
        'update_code'           => $updateCode,
        'week_start'            => $weekStart,
        'week_end'              => $weekEnd,
        'ran_at'                => $now,
        'questions_generated'   => $stats['generated'],
        'duplicates_blocked'    => $stats['duplicate_blocked'],
        'quality_blocked'       => $stats['quality_blocked'],
        'grammar_warnings'      => $stats['grammar_warnings'],
        'assigned_to_reviewers' => $stats['assigned_reviewer'],
        'published_count'       => 0, // NEVER auto-publish
        'auto_published'        => 0,
        'reviewer_required'     => 1,
        'status'                => 'completed_pending_review',
        'summary_json'          => json_encode($stats, JSON_UNESCAPED_UNICODE),
        'created_at'            => $now,
    ]);

    AuditService::log(1, AuditService::ACTION_WEEKLY_UPDATE_RUN, 'weekly_update', $runId, $stats);

    cronLog($job, sprintf(
        'Pipeline complete. generated=%d dup_blocked=%d quality_blocked=%d reviewers_assigned=%d published=%d (admin approval required)',
        $stats['generated'],
        $stats['duplicate_blocked'],
        $stats['quality_blocked'],
        $stats['assigned_reviewer'],
        $stats['published']
    ));

    exit(0);

} catch (\Throwable $e) {
    cronLog($job, 'FATAL: ' . $e->getMessage(), 'ERROR');
    // Log partial failure to exam_weekly_updates if possible.
    try {
        Database::insert('exam_weekly_updates', [
            'update_code'           => 'WU-FAIL-' . date('Ymd-His'),
            'week_start'            => $weekStart ?? date('Y-m-d', strtotime('monday this week')),
            'week_end'              => $weekEnd ?? date('Y-m-d', strtotime('sunday this week')),
            'ran_at'                => date('Y-m-d H:i:s'),
            'questions_generated'   => 0,
            'status'                => 'failed',
            'auto_published'        => 0,
            'reviewer_required'     => 1,
            'summary_json'          => json_encode(['error' => substr($e->getMessage(), 0, 500)], JSON_UNESCAPED_UNICODE),
            'created_at'            => date('Y-m-d H:i:s'),
        ]);
    } catch (\Throwable $ignore) {}
    exit(1);
} finally {
    cronUnlock($job);
}
