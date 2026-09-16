import React, { useState } from 'react';
import {
    Grid3X3,
    Search,
    ArrowUpRight,
    GitBranch,
    Users,
    Code,
    BookOpen,
    BarChart3,
    Sparkles,
} from 'lucide-react';
import PanelLoader from './PanelLoader';
import { topologyTemplateService } from '../kernel/instances';

const CATEGORIES = [
    { id: '', label: 'All', icon: <Grid3X3 size={14} /> },
    { id: 'technical', label: 'Technical', icon: <Code size={14} /> },
    { id: 'research', label: 'Research', icon: <BookOpen size={14} /> },
    { id: 'debate', label: 'Debate', icon: <Users size={14} /> },
    { id: 'creative', label: 'Creative', icon: <Sparkles size={14} /> },
    { id: 'analysis', label: 'Analysis', icon: <BarChart3 size={14} /> },
];

const CATEGORY_COLORS: Record<string, string> = {
    technical: '#3b82f6',
    research: '#a855f7',
    debate: '#ef4444',
    creative: '#f59e0b',
    analysis: '#10b981',
};

const TopologyGalleryPanelContent: React.FC = () => {
    const [category, setCategory] = useState('');
    const [search, setSearch] = useState('');
    const templates = topologyTemplateService
        .getTemplates(category || undefined)
        .filter(
            (t) =>
                t.name.toLowerCase().includes(search.toLowerCase()) ||
                t.description.toLowerCase().includes(search.toLowerCase()),
        );

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>
                Topology Templates Gallery
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--slate-400)' }}>
                Pre-built topology patterns to jumpstart your workflows
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 12,
                            background: category === cat.id ? '#1e293b' : 'transparent',
                            color: category === cat.id ? '#fff' : '#94a3b8',
                            fontWeight: category === cat.id ? 600 : 400,
                        }}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'var(--slate-900)',
                        borderRadius: 6,
                        padding: '4px 10px',
                    }}
                >
                    <Search size={14} style={{ color: 'var(--slate-500)' }} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search templates..."
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            fontSize: 12,
                            outline: 'none',
                            width: 160,
                        }}
                    />
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 12,
                }}
            >
                {templates.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            background: 'var(--slate-800)',
                            borderRadius: 10,
                            padding: 14,
                            cursor: 'pointer',
                            transition: 'transform 0.15s',
                            border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#334155';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.transform = 'none';
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 8,
                            }}
                        >
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        background: `${CATEGORY_COLORS[t.category] || '#64748b'}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: CATEGORY_COLORS[t.category] || '#64748b',
                                    }}
                                >
                                    <GitBranch size={16} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                                    <span
                                        style={{
                                            fontSize: 10,
                                            padding: '1px 6px',
                                            borderRadius: 4,
                                            background: `${CATEGORY_COLORS[t.category] || '#64748b'}20`,
                                            color: CATEGORY_COLORS[t.category] || '#64748b',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {t.category}
                                    </span>
                                </div>
                            </div>
                            <ArrowUpRight size={14} style={{ color: 'var(--slate-500)', flexShrink: 0 }} />
                        </div>
                        <p
                            style={{
                                margin: '0 0 8px',
                                fontSize: 12,
                                color: 'var(--slate-400)',
                                lineHeight: 1.4,
                            }}
                        >
                            {t.description}
                        </p>
                        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--slate-500)' }}>
                            <span>{t.nodes.length} nodes</span>
                            <span>·</span>
                            <span>{t.edges.length} edges</span>
                            {t.usageCount > 0 && (
                                <>
                                    <span>·</span>
                                    <span>{t.usageCount} uses</span>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TopologyGalleryPanel: React.FC = () => (
    <PanelLoader>
        <TopologyGalleryPanelContent />
    </PanelLoader>
);
export default TopologyGalleryPanel;
