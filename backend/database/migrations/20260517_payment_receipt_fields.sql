USE digitalice;

ALTER TABLE pagos
  ADD COLUMN codigo_comprobante VARCHAR(80) NULL AFTER estado_factura,
  ADD COLUMN fecha_comprobante DATE NULL AFTER codigo_comprobante;

