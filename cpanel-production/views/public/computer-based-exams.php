<?php
/**
 * views/public/computer-based-exams.php — Universal CBT engine catalog page.
 *
 * Lists all 32 exams by category and explains the universal CBT engine.
 *
 * Expected vars:
 *   - $e (callable)
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Computer-based exams (CBT)';
require __DIR__ . '/../layouts/header.php';

// Same catalog definition as config/exams.php (display copy only).
$categories = [
    [
        'code'  => 'english',
        'name'  => 'English Proficiency',
        'exams' => [
            ['IELTS', 'IELTS Academic — 4 sections, band 0–9'],
            ['IELTS_GENERAL', 'IELTS General Training — 4 sections, band 0–9'],
            ['PTE', 'PTE Academic — 20 item types, 10–90'],
            ['TOEFL', 'TOEFL iBT — 4 sections, 0–120'],
            ['DUOLINGO', 'Duolingo English Test — adaptive, 10–160'],
            ['OET', 'OET — 4 sub-tests, A–E grades'],
            ['LANGUAGECERT', 'LanguageCert IESOL — B1–C2'],
            ['LINGUASKILL', 'Linguaskill Business / General — CEFR'],
            ['OIETC', 'OIETC / Oxford ELLT — B2–C1'],
            ['TOEIC', 'TOEIC L&R + S&W — 5–990'],
            ['CAMBRIDGE', 'Cambridge B2 First / C1 Advanced'],
        ],
    ],
    [
        'code'  => 'study-abroad',
        'name'  => 'Study Abroad Entrance',
        'exams' => [
            ['SAT', 'Digital SAT — Reading & Writing + Math, 400–1600'],
            ['GRE', 'GRE General Test — 130–170 per section'],
            ['GMAT', 'GMAT Focus — 205–805'],
            ['LSAT', 'LSAT — 120–180'],
            ['MCAT', 'MCAT — 472–528'],
            ['ACT', 'ACT — 1–36'],
        ],
    ],
    [
        'code'  => 'university',
        'name'  => 'University Internal',
        'exams' => [
            ['UNI_EPT_A', 'University English Placement Test — Form A'],
            ['UNI_EPT_B', 'University English Placement Test — Form B'],
            ['UNI_EPT_C', 'University English Placement Test — Form C'],
            ['UNI_EPT_D', 'University English Placement Test — Form D'],
            ['UNI_EPT_E', 'University English Placement Test — Form E'],
        ],
    ],
    [
        'code'  => 'visa',
        'name'  => 'Visa / Interview',
        'exams' => [
            ['VISA_US', 'US visa interview practice — speaking'],
            ['VISA_UK', 'UK visa interview practice — speaking'],
            ['VISA_CA', 'Canada visa interview practice — speaking'],
            ['VISA_AU', 'Australia visa interview practice — speaking'],
            ['VISA_SCHENGEN', 'Schengen visa interview practice — speaking'],
        ],
    ],
    [
        'code'  => 'alo-internal',
        'name'  => 'ALO Internal',
        'exams' => [
            ['ALO_DIAGNOSTIC', 'ALO diagnostic test — placement baseline'],
            ['ALO_PLACEMENT', 'ALO placement test — cohort assignment'],
            ['ALO_PROGRESS', 'ALO progress test — mid-course'],
            ['ALO_ENDTERM', 'ALO end-of-term test — final'],
            ['ALO_EXIT', 'ALO exit test — graduation check'],
        ],
    ],
];
$totalExams = array_sum(array_map(fn ($c) => count($c['exams']), $categories));
?>
<section class="alo-hero alo-hero--compact">
    <div class="container alo-hero__inner">
        <p class="alo-hero__eyebrow">Universal CBT engine</p>
        <h1 class="alo-hero__title"><?= $e((string)$totalExams) ?> computer-based exams, one engine</h1>
        <p class="alo-hero__lede">
            Every exam on the ALO English Test Platform runs on a single
            universal computer-based testing (CBT) engine — adaptive modules,
            audio recording, writing capture, auto-save, examiner queue, and
            Smart Score Reports. Practice only; not affiliated with any
            official test publisher.
        </p>
        <div class="alo-hero__cta">
            <a class="btn btn-primary" href="/mock-tests">Browse mock tests</a>
            <a class="btn btn-secondary" href="/how-exams-work">How it works</a>
        </div>
    </div>
</section>

<section class="container alo-section">
    <header class="alo-section__head">
        <h2>Universal CBT engine features</h2>
        <p>Every exam type shares the same proven delivery engine — only the content and scoring rules differ.</p>
    </header>
    <div class="alo-grid alo-grid--3">
        <article class="card"><h3>Adaptive modules</h3><p>Digital SAT-style adaptive module routing is supported natively, with per-module scoring.</p></article>
        <article class="card"><h3>Audio recording</h3><p>Browser-based microphone capture for speaking sections, securely stored outside the web root.</p></article>
        <article class="card"><h3>Writing capture</h3><p>Typed-text-only writing sections with copy-paste disabled to deter plagiarism.</p></article>
        <article class="card"><h3>Auto-save</h3><p>Answers save every 30 seconds; resume within 60 minutes if a session is interrupted.</p></article>
        <article class="card"><h3>Examiner queue</h3><p>Speaking and Writing responses enter a review queue for trained human examiners.</p></article>
        <article class="card"><h3>Smart Score Reports</h3><p>Estimated scores per section plus AI next-action suggestions and PDF download.</p></article>
    </div>
</section>

<section class="container alo-section">
    <header class="alo-section__head">
        <h2>The <?= $e((string)$totalExams) ?> exams</h2>
        <p>Five categories, one platform. Click any exam to see its practice page.</p>
    </header>

    <?php foreach ($categories as $cat): ?>
        <h3 class="alo-cat-title"><?= $e($cat['name']) ?> <span class="alo-cat-count">(<?= $e((string)count($cat['exams'])) ?>)</span></h3>
        <div class="alo-grid alo-grid--3">
            <?php foreach ($cat['exams'] as $exam): ?>
                <?php
                    $slug = strtolower($exam[0]);
                    // Alias the most common short slugs to the routed landing pages.
                    $aliasMap = [
                        'ielts' => 'ielts', 'ielts_general' => 'ielts',
                        'pte' => 'pte', 'toefl' => 'toefl', 'duolingo' => 'duolingo',
                        'oet' => 'oet', 'languagecert' => 'languagecert',
                        'linguaskill' => 'linguaskill', 'oietc' => 'oietc',
                        'toeic' => 'toeic', 'cambridge' => 'cambridge',
                        'sat' => 'sat', 'gre' => 'gre', 'gmat' => 'gmat',
                        'lsat' => 'lsat', 'mcat' => 'mcat', 'act' => 'act',
                    ];
                    $slug = $aliasMap[$slug] ?? $slug;
                    $link = '/' . $slug;
                ?>
                <article class="card alo-exam-card">
                    <h4 class="alo-exam-card__title"><?= $e($exam[0]) ?></h4>
                    <p class="alo-exam-card__style"><?= $e($exam[1]) ?></p>
                    <a class="btn btn-link" href="<?= $e($link) ?>">View exam &rarr;</a>
                </article>
            <?php endforeach; ?>
        </div>
    <?php endforeach; ?>
</section>

<div class="container">
    <div class="alo-disclaimer-banner" role="note">
        <strong>Practice only.</strong>
        All <?= $e((string)$totalExams) ?> exams listed above are original,
        exam-aligned practice content. They are not affiliated with, endorsed
        by, or reproduced from any official test publisher.
    </div>
</div>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
