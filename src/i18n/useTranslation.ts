import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../kernel/instances';
import { getTranslation } from './translations';
import { loadLocale } from './translations/index';

let _currentLang: 'en' | 'ru' = 'en';

export function useTranslation() {
    const [lang, setLang] = useState<'en' | 'ru'>(() => {
        const s = settingsService.getSettings();
        const l = s.language === 'ru' ? 'ru' : 'en';
        _currentLang = l;
        loadLocale(l);
        return l;
    });

    useEffect(() => {
        const unsub = settingsService.subscribe((settings) => {
            const l = settings.language === 'ru' ? 'ru' : 'en';
            _currentLang = l;
            setLang(l);
            loadLocale(l);
        });
        return () => {
            unsub();
        };
    }, []);

    const t = useCallback(
        (key: string, params?: Record<string, string | number>): string => {
            return getTranslation(lang, key, params);
        },
        [lang],
    );

    return { t, lang };
}
