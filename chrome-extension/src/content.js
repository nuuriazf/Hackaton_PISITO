// Content script que se ejecuta en todas las páginas web
// Este script es útil para futuras características como capturar texto seleccionado, etc.

console.log('PISITO Extension - Content script cargado');

// Escuchar mensajes desde el popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageInfo') {
        // Enviar información de la página
        sendResponse({
            title: document.title,
            url: window.location.href,
            selectedText: window.getSelection().toString()
        });
    }
});

// Inyectar estilos globales para marcar que la extensión está activa
const style = document.createElement('style');
style.textContent = `
    /* Estilos para la extensión PISITO */
    .pisito-overlay {
        position: fixed;
        pointer-events: none;
    }
`;
document.head.appendChild(style);
