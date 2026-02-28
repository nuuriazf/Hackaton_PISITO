import { DragEvent, FormEvent, ReactNode, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { Button } from "../ui/Button";
import {
  AlarmClockIcon,
  ChecklistIcon,
  FileDropIcon,
  LinkIcon,
  ListBulletIcon,
  MusicalNoteIcon,
  SurveyIcon,
  TableIcon,
  TwitchIcon,
  YoutubeIcon
} from "../ui/icons";
import { errorTextClass, fieldLabelClass, inputClass, textareaClass } from "../ui/styles";

type PrimaryInboxOption =
  | "youtube"
  | "spotify"
  | "twitch"
  | "link"
  | "table"
  | "enumeration"
  | "checklist"
  | "survey";

export type InboxEntryFormValues = {
  title: string;
  textContent: string;
  mediaFile: File | null;
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
    "glass-surface flex h-11 w-11 items-center justify-center border transition",
    active
      ? "border-white bg-black/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
      : "text-brand-700 hover:bg-white/20"
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
      <span className="pointer-events-none absolute left-1/2 top-0 z-[200] -translate-x-1/2 -translate-y-[calc(100%+6px)] whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 peer-hover:opacity-100 peer-focus-visible:opacity-100">
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
  const fileInputKey = values.mediaFile
    ? `${values.mediaFile.name}-${values.mediaFile.lastModified}`
    : "empty-media";
  const [isFileDropActive, setIsFileDropActive] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  function updateMediaFile(file: File | null) {
    onChange({ mediaFile: file });
  }

  function handleFileDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsFileDropActive(true);
  }

  function handleFileDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsFileDropActive(false);
    }
  }

  function handleFileDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsFileDropActive(false);
    updateMediaFile(event.dataTransfer.files?.[0] ?? null);
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
      <section className="glass-card h-auto w-full max-w-full p-5 md:p-6 [&_label>span]:text-[#FFFFFF]">
        {heading ? (
          <div className="mb-4">
            <h2
              className="text-center text-[19px] font-medium tracking-tight text-[#FFFFFF]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {t("inbox.composerHeading")}
            </h2>
          </div>
        ) : null}
        <div className="grid gap-4">
          <label className={fieldLabelClass}>
            <span>{t("inbox.titleLabel")}</span>
            <textarea
              maxLength={80}
              rows={1}
              disabled={submitting}
              placeholder={t("inbox.titlePlaceholder")}
              className={`${inputClass} scrollbar-brand min-h-[44px] max-h-[44px] resize-none overflow-x-hidden overflow-y-hidden`}
              value={values.title}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </label>

          <label className={fieldLabelClass}>
            <span>{t("inbox.textLabel")}</span>
            <textarea
              disabled={submitting}
              autoFocus
              placeholder={t("inbox.textPlaceholder")}
              className={`${textareaClass} scrollbar-brand min-h-[160px] max-h-[300px] resize-none overflow-y-scroll`}
              value={values.textContent}
              onChange={(event) => onChange({ textContent: event.target.value })}
            />
          </label>

          <label
            className={`${fieldLabelClass} gap-2`}
            onDragEnter={() => setIsFileDropActive(true)}
            onDragOver={handleFileDragOver}
            onDragLeave={handleFileDragLeave}
            onDrop={handleFileDrop}
          >
            <span>{t("inbox.filesLabel")}</span>
            <input
              key={fileInputKey}
              type="file"
              accept="image/*,audio/*,video/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
              disabled={submitting}
              className="sr-only"
              onChange={(event) => updateMediaFile(event.target.files?.[0] ?? null)}
            />
            <div
              className={`rounded-control border-2 border-dashed px-4 py-5 text-center transition ${
                isFileDropActive
                  ? "border-[#FFFFFF] bg-[#FFFFFF]/20 text-[#FFFFFF]"
                  : "border-[#FFFFFF] bg-[#FFFFFF]/10 text-[#FFFFFF]"
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <FileDropIcon className="h-7 w-7" />
              </div>
            </div>
          </label>
        </div>
      </section>

      <section className="glass-card h-auto w-full max-w-full overflow-visible p-3">
        <div className="flex flex-wrap items-center gap-2">
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
            <MusicalNoteIcon className="h-6 w-6" />
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
          <IconToggleButton
            label={t("icon.survey")}
            active={values.selectedPrimaryOption === "survey"}
            disabled={submitting}
            onClick={() => togglePrimaryOption("survey")}
          >
            <SurveyIcon className="h-6 w-6" />
          </IconToggleButton>

          <div className="my-1 hidden h-11 w-px bg-brand-200 sm:mx-3 sm:my-0 sm:block" />

          <IconToggleButton label={t("icon.alarm")} active={values.alarmEnabled} disabled={submitting} onClick={toggleAlarm}>
            <AlarmClockIcon className="h-6 w-6" />
          </IconToggleButton>

          <div className="w-full pt-1 sm:ml-auto sm:flex sm:w-auto sm:shrink-0 sm:pl-2 sm:pt-0">
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              className="sm:min-w-[116px] sm:w-auto sm:px-5"
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
