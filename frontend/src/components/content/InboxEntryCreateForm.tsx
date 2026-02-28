import { DragEvent, FormEvent, ReactNode, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { Button } from "../ui/Button";
import {
  BellAlertIcon,
  BookIcon,
  FileDropIcon,
  FoodIcon,
  LinkIcon,
  MusicalNoteIcon,
  PhotoIcon,
  SportIcon,
  TiktokIcon,
  TravelIcon,
  TwitchIcon,
  WeatherIcon,
  YoutubeIcon
} from "../ui/icons";
import { errorTextClass, fieldLabelClass, inputClass, textareaClass } from "../ui/styles";

export type InboxEntryFormValues = {
  title: string;
  textContent: string;
  mediaFile: File | null;
  musicEnabled: boolean;
  linkEnabled: boolean;
  photoEnabled: boolean;
  youtubeEnabled: boolean;
  tiktokEnabled: boolean;
  twitchEnabled: boolean;
  foodEnabled: boolean;
  sportEnabled: boolean;
  travelEnabled: boolean;
  weatherEnabled: boolean;
  bookEnabled: boolean;
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

type ToggleMenuItem =
  | "music"
  | "link"
  | "photo"
  | "youtube"
  | "tiktok"
  | "twitch"
  | "food"
  | "sport"
  | "travel"
  | "weather"
  | "book"
  | "alarm";

type ToggleField =
  | "musicEnabled"
  | "linkEnabled"
  | "photoEnabled"
  | "youtubeEnabled"
  | "tiktokEnabled"
  | "twitchEnabled"
  | "foodEnabled"
  | "sportEnabled"
  | "travelEnabled"
  | "weatherEnabled"
  | "bookEnabled"
  | "alarmEnabled";

const TOGGLE_FIELD_BY_ITEM: Record<ToggleMenuItem, ToggleField> = {
  music: "musicEnabled",
  link: "linkEnabled",
  photo: "photoEnabled",
  youtube: "youtubeEnabled",
  tiktok: "tiktokEnabled",
  twitch: "twitchEnabled",
  food: "foodEnabled",
  sport: "sportEnabled",
  travel: "travelEnabled",
  weather: "weatherEnabled",
  book: "bookEnabled",
  alarm: "alarmEnabled"
};

function toggleButtonClass(active: boolean) {
  return [
    "flex h-11 w-full items-center justify-center rounded-control border transition sm:w-11",
    active
      ? "border-brand-500 bg-brand-500 text-white shadow-sm"
      : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
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
      <span className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[calc(100%+6px)] whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 peer-hover:opacity-100 peer-focus-visible:opacity-100">
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

  function toggleMenuItem(item: ToggleMenuItem) {
    const field = TOGGLE_FIELD_BY_ITEM[item];
    onChange({ [field]: !values[field] } as Partial<InboxEntryFormValues>);
  }

  return (
    <form className="grid w-full gap-3" onSubmit={handleSubmit}>
      <section className="rounded-card border border-brand-200 bg-white/95 p-5 shadow-card md:p-6">
        {heading ? (
          <div className="mb-4">
            <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink-900">{heading}</h2>
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
                  ? "border-brand-500 bg-brand-100 text-brand-800"
                  : "border-brand-200 bg-brand-50 text-ink-700"
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <FileDropIcon className="h-7 w-7" />
              </div>
            </div>
          </label>
        </div>
      </section>

      <section className="rounded-card border border-brand-200 bg-white/95 p-3 shadow-card">
        <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center">
          <IconToggleButton
            label={t("icon.photo")}
            active={values.photoEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("photo")}
          >
            <PhotoIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.youtube")}
            active={values.youtubeEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("youtube")}
          >
            <YoutubeIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.link")}
            active={values.linkEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("link")}
          >
            <LinkIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.music")}
            active={values.musicEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("music")}
          >
            <MusicalNoteIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.tiktok")}
            active={values.tiktokEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("tiktok")}
          >
            <TiktokIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.twitch")}
            active={values.twitchEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("twitch")}
          >
            <TwitchIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.food")}
            active={values.foodEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("food")}
          >
            <FoodIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.sport")}
            active={values.sportEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("sport")}
          >
            <SportIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.travel")}
            active={values.travelEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("travel")}
          >
            <TravelIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.weather")}
            active={values.weatherEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("weather")}
          >
            <WeatherIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.book")}
            active={values.bookEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("book")}
          >
            <BookIcon className="h-6 w-6" />
          </IconToggleButton>
          <IconToggleButton
            label={t("icon.alarm")}
            active={values.alarmEnabled}
            disabled={submitting}
            onClick={() => toggleMenuItem("alarm")}
          >
            <BellAlertIcon className="h-6 w-6" />
          </IconToggleButton>

          <div className="col-span-4 pt-1 sm:ml-auto sm:flex sm:shrink-0 sm:pl-2 sm:pt-0">
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
