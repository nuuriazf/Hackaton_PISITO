import { FormEvent, useCallback, useEffect, useState } from "react";
import { isApiError } from "../api/client";
import {
  createEntry,
  createLinkResource,
  createMediaResource,
  createTextResource,
  deleteEntry,
  deleteResource,
  fetchEntries
} from "../api/resources";
import { INITIAL_RESOURCE_FORM, type ResourceFormValues } from "../features/content/resourceForm";
import { useI18n } from "../i18n/I18nProvider";
import type { EntryItem } from "../types/resource";
import { readErrorMessage } from "../utils/error";

type UseEntriesCrudOptions = {
  enabled: boolean;
  onUnauthorized: () => void;
};

function setSelectedEntryAfterLoad(
  current: ResourceFormValues,
  entries: EntryItem[]
): ResourceFormValues {
  if (entries.length === 0) {
    if (current.selectedEntryId === "") {
      return current;
    }
    return { ...current, selectedEntryId: "" };
  }

  const hasSelected =
    current.selectedEntryId !== "" && entries.some((entry) => entry.id === current.selectedEntryId);

  if (hasSelected) {
    return current;
  }

  return { ...current, selectedEntryId: entries[0].id };
}

export function useEntriesCrud({ enabled, onUnauthorized }: UseEntriesCrudOptions) {
  const { t } = useI18n();
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [newEntryTitle, setNewEntryTitle] = useState("");
  const [resourceForm, setResourceForm] = useState<ResourceFormValues>(INITIAL_RESOURCE_FORM);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchResourceForm = useCallback((patch: Partial<ResourceFormValues>) => {
    setResourceForm((previous) => ({ ...previous, ...patch }));
  }, []);

  const resetResourceFields = useCallback(() => {
    setResourceForm((previous) => ({
      ...previous,
      title: "",
      textContent: "",
      url: "",
      storageKey: "",
      fileName: "",
      mimeType: ""
    }));
  }, []);

  const resetState = useCallback(() => {
    setEntries([]);
    setNewEntryTitle("");
    setResourceForm(INITIAL_RESOURCE_FORM);
    setLoading(false);
    setSending(false);
    setError(null);
  }, []);

  const handleRequestError = useCallback(
    (requestError: unknown) => {
      if (isApiError(requestError) && requestError.status === 401) {
        onUnauthorized();
        return;
      }
      setError(readErrorMessage(requestError, t("common.unexpectedError")));
    },
    [onUnauthorized, t]
  );

  const loadEntries = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await fetchEntries();
      setEntries(data);
      setResourceForm((current) => setSelectedEntryAfterLoad(current, data));
    } catch (requestError) {
      handleRequestError(requestError);
    } finally {
      setLoading(false);
    }
  }, [enabled, handleRequestError]);

  useEffect(() => {
    if (!enabled) {
      resetState();
      return;
    }
    void loadEntries();
  }, [enabled, loadEntries, resetState]);

  const onCreateEntry = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!newEntryTitle.trim()) {
        return;
      }

      try {
        setSending(true);
        setError(null);

        const created = await createEntry(newEntryTitle.trim());
        setNewEntryTitle("");
        patchResourceForm({ selectedEntryId: created.id });
        await loadEntries();
      } catch (requestError) {
        handleRequestError(requestError);
      } finally {
        setSending(false);
      }
    },
    [handleRequestError, loadEntries, newEntryTitle, patchResourceForm]
  );

  const onCreateResource = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const {
        selectedEntryId,
        type,
        title,
        textContent,
        url,
        storageKey,
        fileName,
        mimeType
      } = resourceForm;

      if (selectedEntryId === "") {
        setError(t("entries.firstCreateEntry"));
        return;
      }

      try {
        setSending(true);
        setError(null);

        if (type === "RAW" || type === "TEXT") {
          if (!textContent.trim()) {
            throw new Error(t("entries.textRequired"));
          }
          await createTextResource(selectedEntryId, { title, textContent });
        } else if (type === "LINK") {
          if (!url.trim()) {
            throw new Error(t("entries.linkRequired"));
          }
          await createLinkResource(selectedEntryId, { title, url });
        } else {
          if (!storageKey.trim()) {
            throw new Error(t("entries.mediaRequired"));
          }
          await createMediaResource(selectedEntryId, {
            title,
            storageKey,
            fileName,
            mimeType
          });
        }

        resetResourceFields();
        await loadEntries();
      } catch (requestError) {
        handleRequestError(requestError);
      } finally {
        setSending(false);
      }
    },
    [handleRequestError, loadEntries, resetResourceFields, resourceForm, t]
  );

  const onDeleteResource = useCallback(
    async (entryId: number, resourceId: number) => {
      try {
        await deleteResource(entryId, resourceId);
        await loadEntries();
      } catch (requestError) {
        handleRequestError(requestError);
      }
    },
    [handleRequestError, loadEntries]
  );

  const onDeleteEntry = useCallback(
    async (entryId: number) => {
      try {
        await deleteEntry(entryId);
        await loadEntries();
      } catch (requestError) {
        handleRequestError(requestError);
      }
    },
    [handleRequestError, loadEntries]
  );

  return {
    entries,
    newEntryTitle,
    resourceForm,
    loading,
    sending,
    error,
    setNewEntryTitle,
    patchResourceForm,
    onCreateEntry,
    onCreateResource,
    onDeleteEntry,
    onDeleteResource,
    clearError: () => setError(null)
  };
}
