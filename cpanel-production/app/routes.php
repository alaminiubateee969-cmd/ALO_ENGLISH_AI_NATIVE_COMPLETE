<?php
/**
 * app/routes.php — Route table for the ALO English Test Platform.
 *
 * Every portal route is registered here with the appropriate middleware:
 *   - 'auth'         — require a logged-in user (any role)
 *   - 'csrf'         — verify CSRF token on POST/PUT/DELETE
 *   - 'role:ADMIN'   — require a specific role
 *   - 'permission:english.x.y' — require a specific permission
 *
 * Public routes have NO auth middleware.
 * API routes use a separate API-key middleware (CRM service account).
 * All API responses are JSON; portal responses render views or redirect.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

use App\Core\Router;
use App\Controllers\AdminController;
use App\Controllers\AmbassadorController;
use App\Controllers\AuthController;
use App\Controllers\CRMIntegrationController;
use App\Controllers\ExaminerController;
use App\Controllers\MockTestController;
use App\Controllers\PublicController;
use App\Controllers\StudentController;
use App\Middleware\AuthMiddleware;
use App\Middleware\CSRFMiddleware;
use App\Middleware\PermissionMiddleware;
use App\Middleware\RoleMiddleware;
use App\Middleware\CrmApiMiddleware;

return function (Router $r): void {

    // -----------------------------------------------------------------
    // Public routes — no auth
    // -----------------------------------------------------------------
    $r->get('/',              [PublicController::class, 'index']);
    $r->get('/login',         [PublicController::class, 'login']);
    $r->get('/register',      [PublicController::class, 'register']);
    $r->get('/tests',         [PublicController::class, 'tests']);
    $r->get('/mock-tests',    [PublicController::class, 'mockTests']);
    $r->get('/pricing',       [PublicController::class, 'pricing']);
    $r->get('/ambassador',    [PublicController::class, 'ambassador']);
    $r->get('/contact',       [PublicController::class, 'contact']);
    $r->post('/contact',      [PublicController::class, 'contactSubmit']);
    $r->get('/privacy',       [PublicController::class, 'privacy']);
    $r->get('/terms',         [PublicController::class, 'terms']);
    $r->get('/exam-disclaimer', [PublicController::class, 'examDisclaimer']);
    $r->get('/how-exams-work',  [PublicController::class, 'howExamsWork']);
    $r->get('/computer-based-exams', [PublicController::class, 'computerBasedExams']);

    // Exam landing pages (one per exam_type)
    $r->get('/ielts',     [PublicController::class, 'examPage']);
    $r->get('/pte',       [PublicController::class, 'examPage']);
    $r->get('/toefl',     [PublicController::class, 'examPage']);
    $r->get('/duolingo',  [PublicController::class, 'examPage']);
    $r->get('/oet',       [PublicController::class, 'examPage']);
    $r->get('/languagecert', [PublicController::class, 'examPage']);
    $r->get('/linguaskill',  [PublicController::class, 'examPage']);
    $r->get('/oietc',     [PublicController::class, 'examPage']);
    $r->get('/toeic',     [PublicController::class, 'examPage']);
    $r->get('/cambridge', [PublicController::class, 'examPage']);
    $r->get('/sat',       [PublicController::class, 'examPage']);
    $r->get('/gre',       [PublicController::class, 'examPage']);
    $r->get('/gmat',      [PublicController::class, 'examPage']);
    $r->get('/lsat',      [PublicController::class, 'examPage']);
    $r->get('/mcat',      [PublicController::class, 'examPage']);
    $r->get('/act',       [PublicController::class, 'examPage']);
    $r->get('/visa',      [PublicController::class, 'examPage']);

    // -----------------------------------------------------------------
    // Auth — login/logout/register/password reset
    // -----------------------------------------------------------------
    $r->post('/auth/login',    [AuthController::class, 'login'],   ['csrf']);
    $r->post('/auth/register', [AuthController::class, 'register'],['csrf']);
    $r->post('/auth/logout',   [AuthController::class, 'logout'],  ['auth', 'csrf']);
    $r->get('/auth/logout',    [AuthController::class, 'logout'],  ['auth']);
    $r->get('/password/reset', [AuthController::class, 'passwordResetRequest']);
    $r->post('/password/reset', [AuthController::class, 'passwordResetRequest'], ['csrf']);
    $r->get('/password/reset/{token}', [AuthController::class, 'passwordResetConfirm']);
    $r->post('/password/reset/{token}', [AuthController::class, 'passwordResetConfirm'], ['csrf']);
    $r->get('/activate/{token}', [AuthController::class, 'activateAccount']);

    // -----------------------------------------------------------------
    // Student portal
    // -----------------------------------------------------------------
    $r->group('/student', ['auth', 'permission:english.own_tests.take'], function (Router $r): void {
        $r->get('',                 [StudentController::class, 'dashboard']);
        $r->get('/',                [StudentController::class, 'dashboard']);
        $r->get('/dashboard',       [StudentController::class, 'dashboard']);
        $r->get('/tests',           [StudentController::class, 'tests']);
        $r->get('/start-test/{setId}', [StudentController::class, 'startTest']);
        $r->get('/attempt/{attemptId}', [StudentController::class, 'attempt']);
        $r->get('/results',         [StudentController::class, 'results']);
        $r->get('/results/{attemptId}', [StudentController::class, 'resultDetail']);
        $r->get('/vouchers',        [StudentController::class, 'vouchers']);
        $r->get('/practice-feedback/{attemptId}', [StudentController::class, 'practiceFeedback']);
        $r->get('/study-plan',      [StudentController::class, 'studyPlan']);
        $r->get('/messages',        [StudentController::class, 'messages']);
        $r->post('/messages',       [StudentController::class, 'sendMessage'], ['csrf']);
        $r->get('/book-assessment', [StudentController::class, 'bookAssessment']);
        $r->post('/book-assessment', [StudentController::class, 'bookAssessmentSubmit'], ['csrf']);
        $r->get('/settings',        [StudentController::class, 'settings']);
        $r->post('/settings',       [StudentController::class, 'settingsSave'], ['csrf']);
    });

    // Mock test engine (AJAX / form)
    $r->group('/mock-test', ['auth', 'permission:english.own_tests.take'], function (Router $r): void {
        $r->post('/start',           [MockTestController::class, 'startAttempt'],  ['csrf']);
        $r->post('/save-answer',     [MockTestController::class, 'saveAnswer'],    ['csrf']);
        $r->post('/submit',          [MockTestController::class, 'submitAttempt'], ['csrf']);
        $r->get('/result/{attemptId}', [MockTestController::class, 'getResult']);
        $r->get('/report/{attemptId}',   [MockTestController::class, 'downloadReport']);
    });

    // -----------------------------------------------------------------
    // Admin portal
    // -----------------------------------------------------------------
    $r->group('/admin', ['auth', 'role:ADMIN,SUPER_ADMIN,EXAM_MANAGER,TEACHER,SUPPORT_STAFF,VIEWER'], function (Router $r): void {
        $r->get('',                 [AdminController::class, 'dashboard']);
        $r->get('/',                [AdminController::class, 'dashboard']);
        $r->get('/dashboard',       [AdminController::class, 'dashboard']);
        $r->get('/students',        [AdminController::class, 'students'],        ['permission:english.students.manage']);
        $r->get('/exam-types',      [AdminController::class, 'examTypes'],       ['permission:english.tests.manage']);
        $r->get('/modules',         [AdminController::class, 'modules'],         ['permission:english.tests.manage']);
        $r->get('/questions',       [AdminController::class, 'questions'],       ['permission:english.questions.manage']);
        $r->get('/question-bank',   [AdminController::class, 'questionBank'],    ['permission:english.questions.manage']);
        $r->get('/mock-tests',      [AdminController::class, 'mockTests'],       ['permission:english.mock_tests.manage']);
        $r->get('/attempts',        [AdminController::class, 'attempts'],        ['permission:english.results.manage']);
        $r->get('/scores',          [AdminController::class, 'scores'],          ['permission:english.results.manage']);
        $r->get('/vouchers',        [AdminController::class, 'vouchers'],        ['permission:english.vouchers.manage']);
        $r->get('/quota',           [AdminController::class, 'quota'],           ['permission:english.vouchers.manage']);
        $r->get('/leads',           [AdminController::class, 'leads'],           ['permission:english.students.manage']);
        $r->get('/crm-sync',        [AdminController::class, 'crmSync'],         ['permission:english.crm_sync.manage']);
        $r->get('/marketing',       [AdminController::class, 'marketing'],       ['permission:english.ambassadors.manage']);
        $r->get('/audit-logs',      [AdminController::class, 'auditLogs'],       ['permission:english.audit.view']);
        $r->get('/settings',        [AdminController::class, 'settings'],        ['permission:english.settings.manage']);
        $r->post('/settings',       [AdminController::class, 'settingsSave'],    ['permission:english.settings.manage', 'csrf']);
        $r->get('/exam-conduct',    [AdminController::class, 'examConduct'],     ['permission:english.tests.manage']);
        $r->get('/weekly-updates',  [AdminController::class, 'weeklyUpdates'],   ['permission:english.questions.manage']);
        $r->post('/weekly-updates/run', [AdminController::class, 'runWeeklyUpdate'], ['permission:english.questions.manage', 'csrf']);
    });

    // -----------------------------------------------------------------
    // Examiner portal
    // -----------------------------------------------------------------
    $r->group('/examiner', ['auth', 'role:EXAMINER,ADMIN,SUPER_ADMIN'], function (Router $r): void {
        $r->get('',                 [ExaminerController::class, 'dashboard']);
        $r->get('/',                [ExaminerController::class, 'dashboard']);
        $r->get('/dashboard',       [ExaminerController::class, 'dashboard']);
        $r->get('/writing-queue',   [ExaminerController::class, 'writingQueue'], ['permission:english.writing.review']);
        $r->get('/speaking-queue',  [ExaminerController::class, 'speakingQueue'],['permission:english.speaking.review']);
        $r->get('/reviews',         [ExaminerController::class, 'reviews'],      ['permission:english.writing.review']);
        $r->post('/reviews/{id}/submit', [ExaminerController::class, 'submitReview'], ['permission:english.writing.review', 'csrf']);
        $r->get('/reports',         [ExaminerController::class, 'reports'],      ['permission:english.results.manage']);
    });

    // -----------------------------------------------------------------
    // Ambassador portal
    // -----------------------------------------------------------------
    $r->group('/ambassador', ['auth', 'role:AMBASSADOR,ADMIN,SUPER_ADMIN'], function (Router $r): void {
        $r->get('',                 [AmbassadorController::class, 'dashboard']);
        $r->get('/',                [AmbassadorController::class, 'dashboard']);
        $r->get('/dashboard',       [AmbassadorController::class, 'dashboard']);
        $r->get('/referrals',       [AmbassadorController::class, 'referrals'], ['permission:english.referrals.manage']);
        $r->get('/create-referral', [AmbassadorController::class, 'createReferral'], ['permission:english.referrals.manage']);
        $r->post('/create-referral', [AmbassadorController::class, 'storeReferral'], ['permission:english.referrals.manage', 'csrf']);
        $r->get('/students',        [AmbassadorController::class, 'students'], ['permission:english.referrals.manage']);
        $r->get('/vouchers',        [AmbassadorController::class, 'vouchers'], ['permission:english.referrals.manage']);
        $r->get('/commission',      [AmbassadorController::class, 'commission'], ['permission:english.referrals.manage']);
        $r->get('/reports',         [AmbassadorController::class, 'reports'], ['permission:english.referrals.manage']);
        $r->get('/marketing-kit',   [AmbassadorController::class, 'marketingKit'], ['permission:english.referrals.manage']);
    });

    // -----------------------------------------------------------------
    // Public API endpoints
    // -----------------------------------------------------------------
    $r->get('/api/health', [PublicController::class, 'health']);
    $r->post('/api/lead',  [PublicController::class, 'submitLead'], ['csrf']);
    $r->get('/api/quota',  [PublicController::class, 'quotaStatus']);

    // -----------------------------------------------------------------
    // CRM integration endpoints (server-to-server, API key required)
    // -----------------------------------------------------------------
    $r->group('/api/alo-crm', ['crm_api'], function (Router $r): void {
        $r->get('/health',           [CRMIntegrationController::class, 'health']);
        $r->post('/sync-student',    [CRMIntegrationController::class, 'syncStudent']);
        $r->post('/check-eligibility', [CRMIntegrationController::class, 'checkEligibility']);
        $r->post('/push-result',     [CRMIntegrationController::class, 'pushResult']);
        $r->post('/push-voucher-usage', [CRMIntegrationController::class, 'pushVoucherUsage']);
        $r->post('/push-feedback',   [CRMIntegrationController::class, 'pushFeedback']);
        $r->post('/push-message',    [CRMIntegrationController::class, 'pushMessage']);
        $r->post('/referral-lead',   [CRMIntegrationController::class, 'referralLead']);
    });
};
