<?php

declare(strict_types=1);

namespace DigitalIce\Services;

use DigitalIce\Repositories\UserRepository;

final class AuthService
{
    public function __construct(private UserRepository $users = new UserRepository())
    {
    }

    public function login(string $email, string $password): array
    {
        $user = $this->users->findByEmail($email);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new \InvalidArgumentException('Credenciales incorrectas');
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['rol'] = $user['rol'];

        unset($user['password_hash']);
        return $user;
    }

    public function currentUser(): ?array
    {
        if (empty($_SESSION['user_id'])) {
            return null;
        }

        return $this->users->findSessionUser((string) $_SESSION['user_id']);
    }

    public function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', $params['secure'], $params['httponly']);
        }
        session_destroy();
    }

    public function updateCurrentUser(array $data): array
    {
        if (empty($_SESSION['user_id'])) {
            throw new \InvalidArgumentException('Usuario no autenticado');
        }

        $id = (string) $_SESSION['user_id'];
        $payload = [];
        if (isset($data['nombre']) && trim((string) $data['nombre']) !== '') {
            $payload['nombre'] = trim((string) $data['nombre']);
        }
        if (isset($data['correo']) && filter_var($data['correo'], FILTER_VALIDATE_EMAIL)) {
            $payload['correo'] = trim((string) $data['correo']);
        }

        if (!empty($data['new_password'])) {
            $current = $this->users->findRawById($id);
            if (!$current || empty($data['current_password']) || !password_verify((string) $data['current_password'], $current['password_hash'])) {
                throw new \InvalidArgumentException('La contraseña actual no es correcta');
            }
            $payload['password_hash'] = password_hash((string) $data['new_password'], PASSWORD_DEFAULT);
        }

        return $this->users->updateProfile($id, $payload) ?? [];
    }
}
