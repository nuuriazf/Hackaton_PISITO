import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { validatePassword, validateUsername } from "../../features/auth/formValidation";
import { useI18n } from "../../i18n/I18nProvider";
import type { AuthCredentials } from "../../types/auth";
import { Button, buttonClass } from "../ui/Button";
import { ArrowLongLeftIcon } from "../ui/icons";
import { errorTextClass, fieldLabelClass, inputClass, pageTitleClass } from "../ui/styles";

type LoginFormProps = {
  submitting: boolean;
  error: string | null;
  onSubmit: (credentials: AuthCredentials) => Promise<void> | void;
};

export function LoginForm({ submitting, error, onSubmit }: LoginFormProps) {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const normalizedUsername = useMemo(() => username.trim().toLowerCase(), [username]);
  const usernameError = useMemo(
    () => (submitAttempted ? validateUsername(username) : null),
    [submitAttempted, username]
  );
  const passwordError = useMemo(
    () => (submitAttempted ? validatePassword(password) : null),
    [submitAttempted, password]
  );
  const usernameErrorText = username.trim() ? usernameError : null;
  const passwordErrorText = password ? passwordError : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    const nextUsernameError = validateUsername(username);
    const nextPasswordError = validatePassword(password);
    if (nextUsernameError || nextPasswordError) {
      return;
    }

    await onSubmit({ username: normalizedUsername, password });
  }

  return (
    <section className="relative flex h-[700px] w-full max-w-[890px] flex-col justify-center rounded-card border border-brand-200 bg-[#F9F9F7] p-5 shadow-card sm:h-[720px] sm:p-6 md:h-[740px] md:p-8">
      <form className="flex w-full flex-col" onSubmit={handleSubmit}>
        <div className="absolute left-5 top-5 sm:left-6 sm:top-6 md:left-8 md:top-8">
          <Link
            to="/"
            aria-label={t("common.back")}
            className={buttonClass({
              variant: "ghost",
              fullWidth: false,
              className: "px-2.5 py-2 text-brand-200 hover:text-brand-200"
            })}
          >
            <ArrowLongLeftIcon className="h-6 w-6" />
          </Link>
        </div>

        <div style={{ marginTop: "-60px" }}>
          <header className="mt-5 text-center sm:mt-6">
            <h1
              className={`${pageTitleClass} text-[25px] font-extrabold leading-[1.07] tracking-[-0.03em] sm:text-[31px]`}
            >
              {t("login.title")}
            </h1>
            <p className="text-base leading-relaxed text-ink-600 sm:text-[1.05rem]">{t("login.subtitle")}</p>
          </header>

          <div className="mt-5 grid gap-4 sm:mt-6">
            <label className={`${fieldLabelClass} ${usernameError ? "text-rose-700" : ""}`}>
              <span>{t("auth.usernameLabel")}</span>
              <input
                type="text"
                minLength={3}
                maxLength={40}
                autoComplete="username"
                placeholder={t("auth.usernamePlaceholder")}
                className={`${inputClass} ${usernameError ? "border-rose-500 focus:border-rose-600 focus:ring-rose-100" : ""}`}
                aria-invalid={Boolean(usernameError)}
                value={username}
                disabled={submitting}
                onChange={(event) => setUsername(event.target.value)}
              />
              {usernameErrorText && <p className="text-sm font-medium text-rose-700">{t(usernameErrorText)}</p>}
            </label>

            <label className={`${fieldLabelClass} ${passwordError ? "text-rose-700" : ""}`}>
              <span>{t("auth.passwordLabel")}</span>
              <input
                type="password"
                minLength={8}
                maxLength={72}
                autoComplete="current-password"
                placeholder={t("auth.passwordPlaceholder")}
                className={`${inputClass} ${passwordError ? "border-rose-500 focus:border-rose-600 focus:ring-rose-100" : ""}`}
                aria-invalid={Boolean(passwordError)}
                value={password}
                disabled={submitting}
                onChange={(event) => setPassword(event.target.value)}
              />
              {passwordErrorText && <p className="text-sm font-medium text-rose-700">{t(passwordErrorText)}</p>}
            </label>

            {error && <p className={errorTextClass}>{t("common.errorPrefix", { message: error })}</p>}
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="lg"
            className="mt-6 !text-[#111827]"
            disabled={submitting}
          >
            {submitting ? t("login.submitting") : t("common.continue")}
          </Button>
        </div>
      </form>
    </section>
  );
}
