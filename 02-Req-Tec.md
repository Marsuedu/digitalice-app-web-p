

# Requerimientos Técnicos Consolidados del Sistema Académico

## 1. Contexto de la Aplicación

El sistema corresponde a una aplicación académica orientada a gestionar productos académicos, módulos, estudiantes, docentes, inscripciones, notas, convalidaciones, pagos y roles de usuario.

La aplicación debe construirse bajo una arquitectura separada entre frontend, backend y base de datos, considerando que en una fase futura se podrá crear una aplicación mobile que consuma la misma API.

El objetivo técnico principal es mantener una solución simple, mantenible, compatible con hosting tradicional y preparada para evolucionar sin rehacer la arquitectura base.

---

## 2. Objetivo Técnico del Proyecto

El sistema debe permitir construir una aplicación web académica con API independiente, frontend desacoplado y base de datos relacional, manteniendo compatibilidad con ambientes locales mediante Docker y despliegue futuro en Hostinger.

La solución debe priorizar:

- Simplicidad del código.
- Separación clara entre frontend y backend.
- Compatibilidad con PHP 8.4 o superior.
- Compatibilidad con MySQL o MariaDB.
- Frontend moderno usando React JS y TypeScript.
- API REST documentada con Swagger/OpenAPI.
- Ambiente local reproducible con Docker.
- Seguridad básica desde la primera versión.
- Pruebas unitarias mínimas para reglas críticas.
- Archivo SQL ejecutable para crear las tablas directamente en la base de datos.

---

## 3. Arquitectura General

### 3.1 Separación obligatoria por capas

El sistema debe estar separado en tres componentes principales:

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React JS + TypeScript | Interfaz web, formularios, vistas por rol y consumo de API |
| Backend | PHP 8.4 o superior | API REST, lógica de negocio, autenticación, sesiones, validaciones y persistencia |
| Base de datos | MariaDB / MySQL | Almacenamiento relacional del sistema |

### 3.2 Justificación de la separación

La separación entre frontend y backend es obligatoria porque:

- Permite que el frontend web consuma la API sin acoplarse a la lógica interna del backend.
- Permite crear una futura aplicación mobile usando la misma API.
- Permite desplegar el frontend como archivos estáticos HTML, JS y CSS.
- Permite mantener la lógica crítica del negocio en backend.
- Permite escalar o reemplazar componentes sin rehacer todo el sistema.
- Permite que distintos clientes, como web, mobile o integraciones externas, consuman la misma API.

---

## 4. Stack Técnico Definido

| Capa | Tecnología recomendada | Observación |
|---|---|---|
| Frontend | React JS + TypeScript | Interfaz web moderna, reutilizable y responsive |
| Build frontend | Vite | Compilación rápida a HTML, JS y CSS |
| Backend | PHP 8.4+ | API REST compatible con hosting tradicional |
| Framework backend | Slim Framework 4 | Microframework liviano para construir APIs REST |
| Base de datos | MariaDB / MySQL | Compatible con entornos de hosting tradicionales |
| Acceso a datos | PDO | Uso obligatorio de prepared statements |
| Documentación API | OpenAPI / Swagger | Documentación formal de endpoints |
| Validación backend | Validadores PHP propios o librería mínima justificada | La validación real siempre debe ocurrir en backend |
| Sesiones | PHP Sessions para MVP | Deben quedar encapsuladas para futura migración a JWT |
| Testing backend | PHPUnit | Pruebas unitarias de reglas críticas |
| Ambiente local | Docker Compose | Levantar frontend, backend y base de datos |

---

## 5. Compatibilidad con Hostinger

### 5.1 Reglas de compatibilidad

El sistema debe diseñarse para ser compatible con un proveedor de hosting tradicional como Hostinger.

Reglas:

- El backend debe estar escrito en PHP 8.4 o superior.
- La base de datos debe ser MySQL o MariaDB compatible.
- El backend debe poder ejecutarse mediante Apache/LiteSpeed usando un `index.php` como front controller.
- El frontend debe compilarse como archivos estáticos mediante `npm run build`.
- No se deben usar tecnologías que requieran procesos permanentes si el plan de hosting no los soporta.
- Docker debe utilizarse para desarrollo local, no como dependencia obligatoria para producción en hosting compartido.
- El sistema debe poder conectarse a una base de datos creada desde el panel del hosting.
- El archivo `.env` de producción debe configurarse manualmente en el servidor y nunca subirse al repositorio.

### 5.2 Consideración sobre Docker en producción

En desarrollo local se usará Docker para levantar los tres componentes:

- Frontend.
- Backend.
- Base de datos.

En producción, si se usa hosting compartido o cloud hosting administrado, no se debe asumir que Docker estará disponible.  
Por ello, Docker será obligatorio para desarrollo local, pero no será requisito obligatorio para el despliegue en Hostinger.

---

## 6. Backend

## 6.1 Lenguaje

El backend debe desarrollarse en PHP 8.4 o superior.

### Reglas

- Usar PHP 8.4+.
- No mezclar HTML con lógica backend.
- El backend debe exponer una API REST.
- Toda respuesta de API debe retornar JSON.
- La lógica de negocio debe vivir en servicios.
- Las consultas a base de datos deben vivir en repositorios.
- Las rutas no deben contener lógica compleja.
- La validación debe ejecutarse antes de guardar datos.
- Las respuestas deben tener una estructura estándar.
- Los errores internos no deben exponerse al usuario final.

---

## 6.2 Framework Backend

### Framework recomendado

Se recomienda utilizar **Slim Framework 4**.

### Justificación

Slim es adecuado para este proyecto porque:

- Es liviano.
- Está orientado a APIs.
- Permite crear rutas REST rápidamente.
- Permite usar middlewares.
- No obliga a una estructura pesada.
- Se integra con Composer.
- Permite mantener una arquitectura simple y clara.
- Es más ligero que frameworks más grandes como Laravel para un MVP académico.

### Regla

No se debe agregar otro framework backend sin justificar claramente:

- Por qué se necesita.
- Qué problema resuelve.
- Qué impacto tiene en despliegue.
- Qué impacto tiene en complejidad.
- Si sigue siendo compatible con Hostinger.

