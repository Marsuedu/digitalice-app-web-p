<?php

declare(strict_types=1);

namespace DigitalIce\Middlewares;

use DigitalIce\Config\AppConfig;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;

final class CorsMiddleware implements MiddlewareInterface
{
    public function process(Request $request, Handler $handler): Response
    {
        $origin = (string) AppConfig::get(
            'FRONTEND_URL',
            'https://digitalice-app-web-p2.pages.dev'
        );

        if ($request->getMethod() === 'OPTIONS') {
            $response = new \Slim\Psr7\Response();
        } else {
            $response = $handler->handle($request);
        }

        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
}
