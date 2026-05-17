<?php

declare(strict_types=1);

namespace DigitalIce\Repositories;

use DigitalIce\Config\Database;
use DigitalIce\Helpers\Uuid;

final class SimpleCatalogRepository
{
    public function __construct(private string $table, private array $allowedFields)
    {
    }

    public function list(string $search = ''): array
    {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];
        if ($search !== '' && in_array('nombres', $this->allowedFields, true)) {
            $sql .= ' WHERE nombres LIKE :search OR apellidos LIKE :search OR ci LIKE :search';
            $params['search'] = '%' . $search . '%';
        } elseif ($search !== '' && in_array('nombre', $this->allowedFields, true)) {
            $sql .= ' WHERE nombre LIKE :search OR correo_personal LIKE :search';
            $params['search'] = '%' . $search . '%';
        }
        $sql .= ' ORDER BY created_at DESC';

        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function find(string $id): ?array
    {
        $stmt = Database::pdo()->prepare("SELECT * FROM {$this->table} WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function create(array $data): array
    {
        $data = array_intersect_key($data, array_flip($this->allowedFields));
        $data['id'] = Uuid::v4();
        $columns = array_keys($data);
        $placeholders = array_map(fn ($column) => ':' . $column, $columns);

        $stmt = Database::pdo()->prepare(
            "INSERT INTO {$this->table} (" . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')'
        );
        $stmt->execute($data);

        return $this->find($data['id']);
    }

    public function update(string $id, array $data): ?array
    {
        $data = array_intersect_key($data, array_flip($this->allowedFields));
        unset($data['id']);
        if ($data === []) {
            return $this->find($id);
        }

        $sets = array_map(fn ($column) => $column . ' = :' . $column, array_keys($data));
        $data['id'] = $id;
        $stmt = Database::pdo()->prepare("UPDATE {$this->table} SET " . implode(', ', $sets) . ' WHERE id = :id');
        $stmt->execute($data);

        return $this->find($id);
    }

    public function deactivate(string $id): ?array
    {
        $stmt = Database::pdo()->prepare("UPDATE {$this->table} SET activo = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);

        return $this->find($id);
    }
}
