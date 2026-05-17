<?php

declare(strict_types=1);

namespace DigitalIce\Services;

use DigitalIce\Config\Database;

final class NotaService
{
    public function courses(string $userId, string $role): array
    {
        $teacherId = $role === 'Docente' ? $this->teacherIdForUser($userId) : null;
        if ($role === 'Docente' && !$teacherId) {
            return [];
        }

        $where = 'i.eliminado = 0';
        $params = [];
        if ($teacherId) {
            $where .= ' AND im.docente_id = :teacher_id';
            $params['teacher_id'] = $teacherId;
        }

        $stmt = Database::pdo()->prepare(
            'SELECT pm.id AS producto_modulo_id,
                    pm.numero_modulo,
                    pm.codigo_slot,
                    p.codigo AS producto_codigo,
                    p.nombre AS producto,
                    p.institucion,
                    m.nombre_oficial AS modulo,
                    d.nombre AS docente,
                    COUNT(*) AS estudiantes,
                    SUM(CASE WHEN im.nota IS NULL THEN 1 ELSE 0 END) AS pendientes,
                    SUM(CASE WHEN im.nota IS NOT NULL THEN 1 ELSE 0 END) AS calificados
             FROM inscripcion_modulos im
             INNER JOIN inscripciones i ON i.id = im.inscripcion_id
             INNER JOIN producto_modulos pm ON pm.id = im.producto_modulo_id
             INNER JOIN productos_academicos p ON p.id = pm.producto_id
             INNER JOIN modulos m ON m.id = pm.modulo_id
             LEFT JOIN docentes d ON d.id = im.docente_id
             WHERE ' . $where . '
             GROUP BY pm.id, pm.numero_modulo, pm.codigo_slot, p.codigo, p.nombre, p.institucion, m.nombre_oficial, d.nombre
             ORDER BY p.nombre, pm.numero_modulo'
        );
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function studentsByCourseModule(string $productModuleId, string $userId, string $role): array
    {
        $teacherId = $role === 'Docente' ? $this->teacherIdForUser($userId) : null;
        if ($role === 'Docente' && !$teacherId) {
            return [];
        }

        $where = 'pm.id = :product_module_id AND i.eliminado = 0';
        $params = ['product_module_id' => $productModuleId];
        if ($teacherId) {
            $where .= ' AND im.docente_id = :teacher_id';
            $params['teacher_id'] = $teacherId;
        }

        $stmt = Database::pdo()->prepare(
            'SELECT im.id AS inscripcion_modulo_id,
                    im.nota,
                    im.estado,
                    im.fecha_inicio,
                    im.fecha_fin,
                    i.id AS inscripcion_id,
                    e.nombres,
                    e.apellidos,
                    e.ci,
                    e.extension_ci,
                    e.correo,
                    e.celular,
                    p.codigo AS producto_codigo,
                    p.nombre AS producto,
                    p.institucion,
                    pm.numero_modulo,
                    m.nombre_oficial AS modulo
             FROM inscripcion_modulos im
             INNER JOIN inscripciones i ON i.id = im.inscripcion_id
             INNER JOIN estudiantes e ON e.id = i.estudiante_id
             INNER JOIN producto_modulos pm ON pm.id = im.producto_modulo_id
             INNER JOIN productos_academicos p ON p.id = pm.producto_id
             INNER JOIN modulos m ON m.id = pm.modulo_id
             WHERE ' . $where . '
             ORDER BY e.apellidos, e.nombres'
        );
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function save(string $moduleId, float $nota, string $userId = '', string $role = ''): array
    {
        if ($nota < 1 || $nota > 100) {
            throw new \InvalidArgumentException('La nota debe estar entre 1 y 100');
        }

        if ($role === 'Docente') {
            $teacherId = $this->teacherIdForUser($userId);
            if (!$teacherId || !$this->moduleBelongsToTeacher($moduleId, $teacherId)) {
                throw new \DomainException('No tienes permiso para registrar esta nota');
            }
        }

        $estado = $nota >= 60 ? 'APROBADO' : 'REPROBADO';
        $stmt = Database::pdo()->prepare(
            'UPDATE inscripcion_modulos SET nota = :nota, estado = :estado, fecha_fin = COALESCE(fecha_fin, CURRENT_DATE)
             WHERE id = :id AND estado <> "CONVALIDADO"'
        );
        $stmt->execute(['nota' => $nota, 'estado' => $estado, 'id' => $moduleId]);

        $stmt = Database::pdo()->prepare('SELECT * FROM inscripcion_modulos WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $moduleId]);
        $module = $stmt->fetch();
        if ($module) {
            (new InscripcionService())->completeIfReady((string) $module['inscripcion_id']);
        }

        return $module ?: [];
    }

    private function moduleBelongsToTeacher(string $moduleId, string $teacherId): bool
    {
        $stmt = Database::pdo()->prepare('SELECT COUNT(*) FROM inscripcion_modulos WHERE id = :id AND docente_id = :teacher_id');
        $stmt->execute(['id' => $moduleId, 'teacher_id' => $teacherId]);

        return (int) $stmt->fetchColumn() > 0;
    }

    private function teacherIdForUser(string $userId): ?string
    {
        $stmt = Database::pdo()->prepare(
            'SELECT d.id
             FROM usuarios u
             INNER JOIN docentes d ON d.correo_personal = u.correo
             WHERE u.id = :id AND d.activo = 1
             LIMIT 1'
        );
        $stmt->execute(['id' => $userId]);
        $id = $stmt->fetchColumn();

        return $id ? (string) $id : null;
    }
}
