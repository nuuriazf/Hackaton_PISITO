import { useEffect, useState } from "react";
import { fetchEntries, uploadDocument } from "./services/backendService";
import type { Entry } from "./types/entry";

function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadEntries() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEntries();
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

  async function onUpload() {
    if (!selectedFile) {
      setUploadMessage("Selecciona un archivo antes de subir.");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage(null);
      setError(null);
      await uploadDocument(selectedFile);
      setUploadMessage("Archivo subido correctamente.");
      setSelectedFile(null);
      await loadEntries();
    } catch (err) {
      setUploadMessage(null);
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="container">
      <section className="card">
        <h1>Entries</h1>
        <p className="subtitle">NOTAS</p>
        <div className="form">
          <input
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <button type="button" onClick={onUpload} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir documento"}
          </button>
          {uploadMessage && <p>{uploadMessage}</p>}
        </div>

        {loading && <p>Cargando...</p>}
        {error && <p className="error">Error: {error}</p>}

        {!loading && entries.length === 0 && <p>No hay entries todavia.</p>}

        <ul className="list">
          {entries.map((entry, index) => (
            <li key={entry.id ?? `entry-${index}`} className="resource-item">
              <div>
                <span className="badge">#{entry.id ?? index + 1}</span>
                <strong>{String(entry.title ?? "Sin titulo")}</strong>
                <p>{JSON.stringify(entry, null, 2)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;
