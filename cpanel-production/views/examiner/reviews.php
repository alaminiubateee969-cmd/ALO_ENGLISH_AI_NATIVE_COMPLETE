<?php
/**
 * views/examiner/reviews.php — Examiner review history + submission form.
 *
 * Expected vars:
 *   - $rows (array) past reviews
 *   - $user (array)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Reviews';
require __DIR__ . '/../layouts/header.php';
$rows = isset($rows) && is_array($rows) ? $rows : [
    ['id' => 'W-4815', 'student' => 'Tanvir Ahmed', 'exam' => 'IELTS-A', 'submitted' => '2025-01-14 16:20', 'score' => '6.5', 'status' => 'submitted'],
    ['id' => 'S-3905', 'student' => 'Priya Sharma', 'exam' => 'PTE-A',   'submitted' => '2025-01-14 15:02', 'score' => '73',  'status' => 'submitted'],
    ['id' => 'W-4810', 'student' => 'Li Wei',       'exam' => 'TOEFL',   'submitted' => '2025-01-13 11:44', 'score' => '—',   'status' => 'in_progress'],
];
?>
<section class="container alo-section">
    <header class="alo-section__head">
        <h1>Your reviews</h1>
        <p>Reviews you have submitted or are in progress. <span class="alo-demo-tag">Demo data</span></p>
    </header>

    <div class="alo-table-wrap">
        <table class="alo-table">
            <thead><tr><th>Submission</th><th>Student</th><th>Exam</th><th>Submitted</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>
                <?php foreach ($rows as $row): ?>
                    <tr>
                        <td class="alo-mono"><?= $e($row['id']) ?></td>
                        <td><?= $e($row['student']) ?></td>
                        <td><span class="alo-badge alo-badge--info"><?= $e($row['exam']) ?></span></td>
                        <td class="alo-mono"><?= $e($row['submitted']) ?></td>
                        <td><?= $e($row['score']) ?></td>
                        <td>
                            <?php $st = $row['status']; $cls = $st === 'submitted' ? 'success' : 'warn'; ?>
                            <span class="alo-badge alo-badge--<?= $cls ?>"><?= $e($st) ?></span>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <section class="card">
        <header class="alo-card__head"><h2>Submit a review</h2></header>
        <form method="post" action="/examiner/reviews/0/submit" class="alo-form">
            <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
            <div class="form-row">
                <label class="form-label" for="submission_id">Submission ID</label>
                <input class="form-input" type="text" id="submission_id" name="submission_id" placeholder="W-4821" required>
            </div>
            <div class="form-row">
                <label class="form-label" for="score">Score</label>
                <input class="form-input" type="text" id="score" name="score" placeholder="6.5 / 73 / 24" required>
            </div>
            <div class="form-row">
                <label class="form-label" for="feedback">Feedback</label>
                <textarea class="form-input" id="feedback" name="feedback" rows="5" placeholder="Strengths, weaknesses, improvement tips…"></textarea>
            </div>
            <div class="form-row"><button class="btn btn-primary" type="submit">Submit review</button></div>
        </form>
    </section>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> Reviews are for original practice submissions — not official exam content.
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
