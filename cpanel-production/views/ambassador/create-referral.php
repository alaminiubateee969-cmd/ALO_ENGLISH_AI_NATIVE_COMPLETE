<?php
/**
 * views/ambassador/create-referral.php — Create a new referral.
 *
 * Expected vars:
 *   - $ctx (array)
 *   - $referral_code (string)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Create referral';
require __DIR__ . '/../layouts/header.php';
$code = isset($referral_code) ? $referral_code : 'AMB-2025-0042';
$shareLink = 'https://english.aloeducation.com/register?ref=' . $code;
?>
<section class="container alo-section alo-section--narrow">
    <header class="alo-section__head">
        <h1>Create a referral</h1>
        <p>Invite a student. They get a free practice quota; you earn commission when they convert.</p>
    </header>

    <form class="card alo-form" method="post" action="/ambassador/create-referral">
        <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
        <div class="form-row">
            <label class="form-label" for="name">Student name</label>
            <input class="form-input" type="text" id="name" name="name" required>
        </div>
        <div class="form-row">
            <label class="form-label" for="email">Student email</label>
            <input class="form-input" type="email" id="email" name="email" required>
        </div>
        <div class="form-row">
            <label class="form-label" for="message">Personal note (optional)</label>
            <textarea class="form-input" id="message" name="message" rows="3" placeholder="Hi! I recommend ALO English for your test prep…"></textarea>
        </div>
        <div class="form-row"><button class="btn btn-primary" type="submit">Send invitation</button></div>
    </form>

    <section class="card">
        <header class="alo-card__head"><h2>Your shareable link</h2></header>
        <p>Your referral code: <code class="alo-mono"><?= $e($code) ?></code></p>
        <p>Share link: <input class="form-input alo-mono" type="text" readonly value="<?= $e($shareLink) ?>" onclick="this.select()"></p>
    </section>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
