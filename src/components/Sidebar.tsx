import React, { useState } from 'react';
import { Search, X, PanelRightOpen, PanelRightClose, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TranslationKey } from '../i18n/translations';
import { NAV_SECTIONS } from '../route-registry';
import {
    getPinned,
    savePinned,
    getCollapsedSections,
    saveCollapsedSections,
} from './Sidebar/sidebar-utils';
import { QuickAccess } from './Sidebar/QuickAccess';
import { NavBadge } from './Sidebar/NavBadge';
import { useNavBadgeSubscriptions } from './Sidebar/useNavBadgeSubscriptions';

interface SidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    mobileMenuOpen: boolean;
    onMobileMenuClose: () => void;
    activeTab: string;
    onNavigate: (path: string) => void;
    runtimeStatus: 'online' | 'degraded' | 'offline';
    isDesktop: boolean;
    featureFlags: Record<string, boolean>;
    t: (key: TranslationKey) => string;
    navLabelKey: Record<string, TranslationKey>;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    onToggleCollapse,
    mobileMenuOpen,
    onMobileMenuClose,
    activeTab,
    onNavigate,
    runtimeStatus,
    isDesktop,
    featureFlags,
    t,
    navLabelKey,
}) => {
    const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
    const [pinned, setPinned] = useState<string[]>(getPinned);
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(getCollapsedSections);

    useNavBadgeSubscriptions();

    const toggleSection = (sectionId: string) => {
        setCollapsedSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            saveCollapsedSections(next);
            return next;
        });
    };

    return (
        <>
            {!isDesktop && mobileMenuOpen && (
                <div
                    onClick={onMobileMenuClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99,
                        background: 'rgba(0,0,0,0.5)',
                    }}
                />
            )}
            <aside
                className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
                style={
                    !isDesktop
                        ? {
                              display: mobileMenuOpen ? 'flex' : 'none',
                              position: 'fixed',
                              zIndex: 100,
                              height: '100vh',
                          }
                        : undefined
                }
            >
                <div className="sidebar-header">
                    {!isDesktop && (
                        <button
                            onClick={onMobileMenuClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--slate-400)',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                marginRight: '0.5rem',
                            }}
                            aria-label={t('sidebar.close')}
                        >
                            <X size={20} />
                        </button>
                    )}
                    <div className="logo-container">
                        <div className="logo-orb">
                            <div className="logo-core" />
                        </div>
                        {!isCollapsed && (
                            <span className="logo-text">
                                SUPER-AGENTS <span className="logo-suffix">OS</span>
                            </span>
                        )}
                    </div>
                    {isDesktop && (
                        <button
                            onClick={onToggleCollapse}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--slate-500)',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                marginLeft: 'auto',
                            }}
                            aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
                        >
                            {isCollapsed ? (
                                <PanelRightOpen size={18} />
                            ) : (
                                <PanelRightClose size={18} />
                            )}
                        </button>
                    )}
                </div>

                <div style={{ padding: '0.5rem 1rem' }}>
                    <div className="provider-search-wrapper" style={{ marginBottom: '0.5rem', position: 'relative' }}>
                        <Search className="provider-search-icon" size={16} />
                        <input
                            type="text"
                            placeholder={`${t('nav.search')} — ⌘K`}
                            aria-label={t('nav.search')}
                            value={sidebarSearchQuery}
                            onChange={(e) => setSidebarSearchQuery(e.target.value)}
                            className="provider-search-input"
                            style={{ fontSize: '0.8rem', paddingRight: 36 }}
                        />
                        {!isCollapsed && !sidebarSearchQuery && (
                            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: 'var(--slate-500)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 4, padding: '1px 5px', lineHeight: 1.2, pointerEvents: 'none', background: 'rgba(255,255,255,0.04)' }}>⌘K</span>
                        )}
                    </div>
                </div>

                {!isCollapsed && !sidebarSearchQuery && (
                    <QuickAccess
                        pinned={pinned}
                        onTogglePin={(id) => {
                            const next = pinned.includes(id)
                                ? pinned.filter((p) => p !== id)
                                : [...pinned, id];
                            setPinned(next);
                            savePinned(next);
                        }}
                        activeTab={activeTab}
                        onNavigate={(id) => {
                            onNavigate(id);
                            onMobileMenuClose();
                        }}
                        navLabelKey={navLabelKey}
                        t={t}
                    />
                )}

                <nav className="sidebar-nav">
                    {NAV_SECTIONS.map((section) => {
                        const sectionCollapsed = collapsedSections.has(section.id);
                        const q = sidebarSearchQuery.toLowerCase();
                        const hasSearch = q.length > 0;
                        const showItems = hasSearch || !sectionCollapsed;
                        const visibleItems = section.items.filter((item) => {
                            if (
                                q &&
                                !t(navLabelKey[item.id] ?? '')
                                    .toLowerCase()
                                    .includes(q)
                            )
                                return false;
                            return true;
                        });
                        if (visibleItems.length === 0 && !q) return null;
                        return (
                            <React.Fragment key={section.id}>
                                {!isCollapsed && (
                                    <div
                                        className="nav-section-header"
                                        onClick={() => toggleSection(section.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                toggleSection(section.id);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            userSelect: 'none',
                                        }}
                                        title={
                                            sectionCollapsed
                                                ? t('sidebar.expand_section')
                                                : t('sidebar.collapse_section')
                                        }
                                        aria-expanded={!sectionCollapsed}
                                    >
                                        <span>{t(navLabelKey[section.id] ?? 'nav.overview')}</span>
                                        <ChevronDown
                                            size={14}
                                            style={{
                                                color: 'var(--slate-600)',
                                                transition: 'transform 0.2s',
                                            }}
                                        />
                                    </div>
                                )}
                                {showItems &&
                                    visibleItems.map((item) => {
                                        const isDisabled = !!(
                                            item.featureFlag && !featureFlags[item.featureFlag]
                                        );
                                        const isPlanned = item.status === 'planned';
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    if (!isDisabled) {
                                                        onNavigate(item.id);
                                                        onMobileMenuClose();
                                                    }
                                                }}
                                                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                                                aria-current={
                                                    activeTab === item.id ? 'page' : undefined
                                                }
                                                disabled={isDisabled}
                                                title={isPlanned ? `${t(navLabelKey[item.id] ?? 'nav.overview')} — Planned` : undefined}
                                                style={
                                                    {
                                                        '--active-color': item.color,
                                                        justifyContent: isCollapsed
                                                            ? 'center'
                                                            : 'flex-start',
                                                        opacity: isDisabled ? 0.3 : isPlanned ? 0.55 : 1,
                                                        cursor: isDisabled ? 'default' : 'pointer',
                                                    } as React.CSSProperties
                                                }
                                            >
                                                <span
                                                    className="nav-icon"
                                                    style={{ position: 'relative' }}
                                                >
                                                    {item.icon}
                                                    {!isCollapsed && <NavBadge routeId={item.id} />}
                                                </span>
                                                {!isCollapsed && (
                                                    <span className="nav-label" style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(navLabelKey[item.id] ?? 'nav.overview')}</span>
                                                        {isPlanned && (
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 999, padding: '0 5px', lineHeight: '14px', flexShrink: 0 }}>Planned</span>
                                                        )}
                                                        {!isPlanned && item.experimental && (
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 999, padding: '0 5px', lineHeight: '14px', flexShrink: 0 }}>Beta</span>
                                                        )}
                                                    </span>
                                                )}
                                                {!isCollapsed && activeTab === item.id && (
                                                    <motion.div
                                                        layoutId="active-pill"
                                                        className="active-pill"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                            </React.Fragment>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="system-status">
                        <div className={`status-indicator ${runtimeStatus}`} />
                        {!isCollapsed && (
                            <span role="status" aria-live="polite">
                                {runtimeStatus === 'offline'
                                    ? 'No providers'
                                    : runtimeStatus === 'degraded'
                                      ? 'Degraded'
                                      : t('nav.runtime_online')}
                            </span>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginTop: 6, textAlign: 'center', opacity: 0.7 }}>Press <span style={{ border: '1px solid rgba(148,163,184,0.2)', borderRadius: 3, padding: '0 4px', background: 'rgba(255,255,255,0.04)' }}>⌘K</span> to search</div>
                    )}
                </div>
            </aside>
        </>
    );
};
