USE digitalice;

INSERT INTO usuarios (id, rol_id, nombre, correo, password_hash, activo) VALUES
('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002', 'Coordinador Prueba', 'coordinador@digitalice.local', '$2y$12$UeWwTDYkB2M4Xg0BwkrqTO7lOtJuWsuafZEsmnpa5DPo2A1UGG3G.', TRUE),
('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000003', 'Docente Prueba', 'docente@digitalice.local', '$2y$12$UeWwTDYkB2M4Xg0BwkrqTO7lOtJuWsuafZEsmnpa5DPo2A1UGG3G.', TRUE),
('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000004', 'Estudiante Prueba', 'estudiante@digitalice.local', '$2y$12$UeWwTDYkB2M4Xg0BwkrqTO7lOtJuWsuafZEsmnpa5DPo2A1UGG3G.', TRUE)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  rol_id = VALUES(rol_id),
  password_hash = VALUES(password_hash),
  activo = TRUE;
