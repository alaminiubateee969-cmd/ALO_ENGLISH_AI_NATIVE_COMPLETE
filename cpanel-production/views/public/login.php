<?php
/**
 * views/public/login.php — Login form.
 *
 * Expected vars:
 *   - $csrf_field  string
 *   - $e           callable
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$csrf_field = $csrf_field ?? '';
$title = 'Login';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow">
    <div class="card alo-auth-card">
        <h1 class="alo-auth-card__title">Welcome back</h1>
        <p class="alo-auth-card__lede">
            Login to your ALO English Test Platform account. Students, examiners,
            admins and ambassadors all sign in here.
        </p>

        <form method="post" action="/auth/login" class="alo-form" novalidate>
            <?= $csrf_field ?>
            <div class="alo-form__row">
                <label class="alo-form__label" for="email">Email address</label>
                <input class="alo-form__input" type="email" id="email" name="email"
                       autocomplete="email" required maxlength="255"
                       placeholder="you@example.com">
            </div>
            <div class="alo-form__row">
                <label class="alo-form__label" for="password">Password</label>
                <input class="alo-form__input" type="password" id="password" name="password"
                       autocomplete="current-password" required minlength="8" maxlength="128"
                       placeholder="Your password">
            </div>
            <div class="alo-form__row alo-form__row--inline">
                <button class="btn btn-primary" type="submit">Login</button>
                <a class="alo-form__link" href="/password/reset">Forgot your password?</a>
            </div>
        </form>

        <hr class="alo-divider">

        <p class="alo-auth-card__alt">
            Don't have an account yet?
            <a href="/register">Create a free account</a>
        </p>
    </div>

    <p class="alo-disclaimer-soft">
        Login is protected by CSRF tokens, rate-limited, and audit-logged.
        Account lockout triggers after 5 failed attempts within 15 minutes.
    </p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