---

## 6.3 Estructura Sugerida del Backend

```text
backend/
├── public/
│   ├── index.php
│   └── .htaccess
├── src/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── ProductoAcademicoController.php
│   │   ├── EstudianteController.php
│   │   ├── InscripcionController.php
│   │   ├── DocenteController.php
│   │   ├── NotaController.php
│   │   └── PagoController.php
│   ├── Services/
│   │   ├── AuthService.php
│   │   ├── ProductoAcademicoService.php
│   │   ├── InscripcionService.php
│   │   ├── ConvalidacionService.php
│   │   ├── NotaService.php
│   │   └── PagoService.php
│   ├── Repositories/
│   │   ├── UserRepository.php
│   │   ├── ProductoAcademicoRepository.php
│   │   ├── ModuloRepository.php
│   │   ├── EstudianteRepository.php
│   │   ├── InscripcionRepository.php
│   │   ├── DocenteRepository.php
│   │   └── PagoRepository.php
│   ├── Middlewares/
│   │   ├── AuthMiddleware.php
│   │   ├── RoleMiddleware.php
│   │   ├── CorsMiddleware.php
│   │   └── JsonBodyMiddleware.php
│   ├── Validators/
│   │   ├── ProductoAcademicoValidator.php
│   │   ├── EstudianteValidator.php
│   │   ├── InscripcionValidator.php
│   │   ├── NotaValidator.php
│   │   └── PagoValidator.php
│   ├── Helpers/
│   │   ├── ResponseHelper.php
│   │   └── DateHelper.php
│   └── Config/
│       ├── Database.php
│       └── AppConfig.php
├── database/
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
│       ├── seed_roles.sql
│       ├── seed_admin.sql
│       ├── seed_diplomados.sql
│       └── seed_catalogos.sql
├── tests/
│   ├── Unit/
│   │   ├── ProductoAcademicoServiceTest.php
│   │   ├── NotaServiceTest.php
│   │   ├── ConvalidacionServiceTest.php
│   │   └── PagoServiceTest.php
│   └── bootstrap.php
├── composer.json
├── composer.lock
├── .env.example
├── Dockerfile
└── README.md
```

---

## 6.4 Reglas de Backend

- Usar Composer para dependencias.
- Usar autoload PSR-4.
- Usar estilo PSR-12 cuando sea posible.
- Usar PDO para la conexión a base de datos.
- Usar prepared statements en todas las consultas SQL.
- No concatenar valores del usuario directamente en SQL.
- No colocar SQL directamente en controladores.
- No repetir lógica de negocio en varios controladores.
- No crear clases demasiado grandes.
- No agregar librerías nuevas sin explicar por qué.
- Mantener nombres claros y descriptivos.
- Mantener servicios pequeños y reutilizables.
- Mantener validadores reutilizables.
- Mantener controladores delgados.
- Mantener repositorios enfocados en acceso a datos.
- Documentar endpoints con Swagger/OpenAPI.

---

## 7. Frontend

## 7.1 Tecnología

El frontend debe desarrollarse en React JS con TypeScript estricto.

### Reglas principales

- Usar React JS.
- Usar TypeScript estricto.
- Usar Vite para desarrollo y build.
- Crear componentes pequeños y reutilizables.
- Separar páginas, componentes, servicios de API, hooks, tipos y utilitarios.
- No colocar llamadas HTTP directamente en componentes complejos.
- Crear servicios por dominio funcional.
- No agregar librerías nuevas sin explicar por qué.
- Seguir los patrones existentes del proyecto.
- Evitar refactors grandes si no son necesarios.
- Mantener diseño responsive para móvil y desktop.
- Priorizar usabilidad sobre decoración.
- Mantener formularios simples y claros.
- Mostrar errores de validación cerca del campo correspondiente.
- Mostrar mensajes claros ante errores de API.
- No exponer claves ni variables sensibles en frontend.

---

## 7.2 Estructura Sugerida del Frontend

```text
frontend/
├── src/
│   ├── api/
│   │   ├── httpClient.ts
│   │   ├── authApi.ts
│   │   ├── productosApi.ts
│   │   ├── estudiantesApi.ts
│   │   ├── inscripcionesApi.ts
│   │   ├── docentesApi.ts
│   │   ├── notasApi.ts
│   │   └── pagosApi.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Table.tsx
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── forms/
│   │       ├── ProductoAcademicoForm.tsx
│   │       ├── EstudianteForm.tsx
│   │       ├── InscripcionForm.tsx
│   │       └── PagoForm.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductosPage.tsx
│   │   ├── EstudiantesPage.tsx
│   │   ├── InscripcionesPage.tsx
│   │   ├── DocentesPage.tsx
│   │   ├── NotasPage.tsx
│   │   └── PagosPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRoles.ts
│   │   └── useApi.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── producto.types.ts
│   │   ├── estudiante.types.ts
│   │   ├── inscripcion.types.ts
│   │   ├── docente.types.ts
│   │   ├── nota.types.ts
│   │   └── pago.types.ts
│   ├── utils/
│   │   ├── formatDate.ts
│   │   ├── formatMoney.ts
│   │   └── validators.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── README.md
```

---

## 7.3 Reglas de Componentes Frontend

- Cada componente debe tener una responsabilidad clara.
- Los componentes UI básicos deben ser reutilizables.
- Los formularios deben separarse por dominio funcional.
- Las páginas deben orquestar componentes, no contener toda la lógica.
- Los tipos TypeScript deben estar centralizados en `/types`.
- Las llamadas a la API deben estar centralizadas en `/api`.
- Las funciones repetitivas deben ir en `/utils`.
- Los hooks deben encapsular lógica reutilizable.
- No crear componentes gigantes.
- No duplicar formularios si pueden parametrizarse con claridad.
- No sacrificar claridad por abstracciones innecesarias.

---

## 8. Base de Datos

## 8.1 Motor de Base de Datos

La base de datos debe ser MariaDB o MySQL compatible.

### Reglas

