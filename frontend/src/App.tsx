import { Navigate, Route, Routes } from "react-router-dom";
import { AuthEntryGate } from "./components/auth/AuthEntryGate";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { ContentDashboard } from "./components/content/ContentDashboard";
import { appCenterClass, appShellClass, panelClass } from "./components/ui/styles";
import { useAuthSession } from "./hooks/useAuthSession";
import { useEntriesCrud } from "./hooks/useEntriesCrud";

function App() {
  const auth = useAuthSession();
  const entriesCrud = useEntriesCrud({
    enabled: Boolean(auth.authUser),
    onUnauthorized: auth.expireSession
  });

  if (auth.checkingSession) {
    return (
      <main className={appShellClass}>
        <section className={appCenterClass}>
          <section className={`${panelClass} max-w-[420px] text-center`}>
            <p className="text-ink-700">Comprobando sesion...</p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className={appShellClass}>
      <section className={appCenterClass}>
        <Routes>
          <Route
            path="/"
            element={auth.authUser ? <Navigate to="/dashboard" replace /> : <AuthEntryGate />}
          />

          <Route
            path="/login"
            element={
              auth.authUser ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginForm
                  submitting={auth.authSubmitting}
                  error={auth.authError}
                  onSubmit={auth.loginUser}
                />
              )
            }
          />

          <Route
            path="/register"
            element={
              auth.authUser ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <RegisterForm
                  submitting={auth.authSubmitting}
                  error={auth.authError}
                  onSubmit={auth.registerUser}
                />
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
                  entries={entriesCrud.entries}
                  newEntryTitle={entriesCrud.newEntryTitle}
                  resourceForm={entriesCrud.resourceForm}
                  loading={entriesCrud.loading}
                  sending={entriesCrud.sending}
                  error={entriesCrud.error}
                  onLogout={auth.logout}
                  onEntryTitleChange={entriesCrud.setNewEntryTitle}
                  onResourceFormChange={entriesCrud.patchResourceForm}
                  onCreateEntry={entriesCrud.onCreateEntry}
                  onCreateResource={entriesCrud.onCreateResource}
                  onDeleteEntry={entriesCrud.onDeleteEntry}
                  onDeleteResource={entriesCrud.onDeleteResource}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </section>
    </main>
  );
}

export default App;
