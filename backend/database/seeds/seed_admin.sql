USE digitalice;

INSERT INTO usuarios (id, rol_id, nombre, correo, password_hash, activo) VALUES
('00000000-0000-4000-8000-000000000100', '00000000-0000-4000-8000-000000000001', 'Administrador DIGITALICE', 'admin@digitalice.local', '$2y$12$LSGy4nMyo2eF3n7Z3D2kIuYnIjY1bSac8jSnzB2IvD9.Gm4.8ylVq', TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = TRUE;

