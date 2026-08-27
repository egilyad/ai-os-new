import React, { useState, useMemo, useCallback } from 'react';
import {
    Search,
    Shuffle,
    X,
    Quote,
    BookOpen,
    Globe,
    Calendar,
    MessageSquare,
    Zap,
    Star,
    Sparkles,
} from 'lucide-react';
import { PERSONA_DEFINITIONS } from '../data/persona-definitions';
import type { PersonaEntry, PersonaCategory, PersonaEra } from '../kernel/contracts/persona-entry';

const CATEGORY_COLORS: Record<PersonaCategory, string> = {
    scientist: '#3b82f6',
    philosopher: '#8b5cf6',
    writer: '#f59e0b',
    politician: '#ef4444',
    artist: '#ec4899',
    musician: '#a855f7',
    entrepreneur: '#10b981',
    military: '#dc2626',
    religious: '#d97706',
    fictional: '#06b6d4',
    expert: '#64748b',
};

const CATEGORY_ICONS: Record<PersonaCategory, string> = {
    scientist: '🔬',
    philosopher: '🏛️',
    writer: '✍️',
    politician: '🏛️',
    artist: '🎨',
    musician: '🎵',
    entrepreneur: '💼',
    military: '⚔️',
    religious: '☮️',
    fictional: '📚',
    expert: '🎓',
};

const ERAS: PersonaEra[] = [
    'ancient',
    'classical',
    'medieval',
    'renaissance',
    'enlightenment',
    'modern',
    'contemporary',
    'fictional',
];

const ERA_LABELS: Record<PersonaEra, string> = {
    ancient: 'Ancient',
    classical: 'Classical',
    medieval: 'Medieval',
    renaissance: 'Renaissance',
    enlightenment: 'Enlightenment',
    modern: 'Modern',
    contemporary: 'Contemporary',
    fictional: 'Fictional',
};

const ITEMS_PER_PAGE = 20;

interface PersonaPickerPanelProps {
    onSelectForChat?: (persona: PersonaEntry) => void;
    onSelectForDebate?: (persona: PersonaEntry) => void;
    standalone?: boolean;
}

