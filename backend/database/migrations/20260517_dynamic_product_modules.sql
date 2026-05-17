USE digitalice;

ALTER TABLE producto_modulos DROP CONSTRAINT chk_numero_modulo;
ALTER TABLE producto_modulos ADD CONSTRAINT chk_numero_modulo CHECK (numero_modulo >= 1);

