import React, { useState, useEffect } from 'react';
import PanelLoader from './PanelLoader';

interface CommunityItem {
    id: string;
    type: 'topology' | 'prompt' | 'template' | 'persona';
    name: string;
    author: string;
    downloads: number;
    rating: number;
    description: string;
    tags: string[];
    source: 'template' | 'persona';
}

const TYPE_ICONS: Record<string, string> = {
    topology: '\uD83D\uDD17',
    prompt: '\uD83D\uDCDD',
    template: '\uD83D\uDCCB',
    persona: '\uD83D\uDC64',
};
const TYPE_COLORS: Record<string, string> = {
    topology: '#8b5cf6',
    prompt: '#3b82f6',
    template: '#10b981',
    persona: '#f59e0b',
};

const CommunityHubPanel: React.FC = () => {
    const [tab, setTab] = useState<'topologies' | 'prompts' | 'templates' | 'personas'>(
        'topologies',
    );
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<CommunityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const m = await import('../kernel/instances');
                const templates = m.templateSharingService.getSharedTemplates();
                const personas = m.personaMarketplaceService.getListings();
                const merged: CommunityItem[] = [
                    ...templates.map((t) => ({
                        id: t.id,
                        type: (t.category === 'prompt'
                            ? 'prompt'
                            : t.category === 'debate'
                              ? 'template'
                              : 'topology') as CommunityItem['type'],
                        name: t.name,
                        author: t.author || 'system',
                        downloads: t.downloads || 0,
                        rating: 4.0,
                        description: t.description,
                        tags: t.tags || [],
                        source: 'template' as const,
                    })),
                    ...personas.map((p) => ({
                        id: p.id,
                        type: 'persona' as CommunityItem['type'],
                        name: p.name,
                        author: p.author || 'community',
                        downloads: p.downloads || 0,
                        rating: p.rating || 4.0,
                        description: p.description,
                        tags: [p.category || 'custom'],
                        source: 'persona' as const,
                    })),
                ];
                if (!cancelled) setItems(merged);
            } catch {
                if (!cancelled) setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const filtered = items.filter((i) => {
        const typeMap: Record<string, string> = {
            topologies: 'topology',
            prompts: 'prompt',
            templates: 'template',
            personas: 'persona',
        };
        if (i.type !== typeMap[tab]) return false;
        if (
            search &&
            !i.name.toLowerCase().includes(search.toLowerCase()) &&
            !i.description.toLowerCase().includes(search.toLowerCase())
        )
            return false;
        return true;
    });

    const handleImport = async (item: CommunityItem) => {
        setImporting(item.id);
        try {
            const m = await import('../kernel/instances');
            if (item.source === 'template') {
                m.templateSharingService.importTemplate(item.id);
            } else {
                m.personaMarketplaceService.install(item.id);
            }
        } catch {
            // ignore
        } finally {
            setImporting(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    paddingBottom: '0.4rem',
                }}
            >
                {[
                    { id: 'topologies' as const, label: 'Topologies', icon: '\uD83D\uDD17' },
                    { id: 'prompts' as const, label: 'Prompts', icon: '\uD83D\uDCDD' },
                    { id: 'templates' as const, label: 'Templates', icon: '\uD83D\uDCCB' },
                    { id: 'personas' as const, label: 'Personas', icon: '\uD83D\uDC64' },
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: tab === t.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                            color: tab === t.id ? '#60a5fa' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                        }}
                    >
                        <span>{t.icon}</span> {t.label}
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    style={{
                        width: 180,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.2)',
                        color: 'var(--text-primary)',
                        fontSize: '0.7rem',
                    }}
                />
            </div>

            {loading && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                    }}
                >
                    Loading community items...
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                    }}
                >
                    No items found. Check that templates/personas are available.
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '0.75rem',
                }}
            >
                {filtered.map((item) => (
                    <div
                        key={`${item.source}-${item.id}`}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>{TYPE_ICONS[item.type]}</span>
                            <span
                                style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    flex: 1,
                                }}
                            >
                                {item.name}
                            </span>
                            <span
                                style={{
                                    fontSize: '0.6rem',
                                    padding: '0.1rem 0.3rem',
                                    borderRadius: '3px',
                                    background: `${TYPE_COLORS[item.type]}20`,
                                    color: TYPE_COLORS[item.type],
                                }}
                            >
                                {item.type}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {item.description}
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {item.tags.map((t) => (
                                <span
                                    key={t}
                                    style={{
                                        fontSize: '0.6rem',
                                        padding: '0.05rem 0.3rem',
                                        borderRadius: '3px',
                                        background: 'rgba(255,255,255,0.04)',
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.65rem',
                                color: 'var(--text-muted)',
                                marginTop: '0.2rem',
                            }}
                        >
                            <span>by {item.author}</span>
                            <span>
                                {'\u2B50'} {item.rating}
                            </span>
                            <span>
                                {'\u2B07'} {item.downloads}
                            </span>
                            <div style={{ flex: 1 }} />
                            <button
                                onClick={() => handleImport(item)}
                                disabled={importing === item.id}
                                style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background:
                                        importing === item.id
                                            ? 'rgba(59,130,246,0.4)'
                                            : 'rgba(59,130,246,0.2)',
                                    color: importing === item.id ? '#93c5fd' : '#60a5fa',
                                    cursor: importing === item.id ? 'default' : 'pointer',
                                    fontSize: '0.65rem',
                                }}
                            >
                                {importing === item.id ? 'Importing...' : 'Import'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function CommunityHubWrapper() {
    return (
        <PanelLoader title="Community Hub">
            <CommunityHubPanel />
        </PanelLoader>
    );
}
