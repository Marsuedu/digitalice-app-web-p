USE digitalice;

INSERT INTO docentes (id, nombre, correo_personal, celular, carrera, pais, activo) VALUES
('00000000-0000-4000-8000-000000000302', 'Docente Prueba', 'docente@digitalice.local', '70000002', 'Educación Superior', 'Bolivia', TRUE)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  celular = VALUES(celular),
  carrera = VALUES(carrera),
  pais = VALUES(pais),
  activo = TRUE;

INSERT INTO estudiantes (id, nombres, apellidos, ci, extension_ci, celular, correo, activo) VALUES
('00000000-0000-4000-8000-000000000303', 'Estudiante', 'Prueba', '9000003', 'LP', '70000003', 'estudiante@digitalice.local', TRUE)
ON DUPLICATE KEY UPDATE
  nombres = VALUES(nombres),
  apellidos = VALUES(apellidos),
  celular = VALUES(celular),
  correo = VALUES(correo),
  activo = TRUE;
