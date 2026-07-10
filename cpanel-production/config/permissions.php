<?php
/**
 * config/permissions.php — RBAC map.
 *
 * Lists all 11 roles and all 20 permissions. Each permission maps to
 * the set of roles that hold it. The RBACService consults this array
 * (cached) to enforce access on every protected route.
 *
 * Roles (must match the seed.sql exam_roles rows):
 *   SUPER_ADMIN, ADMIN, EXAM_MANAGER, EXAMINER, TEACHER,
 *   STUDENT, PARTNER_STUDENT, AMBASSADOR,
 *   CRM_SYNC_SERVICE, SUPPORT_STAFF, VIEWER
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

return [
    // ---------- 11 Roles ----------
    'roles' => [
        'SUPER_ADMIN',
        'ADMIN',
        'EXAM_MANAGER',
        'EXAMINER',
        'TEACHER',
        'STUDENT',
        'PARTNER_STUDENT',
        'AMBASSADOR',
        'CRM_SYNC_SERVICE',
        'SUPPORT_STAFF',
        'VIEWER',
    ],

    // ---------- Role hierarchy for cascading grants ----------
    // SUPER_ADMIN implicitly holds every permission below.
    'hierarchy' => [
        'SUPER_ADMIN' => ['ADMIN'],
        'ADMIN'       => ['EXAM_MANAGER', 'EXAMINER', 'TEACHER', 'SUPPORT_STAFF', 'VIEWER'],
        'EXAM_MANAGER'=> ['TEACHER', 'VIEWER'],
    ],

    // ---------- 20 Permissions -> Roles ----------
    'permissions' => [
        // Dashboard visibility
        'english.dashboard.view' => [
            'SUPER_ADMIN', 'ADMIN', 'EXAM_MANAGER', 'EXAMINER', 'TEACHER',
            'STUDENT', 'PARTNER_STUDENT', 'AMBASSADOR', 'SUPPORT_STAFF', 'VIEWER',
        ],

        // Student management
        'english.students.manage' => ['SUPER_ADMIN', 'ADMIN', 'EXAM_MANAGER', 'SUPPORT_STAFF'],

        // Exam-type / catalog management
        'english.tests.manage' => ['SUPER_ADMIN', 'ADMIN', 'EXAM_MANAGER'],

        // Question bank
        'english.questions.manage' => ['SUPER_ADMIN', 'ADMIN', 'EXAM_MANAGER', 'TEACHER'],

        // Practice sets / mock tests
        'english.mock_tests.manage' => ['SUPER_ADMIN', 'ADMIN', 'EXAM_MANAGER'],

        // Attempt results & reports
        'english.results.manage' => ['SUPER_ADMIN', 'ADMIN', 'EXAM_MANAGER', 'EXAMINER'],

        // Examiner review queues
        'english.writing.review' => ['SUPER_ADMIN', 'ADMIN', 'EXAMINER'],
        'english.speaking.review' => ['SUPER_ADMIN', 'ADMIN', 'EXAMINER'],

        // Vouchers
        'english.vouchers.manage' => ['SUPER_ADMIN', 'ADMIN', 'EXAM_MANAGER'],

        // Ambassadors
        'english.ambassadors.manage' => ['SUPER_ADMIN', 'ADMIN'],

        // Reports
        'english.reports.view' => ['SUPER_ADMIN', 'ADMIN', 'EXAM_MANAGER', 'EXAMINER', 'SUPPORT_STAFF'],

        // AI practice feedback generation
        'english.feedback.generate' => ['SUPER_ADMIN', 'ADMIN', 'EXAM_MANAGER', 'EXAMINER', 'TEACHER'],

        // CRM sync administration
        'english.crm_sync.manage' => ['SUPER_ADMIN', 'ADMIN', 'CRM_SYNC_SERVICE'],

        // Platform settings
        'english.settings.manage' => ['SUPER_ADMIN', 'ADMIN'],

        // Audit log visibility
        'english.audit.view' => ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_STAFF'],

        // Bulk data export
        'english.data.export' => ['SUPER_ADMIN', 'ADMIN', 'EXAM_MANAGER'],

        // Self-service (students)
        'english.own_tests.take'   => ['STUDENT', 'PARTNER_STUDENT'],
        'english.own_results.view' => ['STUDENT', 'PARTNER_STUDENT'],
        'english.own_vouchers.view' => ['STUDENT', 'PARTNER_STUDENT'],

        // Ambassador self-service
        'english.referrals.manage' => ['AMBASSADOR'],
    ],

    // ---------- Per-role landing route after login ----------
    'landing_routes' => [
        'SUPER_ADMIN'      => '/admin/dashboard',
        'ADMIN'            => '/admin/dashboard',
        'EXAM_MANAGER'     => '/admin/dashboard',
        'EXAMINER'         => '/examiner/dashboard',
        'TEACHER'          => '/admin/dashboard',
        'STUDENT'          => '/student/dashboard',
        'PARTNER_STUDENT'  => '/student/dashboard',
        'AMBASSADOR'       => '/ambassador/dashboard',
        'CRM_SYNC_SERVICE' => '/admin/crm-sync',
        'SUPPORT_STAFF'    => '/admin/students',
        'VIEWER'           => '/admin/dashboard',
    ],
];
