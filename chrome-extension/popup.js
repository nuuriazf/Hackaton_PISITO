// Estado del DOM
const formElement = document.getElementById('entry-form');
const resourceTypeSelect = document.getElementById('resource-type');
const closeBtn = document.getElementById('close-btn');
const loadingDiv = document.getElementById('loading');
const successDiv = document.getElementById('success');
const errorDiv = document.getElementById('error-message');

// Elementos de la página
const pageUrlInput = document.getElementById('page-url');
const pageTitleInput = document.getElementById('page-title');
const apiUrlInput = document.getElementById('api-url');

// Elementos de recurso
const textResourceSection = document.getElementById('text-resource');
const linkResourceSection = document.getElementById('link-resource');
const mediaResourceSection = document.getElementById('media-resource');

// Cargar información de la pestaña actual
async function loadPageInfo() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        pageUrlInput.value = tab.url || 'URL desconocida';
        pageTitleInput.value = tab.title || 'Título desconocido';
    } catch (error) {
        console.error('Error obteniendo info de la pestaña:', error);
    }
}

// Cargar configuración de la API
async function loadApiConfig() {
    const stored = await chrome.storage.sync.get(['apiUrl']);
    if (stored.apiUrl) {
        apiUrlInput.value = stored.apiUrl;
    } else {
        // URL por defecto
        apiUrlInput.value = 'http://localhost:8080';
    }
}

// Mostrar/Ocultar secciones de tipos de recurso
resourceTypeSelect.addEventListener('change', (e) => {
    // Ocultar todas
    textResourceSection.classList.remove('visible');
    linkResourceSection.classList.remove('visible');
    mediaResourceSection.classList.remove('visible');

    // Mostrar la seleccionada
    const type = e.target.value;
    if (type === 'TEXT') {
        textResourceSection.classList.add('visible');
    } else if (type === 'LINK') {
        linkResourceSection.classList.add('visible');
    } else if (type === 'MEDIA') {
        mediaResourceSection.classList.add('visible');
    }
});

// Cerrar popup
closeBtn.addEventListener('click', () => {
    window.close();
});

// Crear objeto de recurso basado en el tipo
function createResourceObject(resourceType) {
    const resources = [];

    if (resourceType === 'TEXT') {
        const textContent = document.getElementById('text-content').value.trim();
        if (!textContent) {
            throw new Error('Por favor ingresa contenido de texto');
        }
        resources.push({
            resourceType: 'TEXT',
            textContent: textContent
        });
    } else if (resourceType === 'LINK') {
        const linkUrl = document.getElementById('link-url').value.trim();
        const linkName = document.getElementById('link-name').value.trim();
        if (!linkUrl) {
            throw new Error('Por favor ingresa una URL');
        }
        resources.push({
            resourceType: 'LINK',
            linkUrl: linkUrl,
            linkName: linkName || new URL(linkUrl).hostname
        });
    } else if (resourceType === 'MEDIA') {
        const mediaUrl = document.getElementById('media-url').value.trim();
        const mediaName = document.getElementById('media-name').value.trim();
        if (!mediaUrl) {
            throw new Error('Por favor ingresa una URL del media');
        }
        resources.push({
            resourceType: 'MEDIA',
            mediaUrl: mediaUrl,
            mediaName: mediaName || 'Media'
        });
    }

    return resources;
}

// Enviar formulario
formElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        // Limpiar errores previos
        errorDiv.classList.add('hidden');

        const resourceType = resourceTypeSelect.value;
        const entryTitle = document.getElementById('entry-title').value.trim();
        const entryDescription = document.getElementById('entry-description').value.trim();
        const apiUrl = apiUrlInput.value;

        if (!resourceType) {
            throw new Error('Por favor selecciona un tipo de recurso');
        }

        if (!entryTitle) {
            throw new Error('Por favor ingresa un título para la entry');
        }

        // Crear recursos
        const resources = createResourceObject(resourceType);

        // Construir el payload para la API
        const payload = {
            title: entryTitle,
            description: entryDescription,
            resources: resources
        };

        console.log('Enviando payload:', payload);

        // Mostrar loading
        formElement.style.display = 'none';
        loadingDiv.classList.remove('hidden');

        // Enviar a la API
        const response = await fetch(`${apiUrl}/api/entries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || 
                `Error ${response.status}: No se pudo crear la entry`
            );
        }

        // Éxito
        loadingDiv.classList.add('hidden');
        successDiv.classList.remove('hidden');

        // Cerrar automáticamente después de 2 segundos
        setTimeout(() => {
            window.close();
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        loadingDiv.classList.add('hidden');
        formElement.style.display = 'flex';
        formElement.style.flexDirection = 'column';

        errorDiv.textContent = error.message || 'Ocurrió un error al crear la entry';
        errorDiv.classList.remove('hidden');
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await loadPageInfo();
    await loadApiConfig();
});
