<?php
/**
 * views/student/book-assessment.php — Book a consultation.
 * Expected vars: $user, $advisors (array). PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Book an assessment';
require __DIR__ . '/../layouts/header.php';
?>
<section class="container alo-section alo-section--narrow">
    <header class="alo-section__head">
        <h1>Book an assessment call</h1>
        <p>Speak with an ALO education advisor about your study plan and exam goals.</p>
    </header>
    <form class="card alo-form" method="post" action="/student/book-assessment">
        <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
        <div class="form-row">
            <label class="form-label" for="exam">Target exam</label>
            <select class="form-input" id="exam" name="exam">
                <option>IELTS Academic</option><option>PTE Academic</option><option>TOEFL iBT</option>
                <option>Duolingo English Test</option><option>OET</option><option>SAT</option>
                <option>GRE</option><option>GMAT</option>
            </select>
        </div>
        <div class="form-row">
            <label class="form-label" for="date">Preferred date</label>
            <input class="form-input" type="date" id="date" name="date" required>
        </div>
        <div class="form-row">
            <label class="form-label" for="time">Preferred time (IST)</label>
            <input class="form-input" type="time" id="time" name="time" required>
        </div>
        <div class="form-row">
            <label class="form-label" for="notes">Notes (optional)</label>
            <textarea class="form-input" id="notes" name="notes" rows="3" placeholder="Your target score, university deadlines, etc."></textarea>
        </div>
        <div class="form-row"><button class="btn btn-primary" type="submit">Request booking</button></div>
    </form>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
