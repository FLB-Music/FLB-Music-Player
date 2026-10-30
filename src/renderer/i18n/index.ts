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
 * Removes the differences that are easy to make by hand when a key is built
 * from a name: case, spaces, dashes and underscores. "Hip Hop", "hipHop" and
 * "hip-hop" all become "hiphop".
 */
function looseKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]+/g, "");
}

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

  // A key that is built from a name (a preset, a tab, a language) can miss
  // the exact casing. Showing the raw key to the user looks broken, so the
  // same key with the case and the separators ignored is looked up before
  // giving up.
  if (text === undefined) {
    const wanted = looseKey(key);
    const sameKeyIgnoringCase = (dictionary: Record<string, string>) => {
      const candidate = Object.keys(dictionary).find(
        (name) => looseKey(name) === wanted
      );
      return candidate ? dictionary[candidate] : undefined;
    };
    const looseMatch =
      sameKeyIgnoringCase(locale) || sameKeyIgnoringCase(translations.en);
    if (looseMatch !== undefined) text = looseMatch;
  }

  if (text === undefined) return key;

  Object.keys(values).forEach((valueKey) => {
    text = text.replace(new RegExp(`\\{${valueKey}\\}`, "g"), String(values[valueKey]));
  });

  return text;
}
