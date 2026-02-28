import { useCallback, useEffect, useState } from "react";
import { getMe, login, register, updatePassword, updateUsername } from "../api/auth";
import { clearAccessToken, getAccessToken, setAccessToken } from "../api/client";
import { useI18n } from "../i18n/I18nProvider";
import type {
  AuthCredentials,
  AuthTokenResponse,
  AuthUser,
  UpdatePasswordInput,
  UpdateUsernameInput
} from "../types/auth";
import { readErrorMessage } from "../utils/error";

export function useAuthSession() {
  const { t } = useI18n();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function bootstrapSession() {
      try {
        const user = await getMe();
        if (!ignore) {
          setAuthUser(user);
          setAuthError(null);
        }
      } catch {
        clearAccessToken();
        if (!ignore) {
          setAuthUser(null);
        }
      } finally {
        if (!ignore) {
          setCheckingSession(false);
        }
      }
    }

    if (!getAccessToken()) {
      setCheckingSession(false);
      return () => {
        ignore = true;
      };
    }

    void bootstrapSession();
    return () => {
      ignore = true;
    };
  }, []);

  const executeAuth = useCallback(
    async (request: () => Promise<AuthTokenResponse>) => {
      try {
        setAuthSubmitting(true);
        setAuthError(null);

        const response = await request();
        setAccessToken(response.accessToken);
        setAuthUser(response.user);
        return true;
      } catch (error) {
        setAuthError(readErrorMessage(error, t("common.unexpectedError")));
        return false;
      } finally {
        setAuthSubmitting(false);
      }
    },
    [t]
  );

  const loginUser = useCallback(
    async (credentials: AuthCredentials) => executeAuth(() => login(credentials)),
    [executeAuth]
  );

  const registerUser = useCallback(
    async (credentials: AuthCredentials) => executeAuth(() => register(credentials)),
    [executeAuth]
  );

  const updateUsernameUser = useCallback(
    async (input: UpdateUsernameInput) => executeAuth(() => updateUsername(input)),
    [executeAuth]
  );

  const updatePasswordUser = useCallback(
    async (input: UpdatePasswordInput) => executeAuth(() => updatePassword(input)),
    [executeAuth]
  );

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setAuthUser(null);
    setAuthError(null);
  }, []);

  const expireSession = useCallback(() => {
    clearAccessToken();
    setAuthUser(null);
    setAuthError(t("auth.sessionExpired"));
  }, [t]);

  return {
    authUser,
    checkingSession,
    authSubmitting,
    authError,
    loginUser,
    registerUser,
    updateUsernameUser,
    updatePasswordUser,
    clearAuthError,
    logout,
    expireSession
  };
}
