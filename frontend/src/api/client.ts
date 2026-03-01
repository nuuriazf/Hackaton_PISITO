const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const AUTH_TOKEN_STORAGE_KEY = "pisito.access_token";

export type ApiError = Error & { status: number };

let cachedAccessToken: string | null | undefined;

function createApiError(status: number, message: string): ApiError {
  const error = new Error(message) as ApiError;
  error.name = "ApiError";
  error.status = status;
  return error;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const fallbackMessage = `Request failed (${response.status})`;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    if (typeof payload === "string" && payload.trim()) {
      return payload;
    }
    if (payload && typeof payload === "object") {
      if ("message" in payload && typeof payload.message === "string" && payload.message.trim()) {
        const message = payload.message.trim();
        if (message.toLowerCase() !== "no message available") {
          return message;
        }
      }
      if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
        const error = payload.error.trim();
        if (error.toLowerCase() !== "no message available") {
          return error;
        }
      }
    }
    return fallbackMessage;
  }

  const text = await response.text();
  return text || fallbackMessage;
}

function readAccessTokenFromStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getAccessToken(): string | null {
  if (cachedAccessToken === undefined) {
    cachedAccessToken = readAccessTokenFromStorage();
  }
  return cachedAccessToken;
}

export function setAccessToken(accessToken: string | null): void {
  cachedAccessToken = accessToken;
  if (typeof window === "undefined") {
    return;
  }
  if (accessToken) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if (!("status" in error)) {
    return false;
  }
  return typeof (error as { status: unknown }).status === "number";
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    throw createApiError(response.status, await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
