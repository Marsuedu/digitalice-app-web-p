USE digitalice;

ALTER TABLE pagos
  ADD COLUMN eliminado BOOLEAN NOT NULL DEFAULT FALSE AFTER registrado_por,
  ADD COLUMN eliminado_por CHAR(36) NULL AFTER eliminado,
  ADD COLUMN eliminado_at TIMESTAMP NULL AFTER eliminado_por,
  ADD CONSTRAINT fk_pagos_eliminado_por FOREIGN KEY (eliminado_por) REFERENCES usuarios(id);

