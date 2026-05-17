## Modelo de Datos Entidad-Relación

El siguiente modelo de datos define la estructura base del sistema académico, organizado bajo un enfoque de entidad-relación.  
El modelo permite asegurar la integridad de la información mediante claves primarias, claves foráneas, restricciones de unicidad y reglas de negocio aplicadas a las relaciones entre productos académicos, módulos, estudiantes, docentes, inscripciones y pagos.

A nivel de seguridad e integridad, cada entidad cuenta con identificadores únicos, relaciones controladas mediante claves foráneas y restricciones que evitan duplicidad o inconsistencias en los registros.

---

## Tabla: `productos_academicos`

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| id | UUID PK | Identificador único | uuid-auto |
| codigo | VARCHAR(20) UNIQUE | Código oficial estandarizado | NCD10925 |
| nombre | VARCHAR(200) | Nombre del producto | Analítica de Datos |
| tipo | ENUM | CURSO \| CURSO_EXPERTO \| DIPLOMADO | DIPLOMADO |
| num_modulos | INT | Calculado: 1, 3 o 5 según tipo | 5 |
| institucion | VARCHAR(100) | Institución emisora | DIGITALICE |
| aprobado_ministerio | BOOLEAN | Indica si está oficializado | true |
| activo | BOOLEAN | Estado del producto | true |
| created_at | TIMESTAMP | Fecha de creación | 2025-01-15 |

---

## Tabla: `modulos`

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| id | UUID PK | Identificador único | uuid-auto |
| codigo | VARCHAR(30) UNIQUE | Código único del módulo | MOD_SQL_BIG_DATA |
| nombre_oficial | VARCHAR(300) | Nombre aprobado por Ministerio | SQL Big Data |
| descripcion | TEXT | Descripción opcional | ... |
| activo | BOOLEAN | Estado del módulo | true |
| created_at | TIMESTAMP | Fecha de creación | 2025-01-15 |

---

## Tabla: `producto_modulos`

Esta tabla representa la relación muchos a muchos entre productos académicos y módulos.  
Permite vincular un módulo a un slot específico dentro de un producto académico.

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| id | UUID PK | Identificador único | uuid-auto |
| producto_id | UUID FK → productos_academicos | Producto al que pertenece | NCD10925 |
| modulo_id | UUID FK → modulos | Módulo asignado | MOD_SQL_BIG_DATA |
| numero_modulo | INT (1-5) | Posición dentro del producto académico | 1 |
| codigo_slot | VARCHAR(40) UNIQUE | Código generado del slot | NCD10925_MOD1 |

**Restricción clave:**

| Restricción | Descripción |
|---|---|
| UNIQUE (producto_id, numero_modulo) | Un producto académico no puede tener dos veces el mismo número de módulo |

---

## Tabla: `estudiantes`

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| nombres | VARCHAR(150) | Nombres del estudiante |
| apellidos | VARCHAR(150) | Apellidos del estudiante |
| ci | VARCHAR(20) UNIQUE | Cédula de identidad |
| extension_ci | VARCHAR(10) | Extensión del CI |
| celular | VARCHAR(20) | Número WhatsApp principal |
| correo | VARCHAR(150) UNIQUE | Correo electrónico |
| fecha_nacimiento | DATE | Fecha de nacimiento |
| estado_civil | VARCHAR(30) | Estado civil |
| direccion | TEXT | Dirección de domicilio |
| ciudad | VARCHAR(100) | Ciudad de residencia |
| universidad_titulacion | VARCHAR(200) | Institución de titulación académica |
| carrera | VARCHAR(200) | Carrera o curso cursado |
| grado_academico | VARCHAR(100) | Licenciatura, Maestría, Técnico, etc. |
| institucion_trabajo | VARCHAR(200) | Empresa donde trabaja |
| cargo | VARCHAR(200) | Cargo o puesto actual |
| anio_inicio_trabajo | INT | Año de inicio en el trabajo actual |
| telefono_oficina | VARCHAR(20) | Teléfono de oficina |
| telefono_domicilio | VARCHAR(20) | Teléfono domicilio |
| activo | BOOLEAN DEFAULT true | Estado del estudiante en el sistema |
| created_at | TIMESTAMP | Fecha de registro |

---

## Tabla: `docentes`

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| nombre | VARCHAR(150) | Nombre completo del docente |
| correo_personal | VARCHAR(150) UNIQUE | Correo personal |
| celular | VARCHAR(20) | Número de celular |
| carrera | VARCHAR(200) | Especialidad o carrera del docente |
| pais | VARCHAR(100) | País de residencia u origen |
| activo | BOOLEAN DEFAULT true | Estado activo del docente |
| created_at | TIMESTAMP | Fecha de registro |

---

## Tabla: `inscripciones`

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| estudiante_id | UUID FK → estudiantes | Referencia al estudiante |
| producto_id | UUID FK → productos_academicos | Producto al que se inscribe |
| paralelo | VARCHAR(20) | Paralelo asignado |
| metodo_pago | ENUM | AL_CONTADO \| CUOTAS |
| fecha_inscripcion | TIMESTAMP | Fecha y hora de inscripción |
| estado | ENUM | ACTIVO \| SUSPENDIDO \| COMPLETADO \| CONVALIDADO |
| comprometido_pago | BOOLEAN | Indica si aceptó compromiso de pago |
| created_by | UUID FK → usuarios | Usuario que realizó el registro |

