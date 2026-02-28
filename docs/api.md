# API Contract (Entry + Resources)

Base URL: `http://localhost:8080`

## Health

- `GET /api/health`
  - Response `200`:
    ```json
    { "status": "ok" }
    ```

## Domain model

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

- `GET /api/entries`
  - Lista todas las entradas con sus recursos.

- `GET /api/entries/{entryId}`
  - Devuelve una entrada concreta.
  - `404` si no existe.

- `POST /api/entries`
  - Crea una entry con título y recursos (multipart/form-data).
  - Request (multipart/form-data):
    - `title` (string, required): Título de la entrada
    - `userId` (number, required): ID del usuario propietario
    - `textResources` (string[], optional): Array de textos a incluir
    - `linkResources` (string[], optional): Array de URLs a incluir
    - `mediaFiles` (file[], optional): Array de archivos a subir
  - Ejemplo con curl:
    ```bash
    curl -X POST http://localhost:8080/api/entries \
      -F "title=Ideas de producto" \
      -F "userId=1" \
      -F "textResources=Nota inicial" \
      -F "textResources=Otra nota" \
      -F "linkResources=https://example.com" \
      -F "mediaFiles=@/path/to/file1.jpg" \
      -F "mediaFiles=@/path/to/file2.pdf"
    ```
  - Response `201`: entry creada con todos sus recursos.
    ```json
    {
      "id": 1,
      "title": "Ideas de producto",
      "createDate": "2026-02-28T05:00:00Z",
      "updateDate": "2026-02-28T05:00:00Z",
      "resources": [
        {
          "id": 1,
          "type": "TEXT",
          "textContent": "Nota inicial",
          "createDate": "2026-02-28T05:00:00Z"
        },
        {
          "id": 2,
          "type": "LINK",
          "url": "https://example.com",
          "createDate": "2026-02-28T05:00:00Z"
        },
        {
          "id": 3,
          "type": "MEDIA",
          "storageKey": "a1b2c3d4-e5f6.jpg",
          "createDate": "2026-02-28T05:00:00Z"
        }
      ]
    }
    ```

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

**Nota:** Los recursos ahora se crean junto con la entry usando `multipart/form-data` en el endpoint `POST /api/entries`. Los siguientes endpoints solo están disponibles para eliminar recursos.

- `DELETE /api/entries/{entryId}/resources/{resourceId}`
  - Response `204`: recurso eliminado.
  - Los archivos asociados a MediaResource son automáticamente eliminados del servidor.
  - `404` si no existe o no pertenece a esa entry.

## Flujo recomendado

1. Front crea una `Entry` con todos sus recursos en un único `POST /api/entries` (multipart/form-data).
2. Front consulta `GET /api/entries` para pintar el contenido completo.
3. Front puede eliminar recursos individuales con `DELETE /api/entries/{entryId}/resources/{resourceId}`.




