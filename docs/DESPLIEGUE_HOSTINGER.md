# Despliegue En Produccion - Hostinger

Esta guia resume los pasos recomendados para publicar DIGITALICE en Hostinger usando frontend estatico, backend PHP/Slim y MySQL/MariaDB.

## 1. Arquitectura Recomendada

Usar dos subdominios:

```text
app.tudominio.com  -> frontend React compilado
api.tudominio.com  -> backend PHP/Slim
```

Esta separacion simplifica CORS, cookies, seguridad y mantenimiento.

Tambien se puede usar un solo dominio:

```text
https://digitalice.atokongo.com      -> frontend React compilado
https://digitalice.atokongo.com/api  -> backend PHP/Slim
```

Para tu ruta actual de Hostinger:

```text
Document root publico:
/home/u349685578/domains/atokongo.com/public_html/digitalice
```

La recomendacion es clonar el repositorio fuera de `public_html` para no exponer codigo interno:

```bash
cd /home/u349685578/domains/atokongo.com
git clone https://github.com/juansalinasponce/digitalice-app-web.git digitalice-app-web
```

Luego publicar solo archivos publicos:

```text
/home/u349685578/domains/atokongo.com/public_html/digitalice/      -> contenido de frontend/dist
/home/u349685578/domains/atokongo.com/public_html/digitalice/api/  -> front controller PHP de la API
/home/u349685578/domains/atokongo.com/digitalice-app-web/backend/  -> backend privado
```

Si Hostinger solo te permite clonar dentro de:

```text
/home/u349685578/domains/atokongo.com/public_html/digitalice
```

no dejes el repositorio completo como sitio publico. Usa esa ruta solo temporalmente para clonar/compilar o protege carpetas internas con `.htaccess`. Lo mas seguro es mantener `backend/`, `.env`, `database/`, `src/` y `vendor/` fuera de la carpeta publica.

## 2. Cambios Antes De Produccion

1. Crear variables reales desde los ejemplos:

```bash
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production
```

2. Cambiar dominios:

```env
APP_URL=https://api.tudominio.com
FRONTEND_URL=https://app.tudominio.com
VITE_API_BASE_URL=https://api.tudominio.com/api
```

3. Cambiar credenciales de base de datos por las credenciales de Hostinger.
4. Mantener `APP_DEBUG=false`.
5. Mantener `SESSION_SECURE=true`.
6. Usar HTTPS obligatorio.
7. Cambiar la clave del usuario administrador inicial.

Si frontend y API quedan en dominios o subdominios distintos, usar:

```env
SESSION_SAMESITE=None
SESSION_SECURE=true
```

Si quedan bajo el mismo dominio, por ejemplo `tudominio.com` y `tudominio.com/api`, puede usarse:

```env
SESSION_SAMESITE=Lax
SESSION_SECURE=true
```

Para tu caso con un solo dominio:

```env
APP_URL=https://digitalice.atokongo.com
FRONTEND_URL=https://digitalice.atokongo.com
SESSION_SAMESITE=Lax
SESSION_SECURE=true
```

Y en frontend:

```env
VITE_API_BASE_URL=https://digitalice.atokongo.com/api
VITE_BASE_PATH=/
```

Si en vez del subdominio usaras `https://atokongo.com/digitalice`, entonces `VITE_BASE_PATH` debe ser:

```env
VITE_BASE_PATH=/digitalice/
```

## 3. Base De Datos

1. En hPanel, crear una base MySQL.
2. Guardar:
   - Host
   - Nombre de base
   - Usuario
   - Password
3. En phpMyAdmin ejecutar en este orden:

```text
backend/database/schema.sql
backend/database/seeds/seed_roles.sql
backend/database/seeds/seed_admin.sql
backend/database/seeds/seed_catalogos.sql
backend/database/seeds/seed_diplomados.sql
```

Si la base ya existia, aplicar tambien las migraciones en orden:

```text
backend/database/migrations/20260517_dynamic_product_modules.sql
backend/database/migrations/20260517_payment_receipt_fields.sql
backend/database/migrations/20260517_soft_delete_payments.sql
backend/database/migrations/20260517_soft_delete_enrollments.sql
backend/database/migrations/20260517_product_module_teacher.sql
backend/database/migrations/20260517_product_status.sql
backend/database/migrations/20260517_soft_delete_product_modules.sql
backend/database/migrations/20260517_enrollment_discount.sql
```

## 4. Frontend

En tu maquina local:

```bash
cd frontend
npm install
npm run build
```

Subir el contenido de:

