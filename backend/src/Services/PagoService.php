<?php

declare(strict_types=1);

namespace DigitalIce\Services;

use DigitalIce\Config\Database;

final class PagoService
{
    public function byInscription(string $inscriptionId): array
    {
        $this->markExpired($inscriptionId);
        $contextStmt = Database::pdo()->prepare(
            'SELECT i.id,
                    i.monto_total,
                    i.metodo_pago,
                    i.paralelo,
                    CONCAT(e.nombres, " ", e.apellidos) AS estudiante,
                    e.ci,
                    e.extension_ci,
                    e.celular,
                    e.correo,
                    p.nombre AS producto,
                    p.codigo AS producto_codigo,
                    p.institucion
             FROM inscripciones i
             INNER JOIN estudiantes e ON e.id = i.estudiante_id
             INNER JOIN productos_academicos p ON p.id = i.producto_id
             WHERE i.id = :id
             LIMIT 1'
        );
        $contextStmt->execute(['id' => $inscriptionId]);
        $context = $contextStmt->fetch() ?: null;

        $stmt = Database::pdo()->prepare(
            'SELECT p.*, u.nombre AS registrado_por_nombre
             FROM pagos p
             LEFT JOIN usuarios u ON u.id = p.registrado_por
             WHERE p.inscripcion_id = :id AND p.eliminado = 0
             ORDER BY p.numero_cuota'
        );
        $stmt->execute(['id' => $inscriptionId]);
        $payments = $stmt->fetchAll();

        $paid = 0.0;
        $total = (float) ($context['monto_total'] ?? 0);
        $pendingCount = 0;
        $paidCount = 0;
        foreach ($payments as $payment) {
            if ($payment['estado'] === 'PAGADO') {
                $paid += (float) ($payment['monto_pagado'] ?? $payment['monto']);
                $paidCount++;
            } else {
                $pendingCount++;
            }
        }

        return [
            'inscripcion' => $context,
            'resumen' => [
                'total' => $total,
                'pagado' => $paid,
                'saldo' => max(0, $total - $paid),
                'cuotas_total' => count($payments),
                'cuotas_pagadas' => $paidCount,
                'cuotas_pendientes' => $pendingCount,
            ],
            'pagos' => $payments,
        ];
    }

    public function register(string $id, array $data, string $userId, string $userRole): array
    {
        $currentStmt = Database::pdo()->prepare('SELECT estado FROM pagos WHERE id = :id AND eliminado = 0 LIMIT 1');
        $currentStmt->execute(['id' => $id]);
        $current = $currentStmt->fetch();
        if (!$current) {
            throw new \InvalidArgumentException('Pago no encontrado');
        }
        if ($current['estado'] === 'PAGADO' && $userRole !== 'Admin') {
            throw new \DomainException('Solo Admin puede editar pagos registrados');
        }

        $stmt = Database::pdo()->prepare(
            'UPDATE pagos
             SET fecha_pago = :fecha_pago,
                 monto_pagado = :monto_pagado,
                 entidad_facturadora = :entidad_facturadora,
                 estado_factura = :estado_factura,
                 codigo_comprobante = :codigo_comprobante,
                 fecha_comprobante = :fecha_comprobante,
                 comprobante_url = :comprobante_url,
                 comprobante_nombre = :comprobante_nombre,
                 notas = :notas,
                 registrado_por = :registrado_por,
                 estado = "PAGADO"
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'fecha_pago' => $data['fecha_pago'],
            'monto_pagado' => $data['monto_pagado'],
            'entidad_facturadora' => $data['entidad_facturadora'],
            'estado_factura' => $data['estado_factura'],
            'codigo_comprobante' => $data['codigo_comprobante'],
            'fecha_comprobante' => $data['fecha_comprobante'],
            'comprobante_url' => $data['comprobante_url'] ?? null,
            'comprobante_nombre' => $data['comprobante_nombre'] ?? null,
            'notas' => $data['notas'] ?? null,
            'registrado_por' => $userId,
        ]);

        $stmt = Database::pdo()->prepare('SELECT * FROM pagos WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: [];
    }

    public function softDelete(string $id, string $userId): array
    {
        $stmt = Database::pdo()->prepare(
            'UPDATE pagos
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
            'SELECT p.*, u.nombre AS eliminado_por_nombre
             FROM pagos p
             LEFT JOIN usuarios u ON u.id = p.eliminado_por
             WHERE p.id = :id
             LIMIT 1'
        );
        $fetch->execute(['id' => $id]);

        return $fetch->fetch() ?: [];
    }

    private function markExpired(string $inscriptionId): void
    {
        $stmt = Database::pdo()->prepare(
            'UPDATE pagos SET estado = "VENCIDO"
             WHERE inscripcion_id = :id AND eliminado = 0 AND estado = "PENDIENTE" AND fecha_vencimiento < CURRENT_DATE'
        );
        $stmt->execute(['id' => $inscriptionId]);
    }
}
