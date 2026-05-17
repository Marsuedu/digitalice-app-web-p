<?php

declare(strict_types=1);

namespace DigitalIce\Config;

use PDO;

final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $host = AppConfig::get('DB_HOST', '127.0.0.1');
        $port = AppConfig::get('DB_PORT', '3306');
        $database = AppConfig::get('DB_DATABASE', 'digitalice');
        $username = AppConfig::get('DB_USERNAME', 'root');
        $password = AppConfig::get('DB_PASSWORD', '');
        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

        self::$pdo = new PDO($dsn, (string) $username, (string) $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return self::$pdo;
    }
}

