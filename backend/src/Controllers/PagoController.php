<?php

declare(strict_types=1);

namespace DigitalIce\Controllers;

use DigitalIce\Helpers\ResponseHelper;
use DigitalIce\Services\PagoService;
use DigitalIce\Validators\Validator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class PagoController
{
    public function __construct(private PagoService $service = new PagoService())
    {
    }

    public function byInscription(Request $request, Response $response, array $args): Response
    {
        return ResponseHelper::success($response, $this->service->byInscription((string) $args['inscripcion_id']));
    }

    public function register(Request $request, Response $response, array $args): Response
    {
        $data = (array) $request->getParsedBody();
        $errors = Validator::require($data, ['fecha_pago', 'monto_pagado', 'entidad_facturadora', 'estado_factura', 'codigo_comprobante', 'fecha_comprobante']);
        if ($errors) {
            return ResponseHelper::error($response, 'Datos invalidos', $errors, 400);
        }

        try {
            return ResponseHelper::success(
                $response,
                $this->service->register((string) $args['id'], $data, (string) $_SESSION['user_id'], (string) ($_SESSION['rol'] ?? '')),
                'Pago registrado'
            );
        } catch (\DomainException $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 403);
        } catch (\InvalidArgumentException $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 404);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, 'No se pudo registrar el pago. Verifica los datos del comprobante y la estructura de base de datos.', [
                'detalle' => $throwable->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, Response $response, array $args): Response
    {
        try {
            return ResponseHelper::success(
                $response,
                $this->service->softDelete((string) $args['id'], (string) $_SESSION['user_id']),
                'Pago eliminado'
            );
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, 'No se pudo eliminar el pago.', [
                'detalle' => $throwable->getMessage(),
            ], 500);
        }
    }
}
