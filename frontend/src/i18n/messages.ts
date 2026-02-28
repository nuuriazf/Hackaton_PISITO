import { EN_MESSAGES } from "./locales/en";
import { ES_MESSAGES } from "./locales/es";
import { FR_MESSAGES } from "./locales/fr";
import { GL_MESSAGES } from "./locales/gl";

export type I18nKey = keyof typeof ES_MESSAGES;
export type AppLanguage = "es" | "en" | "fr" | "gl";
export type MessageDictionary = Record<I18nKey, string>;

export const MESSAGES: Record<AppLanguage, MessageDictionary> = {
  es: ES_MESSAGES,
  en: EN_MESSAGES,
  fr: FR_MESSAGES,
  gl: GL_MESSAGES
};
