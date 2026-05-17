<?php

declare(strict_types=1);

namespace DigitalIce\Controllers;

use DigitalIce\Helpers\ResponseHelper;
use DigitalIce\Services\NotaService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class NotaController
{
    public function __construct(private NotaService $service = new NotaService())
    {
    }

    public function courses(Request $request, Response $response): Response
    {
        return ResponseHelper::success($response, $this->service->courses((string) $_SESSION['user_id'], (string) ($_SESSION['rol'] ?? '')));
    }

    public function students(Request $request, Response $response, array $args): Response
    {
        return ResponseHelper::success(
            $response,
            $this->service->studentsByCourseModule((string) $args['producto_modulo_id'], (string) $_SESSION['user_id'], (string) ($_SESSION['rol'] ?? ''))
        );
    }

    public function store(Request $request, Response $response): Response
    {
        return $this->save($request, $response, null);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        return $this->save($request, $response, (string) $args['id']);
    }

    private function save(Request $request, Response $response, ?string $moduleId): Response
    {
        $data = (array) $request->getParsedBody();
        $moduleId = $moduleId ?: (string) ($data['inscripcion_modulo_id'] ?? '');
        if ($moduleId === '' || !isset($data['nota'])) {
            return ResponseHelper::error($response, 'Datos invalidos', ['nota' => 'Campo obligatorio'], 400);
        }

        try {
            return ResponseHelper::success(
                $response,
                $this->service->save($moduleId, (float) $data['nota'], (string) $_SESSION['user_id'], (string) ($_SESSION['rol'] ?? '')),
                'Nota registrada'
            );
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 400);
        }
    }
}
