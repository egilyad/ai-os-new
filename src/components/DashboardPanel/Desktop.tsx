import React, { useState } from 'react';
import { ArrowLeft, Folder, Search } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { NAV_SECTIONS } from '../../route-registry';
import type { NavSection, RouteMeta } from '../../route-registry';

interface DesktopProps {
    onNavigate: (page: string) => void;
}

const Desktop: React.FC<DesktopProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<NavSection | null>(null);
    const [query, setQuery] = useState('');

    const openApp = (item: RouteMeta) => {
        onNavigate(item.id);
    };

    const folderColor = (section: NavSection) =>
        section.items[0]?.color ?? '#3b82f6';

    // ── Корневой «Рабочий стол»: папки-разделы ──
    if (!activeSection) {
        return (
            <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '0.6rem' }}>
                    💻 Рабочий стол — разделы
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.25rem' }}>
                    {NAV_SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section)}
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
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            }}
                        >
                            <div
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: `linear-gradient(135deg, ${folderColor(section)}, ${folderColor(section)}99)`,
                                    boxShadow: `0 6px 20px ${folderColor(section)}44`,
                                }}
                            >
                                <Folder size={34} color="white" />
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-200)', textAlign: 'center', lineHeight: 1.25 }}>
                                {t(section.labelKey)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                {section.items.length} прил.
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ── Открытая «папка»: квадратики-приложения ──
    const section = activeSection;
    const q = query.trim().toLowerCase();
    const filteredItems = q ? section.items.filter((it) => t(it.labelKey).toLowerCase().includes(q)) : section.items;
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <button
                    onClick={() => setActiveSection(null)}
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
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                    {t(section.labelKey)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    {section.items.length} прил.
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
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
            </div>

            {filteredItems.length === 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', padding: '1rem 0' }}>
                    Ничего не найдено по запросу «{query}».
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {filteredItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => openApp(item)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '1.1rem 0.5rem',
                            borderRadius: 14,
                            border: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.borderColor = `${item.color}55`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `${item.color}1f`,
                                border: `1px solid ${item.color}44`,
                            }}
                        >
                            {item.icon}
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--slate-200)', textAlign: 'center', lineHeight: 1.2 }}>
                            {t(item.labelKey)}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Desktop;
