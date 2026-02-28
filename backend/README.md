# Backend (Spring Boot)

## Requisitos

- Java 21+
- Maven 3.9+

## Arranque

```bash
mvn spring-boot:run
```

API en `http://localhost:8080`

Configuracion de base de datos (Supabase/Postgres) en `src/main/resources/application.yml`.
Se recomienda configurar credenciales por variables de entorno:

- `SUPABASE_DB_URL`
- `SUPABASE_DB_USER`
- `SUPABASE_DB_PASSWORD`
- `SPOTIFY_CLIENT_ID` (opcional, para buscar canciones reales en Spotify API)
- `SPOTIFY_CLIENT_SECRET` (opcional)

Ejemplo para Supabase (Session Pooler):

```powershell
$env:SUPABASE_DB_URL="jdbc:postgresql://aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
$env:SUPABASE_DB_USER="postgres.<tu_project_ref>"
$env:SUPABASE_DB_PASSWORD="<tu_password>"
mvn spring-boot:run
```

No subas credenciales reales al repositorio. Si una password ya se expuso, rotala en Supabase.

Si no configuras credenciales de Spotify, el backend igual guarda un link de busqueda en Spotify cuando detecta "cancion/canción" en el contenido de una nota.

## Endpoints principales

- `GET /api/health`
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

Los tests no deben depender de Supabase. Si anades tests de integracion, usa un perfil/configuracion de test aislado.


