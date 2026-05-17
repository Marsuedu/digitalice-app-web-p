# Como Levantar La Plataforma DIGITALICE

Este documento explica como ejecutar la plataforma en local usando Docker y como preparar un despliegue productivo en Hostinger o hosting PHP tradicional.

## 1. Requisitos Locales

- Docker Desktop instalado.
- Git instalado.
- Puertos libres:
  - `5173` para frontend.
  - `8080` para backend.
  - `3306` para MariaDB.

## 2. Estructura Del Proyecto

```text
digitalice-app-web/
├── frontend/              # React + TypeScript + Vite
├── backend/               # PHP 8.4 + Slim Framework
├── backend/database/      # schema.sql y seeds
├── docker-compose.yml
└── docs/
```

## 3. Variables De Entorno

Crear archivos locales desde los ejemplos:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Valores locales principales:

```env
VITE_API_BASE_URL=http://localhost:8080/api
DB_HOST=database
DB_DATABASE=digitalice
DB_USERNAME=app_user
DB_PASSWORD=app_password
```

No subir archivos `.env` al repositorio.

## 4. Levantar Local Con Docker

Desde la raiz del proyecto:

```bash
docker compose up -d --build
```

Verificar contenedores:

```bash
docker compose ps
```

Accesos:

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api |
| Health check | http://localhost:8080/api/health |
| Swagger UI | http://localhost:8081 |
| MariaDB | localhost:3306 |

Usuario inicial:

```text
Correo: admin@digitalice.local
Password: Admin123!
```

## 5. Base De Datos Local

Docker ejecuta `backend/database/00_init.sql` al crear el volumen por primera vez. Ese archivo carga:

1. `schema.sql`
2. `seed_roles.sql`
3. `seed_admin.sql`
4. `seed_catalogos.sql`
5. `seed_diplomados.sql`

Nota: el seed de diplomados crea cinco slots iniciales por diplomado con nombres base. Antes de produccion real conviene reemplazarlos por los nombres oficiales de modulos entregados por DIGITALICE.

Si necesitas reiniciar la base desde cero:

```bash
docker compose down -v
docker compose up -d --build
```

Si ya tenias la base creada y solo necesitas aplicar el cambio de módulos dinámicos:

```bash
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/migrations/20260517_dynamic_product_modules.sql
```

Si ya tenias la base creada y necesitas agregar campos de comprobante a pagos:

```bash
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/migrations/20260517_payment_receipt_fields.sql
```

El campo de vencimiento de cada cuota ya existe desde el schema base como `pagos.fecha_vencimiento`; no requiere migración adicional.

Si ya tenias la base creada y necesitas agregar eliminación lógica de pagos:

```bash
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/migrations/20260517_soft_delete_payments.sql
```

Si ya tenias la base creada y necesitas agregar eliminación lógica de inscripciones:

```bash
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/migrations/20260517_soft_delete_enrollments.sql
```

Si ya tenias la base creada y necesitas relacionar docentes por módulo de producto:

```bash
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/migrations/20260517_product_module_teacher.sql
```

Si ya tenias la base creada y necesitas agregar estados de producto (`Por iniciar`, `Activo`, `Finalizado`):

```bash
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/migrations/20260517_product_status.sql
```

Si ya tenias la base creada y necesitas permitir eliminación lógica de módulos de producto sin romper inscripciones históricas:

```bash
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/migrations/20260517_soft_delete_product_modules.sql
```

Si ya tenias la base creada y necesitas guardar monto base, descuento y total de inscripción:

```bash
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/migrations/20260517_enrollment_discount.sql
```

Ejecutar manualmente el schema:

```bash
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/schema.sql
```

Ejecutar seeds manualmente:

```bash
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/seeds/seed_roles.sql
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/seeds/seed_admin.sql
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/seeds/seed_catalogos.sql
docker compose exec -T database mariadb -u app_user -papp_password digitalice < backend/database/seeds/seed_diplomados.sql
```

## 6. Comandos De Desarrollo

Frontend dentro del contenedor:

```bash
docker compose exec frontend npm run build
```

Backend:

```bash
docker compose exec backend composer dump-autoload
```

Tests backend, cuando se agreguen pruebas:

```bash
docker compose exec backend ./vendor/bin/phpunit
```

Generar OpenAPI, cuando los endpoints tengan anotaciones:

```bash
docker compose exec backend ./vendor/bin/openapi src -o docs/openapi.yaml
```

Ver Swagger UI:

```text
http://localhost:8081
```

## 7. Preparar Produccion En Hostinger

La guia productiva completa esta en [DESPLIEGUE_HOSTINGER.md](DESPLIEGUE_HOSTINGER.md).

Resumen recomendado:

### Backend

1. Crear una base de datos MySQL/MariaDB desde el panel de Hostinger.
2. Ejecutar `backend/database/schema.sql` desde phpMyAdmin.
3. Ejecutar seeds autorizados:
   - `seed_roles.sql`
   - `seed_admin.sql`
   - `seed_catalogos.sql`
   - `seed_diplomados.sql`
4. Subir el contenido de `backend/` al servidor.
5. Configurar el document root hacia `backend/public/` si el plan lo permite. El archivo `backend/public/.htaccess` ya redirige las rutas de Slim hacia `index.php`.
6. Si el hosting exige usar `public_html/api`, colocar `public/index.php` como front controller y mantener el resto del backend fuera de la carpeta publica cuando sea posible.
7. Crear manualmente `backend/.env` en el servidor con credenciales reales.
8. Ejecutar:

```bash
composer install --no-dev --optimize-autoloader
```

9. Verificar que PHP sea `8.4+` y que `pdo_mysql` este habilitado.
10. Cambiar la clave del usuario administrador inicial.
11. Configurar HTTPS.

Variables productivas recomendadas:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.tudominio.com
FRONTEND_URL=https://app.tudominio.com

DB_HOST=host_real
DB_PORT=3306
DB_DATABASE=base_real
DB_USERNAME=usuario_real
DB_PASSWORD=password_real

SESSION_SECURE=true
SESSION_SAMESITE=Lax
```

### Frontend

1. Configurar `frontend/.env`:

```env
VITE_API_BASE_URL=https://api.tudominio.com/api
```

2. Compilar localmente o en un entorno CI:

```bash
cd frontend
npm install
npm run build
```

3. Subir el contenido de `frontend/dist/` a `public_html/`, `app.tudominio.com` o la carpeta publica elegida.

## 8. Opcion Recomendada De Dominios

```text
app.tudominio.com  -> frontend compilado
api.tudominio.com  -> backend PHP/Slim
```

Alternativa:

```text
tudominio.com      -> frontend compilado
tudominio.com/api  -> backend PHP/Slim
```

## 9. Reglas De Seguridad Antes De Usar Datos Reales

- Cambiar la clave del usuario `admin@digitalice.local`.
- No subir `.env`.
- Usar HTTPS.
- Mantener `APP_DEBUG=false` en produccion.
- Validar que el backend no exponga carpetas internas como `src/`, `vendor/` o `database/`.
- Revisar CORS para permitir solo el dominio real del frontend.
- Guardar comprobantes en almacenamiento externo o ruta segura.
- No guardar archivos ejecutables.
