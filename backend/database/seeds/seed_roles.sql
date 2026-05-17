USE digitalice;

INSERT INTO roles (id, nombre, descripcion) VALUES
('00000000-0000-4000-8000-000000000001', 'Admin', 'Gestion total del sistema'),
('00000000-0000-4000-8000-000000000002', 'Coordinador', 'Gestion operativa academica y financiera'),
('00000000-0000-4000-8000-000000000003', 'Docente', 'Acceso a modulos asignados y registro de notas'),
('00000000-0000-4000-8000-000000000004', 'Estudiante', 'Consulta de progreso academico y pagos propios')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

