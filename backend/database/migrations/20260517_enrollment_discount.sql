ALTER TABLE inscripciones
  ADD COLUMN monto_base DECIMAL(10,2) NULL AFTER metodo_pago,
  ADD COLUMN descuento DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER monto_base;
