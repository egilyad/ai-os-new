/**
 * ResponsiveShell — Phase 2 Foundation (STATIC, presentation only).
 *
 * Additive shell over AppLayout. No kernel/domain/runtime change.
 * Single source for breakpoint: mobile <768, tablet <1024, else desktop.
 * Panels should use `useResponsive()` instead of ad-hoc `isDesktop` / `useMediaQuery`.
 * D panels (React Flow 3-pane) stay Desktop recommended — shell just hides them on mobile with banner.
 */

import React, { createContext, useContext } from 'react';
import { useBreakpoint, type Breakpoint } from '../../hooks/useBreakpoint';

interface ResponsiveContextValue {
    breakpoint: Breakpoint;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextValue>({
    breakpoint: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
});

export function useResponsive(): ResponsiveContextValue {
    return useContext(ResponsiveContext);
}

export const ResponsiveShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const breakpoint = useBreakpoint();
    const value: ResponsiveContextValue = {
        breakpoint,
        isMobile: breakpoint === 'mobile',
        isTablet: breakpoint === 'tablet',
        isDesktop: breakpoint === 'desktop',
    };
    return (
        <ResponsiveContext.Provider value={value}>
            <div
                className={`responsive-shell responsive-shell--${breakpoint}`}
                data-breakpoint={breakpoint}
                style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
            >
                {children}
            </div>
        </ResponsiveContext.Provider>
    );
};

/** Desktop-only banner for D panels — use inside panel instead of hiding silently. */
export const DesktopRecommended: React.FC<{ title?: string }> = ({ title = 'Desktop recommended' }) => {
    const { isMobile } = useResponsive();
    if (!isMobile) return null;
    return (
        <div style={{ padding: '0.6rem 0.8rem', marginBottom: '0.6rem', borderRadius: 8, border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.08)', fontSize: '0.85rem' }}>
            🖥️ {title} — этот раздел оптимизирован для десктопа. На телефоне доступен в режиме просмотра, редактирование — с ПК.
        </div>
    );
};
