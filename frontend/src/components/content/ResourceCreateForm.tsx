import { FormEvent } from "react";
import { useI18n } from "../../i18n/I18nProvider";
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
  const { t } = useI18n();

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
        <option value="">{t("resourceCreate.selectEntry")}</option>
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
        <option value="TEXT">{t("resourceType.raw")}</option>
        <option value="LINK">{t("resourceType.link")}</option>
        <option value="MEDIA">{t("resourceType.media")}</option>
      </select>

      <input
        type="text"
        placeholder={t("resourceCreate.titlePlaceholder")}
        className={inputClass}
        value={values.title}
        onChange={(event) => onChange({ title: event.target.value })}
      />

      {(values.type === "RAW" || values.type === "TEXT") && (
        <textarea
          placeholder={t("resourceCreate.textPlaceholder")}
          className={textareaClass}
          value={values.textContent}
          onChange={(event) => onChange({ textContent: event.target.value })}
        />
      )}

      {values.type === "LINK" && (
        <input
          type="url"
          placeholder={t("resourceCreate.linkPlaceholder")}
          className={inputClass}
          value={values.url}
          onChange={(event) => onChange({ url: event.target.value })}
        />
      )}

      {values.type === "MEDIA" && (
        <>
          <input
            type="text"
            placeholder={t("resourceCreate.storageKeyPlaceholder")}
            className={inputClass}
            value={values.storageKey}
            onChange={(event) => onChange({ storageKey: event.target.value })}
          />
          <input
            type="text"
            placeholder={t("resourceCreate.fileNamePlaceholder")}
            className={inputClass}
            value={values.fileName}
            onChange={(event) => onChange({ fileName: event.target.value })}
          />
          <input
            type="text"
            placeholder={t("resourceCreate.mimeTypePlaceholder")}
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
        {submitting ? t("common.saving") : t("resourceCreate.submit")}
      </button>
    </form>
  );
}
