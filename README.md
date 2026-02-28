# Hackaton_PISITO

Monorepo para una web movil (responsive) con:

- `frontend/`: React + TypeScript (Vite)
- `backend/`: Java Spring Boot + H2 (sin Docker)
- `docs/`: contrato de API y notas
- `shared/`: tipos compartidos opcionales

MVP actual orientado a guardar y visualizar:

- texto
- links
- media local (imagenes y video por path/storage)

## Estructura

```text
Hackaton_PISITO/
|- backend/
|- frontend/
|- docs/
|- shared/
|- .gitignore
|- .editorconfig
`- README.md
```

## Requisitos

- Node.js 20+ (`node -v`)
- npm 10+ (`npm -v`)
- Java 21+ (`java -version`)
- Maven 3.9+ (`mvn -v`)

## Comandos para arrancar

Para ejecutar front + back en local:

Terminal 1 (backend):

```powershell
cd C:\Users\adrir\OneDrive\Desktop\proyectosGit\Hackaton_PISITO\backend
mvn spring-boot:run
```

Terminal 2 (frontend):

```powershell
cd C:\Users\adrir\OneDrive\Desktop\proyectosGit\Hackaton_PISITO\frontend
npm install
npm run dev
```

Abrir:

- Front: `http://localhost:5173`
- Back: `http://localhost:8080`
- Health check: `http://localhost:8080/api/health`
- H2 console: `http://localhost:8080/h2-console`

## Comunicacion Front-Back (plantilla base)

Modelo backend:

- `Entry` (titulo + lista de recursos)
- `Resource` (clase padre)
- Herencia de recursos: `TextResource`, `LinkResource`, `MediaResource`

Backend expone:

- `GET /api/entries`
- `GET /api/entries/{entryId}`
- `POST /api/entries` (titulo y opcional `resources[]`)
- `POST /api/entries/{entryId}/resources/text`
- `POST /api/entries/{entryId}/resources/link`
- `POST /api/entries/{entryId}/resources/media`
- `DELETE /api/entries/{entryId}/resources/{resourceId}`
- `DELETE /api/entries/{entryId}`

Contrato detallado en [`docs/api.md`](docs/api.md).

## Flujo de equipo recomendado (3 dias)

1. Acordar endpoints en [`docs/api.md`](docs/api.md).
2. Persona A trabaja en `backend/`.
3. Persona B trabaja en `frontend/`.
4. Front consume `/api/*` del backend (proxy de Vite ya configurado).

## Comandos utiles

Backend tests:

```bash
cd backend
mvn test
```

Frontend build:

```bash
cd frontend
npm run build
```

## Notas

- No se usa Docker para mantener setup rapido.
- Base de datos: H2 en memoria (ideal para hackaton/demo).
- Si mas adelante migrais a Postgres/MySQL o Supabase, se cambia en `backend/src/main/resources/application.yml` y en la persistencia de `MediaResource`.

