import { useState, useEffect } from "react";
import { isApiError } from "../../api/client";
import { createEntry, uploadFile } from "../../api/resources";
import { useI18n } from "../../i18n/I18nProvider";
import type { CreateEntryResourceInput, EntryFlag } from "../../types/resource";
import { readErrorMessage } from "../../utils/error";
import { SuccessToast } from "../ui/SuccessToast";
import {
  InboxEntryCreateForm,
  type InboxEntryFormValues
} from "./InboxEntryCreateForm";

const INITIAL_INBOX_ENTRY_FORM: InboxEntryFormValues = {
  title: "",
  textContent: "",
  mediaFiles: [],
  selectedPrimaryOption: null,
  alarmEnabled: false
};

function resolveEntryFlag(form: InboxEntryFormValues): EntryFlag {
  switch (form.selectedPrimaryOption) {
    case "youtube": return "YOUTUBE";
    case "spotify": return "SPOTIFY";
    case "twitch": return "TWITCH";
    case "link": return "LINK";
    case "table": return "TABLE";
    case "enumeration": return "ENUMERATION";
    case "checklist": return "CHECKLIST";
    case "survey":
    default: return "RAW";
  }
}

type ContentExtensionWidgetProps = {
  onLogout: () => void;
};

export function ContentExtensionWidget({ onLogout }: ContentExtensionWidgetProps) {
  const { t } = useI18n();
  const [inboxEntryForm, setInboxEntryForm] = useState<InboxEntryFormValues>(INITIAL_INBOX_ENTRY_FORM);
  const [inboxSubmitting, setInboxSubmitting] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [inboxMessage, setInboxMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!inboxMessage) {
      setToastVisible(false);
      return;
    }

    setToastVisible(true);
    const hideTimer = window.setTimeout(() => setToastVisible(false), 2600);
    const clearTimer = window.setTimeout(() => setInboxMessage(null), 3000);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [inboxMessage]);

  function resetInboxFeedback() {
    setInboxError(null);
    setInboxMessage(null);
  }

  function patchInboxEntryForm(patch: Partial<InboxEntryFormValues>) {
    setInboxEntryForm((current) => ({ ...current, ...patch }));
    resetInboxFeedback();
  }

  async function handleCreateInboxEntry() {
    const title = inboxEntryForm.title.trim();
    const textContent = inboxEntryForm.textContent.trim();
    const activeFlag = resolveEntryFlag(inboxEntryForm);

    if (activeFlag === "YOUTUBE" && !textContent) {
      setInboxError(t("entries.youtubeRequired"));
      return;
    }
    if (activeFlag === "TWITCH" && !textContent) {
      setInboxError(t("entries.twitchRequired"));
      return;
    }

    const resources: CreateEntryResourceInput[] = [];
    if (textContent) {
      resources.push({ type: "RAW", textContent });
    }

    try {
      setInboxSubmitting(true);
      resetInboxFeedback();

      if (inboxEntryForm.mediaFiles.length > 0) {
        for (const file of inboxEntryForm.mediaFiles) {
          const uploaded = await uploadFile(file);
          resources.push({
            type: "MEDIA",
            title: file.type.startsWith("video/") ? t("resource.video") : t("resource.file"),
            storageKey: uploaded.path,
            fileName: uploaded.fileName || file.name,
            mimeType: uploaded.mimeType || file.type || undefined
          });
        }
      }

      await createEntry({
        title: title || undefined,
        resources,
        flag: activeFlag,
        notification: inboxEntryForm.alarmEnabled
      });

      setInboxEntryForm(INITIAL_INBOX_ENTRY_FORM);
      setInboxMessage(t("inbox.saved"));
    } catch (requestError) {
      if (isApiError(requestError) && requestError.status === 401) {
        onLogout();
        return;
      }
      setInboxError(readErrorMessage(requestError, t("common.unexpectedError")));
    } finally {
      setInboxSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen bg-transparent p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-[840px]">
        <InboxEntryCreateForm
          values={inboxEntryForm}
          submitting={inboxSubmitting}
          error={inboxError}
          heading="PISITO Inbox" 
          onSubmit={handleCreateInboxEntry}
          onChange={patchInboxEntryForm}
        />
      </div>
      <SuccessToast message={inboxMessage} visible={toastVisible} />
    </section>
  );
}