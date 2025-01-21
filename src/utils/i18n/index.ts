import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import Backend from "i18next-http-backend"
import { initReactI18next } from "react-i18next"

export const supportedLanguages = [
  {
    locale: "en",
    name: "English",
  },
  {
    locale: "uk",
    name: "Українська",
  },
  {
    locale: "ru",
    name: "Русский",
  }
].sort((a, b) => a.locale.localeCompare(b.locale))

void i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  // https://www.i18next.com/overview/configuration-options
  .init({
    // backend: {
    //   loadPath: pathToLoadFrom,
    // },
    supportedLngs: supportedLanguages.map((l) => l.locale),
    fallbackLng: "en",
    returnNull: false,
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    resources: {
        
    },
    load: "currentOnly",
    // https://github.com/i18next/i18next-browser-languageDetector#detector-options
    detection: {
      convertDetectedLanguage: (lng) => lng.split("-")[0],
    },
  })
