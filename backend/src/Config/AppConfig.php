<?php

declare(strict_types=1);

namespace DigitalIce\Config;

final class AppConfig
{
    public static function loadEnv(string $path): void
    {
        if (!is_file($path)) {
            return;
        }

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = array_map('trim', explode('=', $line, 2));
            if (getenv($key) === false) {
                putenv($key . '=' . $value);
                $_ENV[$key] = $value;
            }
        }
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $value = getenv($key);
        return $value === false ? $default : $value;
    }

    public static function debug(): bool
    {
        return filter_var(self::get('APP_DEBUG', false), FILTER_VALIDATE_BOOLEAN);
    }

    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name((string) self::get('SESSION_NAME', 'digitalice_session'));
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => filter_var(self::get('SESSION_SECURE', false), FILTER_VALIDATE_BOOLEAN),
            'httponly' => true,
            'samesite' => (string) self::get('SESSION_SAMESITE', 'Lax'),
        ]);
        session_start();
    }
}

