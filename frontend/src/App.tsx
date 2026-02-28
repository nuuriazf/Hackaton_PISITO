import { FormEvent, useEffect, useState } from "react";
import {
  createEntry,
  createLinkResource,
  createMediaResource,
  createTextResource,
  deleteEntry,
  deleteResource,
  fetchEntries
} from "./api/resources";
import type { EntryItem, ResourceType } from "./types/resource";

function App() {
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<number | "">("");
  const [newEntryTitle, setNewEntryTitle] = useState("");

  const [type, setType] = useState<ResourceType>("TEXT");
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [url, setUrl] = useState("");
  const [storageKey, setStorageKey] = useState("");
  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadEntries() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEntries();
      setEntries(data);

      if (data.length > 0) {
        if (selectedEntryId === "" || !data.some((entry) => entry.id === selectedEntryId)) {
          setSelectedEntryId(data[0].id);
        }
      } else {
        setSelectedEntryId("");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  function resetResourceForm() {
    setTitle("");
    setTextContent("");
    setUrl("");
    setStorageKey("");
    setFileName("");
    setMimeType("");
  }

  async function onCreateEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newEntryTitle.trim()) return;

    try {
      setSending(true);
      setError(null);
      const created = await createEntry(newEntryTitle.trim());
      setNewEntryTitle("");
      setSelectedEntryId(created.id);
      await loadEntries();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function onCreateResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedEntryId === "") {
      setError("Primero crea una Entry.");
      return;
    }

    try {
      setSending(true);
      setError(null);

      if (type === "TEXT") {
        if (!textContent.trim()) {
          throw new Error("Para TEXT debes indicar textContent.");
        }
        await createTextResource(selectedEntryId, { title, textContent });
      } else if (type === "LINK") {
        if (!url.trim()) {
          throw new Error("Para LINK debes indicar URL.");
        }
        await createLinkResource(selectedEntryId, { title, url });
      } else {
        if (!storageKey.trim()) {
          throw new Error("Para MEDIA debes indicar storageKey.");
        }
        await createMediaResource(selectedEntryId, {
          title,
          storageKey,
          fileName,
          mimeType
        });
      }

      resetResourceForm();
      await loadEntries();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function onDeleteResource(entryId: number, resourceId: number) {
    try {
      await deleteResource(entryId, resourceId);
      await loadEntries();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onDeleteEntry(entryId: number) {
    try {
      await deleteEntry(entryId);
      await loadEntries();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="container">
      <section className="card">
        <h1>Pisito Content Hub</h1>
        <p className="subtitle">Modelo Entry - Resource (Text, Link, Media)</p>

        <form className="form" onSubmit={onCreateEntry}>
          <input
            type="text"
            placeholder="Nueva Entry (ej: Ideas de producto)"
            value={newEntryTitle}
            onChange={(event) => setNewEntryTitle(event.target.value)}
          />
          <button type="submit" disabled={sending}>
            Crear Entry
          </button>
        </form>

        <form className="form" onSubmit={onCreateResource}>
          <select
            value={selectedEntryId}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedEntryId(value === "" ? "" : Number(value));
            }}
          >
            <option value="">Selecciona Entry</option>
            {entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>

          <select value={type} onChange={(event) => setType(event.target.value as ResourceType)}>
            <option value="TEXT">TEXT</option>
            <option value="LINK">LINK</option>
            <option value="MEDIA">MEDIA</option>
          </select>

          <input
            type="text"
            placeholder="Titulo del recurso (opcional)"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          {type === "TEXT" && (
            <textarea
              placeholder="textContent"
              value={textContent}
              onChange={(event) => setTextContent(event.target.value)}
            />
          )}

          {type === "LINK" && (
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          )}

          {type === "MEDIA" && (
            <>
              <input
                type="text"
                placeholder="storageKey (ej: media/foto.png o media/video.mp4)"
                value={storageKey}
                onChange={(event) => setStorageKey(event.target.value)}
              />
              <input
                type="text"
                placeholder="fileName (opcional)"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
              />
              <input
                type="text"
                placeholder="mimeType (opcional)"
                value={mimeType}
                onChange={(event) => setMimeType(event.target.value)}
              />
            </>
          )}

          <button type="submit" disabled={sending || selectedEntryId === ""}>
            {sending ? "Guardando..." : "Guardar recurso"}
          </button>
        </form>

        {loading && <p>Cargando...</p>}
        {error && <p className="error">Error: {error}</p>}

        {!loading && entries.length === 0 && <p>No hay entries todavia.</p>}

        <ul className="list">
          {entries.map((entry) => (
            <li key={entry.id} className="resource-item">
              <div>
                <strong>{entry.title}</strong>
                {entry.resources.length === 0 && <p>Sin recursos</p>}
                {entry.resources.map((resource) => (
                  <p key={resource.id}>
                    <span className="badge">{resource.type}</span>
                    {resource.title ? `${resource.title} - ` : ""}
                    {resource.textContent || resource.url || resource.storageKey || "Sin contenido"}
                    {" "}
                    <button
                      type="button"
                      onClick={() => onDeleteResource(entry.id, resource.id)}
                    >
                      Borrar recurso
                    </button>
                  </p>
                ))}
              </div>

              <button type="button" onClick={() => onDeleteEntry(entry.id)}>
                Borrar entry
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;
