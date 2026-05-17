<?php

declare(strict_types=1);

namespace DigitalIce\Services;

use DigitalIce\Config\Database;

final class ReporteService
{
    public function enrolledStudents(): array
    {
        return [
            'resumen' => $this->summaryByCourse(),
            'alumnos' => $this->studentRows(),
        ];
    }

    private function summaryByCourse(): array
    {
        return Database::pdo()->query(
            'SELECT p.id AS producto_id,
                    p.codigo,
                    p.nombre,
                    p.institucion,
                    COUNT(DISTINCT i.id) AS matriculados,
                    COALESCE(SUM(i.monto_total), 0) AS total_ingresos,
                    COALESCE(SUM(COALESCE(ps.total_pagado, 0)), 0) AS total_pagado,
                    COALESCE(SUM(GREATEST(i.monto_total - COALESCE(ps.total_pagado, 0), 0)), 0) AS total_por_recaudar
             FROM inscripciones i
             INNER JOIN productos_academicos p ON p.id = i.producto_id
             LEFT JOIN (
                SELECT inscripcion_id, SUM(COALESCE(monto_pagado, monto)) AS total_pagado
                FROM pagos
                WHERE estado = "PAGADO" AND eliminado = 0
                GROUP BY inscripcion_id
             ) ps ON ps.inscripcion_id = i.id
             WHERE i.eliminado = 0
             GROUP BY p.id, p.codigo, p.nombre, p.institucion
             ORDER BY matriculados DESC, p.nombre'
        )->fetchAll();
    }

    private function studentRows(): array
    {
        return Database::pdo()->query(
            'SELECT i.id AS inscripcion_id,
                    i.estado AS estado_inscripcion,
                    i.monto_total,
                    i.fecha_inscripcion,
                    e.nombres,
                    e.apellidos,
                    e.ci,
                    e.extension_ci,
                    e.correo,
                    e.celular,
                    p.codigo AS producto_codigo,
                    p.nombre AS producto,
                    p.institucion,
                    COALESCE(ps.total_pagado, 0) AS total_pagado,
                    GREATEST(i.monto_total - COALESCE(ps.total_pagado, 0), 0) AS deuda,
                    COALESCE(ps.cuotas_pendientes, 0) AS cuotas_pendientes
             FROM inscripciones i
             INNER JOIN estudiantes e ON e.id = i.estudiante_id
             INNER JOIN productos_academicos p ON p.id = i.producto_id
             LEFT JOIN (
                SELECT inscripcion_id,
                       SUM(CASE WHEN estado = "PAGADO" THEN COALESCE(monto_pagado, monto) ELSE 0 END) AS total_pagado,
                       SUM(CASE WHEN estado IN ("PENDIENTE", "VENCIDO") THEN 1 ELSE 0 END) AS cuotas_pendientes
                FROM pagos
                WHERE eliminado = 0
                GROUP BY inscripcion_id
             ) ps ON ps.inscripcion_id = i.id
             WHERE i.eliminado = 0
             ORDER BY p.nombre, e.apellidos, e.nombres'
        )->fetchAll();
    }
}
