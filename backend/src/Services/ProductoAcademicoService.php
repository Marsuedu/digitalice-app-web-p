<?php

declare(strict_types=1);

namespace DigitalIce\Services;

use DigitalIce\Config\Database;
use DigitalIce\Helpers\Uuid;

final class ProductoAcademicoService
{
    private const PRODUCT_STATES = ['POR_INICIAR', 'ACTIVO', 'FINALIZADO'];

    private const MODULE_COUNTS = [
        'CURSO' => 1,
        'CURSO_EXPERTO' => 3,
        'DIPLOMADO' => 5,
    ];

    public function create(array $data): array
    {
        $tipo = (string) ($data['tipo'] ?? '');
        if (!isset(self::MODULE_COUNTS[$tipo])) {
            throw new \InvalidArgumentException('Tipo de producto invalido');
        }

        $modules = $data['modulos'] ?? [];
        $modules = is_array($modules) ? $modules : [];

        $moduleNames = array_map(fn ($module) => trim((string) ($module['nombre_oficial'] ?? $module['nombre'] ?? '')), $modules);
        if (in_array('', $moduleNames, true) || count(array_unique($moduleNames)) !== count($moduleNames)) {
            throw new \InvalidArgumentException('Los modulos son obligatorios y no pueden repetirse');
        }

        $pdo = Database::pdo();
        $pdo->beginTransaction();

        try {
            $productId = Uuid::v4();
            $code = trim((string) $data['codigo']);

            $state = $this->normalizeState($data['estado'] ?? 'POR_INICIAR');
            $stmt = $pdo->prepare(
                'INSERT INTO productos_academicos (id, codigo, nombre, tipo, num_modulos, institucion, aprobado_ministerio, activo, estado, monto_referencial)
                 VALUES (:id, :codigo, :nombre, :tipo, :num_modulos, :institucion, :aprobado_ministerio, :activo, :estado, :monto_referencial)'
            );
            $stmt->execute([
                'id' => $productId,
                'codigo' => $code,
                'nombre' => trim((string) $data['nombre']),
                'tipo' => $tipo,
                'num_modulos' => count($moduleNames),
                'institucion' => trim((string) ($data['institucion'] ?? 'DIGITALICE')),
                'aprobado_ministerio' => !empty($data['aprobado_ministerio']) ? 1 : 0,
                'activo' => $state === 'FINALIZADO' ? 0 : (array_key_exists('activo', $data) ? (int) (bool) $data['activo'] : 1),
                'estado' => $state,
                'monto_referencial' => $data['monto_referencial'] ?? null,
            ]);

            foreach ($moduleNames as $index => $name) {
                $teacherId = is_array($modules[$index] ?? null) ? ($modules[$index]['docente_id'] ?? null) : null;
                $this->attachModule($productId, $code, $name, $index + 1, $teacherId ? (string) $teacherId : null);
            }

            $pdo->commit();
            return (new \DigitalIce\Repositories\ProductoAcademicoRepository())->findWithModules($productId);
        } catch (\Throwable $throwable) {
            $pdo->rollBack();
            throw $throwable;
        }
    }

    public function updateProduct(string $productId, array $data): ?array
    {
        $pdo = Database::pdo();
        $currentStmt = $pdo->prepare('SELECT estado FROM productos_academicos WHERE id = :id LIMIT 1');
        $currentStmt->execute(['id' => $productId]);
        $current = $currentStmt->fetch();
        if (!$current) {
            return null;
        }
        if (($current['estado'] ?? '') === 'FINALIZADO') {
            throw new \DomainException('No se puede modificar un producto finalizado');
        }

        $allowed = ['nombre', 'institucion', 'aprobado_ministerio', 'activo', 'estado', 'monto_referencial'];
        $fields = array_intersect_key($data, array_flip($allowed));
        if (isset($fields['estado'])) {
            $fields['estado'] = $this->normalizeState($fields['estado']);
            if ($fields['estado'] === 'FINALIZADO') {
                $fields['activo'] = 0;
            } elseif (!array_key_exists('activo', $fields)) {
                $fields['activo'] = 1;
            }
        }

        if ($fields === []) {
            return (new \DigitalIce\Repositories\ProductoAcademicoRepository())->findWithModules($productId);
        }

        $sets = array_map(fn ($column) => $column . ' = :' . $column, array_keys($fields));
        $fields['id'] = $productId;
        $stmt = $pdo->prepare('UPDATE productos_academicos SET ' . implode(', ', $sets) . ' WHERE id = :id');
        $stmt->execute($fields);

        return (new \DigitalIce\Repositories\ProductoAcademicoRepository())->findWithModules($productId);
    }

