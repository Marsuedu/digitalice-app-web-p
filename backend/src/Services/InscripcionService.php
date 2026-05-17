<?php

declare(strict_types=1);

namespace DigitalIce\Services;

use DigitalIce\Config\Database;
use DigitalIce\Helpers\Uuid;

final class InscripcionService
{
    public function create(array $data, string $createdBy): array
    {
        $pdo = Database::pdo();
        $pdo->beginTransaction();

        try {
            $inscriptionId = Uuid::v4();
            $stmt = $pdo->prepare(
                'INSERT INTO inscripciones (id, estudiante_id, producto_id, paralelo, metodo_pago, monto_total, comprometido_pago, estado, created_by)
                 VALUES (:id, :estudiante_id, :producto_id, :paralelo, :metodo_pago, :monto_total, :comprometido_pago, "ACTIVO", :created_by)'
            );
            $stmt->execute([
                'id' => $inscriptionId,
                'estudiante_id' => $data['estudiante_id'],
                'producto_id' => $data['producto_id'],
                'paralelo' => $data['paralelo'] ?? 'A',
                'metodo_pago' => $data['metodo_pago'],
                'monto_total' => $data['monto_total'],
                'comprometido_pago' => !empty($data['comprometido_pago']) ? 1 : 0,
                'created_by' => $createdBy,
            ]);

            $modules = $this->productModules((string) $data['producto_id']);
            foreach ($modules as $module) {
                $origin = $this->approvedPreviousModule((string) $data['estudiante_id'], (string) $module['nombre_oficial']);
                $stmt = $pdo->prepare(
                    'INSERT INTO inscripcion_modulos
                    (id, inscripcion_id, producto_modulo_id, docente_id, estado, es_convalidacion, inscripcion_origen_id)
                    VALUES (:id, :inscripcion_id, :producto_modulo_id, :docente_id, :estado, :es_convalidacion, :inscripcion_origen_id)'
                );
                $stmt->execute([
                    'id' => Uuid::v4(),
                    'inscripcion_id' => $inscriptionId,
                    'producto_modulo_id' => $module['producto_modulo_id'],
                    'docente_id' => $module['docente_id'] ?? null,
                    'estado' => $origin ? 'CONVALIDADO' : 'PENDIENTE',
                    'es_convalidacion' => $origin ? 1 : 0,
                    'inscripcion_origen_id' => $origin,
                ]);
            }

            $this->createPayments($inscriptionId, $data);
            $this->completeIfReady($inscriptionId);

            $pdo->commit();
            return $this->find($inscriptionId);
        } catch (\Throwable $throwable) {
            $pdo->rollBack();
            throw $throwable;
        }
    }

    public function list(): array
    {
        return Database::pdo()->query(
             'SELECT i.*,
                    CONCAT(e.nombres, " ", e.apellidos) AS estudiante,
                    e.ci,
                    e.extension_ci,
                    e.celular,
                    e.correo,
                    p.nombre AS producto,
                    p.codigo AS producto_codigo,
                    p.institucion,
                    COALESCE(ps.cuotas_total, 0) AS cuotas_total,
                    COALESCE(ps.cuotas_pagadas, 0) AS cuotas_pagadas,
                    COALESCE(ps.cuotas_pendientes, 0) AS cuotas_pendientes,
                    COALESCE(ps.total_pagado, 0) AS total_pagado,
                    GREATEST(i.monto_total - COALESCE(ps.total_pagado, 0), 0) AS saldo_pendiente
             FROM inscripciones i
             INNER JOIN estudiantes e ON e.id = i.estudiante_id
             INNER JOIN productos_academicos p ON p.id = i.producto_id
             LEFT JOIN (
                SELECT inscripcion_id,
                       COUNT(*) AS cuotas_total,
                       SUM(CASE WHEN estado = "PAGADO" THEN 1 ELSE 0 END) AS cuotas_pagadas,
                       SUM(CASE WHEN estado IN ("PENDIENTE", "VENCIDO") THEN 1 ELSE 0 END) AS cuotas_pendientes,
                       SUM(CASE WHEN estado = "PAGADO" THEN COALESCE(monto_pagado, monto) ELSE 0 END) AS total_pagado
                FROM pagos
                WHERE eliminado = 0
                GROUP BY inscripcion_id
             ) ps ON ps.inscripcion_id = i.id
             WHERE i.eliminado = 0
             ORDER BY i.fecha_inscripcion DESC'
        )->fetchAll();
    }

    public function find(string $id): ?array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT i.*, CONCAT(e.nombres, " ", e.apellidos) AS estudiante, p.nombre AS producto, p.tipo
             FROM inscripciones i
             INNER JOIN estudiantes e ON e.id = i.estudiante_id
             INNER JOIN productos_academicos p ON p.id = i.producto_id
             WHERE i.id = :id AND i.eliminado = 0 LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function update(string $id, array $data): ?array
    {
        $allowed = [
            'estudiante_id',
            'producto_id',
            'paralelo',
            'metodo_pago',
            'monto_total',
            'comprometido_pago',
            'estado',
        ];
        $fields = array_intersect_key($data, array_flip($allowed));
        if (isset($fields['comprometido_pago'])) {
            $fields['comprometido_pago'] = !empty($fields['comprometido_pago']) ? 1 : 0;
        }
        if ($fields === []) {
            return $this->find($id);
        }

        $sets = array_map(fn ($column) => $column . ' = :' . $column, array_keys($fields));
        $fields['id'] = $id;
        $stmt = Database::pdo()->prepare('UPDATE inscripciones SET ' . implode(', ', $sets) . ' WHERE id = :id');
        $stmt->execute($fields);

        return $this->find($id);
    }

