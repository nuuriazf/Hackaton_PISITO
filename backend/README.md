# Backend (Spring Boot)

## Requisitos

- Java 21+
- Maven 3.9+

## Arranque

```bash
mvn spring-boot:run
```

API en `http://localhost:8080`

H2 console en `http://localhost:8080/h2-console`

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


