<?php
/**
 * views/public/contact.php — Contact form.
 *
 * Expected vars:
 *   - $csrf_field  string
 *   - $sent        bool    true when the form was successfully submitted
 *   - $e           callable
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$csrf_field = $csrf_field ?? '';
$sent       = $sent       ?? false;
$title = 'Contact';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow">
    <header class="alo-section__head">
        <h1>Contact ALO Education</h1>
        <p>Questions about pricing, the ambassador program, bulk vouchers for schools, or anything else — send us a message.</p>
    </header>

    <?php if ($sent): ?>
        <div class="alo-alert alo-alert--success" role="status">
            <strong>Thank you.</strong> Your message has been received. Our team
            typically responds within one business day.
        </div>
    <?php endif; ?>

    <div class="card alo-auth-card">
        <form method="post" action="/contact" class="alo-form" novalidate>
            <?= $csrf_field ?>
            <div class="alo-form__row">
                <label class="alo-form__label" for="name">Full name <span class="alo-required">*</span></label>
                <input class="alo-form__input" type="text" id="name" name="name" required maxlength="255"
                       autocomplete="name" placeholder="Your full name">
            </div>
            <div class="alo-form__row">
                <label class="alo-form__label" for="email">Email address <span class="alo-required">*</span></label>
                <input class="alo-form__input" type="email" id="email" name="email" required maxlength="255"
                       autocomplete="email" placeholder="you@example.com">
            </div>
            <div class="alo-form__row">
                <label class="alo-form__label" for="phone">Phone number</label>
                <input class="alo-form__input" type="tel" id="phone" name="phone" maxlength="32"
                       autocomplete="tel" placeholder="+8801XXXXXXXXX">
            </div>
            <div class="alo-form__row">
                <label class="alo-form__label" for="message">Message <span class="alo-required">*</span></label>
                <textarea class="alo-form__input alo-form__textarea" id="message" name="message" required
                          maxlength="4000" rows="6" placeholder="How can we help?"></textarea>
            </div>
            <div class="alo-form__row">
                <button class="btn btn-primary" type="submit">Send message</button>
            </div>
        </form>
    </div>

    <p class="alo-disclaimer-soft">
        Your message is logged into our CRM queue and synced with ALO Web_CRM.
        We never share your contact details with third parties.
    </p>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
