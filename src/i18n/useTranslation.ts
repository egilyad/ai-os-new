import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../kernel/instances';
import { t as translate, setLanguage } from './translations';
import { loadLocale } from './translations/index';

export function useTranslation() {
    const [lang, setLang] = useState<'en' | 'ru'>(() => {
        const s = settingsService.getSettings();
        const l = s.language === 'ru' ? 'ru' : 'en';
        setLanguage(l);
        loadLocale(l);
        return l;
    });

    useEffect(() => {
        const unsub = settingsService.subscribe((settings) => {
            const l = settings.language === 'ru' ? 'ru' : 'en';
            setLang(l);
            setLanguage(l);
            loadLocale(l);
        });
        return () => {
            unsub();
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
