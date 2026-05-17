CREATE DATABASE IF NOT EXISTS digitalice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE digitalice;

CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(200) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id CHAR(36) PRIMARY KEY,
  rol_id CHAR(36) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_roles FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos_academicos (
  id CHAR(36) PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  tipo ENUM('CURSO', 'CURSO_EXPERTO', 'DIPLOMADO') NOT NULL,
  num_modulos INT NOT NULL,
  institucion VARCHAR(100) NOT NULL DEFAULT 'DIGITALICE',
  aprobado_ministerio BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  estado ENUM('POR_INICIAR', 'ACTIVO', 'FINALIZADO') NOT NULL DEFAULT 'POR_INICIAR',
  monto_referencial DECIMAL(10,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_productos_tipo_activo (tipo, activo),
  INDEX idx_productos_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS modulos (
  id CHAR(36) PRIMARY KEY,
  codigo VARCHAR(60) NOT NULL UNIQUE,
  nombre_oficial VARCHAR(300) NOT NULL UNIQUE,
  descripcion TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS docentes (
  id CHAR(36) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  correo_personal VARCHAR(150) NOT NULL UNIQUE,
  celular VARCHAR(20) NOT NULL,
  carrera VARCHAR(200) NOT NULL,
  pais VARCHAR(100) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_docentes_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS producto_modulos (
  id CHAR(36) PRIMARY KEY,
  producto_id CHAR(36) NOT NULL,
  modulo_id CHAR(36) NOT NULL,
  docente_id CHAR(36) NULL,
  numero_modulo INT NOT NULL,
  codigo_slot VARCHAR(60) NOT NULL,
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  eliminado_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_producto_modulos_producto FOREIGN KEY (producto_id) REFERENCES productos_academicos(id),
  CONSTRAINT fk_producto_modulos_modulo FOREIGN KEY (modulo_id) REFERENCES modulos(id),
  CONSTRAINT fk_producto_modulos_docente FOREIGN KEY (docente_id) REFERENCES docentes(id),
  CONSTRAINT chk_numero_modulo CHECK (numero_modulo >= 1),
  INDEX idx_producto_modulos_visibles (producto_id, eliminado, numero_modulo),
  INDEX idx_producto_modulos_modulo (producto_id, modulo_id, eliminado),
  INDEX idx_producto_modulos_slot (codigo_slot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS estudiantes (
  id CHAR(36) PRIMARY KEY,
  nombres VARCHAR(150) NOT NULL,
  apellidos VARCHAR(150) NOT NULL,
  ci VARCHAR(20) NOT NULL UNIQUE,
  extension_ci VARCHAR(10) NOT NULL,
  celular VARCHAR(20) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  fecha_nacimiento DATE NULL,
  estado_civil VARCHAR(30) NULL,
  direccion TEXT NULL,
  ciudad VARCHAR(100) NULL,
  universidad_titulacion VARCHAR(200) NULL,
  carrera VARCHAR(200) NULL,
  grado_academico VARCHAR(100) NULL,
  institucion_trabajo VARCHAR(200) NULL,
  cargo VARCHAR(200) NULL,
  anio_inicio_trabajo INT NULL,
  telefono_oficina VARCHAR(20) NULL,
  telefono_domicilio VARCHAR(20) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_estudiantes_busqueda (ci, apellidos, nombres)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inscripciones (
  id CHAR(36) PRIMARY KEY,
  estudiante_id CHAR(36) NOT NULL,
  producto_id CHAR(36) NOT NULL,
  paralelo VARCHAR(20) NOT NULL DEFAULT 'A',
  metodo_pago ENUM('AL_CONTADO', 'CUOTAS') NOT NULL,
  monto_total DECIMAL(10,2) NOT NULL,
  fecha_inscripcion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_completado DATE NULL,
  estado ENUM('ACTIVO', 'SUSPENDIDO', 'COMPLETADO', 'CONVALIDADO') NOT NULL DEFAULT 'ACTIVO',
  comprometido_pago BOOLEAN NOT NULL DEFAULT FALSE,
  created_by CHAR(36) NOT NULL,
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  eliminado_por CHAR(36) NULL,
  eliminado_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inscripciones_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
  CONSTRAINT fk_inscripciones_producto FOREIGN KEY (producto_id) REFERENCES productos_academicos(id),
  CONSTRAINT fk_inscripciones_usuario FOREIGN KEY (created_by) REFERENCES usuarios(id),
  CONSTRAINT fk_inscripciones_eliminado_por FOREIGN KEY (eliminado_por) REFERENCES usuarios(id),
  INDEX idx_inscripciones_estado (estado),
  INDEX idx_inscripciones_estudiante (estudiante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inscripcion_modulos (
  id CHAR(36) PRIMARY KEY,
  inscripcion_id CHAR(36) NOT NULL,
  producto_modulo_id CHAR(36) NOT NULL,
  docente_id CHAR(36) NULL,
  nota DECIMAL(5,2) NULL,
  estado ENUM('PENDIENTE', 'EN_CURSO', 'APROBADO', 'REPROBADO', 'CONVALIDADO') NOT NULL DEFAULT 'PENDIENTE',
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  es_convalidacion BOOLEAN NOT NULL DEFAULT FALSE,
  inscripcion_origen_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inscripcion_modulos_inscripcion FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id),
  CONSTRAINT fk_inscripcion_modulos_producto_modulo FOREIGN KEY (producto_modulo_id) REFERENCES producto_modulos(id),
  CONSTRAINT fk_inscripcion_modulos_docente FOREIGN KEY (docente_id) REFERENCES docentes(id),
  CONSTRAINT fk_inscripcion_modulos_origen FOREIGN KEY (inscripcion_origen_id) REFERENCES inscripciones(id),
  CONSTRAINT uq_inscripcion_producto_modulo UNIQUE (inscripcion_id, producto_modulo_id),
  CONSTRAINT chk_nota_rango CHECK (nota IS NULL OR (nota >= 1 AND nota <= 100)),
  INDEX idx_inscripcion_modulos_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pagos (
  id CHAR(36) PRIMARY KEY,
  inscripcion_id CHAR(36) NOT NULL,
  numero_cuota INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  monto_pagado DECIMAL(10,2) NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE NULL,
  estado ENUM('PENDIENTE', 'PAGADO', 'VENCIDO') NOT NULL DEFAULT 'PENDIENTE',
  entidad_facturadora ENUM('DIGITALICE', 'USFA') NULL,
  estado_factura ENUM('PENDIENTE', 'FACTURADO') NULL,
  codigo_comprobante VARCHAR(80) NULL,
  fecha_comprobante DATE NULL,
  comprobante_url TEXT NULL,
  comprobante_nombre VARCHAR(200) NULL,
  notas TEXT NULL,
  registrado_por CHAR(36) NULL,
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  eliminado_por CHAR(36) NULL,
  eliminado_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagos_inscripcion FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id),
  CONSTRAINT fk_pagos_usuario FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  CONSTRAINT fk_pagos_eliminado_por FOREIGN KEY (eliminado_por) REFERENCES usuarios(id),
  CONSTRAINT uq_pago_cuota UNIQUE (inscripcion_id, numero_cuota),
  CONSTRAINT chk_monto_pago CHECK (monto > 0),
  INDEX idx_pagos_estado (estado),
  INDEX idx_pagos_vencimiento (fecha_vencimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS catalogos (
  id CHAR(36) PRIMARY KEY,
  tipo VARCHAR(80) NOT NULL,
  codigo VARCHAR(80) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_catalogo_tipo_codigo UNIQUE (tipo, codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
