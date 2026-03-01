# PISITO Chrome Extension (Quick Inbox)

Extensión MV3 que abre un modal en cualquier web con el Inbox de PISITO embebido.

## Atajo de teclado

- `Ctrl + Shift + Y`: abre/cierra el modal.
- `Alt + Shift + P`: alternativa si el primero no funciona en una web.
- `Esc`: cierra el modal.

## Estructura

- `manifest.json`: configuración de la extensión.
- `content.js`: inyección del modal y atajos.
- `content.css`: estilos del modal.

## URL del inbox

Por defecto intenta, en este orden:

- `https://localhost:5173/inbox`
- `http://localhost:5173/inbox`
- `https://localhost:4173/inbox`
- `http://localhost:4173/inbox`

Si cambias entorno, edita `INBOX_URLS` en `content.js`.

## Cargar en Chrome

1. Abre `chrome://extensions/`.
2. Activa `Modo de desarrollador`.
3. Pulsa `Cargar descomprimida`.
4. Selecciona la carpeta `chrome-extension`.

## Nota importante

Si el iframe no carga en webs HTTPS, Chrome puede bloquear `http://localhost` embebido (mixed content / private network restrictions). En ese caso:

1. Arranca el frontend local por HTTPS.
2. Acepta el certificado local en una pestaña de `https://localhost:5173`.
3. Vuelve a la web donde usas la extensión.

La extensión también muestra botón de fallback para abrir el inbox en pestaña.
