<?php
/**
 * app/Core/Database.php — PDO singleton wrapper.
 *
 * Provides:
 *   - lazy singleton connection (built from config/database.php)
 *   - prepared-statement helper (named & positional params)
 *   - fetch helpers (one, all, scalar, exists)
 *   - transaction helpers (begin/commit/rollback, transactional())
 *   - last-insert-id + row-count helpers
 *
 * All SQL is executed via prepared statements — never string interpolation.
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;
use PDOStatement;
use RuntimeException;

final class Database
{
    private static ?PDO $pdo = null;
    private static array $config = [];

    /** Prevent instantiation. */
    private function __construct() {}

    public static function configure(array $config): void
    {
        self::$config = $config;
        // Reset cached connection if config changes (mainly tests).
        self::$pdo = null;
    }

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        if (self::$config === []) {
            // Lazy-load default config if not configured explicitly.
            self::$config = require __DIR__ . '/../../config/database.php';
        }

        $cfg = self::$config;
        if ($cfg['database'] === '' || $cfg['username'] === '') {
            throw new RuntimeException('Database credentials not configured.');
        }

        try {
            $pdo = new PDO(
                $cfg['dsn'],
                $cfg['username'],
                $cfg['password'],
                $cfg['options'] ?? []
            );
        } catch (PDOException $e) {
            // Never expose $e->getMessage() to end users.
            throw new RuntimeException('Database connection failed.', 0, $e);
        }

        // Force strict MySQL modes for predictable behavior.
        $pdo->exec("SET NAMES {$cfg['charset']} COLLATE {$cfg['collation']}");
        $pdo->exec("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION'");
        $pdo->exec("SET SESSION time_zone = '+00:00'");

        self::$pdo = $pdo;
        return $pdo;
    }

    // ---------- Prepared statement runner ----------

    /**
     * Prepare + execute + return statement.
     *
     * @param string $sql        SQL with ? or :name placeholders
     * @param array  $params     Bind values (positional or associative)
     */
    public static function run(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::connection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    // ---------- Fetch helpers ----------

    /** Fetch a single row (assoc) or null. */
    public static function one(string $sql, array $params = []): ?array
    {
        $row = self::run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    /** Fetch all rows. */
    public static function all(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll();
    }

    /** Fetch a single scalar column (first column of first row) or null. */
    public static function scalar(string $sql, array $params = []): mixed
    {
        $row = self::run($sql, $params)->fetch(PDO::FETCH_NUM);
        return ($row === false || !isset($row[0])) ? null : $row[0];
    }

    /** TRUE if at least one row matches. */
    public static function exists(string $sql, array $params = []): bool
    {
        $row = self::run($sql, $params)->fetch(PDO::FETCH_NUM);
        return $row !== false;
    }

    // ---------- Write helpers ----------

    public static function insert(string $table, array $data): int
    {
        if ($data === []) {
            throw new RuntimeException("insert(): empty data for table '{$table}'");
        }
        $cols = array_keys($data);
        $placeholders = array_map(static fn(string $c) => ':' . $c, $cols);
        $sql = sprintf(
            'INSERT INTO `%s` (`%s`) VALUES (%s)',
            $table,
            implode('`, `', $cols),
            implode(', ', $placeholders)
        );
        self::run($sql, $data);
        return (int) self::connection()->lastInsertId();
    }

    public static function update(string $table, array $data, string $where, array $whereParams = []): int
    {
        if ($data === []) {
            return 0;
        }
        $set = [];
        $params = [];
        foreach ($data as $col => $value) {
            $set[] = "`{$col}` = :set_{$col}";
            $params['set_' . $col] = $value;
        }
        $sql = sprintf('UPDATE `%s` SET %s WHERE %s', $table, implode(', ', $set), $where);
        $stmt = self::run($sql, array_merge($params, $whereParams));
        return $stmt->rowCount();
    }

    public static function delete(string $table, string $where, array $params = []): int
    {
        $stmt = self::run("DELETE FROM `{$table}` WHERE {$where}", $params);
        return $stmt->rowCount();
    }

    // ---------- Transactions ----------

    public static function begin(): void
    {
        self::connection()->beginTransaction();
    }

    public static function commit(): void
    {
        self::connection()->commit();
    }

    public static function rollback(): void
    {
        if (self::connection()->inTransaction()) {
            self::connection()->rollBack();
        }
    }

    /**
     * Run a closure inside a transaction; commit on success, rollback on
     * any Throwable. Returns the closure's return value.
     *
     * @template T
     * @param callable():T $fn
     * @return T
     */
    public static function transactional(callable $fn): mixed
    {
        self::begin();
        try {
            $r = $fn();
            self::commit();
            return $r;
        } catch (\Throwable $e) {
            self::rollback();
            throw $e;
        }
    }

    // ---------- Misc ----------

    public static function quoteIdentifier(string $name): string
    {
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name)) {
            throw new RuntimeException("Invalid identifier: {$name}");
        }
        return "`{$name}`";
    }
}
