import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ArrowLongLeftIcon,
  CreateFolderIcon,
  PencilSquareIcon,
  StorageIcon,
  TextComponentIcon,
  TwitchIcon,
  YoutubeIcon,
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
    .filter((resource) => resource.type === "RAW" || resource.type === "TEXT")
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

function getEntryLinks(entry: EntryItem) {
  return entry.resources
    .filter((resource) => resource.type === "LINK" && Boolean(resource.url))
    .map((resource) => ({
      id: resource.id,
      title: resource.title?.trim() || resource.url!,
      url: resource.url!
    }));
}

const TWITCH_URL_PATTERN = /(?:https?:\/\/)?(?:www\.|m\.)?(?:twitch\.tv|clips\.twitch\.tv)\/[^\s<>"')]+/gi;

type YouTubeVideoPreview = {
  id: number;
  title: string;
  url: string;
  videoId: string;
  embedUrl: string;
  isShort: boolean;
};

type TwitchVideoPreview = {
  id: number;
  title: string;
  url: string;
  embedUrl: string;
  variant: "live" | "vod" | "clip";
};

type EntryDisplayCard = {
  key: string;
  entry: EntryItem;
  youtubeVideo: YouTubeVideoPreview | null;
  twitchVideo: TwitchVideoPreview | null;
};

function extractYoutubeVideoId(rawUrl: string): string | null {
  try {
    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsedUrl = new URL(normalizedUrl);
    const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      const firstPathSegment = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return firstPathSegment && /^[A-Za-z0-9_-]{11}$/.test(firstPathSegment) ? firstPathSegment : null;
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (parsedUrl.pathname === "/watch") {
        const videoId = parsedUrl.searchParams.get("v");
        return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
      }

      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      if (segments.length >= 2 && ["shorts", "embed", "live"].includes(segments[0])) {
        const videoId = segments[1];
        return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function isYoutubeShortUrl(rawUrl: string): boolean {
  try {
    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsedUrl = new URL(normalizedUrl);
    const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");

    if (host !== "youtube.com" && host !== "youtube-nocookie.com") {
      return false;
    }

    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    return segments.length >= 2 && segments[0] === "shorts";
  } catch {
    return false;
  }
}

function getEntryYoutubeVideos(entry: EntryItem): YouTubeVideoPreview[] {
  const videosById = new Map<string, YouTubeVideoPreview>();

  for (const resource of entry.resources) {
    if (resource.type !== "LINK" || !resource.url) {
      continue;
    }
    const videoId = extractYoutubeVideoId(resource.url);
    if (!videoId || videosById.has(videoId)) {
      continue;
    }

    videosById.set(videoId, {
      id: resource.id,
      title: resource.title?.trim() || "YouTube",
      url: resource.url,
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      isShort: isYoutubeShortUrl(resource.url)
    });
  }

  return Array.from(videosById.values());
}

function getTwitchEmbedParentHost() {
  if (typeof window !== "undefined" && window.location.hostname) {
    return window.location.hostname;
  }
  return "localhost";
}

function parseTwitchVideoPreview(rawUrl: string): Omit<TwitchVideoPreview, "id" | "title" | "url"> | null {
  try {
    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsedUrl = new URL(normalizedUrl);
    const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    const parent = encodeURIComponent(getTwitchEmbedParentHost());

    if (host === "clips.twitch.tv" && segments.length >= 1) {
      const slug = segments[0];
      if (!/^[A-Za-z0-9_-]{3,}$/.test(slug)) {
        return null;
      }
      return {
        variant: "clip",
        embedUrl: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${parent}&autoplay=false`
      };
    }

    if (host !== "twitch.tv" || segments.length === 0) {
      return null;
    }

    const first = segments[0].toLowerCase();
    if (first === "videos" && segments.length >= 2) {
      const videoId = segments[1];
      if (!/^\d+$/.test(videoId)) {
        return null;
      }
      return {
        variant: "vod",
        embedUrl: `https://player.twitch.tv/?video=v${encodeURIComponent(videoId)}&parent=${parent}&autoplay=false`
      };
    }

    if (first === "clip" && segments.length >= 2) {
      const slug = segments[1];
      if (!/^[A-Za-z0-9_-]{3,}$/.test(slug)) {
        return null;
      }
      return {
        variant: "clip",
        embedUrl: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${parent}&autoplay=false`
      };
    }

    if (!/^[A-Za-z0-9_]{2,25}$/.test(first)) {
      return null;
    }

    const reserved = new Set([
      "directory",
      "downloads",
      "jobs",
      "settings",
      "subscriptions",
      "turbo",
      "wallet",
      "friends",
      "inventory",
      "messages",
      "prime",
      "store",
      "search",
      "videos",
      "clip",
      "moderator"
    ]);
    if (reserved.has(first)) {
      return null;
    }

    return {
      variant: "live",
      embedUrl: `https://player.twitch.tv/?channel=${encodeURIComponent(first)}&parent=${parent}&autoplay=false`
    };
  } catch {
    return null;
  }
}

function getTwitchVariantBadgeConfig(variant: TwitchVideoPreview["variant"]) {
  switch (variant) {
    case "live":
      return {
        labelKey: "storage.twitchLive" as const,
        className:
          "inline-flex w-fit rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rose-700"
      };
    case "vod":
      return {
        labelKey: "storage.twitchVod" as const,
        className:
          "inline-flex w-fit rounded-full border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700"
      };
    case "clip":
    default:
      return {
        labelKey: "storage.twitchClip" as const,
        className:
          "inline-flex w-fit rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700"
      };
  }
}

function getEntryTwitchVideos(entry: EntryItem): TwitchVideoPreview[] {
  const videosByEmbed = new Map<string, TwitchVideoPreview>();

  for (const resource of entry.resources) {
    if (resource.type === "LINK" && resource.url) {
      const parsed = parseTwitchVideoPreview(resource.url);
      if (!parsed || videosByEmbed.has(parsed.embedUrl)) {
        continue;
      }

      videosByEmbed.set(parsed.embedUrl, {
        id: resource.id,
        title: resource.title?.trim() || "Twitch",
        url: resource.url,
        embedUrl: parsed.embedUrl,
        variant: parsed.variant
      });
      continue;
    }

    if ((resource.type === "RAW" || resource.type === "TEXT") && resource.textContent) {
      const matches = resource.textContent.match(TWITCH_URL_PATTERN);
      if (!matches) {
        continue;
      }

      for (const candidateUrl of matches) {
        const parsed = parseTwitchVideoPreview(candidateUrl);
        if (!parsed || videosByEmbed.has(parsed.embedUrl)) {
          continue;
        }

        videosByEmbed.set(parsed.embedUrl, {
          id: resource.id,
          title: "Twitch",
          url: /^https?:\/\//i.test(candidateUrl) ? candidateUrl : `https://${candidateUrl}`,
          embedUrl: parsed.embedUrl,
          variant: parsed.variant
        });
      }
    }
  }

  return Array.from(videosByEmbed.values());
}

export function StorageEntriesSection({
  entries,
  loading,
  error,
  searchValue,
  onSearchChange,
  onEntriesUpdated,
  onUnauthorized
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

  const entryFoldersMenuRef = useRef<HTMLDivElement | null>(null);

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
  const selectedEntryLinks = useMemo(
    () => (selectedEntry ? getEntryLinks(selectedEntry) : []),
    [selectedEntry]
  );
  const selectedEntryYoutubeVideos = useMemo(
    () => (selectedEntry ? getEntryYoutubeVideos(selectedEntry) : []),
    [selectedEntry]
  );
  const selectedEntryTwitchVideos = useMemo(
    () => (selectedEntry ? getEntryTwitchVideos(selectedEntry) : []),
    [selectedEntry]
  );
  const selectedEntryOtherLinks = useMemo(
    () =>
      selectedEntryLinks.filter(
        (link) => !extractYoutubeVideoId(link.url) && !parseTwitchVideoPreview(link.url)
      ),
    [selectedEntryLinks]
  );

  const selectedTextResource = useMemo(() => {
    if (!selectedEntry) {
      return null;
    }
    return selectedEntry.resources.find((resource) => resource.type === "RAW" || resource.type === "TEXT") ?? null;
  }, [selectedEntry]);

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

  const showingEntries = foldersViewActive && selectedFolder ? selectedFolderEntries : filteredEntries;
  const displayCards = useMemo<EntryDisplayCard[]>(() => {
    const cards: EntryDisplayCard[] = [];

    for (const entry of showingEntries) {
      const youtubeVideos = getEntryYoutubeVideos(entry);
      const twitchVideos = getEntryTwitchVideos(entry);
      const hasYoutubeVideos = youtubeVideos.length > 0;
      const hasTwitchVideos = twitchVideos.length > 0;

      if (entry.flag === "YOUTUBE" && hasYoutubeVideos) {
        youtubeVideos.forEach((video, index) => {
          cards.push({
            key: `${entry.id}-youtube-${video.videoId}-${index}`,
            entry,
            youtubeVideo: video,
            twitchVideo: null
          });
        });
        continue;
      }

      if (entry.flag === "TWITCH" && hasTwitchVideos) {
        twitchVideos.forEach((video, index) => {
          cards.push({
            key: `${entry.id}-twitch-${video.variant}-${index}`,
            entry,
            youtubeVideo: null,
            twitchVideo: video
          });
        });
        continue;
      }

      if (hasYoutubeVideos) {
        youtubeVideos.forEach((video, index) => {
          cards.push({
            key: `${entry.id}-youtube-${video.videoId}-${index}`,
            entry,
            youtubeVideo: video,
            twitchVideo: null
          });
        });
      }

      if (hasTwitchVideos) {
        twitchVideos.forEach((video, index) => {
          cards.push({
            key: `${entry.id}-twitch-${video.variant}-${index}`,
            entry,
            youtubeVideo: null,
            twitchVideo: video
          });
        });
      }

      if (hasYoutubeVideos || hasTwitchVideos) {
        continue;
      }

      cards.push({
        key: String(entry.id),
        entry,
        youtubeVideo: null,
        twitchVideo: null
      });
    }

    return cards;
  }, [showingEntries]);

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
      ) : displayCards.length === 0 ? (
        <section className="rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
          <p className="text-sm font-medium text-ink-600">
            {searchValue.trim() ? t("storage.emptyFiltered") : t("storage.empty")}
          </p>
        </section>
      ) : (
        <>
          <div className="columns-1 gap-3 md:columns-2">
            {displayCards.map((card) => {
              const { entry, youtubeVideo, twitchVideo } = card;
              const selected = selectedEntryId === entry.id;
              const isYoutubeCard = youtubeVideo !== null;
              const isTwitchCard = twitchVideo !== null;
              const cardTitle = isYoutubeCard
                ? youtubeVideo!.title
                : isTwitchCard
                  ? twitchVideo!.title
                  : entry.title;

              return (
                <button
                  key={card.key}
                  type="button"
                  className={`relative mb-3 inline-block w-full break-inside-avoid rounded-card border bg-white p-4 text-left shadow-card transition ${
                    selected
                      ? "border-brand-500 ring-2 ring-brand-100"
                      : "border-brand-200 hover:bg-brand-50"
                  }`}
                  onClick={() => setSelectedEntryId(entry.id)}
                >
                  <div className="pr-12">
                    <h3 className="break-words text-base font-extrabold leading-snug text-ink-900">{cardTitle}</h3>
                  </div>
                  {isYoutubeCard && youtubeVideo!.isShort && (
                    <span className="inline-flex w-fit rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rose-700">
                      Shorts
                    </span>
                  )}
                  {isTwitchCard && (
                    (() => {
                      const badge = getTwitchVariantBadgeConfig(twitchVideo!.variant);
                      return <span className={badge.className}>{t(badge.labelKey)}</span>;
                    })()
                  )}
                  {isYoutubeCard ? (
                    <YoutubeIcon className="pointer-events-none absolute right-4 top-4 h-7 w-7 text-rose-600" />
                  ) : isTwitchCard ? (
                    <TwitchIcon className="pointer-events-none absolute right-4 top-4 h-7 w-7 text-violet-600" />
                  ) : (
                    <TextComponentIcon className="pointer-events-none absolute right-4 top-4 h-7 w-7 text-brand-600" />
                  )}
                  <div className="mt-2 h-px w-full bg-brand-200" />
                  {isYoutubeCard ? (
                    <div className={youtubeVideo!.isShort ? "flex justify-center" : ""}>
                      <div
                        className={`overflow-hidden rounded-control border border-brand-200 bg-brand-50 ${
                          youtubeVideo!.isShort ? "w-full max-w-[220px]" : "w-full"
                        }`}
                        style={youtubeVideo!.isShort ? { aspectRatio: "9 / 16" } : undefined}
                      >
                        <iframe
                          className={youtubeVideo!.isShort ? "h-full w-full" : "h-40 w-full"}
                          src={youtubeVideo!.embedUrl}
                          title={youtubeVideo!.title}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : isTwitchCard ? (
                    <div
                      className={`overflow-hidden rounded-control border ${
                        twitchVideo!.variant === "live"
                          ? "border-rose-200 bg-rose-50"
                          : twitchVideo!.variant === "vod"
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <iframe
                        className="h-40 w-full"
                        src={twitchVideo!.embedUrl}
                        title={twitchVideo!.title}
                        loading="lazy"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <p className="break-words text-sm text-ink-700 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                      {buildEntryText(entry, t("entries.noContent"))}
                    </p>
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
                  setSelectedEntryId(null);
                }
              }}
            >
              <section className="w-full max-w-[560px] rounded-card border border-brand-200 bg-white p-4 shadow-card md:p-5">
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
                      onClick={() => setSelectedEntryId(null)}
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

                  {selectedEntryYoutubeVideos.length > 0 && (
                    <article className="rounded-control border border-brand-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t("storage.youtubeVideos")}
                      </p>
                      <div className="mt-2 grid gap-3">
                        {selectedEntryYoutubeVideos.map((video) => (
                          <div key={`${video.id}-${video.videoId}`} className="grid gap-2">
                            {video.isShort && (
                              <span className="inline-flex w-fit rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-rose-700">
                                Shorts
                              </span>
                            )}
                            <div className={video.isShort ? "flex justify-center" : ""}>
                              <div
                                className={`overflow-hidden rounded-control border border-brand-200 bg-brand-50 ${
                                  video.isShort ? "w-full max-w-[250px]" : "w-full"
                                }`}
                                style={video.isShort ? { aspectRatio: "9 / 16" } : undefined}
                              >
                                <iframe
                                  className={video.isShort ? "h-full w-full" : "h-44 w-full"}
                                  src={video.embedUrl}
                                  title={video.title}
                                  loading="lazy"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                            </div>
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
                            >
                              {video.title}
                            </a>
                          </div>
                        ))}
                      </div>
                    </article>
                  )}

                  {selectedEntryTwitchVideos.length > 0 && (
                    <article className="rounded-control border border-violet-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t("storage.twitchVideos")}
                      </p>
                      <div className="mt-2 grid gap-3">
                        {selectedEntryTwitchVideos.map((video) => (
                          <div key={`${video.id}-${video.embedUrl}`} className="grid gap-2">
                            {(() => {
                              const badge = getTwitchVariantBadgeConfig(video.variant);
                              return <span className={badge.className}>{t(badge.labelKey)}</span>;
                            })()}
                            <div
                              className={`overflow-hidden rounded-control border ${
                                video.variant === "live"
                                  ? "border-rose-200 bg-rose-50"
                                  : video.variant === "vod"
                                    ? "border-indigo-200 bg-indigo-50"
                                    : "border-amber-200 bg-amber-50"
                              }`}
                            >
                              <iframe
                                className="h-44 w-full"
                                src={video.embedUrl}
                                title={video.title}
                                loading="lazy"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all text-sm font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-800"
                            >
                              {video.title}
                            </a>
                          </div>
                        ))}
                      </div>
                    </article>
                  )}

                  {selectedEntryOtherLinks.length > 0 && (
                    <article className="rounded-control border border-brand-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t("storage.detailLinks")}
                      </p>
                      <div className="mt-2 grid gap-2">
                        {selectedEntryOtherLinks.map((link) => {
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
                    {detailSaveError && <p className={errorTextClass}>{t("common.errorPrefix", { message: detailSaveError })}</p>}
                    {detailSaveSuccess && (
                      <p className="text-sm font-semibold text-emerald-600">{detailSaveSuccess}</p>
                    )}
                </div>
              </section>
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
