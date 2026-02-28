import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isApiError } from "../../api/client";
import { createEntry } from "../../api/resources";
import { validatePassword, validateUsername } from "../../features/auth/formValidation";
import { useI18n } from "../../i18n/I18nProvider";
import type { AppLanguage, I18nKey } from "../../i18n/messages";
import type { UpdatePasswordInput, UpdateUsernameInput } from "../../types/auth";
import type { CreateEntryResourceInput, EntryFlag } from "../../types/resource";
import { readErrorMessage } from "../../utils/error";
import {
  Cog6ToothIcon,
  InboxArrowDownIcon,
  MagnifyingGlassIcon,
  NotificationBellIcon,
  PencilSquareIcon,
  RelationshipGraphIcon,
  StorageIcon,
  UserIcon,
  XMarkIcon
} from "../ui/icons";
import { errorTextClass } from "../ui/styles";
import { SuccessToast } from "../ui/SuccessToast";
import {
  InboxEntryCreateForm,
  type InboxEntryFormValues
} from "./InboxEntryCreateForm";
import { ProfileLogoutButton } from "./profile/ProfileLogoutButton";
import { ProfilePasswordForm } from "./profile/ProfilePasswordForm";
import { ProfileUsernameForm } from "./profile/ProfileUsernameForm";

type ContentInboxProps = {
  username: string;
  submitting: boolean;
  error: string | null;
  onUpdateUsername: (input: UpdateUsernameInput) => Promise<boolean> | boolean;
  onUpdatePassword: (input: UpdatePasswordInput) => Promise<boolean> | boolean;
  onClearError: () => void;
  onLogout: () => void;
};

type InboxSection = "explore" | "storage" | "inbox" | "relationshipGraph" | "profile";
type ProfileFormSection = "username" | "password";

const INITIAL_INBOX_ENTRY_FORM: InboxEntryFormValues = {
  title: "",
  textContent: "",
  mediaFile: null,
  musicEnabled: false,
  linkEnabled: false,
  photoEnabled: false,
  youtubeEnabled: false,
  tiktokEnabled: false,
  twitchEnabled: false,
  foodEnabled: false,
  sportEnabled: false,
  travelEnabled: false,
  weatherEnabled: false,
  bookEnabled: false,
  alarmEnabled: false
};

const footerButtonBaseClass =
  "flex h-full flex-1 items-center justify-center text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70";

const LANGUAGE_OPTIONS: AppLanguage[] = ["es", "en", "fr", "gl"];

function footerButtonClass(active: boolean, withRightBorder: boolean) {
  return [
    footerButtonBaseClass,
    withRightBorder ? "border-r border-brand-200" : "",
    active ? "bg-brand-200 text-brand-800" : "bg-white/85 text-ink-700 hover:bg-brand-100"
  ]
    .filter(Boolean)
    .join(" ");
}

function buildMediaStorageKey(fileName: string) {
  const safeName =
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "") || "archivo";

  return `uploads/${Date.now()}-${safeName}`;
}

function resolveEntryFlag(form: InboxEntryFormValues): EntryFlag {
  if (form.photoEnabled) return "PHOTO";
  if (form.youtubeEnabled) return "YOUTUBE";
  if (form.linkEnabled) return "LINK";
  if (form.musicEnabled) return "SPOTIFY";
  if (form.tiktokEnabled) return "TIKTOK";
  if (form.twitchEnabled) return "TWITCH";
  if (form.foodEnabled) return "FOOD";
  if (form.sportEnabled) return "SPORT";
  if (form.travelEnabled) return "TRAVEL";
  if (form.weatherEnabled) return "WEATHER";
  if (form.bookEnabled) return "BOOK";
  if (form.alarmEnabled) return "ALARM";
  return "TEXT";
}

const SECTION_PATH_MAP: Record<InboxSection, string> = {
  explore: "/explore",
  storage: "/storage",
  inbox: "/inbox",
  relationshipGraph: "/relationship-graph",
  profile: "/profile"
};

const SECTION_TITLE_KEY_MAP: Record<Exclude<InboxSection, "inbox" | "profile">, I18nKey> = {
  explore: "section.explore",
  storage: "section.storage",
  relationshipGraph: "section.relationshipGraph"
};

function sectionFromPath(pathname: string): InboxSection {
  if (pathname === "/profile") {
    return "profile";
  }

  if (pathname === "/explore") {
    return "explore";
  }

  if (pathname === "/storage") {
    return "storage";
  }

  if (pathname === "/relationship-graph") {
    return "relationshipGraph";
  }

  return "inbox";
}

