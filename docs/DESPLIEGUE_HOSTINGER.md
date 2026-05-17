# Despliegue En Produccion - Hostinger

Esta guia resume los pasos recomendados para publicar DIGITALICE en Hostinger usando frontend estatico, backend PHP/Slim y MySQL/MariaDB.

## 1. Arquitectura Recomendada

Usar dos subdominios:

```text
app.tudominio.com  -> frontend React compilado
api.tudominio.com  -> backend PHP/Slim
```

Esta separacion simplifica CORS, cookies, seguridad y mantenimiento.

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
