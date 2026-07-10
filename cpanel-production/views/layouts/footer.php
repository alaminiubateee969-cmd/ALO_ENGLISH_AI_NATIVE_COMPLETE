<?php
/**
 * views/layouts/footer.php — Shared HTML footer.
 *
 * Expected vars:
 *   - $e (callable) escaper
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$year = date('Y');
?>
</main>
<footer class="alo-footer" role="contentinfo">
    <div class="container alo-footer__grid">
        <div class="alo-footer__col">
            <h3 class="alo-footer__heading">Exams</h3>
            <ul>
                <li><a href="/computer-based-exams">All CBT Exams</a></li>
                <li><a href="/ielts">IELTS-style Practice</a></li>
                <li><a href="/pte">PTE-style Practice</a></li>
                <li><a href="/toefl">TOEFL-style Practice</a></li>
                <li><a href="/duolingo">Duolingo-style Practice</a></li>
                <li><a href="/sat">SAT-style Practice</a></li>
            </ul>
        </div>
        <div class="alo-footer__col">
            <h3 class="alo-footer__heading">Platform</h3>
            <ul>
                <li><a href="/mock-tests">Mock Tests</a></li>
                <li><a href="/how-exams-work">How Exams Work</a></li>
                <li><a href="/pricing">Pricing</a></li>
                <li><a href="/exam-disclaimer">Practice Disclaimer</a></li>
                <li><a href="/ambassador">Ambassador Program</a></li>
            </ul>
        </div>
        <div class="alo-footer__col">
            <h3 class="alo-footer__heading">Company</h3>
            <ul>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/login">Student / Staff Login</a></li>
            </ul>
        </div>
        <div class="alo-footer__col alo-footer__brand">
            <div class="alo-logo">
                <span class="alo-logo__mark" aria-hidden="true">ALO</span>
                <span class="alo-logo__word">English</span>
            </div>
            <p class="alo-footer__disclaimer">
                Practice tests on this platform are original, exam-aligned study
                material. They are not affiliated with, endorsed by, or reproduced
                from any official test publisher. Estimated scores only — not
                official exam results.
            </p>
            <p class="alo-footer__crm">
                <span class="alo-status-dot" aria-hidden="true"></span>
                Connected to ALO Web_CRM
            </p>
        </div>
    </div>
    <div class="alo-footer__bar">
        <div class="container alo-footer__bar-inner">
            <p>&copy; <?= $e($year) ?> ALO Education. All rights reserved.</p>
            <p>ALO English Test Platform — cPanel CBT production build.</p>
        </div>
    </div>
</footer>
<script src="/public/js/main.js" defer></script>
</body>
</html>
