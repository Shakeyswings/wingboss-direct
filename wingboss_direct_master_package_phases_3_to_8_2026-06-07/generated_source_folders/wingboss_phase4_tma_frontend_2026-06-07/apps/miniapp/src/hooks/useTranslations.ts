import translations from '../data/translations.json';

export function useTranslations(lang: string) {
  function t(key: string): string {
    const entry = (translations.strings as Record<string, Record<string, string>>)[key];
    if (!entry) return key;
    const value = entry[lang] || entry[translations.fallbackLanguage] || entry.en || key;
    return value.includes('_TRANSLATION_REQUIRED') ? (entry.en || key) : value;
  }
  return { t };
}
