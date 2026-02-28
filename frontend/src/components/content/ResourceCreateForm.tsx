import { FormEvent } from "react";
import type { EntryItem, ResourceType } from "../../types/resource";
import type { ResourceFormValues } from "../../features/content/resourceForm";
import { formStackClass, inputClass, primaryButtonClass, textareaClass } from "../ui/styles";

type ResourceCreateFormProps = {
  entries: EntryItem[];
  values: ResourceFormValues;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (patch: Partial<ResourceFormValues>) => void;
};

export function ResourceCreateForm({
  entries,
  values,
  submitting,
  onSubmit,
  onChange
}: ResourceCreateFormProps) {
  return (
    <form className={formStackClass} onSubmit={onSubmit}>
      <select
        className={inputClass}
        value={values.selectedEntryId}
        onChange={(event) => {
          const selected = event.target.value;
          onChange({ selectedEntryId: selected === "" ? "" : Number(selected) });
        }}
      >
        <option value="">Selecciona Entry</option>
        {entries.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.title}
          </option>
        ))}
      </select>

      <select
        className={inputClass}
        value={values.type}
        onChange={(event) => onChange({ type: event.target.value as ResourceType })}
      >
        <option value="TEXT">TEXT</option>
        <option value="LINK">LINK</option>
        <option value="MEDIA">MEDIA</option>
      </select>

      <input
        type="text"
        placeholder="Titulo del recurso (opcional)"
        className={inputClass}
        value={values.title}
        onChange={(event) => onChange({ title: event.target.value })}
      />

      {values.type === "TEXT" && (
        <textarea
          placeholder="textContent"
          className={textareaClass}
          value={values.textContent}
          onChange={(event) => onChange({ textContent: event.target.value })}
        />
      )}

      {values.type === "LINK" && (
        <input
          type="url"
          placeholder="https://..."
          className={inputClass}
          value={values.url}
          onChange={(event) => onChange({ url: event.target.value })}
        />
      )}

      {values.type === "MEDIA" && (
        <>
          <input
            type="text"
            placeholder="storageKey (ej: media/foto.png o media/video.mp4)"
            className={inputClass}
            value={values.storageKey}
            onChange={(event) => onChange({ storageKey: event.target.value })}
          />
          <input
            type="text"
            placeholder="fileName (opcional)"
            className={inputClass}
            value={values.fileName}
            onChange={(event) => onChange({ fileName: event.target.value })}
          />
          <input
            type="text"
            placeholder="mimeType (opcional)"
            className={inputClass}
            value={values.mimeType}
            onChange={(event) => onChange({ mimeType: event.target.value })}
          />
        </>
      )}

      <button
        type="submit"
        className={primaryButtonClass}
        disabled={submitting || values.selectedEntryId === ""}
      >
        {submitting ? "Guardando..." : "Guardar recurso"}
      </button>
    </form>
  );
}
