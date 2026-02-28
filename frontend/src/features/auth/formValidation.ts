import type { I18nKey } from "../../i18n/messages";

export function validateUsername(username: string): I18nKey | null {
  const normalized = username.trim();
  if (!normalized) {
    return "validation.username.required";
  }
  if (normalized.length < 3 || normalized.length > 40) {
    return "validation.username.length";
  }
  return null;
}

export function validatePassword(password: string): I18nKey | null {
  if (!password) {
    return "validation.password.required";
  }
  if (password.length < 8 || password.length > 72) {
    return "validation.password.length";
  }
  return null;
}
