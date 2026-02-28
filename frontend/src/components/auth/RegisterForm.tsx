import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { validatePassword, validateUsername } from "../../features/auth/formValidation";
import { useI18n } from "../../i18n/I18nProvider";
import type { I18nKey } from "../../i18n/messages";
import type { AuthCredentials } from "../../types/auth";
import { Button, buttonClass } from "../ui/Button";
import { ArrowLongLeftIcon } from "../ui/icons";
import { errorTextClass, fieldLabelClass, inputClass, pageTitleClass } from "../ui/styles";

type RegisterFormProps = {
  submitting: boolean;
  error: string | null;
  onSubmit: (credentials: AuthCredentials) => Promise<void> | void;
};

function validateConfirmPassword(password: string, confirmPassword: string): I18nKey | null {
  if (!confirmPassword) {
    return "validation.confirm.required";
  }
  if (password !== confirmPassword) {
    return "validation.confirm.mismatch";
  }
  return null;
}

export function RegisterForm({ submitting, error, onSubmit }: RegisterFormProps) {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
  const confirmPasswordError = useMemo(
    () => (submitAttempted ? validateConfirmPassword(password, confirmPassword) : null),
    [submitAttempted, password, confirmPassword]
  );
  const usernameErrorText = username.trim() ? usernameError : null;
  const passwordErrorText = password ? passwordError : null;
  const confirmPasswordErrorText = confirmPassword ? confirmPasswordError : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    const nextUsernameError = validateUsername(username);
    const nextPasswordError = validatePassword(password);
    const nextConfirmPasswordError = validateConfirmPassword(password, confirmPassword);
    if (nextUsernameError || nextPasswordError || nextConfirmPasswordError) {
      return;
    }

    await onSubmit({ username: normalizedUsername, password });
  }

  return (
    <section className="flex min-h-[520px] w-full max-w-[500px] flex-col rounded-card border border-brand-200 bg-brand-50 p-5 shadow-card sm:min-h-[560px] sm:p-6 md:min-h-[620px] md:p-8">
      <form className="flex h-full flex-1 flex-col" onSubmit={handleSubmit}>
        <div className="flex justify-start">
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

        <header className="mt-5 text-center sm:mt-6">
          <h1
            className={`${pageTitleClass} text-[2rem] font-extrabold leading-[1.07] tracking-[-0.03em] sm:text-[2.4rem]`}
          >
            {t("register.title")}
          </h1>
          <p className="text-base leading-relaxed text-ink-600 sm:text-[1.05rem]">{t("register.subtitle")}</p>
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
              autoComplete="new-password"
              placeholder={t("auth.passwordPlaceholder")}
              className={`${inputClass} ${passwordError ? "border-rose-500 focus:border-rose-600 focus:ring-rose-100" : ""}`}
              aria-invalid={Boolean(passwordError)}
              value={password}
              disabled={submitting}
              onChange={(event) => setPassword(event.target.value)}
            />
            {passwordErrorText && <p className="text-sm font-medium text-rose-700">{t(passwordErrorText)}</p>}
          </label>

          <label className={`${fieldLabelClass} ${confirmPasswordError ? "text-rose-700" : ""}`}>
            <span>{t("auth.confirmPasswordLabel")}</span>
            <input
              type="password"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              placeholder={t("auth.passwordPlaceholder")}
              className={`${inputClass} ${confirmPasswordError ? "border-rose-500 focus:border-rose-600 focus:ring-rose-100" : ""}`}
              aria-invalid={Boolean(confirmPasswordError)}
              value={confirmPassword}
              disabled={submitting}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {confirmPasswordErrorText && (
              <p className="text-sm font-medium text-rose-700">{t(confirmPasswordErrorText)}</p>
            )}
          </label>

          {error && <p className={errorTextClass}>{t("common.errorPrefix", { message: error })}</p>}
        </div>

        <Button type="submit" variant="secondary" size="lg" className="mt-auto" disabled={submitting}>
          {submitting ? t("register.submitting") : t("common.accept")}
        </Button>
      </form>
    </section>
  );
}
