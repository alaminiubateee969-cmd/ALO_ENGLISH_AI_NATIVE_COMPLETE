<?php
/**
 * views/student/settings.php — Account settings.
 * Expected vars: $user. PHP 8.2+.
 */
if (!isset($e) || !is_callable($e)) {
    $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = 'Account settings';
require __DIR__ . '/../layouts/header.php';
$user = isset($user) && is_array($user) ? $user : ['name' => 'Rifat Hossain', 'email' => 'rifat@example.com', 'locale' => 'en', 'timezone' => 'Asia/Kolkata'];
?>
<section class="container alo-section alo-section--narrow">
    <header class="alo-section__head"><h1>Account settings</h1></header>

    <form class="card alo-form" method="post" action="/student/settings">
        <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
        <div class="form-row">
            <label class="form-label" for="name">Full name</label>
            <input class="form-input" type="text" id="name" name="name" value="<?= $e($user['name']) ?>" required>
        </div>
        <div class="form-row">
            <label class="form-label" for="email">Email</label>
            <input class="form-input" type="email" id="email" name="email" value="<?= $e($user['email']) ?>" required>
        </div>
        <div class="form-row">
            <label class="form-label" for="locale">Language</label>
            <select class="form-input" id="locale" name="locale">
                <option value="en" <?= $user['locale']==='en'?'selected':'' ?>>English</option>
                <option value="bn" <?= $user['locale']==='bn'?'selected':'' ?>>বাংলা</option>
                <option value="hi" <?= $user['locale']==='hi'?'selected':'' ?>>हिन्दी</option>
            </select>
        </div>
        <div class="form-row">
            <label class="form-label" for="tz">Timezone</label>
            <input class="form-input" type="text" id="tz" name="timezone" value="<?= $e($user['timezone']) ?>">
        </div>
        <div class="form-row"><button class="btn btn-primary" type="submit">Save changes</button></div>
    </form>

    <section class="card">
        <header class="alo-card__head"><h2>Change password</h2></header>
        <form class="alo-form" method="post" action="/student/settings">
            <input type="hidden" name="csrf_token" value="<?= $e(isset($csrf_token) ? $csrf_token : '') ?>">
            <input type="hidden" name="action" value="change_password">
            <div class="form-row">
                <label class="form-label" for="cur">Current password</label>
                <input class="form-input" type="password" id="cur" name="current_password" required>
            </div>
            <div class="form-row">
                <label class="form-label" for="new">New password (min 12 chars)</label>
                <input class="form-input" type="password" id="new" name="new_password" minlength="12" required>
            </div>
            <div class="form-row"><button class="btn btn-secondary" type="submit">Update password</button></div>
        </form>
    </section>
</section>
<?php require __DIR__ . '/../layouts/footer.php'; ?>