- Usar motor InnoDB.
- Usar codificación `utf8mb4`.
- Usar claves primarias en todas las tablas.
- Usar claves foráneas entre entidades relacionadas.
- Aplicar restricciones `UNIQUE` donde corresponda.
- Aplicar índices en columnas de búsqueda frecuente.
- No eliminar registros críticos físicamente; preferir eliminación lógica con `activo` o `estado`.
- Mantener campos de auditoría como `created_at`, `updated_at`, `created_by`.
- Mantener migraciones o scripts SQL versionados.
- Mantener seeds versionados.
- Evitar lógica de negocio compleja dentro de la base de datos, salvo validaciones o restricciones necesarias.

---

## 8.2 Archivo SQL Obligatorio para Crear Tablas

### Requerimiento técnico obligatorio

El proyecto debe incluir un archivo `.sql` que contenga la creación completa de las tablas principales del sistema, con el objetivo de poder inicializar la base de datos directamente en MySQL o MariaDB sin depender únicamente de código PHP.

Este archivo debe permitir crear la estructura de base de datos de forma manual o automatizada en ambientes locales, pruebas o producción.

### Archivo requerido

```text
backend/database/schema.sql
```

### Objetivo del archivo `schema.sql`

El archivo `schema.sql` debe contener:

- Creación de la base de datos, si corresponde.
- Creación de todas las tablas del sistema.
- Definición de claves primarias.
- Definición de claves foráneas.
- Definición de índices.
- Definición de restricciones `UNIQUE`.
- Definición de tipos de datos compatibles con MariaDB/MySQL.
- Definición de campos de auditoría.
- Definición de valores por defecto.
- Definición de relaciones entre entidades.
- Uso del motor `InnoDB`.
- Uso de charset `utf8mb4`.

### Tablas mínimas que debe incluir

| Tabla | Descripción |
|---|---|
| `roles` | Catálogo de roles del sistema |
| `usuarios` | Usuarios autenticados del sistema |
| `productos_academicos` | Cursos, cursos expertos y diplomados |
| `modulos` | Catálogo único de módulos académicos |
| `producto_modulos` | Relación entre productos académicos y módulos |
| `estudiantes` | Información personal, académica y laboral del estudiante |
| `docentes` | Información de docentes |
| `inscripciones` | Inscripción de estudiantes a productos académicos |
| `inscripcion_modulos` | Avance académico del estudiante por módulo |
| `pagos` | Plan de pagos, cuotas, comprobantes y estado financiero |

### Reglas para el archivo SQL

- El archivo debe poder ejecutarse directamente en MariaDB o MySQL.
- El script debe ser compatible con Hostinger.
- El script debe usar `CREATE TABLE IF NOT EXISTS`.
- Todas las tablas deben usar `ENGINE=InnoDB`.
- Todas las tablas deben usar `DEFAULT CHARSET=utf8mb4`.
- Las claves foráneas deben estar declaradas explícitamente.
- Los campos únicos deben usar restricciones `UNIQUE`.
- Las tablas deben crearse en orden lógico para evitar errores de dependencias.
- No se deben incluir datos sensibles dentro del archivo SQL.
- No se deben incluir usuarios reales ni contraseñas reales dentro del archivo SQL.
- Los datos iniciales deben ir en archivos seed separados, no mezclados con el schema.

### Orden recomendado de creación de tablas

```text
1. roles
2. usuarios
3. productos_academicos
4. modulos
5. producto_modulos
6. estudiantes
7. docentes
8. inscripciones
9. inscripcion_modulos
10. pagos
```

---

## 8.3 Separación entre Estructura y Datos

La estructura de base de datos y los datos iniciales deben mantenerse separados.

| Archivo | Responsabilidad |
|---|---|
| `schema.sql` | Crear tablas, claves, índices y relaciones |
| `seed_roles.sql` | Insertar roles base |
| `seed_admin.sql` | Insertar usuario administrador inicial |
| `seed_diplomados.sql` | Insertar los 22 diplomados oficiales |
| `seed_catalogos.sql` | Insertar estados, modalidades de pago y catálogos base |

### Ruta sugerida

```text
backend/
└── database/
    ├── schema.sql
    ├── seeds/
    │   ├── seed_roles.sql
    │   ├── seed_admin.sql
    │   ├── seed_diplomados.sql
    │   └── seed_catalogos.sql
    └── README.md
```

---

## 8.4 Seeds Obligatorios

Al inicializar producción, deben ejecutarse seeds para cargar:

- Roles base.
- Usuario administrador inicial.
- Catálogos iniciales.
- Los 22 diplomados oficiales.
- Estados académicos.
- Estados de pago.
- Modalidades de pago.
- Entidades facturadoras.

### Seed de diplomados oficiales

El archivo `seed_diplomados.sql` debe cargar los siguientes 22 diplomados:

| Código | Nombre del Diplomado |
|---|---|
| NCD02823v1 | Compliance Empresarial y Blindaje Corporativo |
| NCD03823v2 | Transformación Digital |
| NCD05423v1 | Transformación Digital y Ciencia de Datos |
| NCD05523v1 | Investigación para las Ciencias Sociales |
| NCD01424 | Modelos cuantitativos aplicados a Finanzas y Economía |
| NCD01524 | Marketing Digital, E-Commerce & Social Media |
| NCD05024 | Blockchain, Activos Virtuales y Mercados Financieros |
| NCD08924 | Educación Superior para Ciencias Empresariales |
| NCD09124 | Métodos Cuantitativos para la investigación social |
| NCD01225 | Microfinanzas, Riesgos Financieros y FINTECH |
| NCD10925 | Analítica de Datos |
| NCD11025 | Banca y Gestión Integral de Riesgo |
| NCD04225 | Data Engineering |
| NCD08625 | Finanzas Sostenibles y Gestión de Riesgos |
| NCD09025 | Microfinanzas, Gestión de Riesgos y Fintech |
| NCD11125 | Business Analytics con Power BI |
| NCD11225 | Data Engineering (nueva versión) |
| NCD11325 | Finanzas Cuantitativas con Python |
| NCD11625 | Educación Superior basado en Competencias e Innovación Tecnológica |
| NCD11725 | Gestión del Talento Humano y People Analytics |
| NCD11825 | Innovación Financiera y Business Intelligence |
| NCD11925 | Marketing Digital y Diseño Gráfico |

