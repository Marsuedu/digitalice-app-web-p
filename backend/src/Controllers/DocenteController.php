<?php

declare(strict_types=1);

namespace DigitalIce\Controllers;

use DigitalIce\Helpers\ResponseHelper;
use DigitalIce\Repositories\SimpleCatalogRepository;
use DigitalIce\Validators\Validator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class DocenteController
{
    private SimpleCatalogRepository $repository;

    public function __construct()
    {
        $this->repository = new SimpleCatalogRepository('docentes', ['nombre', 'correo_personal', 'celular', 'carrera', 'pais', 'activo']);
    }

    public function index(Request $request, Response $response): Response
    {
        return ResponseHelper::success($response, $this->repository->list((string) ($request->getQueryParams()['q'] ?? '')));
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $teacher = $this->repository->find((string) $args['id']);
        return $teacher ? ResponseHelper::success($response, $teacher) : ResponseHelper::error($response, 'Docente no encontrado', [], 404);
    }

    public function store(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();
        $errors = array_merge(Validator::require($data, ['nombre', 'correo_personal', 'celular', 'carrera', 'pais']), Validator::email($data['correo_personal'] ?? null, 'correo_personal'));
        if ($errors) {
            return ResponseHelper::error($response, 'Datos invalidos', $errors, 400);
        }
        try {
            return ResponseHelper::success($response, $this->repository->create($data), 'Docente registrado', 201);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, 'No se pudo registrar docente', ['detalle' => $throwable->getMessage()], 409);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        return ResponseHelper::success($response, $this->repository->update((string) $args['id'], (array) $request->getParsedBody()), 'Docente actualizado');
    }

    public function destroy(Request $request, Response $response, array $args): Response
    {
        return ResponseHelper::success($response, $this->repository->deactivate((string) $args['id']), 'Docente desactivado');
    }
}
