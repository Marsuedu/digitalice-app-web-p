# Base de datos

Ejecutar primero `schema.sql` y luego los seeds en este orden:

1. `seeds/seed_roles.sql`
2. `seeds/seed_admin.sql`
3. `seeds/seed_catalogos.sql`
4. `seeds/seed_diplomados.sql`

El seed de diplomados crea cinco slots iniciales por diplomado con nombres base como `Modulo 1 - NCD10925`. Cuando DIGITALICE tenga el listado oficial de nombres de modulos, se debe reemplazar este seed antes de cargar produccion real.

Usuario inicial:

- Correo: `admin@digitalice.local`
- Password: `Admin123!`

Cambiar esta clave antes de usar el sistema con datos reales.