---

## 9. Modelo de Datos Principal

### 9.1 Entidades mínimas

| Entidad | Responsabilidad |
|---|---|
| `roles` | Define los roles del sistema |
| `usuarios` | Gestiona usuarios autenticados |
| `productos_academicos` | Define cursos, cursos expertos y diplomados |
| `modulos` | Catálogo único de módulos |
| `producto_modulos` | Relación N:M entre productos y módulos |
| `estudiantes` | Datos personales, académicos y laborales |
| `docentes` | Datos de docentes |
| `inscripciones` | Registro de estudiantes en productos |
| `inscripcion_modulos` | Avance académico por módulo |
| `pagos` | Gestión financiera de cuotas y comprobantes |

### 9.2 Relaciones principales

| Relación | Tipo | Descripción |
|---|---|---|
| `roles` → `usuarios` | 1:N | Un rol puede tener varios usuarios |
| `productos_academicos` → `producto_modulos` | 1:N | Un producto puede tener varios slots de módulos |
| `modulos` → `producto_modulos` | 1:N | Un módulo puede reutilizarse en varios productos |
| `productos_academicos` ↔ `modulos` | N:M | Se resuelve mediante `producto_modulos` |
| `estudiantes` → `inscripciones` | 1:N | Un estudiante puede tener varias inscripciones |
| `productos_academicos` → `inscripciones` | 1:N | Un producto puede tener varias inscripciones |
| `inscripciones` → `inscripcion_modulos` | 1:N | Una inscripción tiene varios módulos |
| `producto_modulos` → `inscripcion_modulos` | 1:N | Cada avance referencia un slot específico |
| `docentes` → `inscripcion_modulos` | 1:N | Un docente puede dictar varios módulos inscritos |
| `inscripciones` → `pagos` | 1:N | Una inscripción puede tener varias cuotas |

---

## 10. Autenticación y Sesiones

## 10.1 Regla actual

Para el MVP se utilizarán sesiones PHP.

## 10.2 Reglas para sesiones PHP

- Usar `session_start()` únicamente dentro del flujo controlado de autenticación.
- Regenerar el ID de sesión después del login usando `session_regenerate_id(true)`.
- Usar cookies `HttpOnly`.
- Usar `SameSite=Lax` o `SameSite=Strict` según el flujo.
- Usar `Secure=true` en producción con HTTPS.
- No guardar información sensible completa dentro de la sesión.
- Guardar solo datos mínimos como `user_id`, `rol` y estado autenticado.
- Validar permisos en backend en cada endpoint protegido.
- No confiar solo en validaciones del frontend.

## 10.3 Consideración para futura app mobile

Aunque el MVP use sesiones PHP, el diseño debe permitir migrar a JWT o autenticación basada en tokens en el futuro.

Por eso:

- La lógica de autenticación debe estar encapsulada en `AuthService`.
- Los middlewares deben estar desacoplados.
- El frontend no debe depender de detalles internos de PHP Session.
- Los endpoints deben mantenerse como API REST.
- La respuesta de login debe devolver el usuario autenticado y sus permisos.
- El control de permisos debe estar centralizado.

---

## 11. API REST

## 11.1 Reglas generales

- Todas las respuestas deben ser JSON.
- Todos los endpoints deben usar rutas claras.
- Los nombres de rutas deben estar en plural.
- Las operaciones deben seguir convenciones REST.
- Los errores deben tener formato estándar.
- Los endpoints protegidos deben validar sesión y rol.
- Las validaciones deben ejecutarse antes de llamar al servicio.
- La lógica de negocio debe estar en servicios.
- El acceso a datos debe estar en repositorios.
- La API debe ser consumible por frontend web y futura app mobile.

## 11.2 Convención de endpoints

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/productos-academicos
POST   /api/productos-academicos
GET    /api/productos-academicos/{id}
PATCH  /api/productos-academicos/{id}
DELETE /api/productos-academicos/{id}

GET    /api/estudiantes
POST   /api/estudiantes
GET    /api/estudiantes/{id}
PATCH  /api/estudiantes/{id}

GET    /api/docentes
POST   /api/docentes
GET    /api/docentes/{id}
PATCH  /api/docentes/{id}

GET    /api/inscripciones
POST   /api/inscripciones
GET    /api/inscripciones/{id}

GET    /api/inscripciones/{id}/modulos
PATCH  /api/inscripcion-modulos/{id}/docente

POST   /api/notas
PATCH  /api/notas/{id}

GET    /api/pagos/inscripcion/{inscripcion_id}
POST   /api/pagos/{id}/registrar
PATCH  /api/pagos/{id}
```

---

## 12. Formato Estándar de Respuesta API

### 12.1 Respuesta exitosa

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {}
}
```

### 12.2 Respuesta con error

```json
{
  "success": false,
  "message": "No se pudo completar la operación",
  "errors": {
    "campo": "Mensaje de validación"
  }
}
```

### 12.3 Reglas

- Nunca devolver errores crudos de PHP.
- Nunca devolver stack traces en producción.
- Nunca devolver credenciales o datos sensibles.
- Mantener mensajes entendibles para frontend.
- Registrar errores internos en logs del backend.
- Usar códigos HTTP correctos.

### 12.4 Códigos HTTP recomendados

| Código | Uso |
|---|---|
| 200 | Consulta o actualización correcta |
| 201 | Recurso creado correctamente |
| 400 | Error de validación |
| 401 | Usuario no autenticado |
| 403 | Usuario sin permisos |
| 404 | Recurso no encontrado |
| 409 | Conflicto por duplicidad o regla de negocio |
| 500 | Error interno controlado |

---

## 13. Documentación API con Swagger/OpenAPI

## 13.1 Regla obligatoria

Toda API debe estar documentada con OpenAPI/Swagger.

## 13.2 Implementación sugerida

Usar `zircote/swagger-php` para documentar endpoints usando atributos PHP.

## 13.3 Reglas

Cada endpoint debe tener:

- Método HTTP.
- Ruta.
- Descripción.
- Parámetros.
- Request body.
- Respuestas posibles.
- Códigos HTTP.
- Reglas de autenticación.
- Roles permitidos.
- Ejemplos de payload cuando aplique.

