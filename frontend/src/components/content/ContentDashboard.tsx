import { FormEvent } from "react";
import type { ResourceFormValues } from "../../features/content/resourceForm";
import type { EntryItem } from "../../types/resource";
import {
  errorTextClass,
  ghostButtonClass,
  pageTitleClass,
  panelClass,
  subtitleClass
} from "../ui/styles";
import { EntriesList } from "./EntriesList";
import { EntryCreateForm } from "./EntryCreateForm";
import { ResourceCreateForm } from "./ResourceCreateForm";

type ContentDashboardProps = {
  username: string;
  entries: EntryItem[];
  newEntryTitle: string;
  resourceForm: ResourceFormValues;
  loading: boolean;
  sending: boolean;
  error: string | null;
  onLogout: () => void;
  onEntryTitleChange: (value: string) => void;
  onResourceFormChange: (patch: Partial<ResourceFormValues>) => void;
  onCreateEntry: (event: FormEvent<HTMLFormElement>) => void;
  onCreateResource: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteEntry: (entryId: number) => void;
  onDeleteResource: (entryId: number, resourceId: number) => void;
};

export function ContentDashboard({
  username,
  entries,
  newEntryTitle,
  resourceForm,
  loading,
  sending,
  error,
  onLogout,
  onEntryTitleChange,
  onResourceFormChange,
  onCreateEntry,
  onCreateResource,
  onDeleteEntry,
  onDeleteResource
}: ContentDashboardProps) {
  return (
    <section className={panelClass}>
      <div className="mb-4 grid gap-2.5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h1 className={pageTitleClass}>Pisito Content Hub</h1>
          <p className={subtitleClass}>Modelo Entry - Resource (Text, Link, Media)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-sm text-brand-700">
            @{username}
          </span>
          <button type="button" className={ghostButtonClass} onClick={onLogout}>
            Cerrar sesion
          </button>
        </div>
      </div>

      <EntryCreateForm
        value={newEntryTitle}
        submitting={sending}
        onChange={onEntryTitleChange}
        onSubmit={onCreateEntry}
      />

      <ResourceCreateForm
        entries={entries}
        values={resourceForm}
        submitting={sending}
        onChange={onResourceFormChange}
        onSubmit={onCreateResource}
      />

      {loading && <p className="text-sm text-ink-600">Cargando...</p>}
      {error && <p className={errorTextClass}>Error: {error}</p>}
      {!loading && entries.length === 0 && <p className="text-sm text-ink-600">No hay entries todavia.</p>}

      <EntriesList
        entries={entries}
        busy={sending}
        onDeleteEntry={onDeleteEntry}
        onDeleteResource={onDeleteResource}
      />
    </section>
  );
}
