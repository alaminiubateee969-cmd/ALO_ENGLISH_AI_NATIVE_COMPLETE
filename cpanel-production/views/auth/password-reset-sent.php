<?php
/**
 * views/auth/password-reset-sent.php — Reset link sent confirmation.
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Check your email';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow">
    <header class="alo-section__head">
        <h1>Check your email</h1>
    </header>
    <div class="card">
        <p>If an account exists for <strong><?= $e(isset($email) ? $email : 'your email') ?></strong>,
            a password reset link has been sent. The link expires in 60 minutes.</p>
        <p class="alo-muted">Did not receive it? Check your spam folder, or
            <a href="/password/reset">try again</a>.</p>
        <p><a class="btn btn-link" href="/login">&larr; Back to login</a></p>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
