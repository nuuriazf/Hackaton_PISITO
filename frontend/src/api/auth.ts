import { api } from "./client";
import type {
  AuthCredentials,
  AuthTokenResponse,
  AuthUser,
  UpdatePasswordInput,
  UpdateUsernameInput
} from "../types/auth";

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

export function updateUsername(input: UpdateUsernameInput) {
  return api<AuthTokenResponse>("/auth/me/username", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function updatePassword(input: UpdatePasswordInput) {
  return api<AuthTokenResponse>("/auth/me/password", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}
