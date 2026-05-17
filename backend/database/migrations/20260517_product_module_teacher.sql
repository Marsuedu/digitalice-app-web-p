ALTER TABLE producto_modulos
  ADD COLUMN docente_id CHAR(36) NULL AFTER modulo_id,
  ADD CONSTRAINT fk_producto_modulos_docente FOREIGN KEY (docente_id) REFERENCES docentes(id);