La documentación debe:

- Generarse como `openapi.yaml` o `openapi.json`.
- Actualizarse cuando cambie un endpoint.
- Estar versionada en el repositorio.
- Estar disponible para revisión técnica.
- No exponer credenciales ni datos sensibles.

## 13.4 Comando sugerido

```bash
cd backend
./vendor/bin/openapi src -o ../docs/openapi.yaml
```

---

## 14. Validaciones

## 14.1 Validaciones en frontend

El frontend debe validar para mejorar la experiencia del usuario, pero no debe ser la única capa de validación.

Validaciones frontend:

- Campos obligatorios.
- Formato de correo.
- Números positivos.
- Longitud máxima.
- Selecciones requeridas.
- Validación visual de formularios.
- Mensajes de error claros.
- Prevención de envío si faltan campos obligatorios.

## 14.2 Validaciones en backend

El backend siempre debe validar antes de guardar.

Validaciones backend:

- Campos obligatorios.
- Tipos de datos.
- Rangos numéricos.
- Fechas válidas.
- Correos únicos.
- C.I. único.
- Código de producto único.
- Nota entre 1 y 100.
- Método de pago válido.
- Compromiso de pago obligatorio si el método es cuotas.
- Archivos con MIME permitido.
- Tamaño máximo de archivos.
- Roles autorizados para la operación.
- Existencia de entidades relacionadas antes de insertar.

## 14.3 Nota sobre Zod

Zod es una librería de TypeScript, por lo tanto puede usarse en frontend si se justifica.

Como el backend será PHP, la validación equivalente debe implementarse en PHP mediante validadores propios o una librería PHP liviana y justificada.

No se debe asumir que Zod validará el backend.

---

## 15. Seguridad

## 15.1 Reglas obligatorias

- No exponer claves API en frontend.
- No subir archivos `.env`.
- Usar variables de entorno.
- Validar datos del usuario antes de guardar.
- Usar prepared statements.
- Hashear contraseñas con `password_hash()`.
- Validar contraseñas con `password_verify()`.
- No guardar contraseñas en texto plano.
- No exponer errores internos al usuario.
- Proteger rutas por sesión y rol.
- Validar permisos en backend.
- No confiar solo en el frontend.
- Validar archivos antes de subirlos.
- Limitar tipos permitidos de archivos.
- Limitar tamaño máximo de archivos.
- Usar HTTPS en producción.
- Configurar CORS solo para dominios permitidos.
- Registrar auditoría básica en operaciones críticas.

## 15.2 Seguridad por rol

| Rol | Permisos esperados |
|---|---|
| Admin | Gestión total del sistema |
| Coordinador | Gestión operativa académica y financiera |
| Docente | Acceso a módulos asignados y registro de notas |
| Estudiante | Consulta de progreso académico y estado de pagos propios |

## 15.3 Reglas de acceso

- Solo Admin y Coordinador pueden registrar productos académicos.
- Solo Admin y Coordinador pueden registrar estudiantes.
- Solo Admin y Coordinador pueden crear inscripciones.
- Solo Admin y Coordinador pueden registrar pagos.
- Solo Admin y Coordinador pueden registrar docentes.
- Solo Admin y Coordinador pueden asignar docentes.
- El Docente solo puede ver módulos asignados.
- El Docente solo puede registrar notas de sus módulos asignados.
- El Estudiante solo puede consultar su propio progreso.
- El Estudiante solo puede consultar su propio estado de pagos.
- Solo Admin puede modificar notas ya guardadas.

---

## 16. Manejo de Archivos

## 16.1 Archivos permitidos para comprobantes

| Tipo | Permitido |
|---|---|
| JPG | Sí |
| PNG | Sí |
| PDF | Sí |
| EXE | No |
| ZIP | No |
| JS | No |
| PHP | No |

## 16.2 Reglas

- Validar tipo MIME real del archivo.
- Validar extensión.
- Validar tamaño máximo.
- No guardar archivos ejecutables.
- No permitir subida de archivos PHP.
- Generar nombres internos únicos.
- Guardar la URL o ruta en base de datos.
- No confiar en el nombre original del archivo.
- El nombre original puede guardarse solo como referencia.
- Los comprobantes deben almacenarse en un servicio externo o ruta segura.
- La base de datos debe guardar solo la URL o ruta del archivo.

---

## 17. Reglas de Estilo de Código

## 17.1 Frontend

- Usar TypeScript estricto.
- Preferir componentes pequeños y reutilizables.
- No agregar librerías nuevas sin explicar por qué.
- Seguir los patrones existentes del proyecto.
- Evitar refactors grandes si no son necesarios.
- Usar nombres claros.
- Evitar componentes demasiado largos.
- Separar lógica de API en servicios.
- Separar tipos en archivos `.types.ts`.
- Mantener formularios legibles.
- Mantener estilos consistentes.
- Mantener una estructura simple.

## 17.2 Backend

- Usar PHP 8.4+.
- Mantener clases pequeñas.
- Separar responsabilidades.
- Usar nombres descriptivos.
- Usar Composer y autoload PSR-4.
- Usar estilo PSR-12 cuando sea posible.
- No mezclar HTML con lógica PHP.
- No escribir SQL directamente en controladores.
- No repetir lógica de negocio en varios controladores.
- Crear servicios reutilizables.
- Crear validadores reutilizables.
- Crear helpers solo cuando sean realmente necesarios.
- Mantener endpoints simples.
- Mantener respuestas JSON consistentes.

---

## 18. Diseño y Experiencia de Usuario

## 18.1 Tono visual

La interfaz debe sentirse:

- Limpia.
- Profesional.
- Moderna.
- Simple.
- Ordenada.
- Fácil de usar.

## 18.2 Reglas UX/UI

- Priorizar usabilidad sobre decoración.
- Debe verse bien en móvil y desktop.
- No usar colores demasiado llamativos salvo para acciones importantes.
- Usar botones claros.
- Usar tablas legibles.
- Usar estados visuales para pagos, notas e inscripciones.
- Mostrar mensajes de éxito y error.
- Evitar pantallas saturadas.
- Mantener navegación simple por rol.
- Mostrar únicamente opciones permitidas para el usuario autenticado.
- Usar componentes reutilizables para formularios, tablas, botones, modales y alertas.

