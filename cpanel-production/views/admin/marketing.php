<?php
/**
 * views/admin/marketing.php — Marketing sources / ambassador performance.
 * Expected vars: $sources (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Marketing';
require __DIR__ . '/../layouts/header.php';
$sources = isset($sources) && is_array($sources) ? $sources : [
    ['source' => 'Organic search',       'visitors' => 1842, 'leads' => 312, 'conversions' => 48, 'cost' => '$0'],
    ['source' => 'Facebook ads',         'visitors' => 968,  'leads' => 184, 'conversions' => 22, 'cost' => '$420'],
    ['source' => 'Ambassador referrals', 'visitors' => 412,  'leads' => 156, 'conversions' => 38, 'cost' => '$285 (commission)'],
    ['source' => 'Partner schools',      'visitors' => 286,  'leads' => 98,  'conversions' => 31, 'cost' => '$0'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Marketing sources</h1></header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Source</th><th>Visitors</th><th>Leads</th><th>Conversions</th><th>Cost</th><th>Conv. rate</th></tr></thead>
            <tbody>
                <?php foreach ($sources as $s): $rate = $s['visitors'] > 0 ? round($s['conversions']/$s['visitors']*100,1) : 0; ?>
                    <tr>
                        <td><?= $e($s['source']) ?></td>
                        <td><?= $e((string)$s['visitors']) ?></td>
                        <td><?= $e((string)$s['leads']) ?></td>
                        <td><strong><?= $e((string)$s['conversions']) ?></strong></td>
                        <td><?= $e($s['cost']) ?></td>
                        <td><?= $e((string)$rate) ?>%</td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
