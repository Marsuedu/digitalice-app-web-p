ALTER TABLE productos_academicos
  ADD COLUMN estado ENUM('POR_INICIAR', 'ACTIVO', 'FINALIZADO') NOT NULL DEFAULT 'ACTIVO' AFTER activo,
  ADD INDEX idx_productos_estado (estado);

UPDATE productos_academicos
SET estado = CASE WHEN activo = 1 THEN 'ACTIVO' ELSE 'FINALIZADO' END
WHERE estado IS NULL OR estado = 'ACTIVO';