## 18.3 Vistas por rol

| Rol | Vista principal recomendada |
|---|---|
| Admin | Dashboard global con métricas, productos, usuarios, pagos, notas e inscripciones |
| Coordinador | Inscripciones recientes, pagos vencidos, estudiantes, docentes y seguimiento académico |
| Docente | Módulos asignados, estudiantes inscritos y registro de notas |
| Estudiante | Progreso académico, notas, módulos completados y estado de pagos |

---

## 19. Ambiente Local con Docker

## 19.1 Objetivo

El proyecto debe incluir un ambiente local con Docker para levantar los tres componentes principales:

- Frontend.
- Backend.
- Base de datos.

## 19.2 Servicios Docker requeridos

| Servicio | Contenedor | Puerto sugerido |
|---|---|---|
| frontend | Node + Vite | 5173 |
| backend | PHP 8.4 + Apache | 8080 |
| database | MariaDB | 3306 |

## 19.3 Archivo requerido

```text
docker-compose.yml
```

## 19.4 Ejemplo base de `docker-compose.yml`

```yaml
services:
  frontend:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    ports:
      - "5173:5173"
    command: sh -c "npm install && npm run dev -- --host 0.0.0.0"
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    working_dir: /var/www/html
    volumes:
      - ./backend:/var/www/html
    ports:
      - "8080:80"
    environment:
      APP_ENV: local
      DB_HOST: database
      DB_PORT: 3306
      DB_DATABASE: sistema_academico
      DB_USERNAME: app_user
      DB_PASSWORD: app_password
    depends_on:
      - database

  database:
    image: mariadb:11
    restart: always
    environment:
      MARIADB_DATABASE: sistema_academico
      MARIADB_USER: app_user
      MARIADB_PASSWORD: app_password
      MARIADB_ROOT_PASSWORD: root_password
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
      - ./backend/database:/docker-entrypoint-initdb.d

volumes:
  db_data:
```

## 19.5 Dockerfile del backend

El contenedor PHP debe instalar extensiones necesarias como `pdo_mysql`.

Archivo:

```text
backend/Dockerfile
```

Contenido sugerido:

```dockerfile
FROM php:8.4-apache

RUN docker-php-ext-install pdo pdo_mysql

RUN a2enmod rewrite

WORKDIR /var/www/html
```

---

## 20. Comandos para Levantar la Aplicación Localmente

## 20.1 Clonar el proyecto

```bash
git clone <repositorio>
cd <nombre-del-proyecto>
```

## 20.2 Crear variables de entorno

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## 20.3 Levantar los servicios

```bash
docker compose up -d --build
```

## 20.4 Ver contenedores activos

```bash
docker compose ps
```

## 20.5 Acceder a la aplicación

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api |
| Base de datos | localhost:3306 |

## 20.6 Ejecutar el script SQL de creación de tablas desde la máquina local

```bash
mysql -h 127.0.0.1 -P 3306 -u app_user -p sistema_academico < backend/database/schema.sql
```

## 20.7 Ejecutar el script SQL dentro del contenedor

```bash
docker compose exec -T database mariadb -u app_user -papp_password sistema_academico < backend/database/schema.sql
```

## 20.8 Ejecutar seeds

```bash
docker compose exec -T database mariadb -u app_user -papp_password sistema_academico < backend/database/seeds/seed_roles.sql
docker compose exec -T database mariadb -u app_user -papp_password sistema_academico < backend/database/seeds/seed_admin.sql
docker compose exec -T database mariadb -u app_user -papp_password sistema_academico < backend/database/seeds/seed_diplomados.sql
docker compose exec -T database mariadb -u app_user -papp_password sistema_academico < backend/database/seeds/seed_catalogos.sql
```

## 20.9 Ejecutar tests backend

```bash
docker compose exec backend ./vendor/bin/phpunit
```

## 20.10 Generar documentación Swagger/OpenAPI

```bash
docker compose exec backend ./vendor/bin/openapi src -o docs/openapi.yaml
```

## 20.11 Detener servicios

```bash
docker compose down
```

## 20.12 Eliminar volumen de base de datos local

```bash
docker compose down -v
```

---

## 21. Variables de Entorno

## 21.1 Backend `.env.example`

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8080

DB_HOST=database
DB_PORT=3306
DB_DATABASE=sistema_academico
DB_USERNAME=app_user
DB_PASSWORD=app_password

SESSION_NAME=sistema_academico_session
SESSION_SECURE=false
SESSION_SAMESITE=Lax

