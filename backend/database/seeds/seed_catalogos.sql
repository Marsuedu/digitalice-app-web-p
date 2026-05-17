USE digitalice;

INSERT INTO catalogos (id, tipo, codigo, nombre) VALUES
('10000000-0000-4000-8000-000000000001', 'extension_ci', 'LP', 'La Paz'),
('10000000-0000-4000-8000-000000000002', 'extension_ci', 'CB', 'Cochabamba'),
('10000000-0000-4000-8000-000000000003', 'extension_ci', 'SC', 'Santa Cruz'),
('10000000-0000-4000-8000-000000000004', 'estado_pago', 'PENDIENTE', 'Pendiente'),
('10000000-0000-4000-8000-000000000005', 'estado_pago', 'PAGADO', 'Pagado'),
('10000000-0000-4000-8000-000000000006', 'estado_pago', 'VENCIDO', 'Vencido'),
('10000000-0000-4000-8000-000000000007', 'modalidad_pago', 'AL_CONTADO', 'Al contado'),
('10000000-0000-4000-8000-000000000008', 'modalidad_pago', 'CUOTAS', 'Cuotas'),
('10000000-0000-4000-8000-000000000009', 'entidad_facturadora', 'DIGITALICE', 'DIGITALICE'),
('10000000-0000-4000-8000-000000000010', 'entidad_facturadora', 'USFA', 'USFA')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = TRUE;

