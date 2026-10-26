import React, { useEffect, useState } from 'react';
import { ArrowLeft, Folder, Search, Star, X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { t as translate } from '../../i18n/translations';
import { loadLocale } from '../../i18n/translations/index';
import { NAV_SECTIONS } from '../../route-registry';
import type { NavSection, RouteMeta } from '../../route-registry';

interface DesktopProps {
    onNavigate: (page: string) => void;
}

const SECTION_EMOJI: Record<string, string> = {
    'section-dashboard': '🏠',
    'section-chat': '💬',
    'section-debates': '⚖️',
    'section-debate-strategy': '♟️',
    'section-agents': '🤖',
    'section-memory': '🧠',
    'section-research': '🔬',
    'section-ai-providers': '🔌',
    'section-budget': '💰',
    'section-security': '🛡️',
    'section-integrations': '🔗',
    'section-techniques': '🧪',
    'section-fleet': '🛰️',
    'section-lab': '🧬',
    'section-diagnostics': '🩺',
    'section-wiki': '📖',
    'section-system': '⚙️',
    'section-google': '🌐',
    'section-other': '🗂️',
    'section-randoms': '🎲',
};

const FAVORITES_KEY = 'desktop:favorites';

const quickLaunchStyle = (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.7rem 1.1rem',
    borderRadius: 12,
    cursor: 'pointer',
    border: `1px solid ${color}55`,
    background: `${color}1a`,
    color: 'var(--slate-100)',
    fontWeight: 700,
    fontSize: '0.88rem',
});

function loadFavorites(): string[] {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
}

function saveFavorites(list: string[]) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    } catch {
        /* ignore */
    }
}

const BilingualLabel: React.FC<{ labelKey: string }> = ({ labelKey }) => {
    const en = translate(labelKey, 'en');
    const ru = translate(labelKey, 'ru');
    return (
        <span style={{ display: 'block', textAlign: 'center', lineHeight: 1.3 }}>
            <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                {en}
            </span>
            {ru !== en && (
                <span style={{ display: 'block', fontSize: '1rem', color: 'var(--slate-200)', fontWeight: 700, marginTop: 3 }}>
                    {ru}
                </span>
            )}
        </span>
    );
};

