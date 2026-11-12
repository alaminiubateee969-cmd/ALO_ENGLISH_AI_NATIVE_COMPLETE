<?php
/**
 * views/auth/activated.php — Account activation confirmation.
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Account activated';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow">
    <header class="alo-section__head">
        <h1>Account activated</h1>
    </header>
    <div class="card">
        <p>Your account is now active. You can sign in and start practising.</p>
        <p><a class="btn btn-primary" href="/login">Sign in</a></p>
    </div>
    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> All mock-test data on this Platform is original, exam-aligned practice material — not official exam content.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
