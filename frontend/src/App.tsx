import { ReactNode, useCallback } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthEntryGate } from "./components/auth/AuthEntryGate";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { ContentInbox } from "./components/content/ContentInbox";
import { appCenterClass, appShellClass, panelClass } from "./components/ui/styles";
import { useAuthSession } from "./hooks/useAuthSession";
import { useI18n } from "./i18n/I18nProvider";
import type { AuthCredentials } from "./types/auth";
import { ContentExtensionWidget } from "./components/content/ContentExtensionWidget";

function App() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const auth = useAuthSession();

  const withAuthCardLayout = useCallback(
    (content: ReactNode) => (
      <section className={appShellClass}>
        <section className={appCenterClass}>{content}</section>
      </section>
    ),
    []
  );

  const onLoginSubmit = useCallback(
    async (credentials: AuthCredentials) => {
      const success = await auth.loginUser(credentials);
      if (success) {
        navigate("/inbox", { replace: true });
      }
    },
    [auth.loginUser, navigate]
  );

  const onRegisterSubmit = useCallback(
    async (credentials: AuthCredentials) => {
      const success = await auth.registerUser(credentials);
      if (success) {
        navigate("/inbox", { replace: true });
      }
    },
    [auth.registerUser, navigate]
  );

  if (auth.checkingSession) {
    return (
      <main className="min-h-screen">
        <section className={appShellClass}>
          <section className={appCenterClass}>
            <section className={`${panelClass} max-w-[420px] text-center`}>
              <p className="text-ink-700">{t("app.checkingSession")}</p>
            </section>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Routes>
        <Route
          path="/"
          element={
            auth.authUser ? <Navigate to="/inbox" replace /> : withAuthCardLayout(<AuthEntryGate />)
          }
        />

        <Route
          path="/login"
          element={
            auth.authUser ? (
              <Navigate to="/inbox" replace />
            ) : (
              withAuthCardLayout(
                <LoginForm
                  submitting={auth.authSubmitting}
                  error={auth.authError}
                  onSubmit={onLoginSubmit}
                />
              )
            )
          }
        />

        <Route
          path="/register"
          element={
            auth.authUser ? (
              <Navigate to="/inbox" replace />
            ) : (
              withAuthCardLayout(
                <RegisterForm
                  submitting={auth.authSubmitting}
                  error={auth.authError}
                  onSubmit={onRegisterSubmit}
                />
              )
            )
          }
        />

        <Route
          path="/inbox"
          element={
            auth.authUser ? (
              <ContentInbox
                username={auth.authUser.username}
                submitting={auth.authSubmitting}
                error={auth.authError}
                onUpdateUsername={auth.updateUsernameUser}
                onUpdatePassword={auth.updatePasswordUser}
                onClearError={auth.clearAuthError}
                onLogout={auth.logout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/explore"
          element={
            auth.authUser ? (
              <ContentInbox
                username={auth.authUser.username}
                submitting={auth.authSubmitting}
                error={auth.authError}
                onUpdateUsername={auth.updateUsernameUser}
                onUpdatePassword={auth.updatePasswordUser}
                onClearError={auth.clearAuthError}
                onLogout={auth.logout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/library"
          element={
            auth.authUser ? (
              <ContentInbox
                username={auth.authUser.username}
                submitting={auth.authSubmitting}
                error={auth.authError}
                onUpdateUsername={auth.updateUsernameUser}
                onUpdatePassword={auth.updatePasswordUser}
                onClearError={auth.clearAuthError}
                onLogout={auth.logout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/relationship-graph"
          element={
            auth.authUser ? (
              <ContentInbox
                username={auth.authUser.username}
                submitting={auth.authSubmitting}
                error={auth.authError}
                onUpdateUsername={auth.updateUsernameUser}
                onUpdatePassword={auth.updatePasswordUser}
                onClearError={auth.clearAuthError}
                onLogout={auth.logout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/profile"
          element={
            auth.authUser ? (
              <ContentInbox
                username={auth.authUser.username}
                submitting={auth.authSubmitting}
                error={auth.authError}
                onUpdateUsername={auth.updateUsernameUser}
                onUpdatePassword={auth.updatePasswordUser}
                onClearError={auth.clearAuthError}
                onLogout={auth.logout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/extension-widget"
          element={
            auth.authUser ? (
              <ContentExtensionWidget onLogout={auth.logout} />
            ) : (
              // Si no está logueado, le mostramos el login normal
              <Navigate to="/" replace /> 
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;
