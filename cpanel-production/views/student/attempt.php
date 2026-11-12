<?php
/**
 * views/student/attempt.php — Live practice test interface.
 *
 * Renders the question palette, timer, current question, and save/submit
 * controls. Answers are POSTed via /mock-test/save-answer; submission
 * via /mock-test/submit.
 *
 * Expected vars:
 *   - $attempt (array)  attempt row: id, set_id, exam_code, started_at, duration_sec
 *   - $questions (array) list of questions: id, index, type, prompt, options[]
 *   - $user (array)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Practice test — in progress';
require __DIR__ . '/../layouts/header.php';

$attempt = isset($attempt) && is_array($attempt) ? $attempt : [
    'id' => 'ATT-2025-00482', 'set_id' => 'IELTS-A-SET-007', 'exam_code' => 'IELTS-A',
    'started_at' => date('Y-m-d H:i:s'), 'duration_sec' => 9900,
];
$questions = isset($questions) && is_array($questions) ? $questions : [
    ['id' => 'Q1', 'index' => 1, 'type' => 'multiple_choice', 'section' => 'Listening',
     'prompt' => 'The speaker mentions that the library closes at ____ on weekdays. Choose the correct time.',
     'options' => ['5:00 PM', '6:30 PM', '8:00 PM', '9:30 PM']],
    ['id' => 'Q2', 'index' => 2, 'type' => 'multiple_choice', 'section' => 'Listening',
     'prompt' => 'What is the main purpose of the announcement?',
     'options' => ['To advertise a sale', 'To inform about a schedule change', 'To recruit volunteers', 'To announce a holiday']],
    ['id' => 'Q3', 'index' => 3, 'type' => 'true_false_not_given', 'section' => 'Reading',
     'prompt' => 'Statement: The new policy applies to all students regardless of year of enrolment.',
     'options' => ['True', 'False', 'Not Given']],
];
$total = count($questions);
?>
<section class="container alo-section alo-mocktest" data-attempt="<?= $e($attempt['id']) ?>">
    <header class="alo-section__head alo-mocktest__head">
        <div>
            <h1><?= $e($attempt['exam_code']) ?> — Practice Test</h1>
            <p class="alo-muted">Set: <?= $e($attempt['set_id']) ?> · Attempt: <?= $e($attempt['id']) ?></p>
        </div>
        <div class="alo-mocktest__timer" id="timer" data-duration="<?= $e((string)$attempt['duration_sec']) ?>" aria-live="polite">
            <span class="alo-mono" id="timer-display">--:--:--</span>
        </div>
    </header>

    <div class="alo-grid alo-grid--mocktest">
        <!-- Question palette -->
        <aside class="card alo-palette" aria-label="Question palette">
            <header class="alo-card__head"><h2>Questions</h2></header>
            <div class="alo-palette__grid" id="palette">
                <?php for ($i = 1; $i <= $total; $i++): ?>
                    <button type="button" class="alo-palette__btn <?= $i === 1 ? 'is-current' : '' ?>" data-q="<?= $i ?>" aria-label="Question <?= $i ?>"><?= $i ?></button>
                <?php endfor; ?>
            </div>
            <ul class="alo-list alo-palette__legend">
                <li><span class="alo-palette__btn alo-palette__btn--answered"></span> Answered</li>
                <li><span class="alo-palette__btn is-current"></span> Current</li>
                <li><span class="alo-palette__btn"></span> Unanswered</li>
            </ul>
            <form method="post" action="/mock-test/submit" id="submit-form">
                <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
                <input type="hidden" name="attempt_id" value="<?= $e($attempt['id']) ?>">
                <button class="btn btn-danger alo-mocktest__submit" type="submit" id="submit-btn" onclick="return confirm('Submit your practice test? You cannot change answers after submission.')">Submit test</button>
            </form>
        </aside>

        <!-- Question area -->
        <section class="card alo-question" id="question-area">
            <?php foreach ($questions as $qi => $q): ?>
                <article class="alo-question__item" data-index="<?= $e((string)$q['index']) ?>" <?= $qi > 0 ? 'hidden' : '' ?>>
                    <header class="alo-card__head">
                        <span class="alo-badge alo-badge--info"><?= $e($q['section']) ?></span>
                        <h2>Question <?= $e((string)$q['index']) ?> of <?= $e((string)$total) ?></h2>
                        <span class="alo-muted alo-mono"><?= $e($q['type']) ?></span>
                    </header>
                    <p class="alo-question__prompt"><?= $e($q['prompt']) ?></p>
                    <ul class="alo-question__options">
                        <?php foreach ($q['options'] as $oi => $opt): ?>
                            <li>
                                <label class="alo-option">
                                    <input type="radio" name="answer_<?= $e($q['id']) ?>" value="<?= $e((string)($oi + 1)) ?>" data-qid="<?= $e($q['id']) ?>">
                                    <span class="alo-option__marker"><?= $e(chr(65 + $oi)) ?></span>
                                    <span class="alo-option__text"><?= $e($opt) ?></span>
                                </label>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </article>
            <?php endforeach; ?>

            <div class="alo-question__nav">
                <button class="btn btn-secondary" type="button" id="prev-btn">&larr; Previous</button>
                <button class="btn btn-secondary" type="button" id="next-btn">Next &rarr;</button>
            </div>
        </section>
    </div>

    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong> This is an original practice test — not an official exam.
    </div>
</section>

<script>
(function(){
    var duration = parseInt(document.getElementById('timer').dataset.duration, 10) || 0;
    var end = Date.now() + duration * 1000;
    function pad(n){ return n < 10 ? '0'+n : ''+n; }
    function tick(){
        var left = Math.max(0, Math.floor((end - Date.now())/1000));
        var h = Math.floor(left/3600), m = Math.floor((left%3600)/60), s = left%60;
        document.getElementById('timer-display').textContent = pad(h)+':'+pad(m)+':'+pad(s);
        if (left <= 300) { document.getElementById('timer').classList.add('is-low'); }
        if (left <= 0) { document.getElementById('submit-form').submit(); }
    }
    setInterval(tick, 1000); tick();

    var items = document.querySelectorAll('.alo-question__item');
    var palette = document.querySelectorAll('.alo-palette__btn[data-q]');
    function show(i){
        items.forEach(function(el,idx){ el.hidden = idx !== i; });
        palette.forEach(function(b,bi){ b.classList.toggle('is-current', bi === i); });
    }
    var current = 0; show(current);
    document.getElementById('prev-btn').onclick = function(){ if(current>0){ current--; show(current); } };
    document.getElementById('next-btn').onclick = function(){ if(current<items.length-1){ current++; show(current); } };
    palette.forEach(function(b,bi){ b.onclick = function(){ current = bi; show(current); }; });

    document.querySelectorAll('input[type=radio]').forEach(function(r){
        r.addEventListener('change', function(){
            var qid = r.dataset.qid;
            var btn = document.querySelector('.alo-palette__btn[data-q="'+ r.name.replace('answer_','') +'"]');
            // mark answered in palette
            items.forEach(function(it, idx){
                if (it.querySelector('input[name="answer_'+qid+'"]')) {
                    palette[idx].classList.add('alo-palette__btn--answered');
                }
            });
            // save answer via fetch
            var fd = new FormData();
            fd.append('csrf_token', document.querySelector('#submit-form input[name=csrf_token]').value);
            fd.append('attempt_id', document.querySelector('#submit-form input[name=attempt_id]').value);
            fd.append('question_id', qid);
            fd.append('answer', r.value);
            fetch('/mock-test/save-answer', { method:'POST', body: fd, credentials:'same-origin' }).catch(function(){});
        });
    });
})();
</script>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
