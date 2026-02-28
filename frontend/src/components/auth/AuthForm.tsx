import { FormEvent, useMemo, useState } from "react";
import {
  errorTextClass,
  fieldLabelClass,
  formStackClass,
  helperTextClass,
  inputClass,
  pageTitleClass,
  panelClass,
  primaryButtonClass
} from "../ui/styles";
import type { AuthCredentials, AuthMode } from "../../types/auth";

type AuthFormProps = {
  mode: AuthMode;
  submitting: boolean;
  error: string | null;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (credentials: AuthCredentials) => Promise<void> | void;
};

type ModeContent = {
  title: string;
  subtitle: string;
  submitLabel: string;
};

function getModeContent(mode: AuthMode): ModeContent {
  if (mode === "register") {
    return {
      title: "Create account",
      subtitle: "Register with username and password to continue.",
      submitLabel: "Create account"
    };
  }
  return {
    title: "Sign in",
    subtitle: "Use your existing account to continue.",
    submitLabel: "Sign in"
  };
}

export function AuthForm({ mode, submitting, error, onModeChange, onSubmit }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const content = useMemo(() => getModeContent(mode), [mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername || !password) {
      return;
    }
    await onSubmit({ username: normalizedUsername, password });
  }

  return (
    <section className={`${panelClass} max-w-[460px]`}>
      <header className="mb-3.5">
        <h1 className={pageTitleClass}>{content.title}</h1>
        <p className="text-sm text-ink-600">{content.subtitle}</p>
      </header>

      <div className="mb-3 grid grid-cols-2 gap-2" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
            mode === "login"
              ? "bg-brand-500 text-white"
              : "bg-brand-100 text-brand-600 hover:bg-brand-200"
          }`}
          disabled={submitting}
          onClick={() => onModeChange("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
            mode === "register"
              ? "bg-brand-500 text-white"
              : "bg-brand-100 text-brand-600 hover:bg-brand-200"
          }`}
          disabled={submitting}
          onClick={() => onModeChange("register")}
        >
          Register
        </button>
      </div>

      <form className={`${formStackClass} mb-2`} onSubmit={handleSubmit}>
        <label className={fieldLabelClass}>
          <span className="text-sm text-ink-700">Nombre de usuario</span>
          <input
            type="text"
            minLength={3}
            maxLength={40}
            autoComplete="username"
            placeholder="Introduce nombre"
            className={inputClass}
            value={username}
            disabled={submitting}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label className={fieldLabelClass}>
          <span className="text-sm text-ink-700">Password</span>
          <input
            type="password"
            minLength={8}
            maxLength={72}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="********"
            className={inputClass}
            value={password}
            disabled={submitting}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button type="submit" className={primaryButtonClass} disabled={submitting}>
          {submitting ? "Please wait..." : content.submitLabel}
        </button>
      </form>

      <p className={helperTextClass}>Nombre de usuario: 3-40 caracteres. Contraseña: 8-72 caracteres.</p>
      {error && <p className={errorTextClass}>Error: {error}</p>}
    </section>
  );
}