UPLOAD_MAX_SIZE_MB=5
```

## 21.2 Frontend `.env.example`

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## 21.3 Reglas

- El archivo `.env` no debe subirse al repositorio.
- Solo se debe subir `.env.example`.
- Toda credencial debe ir en variables de entorno.
- El frontend solo debe tener variables públicas necesarias.
- Ninguna clave privada debe existir en frontend.
- Las variables `VITE_*` son visibles en el build del frontend; no deben contener secretos.

---

## 22. Testing

## 22.1 Tests unitarios mínimos del backend

Se deben crear pruebas unitarias para las reglas críticas.

| Servicio | Prueba mínima |
|---|---|
| ProductoAcademicoService | Calcula cantidad de módulos según tipo de producto |
| ProductoAcademicoService | Genera código de slot correctamente |
| ProductoAcademicoService | Rechaza módulos duplicados dentro del mismo producto |
| NotaService | Nota mayor o igual a 60 genera estado APROBADO |
| NotaService | Nota menor a 60 genera estado REPROBADO |
| NotaService | Nota fuera de 1 a 100 genera error |
| ConvalidacionService | Detecta módulo aprobado previamente |
| ConvalidacionService | No convalida módulo reprobado |
| PagoService | Marca cuota vencida si fecha vencimiento menor a hoy |
| PagoService | No marca como vencida una cuota pagada |
| AuthService | Valida contraseña usando `password_verify()` |
| RoleMiddleware | Bloquea acceso cuando el rol no tiene permiso |

## 22.2 Tests básicos de frontend

El frontend debe probar al menos:

- Renderizado de formulario de login.
- Renderizado de formulario de estudiante.
- Validación visual de campos obligatorios.
- Renderizado de tabla de productos.
- Renderizado de vista según rol.

## 22.3 Regla de testing

No se debe considerar completa una funcionalidad crítica sin prueba básica de su regla principal.

---

## 23. Documentación del Proyecto

El proyecto debe incluir un archivo `README.md` en la raíz.

## 23.1 El README debe explicar

- Qué hace la aplicación.
- Qué tecnologías usa.
- Cómo levantar el ambiente local.
- Cómo configurar variables de entorno.
- Cómo ejecutar el script `schema.sql`.
- Cómo ejecutar seeds.
- Cómo correr tests.
- Cómo generar documentación Swagger.
- Cómo compilar frontend.
- Cómo desplegar en Hostinger.

## 23.2 Estructura sugerida

```text
README.md
├── Descripción del proyecto
├── Arquitectura
├── Tecnologías
├── Requisitos locales
├── Instalación
├── Variables de entorno
├── Comandos Docker
├── Script SQL schema.sql
├── Seeds
├── Tests
├── Swagger / OpenAPI
├── Build de frontend
└── Despliegue en Hostinger
```

---

## 24. Despliegue en Hostinger

## 24.1 Backend

El backend debe desplegarse como aplicación PHP.

Reglas:

- Exponer únicamente `public/index.php`.
- Mantener código fuente fuera del directorio público cuando sea posible.
- No subir `.env` al repositorio.
- Configurar `.env` manualmente en producción.
- Ejecutar `composer install --no-dev --optimize-autoloader`.
- Desactivar `APP_DEBUG` en producción.
- Configurar PHP 8.4 o superior en el hosting.
- Configurar conexión a MySQL/MariaDB desde el panel del hosting.
- Verificar que `pdo_mysql` esté disponible.
- Configurar `.htaccess` para redirigir rutas al front controller.
- Ejecutar `schema.sql` desde phpMyAdmin, MySQL CLI o herramienta equivalente.
- Ejecutar los seeds iniciales autorizados.

## 24.2 Frontend

El frontend debe compilarse antes del despliegue.

Comando:

```bash
cd frontend
npm install
npm run build
```

El resultado de `dist/` debe subirse al hosting como archivos estáticos.

## 24.3 Opción de despliegue recomendada

| Elemento | Ubicación sugerida |
|---|---|
| Frontend compilado | `public_html/` |
| Backend API | `public_html/api/` o subdominio `api.dominio.com` |
| Base de datos | MySQL/MariaDB administrada desde el panel del hosting |
| Archivos sensibles | Fuera de carpeta pública o protegidos |

## 24.4 Alternativa recomendada con subdominios

```text
app.dominio.com  -> Frontend
api.dominio.com  -> Backend
```

Si no se usará subdominio:

```text
dominio.com      -> Frontend
dominio.com/api  -> Backend
```

---

## 25. Reglas para el Asistente de Desarrollo con IA

El asistente de IA debe seguir estas reglas al modificar el proyecto:

- Antes de editar, revisar la estructura del proyecto.
- Hacer cambios pequeños y explicables.
- No modificar archivos que no sean necesarios.
- No hacer refactors grandes sin justificación.
- No agregar librerías nuevas sin explicar el motivo.
- Mantener la arquitectura frontend/backend separada.
- Mantener compatibilidad con PHP 8.4+.
- Mantener compatibilidad con MariaDB/MySQL.
- Mantener compatibilidad con Hostinger.
- No romper rutas existentes.
- No eliminar lógica existente sin explicar.
- Si encuentra algo riesgoso, debe advertirlo.
- Al terminar, debe indicar qué archivos cambió.
- Al terminar, debe indicar cómo probar los cambios.
- Al terminar, debe indicar si hay migraciones o seeds nuevos.
- Al terminar, debe indicar si se actualizó `schema.sql`.
- Al terminar, debe indicar si se debe actualizar Swagger.
- Al terminar, debe indicar si se agregaron tests.
- Al terminar, debe indicar comandos ejecutados o comandos sugeridos para validar.

---

## 26. Definición de Terminado

Una tarea se considera terminada cuando:

- El código compila.
- No hay errores de TypeScript.
- No hay errores de lint si el proyecto tiene lint configurado.
- La funcionalidad fue probada manualmente.
- Se mantiene responsive.
- No rompe funcionalidades existentes.
- Los endpoints nuevos están documentados en Swagger.
- Las validaciones existen en backend.
- Las reglas críticas tienen tests básicos.
- Las variables sensibles no están hardcodeadas.
- No se agregó una librería nueva sin justificación.
- Se documentó cómo probar la funcionalidad.
- Se indicó qué archivos fueron modificados.
- Se actualizó `schema.sql` si hubo cambios de base de datos.
- Se actualizó el seed correspondiente si hubo cambios de datos iniciales.

---

## 27. Librerías Permitidas con Justificación

## 27.1 Backend

| Librería | Uso | Justificación |
|---|---|---|
| `slim/slim` | API REST | Framework liviano para rutas y middlewares |
| `slim/psr7` | Request/Response PSR-7 | Necesario para Slim |
| `zircote/swagger-php` | OpenAPI/Swagger | Documentar API desde PHP |
| `phpunit/phpunit` | Testing | Tests unitarios backend |

## 27.2 Frontend

| Librería | Uso | Justificación |
|---|---|---|
| `react` | UI | Base del frontend |
| `react-dom` | Renderizado | Base del frontend |
| `vite` | Build/dev server | Compilación rápida |
| `typescript` | Tipado estricto | Calidad y mantenibilidad |

## 27.3 Regla

Cualquier librería adicional debe ser explicada antes de agregarse.

La explicación debe indicar:

- Qué problema resuelve.
- Por qué no se resuelve con código propio simple.
- Impacto en mantenimiento.
- Impacto en tamaño del frontend o complejidad del backend.
- Compatibilidad con el stack definido.

---

## 28. Reglas Técnicas Prioritarias

| Código | Regla |
|---|---|
| RT-01 | Separar frontend, backend y base de datos |
| RT-02 | Backend obligatorio en PHP 8.4 o superior |
| RT-03 | API REST compatible con futura app mobile |
| RT-04 | Base de datos MariaDB/MySQL compatible con Hostinger |
| RT-05 | Frontend en React + TypeScript estricto |
| RT-06 | Frontend debe compilar a HTML, JS y CSS |
| RT-07 | Usar componentes reutilizables |
| RT-08 | Usar servicios reutilizables en backend |
| RT-09 | Usar sesiones PHP para MVP, encapsuladas para futura migración |
| RT-10 | Documentar API con Swagger/OpenAPI |
| RT-11 | Usar Docker local con frontend, backend y base de datos |
| RT-12 | Crear tests unitarios básicos para reglas principales |
| RT-13 | No exponer credenciales |
| RT-14 | No subir `.env` |
| RT-15 | Mantener código simple y entendible |
| RT-16 | La creación de tablas debe estar definida en `backend/database/schema.sql` |
| RT-17 | Separar scripts de estructura y datos iniciales |
| RT-18 | No agregar librerías sin justificación |
| RT-19 | Mantener compatibilidad de despliegue con hosting tradicional |
| RT-20 | Toda funcionalidad crítica debe validarse en backend |

### RT-21 Modales y Acciones CRUD

La interfaz debe priorizar tablas operativas con acciones por fila y formularios en modales para creación y edición de registros. Las acciones destructivas deben ejecutarse como desactivación lógica cuando correspondan a datos académicos, financieros o administrativos críticos.

### RT-22 Módulos Dinámicos En Productos Académicos

Aunque el tipo de producto puede sugerir una cantidad esperada de módulos, la interfaz debe permitir agregar módulos dinámicamente después de registrar el producto. La base de datos no debe limitar `producto_modulos.numero_modulo` a un máximo fijo.

---

## 29. Reglas Técnicas de Base de Datos Críticas

| Código | Regla | Implementación sugerida |
|---|---|---|
| DB-01 | Crear tablas desde archivo SQL | Usar `backend/database/schema.sql` |
| DB-02 | Separar estructura y seeds | No mezclar inserts iniciales dentro de `schema.sql` |
| DB-03 | Evitar duplicados | Usar restricciones `UNIQUE` |
| DB-04 | Mantener integridad referencial | Usar claves foráneas |
| DB-05 | Usar InnoDB | Todas las tablas deben usar `ENGINE=InnoDB` |
| DB-06 | Usar UTF-8 completo | Todas las tablas deben usar `utf8mb4` |
| DB-07 | Mantener auditoría | Incluir `created_at`, `updated_at` y campos de usuario cuando corresponda |
| DB-08 | Permitir despliegue manual | `schema.sql` debe poder ejecutarse en phpMyAdmin |
| DB-09 | Evitar datos sensibles | No incluir contraseñas reales en scripts versionados |
| DB-10 | Mantener orden lógico | Crear tablas respetando dependencias |

---

## 30. Consideraciones Finales

### 30.1 Seguridad

- Todas las rutas protegidas deben validar sesión o autenticación.
- El middleware de roles debe verificar permisos antes de ejecutar cualquier lógica de negocio.
- Las contraseñas deben almacenarse hasheadas usando `password_hash()`.
- Los archivos de comprobante deben validarse por tipo MIME y tamaño antes de subirse.
- Nunca exponer credenciales dentro del repositorio.
- Nunca exponer variables sensibles en frontend.
- Las operaciones críticas deben registrar auditoría básica.

### 30.2 Validaciones generales

- El C.I. del estudiante debe ser único en el sistema.
- El correo del estudiante debe ser único.
- El correo del docente debe ser único.
- Las notas deben estar estrictamente entre 1 y 100.
- Los códigos de producto deben seguir el formato esperado.
- Los campos obligatorios no deben aceptar valores vacíos.
- Los montos de pago deben ser mayores a cero.
- Los estados deben manejarse mediante valores controlados.

### 30.3 Experiencia por rol

| Rol | Vista principal recomendada |
|---|---|
| Admin | Dashboard con métricas globales: inscripciones activas, pagos vencidos, módulos pendientes de nota, productos activos, docentes registrados y estudiantes activos |
| Coordinador | Lista de inscripciones recientes, alertas de pagos vencidos, estudiantes sin docente asignado, pagos pendientes de facturación y módulos pendientes de seguimiento |
| Docente | Lista de módulos asignados, acceso al módulo y lista de estudiantes con campo de nota |
| Estudiante | Mi progreso académico: módulos completados, módulos pendientes, notas obtenidas, estado de pagos y próximas fechas de vencimiento |

---

## 31. Resultado Esperado del Proyecto

Al finalizar la implementación base, el proyecto debe contar con:

- Frontend en React + TypeScript.
- Backend en PHP 8.4+ con API REST.
- Base de datos MariaDB/MySQL.
- Archivo `schema.sql` para crear tablas.
- Seeds para datos iniciales.
- Docker Compose para levantar frontend, backend y base de datos.
- Autenticación con sesiones PHP.
- Control de acceso por rol.
- Validaciones en frontend y backend.
- Swagger/OpenAPI para documentar endpoints.
- Tests unitarios básicos.
- README técnico con comandos de instalación, ejecución y despliegue.
- Código simple, modular y preparado para futura app mobile.


### 11.4 Recomendaciones Técnicas Finales

- Separar claramente las responsabilidades entre frontend, backend y base de datos.
- Mantener la lógica de negocio crítica en el backend.
- Usar transacciones para operaciones compuestas como creación de producto académico, inscripción y generación de pagos.
- Registrar auditoría básica en operaciones importantes como creación de inscripción, registro de pago y modificación de notas.
- Evitar eliminar registros críticos; preferir desactivación lógica mediante campos como `activo` o `estado`.
- Mantener catálogos controlados para tipos de producto, estados, roles, modalidades de pago y entidades facturadoras.
- Documentar endpoints, payloads y reglas de validación para facilitar el desarrollo asistido por IA.
