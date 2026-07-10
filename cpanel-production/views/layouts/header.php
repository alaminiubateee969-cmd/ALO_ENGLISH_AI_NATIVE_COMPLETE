<?php
/**
 * views/layouts/header.php — Shared HTML header.
 *
 * Expected vars (extracted by Response::view()):
 *   - $title  (string) page <title>, default "ALO English Test Platform"
 *   - $e      (callable) escaper provided by Response::view()
 *
 * PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    // Defensive fallback so a misconfigured view never XSSes.
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$pageTitle = isset($title) && $title !== '' ? $title . ' — ALO English Test Platform' : 'ALO English Test Platform';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="ALO English Test Platform — original, exam-aligned practice tests for IELTS, PTE, TOEFL, Duolingo, OET, SAT, GRE, GMAT and more. Practice only; not affiliated with any official test publisher.">
    <meta name="theme-color" content="#0057B8">
    <title><?= $e($pageTitle) ?></title>
    <link rel="stylesheet" href="/public/css/style.css">
</head>
<body>
<header class="alo-header" role="banner">
    <div class="container alo-header__inner">
        <a class="alo-logo" href="/" aria-label="ALO English — Home">
            <span class="alo-logo__mark" aria-hidden="true">ALO</span>
            <span class="alo-logo__word">English</span>
        </a>
        <button class="alo-nav-toggle" type="button" aria-controls="alo-nav" aria-expanded="false" aria-label="Toggle navigation">
            <span></span><span></span><span></span>
        </button>
        <nav id="alo-nav" class="alo-nav" role="navigation" aria-label="Primary">
            <a href="/">Home</a>
            <a href="/computer-based-exams">Exams</a>
            <a href="/mock-tests">Mock Tests</a>
            <a href="/pricing">Pricing</a>
            <a href="/ambassador">Ambassador</a>
            <a href="/contact">Contact</a>
            <a class="alo-nav__login" href="/login">Login</a>
        </nav>
    </div>
</header>
<main class="alo-main" role="main">
