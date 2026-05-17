<?php

declare(strict_types=1);

namespace DigitalIce\Services;

use DigitalIce\Config\Database;
use DigitalIce\Helpers\Uuid;

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
        $pdo = Database::pdo();
        $pdo->beginTransaction();

        try {
            $currentStmt = $pdo->prepare(
                'SELECT p.*, i.monto_total
                 FROM pagos p
                 INNER JOIN inscripciones i ON i.id = p.inscripcion_id
                 WHERE p.id = :id AND p.eliminado = 0
                 LIMIT 1'
            );
            $currentStmt->execute(['id' => $id]);
            $current = $currentStmt->fetch();
            if (!$current) {
                throw new \InvalidArgumentException('Pago no encontrado');
            }
            if ($current['estado'] === 'PAGADO' && $userRole !== 'Admin') {
                throw new \DomainException('Solo Admin puede editar pagos registrados');
            }

            $amountPaid = round((float) $data['monto_pagado'], 2);
            $scheduledAmount = round((float) $current['monto'], 2);
            if ($amountPaid <= 0) {
                throw new \InvalidArgumentException('El monto pagado debe ser mayor a cero');
            }
            $paidExcluding = $this->paidAmountExcluding((string) $current['inscripcion_id'], $id);
            $maxAllowed = $current['estado'] === 'PAGADO'
                ? round((float) $current['monto_total'] - $paidExcluding, 2)
                : $scheduledAmount;
            if ($amountPaid > $maxAllowed) {
                throw new \InvalidArgumentException('El monto pagado no puede superar el monto pendiente de la cuota');
            }
            if ($paidExcluding + $amountPaid > (float) $current['monto_total']) {
                throw new \InvalidArgumentException('El monto pagado supera el saldo pendiente de la inscripción');
            }

            $stmt = $pdo->prepare(
                'UPDATE pagos
                 SET monto = :monto,
                     fecha_pago = :fecha_pago,
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
                'monto' => $amountPaid,
                'fecha_pago' => $data['fecha_pago'],
                'monto_pagado' => $amountPaid,
                'entidad_facturadora' => $data['entidad_facturadora'],
                'estado_factura' => $data['estado_factura'],
                'codigo_comprobante' => $data['codigo_comprobante'],
                'fecha_comprobante' => $data['fecha_comprobante'],
                'comprobante_url' => $data['comprobante_url'] ?? null,
                'comprobante_nombre' => $data['comprobante_nombre'] ?? null,
                'notas' => $data['notas'] ?? null,
                'registrado_por' => $userId,
            ]);

            $this->rebalancePendingPayments((string) $current['inscripcion_id']);

            $stmt = $pdo->prepare('SELECT * FROM pagos WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $payment = $stmt->fetch() ?: [];
            $pdo->commit();

            return $payment;
        } catch (\Throwable $throwable) {
            $pdo->rollBack();
            throw $throwable;
        }
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

        if ($stmt->rowCount() > 0) {
            $this->rebalancePendingPaymentsByPaymentId($id);
        }

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

    private function paidAmountExcluding(string $inscriptionId, string $paymentId): float
    {
        $stmt = Database::pdo()->prepare(
            'SELECT COALESCE(SUM(COALESCE(monto_pagado, monto)), 0)
             FROM pagos
             WHERE inscripcion_id = :inscripcion_id
               AND id <> :id
               AND eliminado = 0
               AND estado = "PAGADO"'
        );
        $stmt->execute([
            'inscripcion_id' => $inscriptionId,
            'id' => $paymentId,
        ]);

        return (float) $stmt->fetchColumn();
    }

    private function rebalancePendingPaymentsByPaymentId(string $paymentId): void
    {
        $stmt = Database::pdo()->prepare('SELECT inscripcion_id FROM pagos WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $paymentId]);
        $inscriptionId = $stmt->fetchColumn();
        if ($inscriptionId) {
            $this->rebalancePendingPayments((string) $inscriptionId);
        }
    }

    private function rebalancePendingPayments(string $inscriptionId): void
    {
        $pdo = Database::pdo();
        $inscriptionStmt = $pdo->prepare('SELECT monto_total FROM inscripciones WHERE id = :id LIMIT 1');
        $inscriptionStmt->execute(['id' => $inscriptionId]);
        $total = (float) ($inscriptionStmt->fetchColumn() ?: 0);

        $paidStmt = $pdo->prepare(
            'SELECT COALESCE(SUM(COALESCE(monto_pagado, monto)), 0)
             FROM pagos
             WHERE inscripcion_id = :id AND eliminado = 0 AND estado = "PAGADO"'
        );
        $paidStmt->execute(['id' => $inscriptionId]);
        $targetPending = round(max(0, $total - (float) $paidStmt->fetchColumn()), 2);

        $pendingStmt = $pdo->prepare(
            'SELECT id, numero_cuota, monto, fecha_vencimiento
             FROM pagos
             WHERE inscripcion_id = :id AND eliminado = 0 AND estado IN ("PENDIENTE", "VENCIDO")
             ORDER BY numero_cuota'
        );
        $pendingStmt->execute(['id' => $inscriptionId]);
        $pending = $pendingStmt->fetchAll();
        $pendingTotal = round(array_reduce($pending, fn (float $sum, array $payment): float => $sum + (float) $payment['monto'], 0.0), 2);

        if ($pendingTotal < $targetPending) {
            $this->appendPendingPayment($inscriptionId, round($targetPending - $pendingTotal, 2), $pending);
            return;
        }

        if ($pendingTotal <= $targetPending) {
            return;
        }

        $excess = round($pendingTotal - $targetPending, 2);
        for ($index = count($pending) - 1; $index >= 0 && $excess > 0; $index--) {
            $payment = $pending[$index];
            $amount = (float) $payment['monto'];
            if ($amount > $excess) {
                $update = $pdo->prepare('UPDATE pagos SET monto = :monto WHERE id = :id');
                $update->execute([
                    'id' => $payment['id'],
                    'monto' => round($amount - $excess, 2),
                ]);
                $excess = 0;
                continue;
            }

            $hide = $pdo->prepare('UPDATE pagos SET eliminado = 1, eliminado_at = CURRENT_TIMESTAMP WHERE id = :id');
            $hide->execute(['id' => $payment['id']]);
            $excess = round($excess - $amount, 2);
        }
    }

    private function appendPendingPayment(string $inscriptionId, float $amount, array $currentPending): void
    {
        if ($amount <= 0) {
            return;
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'SELECT COALESCE(MAX(numero_cuota), 0) AS last_number,
                    COALESCE(MAX(fecha_vencimiento), CURRENT_DATE) AS last_due_date
             FROM pagos
             WHERE inscripcion_id = :id'
        );
        $stmt->execute(['id' => $inscriptionId]);
        $meta = $stmt->fetch() ?: ['last_number' => 0, 'last_due_date' => date('Y-m-d')];
        $lastPending = end($currentPending);
        $baseDate = $lastPending['fecha_vencimiento'] ?? $meta['last_due_date'] ?? date('Y-m-d');
        $dueDate = (new \DateTimeImmutable((string) $baseDate))->modify('+1 month')->format('Y-m-d');

        $insert = $pdo->prepare(
            'INSERT INTO pagos (id, inscripcion_id, numero_cuota, monto, fecha_vencimiento, estado, notas)
             VALUES (:id, :inscripcion_id, :numero_cuota, :monto, :fecha_vencimiento, "PENDIENTE", :notas)'
        );
        $insert->execute([
            'id' => Uuid::v4(),
            'inscripcion_id' => $inscriptionId,
            'numero_cuota' => ((int) $meta['last_number']) + 1,
            'monto' => $amount,
            'fecha_vencimiento' => $dueDate,
            'notas' => 'Saldo generado automaticamente por ajuste de pago',
        ]);
    }
}
