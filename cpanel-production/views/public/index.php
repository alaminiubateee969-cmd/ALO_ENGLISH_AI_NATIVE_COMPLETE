<?php
/**
 * views/public/index.php — Home page.
 *
 * Expected vars:
 *   - $exams       array  list of exam types (each: type_code, type_name,
 *                         style_label, category_code)
 *   - $csrf_field  string pre-rendered CSRF hidden input HTML
 *   - $e           callable escaper
 *
 * Renders 200 with an empty $exams array.
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$exams       = $exams       ?? [];
$csrf_field  = $csrf_field  ?? '';
$title = 'Premium English exam practice';
require __DIR__ . '/../layouts/header.php';
?>
<section class="alo-hero">
    <div class="container alo-hero__inner">
        <p class="alo-hero__eyebrow">ALO English Test Platform</p>
        <h1 class="alo-hero__title">Premium English exam practice</h1>
        <p class="alo-hero__lede">
            Original, exam-aligned mock tests for 32 computer-based exams —
            IELTS, PTE, TOEFL, Duolingo, OET, SAT, GRE, GMAT and more.
            Practice-only, instant Smart Score Reports, CRM-synced for ALO students.
        </p>
        <div class="alo-hero__cta">
            <a class="btn btn-primary" href="/mock-tests">Start a free mock test</a>
            <a class="btn btn-secondary" href="/computer-based-exams">Browse all exams</a>
        </div>
        <p class="alo-hero__note">
            Practice only. Estimated scores. Not affiliated with any official test publisher.
        </p>
    </div>
</section>

<section class="container alo-section">
    <div class="alo-quota-banner" role="note">
        <div class="alo-quota-banner__col">
            <span class="alo-quota-banner__num">3</span>
            <span class="alo-quota-banner__label">Free ALO student mock tests<br>(backend-enforced, shared across all 32 exams)</span>
        </div>
        <div class="alo-quota-banner__divider" aria-hidden="true"></div>
        <div class="alo-quota-banner__col">
            <span class="alo-quota-banner__num">1</span>
            <span class="alo-quota-banner__label">Free public mock test<br>(no sign-up fee, no card required)</span>
        </div>
    </div>
</section>

<section class="container alo-section">
    <header class="alo-section__head">
        <h2>Exams we cover</h2>
        <p>32 computer-based exams across English proficiency, study-abroad entrance, university internal, visa interview, and ALO internal categories.</p>
    </header>

    <?php if (!empty($exams)): ?>
        <div class="alo-grid alo-grid--3">
            <?php foreach ($exams as $exam): ?>
                <?php
                    $code = isset($exam['type_code']) ? $exam['type_code'] : '';
                    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', (string) $code));
                    $slug = trim($slug, '-');
                    $link = '/' . rawurlencode($slug);
                ?>
                <article class="card alo-exam-card">
                    <h3 class="alo-exam-card__title"><?= $e($exam['type_name'] ?? '') ?></h3>
                    <p class="alo-exam-card__style"><?= $e($exam['style_label'] ?? '') ?></p>
                    <a class="btn btn-link" href="<?= $e($link) ?>">View exam page &rarr;</a>
                </article>
            <?php endforeach; ?>
        </div>
    <?php else: ?>
        <div class="alo-empty">
            <p>Exam catalog is being prepared. Please check back shortly.</p>
            <a class="btn btn-secondary" href="/contact">Contact ALO Education</a>
        </div>
    <?php endif; ?>
</section>

<section class="container alo-section">
    <div class="alo-cta-band">
        <div>
            <h2>Ready to start practicing?</h2>
            <p>Create your account and claim your free quota. ALO students get 3 free mocks, public students get 1 — no card required.</p>
        </div>
        <div class="alo-cta-band__buttons">
            <a class="btn btn-primary" href="/register">Create free account</a>
            <a class="btn btn-secondary" href="/login">Login</a>
        </div>
    </div>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