const PersonaPickerPanel: React.FC<PersonaPickerPanelProps> = ({
    onSelectForChat,
    onSelectForDebate,
    standalone = true,
}) => {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<PersonaCategory | ''>('');
    const [eraFilter, setEraFilter] = useState<PersonaEra | ''>('');
    const [selected, setSelected] = useState<PersonaEntry | null>(null);
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        let result = PERSONA_DEFINITIONS;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    p.field.toLowerCase().includes(q) ||
                    p.nationality.toLowerCase().includes(q) ||
                    (p.famousWorks &&
                        p.famousWorks.some((w: string) => w.toLowerCase().includes(q))),
            );
        }
        if (categoryFilter) result = result.filter((p) => p.category === categoryFilter);
        if (eraFilter) result = result.filter((p) => p.era === eraFilter);
        return result;
    }, [search, categoryFilter, eraFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const pageItems = filtered.slice(0, (page + 1) * ITEMS_PER_PAGE);

    const handleRandom = useCallback(() => {
        const idx = Math.floor(Math.random() * PERSONA_DEFINITIONS.length);
        setSelected(PERSONA_DEFINITIONS[idx]!);
    }, []);

    const chip = (color: string, bg?: string): React.CSSProperties => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: '0.7rem',
        fontWeight: 600,
        background: bg || `${color}20`,
        color,
        border: `1px solid ${color}40`,
    });

    return (
        <div style={{ padding: 24, maxWidth: 1200 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                }}
            >
                <div>
                    <h2
                        style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--slate-200)' }}
                    >
                        Persona Library
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                        {PERSONA_DEFINITIONS.length} personas — historical, fictional, and
                        contemporary figures
                    </p>
                </div>
                <button
                    onClick={handleRandom}
                    style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(139,92,246,0.15)',
                        color: 'var(--purple-muted)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Shuffle size={14} /> Random Persona
                </button>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
                    <Search
                        size={14}
                        style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                        }}
                    />
                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        placeholder="Search personas..."
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 32px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => {
                        setCategoryFilter(e.target.value as PersonaCategory | '');
                        setPage(0);
                    }}
                    style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--slate-200)',
                        fontSize: '0.8rem',
                        outline: 'none',
                    }}
                >
                    <option value="">All Categories</option>
                    {(Object.keys(CATEGORY_COLORS) as PersonaCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                            {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                    ))}
                </select>
                <select
                    value={eraFilter}
                    onChange={(e) => {
                        setEraFilter(e.target.value as PersonaEra | '');
                        setPage(0);
                    }}
                    style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--slate-200)',
                        fontSize: '0.8rem',
                        outline: 'none',
                    }}
                >
                    <option value="">All Eras</option>
                    {ERAS.filter(
                        (e) =>
                            e !== 'fictional' || categoryFilter === 'fictional' || !categoryFilter,
                    ).map((era) => (
                        <option key={era} value={era}>
                            {ERA_LABELS[era]}
                        </option>
                    ))}
                </select>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 10,
                }}
            >
                {pageItems.map((p) => {
                    const catColor = CATEGORY_COLORS[p.category as PersonaCategory] || '#64748b';
                    return (
                        <div
                            key={p.id}
                            onClick={() => setSelected(p)}
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: 10,
                                padding: 14,
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderTop: `3px solid ${catColor}`,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                }}
                            >
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.8rem' }}>{p.icon}</span>
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                color: 'var(--slate-200)',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            {p.name}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                            {p.field}
                                        </div>
                                    </div>
                                </div>
                                <span style={chip(catColor)}>{p.category}</span>
                            </div>
                            <div
                                style={{
                                    fontSize: '0.78rem',
                                    color: 'var(--slate-400)',
                                    marginTop: 8,
                                    lineHeight: 1.4,
                                }}
                            >
                                {p.description}
                            </div>
                            <div
                                style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}
                            >
                                <span style={chip('#64748b')}>
                                    <Calendar size={10} /> {ERA_LABELS[p.era as PersonaEra]}
                                </span>
                                <span style={chip('#64748b')}>
                                    <Globe size={10} /> {p.nationality}
                                </span>
                                {p.birthYear && (
                                    <span style={chip('#64748b')}>
                                        {p.birthYear}
                                        {p.deathYear ? `–${p.deathYear}` : ''}
                                    </span>
                                )}
                                {p.quotes && p.quotes.length > 0 && (
                                    <span style={chip('#f59e0b', 'rgba(245,158,11,0.1)')}>
                                        <Quote size={10} /> {p.quotes.length}
                                    </span>
                                )}
                            </div>
                            {standalone && (
                                <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectForChat?.(p);
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: 6,
                                            border: 'none',
                                            background: 'var(--success-tint)',
                                            color: '#34d399',
                                            cursor: 'pointer',
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                        title="Chat with this persona"
                                    >
                                        <MessageSquare size={11} /> Chat
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectForDebate?.(p);
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: 6,
                                            border: 'none',
                                            background: 'var(--error-tint)',
                                            color: '#f87171',
                                            cursor: 'pointer',
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                        title="Use persona in debate"
                                    >
                                        <Zap size={11} /> Debate
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: 40,
                        color: 'var(--slate-500)',
                        fontSize: '0.9rem',
                    }}
                >
                    <Search size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div>No personas found matching your criteria</div>
                </div>
            )}

            {totalPages > 1 && pageItems.length < filtered.length && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        style={{
                            padding: '8px 20px',
                            borderRadius: 8,
                            border: '1px solid rgba(99,102,241,0.3)',
                            background: 'rgba(99,102,241,0.1)',
                            color: '#818cf8',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                        }}
                    >
                        Show More ({filtered.length - pageItems.length} remaining)
                    </button>
                </div>
            )}

            {selected && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 20,
                    }}
                    onClick={() => setSelected(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--slate-900)',
                            borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.1)',
                            maxWidth: 600,
                            width: '100%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            padding: 0,
                        }}
                    >
                        <div
                            style={{
                                padding: '1.5rem 2rem',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '2.5rem' }}>{selected.icon}</span>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--slate-200)' }}>
                                        {selected.name}
                                    </h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                                        {selected.field}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                style={{
                                    padding: 6,
                                    borderRadius: 6,
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--slate-400)',
                                    cursor: 'pointer',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem 2rem' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                    marginBottom: 16,
                                }}
                            >
                                <span style={chip(CATEGORY_COLORS[selected.category] || '#64748b')}>
                                    {selected.category}
                                </span>
                                <span style={chip('#64748b')}>
                                    <Calendar size={12} /> {ERA_LABELS[selected.era]}
                                </span>
                                <span style={chip('#64748b')}>
                                    <Globe size={12} /> {selected.nationality}
                                </span>
                                {selected.birthYear && (
                                    <span style={chip('#64748b')}>
                                        {selected.birthYear}
                                        {selected.deathYear ? `–${selected.deathYear}` : '–present'}
                                    </span>
                                )}
                            </div>

                            {selected.biography && (
                                <div style={{ marginBottom: 16 }}>
                                    <div
                                        style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-500)',
                                            textTransform: 'uppercase',
                                            marginBottom: 4,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <BookOpen size={12} /> Biography
                                    </div>
                                    <p
                                        style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--slate-400)',
                                            lineHeight: 1.6,
                                            margin: 0,
                                        }}
                                    >
                                        {selected.biography}
                                    </p>
                                </div>
                            )}

                            {selected.quotes && selected.quotes.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div
                                        style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            color: 'var(--warning)',
                                            textTransform: 'uppercase',
                                            marginBottom: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Quote size={12} /> Famous Quotes
                                    </div>
                                    {selected.quotes.map((q) => (
                                        <div
                                            key={q}
                                            style={{
                                                padding: '8px 12px',
                                                marginBottom: 6,
                                                background: 'rgba(245,158,11,0.05)',
                                                borderRadius: 8,
                                                borderLeft: '3px solid rgba(245,158,11,0.3)',
                                                fontSize: '0.85rem',
                                                color: 'var(--slate-200)',
                                                fontStyle: 'italic',
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            "{q}"
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selected.famousWorks && selected.famousWorks.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div
                                        style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-500)',
                                            textTransform: 'uppercase',
                                            marginBottom: 6,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Star size={12} /> Famous Works
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {selected.famousWorks.map((w) => (
                                            <span key={w} style={chip('#64748b')}>
                                                {w}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selected.speakingStyle && (
                                <div style={{ marginBottom: 16 }}>
                                    <div
                                        style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            color: '#6366f1',
                                            textTransform: 'uppercase',
                                            marginBottom: 4,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Sparkles size={12} /> Speaking Style
                                    </div>
                                    <p
                                        style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--slate-400)',
                                            lineHeight: 1.5,
                                            margin: 0,
                                        }}
                                    >
                                        {selected.speakingStyle}
                                    </p>
                                </div>
                            )}

                            <div style={{ marginBottom: 16 }}>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-500)',
                                        textTransform: 'uppercase',
                                        marginBottom: 4,
                                    }}
                                >
                                    System Prompt
                                </div>
                                <div
                                    style={{
                                        padding: 12,
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: 8,
                                        fontSize: '0.75rem',
                                        color: 'var(--slate-400)',
                                        lineHeight: 1.5,
                                        fontFamily: '"JetBrains Mono", monospace',
                                        maxHeight: 150,
                                        overflowY: 'auto',
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {selected.systemPrompt}
                                </div>
                            </div>

                            {standalone && (
                                <div
                                    style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
                                >
                                    <button
                                        onClick={() => {
                                            onSelectForChat?.(selected);
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: 'rgba(16,185,129,0.15)',
                                            color: '#34d399',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <MessageSquare size={14} /> Chat with{' '}
                                        {selected.name.split(' ')[0]}
                                    </button>
                                    <button
                                        onClick={() => {
                                            onSelectForDebate?.(selected);
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: 'rgba(239,68,68,0.15)',
                                            color: '#f87171',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Zap size={14} /> Use in Debate
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonaPickerPanel;
