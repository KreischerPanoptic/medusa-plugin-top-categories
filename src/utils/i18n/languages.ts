import { enUS, uk, ru } from "date-fns/locale"
import { Language } from "./types"

export const languages: Language[] = [
  {
    code: "en",
    display_name: "English",
    ltr: true,
    date_locale: enUS,
  },
  {
    code: "uk",
    display_name: "Українська",
    ltr: true,
    date_locale: uk,
  },
  {
    code: "ru",
    display_name: "Русский",
    ltr: true,
    date_locale: ru,
  },
]
