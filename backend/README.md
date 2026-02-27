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
- `GET /api/resources`
- `GET /api/resources/{id}`
- `POST /api/resources` (JSON: text/link/video o metadata de archivo)
- `POST /api/resources/upload` (multipart: subida de archivo local)
- `GET /api/resources/files/{storageKey}`
- `DELETE /api/resources/{id}`

## Tests

```bash
mvn test
```


