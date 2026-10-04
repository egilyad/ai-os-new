import { useState, useEffect, useCallback, useReducer } from 'react';
import { settingsService } from '../kernel/instances';
import { t as translate, setLanguage } from './translations';
import { loadLocale, onLocaleLoaded } from './translations/index';

export function useTranslation() {
    const [lang, setLang] = useState<'en' | 'ru'>(() => {
        const s = settingsService.getSettings();
        const l = s.language === 'ru' ? 'ru' : 'en';
        setLanguage(l);
        loadLocale(l);
        // WCAG 3.1.1: keep <html lang> in sync so screen readers pick the
        // right voice; guard for SSR/test environments without document.
        if (typeof document !== 'undefined') document.documentElement.lang = l;
        return l;
    });

    const [, forceRender] = useReducer((x: number) => x + 1, 0);

    useEffect(() => {
        const unsub = settingsService.subscribe((settings) => {
            const l = settings.language === 'ru' ? 'ru' : 'en';
            setLang(l);
            setLanguage(l);
            loadLocale(l);
            if (typeof document !== 'undefined') document.documentElement.lang = l;
        });
        // P-LOW-5: re-render when the async locale bundle lands — otherwise
        // first paint after reload shows raw keys until an unrelated update.
        const unsubLocale = onLocaleLoaded(() => forceRender((x) => x + 1));
        return () => {
            unsub();
            unsubLocale();
        };
    }, []);

    const t = useCallback(
        (key: string, params?: Record<string, string | number>): string => {
            return translate(key, lang, params);
        },
        [lang],
    );

    return { t, lang };
}
