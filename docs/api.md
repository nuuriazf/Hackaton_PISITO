# API Contract (MVP)

Base URL: `http://localhost:8080`

## Health

- `GET /api/health`
  - Response `200`:
    ```json
    { "status": "ok" }
    ```

## Resource model

```json
{
  "id": 1,
  "type": "TEXT",
  "title": "Nota inicial",
  "textContent": "Contenido textual",
  "externalUrl": null,
  "storageKey": null,
  "fileName": null,
  "mimeType": null,
  "accessUrl": null,
  "createdAt": "2026-02-27T23:30:00Z"
}
```

Tipos soportados:

- `TEXT`: texto libre del usuario.
- `LINK`: URL externa.
- `VIDEO`: URL de video (YouTube, Vimeo, etc.).
- `IMAGE`, `PHOTO`, `FILE`: archivos subidos desde el dispositivo.

## Endpoints actuales

- `GET /api/resources`
  - Lista todos los recursos (ordenados por fecha desc).

- `GET /api/resources/{id}`
  - Devuelve un recurso concreto.
  - `404` si no existe.

- `POST /api/resources`
  - Crea un recurso por JSON (sin multipart).
  - Uso recomendado:
    - `TEXT` con `textContent`
    - `LINK` / `VIDEO` con `externalUrl`
    - `IMAGE` / `PHOTO` / `FILE` con `storageKey` (si el archivo ya existe en storage externo)
  - Request ejemplo `TEXT`:
    ```json
    {
      "type": "TEXT",
      "title": "Idea",
      "textContent": "Guardar nota rapida"
    }
    ```
  - Request ejemplo `LINK`:
    ```json
    {
      "type": "LINK",
      "title": "Referencia",
      "externalUrl": "https://supabase.com/docs"
    }
    ```

- `POST /api/resources/upload` (`multipart/form-data`)
  - Crea recurso + guarda archivo local (modo dev sin Supabase).
  - Campos:
    - `type`: `IMAGE | PHOTO | FILE`
    - `title`: opcional
    - `file`: archivo binario
  - Response `201`: devuelve el recurso con `storageKey` y `accessUrl`.

- `GET /api/resources/files/{storageKey}`
  - Devuelve el archivo subido (para previsualizar o descargar).

- `DELETE /api/resources/{id}`
  - Elimina recurso.
  - `404` si no existe.

## Flujo front-back recomendado

1. Usuario escribe texto/link/video o selecciona archivo.
2. Front envia:
   - `POST /api/resources` para `TEXT`, `LINK`, `VIDEO`.
   - `POST /api/resources/upload` para `IMAGE`, `PHOTO`, `FILE`.
3. Back persiste metadatos en DB y devuelve el objeto `Resource`.
4. Front refresca `GET /api/resources` y renderiza la lista.

## Preparado para Supabase (siguiente paso)

Cuando conecteis Supabase Storage, mantened el contrato y cambiad solo la capa de subida:

1. `POST /api/uploads/presign` (nuevo endpoint futuro) para pedir URL firmada.
2. Front sube archivo directo a Supabase con esa URL.
3. Front llama `POST /api/resources` con `storageKey` y metadatos.

Asi evitais mover archivos por vuestro backend y manteneis el mismo modelo de datos.

