# API Examples - PISITO Chrome Extension

## 1. Crear Entry con TEXT resource

### Request
```bash
curl -X POST http://localhost:8080/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi nota importante",
    "description": "Una nota que encontré en una página",
    "resources": [
      {
        "resourceType": "TEXT",
        "textContent": "Como Java se ha vuelto inseguro..."
      }
    ]
  }'
```

### Response (Success - 201 Created)
```json
{
  "id": 1,
  "title": "Mi nota importante",
  "description": "Una nota que encontré en una página",
  "createdAt": "2026-02-28T10:30:00Z",
  "resources": [
    {
      "id": 1,
      "resourceType": "TEXT",
      "textContent": "Como Java se ha vuelto inseguro..."
    }
  ]
}
```

### Response (Error - 400 Bad Request)
```json
{
  "message": "Por favor ingresa contenido de texto",
  "status": 400
}
```

---

## 2. Crear Entry con LINK resource

### Request
```bash
curl -X POST http://localhost:8080/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Videos de programación",
    "description": "Colección de videos educativos",
    "resources": [
      {
        "resourceType": "LINK",
        "linkUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "linkName": "Rick Roll - Clásico"
      }
    ]
  }'
```

### Response (Success)
```json
{
  "id": 2,
  "title": "Videos de programación",
  "description": "Colección de videos educativos",
  "createdAt": "2026-02-28T10:31:00Z",
  "resources": [
    {
      "id": 2,
      "resourceType": "LINK",
      "linkUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "linkName": "Rick Roll - Clásico"
    }
  ]
}
```

---

## 3. Crear Entry con MEDIA resource

### Request
```bash
curl -X POST http://localhost:8080/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Imágenes de paisajes",
    "description": "Fotos hermosas",
    "resources": [
      {
        "resourceType": "MEDIA",
        "mediaUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
        "mediaName": "Montaña al atardecer"
      }
    ]
  }'
```

### Response (Success)
```json
{
  "id": 3,
  "title": "Imágenes de paisajes",
  "description": "Fotos hermosas",
  "createdAt": "2026-02-28T10:32:00Z",
  "resources": [
    {
      "id": 3,
      "resourceType": "MEDIA",
      "mediaUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      "mediaName": "Montaña al atardecer"
    }
  ]
}
```

---

## 4. Crear Entry con MÚLTIPLES recursos

### Request
```bash
curl -X POST http://localhost:8080/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Recursos sobre Chrome Extensions",
    "description": "Documentación oficial y ejemplos",
    "resources": [
      {
        "resourceType": "LINK",
        "linkUrl": "https://developer.chrome.com/docs/extensions/",
        "linkName": "Docs oficiales"
      },
      {
        "resourceType": "LINK",
        "linkUrl": "https://github.com/GoogleChrome/chrome-extensions-samples",
        "linkName": "Ejemplos en GitHub"
      },
      {
        "resourceType": "TEXT",
        "textContent": "Las extensiones v3 requieren Manifest V3 y usan Service Workers"
      }
    ]
  }'
```

### Response (Success)
```json
{
  "id": 4,
  "title": "Recursos sobre Chrome Extensions",
  "description": "Documentación oficial y ejemplos",
  "createdAt": "2026-02-28T10:33:00Z",
  "resources": [
    {
      "id": 4,
      "resourceType": "LINK",
      "linkUrl": "https://developer.chrome.com/docs/extensions/",
      "linkName": "Docs oficiales"
    },
    {
      "id": 5,
      "resourceType": "LINK",
      "linkUrl": "https://github.com/GoogleChrome/chrome-extensions-samples",
      "linkName": "Ejemplos en GitHub"
    },
    {
      "id": 6,
      "resourceType": "TEXT",
      "textContent": "Las extensiones v3 requieren Manifest V3 y usan Service Workers"
    }
  ]
}
```

---

## 5. Errores comunes

### Error: URL inválida
```bash
# Request
curl -X POST http://localhost:8080/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi enlace",
    "resources": [
      {
        "resourceType": "LINK",
        "linkUrl": "no es una url válida",
        "linkName": "Error"
      }
    ]
  }'

# Response (400 Bad Request)
{
  "message": "URL inválida: no es una url válida",
  "status": 400
}
```

### Error: Campo obligatorio faltante
```bash
# Request (sin title)
curl -X POST http://localhost:8080/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "resources": []
  }'

# Response (400 Bad Request)
{
  "message": "El campo 'title' es obligatorio",
  "status": 400
}
```

### Error: Tipo de recurso inválido
```bash
# Request (resourceType incorrecto)
curl -X POST http://localhost:8080/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi entrada",
    "resources": [
      {
        "resourceType": "INVALID",
        "content": "algo"
      }
    ]
  }'

# Response (400 Bad Request)
{
  "message": "Tipo de recurso no válido: INVALID",
  "status": 400
}
```

### Error: Servidor no disponible
```bash
# Si la URL no es correcta o el servidor no está corriendo
# Response (Error de conexión)
{
  "message": "No se pudo conectar al servidor. Verifica la URL en Opciones.",
  "status": 0
}
```

---

## Validación del lado del Cliente (Extensión)

La extensión valida ANTES de enviar:

```javascript
// Validaciones en popup.js:

1. Tipo de recurso seleccionado (required)
2. Título de entry (required, min 1 char)
3. Según el tipo:
   - TEXT: Contenido no vacío
   - LINK: URL válida (validación básica)
   - MEDIA: URL válida

4. Datos formateados correctamente
```

---

## Configuración de CORS (Backend)

Tu backend necesita permitir CORS. Con Spring Boot:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("*")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*");
    }
}
```

---

## Testing con Postman

1. Abre Postman
2. Crea una nueva request POST
3. URL: `http://localhost:8080/api/entries`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "title": "Test desde Postman",
  "description": "Testing",
  "resources": [{
    "resourceType": "TEXT",
    "textContent": "Prueba"
  }]
}
```

---

## Notas importantes

- El servidor debe estar corriendo en la URL configurada (por defecto `http://localhost:8080`)
- La extensión NO maneja autenticación todavía (próxima versión)
- Los errores de red se muestran en el popup
- No hay reintentos automáticos (el usuario debe reintentar)
- El timeout es de 30 segundos

---

¿Necesitas más ejemplos? Consulta la documentación de tu API en `docs/api.md`
