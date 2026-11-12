<?php
/**
 * views/auth/password-reset-request.php — Request password reset.
 *
 * Expected vars:
 *   - $e (callable) escaper
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Reset your password';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow">
    <header class="alo-section__head">
        <h1>Reset your password</h1>
        <p>Enter your account email and we will send you a reset link.</p>
    </header>

    <form class="card alo-form" method="post" action="/password/reset">
        <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
        <div class="form-row">
            <label class="form-label" for="email">Email address</label>
            <input class="form-input" type="email" id="email" name="email" required autocomplete="email" placeholder="you@example.com">
        </div>
        <div class="form-row">
            <button class="btn btn-primary" type="submit">Send reset link</button>
        </div>
    </form>

    <p class="alo-muted"><a href="/login">&larr; Back to login</a></p>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> This Platform provides original, exam-aligned practice material — not official exam content.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
