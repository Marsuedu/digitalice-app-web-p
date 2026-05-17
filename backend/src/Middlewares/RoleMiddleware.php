<?php

declare(strict_types=1);

namespace DigitalIce\Middlewares;

use DigitalIce\Helpers\ResponseHelper;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;

final class RoleMiddleware implements MiddlewareInterface
{
    public function __construct(private array $roles)
    {
    }

    public function process(Request $request, Handler $handler): Response
    {
        $role = $_SESSION['rol'] ?? null;
        if (!in_array($role, $this->roles, true)) {
            return ResponseHelper::error(new \Slim\Psr7\Response(), 'No tienes permisos para esta accion', [], 403);
        }

        return $handler->handle($request);
    }
}

