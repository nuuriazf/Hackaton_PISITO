# Backend (Spring Boot)

## Requisitos

- Java 21+
- Maven 3.9+

## Arranque

```bash
mvn spring-boot:run
```

## Arranque con Supabase (Postgres)

PowerShell ejemplo:

```powershell
$env:DB_URL="jdbc:postgresql://aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
$env:DB_USERNAME="postgres.<tu_project_ref>"
$env:DB_PASSWORD="<tu_password>"
$env:DB_DRIVER_CLASS="org.postgresql.Driver"
$env:SQL_INIT_MODE="never"
$env:H2_CONSOLE_ENABLED="false"
mvn spring-boot:run
```

API en `http://localhost:8080`

H2 console en `http://localhost:8080/h2-console`

Auth:
- `POST /api/auth/register` y `POST /api/auth/login` son publicos.
- El resto de `/api/**` requiere `Authorization: Bearer <jwt>`.
- Las `entries/resources` quedan aisladas por usuario autenticado.

## Endpoints principales

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (requiere `Authorization: Bearer <token>`)
- `PUT /api/auth/me/username` (requiere token)
- `PUT /api/auth/me/password` (requiere token)
- `GET /api/entries`
- `GET /api/entries/{entryId}`
- `POST /api/entries` (acepta `title` y opcional `resources[]`)
- `PUT /api/entries/{entryId}`
- `POST /api/entries/{entryId}/resources/text`
- `POST /api/entries/{entryId}/resources/link`
- `POST /api/entries/{entryId}/resources/media`
- `DELETE /api/entries/{entryId}/resources/{resourceId}`
- `DELETE /api/entries/{entryId}`

## Tests

```bash
mvn test
```


