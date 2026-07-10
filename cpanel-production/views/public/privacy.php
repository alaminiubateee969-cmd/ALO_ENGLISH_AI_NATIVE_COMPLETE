<?php
/**
 * views/public/privacy.php — Privacy policy.
 *
 * Expected vars:
 *   - $e (callable)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Privacy policy';
$updated = date('Y-m-d');
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow alo-legal">
    <header class="alo-section__head">
        <h1>Privacy policy</h1>
        <p class="alo-legal__updated">Last updated: <?= $e($updated) ?></p>
    </header>

    <h2>1. Who we are</h2>
    <p>
        ALO Education operates the ALO English Test Platform (the "Platform") at
        english.aloeducation.com. The Platform delivers original, exam-aligned
        practice mock tests for English proficiency and study-abroad entrance
        exams. All tests on the Platform are practice only — they are not
        affiliated with, endorsed by, or reproduced from any official test
        publisher.
    </p>

    <h2>2. What data we collect</h2>
    <ul>
        <li><strong>Account data:</strong> name, email address, phone number, hashed password, role, and (if provided) your ALO Student ID.</li>
        <li><strong>Practice data:</strong> attempts, answers, scores, time-on-task, and AI-generated feedback.</li>
        <li><strong>Lead data:</strong> name, email, phone, and message submitted via the contact form or public API.</li>
        <li><strong>Technical data:</strong> IP address, user agent, request timestamps, and audit log entries — retained for security and abuse prevention.</li>
    </ul>

    <h2>3. How we use your data</h2>
    <ul>
        <li>To deliver practice mock tests, score reports, and study suggestions.</li>
        <li>To enforce the free-quota limits (3 free mocks for ALO students, 1 free mock for public students) server-side.</li>
        <li>To sync your account, attempts, vouchers, and messages to ALO Web_CRM for student support and counselling.</li>
        <li>To prevent fraud, abuse, and multiple-account creation, including audit-logged rate limiting.</li>
        <li>To send essential service notifications (account activation, password reset, exam results).</li>
    </ul>

    <h2>4. CRM sync</h2>
    <p>
        Practice data is synchronised to ALO Web_CRM over an authenticated,
        API-key-protected server-to-server channel. The CRM is operated by
        ALO Education and is used exclusively for student support and
        counselling. Your data is never sold or shared with third parties for
        marketing.
    </p>

    <h2>5. Data retention</h2>
    <ul>
        <li>Account data is retained while your account is active and for up to 12 months after deletion for audit purposes.</li>
        <li>Practice attempt data is retained for the lifetime of your account, so historical score reports remain accessible.</li>
        <li>Uploaded documents (for visa or writing reviews) are stored outside the web root and are deleted after 90 days unless attached to an active submission.</li>
        <li>Audit logs are retained for 12 months.</li>
    </ul>

    <h2>6. Your rights</h2>
    <ul>
        <li><strong>Access:</strong> request a copy of your personal data via the Contact page.</li>
        <li><strong>Rectification:</strong> correct inaccurate data via your student settings page or by contacting us.</li>
        <li><strong>Erasure:</strong> request deletion of your account and associated practice data.</li>
        <li><strong>Objection:</strong> object to CRM sync; note that this may limit the support we can offer.</li>
    </ul>

    <h2>7. Practice data and exam publishers</h2>
    <p>
        All practice items on the Platform are original content authored by ALO
        Education. No items are reproduced from any official exam. Score
        estimates are approximations produced by the ALO ScoringService and are
        not official exam results. No guarantee is made that practice items
        will appear in any real exam.
    </p>

    <h2>8. Security</h2>
    <p>
        All traffic is served over HTTPS with HSTS. Passwords are hashed with
        bcrypt (cost 12). CSRF tokens protect all state-changing requests.
        Sensitive directories (storage, logs, database, app, config) are
        blocked at the web-server level. File uploads are scanned, size-limited,
        and stored outside the public web root.
    </p>

    <h2>9. Contact</h2>
    <p>
        To exercise any of your rights or to ask a privacy question, please use
        the <a href="/contact">Contact page</a>. We respond within one business
        day.
    </p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
