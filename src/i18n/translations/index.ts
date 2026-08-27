export type Locale = 'en' | 'ru';
import { techniqueNavEn, techniqueNavRu } from './techniques';
export type TranslationKey = string;

const _loaded: Partial<Record<Locale, Record<string, string>>> = {};

export async function loadLocale(locale: Locale): Promise<Record<string, string>> {
    if (_loaded[locale]) return _loaded[locale]!;
    if (locale === 'ru') {
        const mod = await import('./ru');
        _loaded.ru = { ...mod.ru, ...techniqueNavRu };
    } else {
        const mod = await import('./en');
        _loaded.en = { ...mod.en, ...techniqueNavEn };
    }
    return _loaded[locale]!;
}

export const translations = new Proxy({} as Record<Locale, Record<string, string>>, {
    get(_, locale: string) {
        return _loaded[locale as Locale];
    },
    ownKeys() {
        return Object.keys(_loaded);
    },
    getOwnPropertyDescriptor() {
        return { enumerable: true, configurable: true };
    },
});

export function getTranslation(
    locale: Locale,
    key: TranslationKey,
    params?: Record<string, string | number>,
): string {
    const localeText = _loaded[locale]?.[key];
    const enText = _loaded.en?.[key];
    let text = localeText ?? enText ?? key;

    // FX-02: surface missing keys instead of silently degrading to English or
    // leaking the raw key string. Warn once per key in dev.
    if (import.meta.env?.DEV) {
        const localeMissing = localeText === undefined;
        const enMissing = enText === undefined;
        if ((localeMissing || enMissing) && !_warnedKeys.has(key)) {
            _warnedKeys.add(key);
            console.warn(
                `[i18n] missing translation key "${key}"` +
                    ` (locale=${locale} missing=${localeMissing}, en missing=${enMissing})`,
            );
        }
    }

    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, String(v));
        }
    }
    return text;
}

/** Keys already warned about (dev only), to avoid console spam. */
const _warnedKeys = new Set<string>();

export const DEFAULT_LOCALE: Locale = 'en';

// Kick off initial locale load immediately (non-blocking)
loadLocale(DEFAULT_LOCALE);
