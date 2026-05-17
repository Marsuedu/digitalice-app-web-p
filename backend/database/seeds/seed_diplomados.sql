USE digitalice;

INSERT INTO productos_academicos (id, codigo, nombre, tipo, num_modulos, institucion, aprobado_ministerio, activo) VALUES
('20000000-0000-4000-8000-000000000001', 'NCD02823v1', 'Compliance Empresarial y Blindaje Corporativo', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000002', 'NCD03823v2', 'Transformacion Digital', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000003', 'NCD05423v1', 'Transformacion Digital y Ciencia de Datos', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000004', 'NCD05523v1', 'Investigacion para las Ciencias Sociales', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000005', 'NCD01424', 'Modelos cuantitativos aplicados a Finanzas y Economia', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000006', 'NCD01524', 'Marketing Digital, E-Commerce & Social Media', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000007', 'NCD05024', 'Blockchain, Activos Virtuales y Mercados Financieros', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000008', 'NCD08924', 'Educacion Superior para Ciencias Empresariales', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000009', 'NCD09124', 'Metodos Cuantitativos para la investigacion social', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000010', 'NCD01225', 'Microfinanzas, Riesgos Financieros y FINTECH', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000011', 'NCD10925', 'Analitica de Datos', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000012', 'NCD11025', 'Banca y Gestion Integral de Riesgo', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000013', 'NCD04225', 'Data Engineering', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000014', 'NCD08625', 'Finanzas Sostenibles y Gestion de Riesgos', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000015', 'NCD09025', 'Microfinanzas, Gestion de Riesgos y Fintech', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000016', 'NCD11125', 'Business Analytics con Power BI', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000017', 'NCD11225', 'Data Engineering (nueva version)', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000018', 'NCD11325', 'Finanzas Cuantitativas con Python', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000019', 'NCD11625', 'Educacion Superior basado en Competencias e Innovacion Tecnologica', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000020', 'NCD11725', 'Gestion del Talento Humano y People Analytics', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000021', 'NCD11825', 'Innovacion Financiera y Business Intelligence', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE),
('20000000-0000-4000-8000-000000000022', 'NCD11925', 'Marketing Digital y Diseno Grafico', 'DIPLOMADO', 5, 'DIGITALICE', TRUE, TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = TRUE;

INSERT IGNORE INTO modulos (id, codigo, nombre_oficial, activo)
SELECT
  UUID(),
  CONCAT('MOD_', p.codigo, '_', nums.numero),
  CONCAT('Modulo ', nums.numero, ' - ', p.codigo),
  TRUE
FROM productos_academicos p
JOIN (
  SELECT 1 AS numero UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
) nums
WHERE p.tipo = 'DIPLOMADO';

INSERT IGNORE INTO producto_modulos (id, producto_id, modulo_id, numero_modulo, codigo_slot)
SELECT
  UUID(),
  p.id,
  m.id,
  nums.numero,
  CONCAT(p.codigo, '_MOD', nums.numero)
FROM productos_academicos p
JOIN (
  SELECT 1 AS numero UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
) nums
JOIN modulos m ON m.codigo = CONCAT('MOD_', p.codigo, '_', nums.numero)
WHERE p.tipo = 'DIPLOMADO';
