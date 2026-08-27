const VALID_THEMES = [
    'dark',
    'light',
    'cyberpunk',
    'nature',
    'ocean',
    'sunset',
    'high-contrast',
] as const;
let e: string | null = null;
try {
    e = typeof localStorage !== 'undefined' ? localStorage.getItem('super-agents-theme') : null;
} catch {
    // localStorage unavailable (SSR, private browsing)
}
let theme = 'light';
try {
    theme =
        e && VALID_THEMES.includes(e as (typeof VALID_THEMES)[number])
            ? e
            : !e &&
                typeof matchMedia !== 'undefined' &&
                matchMedia('(prefers-color-scheme:dark)').matches
              ? 'dark'
              : 'light';
} catch {
    // matchMedia unavailable
}
document.documentElement.setAttribute('data-theme', theme);
