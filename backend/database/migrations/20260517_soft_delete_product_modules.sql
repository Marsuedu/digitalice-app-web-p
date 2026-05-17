ALTER TABLE producto_modulos
  ADD COLUMN eliminado BOOLEAN NOT NULL DEFAULT FALSE AFTER codigo_slot,
  ADD COLUMN eliminado_at TIMESTAMP NULL AFTER eliminado;

ALTER TABLE producto_modulos
  DROP INDEX uq_producto_numero,
  DROP INDEX uq_producto_modulo,
  DROP INDEX codigo_slot,
  ADD INDEX idx_producto_modulos_visibles (producto_id, eliminado, numero_modulo),
  ADD INDEX idx_producto_modulos_modulo (producto_id, modulo_id, eliminado),
  ADD INDEX idx_producto_modulos_slot (codigo_slot);
