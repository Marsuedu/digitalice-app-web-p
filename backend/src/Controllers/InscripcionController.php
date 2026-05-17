<?php

declare(strict_types=1);

namespace DigitalIce\Controllers;

use DigitalIce\Helpers\ResponseHelper;
use DigitalIce\Services\InscripcionService;
use DigitalIce\Validators\Validator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class InscripcionController
{
    public function __construct(private InscripcionService $service = new InscripcionService())
    {
    }

    public function index(Request $request, Response $response): Response
    {
        return ResponseHelper::success($response, $this->service->list());
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $inscription = $this->service->find((string) $args['id']);
        return $inscription ? ResponseHelper::success($response, $inscription) : ResponseHelper::error($response, 'Inscripcion no encontrada', [], 404);
    }

    public function modules(Request $request, Response $response, array $args): Response
    {
        return ResponseHelper::success($response, $this->service->modules((string) $args['id']));
    }

    public function store(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();
        $errors = Validator::require($data, ['estudiante_id', 'producto_id', 'metodo_pago', 'monto_total']);
        if (($data['metodo_pago'] ?? '') === 'CUOTAS' && empty($data['comprometido_pago'])) {
            $errors['comprometido_pago'] = 'Debe aceptar el compromiso de pago';
        }
        if (($data['metodo_pago'] ?? '') === 'CUOTAS' && empty($data['cantidad_cuotas'])) {
            $errors['cantidad_cuotas'] = 'Debe indicar la cantidad de cuotas';
        }
        if ($errors) {
            return ResponseHelper::error($response, 'Datos invalidos', $errors, 400);
        }

        try {
            $inscription = $this->service->create($data, (string) $_SESSION['user_id']);
            return ResponseHelper::success($response, $inscription, 'Inscripcion creada', 201);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 409);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $data = (array) $request->getParsedBody();
        try {
            $inscription = $this->service->update((string) $args['id'], $data);
            return $inscription ? ResponseHelper::success($response, $inscription, 'Inscripcion actualizada') : ResponseHelper::error($response, 'Inscripcion no encontrada', [], 404);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 409);
        }
    }

    public function destroy(Request $request, Response $response, array $args): Response
    {
        return ResponseHelper::success(
            $response,
            $this->service->softDelete((string) $args['id'], (string) $_SESSION['user_id']),
            'Inscripcion eliminada'
        );
    }

    public function assignTeacher(Request $request, Response $response, array $args): Response
    {
        $data = (array) $request->getParsedBody();
        if (empty($data['docente_id'])) {
            return ResponseHelper::error($response, 'Datos invalidos', ['docente_id' => 'Campo obligatorio'], 400);
        }

        return ResponseHelper::success($response, $this->service->assignTeacher((string) $args['id'], (string) $data['docente_id']), 'Docente asignado');
    }
}
