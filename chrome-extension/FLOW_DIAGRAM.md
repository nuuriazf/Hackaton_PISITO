# 🔄 Flujo de funcionamiento - Extensión PISITO

## Diagrama visual del flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USUARIO EN NAVEGADOR                          │
│                  (Ej: YouTube, Blog, Google, etc)                   │
└────────────────────────────────────────────────────────────────────┬┘
                                  │
                                  │ Presiona Ctrl+Shift+S
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Extension → background.js                         │
│            (Service Worker que escucha comandos)                     │
│                  - Detecta comando "open-popup"                      │
│                  - Abre popup.html                                   │
└────────────────────────────────────────────────────────────────────┬┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      popup.html + popup.js                           │
│                   (Interfaz del formulario)                          │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📝 PISITO Entry                                       [X]    │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │ Página origen:    [https://www.youtube.com/watch?v=...]    │  │
│  │ Título página:    [Como hacer extensiones Chrome]          │  │
│  │                                                              │  │
│  │ Tipo recurso:     [▼ Selecciona un tipo...          ]       │  │
│  │   📄 Texto       🔗 Enlace       🎥 Media                 │  │
│  │                                                              │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ URL del enlace (si selecciona LINK)                 │   │  │
│  │ │ [https://www.youtube.com/watch?v=...]              │   │  │
│  │ │                                                      │   │  │
│  │ │ Nombre del enlace                                   │   │  │
│  │ │ [Mi video favorito de programación]                │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │ Título Entry:     [Videos tutoriales de Chrome Ext]        │  │
│  │ Descripción:      [Recursos sobre desarrollo ...]         │  │
│  │                                                              │  │
│  │                [Limpiar]         [✓ Crear Entry]          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Lógica (popup.js):                                               │
│  • Carga información de página actual (URL, título)               │
│  • Lee configuración de chrome.storage.sync (URL API)             │
│  • Muestra/oculta secciones según tipo de recurso                 │
│  • Valida datos antes de enviar                                   │
│  • Envía POST a /api/entries                                      │
│  • Muestra loading, éxito o error                                 │
└────────────────────────────────────────────────────────────────────┬┘
                                  │
                                  │ User clicks "Crear Entry"
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Validación (Client-side)                        │
│                                                                       │
│  ✓ Tipo recurso seleccionado?                                       │
│  ✓ Título no vacío?                                                 │
│  ✓ Contenido según tipo?                                            │
│    - TEXT: Contenido no vacío                                       │
│    - LINK: URL válida                                               │
│    - MEDIA: URL válida                                              │
│  ✓ Formatos correctos?                                              │
│                                                                       │
│  Si hay error → Mostrar mensaje en popup, permitir corrección      │
│  Si OK → Continuar →                                                │
└────────────────────────────────────────────────────────────────────┬┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Envío a Backend (POST)                            │
│                                                                       │
│  URL: http://localhost:8080/api/entries                             │
│  Method: POST                                                        │
│  Headers: Content-Type: application/json                            │
│                                                                       │
│  Body (ejemplo con LINK):                                            │
│  {                                                                    │
│    "title": "Videos tutoriales de Chrome Ext",                      │
│    "description": "Recursos sobre desarrollo...",                   │
│    "resources": [{                                                   │
│      "resourceType": "LINK",                                         │
│      "linkUrl": "https://www.youtube.com/watch?v=...",               │
│      "linkName": "Mi video favorito de programación"                │
│    }]                                                                │
│  }                                                                    │
│                                                                       │
│  Muestra: ⏳ "Guardando..."                                          │
└────────────────────────────────────────────────────────────────────┬┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
            ❌ Error (4xx, 5xx)         ✅ Éxito (201 Created)
                    │                            │
                    ↓                            ↓
        ┌──────────────────────┐    ┌──────────────────────┐
        │  Mostrar error:      │    │  Mostrar éxito:      │
        │  "No se pudo..."     │    │  ✓ Entry creada      │
        │  "URL inválida"      │    │  exitosamente!       │
        │  "Error 500"         │    │                      │
        │                      │    │  Auto-cerrar popup   │
        │  Permitir reintentos │    │  en 2 segundos       │
        └──────────────────────┘    └──────────────────────┘
                    │                            │
                    │ Usuario intenta           │
                    │ corregir y reintentar     │ Popup se cierra
                    │                            │
                    └────────────┬──────────────┘
                                 │
                                 ↓
                    ┌─────────────────────────┐
                    │   Entry creada en DB    │
                    │   Lista para consultar  │
                    │   desde aplicación web  │
                    └─────────────────────────┘
```

---

## Flujo de opciones (Configuración)

```
Usuario hace click derecho en icono de PISITO
                             │
                             ↓
                    Selecciona "Opciones"
                             │
                             ↓
            ┌────────────────────────────────┐
            │      options.html               │
            │  ⚙️ Configuración               │
            │                                 │
            │ URL de la API:                  │
            │ [http://localhost:8080    ]    │
            │                                 │
            │     [Guardar]  [Resetear]      │
            └────────────────────────────────┘
                             │
                    User ingresa URL
                             │
                             ↓
                    options.js valida
                    (validar que es URL válida)
                             │
                             ↓
            Guarda en chrome.storage.sync
            (sincroniza en todas las pestaña)
                             │
                             ↓
                    Mostrar "✓ Guardado"
                             │
                             ↓
                    popup.js lee la config
                    en el siguiente popup
```

---

## Estructura de datos - Ejemplo completo

### Entrada con TEXTO
```json
{
  "title": "Mi nota sobre programación",
  "description": "Tips útiles que encontré",
  "resources": [
    {
      "resourceType": "TEXT",
      "textContent": "Las variables let y const son mejores que var..."
    }
  ]
}
```

### Entrada con ENLACE
```json
{
  "title": "Recursos de Chrome Extension",
  "description": "Documentación oficial",
  "resources": [
    {
      "resourceType": "LINK",
      "linkUrl": "https://developer.chrome.com/docs/extensions/",
      "linkName": "Docs Oficiales Chrome"
    }
  ]
}
```

### Entrada con MEDIA
```json
{
  "title": "Paisajes hermosos",
  "description": "Fotos de Unsplash",
  "resources": [
    {
      "resourceType": "MEDIA",
      "mediaUrl": "https://images.unsplash.com/photo-...",
      "mediaName": "Montaña al atardecer"
    }
  ]
}
```

### Entrada con MÚLTIPLES recursos
```json
{
  "title": "Curso de React avanzado",
  "description": "Recursos para aprender",
  "resources": [
    {
      "resourceType": "LINK",
      "linkUrl": "https://react.dev/learn",
      "linkName": "React Official Docs"
    },
    {
      "resourceType": "TEXT",
      "textContent": "Hooks son la forma moderna de hacer estado..."
    },
    {
      "resourceType": "MEDIA",
      "mediaUrl": "https://youtube.com/watch?v=...",
      "mediaName": "Tutorial React Hooks"
    }
  ]
}
```

---

## Comunicación entre componentes

```
┌──────────────────┐
│   content.js     │  Corre en TODAS las páginas
│                  │  Lee: document.title, window.location.href
│  Comunica con:   │
│  - background.js │
│  - popup.js      │
└──────────────────┘
         ▲
         │ chrome.runtime.onMessage
         │
┌────────┴──────────┐
│    popup.js       │  Corre en el popup
│                   │  Lee: URL actual, título
│  Comunica con:    │
│  - content.js     │
│  - options (API)  │
└───────────────────┘
         ▲
         │ chrome.storage.sync
         │
┌────────┴──────────┐
│   options.js      │  Corre en options.html
│                   │  Almacena configuración
│  Comunica con:    │
│  - chrome.storage │
│  - Backend API    │
└───────────────────┘
         ▲
         │ POST /api/entries
         │
┌────────┴──────────┐
│  Backend (Java)   │  Tu servidor Spring Boot
│  API Rest         │  Procesa y guarda en DB
└───────────────────┘
```

---

## Timeline de ejecución - De inicio a fin

```
T=0ms    | Usuario presiona Ctrl+Shift+S
         |
T=10ms   | background.js recibe comando
         |
T=20ms   | chrome.action.openPopup() ejecuta
         |
T=50ms   | popup.html se carga en DOM
         |
T=70ms   | popup.js ejecuta DOMContentLoaded
         |
T=100ms  | loadPageInfo() obtiene URL y título
         |
T=110ms  | loadApiConfig() obtiene URL del servidor
         |
T=150ms  | Popup visible con datos autocompletos ✓
         |
T=~5000ms| Usuario completa el formulario
         |
T=5100ms | Usuario presiona "Crear Entry"
         |
T=5110ms | Valida datos
         |
T=5120ms | Crea payload JSON
         |
T=5130ms | fetch POST a /api/entries
         |
T=5140ms | Spinner "Guardando..." visible
         |
T=5200ms | Respuesta del servidor (tiempo red ~100ms)
         |
T=5210ms | Si éxito: Mostrar checkmark
         |
T=5220ms | Si error: Mostrar mensaje de error
         |
T=7210ms | (Si éxito) Auto-cerrar popup (2000ms)
```

---

## Archivos que comunican y por qué

| Archivo | Se comunica con | Método | Propósito |
|---------|-----------------|--------|-----------|
| background.js | manifest.json | Events | Escuchar comando de teclado |
| background.js | chrome.action | API | Abrir popup |
| popup.js | content.js | runtime.sendMessage | Obtener info de página |
| popup.js | chrome.storage | API | Leer URL de API |
| popup.js | Backend API | fetch (HTTP) | Enviar datos |
| options.js | chrome.storage | API | Guardar configuración |
| manifest.json | ??? | N/A | Define todo |

---

## Estados posibles del popup

```
┌─ INICIAL ────────────────────────────────────────────┐
│  • Cargando info de página                           │
│  • Leyendo configuración                             │
│  • Inicializando estilos                             │
└──────────────────────────────────────────────────────┘
                       │
                       ↓
┌─ LISTO ───────────────────────────────────────────────┐
│  • Formulario visible                                 │
│  • Datos de página precargados                        │
│  • Usuario puede interactuar                          │
└──────────────────────────────────────────────────────┘
       │              │              │
  [Texto]        [Enlace]        [Media]
       │              │              │
       ↓              ↓              ↓
────────────────────────────────────────────
  Usuario completa campos
       │
       ↓
┌─ ENVIANDO ────────────────────────────────────────────┐
│  • Spinner visible                                    │
│  • Texto "Guardando..."                               │
│  • Formulario deshabilitado                           │
└──────────────────────────────────────────────────────┘
       │
       ├─────────────┬────────────────┤
       │             │                │
   [Éxito]      [Error]          [Timeout]
       │             │                │
       ↓             ↓                ↓
  ┌────────┐    ┌──────────┐     ┌──────────┐
  │  ✓ OK  │    │Mostrar   │     │Mostrar   │
  │        │    │error:    │     │timeout   │
  │Cerrar  │    │"URL..."  │     │error     │
  └────────┘    │"No se..." │     └──────────┘
                │           │          │
                │ Permitir  │    Permitir
                │ reintentos│    reintentos
                └──────────┘
```

---

**Este diagrama ayuda a entender exactamente qué sucede**
**En cada momento desde que presionas la tecla hasta que se guarda ✓**

¿Alguna pregunta sobre cómo funciona? 🎯
