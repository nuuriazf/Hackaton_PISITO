import { FormEvent, useEffect, useState } from "react";
import { validatePassword, validateUsername } from "../../features/auth/formValidation";
import type { UpdatePasswordInput, UpdateUsernameInput } from "../../types/auth";
import { errorTextClass, inputClass } from "../ui/styles";
import { ProfileLogoutButton } from "./profile/ProfileLogoutButton";
import { ProfilePasswordForm } from "./profile/ProfilePasswordForm";
import { ProfileUsernameForm } from "./profile/ProfileUsernameForm";

type ContentDashboardProps = {
  username: string;
  submitting: boolean;
  error: string | null;
  onUpdateUsername: (input: UpdateUsernameInput) => Promise<boolean> | boolean;
  onUpdatePassword: (input: UpdatePasswordInput) => Promise<boolean> | boolean;
  onClearError: () => void;
  onLogout: () => void;
};

type DashboardSection = "left" | "dashboard" | "profile";
type ProfileFormSection = "username" | "password";

const footerButtonBaseClass =
  "h-full flex-1 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70";

function footerButtonClass(active: boolean, withRightBorder: boolean) {
  return [
    footerButtonBaseClass,
    withRightBorder ? "border-r border-brand-200" : "",
    active ? "bg-brand-200 text-brand-800" : "bg-white/85 text-ink-700 hover:bg-brand-100"
  ]
    .filter(Boolean)
    .join(" ");
}

export function ContentDashboard({
  username,
  submitting,
  error,
  onUpdateUsername,
  onUpdatePassword,
  onClearError,
  onLogout
}: ContentDashboardProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>("dashboard");
  const [centerInputValue, setCenterInputValue] = useState("");

  const [usernameDraft, setUsernameDraft] = useState(username);
  const [usernameCurrentPassword, setUsernameCurrentPassword] = useState("");
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNext, setPasswordNext] = useState("");
  const [usernameValidationError, setUsernameValidationError] = useState<string | null>(null);
  const [passwordValidationError, setPasswordValidationError] = useState<string | null>(null);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [activeProfileForm, setActiveProfileForm] = useState<ProfileFormSection | null>(null);

  useEffect(() => {
    setUsernameDraft(username);
  }, [username]);

  function resetProfileFeedback() {
    setUsernameValidationError(null);
    setPasswordValidationError(null);
    setUsernameMessage(null);
    setPasswordMessage(null);
    setActiveProfileForm(null);
    onClearError();
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
    setUsernameMessage("Nombre de usuario actualizado");
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
      setPasswordValidationError("La nueva contrasena debe ser diferente a la actual");
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
    setPasswordMessage("Contrasena actualizada");
  }

  function changeSection(nextSection: DashboardSection) {
    setActiveSection(nextSection);
    resetProfileFeedback();
  }

  return (
    <section className="flex min-h-screen flex-col bg-gradient-to-br from-brand-100 via-brand-50 to-brand-200">
      <header className="flex h-16 items-center justify-between border-b border-brand-200 bg-white/85 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-lg font-extrabold tracking-tight text-ink-900">Pisito</h1>
        <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-sm text-brand-700">
          @{username}
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-6">
        {activeSection === "profile" ? (
          <section className="flex h-full w-full max-w-[760px] flex-col gap-4">
            <section className="rounded-card border border-brand-200 bg-white/95 p-5 shadow-card md:p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">Perfil</h2>
                <p className="text-sm text-ink-600">Edita tu nombre de usuario</p>
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

              {usernameValidationError && <p className={errorTextClass}>Error: {usernameValidationError}</p>}
              {error && activeProfileForm === "username" && <p className={errorTextClass}>Error: {error}</p>}
              {usernameMessage && <p className="my-2 text-sm font-semibold text-emerald-700">{usernameMessage}</p>}
            </section>

            <section className="rounded-card border border-brand-200 bg-white/95 p-5 shadow-card md:p-6">
              <div className="mb-4">
                <h2 className="text-xl font-extrabold tracking-tight text-ink-900">Contrasena</h2>
                <p className="text-sm text-ink-600">Debes indicar la contrasena actual para cambiarla</p>
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

              {passwordValidationError && <p className={errorTextClass}>Error: {passwordValidationError}</p>}
              {error && activeProfileForm === "password" && <p className={errorTextClass}>Error: {error}</p>}
              {passwordMessage && <p className="my-2 text-sm font-semibold text-emerald-700">{passwordMessage}</p>}
            </section>

            <section className="mt-auto">
              <ProfileLogoutButton onLogout={onLogout} />
            </section>
          </section>
        ) : activeSection === "left" ? (
          <div className="w-full max-w-[640px] rounded-card border border-brand-200 bg-white/95 p-6 text-center text-4xl font-extrabold text-brand-700 shadow-card">
            -
          </div>
        ) : (
          <div className="w-full max-w-[640px]">
            <input
              type="text"
              value={centerInputValue}
              placeholder="Escribe aqui..."
              className={`${inputClass} bg-white/95`}
              onChange={(event) => setCenterInputValue(event.target.value)}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-brand-200">
        <div className="flex h-16 w-full">
          <button
            type="button"
            className={footerButtonClass(activeSection === "left", true)}
            onClick={() => changeSection("left")}
          >
            -
          </button>
          <button
            type="button"
            className={footerButtonClass(activeSection === "dashboard", true)}
            onClick={() => changeSection("dashboard")}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={footerButtonClass(activeSection === "profile", false)}
            onClick={() => changeSection("profile")}
          >
            Perfil
          </button>
        </div>
      </footer>
    </section>
  );
}
