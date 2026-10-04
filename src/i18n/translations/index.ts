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
    // P-LOW-5: notify subscribers (useTranslation re-renders) — first paint
    // after reload otherwise shows raw keys until some unrelated update.
    for (const cb of [...localeListeners]) {
        try {
            cb();
        } catch {
            /* listener isolation */
        }
    }
    return _loaded[locale]!;
}

type LocaleListener = () => void;
const localeListeners = new Set<LocaleListener>();

/** Subscribe to locale-load completion. Returns an unsubscribe function. */
export function onLocaleLoaded(cb: LocaleListener): () => void {
    localeListeners.add(cb);
    return () => {
        localeListeners.delete(cb);
    };
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
    // i18next-style defaultValue: used only when the key is missing in both
    // locales (previously such calls rendered the raw key). It is NOT a
    // substitution variable.
    const { defaultValue, ...substitutions } =
        (params ?? {}) as Record<string, string | number> & { defaultValue?: unknown };
    let text = localeText ?? enText ?? key;
    if (text === key && typeof defaultValue === 'string') text = defaultValue;

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
        for (const [k, v] of Object.entries(substitutions)) {
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
