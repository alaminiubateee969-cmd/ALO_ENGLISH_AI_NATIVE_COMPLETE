<?php
/**
 * views/public/exam-disclaimer.php — Exam disclaimer page.
 *
 * Expected vars:
 *   - $disclaimer  string  canonical practice disclaimer text
 *   - $e           callable
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$disclaimer = $disclaimer ?? 'Practice estimate only. Not official exam content.';
$title = 'Practice disclaimer';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow alo-legal">
    <header class="alo-section__head">
        <h1>Practice disclaimer</h1>
        <p>Read this before relying on any score or report from the ALO English Test Platform.</p>
    </header>

    <div class="alo-disclaimer-banner alo-disclaimer-banner--large" role="note">
        <h2>Important</h2>
        <p><?= $e($disclaimer) ?></p>
    </div>

    <h2>What this means</h2>
    <ul>
        <li>All mock tests on this Platform are <strong>original practice material</strong> written by ALO Education.</li>
        <li>They are <strong>not affiliated with, endorsed by, or reproduced from</strong> any official test publisher (IELTS, PTE, TOEFL, Duolingo, OET, College Board, ETS, GMAC, LSAC, Cambridge, etc.).</li>
        <li>Practice items <strong>will not appear</strong> in any real exam.</li>
        <li>Scores shown on Smart Score Reports are <strong>estimates only</strong>, produced by the ALO ScoringService. They are <strong>not official exam results</strong>.</li>
        <li>No guarantee is made that practice items will appear in any real exam.</li>
    </ul>

    <h2>Certificates</h2>
    <p>
        Any certificate issued by the ALO English Test Platform is a
        practice-completion certificate only and is not recognised by any
        official testing body, university, or immigration authority.
    </p>

    <h2>Using your results</h2>
    <p>
        Smart Score Reports are designed to help you identify weak areas and
        plan further study. They are <strong>not</strong> suitable as proof of
        English proficiency for university admissions, visa applications, or
        professional registration. Always book an official exam through the
        official test publisher's website when you need a certified score.
    </p>

    <h2>Free quota</h2>
    <p>
        The free mock-test quota (3 free mocks for ALO students, 1 free mock
        for public students) is enforced backend-side and shared across all 32
        CBT exams on this Platform. Creating multiple accounts to bypass the
        free quota is a breach of our <a href="/terms">Terms of Service</a>.
    </p>

    <h2>Questions?</h2>
    <p>
        If you have any questions about this disclaimer, please use the
        <a href="/contact">Contact page</a>.
    </p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
