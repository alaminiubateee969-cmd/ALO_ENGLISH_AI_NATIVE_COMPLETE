<?php
/**
 * views/auth/password-reset-confirm.php — Set a new password.
 *
 * Expected vars:
 *   - $token (string) reset token from URL
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Set a new password';
require __DIR__ . '/../layouts/header.php';
$token = isset($token) ? $token : '';
?>
<section class="container alo-section alo-section--narrow">
    <header class="alo-section__head">
        <h1>Set a new password</h1>
        <p>Choose a strong password (minimum 12 characters, including a special character).</p>
    </header>

    <form class="card alo-form" method="post" action="/password/reset/<?= $e($token) ?>">
        <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
        <input type="hidden" name="token" value="<?= $e($token) ?>">
        <div class="form-row">
            <label class="form-label" for="password">New password</label>
            <input class="form-input" type="password" id="password" name="password" required minlength="12" autocomplete="new-password">
        </div>
        <div class="form-row">
            <label class="form-label" for="password_confirm">Confirm new password</label>
            <input class="form-input" type="password" id="password_confirm" name="password_confirm" required minlength="12" autocomplete="new-password">
        </div>
        <div class="form-row">
            <button class="btn btn-primary" type="submit">Update password</button>
        </div>
    </form>

    <?php if (!empty($error)): ?>
        <p class="alo-badge alo-badge--danger"><?= $e($error) ?></p>
    <?php endif; ?>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
