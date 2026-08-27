import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// Route transitions use CSS animation instead of framer-motion to keep ~50KB gzip off the critical path.
// TODO: CommandPalette and OnboardingWizard still synchronously import framer-motion (via their own imports).
// To fully remove framer-motion from the critical path, split useCommandPalette into a separate file
// (e.g. hooks/useCommandPalette.ts), then wrap CommandPalette and OnboardingWizard with React.lazy + Suspense.
import { History, Search, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { AppRoutes } from '../routes';
import { GlobalErrorBoundary } from './GlobalErrorBoundary';
import AlertLayer from './AlertLayer/AlertLayer';
import { CommandPalette, useCommandPalette } from './CommandPalette';
import { Breadcrumbs } from './Common/Breadcrumbs';
import { OnboardingWizard } from './OnboardingWizard/OnboardingWizard';
import { KeyboardShortcutsModal } from './Common/KeyboardShortcutsModal';
import { CONFIG } from '../kernel/instances';
import { safeClone } from '../shared/utils/safe-json';
import { eventBus, EVENTS } from '../kernel/instances';
import { settingsService, groupManager } from '../kernel/instances';
import { useUiPreferences } from '../stores/uiPreferencesStore';
import { setLanguage, type TranslationKey } from '../i18n/translations';
import { useTranslation } from '../i18n/useTranslation';
import { useChatStoreHydration } from '../stores/useChatStore';
import { NAV_SECTIONS } from '../route-registry';
import { LayoutProvider } from './Layout/LayoutContext';
import { LayoutSelector } from './Layout/LayoutSelector';
import { NextActionPredictions } from './Layout/NextActionPredictions';

const navLabelKey: Record<string, TranslationKey> = {};
for (const section of NAV_SECTIONS) {
    navLabelKey[section.id] = section.labelKey;
    for (const item of section.items) {
        navLabelKey[item.id] = item.labelKey;
    }
}

export const AppLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const activeTab = location.pathname.split('/')[1] || 'dashboard';
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [runtimeStatus, setRuntimeStatus] = useState<'online' | 'degraded' | 'offline'>('online');
    const { isOpen: isPaletteOpen, open: openPalette, close: closePalette } = useCommandPalette();
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const { theme: storedTheme, setTheme } = useUiPreferences();
    const [currentTheme, setCurrentTheme] = useState(
        () => document.documentElement.getAttribute('data-theme') || storedTheme || 'dark',
    );
    const handleThemeChange = useCallback(
        (newTheme: string) => {
            setCurrentTheme(newTheme);
            setTheme(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            try {
                const s = settingsService.getSettings();
                if (s.theme !== newTheme)
                    settingsService.updateSettings({ theme: newTheme as typeof s.theme });
            } catch {
                /* settingsService may not be ready */
            }
        },
        [setTheme],
    );
    const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(
        () => safeClone(CONFIG.featureFlags) as unknown as Record<string, boolean>,
    );

    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (
                e.key === '?' &&
                !e.ctrlKey &&
                !e.metaKey &&
                !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
            ) {
                setShortcutsOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        const check = () => {
            const keys = groupManager?.getAllKeys?.() || [];
            const active = keys.filter((k) => k.status === 'active').length;
            if (active === 0) setRuntimeStatus('offline');
            else if (
                keys.some(
                    (k) => k.status === 'active' && (k.stats?.extended?.reputationScore || 0) < 0.3,
                )
            )
                setRuntimeStatus('degraded');
            else setRuntimeStatus('online');
        };
        check();
        const unsub = eventBus.on(EVENTS.KEY_STATE_CHANGED, check);
        return () => unsub();
    }, []);

    useEffect(() => {
        let rafId: number;
        const onResize = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => setIsDesktop(window.innerWidth >= 768));
        };
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(rafId);
        };
    }, []);

    useEffect(() => {
        const unsub = eventBus.on(EVENTS.SETTINGS_UPDATED, () => {
            setFeatureFlags(safeClone(CONFIG.featureFlags) as unknown as Record<string, boolean>);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const unsub = eventBus.on(EVENTS.NAVIGATE, (target: string) => {
            navigate(`/${target}`);
        });
        return () => {
            unsub();
        };
    }, [navigate]);

    useEffect(() => {
        const s = settingsService.getSettings();
        document.documentElement.dataset.theme = s.theme;
        document.documentElement.dataset.highContrast = s.themeConfig?.highContrast
            ? 'true'
            : 'false';
        document.documentElement.lang = s.language;
        setLanguage(s.language === 'ru' ? 'ru' : 'en');

        const unsub = settingsService.subscribe((settings) => {
            document.documentElement.dataset.theme = settings.theme;
            document.documentElement.dataset.highContrast = settings.themeConfig?.highContrast
                ? 'true'
                : 'false';
            document.documentElement.lang = settings.language;
            setLanguage(settings.language === 'ru' ? 'ru' : 'en');
        });
        return () => {
            unsub();
        };
    }, []);

    useChatStoreHydration();

    const handleNavigate = useCallback(
        (path: string) => {
            navigate(`/${path}`);
        },
        [navigate],
    );

    return (
        <GlobalErrorBoundary>
            <a
                href="#main-content"
                className="skip-nav"
                style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: 0,
                    zIndex: 9999,
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                }}
                onFocus={(e) => {
                    (e.target as HTMLElement).style.left = '0';
                }}
                onBlur={(e) => {
                    (e.target as HTMLElement).style.left = '-9999px';
                }}
            >
                {t('nav.skip_to_content')}
            </a>
            <div id="app-wrapper" className="app-container">
                <LayoutProvider>
                    <Sidebar
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
                        mobileMenuOpen={mobileMenuOpen}
                        onMobileMenuClose={() => setMobileMenuOpen(false)}
                        activeTab={activeTab}
                        onNavigate={handleNavigate}
                        runtimeStatus={runtimeStatus}
                        isDesktop={isDesktop}
                        featureFlags={featureFlags}
                        t={t}
                        navLabelKey={navLabelKey}
                    />

                    <main id="main-content" className="main-content">
                        <header className="content-header">
                            {!isDesktop && (
                                <button
                                    onClick={() => setMobileMenuOpen(true)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--slate-400)',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        marginRight: '0.5rem',
                                    }}
                                    aria-label={t('nav.open_menu')}
                                >
                                    <Menu size={20} />
                                </button>
                            )}
                            <button
                                onClick={openPalette}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8,
                                    padding: '0.4rem 0.875rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    minWidth: 220,
                                }}
                                aria-label={t('palette.placeholder')}
                            >
                                <Search size={16} />
                                <span style={{ flex: 1, textAlign: 'left', fontSize: '0.875rem' }}>
                                    {t('palette.placeholder')}
                                </span>
                                <kbd
                                    style={{
                                        padding: '0.1rem 0.35rem',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 4,
                                        fontSize: '0.68rem',
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    ⌘K
                                </kbd>
                            </button>
                            <Breadcrumbs
                                path={location.pathname}
                                t={t as (key: TranslationKey) => string}
                            />
                            <div className="header-actions">
                                <LayoutSelector />
                                <div className="session-timer">
                                    <History size={16} />
                                    <span>{t('nav.local_session')}</span>
                                </div>
                                <div className="user-profile">
                                    <div className="avatar" aria-hidden="true" />
                                    <span>{t('nav.operator')}</span>
                                </div>
                                <select
                                    value={currentTheme}
                                    onChange={(e) => handleThemeChange(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-400)',
                                        borderRadius: 6,
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        outline: 'none',
                                    }}
                                    aria-label={t('common.aria.theme')}
                                >
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                    <option value="cyberpunk">Cyberpunk</option>
                                    <option value="nature">Nature</option>
                                    <option value="ocean">Ocean</option>
                                    <option value="sunset">Sunset</option>
                                    <option value="high-contrast">High Contrast</option>
                                </select>
                                <button
                                    onClick={() => setShortcutsOpen(true)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--slate-500)',
                                        cursor: 'pointer',
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        borderRadius: 6,
                                    }}
                                    title="Keyboard shortcuts"
                                    aria-label={t('common.aria.keyboard_shortcuts')}
                                >
                                    ?
                                </button>
                            </div>
                        </header>

                        <section className="content-viewport">
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-10%',
                                    right: '-5%',
                                    width: '50vw',
                                    height: '50vw',
                                    background:
                                        'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%)',
                                    borderRadius: '50%',
                                    filter: 'blur(60px)',
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                    display: isDesktop ? 'block' : 'none',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '-10%',
                                    left: '-5%',
                                    width: '40vw',
                                    height: '40vw',
                                    background:
                                        'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 60%)',
                                    borderRadius: '50%',
                                    filter: 'blur(60px)',
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                    display: isDesktop ? 'block' : 'none',
                                }}
                            />

                            <div
                                key={activeTab}
                                className="route-enter-animation"
                                style={{
                                    display: 'block',
                                    overflow: 'visible',
                                    position: 'relative',
                                    zIndex: 10,
                                }}
                            >
                                <AppRoutes />
                            </div>
                        </section>
                        {activeTab !== 'debate' && <NextActionPredictions />}
                        <AlertLayer />
                        <CommandPalette
                            open={isPaletteOpen}
                            onClose={closePalette}
                            t={t as (key: TranslationKey) => string}
                        />
                        <OnboardingWizard t={t as (key: TranslationKey) => string} />
                        <KeyboardShortcutsModal
                            isOpen={shortcutsOpen}
                            onClose={() => setShortcutsOpen(false)}
                        />
                    </main>
                </LayoutProvider>
            </div>
        </GlobalErrorBoundary>
    );
};
