import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, Check, Users, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ALL_FIGURES,
    searchFigures,
} from '../../kernel/services/debate-runtime/debate-historical-figures';

interface HistoricalFiguresPickerProps {
    isOpen: boolean;
    onClose: () => void;
    selectedIds: string[];
    onToggle: (id: string) => void;
    max?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
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

const UNIQUE_CATEGORIES = Array.from(
    new Set(ALL_FIGURES.map((f) => f.category).filter(Boolean)),
) as string[];

const UNIQUE_ERAS = Array.from(new Set(ALL_FIGURES.map((f) => f.era))).sort();

const ITEMS_PER_PAGE = 30;

export const HistoricalFiguresPicker: React.FC<HistoricalFiguresPickerProps> = ({
    isOpen,
    onClose,
    selectedIds,
    onToggle,
    max = 5,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [eraFilter, setEraFilter] = useState('');
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        return searchFigures(
            search,
            categoryFilter || undefined,
            eraFilter || undefined,
            page,
            ITEMS_PER_PAGE,
        );
    }, [search, categoryFilter, eraFilter, page]);

    useEffect(() => {
        if (!isOpen) return;
        setSearch('');
        setCategoryFilter('');
        setEraFilter('');
        setPage(0);
        const prevFocus = document.activeElement as HTMLElement | null;
        const focusable = containerRef.current?.querySelector<HTMLElement>(
            'button, [tabindex]:not([tabindex="-1"]), input, select, textarea',
        );
        focusable?.focus();

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Tab' && containerRef.current) {
                const all = containerRef.current.querySelectorAll<HTMLElement>(
                    'button, [tabindex]:not([tabindex="-1"])',
                );
                if (all.length === 0) return;
                const first = all[0]!;
                const last = all[all.length - 1]!;
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handler);
        return () => {
            document.removeEventListener('keydown', handler);
            prevFocus?.focus();
        };
    }, [isOpen, onClose]);

    const chip = (color: string): React.CSSProperties => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: '0.6rem',
        fontWeight: 600,
        background: `${color}20`,
        color,
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={containerRef}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 680,
                            maxHeight: '85vh',
                            overflow: 'auto',
                            background:
                                'linear-gradient(145deg, rgba(20,20,40,0.98), rgba(15,15,30,0.98))',
                            borderRadius: 16,
                            border: '1px solid rgba(168,85,247,0.2)',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                        }}
                    >
                        <div
                            style={{
                                padding: '20px 24px',
                                borderBottom: '1px solid rgba(100,116,139,0.15)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 12,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Users size={20} color="#a855f7" />
                                    <div>
                                        <h3
                                            style={{
                                                margin: 0,
                                                fontSize: '1rem',
                                                fontWeight: 700,
                                                color: 'var(--slate-200)',
                                            }}
                                        >
                                            Historical Figures ({ALL_FIGURES.length})
                                        </h3>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: '0.75rem',
                                                color: 'var(--slate-500)',
                                            }}
                                        >
                                            Select up to {max} figures for your debate
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--slate-500)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
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
                                        placeholder="Search by name, expertise, nationality..."
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px 8px 32px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'var(--slate-200)',
                                            fontSize: '0.8rem',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => {
                                        setCategoryFilter(e.target.value);
                                        setPage(0);
                                    }}
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.75rem',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="">All Categories</option>
                                    {UNIQUE_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={eraFilter}
                                    onChange={(e) => {
                                        setEraFilter(e.target.value);
                                        setPage(0);
                                    }}
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.75rem',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="">All Eras</option>
                                    {UNIQUE_ERAS.map((era) => (
                                        <option key={era} value={era}>
                                            {era}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: '16px 24px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 8,
                            }}
                        >
                            {filtered.items.map((fig) => {
                                const selected = selectedIds.includes(fig.id);
                                const disabled = !selected && selectedIds.length >= max;
                                const catColor = fig.category
                                    ? CATEGORY_COLORS[fig.category] || '#64748b'
                                    : fig.color;
                                return (
                                    <button
                                        key={fig.id}
                                        onClick={() => !disabled && onToggle(fig.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: `1px solid ${selected ? `${catColor}60` : 'rgba(100,116,139,0.15)'}`,
                                            background: selected
                                                ? `${catColor}15`
                                                : 'rgba(30,30,50,0.4)',
                                            cursor: disabled ? 'not-allowed' : 'pointer',
                                            opacity: disabled ? 0.4 : 1,
                                            textAlign: 'left',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <span style={{ fontSize: '1.4rem' }}>{fig.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    color: selected ? catColor : '#e2e8f0',
                                                }}
                                            >
                                                {fig.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--slate-500)',
                                                    display: 'flex',
                                                    gap: 4,
                                                    flexWrap: 'wrap',
                                                    marginTop: 2,
                                                }}
                                            >
                                                <span>{fig.era}</span>
                                                <span>·</span>
                                                <span>{fig.expertise.split(',')[0]}</span>
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: 4,
                                                    flexWrap: 'wrap',
                                                    marginTop: 4,
                                                }}
                                            >
                                                {fig.category && (
                                                    <span style={chip(catColor)}>
                                                        {fig.category}
                                                    </span>
                                                )}
                                                <span style={chip('#64748b')}>
                                                    {fig.nationality}
                                                </span>
                                            </div>
                                        </div>
                                        {selected && <Check size={16} color={catColor} />}
                                    </button>
                                );
                            })}
                        </div>

                        {filtered.items.length === 0 && (
                            <div
                                style={{
                                    padding: 30,
                                    textAlign: 'center',
                                    color: 'var(--slate-500)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                No figures match your search
                            </div>
                        )}

                        <div
                            style={{
                                padding: '12px 24px',
                                borderTop: '1px solid rgba(100,116,139,0.15)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 8,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                    {selectedIds.length}/{max} selected
                                </span>
                                {filtered.total > ITEMS_PER_PAGE &&
                                    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE < filtered.total && (
                                        <button
                                            onClick={() => setPage((p) => p + 1)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 6,
                                                border: '1px solid rgba(99,102,241,0.3)',
                                                background: 'rgba(99,102,241,0.1)',
                                                color: '#818cf8',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Show More ({filtered.total - filtered.items.length}{' '}
                                            left)
                                        </button>
                                    )}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={onClose}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
