<?php
/**
 * views/admin/settings.php — Platform settings.
 * Expected vars: $settings (array), $user, $alo_limit, $public_limit. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Settings';
require __DIR__ . '/../layouts/header.php';
$settings = isset($settings) && is_array($settings) ? $settings : [
    ['key' => 'no_human_exam_mode',        'value' => '1',     'group' => 'No-Human Mode'],
    ['key' => 'evaluation_mode',           'value' => 'automated', 'group' => 'No-Human Mode'],
    ['key' => 'evaluation_provider',       'value' => 'local_rule_engine', 'group' => 'No-Human Mode'],
    ['key' => 'free_quota_alo',            'value' => '3',     'group' => 'Quota'],
    ['key' => 'free_quota_public',         'value' => '1',     'group' => 'Quota'],
    ['key' => 'paid_attempt_price_usd',    'value' => '2.00',  'group' => 'Pricing'],
    ['key' => 'weekly_update_enabled',     'value' => 'true',  'group' => 'Weekly Updates'],
    ['key' => 'weekly_update_auto_publish','value' => 'false', 'group' => 'Weekly Updates'],
    ['key' => 'ai_enabled',                'value' => 'false', 'group' => 'AI'],
    ['key' => 'mfa_enabled',               'value' => 'true',  'group' => 'Security'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Platform settings</h1></header>
    <form method="post" action="/admin/settings">
        <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
        <div class="alo-table-wrap">
            <table class="alo-table alo-table--compact">
                <thead><tr><th>Key</th><th>Value</th><th>Group</th></tr></thead>
                <tbody>
                    <?php foreach ($settings as $s): ?>
                        <tr>
                            <td class="alo-mono"><?= $e($s['key']) ?></td>
                            <td><input class="form-input" type="text" name="setting[<?= $e($s['key']) ?>]" value="<?= $e($s['value']) ?>"></td>
                            <td><span class="alo-badge alo-badge--info"><?= $e($s['group']) ?></span></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <div class="form-row"><button class="btn btn-primary" type="submit">Save settings</button></div>
    </form>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
