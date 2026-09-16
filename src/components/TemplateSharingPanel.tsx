import React, { useState } from 'react';
import { Share2, Search, Download, FolderOpen } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { templateSharingService } from '../kernel/instances';
import type { TemplateCategory } from '../kernel/contracts/template-sharing';

const CATEGORIES: TemplateCategory[] = ['debate', 'workflow', 'topology', 'prompt', 'agent'];

const TemplateSharingPanelContent: React.FC = () => {
    const [templates, setTemplates] = useState(() => templateSharingService.getSharedTemplates());
    const [, setImported] = useState(() => templateSharingService.getImported());
    const [filter, setFilter] = useState<TemplateCategory | ''>('');
    const [search, setSearch] = useState('');

    const refresh = () => {
        setTemplates(
            filter
                ? templateSharingService.getSharedTemplates(filter as TemplateCategory)
                : templateSharingService.getSharedTemplates(),
        );
        setImported(templateSharingService.getImported());
    };

    const handleSearch = (q: string) => {
        setSearch(q);
        if (!q.trim()) {
            refresh();
            return;
        }
        setTemplates(templateSharingService.search(q));
    };

    const handleFilter = (cat: TemplateCategory | '') => {
        setFilter(cat);
        setSearch('');
        if (!cat) setTemplates(templateSharingService.getSharedTemplates());
        else setTemplates(templateSharingService.getSharedTemplates(cat));
    };

    const handleImport = (id: string) => {
        templateSharingService.importTemplate(id);
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
                <Share2 size={20} color="#10b981" /> Template Sharing
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--slate-400)' }}>
                Discover shared templates from the community
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
                        placeholder="Search templates..."
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
                        background: !filter ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                        color: !filter ? '#10b981' : '#94a3b8',
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
                                filter === c ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                            color: filter === c ? '#10b981' : '#94a3b8',
                        }}
                    >
                        {c}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {templates.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            background: t.imported ? 'rgba(16,185,129,0.04)' : '#0f172a',
                            border: `1px solid ${t.imported ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)'}`,
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
                                        {t.name}
                                    </span>
                                    <span
                                        style={{
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            textTransform: 'capitalize',
                                            background: 'rgba(16,185,129,0.15)',
                                            color: 'var(--success)',
                                        }}
                                    >
                                        {t.category}
                                    </span>
                                    {t.imported && (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                color: 'var(--accent)',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Imported
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 4 }}>
                                    {t.description}
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
                                    <span>{t.author}</span>
                                    <span>{t.downloads} downloads</span>
                                    <span>{t.tags.slice(0, 3).join(', ')}</span>
                                </div>
                            </div>
                            {t.imported ? (
                                <span
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 6,
                                        fontSize: 12,
                                        background: 'var(--accent-tint)',
                                        color: 'var(--accent)',
                                    }}
                                >
                                    <FolderOpen size={12} style={{ marginRight: 4 }} /> In Library
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleImport(t.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '6px 12px',
                                        borderRadius: 6,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        background: 'rgba(16,185,129,0.15)',
                                        color: 'var(--success)',
                                    }}
                                >
                                    <Download size={12} /> Import
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TemplateSharingPanel: React.FC = () => (
    <PanelLoader name="Template Sharing">
        <TemplateSharingPanelContent />
    </PanelLoader>
);

export default TemplateSharingPanel;
