<?php
/**
 * views/student/messages.php — Messages thread.
 * Expected vars: $messages (array), $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Messages';
require __DIR__ . '/../layouts/header.php';
$messages = isset($messages) && is_array($messages) ? $messages : [
    ['from' => 'ALO Support', 'subject' => 'Welcome to ALO English', 'date' => '2025-01-10', 'unread' => true],
    ['from' => 'Examiner',    'subject' => 'Your writing review is ready', 'date' => '2025-01-14', 'unread' => false],
];
?>
<section class="container alo-section">
    <header class="alo-section__head"><h1>Messages</h1></header>
    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>From</th><th>Subject</th><th>Date</th><th></th></tr></thead>
            <tbody>
                <?php foreach ($messages as $m): ?>
                    <tr class="<?= !empty($m['unread']) ? 'is-unread' : '' ?>">
                        <td><?= $e($m['from']) ?></td>
                        <td><?= $e($m['subject']) ?> <?= !empty($m['unread']) ? '<span class="alo-badge alo-badge--info">new</span>' : '' ?></td>
                        <td class="alo-mono"><?= $e($m['date']) ?></td>
                        <td><a class="btn btn-link" href="#">Read &rarr;</a></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <section class="card">
        <header class="alo-card__head"><h2>Send a message</h2></header>
        <form class="alo-form" method="post" action="/student/messages">
            <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
            <div class="form-row">
                <label class="form-label" for="subject">Subject</label>
                <input class="form-input" type="text" id="subject" name="subject" required>
            </div>
            <div class="form-row">
                <label class="form-label" for="body">Message</label>
                <textarea class="form-input" id="body" name="body" rows="4" required></textarea>
            </div>
            <div class="form-row"><button class="btn btn-primary" type="submit">Send</button></div>
        </form>
    </section>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
