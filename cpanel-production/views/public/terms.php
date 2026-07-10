<?php
/**
 * views/public/terms.php — Terms of service.
 *
 * Expected vars:
 *   - $e (callable)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Terms of service';
$updated = date('Y-m-d');
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow alo-legal">
    <header class="alo-section__head">
        <h1>Terms of service</h1>
        <p class="alo-legal__updated">Last updated: <?= $e($updated) ?></p>
    </header>

    <h2>1. Acceptance of terms</h2>
    <p>
        By creating an account or using any part of the ALO English Test
        Platform (the "Platform"), you agree to be bound by these Terms of
        Service. If you do not agree, you must not use the Platform.
    </p>

    <h2>2. Practice-only nature of the Platform</h2>
    <p>
        The Platform provides <strong>original, exam-aligned practice material
        only</strong>. All mock tests, questions, and score estimates:
    </p>
    <ul>
        <li>Are original content authored by ALO Education.</li>
        <li>Are not affiliated with, endorsed by, or reproduced from any official test publisher.</li>
        <li>Will not appear in any real exam.</li>
        <li>Produce estimated scores only — not official exam results.</li>
    </ul>
    <p>
        No certificate issued by the Platform is recognised by any official
        testing body. Certificates are practice-completion certificates only.
    </p>

    <h2>3. Free quota</h2>
    <p>
        ALO students receive 3 free mock tests; public students receive 1 free
        mock test. The free quota is shared across all 32 CBT exams and is
        enforced server-side. Free quota cannot be transferred between accounts.
    </p>

    <h2>4. Paid attempts and refunds</h2>
    <p>
        Additional mock tests may be purchased as single attempts, bundles, or
        as part of a Prep Course. Prices are displayed on the <a href="/pricing">Pricing page</a>.
        Paid attempts are non-refundable once a mock test has been started.
        Unused credits remain valid for 12 months from the date of purchase.
    </p>

    <h2>5. Acceptable use</h2>
    <p>You agree not to:</p>
    <ul>
        <li>Share your account credentials with any other person.</li>
        <li>Attempt to bypass the free-quota system by creating multiple accounts.</li>
        <li>Reverse-engineer, scrape, or redistribute any practice content.</li>
        <li>Use the Platform to claim false proficiency for visa, university, or employment applications.</li>
        <li>Submit offensive, abusive, or unlawful content via the contact form, messaging, or speaking/writing review uploads.</li>
    </ul>

    <h2>6. Account security</h2>
    <p>
        You are responsible for safeguarding your password. Account lockout
        triggers after 5 failed login attempts within 15 minutes. The Platform
        audits all authentication events. Notify us immediately via the
        <a href="/contact">Contact page</a> if you suspect unauthorised access.
    </p>

    <h2>7. Intellectual property</h2>
    <p>
        All practice content, scoring algorithms, Smart Score Reports, and
        platform software are the intellectual property of ALO Education.
        Ambassador marketing materials may be used solely for promoting ALO
        Education services and may not be modified or resold.
    </p>

    <h2>8. Ambassador program</h2>
    <p>
        Ambassadors earn commission on paid mock tests that use their voucher
        codes. Commission terms are detailed in the ambassador dashboard.
        ALO Education reserves the right to revoke ambassador status in cases
        of fraud, spam, or misrepresentation.
    </p>

    <h2>9. Service availability</h2>
    <p>
        The Platform is provided on an "as is" and "as available" basis. We do
        not guarantee uninterrupted access. Scheduled maintenance is performed
        weekly during the question-update window. We are not liable for any
        indirect or consequential loss arising from Platform downtime.
    </p>

    <h2>10. Limitation of liability</h2>
    <p>
        To the maximum extent permitted by law, ALO Education's total liability
        for any claim arising from your use of the Platform is limited to the
        amount you have paid to ALO Education in the 12 months preceding the
        claim. We are not liable for any decisions made on the basis of
        estimated practice scores.
    </p>

    <h2>11. Changes to these terms</h2>
    <p>
        We may update these Terms from time to time. Material changes will be
        notified by email to registered users at least 7 days before they take
        effect. Continued use of the Platform after that period constitutes
        acceptance of the updated Terms.
    </p>

    <h2>12. Contact</h2>
    <p>
        Questions about these Terms can be sent via the
        <a href="/contact">Contact page</a>.
    </p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
