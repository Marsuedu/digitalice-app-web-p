<?php

declare(strict_types=1);

namespace DigitalIce\Repositories;

use DigitalIce\Config\Database;

final class UserRepository
{
    public function findByEmail(string $email): ?array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT u.*, r.nombre AS rol FROM usuarios u INNER JOIN roles r ON r.id = u.rol_id WHERE u.correo = :email AND u.activo = 1 LIMIT 1'
        );
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    public function findSessionUser(string $id): ?array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT u.id, u.nombre, u.correo, r.nombre AS rol FROM usuarios u INNER JOIN roles r ON r.id = u.rol_id WHERE u.id = :id AND u.activo = 1 LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    public function findRawById(string $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM usuarios WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    public function updateProfile(string $id, array $data): ?array
    {
        $fields = array_intersect_key($data, array_flip(['nombre', 'correo', 'password_hash']));
        if ($fields !== []) {
            $sets = array_map(fn ($column) => $column . ' = :' . $column, array_keys($fields));
            $fields['id'] = $id;
            $stmt = Database::pdo()->prepare('UPDATE usuarios SET ' . implode(', ', $sets) . ' WHERE id = :id');
            $stmt->execute($fields);
        }

        return $this->findSessionUser($id);
    }
}
