import { DragEvent, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { Button } from "../ui/Button";
import {
  AlarmClockIcon,
  ChecklistIcon,
  FileDropIcon,
  LinkIcon,
  ListBulletIcon,
  MusicalNoteIcon,
  TableIcon,
  TwitchIcon,
  YoutubeIcon
} from "../ui/icons";
import { errorTextClass, fieldLabelClass, inputClass, textareaClass } from "../ui/styles";
import spotyIcon from "../../assets/spoty.png";

type PrimaryInboxOption =
  | "youtube"
  | "spotify"
  | "twitch"
  | "link"
  | "table"
  | "enumeration"
  | "checklist";

export type InboxEntryFormValues = {
  title: string;
  textContent: string;
  mediaFiles: File[];
  selectedPrimaryOption: PrimaryInboxOption | null;
  alarmEnabled: boolean;
};

type InboxEntryCreateFormProps = {
  values: InboxEntryFormValues;
  submitting: boolean;
  error: string | null;
  heading?: string;
  onSubmit: () => void | Promise<void>;
  onChange: (patch: Partial<InboxEntryFormValues>) => void;
};

function toggleButtonClass(active: boolean) {
  return [
    "glass-surface flex h-11 w-full items-center justify-center border transition sm:w-11",
    active
      ? "border-white bg-black/20 text-[#111827] shadow-[0_0_10px_rgba(255,255,255,0.8)]"
      : "text-[#111827] hover:bg-white/20"
  ].join(" ");
}

type IconToggleButtonProps = {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function IconToggleButton({ label, active, disabled = false, onClick, children }: IconToggleButtonProps) {
  return (
    <div className="group relative flex">
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        className={`peer ${toggleButtonClass(active)}`}
        onClick={onClick}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute left-1/2 top-0 z-[200] -translate-x-1/2 -translate-y-[calc(100%+6px)] whitespace-nowrap glass-container px-2 py-1 text-xs font-semibold text-ink-900 opacity-0 shadow-sm transition-opacity duration-150 peer-hover:opacity-100 peer-focus-visible:opacity-100">
        {label}
      </span>
    </div>
  );
}

export function InboxEntryCreateForm({
  values,
  submitting,
  error,
  heading,
  onSubmit,
  onChange
}: InboxEntryCreateFormProps) {
  const { t } = useI18n();
  const fileInputKey = values.mediaFiles.length > 0
    ? `${values.mediaFiles.length}-${values.mediaFiles[0].name}-${values.mediaFiles[0].lastModified}`
    : "empty-media";
  const [isFileDropActive, setIsFileDropActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const mainFileInputRef = useRef<HTMLInputElement | null>(null);
  const quickAddInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (values.mediaFiles.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const urls = values.mediaFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [values.mediaFiles]);

  function formatFileSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  function appendMediaFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    const incomingFiles = Array.from(fileList);
    onChange({ mediaFiles: [...values.mediaFiles, ...incomingFiles] });
  }

  function removeMediaFile(indexToRemove: number) {
    onChange({
      mediaFiles: values.mediaFiles.filter((_, index) => index !== indexToRemove)
    });
  }

  function handleFileDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsFileDropActive(true);
  }

  function handleFileDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsFileDropActive(false);
    }
  }

  function handleFileDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsFileDropActive(false);
    appendMediaFiles(event.dataTransfer.files ?? null);
  }

  function togglePrimaryOption(option: PrimaryInboxOption) {
    onChange({
      selectedPrimaryOption: values.selectedPrimaryOption === option ? null : option
    });
  }

  function toggleAlarm() {
    onChange({ alarmEnabled: !values.alarmEnabled });
  }

  return (
    <form className="grid w-full gap-3 font-sans inbox-glass-text" onSubmit={handleSubmit}>
      <section className="glass-card h-auto w-full max-w-full p-5 md:p-6">
        {heading ? (
          <div className="mb-4">
            <h2 className="heading-title text-center text-ink-900">{heading}</h2>
          </div>
        ) : null}
        
        <div className="grid gap-4">
          <textarea
            maxLength={80}
            rows={1}
            disabled={submitting}
            placeholder={t("inbox.titlePlaceholder")}
            className={`${inputClass} min-h-[44px] max-h-[44px] resize-none overflow-hidden`}
            value={values.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />

          <textarea
            disabled={submitting}
            autoFocus
            placeholder={t("inbox.textPlaceholder")}
            className={`${textareaClass} min-h-[160px] max-h-[160px] resize-none overflow-hidden`}
            value={values.textContent}
            onChange={(event) => onChange({ textContent: event.target.value })}
          />

          <div
            className="h-32"
            onDragEnter={() => setIsFileDropActive(true)}
            onDragOver={handleFileDragOver}
            onDragLeave={handleFileDragLeave}
            onDrop={handleFileDrop}
          >
            {values.mediaFiles.length === 0 && (
              <>
                <input
                  key={fileInputKey}
                  ref={mainFileInputRef}
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                  disabled={submitting}
                  className="sr-only"
                  onChange={(event) => appendMediaFiles(event.target.files ?? null)}
                />
                <div
                  className={`h-full border-2 border-dashed rounded-2xl px-4 py-5 text-center transition flex items-center justify-center ${
                    isFileDropActive
                      ? "border-white/40 bg-[rgba(240,240,240,0.4)] text-ink-900"
                      : "border-white/30 bg-[rgba(240,240,240,0.25)] text-ink-700"
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => mainFileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      mainFileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileDropIcon className="h-7 w-7" />
                  </div>
                </div>
              </>
            )}

            {values.mediaFiles.length > 0 && (
              <div className="flex h-full items-stretch gap-2">
                <div className="min-w-0 flex-1 glass-card p-2 overflow-hidden">
                  <div className="h-full grid grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 auto-rows-min">
                    {values.mediaFiles.map((file, index) => {
                      const previewUrl = previewUrls[index];
                      return (
                        <div key={`${file.name}-${file.lastModified}-${index}`} className="rounded-lg border border-brand-200 bg-white/90 p-2">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <p className="truncate text-xs font-semibold text-ink-900">{file.name}</p>
                            <button
                              type="button"
                              className="shrink-0 rounded border border-rose-300 bg-white px-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                removeMediaFile(index);
                              }}
                              disabled={submitting}
                            >
                              x
                            </button>
                          </div>
                          <p className="text-[10px] text-ink-600">
                            {(file.type || "application/octet-stream") + " · " + formatFileSize(file.size)}
                          </p>

                          {previewUrl && file.type.startsWith("image/") && (
                            <img
                              src={previewUrl}
                              alt={file.name}
                              className="mt-1 h-16 w-full rounded border border-brand-200 object-cover"
                            />
                          )}
                          {previewUrl && file.type.startsWith("video/") && (
                            <video src={previewUrl} className="mt-1 h-16 w-full rounded border border-brand-200 object-cover" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={t("inbox.filesLabel")}
                  disabled={submitting}
                  className="inline-flex w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-white/30 bg-[rgba(240,240,240,0.25)] text-2xl font-bold leading-none text-ink-700 transition hover:border-white/40 hover:bg-[rgba(240,240,240,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    quickAddInputRef.current?.click();
                  }}
                >
                  +
                </button>
                <input
                  ref={quickAddInputRef}
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                  disabled={submitting}
                  className="sr-only"
                  onChange={(event) => appendMediaFiles(event.target.files ?? null)}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="glass-card h-auto w-full max-w-full overflow-visible p-3">
        <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-2">
          <IconToggleButton
            label={t("icon.youtube")}
            active={values.selectedPrimaryOption === "youtube"}
            disabled={submitting}
            onClick={() => togglePrimaryOption("youtube")}
          >
            <YoutubeIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.spotify")}
            active={values.selectedPrimaryOption === "spotify"}
            disabled={submitting}
            onClick={() => togglePrimaryOption("spotify")}
          >
            <img src={spotyIcon} alt="Spotify" className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.twitch")}
            active={values.selectedPrimaryOption === "twitch"}
            disabled={submitting}
            onClick={() => togglePrimaryOption("twitch")}
          >
            <TwitchIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.link")}
            active={values.selectedPrimaryOption === "link"}
            disabled={submitting}
            onClick={() => togglePrimaryOption("link")}
          >
            <LinkIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.table")}
            active={values.selectedPrimaryOption === "table"}
            disabled={submitting}
            onClick={() => togglePrimaryOption("table")}
          >
            <TableIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.enumeration")}
            active={values.selectedPrimaryOption === "enumeration"}
            disabled={submitting}
            onClick={() => togglePrimaryOption("enumeration")}
          >
            <ListBulletIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.checklist")}
            active={values.selectedPrimaryOption === "checklist"}
            disabled={submitting}
            onClick={() => togglePrimaryOption("checklist")}
          >
            <ChecklistIcon className="h-6 w-6" />
          </IconToggleButton>

          <div className="col-span-4 my-1 hidden h-11 w-px justify-self-center bg-brand-200 sm:mx-3 sm:my-0 sm:block" />

          <IconToggleButton label={t("icon.alarm")} active={values.alarmEnabled} disabled={submitting} onClick={toggleAlarm}>
            <AlarmClockIcon className="h-6 w-6" />
          </IconToggleButton>

          <div className="col-span-4 pt-1 sm:ml-auto sm:flex sm:shrink-0 sm:pl-2 sm:pt-0">
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              className="!text-[#F0F0F0] [--btn-text-hover:#F0F0F0] sm:min-w-[116px] sm:w-auto sm:px-5"
              disabled={submitting}
            >
              {submitting ? t("common.saving") : t("inbox.save")}
            </Button>
          </div>
        </div>
      </section>

      {error && <p className={errorTextClass}>{t("common.errorPrefix", { message: error })}</p>}
    </form>
  );
}
