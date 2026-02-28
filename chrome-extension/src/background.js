// Manejar el comando de teclado para abrir el popup
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-popup') {
        // Abrir la action popup
        chrome.action.openPopup();
    }
});

// Mantener la conexión con el content script viva
chrome.runtime.onConnect.addListener((port) => {
    console.log('Conexión establecida:', port.name);
});

// Inicializar configuración por defecto si no existe
chrome.storage.sync.get(['apiUrl'], (items) => {
    if (!items.apiUrl) {
        chrome.storage.sync.set({
            apiUrl: 'http://localhost:8080'
        });
    }
});
