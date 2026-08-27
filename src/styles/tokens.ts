import type { CSSProperties } from 'react';

/**
 * FA-02 design tokens — TypeScript mirror of the CSS custom properties
 * defined in `styles/variables.css`.
 *
 * For STATIC inline styles prefer the real CSS variable string via `cssVar('token')`
 * (resolves through the active theme at render time). For DYNAMIC inline styles
 * (values computed in TS, concatenated into a style object) use the pre-built
 * `tokens` map so the source of truth stays the CSS layer.
 *
 * Do NOT introduce raw hex/rgba literals in component code — add a token here
 * (and in variables.css) instead.
 */

export function cssVar(name: string): string {
    return `var(${name})`;
}

/** Pre-resolved `var(--token)` strings for use inside TS-composed style objects. */
export const tokens = {
    slate: {
        50: cssVar('slate-50'),
        100: cssVar('slate-100'),
        200: cssVar('slate-200'),
        300: cssVar('slate-300'),
        400: cssVar('slate-400'),
        500: cssVar('slate-500'),
        600: cssVar('slate-600'),
        700: cssVar('slate-700'),
        800: cssVar('slate-800'),
        900: cssVar('slate-900'),
        950: cssVar('slate-950'),
    },
    accent: cssVar('accent'),
    accentGlow: cssVar('accent-glow'),
    success: cssVar('success'),
    error: cssVar('error'),
    warning: cssVar('warning'),
    info: cssVar('info'),
    purple: cssVar('purple'),
    purpleMuted: cssVar('purple-muted'),
    surface: cssVar('surface'),
    surfaceAlt: cssVar('surface-alt'),
    bgElevated: cssVar('bg-elevated'),
    borderSubtle: cssVar('border-subtle'),
    borderDefault: cssVar('border-default'),
    borderStrong: cssVar('border-strong'),
    space1: cssVar('space-1'),
    space2: cssVar('space-2'),
    space3: cssVar('space-3'),
    space4: cssVar('space-4'),
    space5: cssVar('space-5'),
    space6: cssVar('space-6'),
    space8: cssVar('space-8'),
    radiusSm: cssVar('radius-sm'),
    radiusMd: cssVar('radius-md'),
    radiusLg: cssVar('radius-lg'),
    radiusXl: cssVar('radius-xl'),
    radiusFull: cssVar('radius-full'),
    textXs: cssVar('text-xs'),
    textSm: cssVar('text-sm'),
    textBase: cssVar('text-base'),
    textMd: cssVar('text-md'),
    textLg: cssVar('text-lg'),
    textXl: cssVar('text-xl'),
} as const;

/** Common reusable style fragments expressed through tokens. */
export const tokenStyles = {
    panel: {
        background: tokens.surfaceAlt,
        border: `1px solid ${tokens.borderDefault}`,
        borderRadius: tokens.radiusLg,
        padding: tokens.space4,
    } as CSSProperties,
    card: {
        background: tokens.surface,
        border: `1px solid ${tokens.borderDefault}`,
        borderRadius: tokens.radiusLg,
        padding: tokens.space3,
    } as CSSProperties,
    input: {
        background: tokens.surface,
        border: `1px solid ${tokens.borderDefault}`,
        borderRadius: tokens.radiusLg,
        padding: '0.5rem 0.75rem',
        color: tokens.slate[200],
        fontSize: tokens.textBase,
        outline: 'none',
    } as CSSProperties,
    label: {
        color: tokens.slate[400],
        fontSize: tokens.textSm,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    } as CSSProperties,
    textMuted: { color: tokens.slate[400] } as CSSProperties,
    textSecondary: { color: tokens.slate[500] } as CSSProperties,
} as const;
