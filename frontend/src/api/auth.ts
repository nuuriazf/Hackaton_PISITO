import { api } from "./client";
import type { AuthCredentials, AuthTokenResponse, AuthUser } from "../types/auth";

export function register(credentials: AuthCredentials) {
  return api<AuthTokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export function login(credentials: AuthCredentials) {
  return api<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export function getMe() {
  return api<AuthUser>("/auth/me");
}
