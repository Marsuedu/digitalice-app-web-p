<?php

declare(strict_types=1);

namespace DigitalIce\Controllers;

use DigitalIce\Helpers\ResponseHelper;
use DigitalIce\Repositories\SimpleCatalogRepository;
use DigitalIce\Validators\Validator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class EstudianteController
{
    private SimpleCatalogRepository $repository;

    public function __construct()
    {
        $this->repository = new SimpleCatalogRepository('estudiantes', [
            'nombres', 'apellidos', 'ci', 'extension_ci', 'celular', 'correo', 'fecha_nacimiento',
            'estado_civil', 'direccion', 'ciudad', 'universidad_titulacion', 'carrera',
            'grado_academico', 'institucion_trabajo', 'cargo', 'anio_inicio_trabajo',
            'telefono_oficina', 'telefono_domicilio', 'activo',
        ]);
    }

    public function index(Request $request, Response $response): Response
    {
        return ResponseHelper::success($response, $this->repository->list((string) ($request->getQueryParams()['q'] ?? '')));
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $student = $this->repository->find((string) $args['id']);
        return $student ? ResponseHelper::success($response, $student) : ResponseHelper::error($response, 'Estudiante no encontrado', [], 404);
    }

    public function store(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();
        $errors = array_merge(Validator::require($data, ['nombres', 'apellidos', 'ci', 'extension_ci', 'celular', 'correo']), Validator::email($data['correo'] ?? null));
        if ($errors) {
            return ResponseHelper::error($response, 'Datos invalidos', $errors, 400);
        }
        try {
            return ResponseHelper::success($response, $this->repository->create($data), 'Estudiante registrado', 201);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, 'No se pudo registrar estudiante', ['detalle' => $throwable->getMessage()], 409);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        return ResponseHelper::success($response, $this->repository->update((string) $args['id'], (array) $request->getParsedBody()), 'Estudiante actualizado');
    }

    public function destroy(Request $request, Response $response, array $args): Response
    {
        return ResponseHelper::success($response, $this->repository->deactivate((string) $args['id']), 'Estudiante desactivado');
    }
}
