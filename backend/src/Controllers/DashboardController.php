<?php

declare(strict_types=1);

namespace DigitalIce\Controllers;

use DigitalIce\Config\Database;
use DigitalIce\Helpers\ResponseHelper;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class DashboardController
{
    public function index(Request $request, Response $response): Response
    {
        $role = (string) ($_SESSION['rol'] ?? '');
        $email = $this->currentUserEmail();

        if ($role === 'Estudiante') {
            return ResponseHelper::success($response, $this->studentDashboard($email));
        }

        if ($role === 'Docente') {
            return ResponseHelper::success($response, $this->teacherDashboard($email));
        }

        $pdo = Database::pdo();
        $today = new \DateTimeImmutable('today');
        $monthStart = $today->modify('first day of this month')->format('Y-m-d 00:00:00');
        $metrics = [
            'productos_activos' => (int) $pdo->query('SELECT COUNT(*) FROM productos_academicos WHERE activo = 1')->fetchColumn(),
            'estudiantes_activos' => (int) $pdo->query('SELECT COUNT(*) FROM estudiantes WHERE activo = 1')->fetchColumn(),
            'docentes_activos' => (int) $pdo->query('SELECT COUNT(*) FROM docentes WHERE activo = 1')->fetchColumn(),
            'inscripciones_activas' => (int) $pdo->query('SELECT COUNT(*) FROM inscripciones WHERE estado = "ACTIVO" AND eliminado = 0')->fetchColumn(),
            'pagos_vencidos' => (int) $pdo->query('SELECT COUNT(*) FROM pagos WHERE estado = "VENCIDO" AND eliminado = 0')->fetchColumn(),
            'modulos_pendientes' => (int) $pdo->query('SELECT COUNT(*) FROM inscripcion_modulos WHERE estado IN ("PENDIENTE", "EN_CURSO")')->fetchColumn(),
        ];
        $metrics['matriculas_mes'] = $this->scalar(
            'SELECT COUNT(*) FROM inscripciones WHERE eliminado = 0 AND fecha_inscripcion >= :month_start',
            ['month_start' => $monthStart]
        );
        $metrics['recaudacion_mes'] = $this->scalar(
            'SELECT COALESCE(SUM(COALESCE(monto_pagado, monto)), 0)
             FROM pagos
             WHERE estado = "PAGADO" AND eliminado = 0 AND fecha_pago >= :month_start',
            ['month_start' => substr($monthStart, 0, 10)]
        );
        $metrics['saldo_pendiente'] = (float) $pdo->query(
            'SELECT COALESCE(SUM(GREATEST(i.monto_total - COALESCE(ps.total_pagado, 0), 0)), 0)
             FROM inscripciones i
             LEFT JOIN (
                SELECT inscripcion_id, SUM(COALESCE(monto_pagado, monto)) AS total_pagado
                FROM pagos
                WHERE estado = "PAGADO" AND eliminado = 0
                GROUP BY inscripcion_id
             ) ps ON ps.inscripcion_id = i.id
             WHERE i.eliminado = 0'
        )->fetchColumn();

        $byCourse = $pdo->query(
            'SELECT p.codigo, p.nombre, p.institucion, COALESCE(SUM(COALESCE(pg.monto_pagado, pg.monto)), 0) AS total
             FROM pagos pg
             INNER JOIN inscripciones i ON i.id = pg.inscripcion_id
             INNER JOIN productos_academicos p ON p.id = i.producto_id
             WHERE pg.estado = "PAGADO" AND pg.eliminado = 0 AND i.eliminado = 0
             GROUP BY p.id, p.codigo, p.nombre, p.institucion
             ORDER BY total DESC
             LIMIT 8'
        )->fetchAll();

        $byInstitution = $pdo->query(
            'SELECT p.institucion, COALESCE(SUM(COALESCE(pg.monto_pagado, pg.monto)), 0) AS total
             FROM pagos pg
             INNER JOIN inscripciones i ON i.id = pg.inscripcion_id
             INNER JOIN productos_academicos p ON p.id = i.producto_id
             WHERE pg.estado = "PAGADO" AND pg.eliminado = 0 AND i.eliminado = 0
             GROUP BY p.institucion
             ORDER BY total DESC'
        )->fetchAll();

        $debtByInstitution = $pdo->query(
            'SELECT p.institucion, COALESCE(SUM(GREATEST(i.monto_total - COALESCE(ps.total_pagado, 0), 0)), 0) AS total
             FROM inscripciones i
             INNER JOIN productos_academicos p ON p.id = i.producto_id
             LEFT JOIN (
                SELECT inscripcion_id, SUM(COALESCE(monto_pagado, monto)) AS total_pagado
                FROM pagos
                WHERE estado = "PAGADO" AND eliminado = 0
                GROUP BY inscripcion_id
             ) ps ON ps.inscripcion_id = i.id
             WHERE i.eliminado = 0
             GROUP BY p.institucion
             ORDER BY total DESC'
        )->fetchAll();

        $byEnrollmentStatus = $pdo->query(
            'SELECT estado AS label, COUNT(*) AS total
             FROM inscripciones
             WHERE eliminado = 0
             GROUP BY estado
             ORDER BY total DESC'
        )->fetchAll();

        $byPaymentStatus = $pdo->query(
            'SELECT estado AS label, COUNT(*) AS total
             FROM pagos
             WHERE eliminado = 0
             GROUP BY estado
             ORDER BY total DESC'
        )->fetchAll();

        $byProductType = $pdo->query(
            'SELECT p.tipo AS label, COUNT(*) AS total
             FROM inscripciones i
             INNER JOIN productos_academicos p ON p.id = i.producto_id
             WHERE i.eliminado = 0
             GROUP BY p.tipo
             ORDER BY total DESC'
        )->fetchAll();

        $dailyEnrollments = $this->series(
            'SELECT DATE(fecha_inscripcion) AS periodo, COUNT(*) AS total
             FROM inscripciones
             WHERE eliminado = 0 AND fecha_inscripcion >= :start
             GROUP BY DATE(fecha_inscripcion)',
            $today->modify('-13 days'),
            14,
            'day',
            'M d'
        );

        $monthlyEnrollments = $this->series(
            'SELECT DATE_FORMAT(fecha_inscripcion, "%Y-%m") AS periodo, COUNT(*) AS total
             FROM inscripciones
             WHERE eliminado = 0 AND fecha_inscripcion >= :start
             GROUP BY DATE_FORMAT(fecha_inscripcion, "%Y-%m")',
            $today->modify('first day of this month')->modify('-11 months'),
            12,
            'month',
            'M Y'
        );

        return ResponseHelper::success($response, [
            'metricas' => $metrics,
            'recaudacion_por_curso' => $byCourse,
            'recaudacion_por_institucion' => $byInstitution,
            'deuda_por_institucion' => $debtByInstitution,
            'inscripciones_por_estado' => $byEnrollmentStatus,
            'pagos_por_estado' => $byPaymentStatus,
            'inscripciones_por_tipo_producto' => $byProductType,
            'matriculas_por_dia' => $dailyEnrollments,
            'matriculas_por_mes' => $monthlyEnrollments,
        ]);
    }

    private function studentDashboard(string $email): array
    {
        $student = $this->findStudentByEmail($email);
        if (!$student) {
            return [
                'perfil' => 'Estudiante',
                'metricas' => [
                    'cursos_matriculados' => 0,
                    'saldo_pendiente' => 0,
                    'cuotas_pendientes' => 0,
                    'modulos_pendientes' => 0,
                ],
                'cursos_estudiante' => [],
                'proximos_pagos' => [],
                'modulos_por_estado' => [],
                'pagos_por_estado' => [],
            ];
        }

        $studentId = (string) $student['id'];
        $metrics = [
            'cursos_matriculados' => $this->scalar(
                'SELECT COUNT(*) FROM inscripciones WHERE estudiante_id = :student_id AND eliminado = 0',
                ['student_id' => $studentId]
            ),
            'saldo_pendiente' => $this->scalar(
                'SELECT COALESCE(SUM(GREATEST(i.monto_total - COALESCE(ps.total_pagado, 0), 0)), 0)
                 FROM inscripciones i
                 LEFT JOIN (
                    SELECT inscripcion_id, SUM(COALESCE(monto_pagado, monto)) AS total_pagado
                    FROM pagos
                    WHERE estado = "PAGADO" AND eliminado = 0
                    GROUP BY inscripcion_id
                 ) ps ON ps.inscripcion_id = i.id
                 WHERE i.estudiante_id = :student_id AND i.eliminado = 0',
                ['student_id' => $studentId]
            ),
            'cuotas_pendientes' => $this->scalar(
                'SELECT COUNT(*)
                 FROM pagos pg
                 INNER JOIN inscripciones i ON i.id = pg.inscripcion_id
                 WHERE i.estudiante_id = :student_id AND i.eliminado = 0 AND pg.eliminado = 0 AND pg.estado IN ("PENDIENTE", "VENCIDO")',
                ['student_id' => $studentId]
            ),
            'modulos_pendientes' => $this->scalar(
                'SELECT COUNT(*)
                 FROM inscripcion_modulos im
                 INNER JOIN inscripciones i ON i.id = im.inscripcion_id
                 WHERE i.estudiante_id = :student_id AND i.eliminado = 0 AND im.estado IN ("PENDIENTE", "EN_CURSO")',
                ['student_id' => $studentId]
            ),
        ];

        return [
            'perfil' => 'Estudiante',
            'estudiante' => $student,
            'metricas' => $metrics,
            'cursos_estudiante' => $this->fetchAll(
                'SELECT i.id, p.codigo, p.nombre, p.institucion, i.estado, i.monto_total,
                        COALESCE(ps.total_pagado, 0) AS total_pagado,
                        GREATEST(i.monto_total - COALESCE(ps.total_pagado, 0), 0) AS saldo_pendiente
                 FROM inscripciones i
                 INNER JOIN productos_academicos p ON p.id = i.producto_id
                 LEFT JOIN (
                    SELECT inscripcion_id, SUM(COALESCE(monto_pagado, monto)) AS total_pagado
                    FROM pagos
                    WHERE estado = "PAGADO" AND eliminado = 0
                    GROUP BY inscripcion_id
                 ) ps ON ps.inscripcion_id = i.id
                 WHERE i.estudiante_id = :student_id AND i.eliminado = 0
                 ORDER BY i.fecha_inscripcion DESC',
                ['student_id' => $studentId]
            ),
            'proximos_pagos' => $this->fetchAll(
                'SELECT pg.numero_cuota, pg.monto, pg.fecha_vencimiento, pg.estado, p.codigo, p.nombre
                 FROM pagos pg
                 INNER JOIN inscripciones i ON i.id = pg.inscripcion_id
                 INNER JOIN productos_academicos p ON p.id = i.producto_id
                 WHERE i.estudiante_id = :student_id AND i.eliminado = 0 AND pg.eliminado = 0 AND pg.estado IN ("PENDIENTE", "VENCIDO")
                 ORDER BY pg.fecha_vencimiento ASC
                 LIMIT 6',
                ['student_id' => $studentId]
            ),
            'modulos_por_estado' => $this->fetchAll(
                'SELECT im.estado AS label, COUNT(*) AS total
                 FROM inscripcion_modulos im
                 INNER JOIN inscripciones i ON i.id = im.inscripcion_id
                 WHERE i.estudiante_id = :student_id AND i.eliminado = 0
                 GROUP BY im.estado
                 ORDER BY total DESC',
                ['student_id' => $studentId]
            ),
            'pagos_por_estado' => $this->fetchAll(
                'SELECT pg.estado AS label, COUNT(*) AS total
                 FROM pagos pg
                 INNER JOIN inscripciones i ON i.id = pg.inscripcion_id
                 WHERE i.estudiante_id = :student_id AND i.eliminado = 0 AND pg.eliminado = 0
                 GROUP BY pg.estado
                 ORDER BY total DESC',
                ['student_id' => $studentId]
            ),
        ];
    }

    private function teacherDashboard(string $email): array
    {
        $teacher = $this->findTeacherByEmail($email);
        if (!$teacher) {
            return [
                'perfil' => 'Docente',
                'metricas' => [
                    'modulos_asignados' => 0,
                    'cursos_asignados' => 0,
                    'estudiantes_asignados' => 0,
                    'modulos_pendientes' => 0,
                ],
                'cursos_docente' => [],
                'modulos_por_estado' => [],
            ];
        }

        $teacherId = (string) $teacher['id'];

        return [
            'perfil' => 'Docente',
            'docente' => $teacher,
            'metricas' => [
                'modulos_asignados' => $this->scalar('SELECT COUNT(*) FROM inscripcion_modulos WHERE docente_id = :teacher_id', ['teacher_id' => $teacherId]),
                'cursos_asignados' => $this->scalar(
                    'SELECT COUNT(DISTINCT i.producto_id)
                     FROM inscripcion_modulos im
                     INNER JOIN inscripciones i ON i.id = im.inscripcion_id
                     WHERE im.docente_id = :teacher_id AND i.eliminado = 0',
                    ['teacher_id' => $teacherId]
                ),
                'estudiantes_asignados' => $this->scalar(
                    'SELECT COUNT(DISTINCT i.estudiante_id)
                     FROM inscripcion_modulos im
                     INNER JOIN inscripciones i ON i.id = im.inscripcion_id
                     WHERE im.docente_id = :teacher_id AND i.eliminado = 0',
                    ['teacher_id' => $teacherId]
                ),
                'modulos_pendientes' => $this->scalar(
                    'SELECT COUNT(*) FROM inscripcion_modulos WHERE docente_id = :teacher_id AND estado IN ("PENDIENTE", "EN_CURSO")',
                    ['teacher_id' => $teacherId]
                ),
            ],
            'cursos_docente' => $this->fetchAll(
                'SELECT p.codigo, p.nombre, p.institucion, COUNT(*) AS modulos, COUNT(DISTINCT i.estudiante_id) AS estudiantes
                 FROM inscripcion_modulos im
                 INNER JOIN inscripciones i ON i.id = im.inscripcion_id
                 INNER JOIN producto_modulos pm ON pm.id = im.producto_modulo_id
                 INNER JOIN productos_academicos p ON p.id = pm.producto_id
                 WHERE im.docente_id = :teacher_id AND i.eliminado = 0
                 GROUP BY p.id, p.codigo, p.nombre, p.institucion
                 ORDER BY estudiantes DESC
                 LIMIT 8',
                ['teacher_id' => $teacherId]
            ),
            'modulos_por_estado' => $this->fetchAll(
                'SELECT estado AS label, COUNT(*) AS total
                 FROM inscripcion_modulos
                 WHERE docente_id = :teacher_id
                 GROUP BY estado
                 ORDER BY total DESC',
                ['teacher_id' => $teacherId]
            ),
        ];
    }

    private function scalar(string $sql, array $params): float|int
    {
        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute($params);
        $value = $stmt->fetchColumn();

        return is_numeric($value) ? (float) $value : 0;
    }

    private function fetchAll(string $sql, array $params): array
    {
        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    private function currentUserEmail(): string
    {
        if (empty($_SESSION['user_id'])) {
            return '';
        }

        $stmt = Database::pdo()->prepare('SELECT correo FROM usuarios WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => (string) $_SESSION['user_id']]);

        return (string) ($stmt->fetchColumn() ?: '');
    }

    private function findStudentByEmail(string $email): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM estudiantes WHERE correo = :email AND activo = 1 LIMIT 1');
        $stmt->execute(['email' => $email]);
        $student = $stmt->fetch();

        return $student ?: null;
    }

    private function findTeacherByEmail(string $email): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM docentes WHERE correo_personal = :email AND activo = 1 LIMIT 1');
        $stmt->execute(['email' => $email]);
        $teacher = $stmt->fetch();

        return $teacher ?: null;
    }

    private function series(string $sql, \DateTimeImmutable $start, int $periods, string $unit, string $labelFormat): array
    {
        $periodStart = $unit === 'month' ? $start->modify('first day of this month') : $start;
        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute(['start' => $periodStart->format($unit === 'month' ? 'Y-m-01 00:00:00' : 'Y-m-d 00:00:00')]);
        $rows = [];
        foreach ($stmt->fetchAll() as $row) {
            $rows[(string) $row['periodo']] = (int) $row['total'];
        }

        $series = [];
        for ($index = 0; $index < $periods; $index++) {
            $date = $periodStart->modify('+' . $index . ' ' . $unit);
            $key = $unit === 'month' ? $date->format('Y-m') : $date->format('Y-m-d');
            $series[] = [
                'periodo' => $key,
                'label' => $date->format($labelFormat),
                'total' => $rows[$key] ?? 0,
            ];
        }

        return $series;
    }
}
