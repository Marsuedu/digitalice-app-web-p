<?php

declare(strict_types=1);

namespace DigitalIce\Repositories;

use DigitalIce\Config\Database;

final class ProductoAcademicoRepository
{
    public function list(): array
    {
        return Database::pdo()
            ->query('SELECT * FROM productos_academicos ORDER BY created_at DESC')
            ->fetchAll();
    }

    public function find(string $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM productos_academicos WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $product = $stmt->fetch();

        return $product ?: null;
    }

    public function findWithModules(string $id): ?array
    {
        $product = $this->find($id);
        if (!$product) {
            return null;
        }

        $stmt = Database::pdo()->prepare(
            'SELECT pm.id AS producto_modulo_id,
                    pm.numero_modulo,
                    pm.codigo_slot,
                    pm.docente_id,
                    m.id AS modulo_id,
                    m.nombre_oficial,
                    d.nombre AS docente,
                    COUNT(im.id) AS inscripciones_count
             FROM producto_modulos pm
             INNER JOIN modulos m ON m.id = pm.modulo_id
             LEFT JOIN docentes d ON d.id = pm.docente_id
             LEFT JOIN inscripcion_modulos im ON im.producto_modulo_id = pm.id
             WHERE pm.producto_id = :id AND pm.eliminado = 0
             GROUP BY pm.id, pm.numero_modulo, pm.codigo_slot, pm.docente_id, m.id, m.nombre_oficial, d.nombre
             ORDER BY pm.numero_modulo'
        );
        $stmt->execute(['id' => $id]);
        $product['modulos'] = $stmt->fetchAll();

        return $product;
    }
}
