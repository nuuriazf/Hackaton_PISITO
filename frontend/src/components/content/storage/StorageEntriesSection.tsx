import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../../../i18n/I18nProvider";
import type { EntryItem } from "../../../types/resource";
import { errorTextClass, fieldLabelClass, inputClass } from "../../ui/styles";
import { PencilSquareIcon, TextComponentIcon, XMarkIcon } from "../../ui/icons";

type StorageEntriesSectionProps = {
  entries: EntryItem[];
  loading: boolean;
  error: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

function buildEntrySearchableText(entry: EntryItem) {
  const resourcesText = entry.resources
    .map((resource) =>
      [resource.title, resource.textContent, resource.url, resource.storageKey, resource.fileName]
        .filter(Boolean)
        .join(" ")
    )
    .join(" ");

  return `${entry.title} ${resourcesText}`.toLowerCase();
}

function buildEntryText(entry: EntryItem, emptyText: string) {
  const textResources = entry.resources
    .filter((resource) => resource.type === "TEXT")
    .map((resource) => resource.textContent?.trim() ?? "")
    .filter(Boolean);

  if (textResources.length > 0) {
    return textResources.join(" ");
  }

  for (const resource of entry.resources) {
    const preview = resource.textContent ?? resource.url ?? resource.storageKey ?? resource.fileName ?? resource.title;
    if (preview) {
      return preview;
    }
  }

  return emptyText;
}

export function StorageEntriesSection({
  entries,
  loading,
  error,
  searchValue,
  onSearchChange
}: StorageEntriesSectionProps) {
  const { t } = useI18n();
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  const filteredEntries = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return entries;
    }

    return entries.filter((entry) => buildEntrySearchableText(entry).includes(query));
  }, [entries, searchValue]);

  const selectedEntry = useMemo(() => {
    if (selectedEntryId === null) {
      return null;
    }
    return entries.find((entry) => entry.id === selectedEntryId) ?? null;
  }, [entries, selectedEntryId]);

  useEffect(() => {
    if (selectedEntryId === null) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedEntryId(null);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedEntryId]);

  return (
    <section className="grid gap-4">
      <section className="rounded-card border border-brand-200 bg-white shadow-card">
        <div className="grid gap-3 px-4 py-4 md:px-5">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink-900">
            {t("section.storage")}
          </h2>
          <label className={fieldLabelClass}>
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("storage.searchPlaceholder")}
              className={inputClass}
              aria-label={t("storage.searchLabel")}
            />
          </label>
        </div>
      </section>

      {loading ? (
        <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
          <p className="text-sm font-medium text-ink-600">{t("storage.loading")}</p>
        </section>
      ) : error ? (
        <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
          <p className={errorTextClass}>{t("common.errorPrefix", { message: error })}</p>
        </section>
      ) : filteredEntries.length === 0 ? (
        <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
          <p className="text-sm font-medium text-ink-600">
            {searchValue.trim() ? t("storage.emptyFiltered") : t("storage.empty")}
          </p>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredEntries.map((entry) => {
              const selected = selectedEntryId === entry.id;

              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`relative grid gap-2 rounded-card border bg-white p-4 text-left shadow-card transition ${
                    selected
                      ? "border-brand-500 ring-2 ring-brand-100"
                      : "border-brand-200 hover:bg-brand-50"
                  }`}
                  onClick={() => setSelectedEntryId(entry.id)}
                >
                  <div className="pr-12">
                    <h3 className="break-words text-base font-extrabold leading-snug text-ink-900">
                      {entry.title}
                    </h3>
                  </div>
                  <TextComponentIcon className="pointer-events-none absolute right-4 top-4 h-7 w-7 text-brand-600" />
                  <div className="mt-2 h-px w-full bg-brand-200" />
                  <p className="break-words text-sm text-ink-700 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {buildEntryText(entry, t("entries.noContent"))}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedEntry && (
            <div
              className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/25 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label={t("storage.detailTitle")}
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedEntryId(null);
                }
              }}
            >
              <section className="w-full max-w-[560px] rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold tracking-tight text-ink-900">
                    {t("storage.detailTitle")}
                  </h3>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-rose-300 text-rose-700 transition hover:bg-rose-50"
                    aria-label={t("storage.closeDetailAria")}
                    onClick={() => setSelectedEntryId(null)}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-3">
                  <article className="flex items-start justify-between gap-3 rounded-control border border-brand-200 bg-white p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t("storage.detailEntryTitle")}
                      </p>
                      <p className="break-words text-base font-normal text-ink-900">{selectedEntry.title}</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-brand-200 text-brand-700 transition hover:bg-brand-100"
                      aria-label={t("storage.editFieldAria")}
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  </article>

                  <article className="flex items-start justify-between gap-3 rounded-control border border-brand-200 bg-white p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t("storage.detailDescription")}
                      </p>
                      <p className="break-words text-sm text-ink-700">
                        {buildEntryText(selectedEntry, t("entries.noContent"))}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-brand-200 text-brand-700 transition hover:bg-brand-100"
                      aria-label={t("storage.editFieldAria")}
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  </article>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </section>
  );
}
