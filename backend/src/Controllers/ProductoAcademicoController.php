<?php

declare(strict_types=1);

namespace DigitalIce\Controllers;

use DigitalIce\Helpers\ResponseHelper;
use DigitalIce\Repositories\ProductoAcademicoRepository;
use DigitalIce\Services\ProductoAcademicoService;
use DigitalIce\Validators\Validator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ProductoAcademicoController
{
    public function __construct(
        private ProductoAcademicoRepository $repository = new ProductoAcademicoRepository(),
        private ProductoAcademicoService $service = new ProductoAcademicoService()
    ) {
    }

    public function index(Request $request, Response $response): Response
    {
        return ResponseHelper::success($response, $this->repository->list());
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $product = $this->repository->findWithModules((string) $args['id']);
        return $product ? ResponseHelper::success($response, $product) : ResponseHelper::error($response, 'Producto no encontrado', [], 404);
    }

    public function store(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();
        $errors = Validator::require($data, ['codigo', 'nombre', 'tipo']);
        if ($errors) {
            return ResponseHelper::error($response, 'Datos invalidos', $errors, 400);
        }

        try {
            return ResponseHelper::success($response, $this->service->create($data), 'Producto academico creado', 201);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 409);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $product = $this->service->updateProduct((string) $args['id'], (array) $request->getParsedBody());
            return $product ? ResponseHelper::success($response, $product, 'Producto actualizado') : ResponseHelper::error($response, 'Producto no encontrado', [], 404);
        } catch (\DomainException $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 409);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 400);
        }
    }

    public function addModule(Request $request, Response $response, array $args): Response
    {
        $data = (array) $request->getParsedBody();
        try {
            return ResponseHelper::success(
                $response,
                $this->service->addModule((string) $args['id'], (string) ($data['nombre_oficial'] ?? ''), $data['docente_id'] ?? null),
                'Modulo agregado'
            );
        } catch (\DomainException $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 409);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 400);
        }
    }

    public function updateModule(Request $request, Response $response, array $args): Response
    {
        try {
            return ResponseHelper::success(
                $response,
                $this->service->updateModule((string) $args['id'], (string) $args['module_id'], (array) $request->getParsedBody()),
                'Modulo actualizado'
            );
        } catch (\DomainException $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 409);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 400);
        }
    }

    public function deleteModule(Request $request, Response $response, array $args): Response
    {
        try {
            return ResponseHelper::success(
                $response,
                $this->service->deleteModule((string) $args['id'], (string) $args['module_id']),
                'Modulo eliminado'
            );
        } catch (\DomainException $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 409);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 400);
        }
    }

    public function destroy(Request $request, Response $response, array $args): Response
    {
        try {
            $product = $this->service->updateProduct((string) $args['id'], ['estado' => 'FINALIZADO']);
            return ResponseHelper::success($response, $product, 'Producto finalizado');
        } catch (\DomainException $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 409);
        } catch (\Throwable $throwable) {
            return ResponseHelper::error($response, $throwable->getMessage(), [], 400);
        }
    }
}