export function ContentInbox({
  username,
  submitting,
  error,
  onUpdateUsername,
  onUpdatePassword,
  onClearError,
  onLogout
}: ContentInboxProps) {
  const { language: appLanguage, setLanguage: setAppLanguage, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<InboxSection>(sectionFromPath(location.pathname));
  const [inboxEntryForm, setInboxEntryForm] = useState<InboxEntryFormValues>(
    INITIAL_INBOX_ENTRY_FORM
  );
  const [inboxSubmitting, setInboxSubmitting] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [inboxMessage, setInboxMessage] = useState<string | null>(null);

  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameCurrentPassword, setUsernameCurrentPassword] = useState("");
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNext, setPasswordNext] = useState("");
  const [usernameValidationError, setUsernameValidationError] = useState<I18nKey | null>(null);
  const [passwordValidationError, setPasswordValidationError] = useState<I18nKey | null>(null);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [activeProfileForm, setActiveProfileForm] = useState<ProfileFormSection | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const headerMenusRef = useRef<HTMLDivElement | null>(null);
  const successToastMessage = usernameMessage ?? passwordMessage ?? inboxMessage;

  useEffect(() => {
    setUsernameDraft("");
  }, [username]);

  useEffect(() => {
    setActiveSection(sectionFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (!settingsOpen && !notificationsOpen) {
      return;
    }

    function handleDocumentMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!headerMenusRef.current?.contains(target)) {
        setNotificationsOpen(false);
        setSettingsOpen(false);
      }
    }

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [notificationsOpen, settingsOpen]);

  useEffect(() => {
    if (!successToastMessage) {
      setToastVisible(false);
      return;
    }

    setToastVisible(true);
    const hideTimer = window.setTimeout(() => setToastVisible(false), 2600);
    const clearTimer = window.setTimeout(() => {
      setUsernameMessage(null);
      setPasswordMessage(null);
      setInboxMessage(null);
    }, 3000);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [successToastMessage]);

  function resetProfileFeedback() {
    setUsernameValidationError(null);
    setPasswordValidationError(null);
    setUsernameMessage(null);
    setPasswordMessage(null);
    setActiveProfileForm(null);
    onClearError();
  }

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

    const resources: CreateEntryResourceInput[] = [];
    const textContent = inboxEntryForm.textContent.trim();
    if (textContent) {
      resources.push({
        type: "TEXT",
        textContent
      });
    }

    if (inboxEntryForm.mediaFile) {
      const file = inboxEntryForm.mediaFile;
      resources.push({
        type: "MEDIA",
        title: file.type.startsWith("video/") ? t("resource.video") : t("resource.file"),
        storageKey: buildMediaStorageKey(file.name),
        fileName: file.name,
        mimeType: file.type || undefined
      });
    }

    try {
      setInboxSubmitting(true);
      resetInboxFeedback();

      await createEntry({
        title: title || undefined,
        resources,
        flag: resolveEntryFlag(inboxEntryForm),
        notification: true
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

  async function handleUpdateUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveProfileForm("username");
    setUsernameValidationError(null);
    setUsernameMessage(null);
    setPasswordValidationError(null);
    setPasswordMessage(null);
    onClearError();

    const usernameError = validateUsername(usernameDraft);
    if (usernameError) {
      setUsernameValidationError(usernameError);
      return;
    }

    const currentPasswordError = validatePassword(usernameCurrentPassword);
    if (currentPasswordError) {
      setUsernameValidationError(currentPasswordError);
      return;
    }

    const success = await onUpdateUsername({
      username: usernameDraft.trim().toLowerCase(),
      currentPassword: usernameCurrentPassword
    });

    if (!success) {
      return;
    }

    setUsernameCurrentPassword("");
    setUsernameMessage(t("profile.usernameUpdated"));
    setActiveProfileForm(null);
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveProfileForm("password");
    setPasswordValidationError(null);
    setPasswordMessage(null);
    setUsernameValidationError(null);
    setUsernameMessage(null);
    onClearError();

    const currentPasswordError = validatePassword(passwordCurrent);
    if (currentPasswordError) {
      setPasswordValidationError(currentPasswordError);
      return;
    }

    const newPasswordError = validatePassword(passwordNext);
    if (newPasswordError) {
      setPasswordValidationError(newPasswordError);
      return;
    }

    if (passwordCurrent === passwordNext) {
      setPasswordValidationError("validation.password.different");
      return;
    }

    const success = await onUpdatePassword({
      currentPassword: passwordCurrent,
      newPassword: passwordNext
    });

    if (!success) {
      return;
    }

    setPasswordCurrent("");
    setPasswordNext("");
    setPasswordMessage(t("profile.passwordUpdated"));
    setActiveProfileForm(null);
  }

  function openProfileForm(section: ProfileFormSection) {
    setActiveProfileForm(section);
    setUsernameValidationError(null);
    setPasswordValidationError(null);
    setUsernameMessage(null);
    setPasswordMessage(null);
    onClearError();
  }

  function closeProfileForm() {
    setActiveProfileForm(null);
    setUsernameValidationError(null);
    setPasswordValidationError(null);
    onClearError();
  }

  function changeSection(nextSection: InboxSection) {
    resetProfileFeedback();
    resetInboxFeedback();
    setActiveSection(nextSection);

    const nextPath = SECTION_PATH_MAP[nextSection];
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  }

  return (
    <section className="relative h-screen overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-brand-200">
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-brand-200 bg-white/90 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-lg font-extrabold tracking-tight text-ink-900">{t("app.name")}</h1>
        <div className="relative flex items-center gap-2" ref={headerMenusRef}>
          <div className="relative">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-brand-200 bg-white text-brand-700 transition hover:bg-brand-100"
              aria-label={t("notifications.ariaButton")}
              aria-haspopup="menu"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen((current) => !current);
                setSettingsOpen(false);
              }}
            >
              <NotificationBellIcon className="h-6 w-6" />
            </button>

            {notificationsOpen && (
              <section
                className="absolute right-0 top-[calc(100%+10px)] z-40 h-28 w-56 rounded-card border border-brand-200 bg-white/95 p-3 shadow-card backdrop-blur-sm"
                role="menu"
                aria-label={t("notifications.menuAria")}
              />
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-brand-200 bg-white text-brand-700 transition hover:bg-brand-100"
              aria-label={t("settings.ariaButton")}
              aria-haspopup="menu"
              aria-expanded={settingsOpen}
              onClick={() => {
                setSettingsOpen((current) => !current);
                setNotificationsOpen(false);
              }}
            >
              <Cog6ToothIcon className="h-6 w-6" />
            </button>

            {settingsOpen && (
              <section
                className="absolute right-0 top-[calc(100%+10px)] z-40 w-56 rounded-card border border-brand-200 bg-white/95 p-3 shadow-card backdrop-blur-sm"
                role="menu"
                aria-label={t("settings.menuAria")}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {t("settings.title")}
                </p>

                <div className="mt-3">
                  <p className="text-sm font-bold text-ink-900">{t("settings.language")}</p>
                  <div className="mt-2 grid gap-1">
                    {LANGUAGE_OPTIONS.map((languageOption) => {
                      const selected = appLanguage === languageOption;
                      return (
                        <button
                          key={languageOption}
                          type="button"
                          className={`flex items-center justify-between rounded-control border px-2.5 py-2 text-sm font-semibold transition ${
                            selected
                              ? "border-brand-400 bg-brand-100 text-brand-800"
                              : "border-brand-200 bg-white text-ink-700 hover:bg-brand-50"
                          }`}
                          role="menuitemradio"
                          aria-checked={selected}
                          onClick={() => {
                            setAppLanguage(languageOption);
                            setSettingsOpen(false);
                          }}
                        >
                          <span>{t(`settings.language.${languageOption}` as I18nKey)}</span>
                          {selected ? <span className="text-xs text-brand-700">{t("settings.current")}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </header>

      <main className="scrollbar-brand absolute inset-x-0 bottom-16 top-16 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto w-full max-w-[840px] py-2">
          {activeSection === "profile" ? (
            <section className="flex w-full flex-col gap-4">
              <section className="rounded-card border border-brand-200 bg-white/95 p-5 shadow-card md:p-6">
                <div className="mb-4">
                  <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink-900">
                    {t("profile.title")}
                  </h2>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-control border border-brand-200 bg-white p-3">
                    <div className="grid gap-0.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t("profile.username")}
                      </p>
                      <p className="text-base font-bold text-ink-900">{username}</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-brand-200 text-brand-700 transition hover:bg-brand-100"
                      aria-label={t("profile.editUsernameAria")}
                      onClick={() => openProfileForm("username")}
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-control border border-brand-200 bg-white p-3">
                    <div className="grid gap-0.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t("profile.password")}
                      </p>
                      <p className="text-base font-bold text-ink-900">********</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-brand-200 text-brand-700 transition hover:bg-brand-100"
                      aria-label={t("profile.editPasswordAria")}
                      onClick={() => openProfileForm("password")}
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </section>

              {activeProfileForm === "username" && (
                <section className="rounded-card border border-brand-200 bg-white/95 p-5 shadow-card md:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
                      {t("profile.changeUsernameTitle")}
                    </h2>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-brand-200 text-ink-700 transition hover:bg-brand-100"
                      aria-label={t("profile.hideChangeUsernameAria")}
                      onClick={closeProfileForm}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <ProfileUsernameForm
                    usernameValue={usernameDraft}
                    currentPasswordValue={usernameCurrentPassword}
                    submitting={submitting}
                    onSubmit={handleUpdateUsername}
                    onUsernameChange={(value) => {
                      setUsernameDraft(value);
                      onClearError();
                      setUsernameValidationError(null);
                      setUsernameMessage(null);
                    }}
                    onCurrentPasswordChange={(value) => {
                      setUsernameCurrentPassword(value);
                      onClearError();
                      setUsernameValidationError(null);
                      setUsernameMessage(null);
                    }}
                  />

                  {usernameValidationError && (
                    <p className={errorTextClass}>{t("common.errorPrefix", { message: t(usernameValidationError) })}</p>
                  )}
                  {error && activeProfileForm === "username" && (
                    <p className={errorTextClass}>{t("common.errorPrefix", { message: error })}</p>
                  )}
                </section>
              )}

              {activeProfileForm === "password" && (
                <section className="rounded-card border border-brand-200 bg-white/95 p-5 shadow-card md:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
                      {t("profile.changePasswordTitle")}
                    </h2>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-brand-200 text-ink-700 transition hover:bg-brand-100"
                      aria-label={t("profile.hideChangePasswordAria")}
                      onClick={closeProfileForm}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <ProfilePasswordForm
                    currentPasswordValue={passwordCurrent}
                    newPasswordValue={passwordNext}
                    submitting={submitting}
                    onSubmit={handleUpdatePassword}
                    onCurrentPasswordChange={(value) => {
                      setPasswordCurrent(value);
                      onClearError();
                      setPasswordValidationError(null);
                      setPasswordMessage(null);
                    }}
                    onNewPasswordChange={(value) => {
                      setPasswordNext(value);
                      onClearError();
                      setPasswordValidationError(null);
                      setPasswordMessage(null);
                    }}
                  />

                  {passwordValidationError && (
                    <p className={errorTextClass}>{t("common.errorPrefix", { message: t(passwordValidationError) })}</p>
                  )}
                  {error && activeProfileForm === "password" && (
                    <p className={errorTextClass}>{t("common.errorPrefix", { message: error })}</p>
                  )}
                </section>
              )}

              <section className="mt-auto">
                <ProfileLogoutButton onLogout={onLogout} />
              </section>
            </section>
          ) : activeSection === "inbox" ? (
            <InboxEntryCreateForm
              values={inboxEntryForm}
              submitting={inboxSubmitting}
              error={inboxError}
              heading="Inbox"
              onSubmit={handleCreateInboxEntry}
              onChange={patchInboxEntryForm}
            />
          ) : (
            <section className="rounded-card border border-brand-200 bg-white/95 p-8 text-center shadow-card md:p-10">
              <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink-900">
                {t(SECTION_TITLE_KEY_MAP[activeSection])}
              </h2>
              <p className="mt-3 text-sm font-medium text-ink-600">{t("section.inProgress")}</p>
            </section>
          )}
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-200 bg-white/90 backdrop-blur-sm">
        <div className="flex h-16 w-full">
          <button
            type="button"
            className={footerButtonClass(activeSection === "explore", true)}
            onClick={() => changeSection("explore")}
            aria-label={t("footer.explore")}
          >
            <MagnifyingGlassIcon className="h-7 w-7" />
          </button>
          <button
            type="button"
            className={footerButtonClass(activeSection === "storage", true)}
            onClick={() => changeSection("storage")}
            aria-label={t("footer.storage")}
          >
            <StorageIcon className="h-7 w-7" />
          </button>
          <button
            type="button"
            className={footerButtonClass(activeSection === "inbox", true)}
            onClick={() => changeSection("inbox")}
            aria-label={t("footer.inbox")}
          >
            <InboxArrowDownIcon className="h-7 w-7" />
          </button>
          <button
            type="button"
            className={footerButtonClass(activeSection === "relationshipGraph", true)}
            onClick={() => changeSection("relationshipGraph")}
            aria-label={t("footer.relationshipGraph")}
          >
            <RelationshipGraphIcon className="h-7 w-7" />
          </button>
          <button
            type="button"
            className={footerButtonClass(activeSection === "profile", false)}
            onClick={() => changeSection("profile")}
            aria-label={t("footer.profile")}
          >
            <UserIcon className="h-7 w-7" />
          </button>
        </div>
      </footer>

      <SuccessToast message={successToastMessage} visible={toastVisible} />
    </section>
  );
}


