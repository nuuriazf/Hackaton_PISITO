# API Contract (Entry + Resources)

Base URL: `http://localhost:8080`

Auth:
- Excepto `GET /api/health`, `POST /api/auth/register` y `POST /api/auth/login`,
  el resto de endpoints requiere `Authorization: Bearer <jwt>`.

## Health

- `GET /api/health`
  - Response `200`:
    ```json
    { "status": "ok" }
    ```

## Auth endpoints

- `POST /api/auth/register`
  - Request:
    ```json
    {
      "username": "demo_user",
      "password": "pisito123"
    }
    ```
  - Response `201`:
    ```json
    {
      "tokenType": "Bearer",
      "accessToken": "<jwt>",
      "expiresInSeconds": 86400,
      "user": {
        "id": 1,
        "username": "demo_user",
        "createdAt": "2026-02-28T01:00:00Z",
        "updatedAt": "2026-02-28T01:00:00Z",
        "lastLoginAt": null,
        "passwordUpdatedAt": "2026-02-28T01:00:00Z"
      }
    }
    ```

- `POST /api/auth/login`
  - Request:
    ```json
    {
      "username": "demo_user",
      "password": "pisito123"
    }
    ```
  - Response `200`: mismo formato que `register` con nuevo JWT.
  - `401` si credenciales invalidas.

- `GET /api/auth/me`
  - Header:
    - `Authorization: Bearer <jwt>`
  - Response `200`: datos del usuario con auditoria.
  - `401` si token invalido o ausente.

- `PUT /api/auth/me/username`
  - Header:
    - `Authorization: Bearer <jwt>`
  - Request:
    ```json
    {
      "username": "nuevo_nombre",
      "currentPassword": "pisito123"
    }
    ```
  - Response `200`: mismo formato token + user.

- `PUT /api/auth/me/password`
  - Header:
    - `Authorization: Bearer <jwt>`
  - Request:
    ```json
    {
      "currentPassword": "pisito123",
      "newPassword": "pisito1234"
    }
    ```
  - Response `200`: mismo formato token + user.

## Domain model

- `AppUser`
  - `id`
  - `username` (unico, en minusculas)
  - `password` (hash BCrypt)
  - `createdAt`
  - `updatedAt`
  - `lastLoginAt`
  - `passwordUpdatedAt`

- `Entry`
  - `id`
  - `title`
  - `createdAt`
  - `updatedAt`
  - `resources[]`

- `Resource` (abstract parent)
  - `id`
  - `type`: `TEXT | LINK | MEDIA`
  - `title`
  - `createdAt`

- Resource subtypes
  - `TextResource`: `textContent`
  - `LinkResource`: `url`
  - `MediaResource`: `storageKey`, `fileName`, `mimeType`

## Entry endpoints

- Todas las operations de Entry/Resource son por usuario autenticado (owner).

- `GET /api/entries`
  - Lista todas las entradas con sus recursos.

- `GET /api/entries/{entryId}`
  - Devuelve una entrada concreta.
  - `404` si no existe.

- `POST /api/entries`
  - Crea una entry con titulo y, opcionalmente, recursos iniciales.
  - Request:
    ```json
    {
      "title": "Ideas de producto",
      "resources": [
        {
          "type": "TEXT",
          "title": "Nota inicial",
          "textContent": "Texto plano del usuario"
        },
        {
          "type": "LINK",
          "title": "Referencia",
          "url": "https://supabase.com/docs"
        },
        {
          "type": "MEDIA",
          "title": "Media local",
          "storageKey": "media/foto-1.jpg",
          "fileName": "foto-1.jpg",
          "mimeType": "image/jpeg"
        }
      ]
    }
    ```
  - Response `201`: entry creada.

- `PUT /api/entries/{entryId}`
  - Request:
    ```json
    {
      "title": "Nuevo titulo"
    }
    ```
  - Response `200`: entry actualizada.
  - `404` si no existe.

- `DELETE /api/entries/{entryId}`
  - Response `204`: entry eliminada.
  - `404` si no existe.

## Resource endpoints (dentro de una Entry)

- `POST /api/entries/{entryId}/resources/text`
  - Request:
    ```json
    {
      "title": "Nota",
      "textContent": "Texto plano del usuario"
    }
    ```

- `POST /api/entries/{entryId}/resources/link`
  - Request:
    ```json
    {
      "title": "Referencia",
      "url": "https://supabase.com/docs"
    }
    ```

- `POST /api/entries/{entryId}/resources/media`
  - Request:
    ```json
    {
      "title": "Media local",
      "storageKey": "media/asset-1.mp4",
      "fileName": "asset-1.mp4",
      "mimeType": "video/mp4"
    }
    ```

- `DELETE /api/entries/{entryId}/resources/{resourceId}`
  - Response `204`: recurso eliminado.
  - `404` si no existe o no pertenece a esa entry.

## Flujo recomendado

1. Front crea una `Entry` con `POST /api/entries`.
2. Front anade recursos tipados a esa entry con los endpoints `/resources/{type}`.
3. Front consulta `GET /api/entries` para pintar el contenido completo.