    public function addModule(string $productId, string $moduleName, ?string $teacherId = null): array
    {
        $moduleName = trim($moduleName);
        if ($moduleName === '') {
            throw new \InvalidArgumentException('El nombre del modulo es obligatorio');
        }

        $pdo = Database::pdo();
        $pdo->beginTransaction();

        try {
            $productStmt = $pdo->prepare('SELECT id, codigo, estado FROM productos_academicos WHERE id = :id LIMIT 1');
            $productStmt->execute(['id' => $productId]);
            $product = $productStmt->fetch();
            if (!$product) {
                throw new \InvalidArgumentException('Producto no encontrado');
            }
            $this->ensureProductIsEditable($product);

            $duplicate = $pdo->prepare(
                'SELECT COUNT(*)
                 FROM producto_modulos pm
                 INNER JOIN modulos m ON m.id = pm.modulo_id
                 WHERE pm.producto_id = :producto_id AND pm.eliminado = 0 AND m.nombre_oficial = :nombre'
            );
            $duplicate->execute(['producto_id' => $productId, 'nombre' => $moduleName]);
            if ((int) $duplicate->fetchColumn() > 0) {
                throw new \InvalidArgumentException('El modulo ya existe en este producto');
            }

            $numberStmt = $pdo->prepare('SELECT COALESCE(MAX(numero_modulo), 0) + 1 FROM producto_modulos WHERE producto_id = :id AND eliminado = 0');
            $numberStmt->execute(['id' => $productId]);
            $nextNumber = (int) $numberStmt->fetchColumn();

            $this->attachModule($productId, (string) $product['codigo'], $moduleName, $nextNumber, $teacherId ?: null);
            $pdo->commit();

            return (new \DigitalIce\Repositories\ProductoAcademicoRepository())->findWithModules($productId);
        } catch (\Throwable $throwable) {
            $pdo->rollBack();
            throw $throwable;
        }
    }

    public function updateModule(string $productId, string $productModuleId, array $data): array
    {
        $moduleName = trim((string) ($data['nombre_oficial'] ?? ''));
        if ($moduleName === '') {
            throw new \InvalidArgumentException('El nombre del modulo es obligatorio');
        }

        $teacherId = trim((string) ($data['docente_id'] ?? ''));
        $teacherId = $teacherId !== '' ? $teacherId : null;

        $pdo = Database::pdo();
        $pdo->beginTransaction();

        try {
            $productStmt = $pdo->prepare('SELECT id, estado FROM productos_academicos WHERE id = :id LIMIT 1');
            $productStmt->execute(['id' => $productId]);
            $product = $productStmt->fetch();
            if (!$product) {
                throw new \InvalidArgumentException('Producto no encontrado');
            }
            $this->ensureProductIsEditable($product);

            $moduleStmt = $pdo->prepare('SELECT id FROM producto_modulos WHERE id = :id AND producto_id = :producto_id AND eliminado = 0 LIMIT 1');
            $moduleStmt->execute(['id' => $productModuleId, 'producto_id' => $productId]);
            if (!$moduleStmt->fetch()) {
                throw new \InvalidArgumentException('Modulo no encontrado en este producto');
            }

            $duplicate = $pdo->prepare(
                'SELECT COUNT(*)
                 FROM producto_modulos pm
                 INNER JOIN modulos m ON m.id = pm.modulo_id
                 WHERE pm.producto_id = :producto_id
                   AND pm.eliminado = 0
                   AND pm.id <> :producto_modulo_id
                   AND m.nombre_oficial = :nombre'
            );
            $duplicate->execute([
                'producto_id' => $productId,
                'producto_modulo_id' => $productModuleId,
                'nombre' => $moduleName,
            ]);
            if ((int) $duplicate->fetchColumn() > 0) {
                throw new \InvalidArgumentException('El modulo ya existe en este producto');
            }

            $moduleId = $this->findOrCreateModule($moduleName);
            $stmt = $pdo->prepare(
                'UPDATE producto_modulos
                 SET modulo_id = :modulo_id, docente_id = :docente_id
                 WHERE id = :id AND producto_id = :producto_id'
            );
            $stmt->execute([
                'modulo_id' => $moduleId,
                'docente_id' => $teacherId,
                'id' => $productModuleId,
                'producto_id' => $productId,
            ]);

            $pdo->commit();
            return (new \DigitalIce\Repositories\ProductoAcademicoRepository())->findWithModules($productId);
        } catch (\Throwable $throwable) {
            $pdo->rollBack();
            throw $throwable;
        }
    }

