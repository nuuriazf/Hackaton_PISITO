import { FormEvent, useEffect, useState } from "react";
import { createResource, deleteResource, fetchResources, uploadResourceFile } from "./api/resources";
import type { ResourceType, SavedResource } from "./types/resource";

const uploadTypes: ResourceType[] = ["IMAGE", "PHOTO", "FILE"];
const urlTypes: ResourceType[] = ["LINK", "VIDEO"];

function App() {
  const [resources, setResources] = useState<SavedResource[]>([]);
  const [type, setType] = useState<ResourceType>("TEXT");
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadResources() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchResources();
      setResources(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, []);

  function resetForm() {
    setTitle("");
    setTextContent("");
    setExternalUrl("");
    setSelectedFile(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSending(true);
      setError(null);

      if (type === "TEXT") {
        if (!textContent.trim()) {
          throw new Error("Para TEXT debes escribir contenido.");
        }
        await createResource({
          type,
          title,
          textContent
        });
      } else if (urlTypes.includes(type)) {
        if (!externalUrl.trim()) {
          throw new Error(`Para ${type} debes indicar una URL.`);
        }
        await createResource({
          type,
          title,
          externalUrl
        });
      } else {
        if (!selectedFile) {
          throw new Error("Debes seleccionar un archivo para subir.");
        }
        await uploadResourceFile(type, selectedFile, title);
      }

      resetForm();
      await loadResources();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function onDelete(id: number) {
    try {
      await deleteResource(id);
      await loadResources();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="container">
      <section className="card">
        <h1>Pisito Content Hub</h1>
        <p className="subtitle">Plantilla Front + Back para texto, links, videos y archivos</p>

        <form className="form" onSubmit={onSubmit}>
          <select value={type} onChange={(event) => setType(event.target.value as ResourceType)}>
            <option value="TEXT">TEXT</option>
            <option value="LINK">LINK</option>
            <option value="VIDEO">VIDEO</option>
            <option value="IMAGE">IMAGE</option>
            <option value="PHOTO">PHOTO</option>
            <option value="FILE">FILE</option>
          </select>
          <input
            type="text"
            placeholder="Titulo (opcional)"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          {type === "TEXT" && (
            <textarea
              placeholder="Texto a guardar"
              value={textContent}
              onChange={(event) => setTextContent(event.target.value)}
            />
          )}

          {urlTypes.includes(type) && (
            <input
              type="url"
              placeholder="https://..."
              value={externalUrl}
              onChange={(event) => setExternalUrl(event.target.value)}
            />
          )}

          {uploadTypes.includes(type) && (
            <input
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
          )}

          <button type="submit" disabled={sending}>
            {sending ? "Enviando..." : "Enviar al backend"}
          </button>
        </form>

        {loading && <p>Cargando...</p>}
        {error && <p className="error">Error: {error}</p>}

        {!loading && resources.length === 0 && <p>No hay recursos todavia.</p>}

        <ul className="list">
          {resources.map((resource) => (
            <li key={resource.id} className="resource-item">
              <div>
                <span className="badge">{resource.type}</span>
                {resource.title && <strong>{resource.title}</strong>}

                {resource.textContent && <p>{resource.textContent}</p>}

                {resource.externalUrl && (
                  <p>
                    <a href={resource.externalUrl} target="_blank" rel="noreferrer">
                      {resource.externalUrl}
                    </a>
                  </p>
                )}

                {resource.accessUrl && (
                  <p>
                    <a href={resource.accessUrl} target="_blank" rel="noreferrer">
                      Ver archivo guardado
                    </a>
                  </p>
                )}
              </div>

              <button type="button" onClick={() => onDelete(resource.id)}>
                Borrar
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;
