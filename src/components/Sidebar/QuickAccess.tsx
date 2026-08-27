import React, { useState, useEffect, useMemo } from 'react';
import { Star, History, X } from 'lucide-react';
import type { TranslationKey } from '../../i18n/translations';
import { getRecent } from './sidebar-utils';

interface QuickAccessProps {
    pinned: string[];
    onTogglePin: (id: string) => void;
    activeTab: string;
    onNavigate: (id: string) => void;
    navLabelKey: Record<string, TranslationKey>;
    t: (key: TranslationKey) => string;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({
    pinned,
    onTogglePin,
    activeTab,
    onNavigate,
    navLabelKey,
    t,
}) => {
    const [recentCache, setRecentCache] = useState(() => getRecent());
    useEffect(() => {
        const handler = () => setRecentCache(getRecent());
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);
    const recent = useMemo(
        () => recentCache.filter((id) => id !== activeTab),
        [activeTab, recentCache],
    );
    const visiblePinned = useMemo(
        () => pinned.filter((id) => id !== activeTab),
        [pinned, activeTab],
    );

    if (visiblePinned.length === 0 && recent.length === 0) return null;

    return (
        <div
            style={{
                padding: '0 0.75rem 0.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '0.25rem',
            }}
        >
            {visiblePinned.length > 0 && (
                <div style={{ marginBottom: '0.25rem' }}>
                    <div
                        style={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: 'var(--slate-500)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            padding: '0.25rem 0.5rem',
                        }}
                    >
                        {t('nav.quick_access')}
                    </div>
                    {visiblePinned.slice(0, 5).map((id) => (
                        <div key={id} style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={() => onNavigate(id)}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '0.3rem 0.5rem',
                                    background: 'none',
                                    border: 'none',
                                    color: activeTab === id ? '#60a5fa' : '#94a3b8',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    borderRadius: 6,
                                    textAlign: 'left',
                                    fontWeight: activeTab === id ? 700 : 400,
                                }}
                            >
                                <Star size={10} color="#f59e0b" fill="#f59e0b" />
                                <span
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {t(navLabelKey[id] ?? 'nav.overview')}
                                </span>
                            </button>
                            <button
                                onClick={() => onTogglePin(id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--slate-600)',
                                    cursor: 'pointer',
                                    padding: 4,
                                }}
                                aria-label={t('quick_access.unpin')}
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {recent.length > 0 && visiblePinned.length < 3 && (
                <div>
                    <div
                        style={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: 'var(--slate-600)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            padding: '0.25rem 0.5rem',
                        }}
                    >
                        {t('palette.recent')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {recent.slice(0, 4).map((id) => (
                            <button
                                key={id}
                                onClick={() => onNavigate(id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '0.2rem 0.5rem',
                                    background:
                                        activeTab === id
                                            ? 'rgba(59,130,246,0.15)'
                                            : 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 4,
                                    color: activeTab === id ? '#60a5fa' : '#94a3b8',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    fontWeight: activeTab === id ? 700 : 400,
                                }}
                            >
                                <History size={10} />
                                {t(navLabelKey[id] ?? 'nav.overview')}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
