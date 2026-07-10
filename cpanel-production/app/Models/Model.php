<?php
declare(strict_types=1);
namespace App\Models;

use App\Core\Database;

abstract class Model
{
    protected static string $table = '';
    protected static string $primaryKey = 'id';

    public static function find(int $id): ?array
    {
        return Database::one('SELECT * FROM ' . static::$table . ' WHERE ' . static::$primaryKey . ' = :id LIMIT 1', ['id' => $id]);
    }

    public static function all(int $limit = 100, int $offset = 0): array
    {
        return Database::all('SELECT * FROM ' . static::$table . ' ORDER BY ' . static::$primaryKey . ' DESC LIMIT :limit OFFSET :offset', ['limit' => $limit, 'offset' => $offset]);
    }

    public static function create(array $data): int
    {
        return Database::insert(static::$table, $data);
    }

    public static function update(int $id, array $data): int
    {
        return Database::update(static::$table, $data, static::$primaryKey . ' = :id', ['id' => $id]);
    }

    public static function delete(int $id): int
    {
        return Database::delete(static::$table, static::$primaryKey . ' = :id', ['id' => $id]);
    }

    public static function count(): int
    {
        return (int) (Database::scalar('SELECT COUNT(*) FROM ' . static::$table) ?: 0);
    }
}
