import { FormEvent, useMemo, useState } from "react";
import { ArrowLongLeftIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { validatePassword, validateUsername } from "../../features/auth/formValidation";
import type { AuthCredentials } from "../../types/auth";
import { Button, buttonClass } from "../ui/Button";
import { errorTextClass, fieldLabelClass, inputClass, pageTitleClass } from "../ui/styles";

type LoginFormProps = {
  submitting: boolean;
  error: string | null;
  onSubmit: (credentials: AuthCredentials) => Promise<void> | void;
};

export function LoginForm({ submitting, error, onSubmit }: LoginFormProps) {
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
    <section className="flex min-h-[520px] w-full max-w-[500px] flex-col rounded-card border border-brand-200 bg-brand-50 p-5 shadow-card sm:min-h-[560px] sm:p-6 md:min-h-[620px] md:p-8">
      <form className="flex h-full flex-1 flex-col" onSubmit={handleSubmit}>
        <div className="flex justify-start">
          <Link
            to="/"
            aria-label="Volver"
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
          <h1 className={`${pageTitleClass} text-[2rem] font-extrabold leading-[1.07] tracking-[-0.03em] sm:text-[2.4rem]`}>
            Iniciar sesión
          </h1>
          <p className="text-base leading-relaxed text-ink-600 sm:text-[1.05rem]">Accede en segundos</p>
        </header>

        <div className="mt-5 grid gap-4 sm:mt-6">
          <label className={`${fieldLabelClass} ${usernameError ? "text-rose-700" : ""}`}>
            <span>Nombre de usuario *</span>
            <input
              type="text"
              minLength={3}
              maxLength={40}
              autoComplete="username"
              placeholder="Introduce nombre"
              className={`${inputClass} ${usernameError ? "border-rose-500 focus:border-rose-600 focus:ring-rose-100" : ""}`}
              aria-invalid={Boolean(usernameError)}
              value={username}
              disabled={submitting}
              onChange={(event) => setUsername(event.target.value)}
            />
            {usernameErrorText && <p className="text-sm font-medium text-rose-700">{usernameErrorText}</p>}
          </label>

          <label className={`${fieldLabelClass} ${passwordError ? "text-rose-700" : ""}`}>
            <span>Contraseña *</span>
            <input
              type="password"
              minLength={8}
              maxLength={72}
              autoComplete="current-password"
              placeholder="********"
              className={`${inputClass} ${passwordError ? "border-rose-500 focus:border-rose-600 focus:ring-rose-100" : ""}`}
              aria-invalid={Boolean(passwordError)}
              value={password}
              disabled={submitting}
              onChange={(event) => setPassword(event.target.value)}
            />
            {passwordErrorText && <p className="text-sm font-medium text-rose-700">{passwordErrorText}</p>}
          </label>

          {error && <p className={errorTextClass}>Error: {error}</p>}
        </div>

        <Button type="submit" variant="secondary" size="lg" className="mt-auto" disabled={submitting}>
          {submitting ? "Entrando..." : "Aceptar"}
        </Button>
      </form>
    </section>
  );
}
