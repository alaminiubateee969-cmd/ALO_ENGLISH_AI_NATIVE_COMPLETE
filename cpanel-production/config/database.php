<?php
/**
 * config/database.php — MySQL 8 / PDO connection configuration.
 *
 * All values come from environment variables. The PDO connection is
 * constructed with secure defaults: prepared statements, exception
 * error mode, associative fetch, emulated prepares OFF.
 * PHP 8.2+.
 */

declare(strict_types=1);

$host     = (string)(getenv('DB_HOST') ?: 'localhost');
$port     = (int)(getenv('DB_PORT') ?: 3306);
$database = (string)(getenv('DB_DATABASE') ?: '');
$username = (string)(getenv('DB_USERNAME') ?: '');
$password = (string)(getenv('DB_PASSWORD') ?: '');
$charset  = (string)(getenv('DB_CHARSET') ?: 'utf8mb4');
$collation = (string)(getenv('DB_COLLATION') ?: 'utf8mb4_unicode_ci');
$socket   = (string)(getenv('DB_SOCKET') ?: '');

// Build DSN — prefer Unix socket if provided (faster + safer on shared hosts).
if ($socket !== '') {
    $dsn = sprintf('mysql:unix_socket=%s;dbname=%s;charset=%s', $socket, $database, $charset);
} else {
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $host, $port, $database, $charset);
}

return [
    'dsn'        => $dsn,
    'host'       => $host,
    'port'       => $port,
    'database'   => $database,
    'username'   => $username,
    'password'   => $password,
    'charset'    => $charset,
    'collation'  => $collation,
    'socket'     => $socket,

    'options' => [
        // Throw exceptions on error (never silent failures).
        \PDO::ATTR_ERRMODE            => \PDO::ERRMODE_EXCEPTION,
        // Default fetch mode: associative array.
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        // Use REAL server-side prepared statements.
        \PDO::ATTR_EMULATE_PREPARES   => false,
        // Lower-statement timeout (seconds) to prevent runaway queries.
        \PDO::ATTR_TIMEOUT            => 30,
        // Persistent connections OFF on cPanel shared hosting.
        \PDO::ATTR_PERSISTENT         => false,
    ],
];
