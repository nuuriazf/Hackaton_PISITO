import { ReactNode, useCallback } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthEntryGate } from "./components/auth/AuthEntryGate";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { ContentDashboard } from "./components/content/ContentDashboard";
import { appCenterClass, appShellClass, panelClass } from "./components/ui/styles";
import { useAuthSession } from "./hooks/useAuthSession";
import type { AuthCredentials } from "./types/auth";

function App() {
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
        navigate("/dashboard", { replace: true });
      }
    },
    [auth.loginUser, navigate]
  );

  const onRegisterSubmit = useCallback(
    async (credentials: AuthCredentials) => {
      const success = await auth.registerUser(credentials);
      if (success) {
        navigate("/dashboard", { replace: true });
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
              <p className="text-ink-700">Comprobando sesion...</p>
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
            auth.authUser ? <Navigate to="/dashboard" replace /> : withAuthCardLayout(<AuthEntryGate />)
          }
        />

        <Route
          path="/login"
          element={
            auth.authUser ? (
              <Navigate to="/dashboard" replace />
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
              <Navigate to="/dashboard" replace />
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

        <Route path="/registrarse" element={<Navigate to="/register" replace />} />
        <Route path="/registrase" element={<Navigate to="/register" replace />} />

        <Route
          path="/dashboard"
          element={
            auth.authUser ? (
              <ContentDashboard
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
              <ContentDashboard
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;
