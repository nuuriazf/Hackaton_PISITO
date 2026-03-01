import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isApiError } from "../../../api/client";
import {
  createTextResource,
  createFolder,
  fetchEntryFolders,
  fetchFolders,
  updateEntryTitle,
  updateEntryFolderSelection,
  updateTextResource
} from "../../../api/resources";
import { useI18n } from "../../../i18n/I18nProvider";
import type { EntryFolderItem, EntryItem, FolderItem } from "../../../types/resource";
import { readErrorMessage } from "../../../utils/error";
import { errorTextClass, fieldLabelClass, inputClass } from "../../ui/styles";
import {
  ArrowDownTrayIcon,
  ArrowLongLeftIcon,
  CreateFolderIcon,
  PencilSquareIcon,
  StorageIcon,
  TextComponentIcon,
  XMarkIcon
} from "../../ui/icons";
import { CreateFolderModal } from "./CreateFolderModal";

type StorageEntriesSectionProps = {
  entries: EntryItem[];
  loading: boolean;
  error: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onEntriesUpdated: () => Promise<void> | void;
  onUnauthorized: () => void;
  entryToOpenId?: number | null;
  onEntryToOpenHandled?: () => void;
};

const CHECKLIST_TITLES = new Set(["checklist", "todo list", "todolist", "todo"]);

function isChecklistResource(resource: EntryItem["resources"][number]) {
  if (resource.type !== "RAW") {
    return false;
  }
  const title = (resource.title ?? "").trim().toLowerCase();
  return CHECKLIST_TITLES.has(title);
}

function buildEntrySearchableText(entry: EntryItem) {
  const resourcesText = entry.resources
    .map((resource) =>
      [resource.title, resource.textContent, resource.url, resource.fileName, resource.mimeType]
        .filter(Boolean)
        .join(" ")
    )
    .join(" ");

  const tagsText = entry.tags?.map(tag => tag.name).join(" ") || "";

  return `${entry.title} ${resourcesText} ${tagsText}`.toLowerCase();
}

function buildEntryText(entry: EntryItem, emptyText: string) {
  const textResources = entry.resources
    .filter((resource) => resource.type === "RAW" && !isChecklistResource(resource))
    .map((resource) => resource.textContent?.trim() ?? "")
    .filter(Boolean);

  if (textResources.length > 0) {
    return textResources.join(" ");
  }

  for (const resource of entry.resources) {
    const preview = resource.textContent ?? resource.url ?? resource.fileName ?? resource.title;
    if (preview) {
      return preview;
    }
  }

  return emptyText;
}

function buildEntryTodoListText(entry: EntryItem): string | null {
  const todoResources = entry.resources
    .filter((resource) => isChecklistResource(resource))
    .map((resource) => resource.textContent?.trim() ?? "")
    .filter(Boolean);

  if (todoResources.length === 0) {
    return null;
  }
  return todoResources.join("\n\n");
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function detectCsvDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  const tabCount = (firstLine.match(/\t/g) ?? []).length;

  if (tabCount >= commaCount && tabCount >= semicolonCount && tabCount > 0) {
    return "\t";
  }
  if (semicolonCount >= commaCount && semicolonCount > 0) {
    return ";";
  }
  return ",";
}

function parseCsvTable(text: string): { headers: string[]; rows: string[][] } | null {
  if (!text.trim()) {
    return null;
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return null;
  }

  const delimiter = detectCsvDelimiter(text);
  const parsedRows = lines.map((line) => parseCsvLine(line, delimiter));
  const maxColumns = Math.max(...parsedRows.map((row) => row.length));

  if (maxColumns < 2) {
    return null;
  }

  const normalized = parsedRows.map((row) => {
    if (row.length >= maxColumns) {
      return row;
    }
    return [...row, ...Array(maxColumns - row.length).fill("")];
  });

  const [headers, ...rows] = normalized;
  return { headers, rows };
}

