<?php
/**
 * views/public/register.php — Registration form.
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
$title = 'Create account';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow">
    <div class="card alo-auth-card">
        <h1 class="alo-auth-card__title">Create your free account</h1>
        <p class="alo-auth-card__lede">
            Get 1 free public mock test, or 3 free mocks if you are an existing
            ALO Education student. No credit card required.
        </p>

        <form method="post" action="/auth/register" class="alo-form" novalidate>
            <?= $csrf_field ?>
            <div class="alo-form__row">
                <label class="alo-form__label" for="name">Full name <span class="alo-required">*</span></label>
                <input class="alo-form__input" type="text" id="name" name="name"
                       autocomplete="name" required maxlength="255"
                       placeholder="Your full name">
            </div>
            <div class="alo-form__row">
                <label class="alo-form__label" for="email">Email address <span class="alo-required">*</span></label>
                <input class="alo-form__input" type="email" id="email" name="email"
                       autocomplete="email" required maxlength="255"
                       placeholder="you@example.com">
            </div>
            <div class="alo-form__row">
                <label class="alo-form__label" for="phone">Phone number</label>
                <input class="alo-form__input" type="tel" id="phone" name="phone"
                       autocomplete="tel" maxlength="32"
                       placeholder="+8801XXXXXXXXX">
            </div>
            <div class="alo-form__row">
                <label class="alo-form__label" for="password">Password <span class="alo-required">*</span></label>
                <input class="alo-form__input" type="password" id="password" name="password"
                       autocomplete="new-password" required minlength="8" maxlength="128"
                       placeholder="At least 8 characters">
                <small class="alo-form__hint">Use at least 8 characters with a mix of letters and numbers.</small>
            </div>
            <div class="alo-form__row">
                <label class="alo-form__label" for="alo_student_id">ALO Student ID (optional)</label>
                <input class="alo-form__input" type="text" id="alo_student_id" name="alo_student_id"
                       maxlength="64" inputmode="numeric"
                       placeholder="e.g. ALO-2025-00123 — unlocks 3 free mocks">
                <small class="alo-form__hint">If you are an ALO Education student, enter your student ID to unlock the extended free quota.</small>
            </div>
            <div class="alo-form__row alo-form__row--check">
                <label class="alo-form__check">
                    <input type="checkbox" name="agree_terms" value="1" required>
                    <span>I agree to the <a href="/terms" target="_blank" rel="noopener">Terms of Service</a>
                    and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>,
                    and I understand that all mock tests on this platform are practice only
                    and not official exam results.</span>
                </label>
            </div>
            <div class="alo-form__row">
                <button class="btn btn-primary" type="submit">Create account</button>
            </div>
        </form>

        <hr class="alo-divider">

        <p class="alo-auth-card__alt">
            Already have an account?
            <a href="/login">Login instead</a>
        </p>
    </div>

    <p class="alo-disclaimer-soft">
        Your data is stored securely and synced to ALO Web_CRM for student
        support. You may request deletion at any time via the Contact page.
    </p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
