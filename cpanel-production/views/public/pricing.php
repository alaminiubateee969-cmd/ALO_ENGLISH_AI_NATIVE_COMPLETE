<?php
/**
 * views/public/pricing.php — Pricing page.
 *
 * Expected vars:
 *   - $paid_price_usd  float   price of a single paid mock attempt (USD)
 *   - $e                callable
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$paid_price_usd = isset($paid_price_usd) ? (float)$paid_price_usd : 9.00;
$priceFmt = '$' . number_format($paid_price_usd, 2);
$bundleFmt = '$' . number_format($paid_price_usd * 5, 2);
$prepFmt   = '$' . number_format($paid_price_usd * 12, 2);
$title = 'Pricing';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Pricing</h1>
        <p>Simple, transparent pricing. Free quota is shared across all 32 exams and enforced server-side — no hidden caps.</p>
    </header>

    <div class="alo-grid alo-grid--4">
        <article class="card alo-plan">
            <header class="alo-plan__head">
                <h2 class="alo-plan__name">Free</h2>
                <p class="alo-plan__price">$0</p>
                <p class="alo-plan__sub">Forever free</p>
            </header>
            <ul class="alo-plan__features">
                <li>1 free public mock test</li>
                <li>Smart Score Report</li>
                <li>Practice only — estimated scores</li>
                <li>Community support</li>
            </ul>
            <a class="btn btn-secondary" href="/register">Get started</a>
        </article>

        <article class="card alo-plan alo-plan--featured">
            <header class="alo-plan__head">
                <p class="alo-plan__badge">Most popular</p>
                <h2 class="alo-plan__name">Single</h2>
                <p class="alo-plan__price"><?= $e($priceFmt) ?></p>
                <p class="alo-plan__sub">Per paid mock test</p>
            </header>
            <ul class="alo-plan__features">
                <li>Any single CBT exam</li>
                <li>Full Smart Score Report</li>
                <li>AI next-action suggestion</li>
                <li>PDF report download</li>
            </ul>
            <a class="btn btn-primary" href="/register">Buy a single test</a>
        </article>

        <article class="card alo-plan">
            <header class="alo-plan__head">
                <h2 class="alo-plan__name">Bundle</h2>
                <p class="alo-plan__price"><?= $e($bundleFmt) ?></p>
                <p class="alo-plan__sub">5 mock test credits</p>
            </header>
            <ul class="alo-plan__features">
                <li>5 paid mock credits (any exam)</li>
                <li>Shared across all 32 CBT exams</li>
                <li>Priority Smart Score Report</li>
                <li>Voucher redemption supported</li>
            </ul>
            <a class="btn btn-secondary" href="/register">Buy a bundle</a>
        </article>

        <article class="card alo-plan">
            <header class="alo-plan__head">
                <h2 class="alo-plan__name">Prep Course</h2>
                <p class="alo-plan__price"><?= $e($prepFmt) ?></p>
                <p class="alo-plan__sub">12 mock tests + tutoring</p>
            </header>
            <ul class="alo-plan__features">
                <li>12 paid mock credits</li>
                <li>1-on-1 speaking review session</li>
                <li>Personalised study plan</li>
                <li>Ambassador referral bonus</li>
            </ul>
            <a class="btn btn-secondary" href="/contact">Talk to a counsellor</a>
        </article>
    </div>

    <div class="alo-disclaimer-banner alo-section" role="note">
        <strong>Free quota is enforced backend-side.</strong>
        ALO students get 3 free mocks, public students get 1 — shared across
        all 32 CBT exams. Paid attempts unlock additional mocks at the price
        shown above. Practice only — estimated scores, not official exam results.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
