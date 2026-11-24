export const THEME_STORAGE_KEY = 'super-agents-theme';

export const VALID_THEMES = [
    'dark',
    'light',
    'cyberpunk',
    'nature',
    'ocean',
    'sunset',
    'high-contrast',
] as const;

export type Theme = (typeof VALID_THEMES)[number];

export function isTheme(value: unknown): value is Theme {
    return typeof value === 'string' && (VALID_THEMES as readonly string[]).includes(value);
}

export function readStoredTheme(): Theme | null {
    try {
        const raw =
            typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
        return isTheme(raw) ? raw : null;
    } catch {
        return null;
    }
}

export function writeStoredTheme(theme: Theme): void {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
    } catch {
        /* private mode */
    }
}

export function applyThemeToDocument(theme: Theme): void {
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

export function setTheme(theme: Theme): void {
    writeStoredTheme(theme);
    applyThemeToDocument(theme);
}

export function resolveInitialTheme(): Theme {
    const stored = readStoredTheme();
    if (stored) return stored;
    try {
        if (
            typeof matchMedia !== 'undefined' &&
            matchMedia('(prefers-color-scheme:dark)').matches
        ) {
            return 'dark';
        }
    } catch {
        /* matchMedia unavailable */
    }
    return 'light';
}