```text
frontend/dist/
```

a la carpeta publica de `app.tudominio.com`, normalmente:

```text
public_html/
```

No subir `frontend/node_modules`.

## 5. Backend

Opcion recomendada:

1. Subir la carpeta `backend/` a una ruta privada o a la carpeta asignada al subdominio API.
2. Configurar el document root del subdominio `api.tudominio.com` hacia:

```text
backend/public/
```

3. Crear `backend/.env` en el servidor con datos reales.
4. Entrar por SSH y ejecutar:

```bash
cd backend
composer install --no-dev --optimize-autoloader
```

5. Verificar:

```text
https://api.tudominio.com/api/health
```

Si Hostinger no permite apuntar el document root a `backend/public`, crea un subdominio exclusivo para API y evita exponer carpetas internas como `src`, `database`, `vendor` y `.env`.

## 5.1. Opcion Un Solo Dominio: `digitalice.atokongo.com/api`

Estructura recomendada:

```text
/home/u349685578/domains/atokongo.com/digitalice-app-web
├── backend
└── frontend

/home/u349685578/domains/atokongo.com/public_html/digitalice
├── index.html
├── assets/
└── api/
    ├── index.php
    └── .htaccess
```

Compilar frontend:

```bash
cd /home/u349685578/domains/atokongo.com/digitalice-app-web/frontend
npm install
VITE_API_BASE_URL=https://digitalice.atokongo.com/api VITE_BASE_PATH=/ npm run build
```

Copiar frontend compilado:

```bash
cp -R dist/* /home/u349685578/domains/atokongo.com/public_html/digitalice/
```

Crear `/home/u349685578/domains/atokongo.com/public_html/digitalice/.htaccess`:

```apache
RewriteEngine On

RewriteCond %{REQUEST_URI} !^/api
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

Crear carpeta API publica:

```bash
mkdir -p /home/u349685578/domains/atokongo.com/public_html/digitalice/api
```

Crear `/home/u349685578/domains/atokongo.com/public_html/digitalice/api/.htaccess`:

```apache
RewriteEngine On

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

Crear `/home/u349685578/domains/atokongo.com/public_html/digitalice/api/index.php` apuntando al backend privado:

```php
<?php

declare(strict_types=1);

use DigitalIce\Config\AppConfig;
use DigitalIce\Middlewares\CorsMiddleware;
use DigitalIce\Middlewares\JsonBodyMiddleware;
use Slim\Factory\AppFactory;

$backendRoot = '/home/u349685578/domains/atokongo.com/digitalice-app-web/backend';

require $backendRoot . '/vendor/autoload.php';

AppConfig::loadEnv($backendRoot . '/.env');
AppConfig::startSession();

$app = AppFactory::create();
$app->addRoutingMiddleware();
$app->add(new CorsMiddleware());
$app->add(new JsonBodyMiddleware());
$app->addErrorMiddleware(AppConfig::debug(), true, true);

(require $backendRoot . '/src/routes.php')($app);

$app->run();
```

Instalar dependencias backend:

```bash
cd /home/u349685578/domains/atokongo.com/digitalice-app-web/backend
composer install --no-dev --optimize-autoloader
```

Probar:

```text
https://digitalice.atokongo.com/api/health
```

## 6. Despliegue Con Git En Hostinger

En hPanel:

1. Ir a **Websites / Sitios**.
2. Entrar a **Manage / Administrar** del dominio.
3. Buscar **Git**.
4. Crear repositorio con:

```text
Repositorio: https://github.com/juansalinasponce/digitalice-app-web.git
Rama: main
Install path: vacio si va directo a public_html, o carpeta especifica si sera una ruta privada
```

Notas:

- La carpeta de destino debe estar vacia antes del primer deploy.
- Si el repositorio es privado, configurar llave SSH de Hostinger en GitHub.
- Para este proyecto, despues del deploy por Git igual debes compilar el frontend o subir `frontend/dist`.
- Si Hostinger ejecuta Composer automaticamente, revisar el log; si no, ejecutarlo por SSH dentro de `backend`.

## 7. Checklist Final

- `APP_DEBUG=false`.
- `.env` creado solo en servidor, no en GitHub.
- HTTPS activo.
- `FRONTEND_URL` coincide con el dominio real del frontend.
- `VITE_API_BASE_URL` apunta a `/api` del backend real.
- Usuario administrador inicial con password cambiado.
- Endpoint `/api/health` responde correctamente.
- Login probado con cookies habilitadas.
- CRUD de productos, inscripciones, pagos y notas probado.
