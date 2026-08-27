import React, { useState } from 'react';
import { Store, Search, Download, Trash2, Star } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { personaMarketplaceService } from '../kernel/instances';
import type { PersonaCategory } from '../kernel/contracts/persona-marketplace';

const CATEGORIES: PersonaCategory[] = [
    'professional',
    'creative',
    'technical',
    'academic',
    'entertainment',
    'custom',
];

const PersonaMarketplacePanelContent: React.FC = () => {
    const [listings, setListings] = useState(() => personaMarketplaceService.getListings());
    const [filter, setFilter] = useState<PersonaCategory | ''>('');
    const [search, setSearch] = useState('');

    const refresh = () => {
        setListings(
            filter
                ? personaMarketplaceService.getListings(filter as PersonaCategory)
                : personaMarketplaceService.getListings(),
        );
    };

    const handleSearch = (q: string) => {
        setSearch(q);
        if (!q.trim()) {
            refresh();
            return;
        }
        setListings(personaMarketplaceService.search(q));
    };

    const handleFilter = (cat: PersonaCategory | '') => {
        setFilter(cat);
        setSearch('');
        if (!cat) setListings(personaMarketplaceService.getListings());
        else setListings(personaMarketplaceService.getListings(cat));
    };

    const handleInstall = (id: string) => {
        personaMarketplaceService.install(id);
        refresh();
    };
    const handleUninstall = (id: string) => {
        personaMarketplaceService.uninstall(id);
        refresh();
    };

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <h2
                style={{
                    margin: '0 0 4px',
                    fontSize: 18,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <Store size={20} color="#a855f7" /> Persona Marketplace
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--slate-400)' }}>
                Browse, install, and manage AI personas
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                    <Search
                        size={14}
                        style={{ position: 'absolute', left: 10, top: 9, color: 'var(--slate-500)' }}
                    />
                    <input
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search personas..."
                        style={{
                            width: '100%',
                            padding: '7px 10px 7px 30px',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'var(--slate-900)',
                            color: 'var(--slate-200)',
                            fontSize: 13,
                            outline: 'none',
                        }}
                    />
                </div>
                <button
                    onClick={() => handleFilter('')}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        background: !filter ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                        color: !filter ? '#a855f7' : '#94a3b8',
                    }}
                >
                    All
                </button>
                {CATEGORIES.map((c) => (
                    <button
                        key={c}
                        onClick={() => handleFilter(c)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            background:
                                filter === c ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                            color: filter === c ? '#a855f7' : '#94a3b8',
                        }}
                    >
                        {c}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {listings.map((p) => (
                    <div
                        key={p.id}
                        style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            background: p.installed ? 'rgba(16,185,129,0.04)' : '#0f172a',
                            border: `1px solid ${p.installed ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)'}`,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 4,
                                    }}
                                >
                                    <span
                                        style={{ fontWeight: 600, fontSize: 14, color: 'var(--slate-200)' }}
                                    >
                                        {p.name}
                                    </span>
                                    <span
                                        style={{
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            textTransform: 'capitalize',
                                            background: 'rgba(168,85,247,0.15)',
                                            color: '#a855f7',
                                        }}
                                    >
                                        {p.category}
                                    </span>
                                    {p.installed && (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: 'var(--success)',
                                                fontWeight: 600,
                                            }}
                                        >
                                            ✓ Installed
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 4 }}>
                                    {p.description}
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        fontSize: 11,
                                        color: 'var(--slate-600)',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Star size={11} color="#f59e0b" /> {p.rating.toFixed(1)}
                                    </span>
                                    <span>{p.downloads} downloads</span>
                                    <span>v{p.version}</span>
                                    <span>{p.tags.slice(0, 3).join(', ')}</span>
                                </div>
                            </div>
                            {p.installed ? (
                                <button
                                    onClick={() => handleUninstall(p.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '6px 12px',
                                        borderRadius: 6,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        background: 'rgba(239,68,68,0.15)',
                                        color: 'var(--error)',
                                    }}
                                >
                                    <Trash2 size={12} /> Uninstall
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleInstall(p.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '6px 12px',
                                        borderRadius: 6,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        background: 'rgba(139,92,246,0.15)',
                                        color: 'var(--purple)',
                                    }}
                                >
                                    <Download size={12} /> Install
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PersonaMarketplacePanel: React.FC = () => (
    <PanelLoader name="Persona Marketplace">
        <PersonaMarketplacePanelContent />
    </PanelLoader>
);

export default PersonaMarketplacePanel;
