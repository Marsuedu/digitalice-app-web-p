<?php

declare(strict_types=1);

namespace DigitalIce\Middlewares;

use DigitalIce\Helpers\ResponseHelper;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;

final class AuthMiddleware implements MiddlewareInterface
{
    public function process(Request $request, Handler $handler): Response
    {
        if (empty($_SESSION['user_id'])) {
            return ResponseHelper::error(new \Slim\Psr7\Response(), 'Usuario no autenticado', [], 401);
        }

        return $handler->handle($request);
    }
}