    public function deleteModule(string $productId, string $productModuleId): array
    {
        $pdo = Database::pdo();
        $pdo->beginTransaction();

        try {
            $productStmt = $pdo->prepare('SELECT id, codigo, estado FROM productos_academicos WHERE id = :id LIMIT 1');
            $productStmt->execute(['id' => $productId]);
            $product = $productStmt->fetch();
            if (!$product) {
                throw new \InvalidArgumentException('Producto no encontrado');
            }
            $this->ensureProductIsEditable($product);

            $moduleStmt = $pdo->prepare('SELECT id FROM producto_modulos WHERE id = :id AND producto_id = :producto_id AND eliminado = 0 LIMIT 1');
            $moduleStmt->execute(['id' => $productModuleId, 'producto_id' => $productId]);
            if (!$moduleStmt->fetch()) {
                throw new \InvalidArgumentException('Modulo no encontrado en este producto');
            }

            $usageStmt = $pdo->prepare('SELECT COUNT(*) FROM inscripcion_modulos WHERE producto_modulo_id = :id');
            $usageStmt->execute(['id' => $productModuleId]);
            if ((int) $usageStmt->fetchColumn() > 0) {
                $deleteStmt = $pdo->prepare(
                    'UPDATE producto_modulos
                     SET eliminado = 1, eliminado_at = CURRENT_TIMESTAMP
                     WHERE id = :id AND producto_id = :producto_id'
                );
                $deleteStmt->execute(['id' => $productModuleId, 'producto_id' => $productId]);
            } else {
                $deleteStmt = $pdo->prepare('DELETE FROM producto_modulos WHERE id = :id AND producto_id = :producto_id');
                $deleteStmt->execute(['id' => $productModuleId, 'producto_id' => $productId]);
            }

            $this->renumberModules($productId, (string) $product['codigo']);
            $this->refreshModuleCount($productId);

            $pdo->commit();
            return (new \DigitalIce\Repositories\ProductoAcademicoRepository())->findWithModules($productId);
        } catch (\Throwable $throwable) {
            $pdo->rollBack();
            throw $throwable;
        }
    }

    private function attachModule(string $productId, string $productCode, string $moduleName, int $number, ?string $teacherId = null): void
    {
        $pdo = Database::pdo();
        $moduleId = $this->findOrCreateModule($moduleName);
        $slot = $productCode . '_MOD' . $number;
        $stmt = $pdo->prepare(
            'INSERT INTO producto_modulos (id, producto_id, modulo_id, docente_id, numero_modulo, codigo_slot)
             VALUES (:id, :producto_id, :modulo_id, :docente_id, :numero_modulo, :codigo_slot)'
        );
        $stmt->execute([
            'id' => Uuid::v4(),
            'producto_id' => $productId,
            'modulo_id' => $moduleId,
            'docente_id' => $teacherId,
            'numero_modulo' => $number,
            'codigo_slot' => $slot,
        ]);

        $this->refreshModuleCount($productId);
    }

    private function renumberModules(string $productId, string $productCode): void
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM producto_modulos WHERE producto_id = :id AND eliminado = 0 ORDER BY numero_modulo');
        $stmt->execute(['id' => $productId]);
        $modules = $stmt->fetchAll();
        $update = $pdo->prepare('UPDATE producto_modulos SET numero_modulo = :numero_modulo, codigo_slot = :codigo_slot WHERE id = :id');

        foreach ($modules as $index => $module) {
            $number = $index + 1;
            $update->execute([
                'numero_modulo' => $number,
                'codigo_slot' => $productCode . '_MOD' . $number,
                'id' => $module['id'],
            ]);
        }
    }

    private function refreshModuleCount(string $productId): void
    {
        $count = Database::pdo()->prepare(
            'UPDATE productos_academicos
             SET num_modulos = (SELECT COUNT(*) FROM producto_modulos WHERE producto_id = :count_product_id AND eliminado = 0)
             WHERE id = :product_id'
        );
        $count->execute(['count_product_id' => $productId, 'product_id' => $productId]);
    }

    private function normalizeState(mixed $state): string
    {
        $state = strtoupper(trim((string) $state));
        if (!in_array($state, self::PRODUCT_STATES, true)) {
            throw new \InvalidArgumentException('Estado de producto invalido');
        }

        return $state;
    }

    private function ensureProductIsEditable(array $product): void
    {
        if (($product['estado'] ?? '') === 'FINALIZADO') {
            throw new \DomainException('No se puede modificar un producto finalizado');
        }
    }

    private function findOrCreateModule(string $name): string
    {
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id FROM modulos WHERE nombre_oficial = :name LIMIT 1');
        $stmt->execute(['name' => $name]);
        $existing = $stmt->fetchColumn();
        if ($existing) {
            return (string) $existing;
        }

        $id = Uuid::v4();
        $code = 'MOD_' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]+/', '_', $name), 0, 24));
        $stmt = $pdo->prepare('INSERT INTO modulos (id, codigo, nombre_oficial, activo) VALUES (:id, :codigo, :nombre, 1)');
        $stmt->execute(['id' => $id, 'codigo' => $code . '_' . substr($id, 0, 8), 'nombre' => $name]);

        return $id;
    }
}
