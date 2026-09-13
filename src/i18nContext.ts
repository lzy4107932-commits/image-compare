import { createContext } from "react";
import type { Language, TranslationKey } from "./i18n";

export type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
