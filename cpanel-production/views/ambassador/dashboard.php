<?php
/**
 * views/ambassador/dashboard.php — Ambassador dashboard (demo data).
 *
 * Static demo content. Renders 200 with no DB.
 *
 * Expected vars:
 *   - $e (callable)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Ambassador dashboard';
require __DIR__ . '/../layouts/header.php';

$kpis = [
    ['label' => 'Total referrals',         'value' => '47'],
    ['label' => 'Active students',          'value' => '32'],
    ['label' => 'Vouchers redeemed',        'value' => '21'],
    ['label' => 'Commission (USD)',         'value' => '$189.00'],
];
$referralLink = 'https://english.aloeducation.com/r/AMB-2025-0042';
$referrals = [
    ['name' => 'Student A', 'joined' => '2025-01-14', 'status' => 'Active',   'commission' => '$9.00'],
    ['name' => 'Student B', 'joined' => '2025-01-12', 'status' => 'Active',   'commission' => '$18.00'],
    ['name' => 'Student C', 'joined' => '2025-01-10', 'status' => 'Trial',    'commission' => '$0.00'],
    ['name' => 'Student D', 'joined' => '2025-01-08', 'status' => 'Churned',  'commission' => '$9.00'],
    ['name' => 'Student E', 'joined' => '2025-01-05', 'status' => 'Active',   'commission' => '$27.00'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Ambassador dashboard</h1>
        <p>Your referrals, vouchers, and commission. <span class="alo-demo-tag">Demo data</span></p>
    </header>

    <div class="alo-grid alo-grid--4 alo-kpi">
        <?php foreach ($kpis as $kpi): ?>
            <article class="card alo-kpi__card">
                <span class="alo-kpi__label"><?= $e($kpi['label']) ?></span>
                <span class="alo-kpi__value"><?= $e($kpi['value']) ?></span>
            </article>
        <?php endforeach; ?>
    </div>

    <section class="card">
        <header class="alo-card__head"><h2>Your referral link</h2></header>
        <p>Share this link with friends. Anyone who signs up via this link is automatically tagged as your referral.</p>
        <div class="alo-copybox">
            <input class="alo-form__input alo-copybox__input" type="text" readonly
                   value="<?= $e($referralLink) ?>" aria-label="Referral link">
            <button class="btn btn-secondary alo-copybox__btn" type="button"
                    data-copy-target=".alo-copybox__input">Copy</button>
        </div>
        <p class="alo-form__hint">
            Vouchers can be created from the
            <a href="/ambassador/vouchers">Vouchers</a> page.
        </p>
    </section>

    <section class="card">
        <header class="alo-card__head">
            <h2>Recent referrals</h2>
            <a class="btn btn-link" href="/ambassador/referrals">All referrals &rarr;</a>
        </header>
        <div class="alo-table-wrap">
            <table class="alo-table alo-table--compact">
                <thead>
                    <tr><th>Student</th><th>Joined</th><th>Status</th><th>Commission</th></tr>
                </thead>
                <tbody>
                    <?php foreach ($referrals as $row): ?>
                        <tr>
                            <td><?= $e($row['name']) ?></td>
                            <td class="alo-mono"><?= $e($row['joined']) ?></td>
                            <td>
                                <?php $badge = $row['status'] === 'Active' ? 'success' : ($row['status'] === 'Trial' ? 'info' : 'warn'); ?>
                                <span class="alo-badge alo-badge--<?= $e($badge) ?>"><?= $e($row['status']) ?></span>
                            </td>
                            <td class="alo-num"><?= $e($row['commission']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </section>

    <div class="alo-grid alo-grid--2">
        <section class="card">
            <header class="alo-card__head"><h2>Quick links</h2></header>
            <ul class="alo-linklist">
                <li><a href="/ambassador/create-referral">Create a referral</a></li>
                <li><a href="/ambassador/vouchers">Issue voucher codes</a></li>
                <li><a href="/ambassador/marketing-kit">Download marketing kit</a></li>
                <li><a href="/ambassador/commission">Withdraw commission</a></li>
            </ul>
        </section>
        <section class="card">
            <header class="alo-card__head"><h2>Program status</h2></header>
            <ul class="alo-list">
                <li>Ambassador tier: <strong>Silver</strong></li>
                <li>Next tier (Gold): <strong>3 referrals away</strong></li>
                <li>Vouchers available: <strong>5</strong></li>
                <li>Last commission payout: <strong>2025-01-01</strong></li>
            </ul>
        </section>
    </div>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong>
        All ambassador referrals give access to original ALO practice content.
        Estimated scores are not official exam results.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
