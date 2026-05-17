# DIGITALICE App Web

Plataforma web EdTech para gestionar productos academicos, estudiantes, docentes, inscripciones, convalidaciones, notas y pagos.

## Arquitectura

El proyecto esta separado en tres capas:

- `frontend/`: React + TypeScript + Vite.
- `backend/`: PHP 8.4 + Slim Framework 4 + PDO.
- `backend/database/`: schema SQL y seeds para MariaDB/MySQL.

## Arranque Rapido

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d --build
```

URLs locales:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Health check: http://localhost:8080/api/health
- Swagger UI: http://localhost:8081

Usuario inicial:

- Correo: `admin@digitalice.local`
- Password: `Admin123!`

Cambiar la clave antes de usar datos reales.

## Documentacion

Ver:

- [docs/LEVANTAR_PLATAFORMA.md](docs/LEVANTAR_PLATAFORMA.md) para instrucciones locales con Docker.
- [docs/DESPLIEGUE_HOSTINGER.md](docs/DESPLIEGUE_HOSTINGER.md) para despliegue productivo en Hostinger.
