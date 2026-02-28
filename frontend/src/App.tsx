import { useEffect, useState } from "react";
import { getEntries, createEntry, deleteEntry, deleteResource } from "./services/backendService";
import type { Entry } from "./types/entry";
import "./styles/app.css";

const DEFAULT_USER_ID = 1; // Para demo

function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [textInputs, setTextInputs] = useState<string[]>([]);
  const [linkInputs, setLinkInputs] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  async function loadEntries() {
    try {
      setLoading(true);
      setError(null);
      const data = await getEntries();
      setEntries(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título es requerido");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const newEntry = await createEntry({
        title,
        userId: DEFAULT_USER_ID,
        textResources: textInputs.filter(t => t.trim()),
        linkResources: linkInputs.filter(l => l.trim()),
        mediaFiles: selectedFiles
      });

      setTitle("");
      setTextInputs([]);
      setLinkInputs([]);
      setSelectedFiles([]);
      await loadEntries();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteEntry(id: number) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta entrada?")) {
      return;
    }
    try {
      await deleteEntry(id);
      await loadEntries();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteResource(entryId: number, resourceId: number) {
    if (!confirm("¿Estás seguro de que quieres eliminar este recurso?")) {
      return;
    }
    try {
      await deleteResource(entryId, resourceId);
      await loadEntries();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const addTextInput = () => setTextInputs([...textInputs, ""]);
  const addLinkInput = () => setLinkInputs([...linkInputs, ""]);
  
  const updateTextInput = (index: number, value: string) => {
    const updated = [...textInputs];
    updated[index] = value;
    setTextInputs(updated);
  };

  const updateLinkInput = (index: number, value: string) => {
    const updated = [...linkInputs];
    updated[index] = value;
    setLinkInputs(updated);
  };

  const removeTextInput = (index: number) => {
    setTextInputs(textInputs.filter((_, i) => i !== index));
  };

  const removeLinkInput = (index: number) => {
    setLinkInputs(linkInputs.filter((_, i) => i !== index));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setSelectedFiles(files);
  };

  return (
    <main className="container">
      <section className="card">
        <h1>Crear Nueva Entrada</h1>
        <form onSubmit={handleCreateEntry} className="form">
          <div className="form-group">
            <label htmlFor="title">Título:</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Ideas de producto"
              maxLength={120}
            />
          </div>

          <div className="form-group">
            <label>Recursos de texto:</label>
            {textInputs.map((text, index) => (
              <div key={index} className="input-group">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => updateTextInput(index, e.target.value)}
                  placeholder="Escribe un texto..."
                  maxLength={4000}
                />
                <button
                  type="button"
                  onClick={() => removeTextInput(index)}
                  className="btn-remove"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={addTextInput} className="btn-add">
              + Agregar texto
            </button>
          </div>

          <div className="form-group">
            <label>Recursos de link:</label>
            {linkInputs.map((link, index) => (
              <div key={index} className="input-group">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updateLinkInput(index, e.target.value)}
                  placeholder="https://example.com"
                  maxLength={1000}
                />
                <button
                  type="button"
                  onClick={() => removeLinkInput(index)}
                  className="btn-remove"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={addLinkInput} className="btn-add">
              + Agregar link
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="files">Archivos:</label>
            <input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
            />
            {selectedFiles.length > 0 && (
              <div className="file-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    📄 {file.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="error">❌ Error: {error}</p>}

          <button type="submit" disabled={creating || !title.trim()}>
            {creating ? "Creando..." : "Crear Entrada"}
          </button>
        </form>
      </section>

      <section className="card">
        <h1>Entradas</h1>
        {loading && <p>Cargando...</p>}
        {!loading && entries.length === 0 && <p>No hay entradas todavía.</p>}

        {!loading && entries.length > 0 && (
          <ul className="entries-list">
            {entries.map((entry) => (
              <li key={entry.id} className="entry-item">
                <div className="entry-header">
                  <h3>{entry.title}</h3>
                  <div className="entry-meta">
                    <small>{new Date(entry.createDate).toLocaleString()}</small>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="btn-delete"
                      title="Eliminar entrada"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {entry.resources.length > 0 && (
                  <div className="resources">
                    <h4>Recursos ({entry.resources.length}):</h4>
                    <ul className="resource-list">
                      {entry.resources.map((resource) => (
                        <li key={resource.id} className={`resource-item type-${resource.type}`}>
                          <div className="resource-content">
                            {resource.type === "TEXT" && (
                              <div>
                                <strong>Texto:</strong>
                                <p>{resource.textContent}</p>
                              </div>
                            )}
                            {resource.type === "LINK" && (
                              <div>
                                <strong>Link:</strong>
                                <a href={resource.url!} target="_blank" rel="noopener noreferrer">
                                  {resource.url}
                                </a>
                              </div>
                            )}
                            {resource.type === "MEDIA" && (
                              <div>
                                <strong>Archivo:</strong>
                                <p>{resource.storageKey}</p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteResource(entry.id, resource.id)}
                            className="btn-delete-resource"
                            title="Eliminar recurso"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;

