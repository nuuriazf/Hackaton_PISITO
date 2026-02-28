import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { AppLanguage, I18nKey, MESSAGES } from "./messages";

type TranslationValues = Record<string, string | number>;

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: I18nKey, values?: TranslationValues) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function formatMessage(template: string, values?: TranslationValues) {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = values[key];
    return value === undefined ? "" : String(value);
  });
}

function normalizeLanguage(value: string | null): AppLanguage {
  if (value === "es" || value === "en" || value === "fr" || value === "gl") {
    return value;
  }
  return "es";
}

function initialLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return "es";
  }
  return normalizeLanguage(window.localStorage.getItem("appLanguage"));
}

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<AppLanguage>(initialLanguage);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("appLanguage", nextLanguage);
    }
  }, []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== "appLanguage") {
        return;
      }
      setLanguageState(normalizeLanguage(event.newValue));
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const t = useCallback(
    (key: I18nKey, values?: TranslationValues) => {
      const table = MESSAGES[language] ?? MESSAGES.es;
      const template = table[key] ?? MESSAGES.es[key] ?? key;
      return formatMessage(template, values);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t
    }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
