import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useUiPreferences } from '../../stores/uiPreferencesStore';

export type LayoutMode =
    'default' | 'wide' | 'focus' | 'presentation' | 'debug' | 'mobile' | 'cinema';

export const LAYOUT_LABELS: Record<LayoutMode, string> = {
    default: 'Default',
    wide: 'Wide',
    focus: 'Focus',
    presentation: 'Presentation',
    debug: 'Debug',
    mobile: 'Mobile',
    cinema: 'Cinema',
};

export const LAYOUT_ICONS: Record<LayoutMode, string> = {
    default: '⊞',
    wide: '⇔',
    focus: '◎',
    presentation: '▣',
    debug: '⚙',
    mobile: '📱',
    cinema: '🎬',
};

function getStoredLayout(
    route: string,
    layout: LayoutMode | null,
    defaultLayout: LayoutMode,
    perRouteLayout: Record<string, LayoutMode>,
): LayoutMode {
    if (layout) return layout;
    if (perRouteLayout[route]) return perRouteLayout[route];
    if (defaultLayout) return defaultLayout;
    return 'default';
}

export interface LayoutContextValue {
    layout: LayoutMode;
    setLayout: (mode: LayoutMode, global?: boolean) => void;
    isGlobal: boolean;
    setIsGlobal: (v: boolean) => void;
    availableLayouts: LayoutMode[];
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayout(): LayoutContextValue {
    const ctx = useContext(LayoutContext);
    if (!ctx) throw new Error('useLayout must be used within LayoutProvider');
    return ctx;
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const route = location.pathname;
    const { defaultLayout, perRouteLayout, setLayout: storeSetLayout } = useUiPreferences();

    const [isGlobal, setIsGlobal] = useState(() => {
        return !perRouteLayout[route];
    });

    const [layout, setLayoutState] = useState<LayoutMode>(() => {
        return (
            getStoredLayout(route, perRouteLayout[route] ?? null, defaultLayout, perRouteLayout) ||
            'default'
        );
    });

    useEffect(() => {
        const { defaultLayout: def, perRouteLayout: perRoute } = useUiPreferences.getState();
        const stored = perRoute[route] ?? null;
        if (stored) {
            setLayoutState(stored);
            setIsGlobal(false);
        } else if (def) {
            setLayoutState(def);
            setIsGlobal(true);
        } else {
            setLayoutState('default');
            setIsGlobal(true);
        }
    }, [route]);

    const setLayout = useCallback(
        (mode: LayoutMode, global?: boolean) => {
            const g = global ?? isGlobal;
            setLayoutState(mode);
            storeSetLayout(route, mode, g);
        },
        [route, isGlobal, storeSetLayout],
    );

    const availableLayouts = useMemo((): LayoutMode[] => {
        if (route.startsWith('/debate'))
            return ['default', 'wide', 'cinema', 'focus', 'presentation'];
        if (route.startsWith('/chat')) return ['default', 'wide', 'focus'];
        if (route.startsWith('/ecosystem') || route.startsWith('/aquarium'))
            return ['default', 'wide', 'cinema'];
        return ['default', 'wide', 'focus', 'debug'];
    }, [route]);

    return (
        <LayoutContext.Provider
            value={{ layout, setLayout, isGlobal, setIsGlobal, availableLayouts }}
        >
            <div data-layout={layout} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                {children}
            </div>
        </LayoutContext.Provider>
    );
}
