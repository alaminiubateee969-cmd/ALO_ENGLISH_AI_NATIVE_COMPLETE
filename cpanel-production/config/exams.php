<?php
/**
 * config/exams.php — Exam catalog, scoring, quota, uploads, weekly update.
 *
 * All free-quota values are also written to the `exam_settings` table
 * during seeding; the QuotaService reads from the DB at runtime so admins
 * can change them without a deploy. These values are the fallback defaults.
 * PHP 8.2+.
 */

declare(strict_types=1);

return [
    // ---------- Free Quota (backend-enforced) ----------
    'free_quota' => [
        'alo_student'           => (int)(getenv('FREE_QUOTA_ALO_STUDENT') ?: 3),
        'public_student'        => (int)(getenv('FREE_QUOTA_PUBLIC_STUDENT') ?: 1),
        'partner_student'       => (int)(getenv('FREE_QUOTA_PARTNER_STUDENT') ?: 2),
        'ambassador_referred'   => (int)(getenv('FREE_QUOTA_AMBASSADOR_REFERRED') ?: 2),
    ],

    // ---------- Exam categories ----------
    // Maps to exam_categories rows seeded in install.sql.
    'categories' => [
        ['code' => 'english',        'name' => 'English Proficiency',      'count' => 11],
        ['code' => 'study-abroad',   'name' => 'Study Abroad Entrance',    'count' => 6],
        ['code' => 'university',     'name' => 'University Internal',      'count' => 5],
        ['code' => 'visa',           'name' => 'Visa / Interview',         'count' => 5],
        ['code' => 'alo-internal',   'name' => 'ALO Internal',             'count' => 5],
    ],

    // ---------- Exam catalog (32 exams) ----------
    // type_code => display label. See exam_types table for full canonical list.
    'exam_types' => [
        // English Proficiency (11)
        'IELTS', 'IELTS_GENERAL', 'PTE', 'TOEFL', 'DUOLINGO',
        'OET', 'LANGUAGECERT', 'LINGUASKILL', 'OIETC', 'TOEIC', 'CAMBRIDGE',
        // Study Abroad Entrance (6)
        'SAT', 'GRE', 'GMAT', 'LSAT', 'MCAT', 'ACT',
        // University Internal (5)
        'UNI_EPT_A', 'UNI_EPT_B', 'UNI_EPT_C', 'UNI_EPT_D', 'UNI_EPT_E',
        // Visa / Interview (5)
        'VISA_US', 'VISA_UK', 'VISA_CA', 'VISA_AU', 'VISA_SCHENGEN',
        // ALO Internal (5)
        'ALO_DIAGNOSTIC', 'ALO_PLACEMENT', 'ALO_PROGRESS', 'ALO_ENDTERM', 'ALO_EXIT',
    ],

    // ---------- Scoring rules defaults ----------
    'scoring' => [
        'default_pass_percent'   => 60,
        'allow_partial_credit'   => true,
        'negative_marking'       => false,
        'negative_mark_ratio'    => 0.25, // when enabled
        'round_to'               => 2,
        // Estimators per scoring style.
        'styles' => [
            'band'     => ['min' => 0, 'max' => 9,    'step' => 0.5],
            'scaled'   => ['min' => 200, 'max' => 800, 'step' => 1],
            'percent'  => ['min' => 0, 'max' => 100,  'step' => 0.1],
            'rubric'   => ['min' => 0, 'max' => 5,    'step' => 0.5],
            'cefr'     => ['levels' => ['A1','A2','B1','B2','C1','C2']],
        ],
        // CEFR mapping for English proficiency exams (approximate).
        'cefr_map' => [
            'IELTS'    => ['4.0'=>'B1','5.0'=>'B1','5.5'=>'B2','6.5'=>'C1','8.0'=>'C2'],
            'TOEFL'    => ['42'=>'B1','72'=>'B2','95'=>'C1','114'=>'C2'],
            'PTE'      => ['30'=>'B1','43'=>'B2','59'=>'C1','76'=>'C2'],
            'DUOLINGO' => ['60'=>'B1','90'=>'B2','115'=>'C1','140'=>'C2'],
        ],
    ],

    // ---------- Practice disclaimer (canonical wording) ----------
    // Shown on every practice set, exam landing page, score report.
    'practice_disclaimer' => 'This is an original practice set created by ALO English Test Platform. '
        . 'It is not affiliated with, endorsed by, or reproduced from any official test publisher. '
        . 'Items will not appear in any real exam and are for practice only. '
        . 'Practice exam only. Estimated score only. Not official exam result. '
        . 'No guarantee that questions will appear in real exam.',

    'attempts_disclaimer' => 'Mock attempts are practice only and do not represent official scores. '
        . 'Use the Smart Score Report to identify weak areas and plan further study.',

    'certificates_disclaimer' => 'Any certificate issued by the ALO English Test Platform is a '
        . 'practice-completion certificate only and is not recognized by any official testing body.',

    // ---------- Uploads ----------
    'uploads' => [
        'document' => [
            'max_size_mb' => (int)(getenv('UPLOAD_DOCUMENT_MAX_MB') ?: 10),
            'allowed_mimes' => ['application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain', 'image/png', 'image/jpeg', 'image/webp'],
            'allowed_extensions' => ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'webp'],
        ],
        'audio' => [
            'max_size_mb' => (int)(getenv('UPLOAD_AUDIO_MAX_MB') ?: 50),
            'allowed_mimes' => ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4'],
            'allowed_extensions' => ['mp3', 'wav', 'webm', 'ogg', 'm4a'],
        ],
        'video' => [
            'max_size_mb' => (int)(getenv('UPLOAD_VIDEO_MAX_MB') ?: 100),
            'allowed_mimes' => ['video/mp4', 'video/webm', 'video/quicktime'],
            'allowed_extensions' => ['mp4', 'webm', 'mov'],
        ],
        // Where files are stored (OUTSIDE the web root).
        'storage_root' => getenv('STORAGE_PATH') ?: '/home/aloeduca/alo-english-platform/storage',
    ],

    // ---------- Weekly update defaults ----------
    'weekly_update' => [
        'enabled'              => getenv('WEEKLY_UPDATE_ENABLED') !== 'false',
        'day'                  => (string)(getenv('WEEKLY_UPDATE_DAY') ?: 'monday'),
        'time'                 => (string)(getenv('WEEKLY_UPDATE_TIME') ?: '02:00'),
        'questions_target'     => (int)(getenv('WEEKLY_UPDATE_QUESTIONS_TARGET') ?: 20),
        'auto_publish'         => getenv('WEEKLY_UPDATE_AUTO_PUBLISH') === 'true', // STRONGLY false
        'reviewer_required'    => getenv('WEEKLY_UPDATE_REVIEWER_REQUIRED') !== 'false',
        'stale_days'           => 180,
        'publish_threshold'    => 15, // minimum approved count before publish is allowed
    ],

    // ---------- CRM sync ----------
    'crm' => [
        'enabled'        => getenv('ALO_CRM_SYNC_ENABLED') !== 'false',
        'base_url'       => (string)(getenv('ALO_CRM_BASE_URL') ?: ''),
        'api_key'        => (string)(getenv('ALO_CRM_API_KEY') ?: ''),
        'timeout'        => (int)(getenv('ALO_CRM_SYNC_TIMEOUT_SECONDS') ?: 20),
        'max_retries'    => (int)(getenv('ALO_CRM_SYNC_MAX_RETRIES') ?: 3),
    ],

    // ---------- Payments ----------
    'payments' => [
        'gateway'         => (string)(getenv('PAYMENT_GATEWAY_DEFAULT') ?: 'stripe'),
        'attempt_price'   => (float)(getenv('PAID_ATTEMPT_PRICE_USD') ?: 9.00),
        'stripe_secret'   => (string)(getenv('STRIPE_SECRET_KEY') ?: ''),
        'stripe_webhook'  => (string)(getenv('STRIPE_WEBHOOK_SECRET') ?: ''),
    ],

    // ---------- AI / Practice feedback ----------
    'ai' => [
        'enabled'        => getenv('AI_ENABLED') !== 'false',
        'feedback_enabled' => getenv('PRACTICE_FEEDBACK_ENABLED') !== 'false',
        'default_provider' => (string)(getenv('AI_DEFAULT_PROVIDER') ?: 'openrouter'),
        'providers' => [
            'openrouter'   => (string)(getenv('OPENROUTER_API_KEY') ?: ''),
            'gemini'       => (string)(getenv('GEMINI_API_KEY') ?: ''),
            'groq'         => (string)(getenv('GROQ_API_KEY') ?: ''),
            'huggingface'  => (string)(getenv('HUGGINGFACE_API_KEY') ?: ''),
        ],
        'timeout'        => (int)(getenv('AI_REQUEST_TIMEOUT_SECONDS') ?: 30),
    ],
];