function renderTodoListMarkdown(markdown: string): ReactNode {
  const lines = markdown.split(/\r?\n/);

  return lines.map((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      return <div key={`spacer-${index}`} className="h-1" />;
    }

    if (line.startsWith("## ")) {
      return (
        <h4 key={`h2-${index}`} className="text-sm font-extrabold tracking-wide text-ink-900">
          {line.slice(3).trim()}
        </h4>
      );
    }

    if (line.startsWith("### ")) {
      return (
        <h5 key={`h3-${index}`} className="text-xs font-bold uppercase tracking-wide text-ink-600">
          {line.slice(4).trim()}
        </h5>
      );
    }

    if (line.startsWith("- [ ] ") || line.startsWith("- [x] ") || line.startsWith("- [X] ")) {
      const checked = line.startsWith("- [x] ") || line.startsWith("- [X] ");
      const content = line.slice(6).trim();
      return (
        <div key={`task-${index}`} className="flex items-start gap-2 rounded-control border border-brand-200 bg-brand-50 px-2.5 py-1.5">
          <span
            className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
              checked ? "border-brand-500 bg-brand-500 text-white" : "border-brand-300 bg-white text-transparent"
            }`}
            aria-hidden="true"
          >
            ✓
          </span>
          <p className="break-all whitespace-pre-wrap text-sm text-ink-800">{content}</p>
        </div>
      );
    }

    if (line.startsWith("- ")) {
      return (
        <div key={`bullet-${index}`} className="flex items-start gap-2 px-1">
          <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
          <p className="break-all whitespace-pre-wrap text-sm text-ink-700">{line.slice(2).trim()}</p>
        </div>
      );
    }

    return (
      <p key={`p-${index}`} className="break-all whitespace-pre-wrap text-sm text-ink-700">
        {line}
      </p>
    );
  });
}

function getEntryLinks(entry: EntryItem) {
  return entry.resources
    .filter((resource) => resource.type === "LINK" && Boolean(resource.url))
    .map((resource) => ({
      id: resource.id,
      title: resource.title?.trim() || resource.url!,
      url: resource.url!
    }));
}

function resolveMediaUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/api/uploads/")) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `/api${trimmed}`;
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  if (trimmed.startsWith("uploads/")) {
    return `/api/${trimmed}`;
  }
  return `/${trimmed}`;
}

function getEntryMedia(entry: EntryItem) {
  return entry.resources
    .filter((resource) => resource.type === "MEDIA")
    .map((resource) => ({
      id: resource.id,
      title: resource.title?.trim() || resource.fileName || "Archivo",
      fileName: resource.fileName || "archivo",
      mimeType: resource.mimeType || "",
      url: resolveMediaUrl(resource.storageKey)
    }))
    .filter((media) => Boolean(media.url));
}

function getEntryTagSet(entry: EntryItem) {
  return new Set((entry.tags ?? []).map((tag) => tag.name.trim().toLowerCase()).filter(Boolean));
}

function tokenizeEntryText(value: string) {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9áéíóúüñ]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
  );
}

function getJaccardScore(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function getRelatedEntries(entries: EntryItem[], selectedEntry: EntryItem, maxItems = 2) {
  const selectedTagSet = getEntryTagSet(selectedEntry);
  const selectedTokens = tokenizeEntryText(buildEntrySearchableText(selectedEntry));

  const candidates = entries
    .filter((entry) => entry.id !== selectedEntry.id)
    .map((entry) => {
      const candidateTagSet = getEntryTagSet(entry);
      let sharedTags = 0;
      for (const tag of selectedTagSet) {
        if (candidateTagSet.has(tag)) {
          sharedTags += 1;
        }
      }

      const textSimilarity = getJaccardScore(selectedTokens, tokenizeEntryText(buildEntrySearchableText(entry)));
      const hasRelation = sharedTags > 0 || textSimilarity > 0;
      const score = sharedTags * 3 + textSimilarity * 10;

      return {
        entry,
        sharedTags,
        textSimilarity,
        hasRelation,
        score
      };
    })
    .filter((candidate) => candidate.hasRelation)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.entry.updatedAt.localeCompare(a.entry.updatedAt);
    })
    .slice(0, maxItems)
    .map((candidate) => candidate.entry);

  return candidates;
}

export function StorageEntriesSection({
  entries,
  loading,
  error,
  searchValue,
  onSearchChange,
  onEntriesUpdated,
  onUnauthorized,
  entryToOpenId = null,
  onEntryToOpenHandled
}: StorageEntriesSectionProps) {
  const { t } = useI18n();
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [folderEntriesLoading, setFolderEntriesLoading] = useState(false);
  const [folderEntriesError, setFolderEntriesError] = useState<string | null>(null);
  const [folderEntryIds, setFolderEntryIds] = useState<number[]>([]);
  const [foldersViewActive, setFoldersViewActive] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [createFolderError, setCreateFolderError] = useState<string | null>(null);
  const [entryFolders, setEntryFolders] = useState<EntryFolderItem[]>([]);
  const [entryFoldersLoading, setEntryFoldersLoading] = useState(false);
  const [entryFoldersError, setEntryFoldersError] = useState<string | null>(null);
  const [entryFoldersOpen, setEntryFoldersOpen] = useState(false);
  const [updatingFolderId, setUpdatingFolderId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<"title" | "text" | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [textDraft, setTextDraft] = useState("");
  const [savingField, setSavingField] = useState<"title" | "text" | null>(null);
  const [detailSaveError, setDetailSaveError] = useState<string | null>(null);
  const [detailSaveSuccess, setDetailSaveSuccess] = useState<string | null>(null);
  const [carouselSliding, setCarouselSliding] = useState(false);
  const [carouselDirection, setCarouselDirection] = useState<"left" | "right" | null>(null);
  const [forcedLeftEntryId, setForcedLeftEntryId] = useState<number | null>(null);
  const [forcedRightEntryId, setForcedRightEntryId] = useState<number | null>(null);

  const entryFoldersMenuRef = useRef<HTMLDivElement | null>(null);
  const carouselTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredEntries = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return entries;
    }

    return entries.filter((entry) => buildEntrySearchableText(entry).includes(query));
  }, [entries, searchValue]);

  const filteredFolders = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return folders;
    }

    return folders.filter((folder) => folder.title.toLowerCase().includes(query));
  }, [folders, searchValue]);

  const selectedEntry = useMemo(() => {
    if (selectedEntryId === null) {
      return null;
    }
    return entries.find((entry) => entry.id === selectedEntryId) ?? null;
  }, [entries, selectedEntryId]);

  useEffect(() => {
    if (entryToOpenId === null) {
      return;
    }

    const targetEntry = entries.find((entry) => entry.id === entryToOpenId);
    if (!targetEntry) {
      if (!loading) {
        onEntryToOpenHandled?.();
      }
      return;
    }

    setFoldersViewActive(false);
    setSelectedFolder(null);
    setSelectedEntryId(targetEntry.id);
    onEntryToOpenHandled?.();
  }, [entries, entryToOpenId, loading, onEntryToOpenHandled]);
  const selectedEntryLinks = useMemo(
    () => (selectedEntry ? getEntryLinks(selectedEntry) : []),
    [selectedEntry]
  );
  const selectedEntryMedia = useMemo(
    () => (selectedEntry ? getEntryMedia(selectedEntry) : []),
    [selectedEntry]
  );

  const selectedTextResource = useMemo(() => {
    if (!selectedEntry) {
      return null;
    }
    return selectedEntry.resources.find((resource) => resource.type === "RAW" && !isChecklistResource(resource)) ?? null;
  }, [selectedEntry]);
  const selectedTodoListText = useMemo(() => {
    if (!selectedEntry) {
      return null;
    }
    return buildEntryTodoListText(selectedEntry);
  }, [selectedEntry]);
  
  const selectedCsvTable = useMemo(() => {
    if (!selectedEntry || selectedEntry.flag !== "TABLE") {
      return null;
    }
    const rawText = selectedTextResource?.textContent?.trim() ?? "";
    if (!rawText) {
      return null;
    }
    return parseCsvTable(rawText);
  }, [selectedEntry, selectedTextResource]);

  const relatedEntries = useMemo(() => {
    if (!selectedEntry) {
      return [];
    }
    return getRelatedEntries(entries, selectedEntry, 8);
  }, [entries, selectedEntry]);
  const entriesById = useMemo(() => {
    return new Map(entries.map((entry) => [entry.id, entry]));
  }, [entries]);
  const { leftRelatedEntry, rightRelatedEntry } = useMemo(() => {
    if (!selectedEntry) {
      return { leftRelatedEntry: null, rightRelatedEntry: null };
    }

    const candidates = relatedEntries.filter((entry) => entry.id !== selectedEntry.id);
    const usedIds = new Set<number>();

    let left: EntryItem | null = null;
    const forcedLeft = forcedLeftEntryId !== null ? entriesById.get(forcedLeftEntryId) ?? null : null;
    if (forcedLeft && forcedLeft.id !== selectedEntry.id) {
      left = forcedLeft;
      usedIds.add(forcedLeft.id);
    } else {
      left = candidates.find((entry) => !usedIds.has(entry.id)) ?? null;
      if (left) {
        usedIds.add(left.id);
      }
    }

    let right: EntryItem | null = null;
    const forcedRight = forcedRightEntryId !== null ? entriesById.get(forcedRightEntryId) ?? null : null;
    if (forcedRight && forcedRight.id !== selectedEntry.id && !usedIds.has(forcedRight.id)) {
      right = forcedRight;
      usedIds.add(forcedRight.id);
    } else {
      right = candidates.find((entry) => !usedIds.has(entry.id)) ?? null;
      if (right) {
        usedIds.add(right.id);
      }
    }

    if (!right) {
      right =
        entries.find((entry) => entry.id !== selectedEntry.id && !usedIds.has(entry.id)) ?? null;
    }

    return { leftRelatedEntry: left, rightRelatedEntry: right };
  }, [entries, entriesById, forcedLeftEntryId, forcedRightEntryId, relatedEntries, selectedEntry]);

  const selectedFolderEntries = useMemo(() => {
    if (!selectedFolder) {
      return [];
    }
    const allowedIds = new Set(folderEntryIds);
    return filteredEntries.filter((entry) => allowedIds.has(entry.id));
  }, [filteredEntries, folderEntryIds, selectedFolder]);

  const handleRequestError = useCallback(
    (requestError: unknown, setError: (message: string) => void) => {
      if (isApiError(requestError) && requestError.status === 401) {
        onUnauthorized();
        return;
      }
      setError(readErrorMessage(requestError, t("common.unexpectedError")));
    },
    [onUnauthorized, t]
  );

  const mapFoldersLoadError = useCallback(
    (requestError: unknown) => {
      if (isApiError(requestError) && requestError.status === 403) {
        return t("storage.folderForbidden");
      }
      if (isApiError(requestError) && requestError.status === 404) {
        return t("storage.foldersFeatureUnavailable");
      }
      return readErrorMessage(requestError, t("storage.foldersLoadError"));
    },
    [t]
  );

  const mapEntryFoldersLoadError = useCallback(
    (requestError: unknown) => {
      if (isApiError(requestError) && requestError.status === 403) {
        return t("storage.folderForbidden");
      }
      if (isApiError(requestError) && requestError.status === 404) {
        return t("storage.foldersFeatureUnavailable");
      }
      return readErrorMessage(requestError, t("storage.entryFoldersLoadError"));
    },
    [t]
  );

  const loadFolders = useCallback(async () => {
    try {
      setFoldersLoading(true);
      setFoldersError(null);
      const data = await fetchFolders();
      setFolders(data);
    } catch (requestError) {
      if (isApiError(requestError) && requestError.status === 401) {
        onUnauthorized();
        return;
      }
      setFoldersError(mapFoldersLoadError(requestError));
    } finally {
      setFoldersLoading(false);
    }
  }, [mapFoldersLoadError, onUnauthorized]);

  const loadEntryFolders = useCallback(
    async (entryId: number) => {
      try {
        setEntryFoldersLoading(true);
        setEntryFoldersError(null);
        const data = await fetchEntryFolders(entryId);
        setEntryFolders(data);
      } catch (requestError) {
        if (isApiError(requestError) && requestError.status === 401) {
          onUnauthorized();
          return;
        }
        setEntryFoldersError(mapEntryFoldersLoadError(requestError));
      } finally {
        setEntryFoldersLoading(false);
      }
    },
    [mapEntryFoldersLoadError, onUnauthorized]
  );

  const loadSelectedFolderEntries = useCallback(
    async (folderId: number) => {
      try {
        setFolderEntriesLoading(true);
        setFolderEntriesError(null);

        const relations = await Promise.all(
          entries.map(async (entry) => {
            const entryFolderItems = await fetchEntryFolders(entry.id);
            const belongsToFolder = entryFolderItems.some((folder) => folder.id === folderId && folder.selected);
            return belongsToFolder ? entry.id : null;
          })
        );

        setFolderEntryIds(relations.filter((entryId): entryId is number => entryId !== null));
      } catch (requestError) {
        if (isApiError(requestError) && requestError.status === 401) {
          onUnauthorized();
          return;
        }
        setFolderEntriesError(mapEntryFoldersLoadError(requestError));
        setFolderEntryIds([]);
      } finally {
        setFolderEntriesLoading(false);
      }
    },
    [entries, mapEntryFoldersLoadError, onUnauthorized]
  );

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    if (!selectedEntry) {
      setEntryFoldersOpen(false);
      setEntryFolders([]);
      setEntryFoldersError(null);
      setEditingField(null);
      setTitleDraft("");
      setTextDraft("");
      setDetailSaveError(null);
      setDetailSaveSuccess(null);
      setCarouselSliding(false);
      setCarouselDirection(null);
      setForcedLeftEntryId(null);
      setForcedRightEntryId(null);
      return;
    }

    setEditingField(null);
    setTitleDraft(selectedEntry.title);
    setTextDraft(selectedTextResource?.textContent ?? "");
    setDetailSaveError(null);
    setDetailSaveSuccess(null);
  }, [selectedEntry, selectedTextResource]);

  useEffect(() => {
    setSelectedEntryId(null);
    setEntryFoldersOpen(false);
  }, [selectedFolder]);

  useEffect(() => {
    if (!foldersViewActive || !selectedFolder) {
      setFolderEntryIds([]);
      setFolderEntriesError(null);
      setFolderEntriesLoading(false);
      return;
    }
    void loadSelectedFolderEntries(selectedFolder.id);
  }, [foldersViewActive, loadSelectedFolderEntries, selectedFolder]);

  useEffect(() => {
    if (selectedEntryId === null && !entryFoldersOpen && !createFolderModalOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedEntryId(null);
        setSelectedFolder(null);
        setEntryFoldersOpen(false);
        setCreateFolderModalOpen(false);
        setFoldersViewActive(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [createFolderModalOpen, entryFoldersOpen, selectedEntryId]);

  useEffect(() => {
    if (!entryFoldersOpen) {
      return;
    }

    function handleDocumentMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (entryFoldersOpen && !entryFoldersMenuRef.current?.contains(target)) {
        setEntryFoldersOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [entryFoldersOpen]);

  useEffect(() => {
    return () => {
      if (carouselTimeoutRef.current) {
        clearTimeout(carouselTimeoutRef.current);
      }
    };
  }, []);

  function iconToggleClass(active: boolean) {
    return [
      "inline-flex h-10 w-10 items-center justify-center rounded-control border transition",
      active
        ? "border-brand-500 bg-brand-500 text-white shadow-sm"
        : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
    ].join(" ");
  }

  function openCreateFolderModal() {
    setCreateFolderError(null);
    setNewFolderTitle("");
    setCreateFolderModalOpen(true);
  }

  function toggleFoldersView() {
    setFoldersViewActive((current) => {
      const next = !current;
      if (next) {
        setSelectedEntryId(null);
        setEntryFoldersOpen(false);
        setSelectedFolder(null);
        void loadFolders();
      } else {
        setSelectedFolder(null);
      }
      return next;
    });
  }

  function openFolder(folder: FolderItem) {
    setSelectedFolder(folder);
  }

  function handleFoldersHeaderButtonClick() {
    if (foldersViewActive && selectedFolder) {
      setSelectedFolder(null);
      return;
    }
    toggleFoldersView();
  }

  async function handleCreateFolder() {
    const title = newFolderTitle.trim();
    if (!title) {
      setCreateFolderError(t("storage.folderTitleRequired"));
      return;
    }

    try {
      setCreatingFolder(true);
      setCreateFolderError(null);
      await createFolder(title);
      setCreateFolderModalOpen(false);
      setNewFolderTitle("");
      await loadFolders();
      if (selectedEntry && entryFoldersOpen) {
        await loadEntryFolders(selectedEntry.id);
      }
    } catch (requestError) {
      if (isApiError(requestError) && requestError.status === 401) {
        onUnauthorized();
        return;
      }
      if (isApiError(requestError) && requestError.status === 403) {
        setCreateFolderError(t("storage.folderForbidden"));
        return;
      }
      if (isApiError(requestError) && requestError.status === 409) {
        setCreateFolderError(t("storage.folderAlreadyExists"));
        return;
      }
      setCreateFolderError(readErrorMessage(requestError, t("storage.folderCreateError")));
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleToggleEntryFolder(folder: EntryFolderItem) {
    if (!selectedEntry) {
      return;
    }

    try {
      setUpdatingFolderId(folder.id);
      setEntryFoldersError(null);
      const data = await updateEntryFolderSelection(selectedEntry.id, folder.id, !folder.selected);
      setEntryFolders(data);
      await loadFolders();
      if (foldersViewActive && selectedFolder) {
        await loadSelectedFolderEntries(selectedFolder.id);
      }
    } catch (requestError) {
      handleRequestError(requestError, setEntryFoldersError);
    } finally {
      setUpdatingFolderId(null);
    }
  }

  function openEntryFoldersMenu() {
    if (!selectedEntry) {
      return;
    }

    setEntryFoldersOpen((current) => {
      const next = !current;
      if (next) {
        void loadEntryFolders(selectedEntry.id);
      }
      return next;
    });
  }

  function startEditingField(field: "title" | "text") {
    setEditingField(field);
    setDetailSaveError(null);
    setDetailSaveSuccess(null);
  }

  function cancelEditingField() {
    if (!selectedEntry) {
      setEditingField(null);
      return;
    }
    setTitleDraft(selectedEntry.title);
    setTextDraft(selectedTextResource?.textContent ?? "");
    setEditingField(null);
    setDetailSaveError(null);
  }

  async function saveTitleChanges() {
    if (!selectedEntry) {
      return;
    }

    const nextTitle = titleDraft.trim();
    if (!nextTitle) {
      setDetailSaveError(t("inbox.titleRequired"));
      return;
    }

    try {
      setSavingField("title");
      setDetailSaveError(null);
      setDetailSaveSuccess(null);

      await updateEntryTitle(selectedEntry.id, nextTitle);
      await onEntriesUpdated();

      setEditingField(null);
      setDetailSaveSuccess(t("storage.detailSaved"));
    } catch (requestError) {
      if (isApiError(requestError) && requestError.status === 401) {
        onUnauthorized();
        return;
      }
      setDetailSaveError(readErrorMessage(requestError, t("common.unexpectedError")));
    } finally {
      setSavingField(null);
    }
  }

  async function saveTextChanges() {
    if (!selectedEntry) {
      return;
    }

    const nextText = textDraft.trim();
    if (!nextText) {
      setDetailSaveError(t("entries.textRequired"));
      return;
    }

    try {
      setSavingField("text");
      setDetailSaveError(null);
      setDetailSaveSuccess(null);

      if (selectedTextResource) {
        await updateTextResource(selectedEntry.id, selectedTextResource.id, {
          title: selectedTextResource.title ?? undefined,
          textContent: nextText
        });
      } else {
        await createTextResource(selectedEntry.id, {
          textContent: nextText
        });
      }

      await onEntriesUpdated();

      setEditingField(null);
      setDetailSaveSuccess(t("storage.detailSaved"));
    } catch (requestError) {
      if (isApiError(requestError) && requestError.status === 401) {
        onUnauthorized();
        return;
      }
      setDetailSaveError(readErrorMessage(requestError, t("common.unexpectedError")));
    } finally {
      setSavingField(null);
    }
  }

  function openRelatedEntry(entry: EntryItem, direction: "left" | "right") {
    if (selectedEntryId === entry.id || carouselSliding) {
      return;
    }

    const currentCenterId = selectedEntryId;
    setCarouselDirection(direction);
    setCarouselSliding(true);

    if (carouselTimeoutRef.current) {
      clearTimeout(carouselTimeoutRef.current);
    }

    carouselTimeoutRef.current = setTimeout(() => {
      setSelectedEntryId(entry.id);
      if (currentCenterId !== null) {
        if (direction === "right") {
          setForcedLeftEntryId(currentCenterId);
          setForcedRightEntryId(null);
        } else {
          setForcedRightEntryId(currentCenterId);
          setForcedLeftEntryId(null);
        }
      }
      setCarouselSliding(false);
      setCarouselDirection(null);
      carouselTimeoutRef.current = null;
    }, 320);
  }
  const carouselTranslateClass = carouselSliding
    ? carouselDirection === "left"
      ? "translate-x-[300px]"
      : carouselDirection === "right"
        ? "-translate-x-[300px]"
        : "translate-x-0"
    : "translate-x-0";
  const leftCardScaleClass = carouselSliding
    ? carouselDirection === "left"
      ? "scale-[1.02] opacity-100"
      : "scale-[0.88] opacity-75"
    : "scale-95 opacity-95";
  const centerCardScaleClass = carouselSliding ? "scale-[0.93] opacity-90" : "scale-100 opacity-100";
  const rightCardScaleClass = carouselSliding
    ? carouselDirection === "right"
      ? "scale-[1.02] opacity-100"
      : "scale-[0.88] opacity-75"
    : "scale-95 opacity-95";

  const showingEntries = foldersViewActive && selectedFolder ? selectedFolderEntries : filteredEntries;

  return (
    <section className="grid gap-4">
      <section className="rounded-card border border-brand-200 bg-white shadow-card">
        <div className="grid gap-3 px-4 py-4 md:px-5">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink-900">
            {foldersViewActive && selectedFolder ? selectedFolder.title : t("section.storage")}
          </h2>

          <div className="flex items-center gap-2">
            <label className={`${fieldLabelClass} flex-1`}>
              <input
                type="text"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t("storage.searchPlaceholder")}
                className={inputClass}
                aria-label={t("storage.searchLabel")}
              />
            </label>

            <div className="shrink-0">
              <button
                type="button"
                className={iconToggleClass(foldersViewActive)}
                aria-label={foldersViewActive && selectedFolder ? t("common.back") : t("storage.foldersToggleAria")}
                onClick={handleFoldersHeaderButtonClick}
              >
                {foldersViewActive && selectedFolder ? (
                  <ArrowLongLeftIcon className="h-6 w-6" />
                ) : (
                  <StorageIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {foldersViewActive && !selectedFolder ? (
        <>
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-control border border-brand-200 bg-white px-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              aria-label={t("storage.createFolderAria")}
              onClick={openCreateFolderModal}
              disabled={creatingFolder}
            >
              <CreateFolderIcon className="h-5 w-5" />
              <span>{t("storage.createFolder")}</span>
            </button>
          </div>

          {foldersError ? (
            <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
              <p className="text-sm font-medium text-ink-600">{foldersError}</p>
            </section>
          ) : null}

          {foldersLoading ? (
            <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
              <p className="text-sm font-medium text-ink-600">{t("storage.loading")}</p>
            </section>
          ) : filteredFolders.length === 0 ? (
            <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
              <p className="text-sm font-medium text-ink-600">{t("storage.noFolders")}</p>
            </section>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
            >
              {filteredFolders.map((folder) => (
                <button
                  key={`folder-${folder.id}`}
                  type="button"
                  className="col-span-1 grid min-w-0 gap-3 rounded-card border border-brand-200 bg-white p-4 text-left shadow-card transition hover:bg-brand-50"
                  onClick={() => openFolder(folder)}
                  aria-label={folder.title}
                >
                  <h3 className="break-words text-base font-semibold leading-snug text-ink-900">{folder.title}</h3>
                  <div className="flex min-h-20 items-center justify-center rounded-control border border-brand-200 bg-brand-50">
                    <StorageIcon className="h-9 w-9 text-brand-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : foldersViewActive && selectedFolder && folderEntriesLoading ? (
        <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
          <p className="text-sm font-medium text-ink-600">{t("storage.loading")}</p>
        </section>
      ) : foldersViewActive && selectedFolder && folderEntriesError ? (
        <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
          <p className="text-sm font-medium text-ink-600">{folderEntriesError}</p>
        </section>
      ) : loading ? (
        <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
          <p className="text-sm font-medium text-ink-600">{t("storage.loading")}</p>
        </section>
      ) : error ? (
        <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
          <p className={errorTextClass}>{t("common.errorPrefix", { message: error })}</p>
        </section>
      ) : showingEntries.length === 0 ? (
        <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
          <p className="text-sm font-medium text-ink-600">
            {searchValue.trim() ? t("storage.emptyFiltered") : t("storage.empty")}
          </p>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {showingEntries.map((entry) => {
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
                  onClick={() => {
                    setForcedLeftEntryId(null);
                    setForcedRightEntryId(null);
                    setSelectedEntryId(entry.id);
                  }}
                >
                  <div className="pr-12">
                    <h3 className="break-words text-base font-extrabold leading-snug text-ink-900">{entry.title}</h3>
                  </div>
                  <TextComponentIcon className="pointer-events-none absolute right-4 top-4 h-7 w-7 text-brand-600" />
                  <div className="mt-2 h-px w-full bg-brand-200" />
                  <p className="break-words text-sm text-ink-700 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {buildEntryText(entry, t("entries.noContent"))}
                  </p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <span 
                          key={tag.id} 
                          className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
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
                  setForcedLeftEntryId(null);
                  setForcedRightEntryId(null);
                  setSelectedEntryId(null);
                }
              }}
            >
              <div className="w-full overflow-hidden">
                <div
                  className={`mx-auto flex w-full max-w-[1120px] items-center justify-center gap-3 transform-gpu transition-transform duration-300 ease-out ${carouselTranslateClass}`}
                >
                <button
                  type="button"
                  className={`hidden w-[220px] shrink-0 rounded-card border bg-white p-3 text-left shadow-card transform-gpu transition-all duration-300 ease-out lg:block ${leftCardScaleClass} ${
                    leftRelatedEntry
                      ? "border-brand-200 hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-lg active:scale-[0.99]"
                      : "cursor-default border-brand-100 bg-brand-50/40 opacity-70"
                  }`}
                  onClick={() => {
                    if (leftRelatedEntry) {
                      openRelatedEntry(leftRelatedEntry, "left");
                    }
                  }}
                  aria-label={leftRelatedEntry ? t("storage.openRelatedAria", { title: leftRelatedEntry.title }) : t("storage.noRelatedEntries")}
                  disabled={!leftRelatedEntry || carouselSliding}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{t("storage.relatedLeft")}</p>
                  {leftRelatedEntry ? (
                    <>
                      <h4 className="mt-1 break-words text-sm font-bold text-ink-900">{leftRelatedEntry.title}</h4>
                      <p className="mt-2 break-words text-xs text-ink-700 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                        {buildEntryText(leftRelatedEntry, t("entries.noContent"))}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-ink-600">{t("storage.noRelatedEntries")}</p>
                  )}
                </button>

                <section
                  className={`w-full max-w-[560px] shrink-0 rounded-card border border-brand-200 bg-white p-4 shadow-card transform-gpu transition-all duration-300 ease-out md:p-5 ${centerCardScaleClass}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold tracking-tight text-ink-900">
                    {t("storage.detailTitle")}
                  </h3>
                  <div className="relative flex items-center gap-2" ref={entryFoldersMenuRef}>
                    <button
                      type="button"
                      className={iconToggleClass(entryFoldersOpen)}
                      aria-label={t("storage.entryFoldersToggleAria")}
                      aria-haspopup="menu"
                      aria-expanded={entryFoldersOpen}
                      onClick={openEntryFoldersMenu}
                    >
                      <StorageIcon className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-rose-300 bg-white text-rose-700 transition hover:bg-rose-50"
                      aria-label={t("storage.closeDetailAria")}
                      onClick={() => {
                        setForcedLeftEntryId(null);
                        setForcedRightEntryId(null);
                        setSelectedEntryId(null);
                      }}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>

                    {entryFoldersOpen && (
                      <section
                        className="absolute right-0 top-[calc(100%+10px)] z-40 w-[280px] max-w-[calc(100vw-3rem)] rounded-card border border-brand-200 bg-white p-3 shadow-card"
                        role="menu"
                        aria-label={t("storage.entryFoldersMenuAria")}
                      >
                        {entryFoldersLoading ? (
                          <p className="text-sm font-medium text-ink-600">{t("storage.entryFoldersLoading")}</p>
                        ) : entryFoldersError ? (
                          <p className="text-sm font-medium text-ink-600">{entryFoldersError}</p>
                        ) : entryFolders.length === 0 ? (
                          <p className="text-sm font-medium text-ink-600">{t("storage.entryFoldersEmpty")}</p>
                        ) : (
                          <ul className="scrollbar-brand max-h-56 space-y-1 overflow-y-auto pr-1">
                            {entryFolders.map((folder) => (
                              <li key={folder.id}>
                                <button
                                  type="button"
                                  className={`flex w-full items-center justify-between rounded-control border px-2.5 py-2 text-sm font-semibold transition ${
                                    folder.selected
                                      ? "border-brand-400 bg-brand-100 text-brand-800"
                                      : "border-brand-200 bg-white text-ink-800 hover:bg-brand-50"
                                  }`}
                                  disabled={updatingFolderId === folder.id}
                                  onClick={() => void handleToggleEntryFolder(folder)}
                                >
                                  <span className="truncate text-left">{folder.title}</span>
                                  <span
                                    className={`ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                                      folder.selected
                                        ? "border-brand-500 bg-brand-500 text-white"
                                        : "border-brand-300 text-transparent"
                                    }`}
                                  >
                                    ✓
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    )}
                  </div>
                  </div>

                  <div className="grid gap-3">
                  <article className="flex items-start justify-between gap-3 rounded-control border border-brand-200 bg-white p-3">
                    <div className="min-w-0 w-full">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t("storage.detailEntryTitle")}
                      </p>
                      {editingField === "title" ? (
                        <div className="mt-2 grid gap-2">
                          <input
                            type="text"
                            value={titleDraft}
                            onChange={(event) => {
                              setTitleDraft(event.target.value);
                              if (detailSaveError) {
                                setDetailSaveError(null);
                              }
                              if (detailSaveSuccess) {
                                setDetailSaveSuccess(null);
                              }
                            }}
                            className={inputClass}
                            aria-label={t("storage.detailEntryTitle")}
                            disabled={savingField === "title"}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex h-9 items-center justify-center rounded-control border border-brand-200 bg-white px-3 text-sm font-semibold text-ink-700 transition hover:bg-brand-50"
                              onClick={cancelEditingField}
                              disabled={savingField === "title"}
                            >
                              {t("common.cancel")}
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-9 items-center justify-center rounded-control border border-brand-500 bg-brand-500 px-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                              onClick={() => void saveTitleChanges()}
                              disabled={savingField === "title"}
                            >
                              {savingField === "title" ? t("common.saving") : t("common.save")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="break-all whitespace-pre-wrap text-base font-normal text-ink-900">
                          {selectedEntry.title}
                        </p>
                      )}
                    </div>
                    {editingField !== "title" && (
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-brand-200 text-brand-700 transition hover:bg-brand-100"
                        aria-label={t("storage.editFieldAria")}
                        onClick={() => startEditingField("title")}
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    )}
                  </article>

                  <article className="flex items-start justify-between gap-3 rounded-control border border-brand-200 bg-white p-3">
                    <div className="min-w-0 w-full">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t("storage.detailDescription")}
                      </p>
                      {editingField === "text" ? (
                        <div className="mt-2 grid gap-2">
                          <textarea
                            value={textDraft}
                            onChange={(event) => {
                              setTextDraft(event.target.value);
                              if (detailSaveError) {
                                setDetailSaveError(null);
                              }
                              if (detailSaveSuccess) {
                                setDetailSaveSuccess(null);
                              }
                            }}
                            className="w-full rounded-control border border-brand-200 bg-white px-3 py-2.5 text-body text-ink-800 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-70 resize-none min-h-[160px] max-h-[300px] overflow-y-scroll"
                            aria-label={t("storage.detailDescription")}
                            disabled={savingField === "text"}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex h-9 items-center justify-center rounded-control border border-brand-200 bg-white px-3 text-sm font-semibold text-ink-700 transition hover:bg-brand-50"
                              onClick={cancelEditingField}
                              disabled={savingField === "text"}
                            >
                              {t("common.cancel")}
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-9 items-center justify-center rounded-control border border-brand-500 bg-brand-500 px-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                              onClick={() => void saveTextChanges()}
                              disabled={savingField === "text"}
                            >
                              {savingField === "text" ? t("common.saving") : t("common.save")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="break-all whitespace-pre-wrap text-sm text-ink-700">
                          {buildEntryText(selectedEntry, t("entries.noContent"))}
                        </p>
                      )}
                    </div>
                    {editingField !== "text" && (
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-brand-200 text-brand-700 transition hover:bg-brand-100"
                        aria-label={t("storage.editFieldAria")}
                        onClick={() => startEditingField("text")}
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    )}
                  </article>

                  {selectedEntry.flag === "TABLE" && selectedCsvTable && (
                    <article className="rounded-control border border-brand-200 bg-white p-3">
                      <div className="min-w-0 w-full">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                          {t("storage.detailTable")}
                        </p>
                        <div className="scrollbar-brand mt-2 max-h-72 overflow-auto rounded-control border border-brand-200">
                          <table className="min-w-full border-collapse text-sm">
                            <thead className="bg-brand-50">
                              <tr>
                                {selectedCsvTable.headers.map((header, index) => (
                                  <th
                                    key={`csv-h-${index}`}
                                    className="border-b border-brand-200 px-3 py-2 text-left font-semibold text-ink-800"
                                  >
                                    {header || `Col ${index + 1}`}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {selectedCsvTable.rows.map((row, rowIndex) => (
                                <tr key={`csv-r-${rowIndex}`} className="odd:bg-white even:bg-brand-50/40">
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={`csv-c-${rowIndex}-${cellIndex}`}
                                      className="border-b border-brand-100 px-3 py-2 text-ink-700"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </article>
                  )}

                  {selectedTodoListText && (
                    <article className="rounded-control border border-brand-200 bg-white p-3">
                      <div className="min-w-0 w-full">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                          {t("storage.detailTodoList")}
                        </p>
                        <div className="scrollbar-brand mt-2 grid max-h-72 gap-2 overflow-y-auto pr-1">
                          {renderTodoListMarkdown(selectedTodoListText)}
                        </div>
                      </div>
                    </article>
                  )}

                  {selectedEntryMedia.length > 0 && (
                    <article className="rounded-control border border-brand-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t("storage.detailAttachments")}
                      </p>
                      <div className="mt-2 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1">
                        {selectedEntryMedia.map((media) => {
                          const mime = media.mimeType.toLowerCase();
                          const isImage = mime.startsWith("image/");
                          const isVideo = mime.startsWith("video/");
                          const isAudio = mime.startsWith("audio/");
                          const isPdf = mime === "application/pdf";
                          const downloadName = media.fileName || "archivo";

                          return (
                            <div key={media.id} className="relative rounded-control border border-brand-200 bg-brand-50 p-2">
                              <a
                                href={media.url!}
                                download={downloadName}
                                aria-label={`Descargar ${downloadName}`}
                                title="Descargar"
                                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand-300 bg-white text-brand-700 shadow-sm transition hover:bg-brand-100"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </a>
                              <p className="mb-1 truncate text-xs font-semibold text-ink-800">{media.title}</p>

                              {isImage && (
                                <img
                                  src={media.url!}
                                  alt={media.fileName}
                                  className="h-24 w-full rounded border border-brand-200 object-cover"
                                />
                              )}
                              {isVideo && (
                                <video src={media.url!} controls className="h-24 w-full rounded border border-brand-200 object-cover" />
                              )}
                              {isAudio && <audio src={media.url!} controls className="w-full" />}
                              {isPdf && (
                                <iframe src={media.url!} title={media.fileName} className="h-32 w-full rounded border border-brand-200" />
                              )}
                              {!isImage && !isVideo && !isAudio && !isPdf && (
                                <a
                                  href={media.url!}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-9 items-center rounded-control border border-brand-300 bg-white px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                                >
                                  {media.fileName}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  )}

                  {selectedEntryLinks.length > 0 && (
                    <article className="rounded-control border border-brand-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        Spotify / Links
                      </p>
                      <div className="mt-2 grid gap-2">
                        {selectedEntryLinks.map((link) => {
                          return (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
                            >
                              {link.title}
                            </a>
                          );
                        })}
                      </div>
                    </article>
                  )}
                    {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                      <article className="rounded-control border border-brand-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                          {t("storage.tags")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedEntry.tags.map((tag) => (
                            <span 
                              key={tag.id} 
                              className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-1 text-sm font-semibold text-brand-800"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      </article>
                    )}
                    {detailSaveError && <p className={errorTextClass}>{t("common.errorPrefix", { message: detailSaveError })}</p>}
                    {detailSaveSuccess && (
                      <p className="text-sm font-semibold text-emerald-600">{detailSaveSuccess}</p>
                    )}
                  </div>
                </section>

                <button
                  type="button"
                  className={`hidden w-[220px] shrink-0 rounded-card border bg-white p-3 text-left shadow-card transform-gpu transition-all duration-300 ease-out lg:block ${rightCardScaleClass} ${
                    rightRelatedEntry
                      ? "border-brand-200 hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-lg active:scale-[0.99]"
                      : "cursor-default border-brand-100 bg-brand-50/40 opacity-70"
                  }`}
                  onClick={() => {
                    if (rightRelatedEntry) {
                      openRelatedEntry(rightRelatedEntry, "right");
                    }
                  }}
                  aria-label={rightRelatedEntry ? t("storage.openRelatedAria", { title: rightRelatedEntry.title }) : t("storage.noRelatedEntries")}
                  disabled={!rightRelatedEntry || carouselSliding}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{t("storage.relatedRight")}</p>
                  {rightRelatedEntry ? (
                    <>
                      <h4 className="mt-1 break-words text-sm font-bold text-ink-900">{rightRelatedEntry.title}</h4>
                      <p className="mt-2 break-words text-xs text-ink-700 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                        {buildEntryText(rightRelatedEntry, t("entries.noContent"))}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-ink-600">{t("storage.noRelatedEntries")}</p>
                  )}
                </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <CreateFolderModal
        open={createFolderModalOpen}
        value={newFolderTitle}
        submitting={creatingFolder}
        error={createFolderError}
        onChange={(value) => {
          setNewFolderTitle(value);
          if (createFolderError) {
            setCreateFolderError(null);
          }
        }}
        onSubmit={handleCreateFolder}
        onClose={() => {
          if (creatingFolder) {
            return;
          }
          setCreateFolderModalOpen(false);
          setCreateFolderError(null);
        }}
      />
    </section>
  );
}
