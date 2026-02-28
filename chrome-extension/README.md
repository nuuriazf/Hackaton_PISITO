# 📝 PISITO Chrome Extension

Extensión de Chrome para crear entries rápidamente desde cualquier página web sin salir del navegador.

## 🚀 Características

- **Atajo de teclado**: Presiona `Ctrl+Shift+S` (o `Cmd+Shift+S` en Mac) desde cualquier página para abrir el formulario
- **3 tipos de recursos**: Texto, Enlace, Media (Imagen/Video)
- **Captura automática**: La URL y título de la página se rellenan automáticamente
- **Configuración flexible**: Ajusta la URL de tu servidor desde las opciones
- **Interfaz moderna**: Diseño limpio e intuitivo con feedback visual

## 📦 Instalación

### Paso 1: Preparar el directorio

Los archivos de la extensión ya están listos en `/chrome-extension`.

### Paso 2: Cargar en Chrome

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa el **Modo de desarrollador** (esquina superior derecha)
3. Haz clic en **"Cargar extensión sin empaquetar"**
4. Selecciona la carpeta `chrome-extension`
5. ¡Listo! La extensión está instalada

## ⚙️ Configuración

### Configurar la URL de la API

1. Haz clic derecho en el icono de PISITO
2. Selecciona **"Opciones"**
3. Ingresa la URL de tu servidor (ej: `http://localhost:8080`)
4. Haz clic en **"Guardar"**

**Nota**: Por defecto usa `http://localhost:8080`

## 🎯 Uso

### Abrir el formulario

Hay 3 formas de abrir el popup:

1. **Atajo de teclado**: `Ctrl+Shift+S` (o `Cmd+Shift+S` en Mac)
2. **Click en el icono**: Haz clic en el icono de PISITO en la barra de herramientas
3. **Desde la página de opciones**: `chrome://extensions` → Click derecho en PISITO → Opciones

### Crear una Entry

1. Abre el popup (cualquiera de las formas arriba)
2. **Selecciona el tipo de recurso**:
   - 📄 **Texto**: Para contenido de texto
   - 🔗 **Enlace**: Para guardar un URL
   - 🎥 **Media**: Para imágenes o videos

3. **Rellena los campos específicos** del tipo de recurso
4. **Título de la Entry** (obligatorio): Dale un nombre a tu entrada
5. **Descripción** (opcional): Añade notas adicionales
6. Haz clic en **"Crear Entry"**

### Ejemplo de uso en YouTube

1. Estás viendo un video en YouTube
2. Presionas `Ctrl+Shift+S`
3. El popup se abre con:
   - URL: `https://www.youtube.com/watch?v=...`
   - Título: El nombre del video
4. Seleccionas "🔗 Enlace"
5. Rellenas:
   - URL del enlace: Ya viene prefillado
   - Nombre del enlace: "Mi video favorito"
6. Título de Entry: "Videos interesantes"
7. ¡Click en "Crear Entry"!

## 📁 Estructura

```
chrome-extension/
├── manifest.json        # Configuración de la extensión
├── popup.html          # Interfaz del formulario
├── popup.js            # Lógica del popup
├── popup.css           # Estilos del popup
├── options.html        # Página de opciones
├── options.js          # Lógica de opciones
├── src/
│   ├── background.js   # Service worker
│   └── content.js      # Script en páginas web
├── styles/
│   └── popup.css       # Estilos (se puede separar)
└── icons/
    └── icon-128.png    # Icono de la extensión
```

## 🔧 Desarrollo

### Cambiar el atajo de teclado

Edita `manifest.json`:

```json
"commands": {
  "open-popup": {
    "suggested_key": {
      "default": "Ctrl+Shift+S",
      "mac": "Command+Shift+S"
    },
    "description": "Abre el formulario para crear una nueva entry"
  }
}
```

### Cambiar los estilos

Edita `styles/popup.css` y `options.html` en la sección `<style>`

### Agregar nuevos tipos de recursos

1. Añade la opción en `popup.html`
2. Crea la sección HTML correspondiente
3. Actualiza `popup.js` para manejar el nuevo tipo

## 🐛 Debugging

### Ver logs en consola

1. `chrome://extensions/`
2. Haz clic en tu extensión
3. Busca "Inspeccionar vistas" → Service Worker
4. Abre la consola

### Recargar la extensión

- Haz cambios en los archivos
- En `chrome://extensions/`, haz clic en el botón de "Recargar"
- Cierra cualquier popup abierto y abre uno nuevo

## 📝 API esperada

El endpoint esperado es:

```
POST /api/entries
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "resources": [
    {
      "resourceType": "TEXT",
      "textContent": "string"
    }
    // o
    {
      "resourceType": "LINK",
      "linkUrl": "string",
      "linkName": "string"
    }
    // o
    {
      "resourceType": "MEDIA",
      "mediaUrl": "string",
      "mediaName": "string"
    }
  ]
}
```

## ⚖️ Permisos

La extensión solicita:
- `activeTab`: Para acceder a la pestaña activa
- `scripting`: Para inyectar scripts
- `storage`: Para guardar la configuración
- `<all_urls>`: Para acceder a cualquier página web

## 🤝 Contribuir

Para mejorar la extensión:
1. Haz cambios en el código
2. Recarga la extensión en Chrome
3. Prueba las nuevas funcionalidades
4. Comparte tus mejoras

## 📄 Licencia

Este proyecto es parte de PISITO Hackaton 2026.

---

¿Problemas? Revisa la consola del navegador (`F12`) para ver mensajes de error.
