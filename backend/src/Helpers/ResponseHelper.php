<?php

declare(strict_types=1);

namespace DigitalIce\Helpers;

use Psr\Http\Message\ResponseInterface as Response;

final class ResponseHelper
{
    public static function success(Response $response, mixed $data = null, string $message = 'Operacion realizada correctamente', int $status = 200): Response
    {
        return self::json($response, [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    public static function error(Response $response, string $message, array $errors = [], int $status = 400): Response
    {
        return self::json($response, [
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }

    private static function json(Response $response, array $payload, int $status): Response
    {
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}