const Desktop: React.FC<DesktopProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<NavSection | null>(null);
    const [query, setQuery] = useState('');
    const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());

    useEffect(() => saveFavorites(favorites), [favorites]);

    // Ensure BOTH locales are loaded so bilingual labels (en + ru) always render.
    const [localesReady, setLocalesReady] = useState(false);
    useEffect(() => {
        Promise.all([loadLocale('en'), loadLocale('ru')]).then(() => setLocalesReady(true));
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveSection(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    void localesReady;

    const toggleFavorite = (id: string) => {
        setFavorites((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const openApp = (item: RouteMeta) => onNavigate(item.id);

    const folderColor = (section: NavSection) => section.items[0]?.color ?? '#3b82f6';

    const allItems = NAV_SECTIONS.flatMap((s) => s.items);
    const favoriteItems = allItems.filter((it) => favorites.includes(it.id));

    // ── Корневой «Рабочий стол»: папки + избранное ──
    if (!activeSection) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Быстрый запуск — важные возможности, чтобы не терялись */}
                <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '0.6rem' }}>
                        ⚡ Быстрый запуск
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => onNavigate('debate')}
                            style={quickLaunchStyle('#8b5cf6')}
                        >
                            ⚖️ Дебаты
                        </button>
                        <button
                            onClick={() => onNavigate('agent-tasks')}
                            style={quickLaunchStyle('#06b6d4')}
                        >
                            🌐 Компьютер и браузер (Agent Tasks)
                        </button>
                        <button
                            onClick={() => onNavigate('knowledge')}
                            style={quickLaunchStyle('#a855f7')}
                        >
                            📚 База знаний
                        </button>
                    </div>
                </div>

                {favoriteItems.length > 0 && (
                    <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '0.6rem' }}>
                            ⭐ Избранное
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                            {favoriteItems.map((item) => (
                                <AppTile
                                    key={item.id}
                                    item={item}
                                    color={item.color ?? '#3b82f6'}
                                    labelKey={item.labelKey}
                                    onOpen={() => openApp(item)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '0.6rem' }}>
                        💻 Рабочий стол — разделы
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.25rem' }}>
                        {NAV_SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section)}
                                onDoubleClick={() => setActiveSection(section)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.55rem',
                                    padding: '1rem 0.5rem',
                                    borderRadius: 14,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    background: 'rgba(255,255,255,0.02)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    e.currentTarget.style.borderColor = `${folderColor(section)}55`;
                                    e.currentTarget.style.transform = 'scale(1.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <div
                                    style={{
                                        width: 76,
                                        height: 76,
                                        borderRadius: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: `linear-gradient(135deg, ${folderColor(section)}, ${folderColor(section)}99)`,
                                        boxShadow: `0 6px 20px ${folderColor(section)}44`,
                                    }}
                                >
                                    {SECTION_EMOJI[section.id] ? (
                                        <span style={{ fontSize: 34 }}>{SECTION_EMOJI[section.id]}</span>
                                    ) : (
                                        <Folder size={34} color="white" />
                                    )}
                                </div>
                                <BilingualLabel labelKey={section.labelKey} />
                                <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                    {section.items.length} прил.
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── Открытая «папка»: поиск + квадратики-приложения ──
    const section = activeSection;
    const q = query.trim().toLowerCase();
    const filteredItems = q
        ? section.items.filter((it) => t(it.labelKey).toLowerCase().includes(q))
        : section.items;

    const tileColor = (item: RouteMeta) => item.color ?? '#3b82f6';

    const live = filteredItems.filter((it) => it.status !== 'planned' && it.status !== 'beta');
    const inDev = filteredItems.filter((it) => it.status === 'planned' || it.status === 'beta');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setActiveSection(null)}
                    onDoubleClick={() => setActiveSection(null)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0.5rem 0.9rem',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--slate-200)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                    }}
                >
                    <ArrowLeft size={15} /> Рабочий стол
                </button>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                    /{' '}
                    <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>
                        <BilingualLabel labelKey={section.labelKey} />
                    </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    {section.items.length} прил.
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={15} color="var(--slate-500)" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Найти приложение…"
                    style={{
                        flex: 1,
                        maxWidth: 320,
                        padding: '0.45rem 0.75rem',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--slate-100)',
                        fontSize: '0.85rem',
                        outline: 'none',
                    }}
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        title="Очистить"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {filteredItems.length === 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', padding: '1rem 0' }}>
                    Ничего не найдено по запросу «{query}».
                </div>
            )}

            {live.length > 0 && (
                <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--slate-500)', marginBottom: '0.55rem' }}>
                        ✅ Готово
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                        {live.map((item) => (
                            <AppTile
                                key={item.id}
                                item={item}
                                color={tileColor(item)}
                                labelKey={item.labelKey}
                                onOpen={() => openApp(item)}
                                isFavorite={favorites.includes(item.id)}
                                onToggleFavorite={() => toggleFavorite(item.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {inDev.length > 0 && (
                <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--slate-500)', marginBottom: '0.55rem' }}>
                        🚧 В разработке
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                        {inDev.map((item) => (
                            <AppTile
                                key={item.id}
                                item={item}
                                color={tileColor(item)}
                                labelKey={item.labelKey}
                                onOpen={() => openApp(item)}
                                isFavorite={favorites.includes(item.id)}
                                onToggleFavorite={() => toggleFavorite(item.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface AppTileProps {
    item: RouteMeta;
    color?: string;
    labelKey: string;
    onOpen: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

const AppTile: React.FC<AppTileProps> = ({ item, color, labelKey, onOpen, isFavorite, onToggleFavorite }) => {
    const c = color ?? item.color ?? '#3b82f6';
    return (
        <div style={{ position: 'relative' }}>
            {onToggleFavorite && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite();
                    }}
                    title={isFavorite ? 'Убрать из избранного' : 'В избранное'}
                    style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        zIndex: 2,
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.25)',
                        background: isFavorite ? '#facc15' : 'rgba(0,0,0,0.45)',
                        color: isFavorite ? '#1a1a1a' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
            )}
            <button
                onClick={onOpen}
                onDoubleClick={onOpen}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.9rem 0.5rem',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = `${c}55`;
                    e.currentTarget.style.transform = 'scale(1.04)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                <div
                    style={{
                        width: 76,
                        height: 76,
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        background: `linear-gradient(135deg, ${c}, ${c}99)`,
                        boxShadow: `0 6px 20px ${c}44`,
                    }}
                >
                    {React.isValidElement(item.icon)
                        ? React.cloneElement(item.icon as React.ReactElement<{ size?: number; color?: string }>, {
                              size: 32,
                              color: '#fff',
                          })
                        : item.icon}
                </div>
                <BilingualLabel labelKey={labelKey} />
            </button>
        </div>
    );
};

export default Desktop;
