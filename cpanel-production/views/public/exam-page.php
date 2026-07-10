<?php
/**
 * views/public/exam-page.php — Per-exam landing page.
 *
 * Expected vars:
 *   - $exam        array   exam type row (type_code, type_name, style_label,
 *                          duration_minutes, score_scale, description,
 *                          category_name, [sections], [id])
 *   - $sets        array   published practice sets for this exam type
 *   - $disclaimer  string  canonical practice disclaimer
 *   - $e           callable
 *
 * Renders 200 with demo fallback data when the DB is unavailable.
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$exam       = $exam       ?? [];
$sets       = $sets       ?? [];
$disclaimer = $disclaimer ?? 'Practice only. Not official exam content.';

$typeName   = $exam['type_name']    ?? 'Exam';
$styleLabel = $exam['style_label']  ?? 'exam-style practice test';
$duration   = $exam['duration_minutes'] ?? 120;
$scoreScale = $exam['score_scale']  ?? 'varies';
$desc       = $exam['description']  ?? 'Original, exam-aligned practice for preparation only.';
$category   = $exam['category_name'] ?? 'English Proficiency';
$sections   = isset($exam['sections']) && is_array($exam['sections']) ? $exam['sections'] : null;

$title = $typeName . ' practice';
require __DIR__ . '/../layouts/header.php';
?>
<section class="alo-hero alo-hero--compact">
    <div class="container alo-hero__inner">
        <p class="alo-hero__eyebrow"><?= $e($category) ?> — practice only</p>
        <h1 class="alo-hero__title"><?= $e($typeName) ?></h1>
        <p class="alo-hero__lede"><?= $e($styleLabel) ?> — original ALO-authored practice content, scored by the universal CBT engine.</p>
        <div class="alo-hero__cta">
            <a class="btn btn-primary" href="/mock-tests">Start a mock test</a>
            <a class="btn btn-secondary" href="/how-exams-work">How exams work</a>
        </div>
    </div>
</section>

<section class="container alo-section">
    <div class="alo-grid alo-grid--3">
        <article class="card alo-stat-card">
            <span class="alo-stat-card__label">Duration</span>
            <span class="alo-stat-card__value"><?= $e((string)$duration) ?> min</span>
        </article>
        <article class="card alo-stat-card">
            <span class="alo-stat-card__label">Estimated score scale</span>
            <span class="alo-stat-card__value"><?= $e($scoreScale) ?></span>
        </article>
        <article class="card alo-stat-card">
            <span class="alo-stat-card__label">Engine</span>
            <span class="alo-stat-card__value">Universal CBT</span>
        </article>
    </div>
</section>

<section class="container alo-section">
    <h2>About this exam</h2>
    <p><?= $e($desc) ?></p>

    <?php if (!empty($sections)): ?>
        <h3>Sections</h3>
        <ul class="alo-bullets">
            <?php foreach ($sections as $section): ?>
                <?php if (is_array($section)): ?>
                    <li><strong><?= $e((string)($section['name'] ?? '')) ?></strong>
                        — <?= $e((string)($section['description'] ?? '')) ?></li>
                <?php else: ?>
                    <li><?= $e((string)$section) ?></li>
                <?php endif; ?>
            <?php endforeach; ?>
        </ul>
    <?php else: ?>
        <p>
            Each <?= $e($typeName) ?> practice set is built from the official
            exam's section structure. Specific section breakdowns are listed on
            each practice set in the catalog below.
        </p>
    <?php endif; ?>
</section>

<section class="container alo-section">
    <h2>Available practice sets</h2>
    <?php if (!empty($sets)): ?>
        <div class="alo-table-wrap">
            <table class="alo-table">
                <thead>
                    <tr>
                        <th>Set code</th>
                        <th>Title</th>
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
                            <td><?= $e($set['title'] ?? '') ?></td>
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
            <p>
                No <?= $e($typeName) ?> practice sets are published yet. The
                ALO question-update pipeline publishes new sets weekly — please
                check back shortly or browse <a href="/mock-tests">all mock tests</a>.
            </p>
        </div>
    <?php endif; ?>
</section>

<section class="container alo-section">
    <div class="alo-disclaimer-banner alo-disclaimer-banner--large" role="note">
        <h2>Practice disclaimer</h2>
        <p><?= $e($disclaimer) ?></p>
        <p>
            <a href="/exam-disclaimer">Read the full disclaimer &rarr;</a>
        </p>
    </div>
</section>

<section class="container alo-section">
    <div class="alo-cta-band">
        <div>
            <h2>Ready to practice <?= $e($typeName) ?>?</h2>
            <p>Create your free account and claim your free mock-test quota. ALO students get 3 free mocks, public students get 1.</p>
        </div>
        <div class="alo-cta-band__buttons">
            <a class="btn btn-primary" href="/register">Create free account</a>
            <a class="btn btn-secondary" href="/login">Login</a>
        </div>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
