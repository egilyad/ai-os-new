// Re-export from new modular structure for backward compatibility
export { translations, getTranslation, DEFAULT_LOCALE } from './translations/index';
export type { Locale, TranslationKey } from './translations/index';

import { getTranslation as _getTranslation } from './translations/index';

let currentLang: 'en' | 'ru' = 'en';

export function setLanguage(lang: 'en' | 'ru') {
    currentLang = lang;
}

export function getLanguage(): 'en' | 'ru' {
    return currentLang;
}

export function t(
    key: string,
    lang?: 'en' | 'ru',
    params?: Record<string, string | number>,
): string {
    return _getTranslation(lang ?? currentLang, key, params);
}
