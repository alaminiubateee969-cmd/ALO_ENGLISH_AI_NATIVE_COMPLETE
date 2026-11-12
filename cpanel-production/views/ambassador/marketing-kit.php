<?php
/**
 * views/ambassador/marketing-kit.php — Marketing assets for ambassadors.
 * Expected vars: $assets (array), $ctx. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Marketing kit';
require __DIR__ . '/../layouts/header.php';
$assets = isset($assets) && is_array($assets) ? $assets : [
    ['type' => 'Banner',   'title' => 'ALO English — Practice that counts', 'format' => '1200×630 PNG', 'url' => '/public/images/ambassador-banner-1.png'],
    ['type' => 'Banner',   'title' => '32 exams. One platform.',             'format' => '1080×1080 PNG', 'url' => '/public/images/ambassador-banner-2.png'],
    ['type' => 'Copy',     'title' => 'Short social post (Twitter/X)',       'format' => 'Text',          'url' => '#'],
    ['type' => 'Copy',     'title' => 'Long Facebook post',                  'format' => 'Text',          'url' => '#'],
    ['type' => 'Template', 'title' => 'WhatsApp invitation message',         'format' => 'Text',          'url' => '#'],
    ['type' => 'Template', 'title' => 'Email invitation',                    'format' => 'HTML',          'url' => '#'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Marketing kit</h1>
        <p>Ready-to-use assets. Swap in your referral link before sharing.</p>
    </header>
    <div class="alo-grid alo-grid--3">
        <?php foreach ($assets as $asset): ?>
            <article class="card">
                <header class="alo-card__head">
                    <span class="alo-badge alo-badge--info"><?= $e($asset['type']) ?></span>
                    <h2><?= $e($asset['title']) ?></h2>
                </header>
                <p class="alo-muted"><?= $e($asset['format']) ?></p>
                <p><a class="btn btn-link" href="<?= $e($asset['url']) ?>">Download / copy &rarr;</a></p>
            </article>
        <?php endforeach; ?>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
