<?php

declare(strict_types=1);

namespace DigitalIce\Controllers;

use DigitalIce\Helpers\ResponseHelper;
use DigitalIce\Services\AuthService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class AuthController
{
    public function __construct(private AuthService $service = new AuthService())
    {
    }

    public function login(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();
        try {
            $user = $this->service->login((string) ($data['correo'] ?? ''), (string) ($data['password'] ?? ''));
            return ResponseHelper::success($response, $user, 'Sesion iniciada');
        } catch (\Throwable) {
            return ResponseHelper::error($response, 'Credenciales incorrectas', [], 401);
        }
    }

    public function me(Request $request, Response $response): Response
    {
        return ResponseHelper::success($response, $this->service->currentUser());
    }

    public function logout(Request $request, Response $response): Response
    {
        $this->service->logout();
        return ResponseHelper::success($response, null, 'Sesion cerrada');
    }

    public function updateMe(Request $request, Response $response): Response
    {
        try {
            return ResponseHelper::success($response, $this->service->updateCurrentUser((array) $request->getParsedBody()), 'Perfil actualizado');
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 400);
        }
    }
}
