// Elementos del DOM
const form = document.getElementById('options-form');
const apiUrlInput = document.getElementById('apiUrl');
const statusDiv = document.getElementById('status');

// Cargar opciones guardadas
function loadOptions() {
    chrome.storage.sync.get(['apiUrl'], (items) => {
        if (items.apiUrl) {
            apiUrlInput.value = items.apiUrl;
        }
    });
}

// Guardar opciones
function saveOptions() {
    const apiUrl = apiUrlInput.value.trim();

    if (!apiUrl) {
        showStatus('Error: Por favor ingresa una URL válida', 'error');
        return;
    }

    // Validar que sea una URL válida
    try {
        new URL(apiUrl);
    } catch (error) {
        showStatus('Error: La URL no es válida', 'error');
        return;
    }

    // Guardar en storage
    chrome.storage.sync.set({ apiUrl: apiUrl }, () => {
        showStatus('✓ Configuración guardada correctamente', 'success');
        setTimeout(() => {
            statusDiv.classList.remove('success');
            statusDiv.style.display = 'none';
        }, 3000);
    });
}

// Mostrar mensaje de estado
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
}

// Event listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveOptions();
});

// Cargar opciones cuando se abre la página
document.addEventListener('DOMContentLoaded', loadOptions);
