import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUiPreferences, type LayoutMode } from './uiPreferencesStore';

const STORAGE_KEY = 'super-agents-ui-prefs';

describe('useUiPreferences', () => {
    beforeEach(() => {
        localStorage.clear();
        useUiPreferences.setState({
            onboardingCompleted: false,
            theme: 'dark',
            defaultLayout: 'default' as LayoutMode,
            perRouteLayout: {},
            collapsedSections: [],
            pinnedSidebar: [],
            recentCommands: [],
            designTokenOverrides: {},
        });
    });

    it('initializes with defaults', () => {
        const s = useUiPreferences.getState();
        expect(s.onboardingCompleted).toBe(false);
        expect(s.theme).toBe('dark');
        expect(s.defaultLayout).toBe('default');
        expect(s.perRouteLayout).toEqual({});
        expect(s.collapsedSections).toEqual([]);
        expect(s.pinnedSidebar).toEqual([]);
        expect(s.recentCommands).toEqual([]);
        expect(s.designTokenOverrides).toEqual({});
    });

    it('setOnboardingCompleted updates the flag', () => {
        useUiPreferences.getState().setOnboardingCompleted(true);
        expect(useUiPreferences.getState().onboardingCompleted).toBe(true);
    });

    it('setTheme updates the theme', () => {
        useUiPreferences.getState().setTheme('light');
        expect(useUiPreferences.getState().theme).toBe('light');
    });

    it('setLayout sets a per-route layout', () => {
        useUiPreferences.getState().setLayout('/debates', 'wide');
        expect(useUiPreferences.getState().perRouteLayout['/debates']).toBe('wide');
        expect(useUiPreferences.getState().defaultLayout).toBe('default');
    });

    it('setLayout with global flag sets default and clears per-route layouts', () => {
        useUiPreferences.getState().setLayout('/debates', 'wide');
        useUiPreferences.getState().setLayout('/agents', 'focus', true);
        const s = useUiPreferences.getState();
        expect(s.defaultLayout).toBe('focus');
        expect(s.perRouteLayout).toEqual({});
    });

    it('setLayout per-route preserves defaultLayout', () => {
        useUiPreferences.getState().setLayout('/a', 'cinema');
        expect(useUiPreferences.getState().defaultLayout).toBe('default');
    });

    it('getLayout prefers per-route layout over default', () => {
        useUiPreferences.getState().setLayout('/debates', 'wide');
        expect(useUiPreferences.getState().getLayout('/debates')).toBe('wide');
        expect(useUiPreferences.getState().getLayout('/other')).toBe('default');
    });

    it('getLayout returns null when neither set', () => {
        useUiPreferences.setState({ defaultLayout: 'default' as LayoutMode, perRouteLayout: {} });
        expect(useUiPreferences.getState().getLayout('/nope')).toBe('default');
    });

    it('toggleCollapsedSection adds a section', () => {
        useUiPreferences.getState().toggleCollapsedSection('sec-1');
        expect(useUiPreferences.getState().collapsedSections).toEqual(['sec-1']);
    });

    it('toggleCollapsedSection removes an existing section', () => {
        useUiPreferences.getState().toggleCollapsedSection('sec-1');
        useUiPreferences.getState().toggleCollapsedSection('sec-1');
        expect(useUiPreferences.getState().collapsedSections).toEqual([]);
    });

    it('toggleCollapsedSection toggles independently', () => {
        useUiPreferences.getState().toggleCollapsedSection('sec-1');
        useUiPreferences.getState().toggleCollapsedSection('sec-2');
        useUiPreferences.getState().toggleCollapsedSection('sec-1');
        expect(useUiPreferences.getState().collapsedSections).toEqual(['sec-2']);
    });

    it('setPinnedSidebar replaces the pinned list', () => {
        useUiPreferences.getState().setPinnedSidebar(['/a', '/b']);
        expect(useUiPreferences.getState().pinnedSidebar).toEqual(['/a', '/b']);
    });

    it('addRecentCommand prepends and dedupes', () => {
        useUiPreferences.getState().addRecentCommand('/cmd-a');
        useUiPreferences.getState().addRecentCommand('/cmd-b');
        useUiPreferences.getState().addRecentCommand('/cmd-a');
        expect(useUiPreferences.getState().recentCommands).toEqual(['/cmd-a', '/cmd-b']);
    });

    it('addRecentCommand caps the list at 8 entries', () => {
        for (let i = 0; i < 10; i++) {
            useUiPreferences.getState().addRecentCommand(`/cmd-${i}`);
        }
        const cmds = useUiPreferences.getState().recentCommands;
        expect(cmds).toHaveLength(8);
        expect(cmds[0]).toBe('/cmd-9');
        expect(cmds[7]).toBe('/cmd-2');
    });

    it('getRecentCommands returns current list', () => {
        useUiPreferences.getState().addRecentCommand('/cmd-x');
        expect(useUiPreferences.getState().getRecentCommands()).toEqual(['/cmd-x']);
    });

    it('setDesignTokenOverrides replaces overrides', () => {
        useUiPreferences.getState().setDesignTokenOverrides({ '--color-accent': '#ff0000' });
        expect(useUiPreferences.getState().designTokenOverrides).toEqual({
            '--color-accent': '#ff0000',
        });
    });

    it('clearDesignTokenOverrides empties overrides', () => {
        useUiPreferences.getState().setDesignTokenOverrides({ a: 'b' });
        useUiPreferences.getState().clearDesignTokenOverrides();
        expect(useUiPreferences.getState().designTokenOverrides).toEqual({});
    });

    it('persists changes to localStorage', () => {
        useUiPreferences.getState().setTheme('light');
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw as string);
        expect(parsed.state.theme).toBe('light');
        expect(parsed.version).toBe(2);
    });
});

describe('useUiPreferences migration', () => {
    it('migrates version 0 persisted state', async () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                state: { theme: 'light', onboardingCompleted: true },
                version: 0,
            }),
        );
        vi.resetModules();
        const mod = await import('./uiPreferencesStore');
        const s = mod.useUiPreferences.getState();
        expect(s.theme).toBe('light');
        expect(s.onboardingCompleted).toBe(true);
        expect(s.defaultLayout).toBe('default');
        expect(s.designTokenOverrides).toEqual({});
        localStorage.clear();
    });
});
