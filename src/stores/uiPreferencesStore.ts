import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LayoutMode =
    'default' | 'wide' | 'focus' | 'presentation' | 'debug' | 'mobile' | 'cinema';

export interface UiPreferencesState {
    onboardingCompleted: boolean;
    theme: string;
    defaultLayout: LayoutMode;
    perRouteLayout: Record<string, LayoutMode>;
    collapsedSections: string[];
    pinnedSidebar: string[];
    recentCommands: string[];
    designTokenOverrides: Record<string, string>;
}

export interface UiPreferencesActions {
    setOnboardingCompleted: (v: boolean) => void;
    setTheme: (theme: string) => void;
    setLayout: (route: string, mode: LayoutMode, global?: boolean) => void;
    getLayout: (route: string) => LayoutMode | null;
    toggleCollapsedSection: (sectionId: string) => void;
    setPinnedSidebar: (pinned: string[]) => void;
    addRecentCommand: (path: string) => void;
    getRecentCommands: () => string[];
    setDesignTokenOverrides: (overrides: Record<string, string>) => void;
    clearDesignTokenOverrides: () => void;
}

const MAX_RECENT = 8;

export const useUiPreferences = create<UiPreferencesState & UiPreferencesActions>()(
    persist(
        (set, get) => ({
            onboardingCompleted: false,
            theme: 'dark',
            defaultLayout: 'default' as LayoutMode,
            perRouteLayout: {},
            collapsedSections: [],
            pinnedSidebar: [],
            recentCommands: [],
            designTokenOverrides: {},

            setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),

            setTheme: (theme) => set({ theme }),

            setLayout: (route, mode, global) => {
                if (global) {
                    set({ defaultLayout: mode, perRouteLayout: {} });
                } else {
                    set((s) => ({
                        defaultLayout: s.defaultLayout,
                        perRouteLayout: { ...s.perRouteLayout, [route]: mode },
                    }));
                }
            },

            getLayout: (route) => {
                const s = get();
                return s.perRouteLayout[route] ?? s.defaultLayout ?? null;
            },

            toggleCollapsedSection: (sectionId) => {
                set((s) => {
                    const next = s.collapsedSections.includes(sectionId)
                        ? s.collapsedSections.filter((id) => id !== sectionId)
                        : [...s.collapsedSections, sectionId];
                    return { collapsedSections: next };
                });
            },

            setPinnedSidebar: (pinnedSidebar) => set({ pinnedSidebar }),

            addRecentCommand: (path) => {
                set((s) => {
                    const prev = s.recentCommands.filter((p) => p !== path);
                    return { recentCommands: [path, ...prev].slice(0, MAX_RECENT) };
                });
            },

            getRecentCommands: () => get().recentCommands,

            setDesignTokenOverrides: (overrides) => set({ designTokenOverrides: overrides }),

            clearDesignTokenOverrides: () => set({ designTokenOverrides: {} }),
        }),
        {
            name: 'super-agents-ui-prefs',
            version: 2,
            migrate: (persisted: unknown, version: number) => {
                if (version === 0) {
                    const v0 = persisted as Partial<UiPreferencesState>;
                    return {
                        onboardingCompleted: v0.onboardingCompleted ?? false,
                        theme: v0.theme ?? 'dark',
                        defaultLayout: v0.defaultLayout ?? ('default' as LayoutMode),
                        perRouteLayout: v0.perRouteLayout ?? {},
                        collapsedSections: v0.collapsedSections ?? [],
                        pinnedSidebar: v0.pinnedSidebar ?? [],
                        recentCommands: v0.recentCommands ?? [],
                        designTokenOverrides: v0.designTokenOverrides ?? {},
                    } as UiPreferencesState;
                }
                return persisted as UiPreferencesState;
            },
            partialize: (state) => ({
                onboardingCompleted: state.onboardingCompleted,
                theme: state.theme,
                defaultLayout: state.defaultLayout,
                perRouteLayout: state.perRouteLayout,
                collapsedSections: state.collapsedSections,
                pinnedSidebar: state.pinnedSidebar,
                recentCommands: state.recentCommands,
                designTokenOverrides: state.designTokenOverrides,
            }),
        },
    ),
);
