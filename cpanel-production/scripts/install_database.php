<?php
/**
 * scripts/install_database.php — Run install.sql + seed.sql + question_sets_seed.sql.
 *
 * Usage: php scripts/install_database.php
 *
 * Reads DB credentials from env, executes the three SQL files in order,
 * prints progress, and exits non-zero on any failure.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

require_once __DIR__ . '/_cli_bootstrap.php';

use App\Core\Database;

$basePath = realpath(__DIR__ . '/..');
$sqlFiles = [
    'install.sql'            => $basePath . '/database/install.sql',
    'seed.sql'               => $basePath . '/database/seed.sql',
    'question_sets_seed.sql' => $basePath . '/database/question_sets_seed.sql',
];

cliOut('ALO English Test Platform — Database Installer', 'cyan');
cliOut(str_repeat('-', 60), 'gray');
cliOut('Target DB: ' . (getenv('DB_DATABASE') ?: '(none)'), 'gray');
cliOut('');

foreach ($sqlFiles as $label => $path) {
    if (!is_file($path)) {
        cliErr("MISSING: {$path}");
        exit(1);
    }
    cliOut("Running {$label}...", 'yellow');
    $sql = file_get_contents($path);
    if ($sql === false || $sql === '') {
        cliErr("Failed to read {$path}.");
        exit(1);
    }

    try {
        $pdo = Database::connection();
        // Split on ";\n" carefully — simple splitter that respects the file format.
        // Each file uses statement-per-line with semicolon terminators.
        $statements = [];
        $buf = '';
        foreach (preg_split('/\R/', $sql) as $line) {
            $trimmed = trim((string) $line);
            if ($trimmed === '' || str_starts_with($trimmed, '--') || str_starts_with($trimmed, '/*') || str_starts_with($trimmed, '//')) {
                continue;
            }
            $buf .= $line . "\n";
            // End-of-statement detection: line ends with ';'
            if (str_ends_with(rtrim($trimmed), ';')) {
                $statements[] = $buf;
                $buf = '';
            }
        }
        if (trim($buf) !== '') {
            $statements[] = $buf;
        }

        $count = 0;
        foreach ($statements as $stmt) {
            $stmt = trim($stmt);
            if ($stmt === '') continue;
            try {
                $pdo->exec($stmt);
                $count++;
            } catch (\PDOException $e) {
                // Ignore "already exists" errors on re-runs.
                if (str_contains($e->getMessage(), 'already exists')) {
                    continue;
                }
                throw $e;
            }
        }
        cliOut("  -> {$count} statements executed.", 'green');
    } catch (\Throwable $e) {
        cliErr("FAILED on {$label}: " . $e->getMessage());
        exit(1);
    }
}

cliOut('');
cliOut('Verification queries:', 'cyan');
$checks = [
    'Tables'        => "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()",
    'Roles'         => "SELECT COUNT(*) FROM exam_roles",
    'Categories'    => "SELECT COUNT(*) FROM exam_categories",
    'Exam types'    => "SELECT COUNT(*) FROM exam_types",
    'Permissions'   => "SELECT COUNT(*) FROM exam_permissions",
    'Question types'=> "SELECT COUNT(*) FROM exam_question_types",
    'Sections'      => "SELECT COUNT(*) FROM exam_sections",
    'Settings'      => "SELECT COUNT(*) FROM exam_settings",
    'Practice sets' => "SELECT COUNT(*) FROM exam_practice_sets",
    'Questions'     => "SELECT COUNT(*) FROM exam_questions",
    'Admin users'   => "SELECT COUNT(*) FROM exam_users",
];

foreach ($checks as $label => $q) {
    try {
        $val = Database::scalar($q);
        cliOut(sprintf('  %-15s = %s', $label, (string) $val), 'green');
    } catch (\Throwable $e) {
        cliOut("  {$label}: ERROR " . $e->getMessage(), 'red');
    }
}

cliOut('');
cliOut('IMPORTANT: replace the placeholder admin password!', 'yellow');
cliOut('  php scripts/reset_admin_password.php admin@alo.com', 'yellow');
cliOut('');
cliOut('Database installation complete.', 'green');
exit(0);
