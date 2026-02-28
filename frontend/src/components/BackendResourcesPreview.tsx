import { useEffect, useState } from "react";
import { fetchEntries } from "../services/backendService";
import type { Entry } from "../types/entry";

function BackendResourcesPreview() {
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEntries();
        setItems(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section>
      <h2>Vista rapida del backend</h2>
      {loading && <p>Cargando datos...</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && (
        <ul className="list">
          {items.slice(0, 5).map((item) => (
            <li key={item.id ?? JSON.stringify(item)} className="resource-item">
              <span className="badge">#{String(item.id ?? "-")}</span>
              <span>{String(item.title ?? `Entry`)}</span>
            </li>
          ))}
          {items.length === 0 && <li>No hay datos.</li>}
        </ul>
      )}
    </section>
  );
}

export default BackendResourcesPreview;
