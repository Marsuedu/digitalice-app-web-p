<?php

declare(strict_types=1);

namespace DigitalIce\Middlewares;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;

final class JsonBodyMiddleware implements MiddlewareInterface
{
    public function process(Request $request, Handler $handler): Response
    {
        if (str_contains($request->getHeaderLine('Content-Type'), 'application/json')) {
            $body = (string) $request->getBody();
            $data = $body === '' ? [] : json_decode($body, true);
            if (is_array($data)) {
                $request = $request->withParsedBody($data);
            }
        }

        return $handler->handle($request);
    }
}

