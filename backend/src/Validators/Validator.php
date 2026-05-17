<?php

declare(strict_types=1);

namespace DigitalIce\Validators;

final class Validator
{
    public static function require(array $data, array $fields): array
    {
        $errors = [];
        foreach ($fields as $field) {
            if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
                $errors[$field] = 'Campo obligatorio';
            }
        }

        return $errors;
    }

    public static function email(?string $value, string $field = 'correo'): array
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return [$field => 'Correo invalido'];
        }

        return [];
    }
}