    public function softDelete(string $id, string $userId): array
    {
        $stmt = Database::pdo()->prepare(
            'UPDATE inscripciones
             SET eliminado = 1,
                 eliminado_por = :eliminado_por,
                 eliminado_at = CURRENT_TIMESTAMP
             WHERE id = :id AND eliminado = 0'
        );
        $stmt->execute([
            'id' => $id,
            'eliminado_por' => $userId,
        ]);

        $fetch = Database::pdo()->prepare(
            'SELECT i.*, u.nombre AS eliminado_por_nombre
             FROM inscripciones i
             LEFT JOIN usuarios u ON u.id = i.eliminado_por
             WHERE i.id = :id
             LIMIT 1'
        );
        $fetch->execute(['id' => $id]);

        return $fetch->fetch() ?: [];
    }

    public function modules(string $inscriptionId): array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT im.*, pm.numero_modulo, pm.codigo_slot, m.nombre_oficial, d.nombre AS docente
             FROM inscripcion_modulos im
             INNER JOIN producto_modulos pm ON pm.id = im.producto_modulo_id
             INNER JOIN modulos m ON m.id = pm.modulo_id
             LEFT JOIN docentes d ON d.id = im.docente_id
             WHERE im.inscripcion_id = :id
             ORDER BY pm.numero_modulo'
        );
        $stmt->execute(['id' => $inscriptionId]);
        return $stmt->fetchAll();
    }

    public function assignTeacher(string $moduleId, string $teacherId): ?array
    {
        $stmt = Database::pdo()->prepare(
            'UPDATE inscripcion_modulos SET docente_id = :docente_id WHERE id = :id AND nota IS NULL'
        );
        $stmt->execute(['docente_id' => $teacherId, 'id' => $moduleId]);

        $stmt = Database::pdo()->prepare('SELECT * FROM inscripcion_modulos WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $moduleId]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function completeIfReady(string $inscriptionId): void
    {
        $stmt = Database::pdo()->prepare(
            'SELECT COUNT(*) FROM inscripcion_modulos
             WHERE inscripcion_id = :id AND estado NOT IN ("APROBADO", "CONVALIDADO")'
        );
        $stmt->execute(['id' => $inscriptionId]);
        if ((int) $stmt->fetchColumn() === 0) {
            $update = Database::pdo()->prepare(
                'UPDATE inscripciones SET estado = "COMPLETADO", fecha_completado = COALESCE(fecha_completado, CURRENT_DATE) WHERE id = :id'
            );
            $update->execute(['id' => $inscriptionId]);
        }
    }

    private function productModules(string $productId): array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT pm.id AS producto_modulo_id, pm.docente_id, m.nombre_oficial
             FROM producto_modulos pm
             INNER JOIN modulos m ON m.id = pm.modulo_id
             WHERE pm.producto_id = :id AND pm.eliminado = 0
             ORDER BY pm.numero_modulo'
        );
        $stmt->execute(['id' => $productId]);
        return $stmt->fetchAll();
    }

    private function approvedPreviousModule(string $studentId, string $moduleName): ?string
    {
        $stmt = Database::pdo()->prepare(
            'SELECT i.id
             FROM inscripciones i
             INNER JOIN inscripcion_modulos im ON im.inscripcion_id = i.id
             INNER JOIN producto_modulos pm ON pm.id = im.producto_modulo_id
             INNER JOIN modulos m ON m.id = pm.modulo_id
             WHERE i.estudiante_id = :student_id
               AND m.nombre_oficial = :module_name
               AND im.estado IN ("APROBADO", "CONVALIDADO")
             ORDER BY i.fecha_inscripcion DESC
             LIMIT 1'
        );
        $stmt->execute(['student_id' => $studentId, 'module_name' => $moduleName]);
        $origin = $stmt->fetchColumn();

        return $origin ? (string) $origin : null;
    }

    private function createPayments(string $inscriptionId, array $data): void
    {
        $payments = $data['pagos'] ?? [];
        if (($data['metodo_pago'] ?? '') === 'AL_CONTADO') {
            $payments = [[
                'numero_cuota' => 1,
                'monto' => $data['monto_total'],
                'fecha_vencimiento' => $data['fecha_vencimiento'] ?? date('Y-m-d'),
            ]];
        } elseif (($data['metodo_pago'] ?? '') === 'CUOTAS' && $payments === []) {
            $count = max(1, (int) ($data['cantidad_cuotas'] ?? 1));
            $total = round((float) $data['monto_total'], 2);
            $baseAmount = floor(($total / $count) * 100) / 100;
            $startDate = new \DateTimeImmutable((string) ($data['fecha_vencimiento'] ?? date('Y-m-d')));
            $payments = [];
            for ($index = 0; $index < $count; $index++) {
                $amount = $index === $count - 1 ? round($total - ($baseAmount * ($count - 1)), 2) : $baseAmount;
                $payments[] = [
                    'numero_cuota' => $index + 1,
                    'monto' => $amount,
                    'fecha_vencimiento' => $startDate->modify('+' . $index . ' month')->format('Y-m-d'),
                ];
            }
        }

        foreach ($payments as $index => $payment) {
            $stmt = Database::pdo()->prepare(
                'INSERT INTO pagos (id, inscripcion_id, numero_cuota, monto, fecha_vencimiento, estado)
                 VALUES (:id, :inscripcion_id, :numero_cuota, :monto, :fecha_vencimiento, "PENDIENTE")'
            );
            $stmt->execute([
                'id' => Uuid::v4(),
                'inscripcion_id' => $inscriptionId,
                'numero_cuota' => $payment['numero_cuota'] ?? ($index + 1),
                'monto' => $payment['monto'],
                'fecha_vencimiento' => $payment['fecha_vencimiento'],
            ]);
        }
    }
}
