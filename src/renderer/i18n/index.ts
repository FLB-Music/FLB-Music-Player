import en from "./en";
import ptBR from "./pt-BR";

export type LanguageType = "en" | "pt-BR";

export const translations: Record<LanguageType, Record<string, string>> = {
  en,
  "pt-BR": ptBR,
};

export const availableLanguages: { value: LanguageType; label: string }[] = [
  { value: "en", label: "English" },
  { value: "pt-BR", label: "Português (Brasil)" },
];

/**
 * Translates a key, the english string is used when the key is unknown in
 * the selected language.
 */
export function translate(
  language: LanguageType,
  key: string,
  values: Record<string, string | number> = {}
): string {
  const locale = translations[language] || translations.en;
  let text = locale[key];
  if (text === undefined) text = translations.en[key];
  if (text === undefined) return key;

  Object.keys(values).forEach((valueKey) => {
    text = text.replace(new RegExp(`\\{${valueKey}\\}`, "g"), String(values[valueKey]));
  });

  return text;
}
