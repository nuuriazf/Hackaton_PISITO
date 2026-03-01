import { useI18n } from "../../i18n/I18nProvider";
import type { EntryItem } from "../../types/resource";
import { dangerButtonClass, ghostButtonClass } from "../ui/styles";

type EntriesListProps = {
  entries: EntryItem[];
  busy: boolean;
  onDeleteEntry: (entryId: number) => void;
  onDeleteResource: (entryId: number, resourceId: number) => void;
};

export function EntriesList({ entries, busy, onDeleteEntry, onDeleteResource }: EntriesListProps) {
  const { t } = useI18n();

  return (
    <ul className="m-0 grid list-none gap-2.5 p-0">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="grid gap-3 rounded-control border border-brand-200 bg-brand-50/70 p-3 md:grid-cols-[1fr_auto] md:items-start"
        >
          <div className="grid gap-2">
            <strong className="text-ink-900">{entry.title}</strong>
            {entry.resources.length === 0 && <p className="m-0 text-sm text-ink-500">{t("entries.noResources")}</p>}
            {entry.resources.map((resource) => (
              <div key={resource.id} className="flex flex-wrap items-center gap-2 text-sm text-ink-700">
                <span className="inline-flex rounded-full border border-brand-200 bg-white/25 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-brand-700">
                  {resource.type}
                </span>
                <span className="break-all">
                  {resource.title ? `${resource.title} - ` : ""}
                  {resource.textContent || resource.url || resource.storageKey || t("entries.noContent")}
                </span>
                <button
                  type="button"
                  className={ghostButtonClass}
                  disabled={busy}
                  onClick={() => onDeleteResource(entry.id, resource.id)}
                >
                  {t("entries.deleteResource")}
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={dangerButtonClass}
            disabled={busy}
            onClick={() => onDeleteEntry(entry.id)}
          >
            {t("entries.deleteEntry")}
          </button>
        </li>
      ))}
    </ul>
  );
}
