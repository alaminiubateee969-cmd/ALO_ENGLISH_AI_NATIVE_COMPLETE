<?php
/**
 * views/public/tests.php — Mock test catalog.
 *
 * Expected vars:
 *   - $sets  array  list of practice sets (each: set_code, title, description,
 *                   total_questions, total_duration_minutes, difficulty,
 *                   type_code, type_name, style_label)
 *   - $e     callable
 *
 * Renders 200 with an empty $sets array.
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$sets = $sets ?? [];
$title = 'Mock tests';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Mock test catalog</h1>
        <p>
            Browse original, exam-aligned practice sets. Each set is original
            ALO content, written by our test authors, and reviewed weekly.
            All tests are practice only — not official exam questions.
        </p>
    </header>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong>
        Items will not appear in any real exam and are for preparation only.
        Estimated scores are not official exam results.
    </div>

    <?php if (!empty($sets)): ?>
        <div class="alo-table-wrap">
            <table class="alo-table">
                <thead>
                    <tr>
                        <th>Set code</th>
                        <th>Title</th>
                        <th>Exam</th>
                        <th>Difficulty</th>
                        <th>Questions</th>
                        <th>Duration</th>
                        <th><span class="alo-sr-only">Action</span></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($sets as $set): ?>
                        <?php
                            $setLink = '/login?next=' . rawurlencode('/student/start-test/' . rawurlencode((string)($set['set_code'] ?? '')));
                        ?>
                        <tr>
                            <td class="alo-mono"><?= $e($set['set_code'] ?? '') ?></td>
                            <td>
                                <div class="alo-cell-title"><?= $e($set['title'] ?? '') ?></div>
                                <?php if (!empty($set['description'])): ?>
                                    <div class="alo-cell-sub"><?= $e(mb_substr((string) $set['description'], 0, 120)) ?><?php if (mb_strlen((string) $set['description']) > 120) echo '…'; ?></div>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div class="alo-cell-title"><?= $e($set['type_name'] ?? '') ?></div>
                                <div class="alo-cell-sub"><?= $e($set['style_label'] ?? '') ?></div>
                            </td>
                            <td><span class="alo-badge alo-badge--<?= $e(strtolower((string)($set['difficulty'] ?? 'easy'))) ?>"><?= $e(ucfirst((string)($set['difficulty'] ?? 'easy'))) ?></span></td>
                            <td class="alo-num"><?= $e((string)($set['total_questions'] ?? 0)) ?></td>
                            <td class="alo-num"><?= $e((string)($set['total_duration_minutes'] ?? 0)) ?> min</td>
                            <td><a class="btn btn-primary btn-sm" href="<?= $e($setLink) ?>">Start</a></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    <?php else: ?>
        <div class="alo-empty">
            <p>No practice sets are published yet. The catalog is updated weekly via the ALO question-update pipeline.</p>
            <a class="btn btn-secondary" href="/contact">Contact ALO Education</a>
        </div>
    <?php endif; ?>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
