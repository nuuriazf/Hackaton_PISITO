# ⚡ Quick Start - PISITO Chrome Extension

## 🚀 Instalación rápida (2 minutos)

### 1. Abre la extensión en Chrome
```
chrome://extensions/
```

### 2. Activa Modo de Desarrollador
Esquina superior derecha → Toggle "Modo de desarrollador"

### 3. Carga la extensión
- Click "Cargar extensión sin empaquetar"
- Selecciona la carpeta `chrome-extension`
- ¡Hecho! Verás el icono de PISITO en la barra de herramientas

---

## 🎯 Primeros pasos (1 minuto)

### ✓ Ya tengo el servidor corriendo en `http://localhost:8080`

1. Presiona **`Ctrl+Shift+S`** desde cualquier página
2. Se abre el popup automáticamente ✅
3. La URL y título se rellenan solos ✅
4. Selecciona un tipo de recurso
5. Completa los campos
6. ¡Click "Crear Entry"! 🎉

### ✗ Mi servidor está en otra URL

1. Click derecho en icono de PISITO
2. Selecciona "Opciones"
3. Cambia la URL (ej: `http://tu-servidor:3000`)
4. Click "Guardar"
5. Listo, ya puedes crear entries

---

## 📝 Casos de uso comunes

### YouTube - Guardar un video
```
1. Estoy viendo un video en YouTube
2. Ctrl+Shift+S
3. Selecciono "🔗 Enlace"
4. URL ya está → Solo doy nombre y título
5. ¡Guardado!
```

### Blog - Guardar un párrafo
```
1. Leo un blog interesante
2. Ctrl+Shift+S
3. Selecciono "📄 Texto"
4. Copio el párrafo en el campo
5. Doy título y descripción
6. ¡Guardado!
```

### Galería - Guardar una imagen
```
1. Veo una imagen bonita
2. Ctrl+Shift+S
3. Selecciono "🎥 Media"
4. Pego el URL de la imagen
5. Doy nombre y descripción
6. ¡Guardado!
```

---

## 🔑 Atajos principales

| Atajo | Acción |
|-------|--------|
| `Ctrl+Shift+S` | Abre el popup de PISITO |
| Click en icono | Abre el popup |
| Click derecho → Opciones | Va a configuración |

---

## 🐛 Si algo no funciona

### El popup no abre
- ✓ Verifica que la extensión esté habilitada en `chrome://extensions/`
- ✓ Algunos sitios bloquean atajos (intenta otro sitio)
- ✓ Recarga: Click en la extensión → Recarga (ícono circular)

### Dice "No se pudo conectar"
- ✓ Verifica que tu servidor esté corriendo
- ✓ Verifica la URL en Opciones (sin trailing slash)
- ✓ Abre DevTools (F12) y mira errores en la consola

### No puedo abrir Opciones
- ✓ Al lado del ícono hay un botón → "Detalles" → "Opciones"

---

## 📊 Monitorear la extensión

### Ver logs en tiempo real
1. `chrome://extensions/`
2. Busca PISITO y click "Detalles"
3. Busca "Inspeccionar vistas"
4. Click "Service Worker"
5. Abierto en DevTools con logs

### Ver errores del popup
1. Abre el popup (`Ctrl+Shift+S`)
2. Click derecho → "Inspeccionar"
3. Abierto en DevTools
4. Pestaña "Consola" para ver errores

---

## 🔧 Desarrollo rápido

### Cambiar atajo de teclado
Edita `manifest.json`:
```json
"commands": {
  "open-popup": {
    "suggested_key": {
      "default": "Ctrl+Shift+E"  // Cambiar a E
    }
  }
}
```
Recarga la extensión.

### Cambiar estilos
Edita `styles/popup.css` y recarga el popup (cierra y abre).

### Ver cambios inmediatos
- JS/HTML: Cierra popup y abre de nuevo
- CSS: Cierra popup y abre de nuevo
- background.js: Recarga en `chrome://extensions/`
- content.js: Recarga la página (F5)

---

## 📂 Estructura de archivos

```
chrome-extension/
├─ manifest.json        ← Configuración principal
├─ popup.html          ← Interfaz del formulario
├─ popup.js            ← Lógica del popup
├─ popup.css           ← Estilos
├─ options.html        ← Página de opciones
├─ options.js          ← Lógica de opciones
├─ src/
│  ├─ background.js    ← Eventos globales
│  └─ content.js       ← Script en páginas
├─ styles/
│  └─ popup.css        ← Más estilos
├─ icons/
│  └─ icon-128.png     ← Icono
├─ README.md           ← Instrucciones completas
├─ DEVELOPMENT.md      ← Guía de desarrollo
├─ API_EXAMPLES.md     ← Ejemplos de API
└─ QUICK_START.md      ← Este archivo
```

---

## 🎓 Próximos pasos

1. **Usa la extensión** - Crea algunos entries
2. **Lee [README.md](README.md)** - Para funcionalidades avanzadas
3. **Lee [DEVELOPMENT.md](DEVELOPMENT.md)** - Si quieres modificarla
4. **Revisa [API_EXAMPLES.md](API_EXAMPLES.md)** - Para ver ejemplos de API

---

## 💡 Tips

- ✨ La extensión funciona en CUALQUIER página web
- ⚡ Sin necesidad de ser admin del sitio
- 🔄 Los datos se sincronizan automáticamente
- 🎨 Puedes customizar totalmente los estilos
- 🚀 La extensión es completamente local (excepto API call)

---

¿Problemas? Abre una issue o revisa la consola (F12) para ver errores ! 🔧
