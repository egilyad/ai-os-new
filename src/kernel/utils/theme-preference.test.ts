import { describe, expect, it, beforeEach } from 'vitest';
import {
    THEME_STORAGE_KEY,
    applyThemeToDocument,
    isTheme,
    readStoredTheme,
    resolveInitialTheme,
    setTheme,
} from './theme-preference';

describe('theme preference', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it('валидирует темы', () => {
        expect(isTheme('dark')).toBe(true);
        expect(isTheme('cyberpunk')).toBe(true);
        expect(isTheme('nope')).toBe(false);
        expect(isTheme(undefined)).toBe(false);
    });

    it('один ключ хранилища для всех точек входа', () => {
        setTheme('ocean');
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('ocean');
        expect(document.documentElement.getAttribute('data-theme')).toBe('ocean');
        expect(readStoredTheme()).toBe('ocean');
        expect(resolveInitialTheme()).toBe('ocean');
    });

    it('невалидное значение не ломает чтение', () => {
        localStorage.setItem(THEME_STORAGE_KEY, 'garbage');
        expect(readStoredTheme()).toBeNull();
        applyThemeToDocument('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
});
