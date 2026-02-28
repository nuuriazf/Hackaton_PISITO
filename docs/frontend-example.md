# Frontend - Ejemplo de creación de Entry con recursos

## TypeScript/React - Crear Entry con multipart/form-data

```typescript
async function createEntryWithResources(
  title: string,
  userId: number,
  textResources: string[] = [],
  linkResources: string[] = [],
  mediaFiles: File[] = []
): Promise<EntryResponse> {
  const formData = new FormData();
  
  // Agregar título y userId
  formData.append('title', title);
  formData.append('userId', userId.toString());
  
  // Agregar recursos de texto
  textResources.forEach(text => {
    formData.append('textResources', text);
  });
  
  // Agregar recursos de link
  linkResources.forEach(url => {
    formData.append('linkResources', url);
  });
  
  // Agregar archivos de media
  mediaFiles.forEach(file => {
    formData.append('mediaFiles', file);
  });
  
  const response = await fetch('http://localhost:8080/api/entries', {
    method: 'POST',
    body: formData, // FormData se serializa automáticamente como multipart/form-data
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create entry: ${response.statusText}`);
  }
  
  return response.json() as Promise<EntryResponse>;
}

// Ejemplo de uso
const files = [
  document.getElementById('file1') as HTMLInputElement,
  document.getElementById('file2') as HTMLInputElement,
];

const fileList = files
  .flatMap(input => Array.from(input.files || []))
  .filter(file => file !== undefined);

const entry = await createEntryWithResources(
  'Mi primera entrada',
  1,
  ['Nota importante', 'Otro texto'],
  ['https://example.com', 'https://google.com'],
  fileList
);

console.log('Entry creada:', entry);
```

## Notas importantes

- **FormData**: Se convierte automáticamente a `multipart/form-data`
- **Arrays**: Los parámetros repetidos (textResources, linkResources, mediaFiles) se envían como arrays
- **Archivos**: Los campos `mediaFiles` deben ser objetos `File` reales, no strings
- **Validación**: El backend valida que el título no esté vacío

## Usando client.ts (si tienes un cliente HTTP configurado)

```typescript
export async function createEntryWithResources(
  title: string,
  userId: number,
  options?: {
    textResources?: string[];
    linkResources?: string[];
    mediaFiles?: File[];
  }
): Promise<EntryResponse> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('userId', userId.toString());
  
  options?.textResources?.forEach(text => {
    formData.append('textResources', text);
  });
  
  options?.linkResources?.forEach(url => {
    formData.append('linkResources', url);
  });
  
  options?.mediaFiles?.forEach(file => {
    formData.append('mediaFiles', file);
  });
  
  return apiClient.post<EntryResponse>('/entries', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
```

## Eliminación de recursos

```typescript
async function deleteResource(entryId: number, resourceId: number): Promise<void> {
  const response = await fetch(
    `http://localhost:8080/api/entries/${entryId}/resources/${resourceId}`,
    {
      method: 'DELETE',
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to delete resource: ${response.statusText}`);
  }
}
```
