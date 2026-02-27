# Frontend (React + TypeScript + Vite)

## Requisitos

- Node.js 20+

## Arranque

```bash
npm install
npm run dev
```

App en `http://localhost:5173`

## Flujo API usado

- `GET /api/resources`
- `POST /api/resources` para `TEXT`, `LINK`, `VIDEO`
- `POST /api/resources/upload` para `IMAGE`, `PHOTO`, `FILE`
- `DELETE /api/resources/{id}`

## Build

```bash
npm run build
npm run preview
```
