<?php
/**
 * views/public/ambassador.php — Ambassador program landing page.
 *
 * Expected vars:
 *   - $e (callable)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Ambassador program';
require __DIR__ . '/../layouts/header.php';
?>
<section class="alo-hero alo-hero--compact">
    <div class="container alo-hero__inner">
        <p class="alo-hero__eyebrow">ALO Ambassador Program</p>
        <h1 class="alo-hero__title">Earn while you help others study abroad</h1>
        <p class="alo-hero__lede">
            Refer friends to ALO English Test Platform and unlock free mock
            tests, vouchers, and commission on paid attempts — all tracked
            automatically and synced to ALO Web_CRM.
        </p>
        <div class="alo-hero__cta">
            <a class="btn btn-primary" href="/register">Become an ambassador</a>
            <a class="btn btn-secondary" href="#how-it-works">How it works</a>
        </div>
    </div>
</section>

<section class="container alo-section" id="benefits">
    <header class="alo-section__head">
        <h2>Ambassador benefits</h2>
        <p>What you get when you join the ALO Ambassador Program.</p>
    </header>
    <div class="alo-grid alo-grid--3">
        <article class="card">
            <h3>Free mock tests</h3>
            <p>Ambassadors unlock 2 extra free mocks for themselves, on top of the standard free quota.</p>
        </article>
        <article class="card">
            <h3>Voucher codes</h3>
            <p>Generate discount vouchers for your friends. Each voucher gives them free or discounted mocks.</p>
        </article>
        <article class="card">
            <h3>Commission</h3>
            <p>Earn commission on every paid mock test that uses your ambassador voucher.</p>
        </article>
        <article class="card">
            <h3>Smart dashboard</h3>
            <p>Track referrals, voucher usage, and commission in real time from your ambassador dashboard.</p>
        </article>
        <article class="card">
            <h3>Marketing kit</h3>
            <p>Download ready-made social posts, posters, and referral links from the marketing kit.</p>
        </article>
        <article class="card">
            <h3>Priority support</h3>
            <p>Direct line to ALO Education staff for any ambassador question or escalation.</p>
        </article>
    </div>
</section>

<section class="container alo-section" id="how-it-works">
    <header class="alo-section__head">
        <h2>How it works</h2>
        <p>Four simple steps from sign-up to commission.</p>
    </header>
    <ol class="alo-steps">
        <li>
            <span class="alo-steps__num">1</span>
            <h3>Apply</h3>
            <p>Create an ALO account and request ambassador status from your dashboard. Approval usually takes 24 hours.</p>
        </li>
        <li>
            <span class="alo-steps__num">2</span>
            <h3>Share your link</h3>
            <p>Get a unique referral link and voucher codes from the ambassador portal. Share with friends, students, study-abroad groups.</p>
        </li>
        <li>
            <span class="alo-steps__num">3</span>
            <h3>They practice</h3>
            <p>Referred students sign up, claim their free mocks, and use your voucher for additional paid attempts.</p>
        </li>
        <li>
            <span class="alo-steps__num">4</span>
            <h3>You earn</h3>
            <p>Commission accrues on paid attempts using your voucher. Withdraw via the ambassador commission report.</p>
        </li>
    </ol>
</section>

<section class="container alo-section">
    <div class="alo-cta-band">
        <div>
            <h2>Become an ALO Ambassador today</h2>
            <p>Help friends prepare for their English exams and earn rewards along the way.</p>
        </div>
        <div class="alo-cta-band__buttons">
            <a class="btn btn-primary" href="/register">Create account</a>
            <a class="btn btn-secondary" href="/contact">Ask a question</a>
        </div>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