---

## Tabla: `inscripcion_modulos`

Esta tabla contiene el detalle académico de cada módulo dentro de una inscripción.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| inscripcion_id | UUID FK → inscripciones | Inscripción padre |
| producto_modulo_id | UUID FK → producto_modulos | Slot específico del módulo en el producto |
| docente_id | UUID FK → docentes NULL | Docente asignado al módulo |
| nota | DECIMAL(5,2) NULL | Nota obtenida de 1 a 100 |
| estado | ENUM | PENDIENTE \| EN_CURSO \| APROBADO \| REPROBADO \| CONVALIDADO |
| fecha_inicio | DATE NULL | Fecha de inicio del módulo |
| fecha_fin | DATE NULL | Fecha de fin del módulo |
| es_convalidacion | BOOLEAN DEFAULT false | Indica si el módulo fue convalidado |
| inscripcion_origen_id | UUID FK NULL | Inscripción de origen de la convalidación |

**Regla académica:**

| Regla | Descripción |
|---|---|
| nota >= 60 | El módulo se considera APROBADO |
| nota < 60 | El módulo se considera REPROBADO |
| nota NULL | El módulo aún no ha sido cursado o evaluado |

---

## Tabla: `pagos`

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| inscripcion_id | UUID FK → inscripciones | Inscripción relacionada |
| numero_cuota | INT | Número de cuota |
| monto | DECIMAL(10,2) | Monto de la cuota en moneda local |
| fecha_vencimiento | DATE | Fecha límite de pago |
| fecha_pago | DATE NULL | Fecha real de pago |
| estado | ENUM | PENDIENTE \| PAGADO \| VENCIDO |
| entidad_facturadora | ENUM | DIGITALICE \| USFA |
| estado_factura | ENUM | PENDIENTE \| FACTURADO |
| comprobante_url | TEXT NULL | URL del archivo del comprobante subido |
| comprobante_nombre | VARCHAR(200) | Nombre original del archivo |
| notas | TEXT NULL | Observaciones del coordinador |
| registrado_por | UUID FK → usuarios | Usuario que registró el pago |
| created_at | TIMESTAMP | Fecha de registro |

---

## Relaciones principales del modelo

| Relación | Tipo | Descripción |
|---|---|---|
| productos_academicos → producto_modulos | 1:N | Un producto académico puede tener varios módulos asignados |
| modulos → producto_modulos | 1:N | Un módulo puede formar parte de varios productos académicos |
| productos_academicos ↔ modulos | N:M | La relación muchos a muchos se resuelve mediante `producto_modulos` |
| estudiantes → inscripciones | 1:N | Un estudiante puede tener varias inscripciones |
| productos_academicos → inscripciones | 1:N | Un producto académico puede tener varias inscripciones |
| inscripciones → inscripcion_modulos | 1:N | Una inscripción contiene el avance de cada módulo |
| producto_modulos → inscripcion_modulos | 1:N | Cada módulo inscrito referencia al slot definido en el producto |
| docentes → inscripcion_modulos | 1:N | Un docente puede estar asignado a varios módulos inscritos |
| inscripciones → pagos | 1:N | Una inscripción puede tener uno o varios pagos asociados |
| usuarios → inscripciones | 1:N | Un usuario registra una inscripción |
| usuarios → pagos | 1:N | Un usuario registra un pago |

---

## Consideraciones de seguridad e integridad del modelo

| Criterio | Aplicación en el modelo |
|---|---|
| Identificación única | Cada entidad principal utiliza `UUID PK` como identificador único |
| Integridad referencial | Las relaciones se controlan mediante claves foráneas entre entidades |
| Evitar duplicidad | Se aplican campos `UNIQUE` en códigos, correos, CI y slots académicos |
| Control de estado | Se utilizan campos `activo` y `estado` para controlar vigencia y situación del registro |
| Auditoría básica | Se incorporan campos como `created_at`, `created_by` y `registrado_por` |
| Seguridad por entidad | El acceso puede segmentarse por rol sobre entidades como estudiantes, docentes, inscripciones, módulos y pagos |
| Trazabilidad académica | La tabla `inscripcion_modulos` permite conocer el avance académico por estudiante, módulo y docente |
| Trazabilidad financiera | La tabla `pagos` permite controlar cuotas, vencimientos, comprobantes y facturación |

## Consideración Final

Este modelo entidad relación a sido proporcionado por el cliente, si consideras hacer algunas mejoras del modelo,realizado solo indicando cuales fueron esas mejoras.     

---

## Mejora Aplicada Al Modelo

Se elimina la restricción rígida de máximo 5 módulos por producto académico para permitir que la tabla `producto_modulos` soporte crecimiento dinámico.  
La regla recomendada para `numero_modulo` es que sea mayor o igual a 1 y único dentro del producto.

También se considera la gestión de usuarios autenticados para permitir una vista de configuración personal donde el usuario pueda actualizar nombre, correo y contraseña bajo validación del backend.
