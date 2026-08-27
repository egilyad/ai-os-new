import React, { useMemo } from 'react';
import { Plus, Check, Search } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Lens, LensCategory } from '../../kernel/types/lens-types';

export const LENS_CATEGORIES: LensCategory[] = [
    'analytical',
    'ethical',
    'temporal',
    'domain',
    'risk',
    'stakeholder',
];

export const CATEGORY_COLORS: Record<LensCategory, string> = {
    analytical: '#8b5cf6',
    ethical: '#10b981',
    temporal: '#06b6d4',
    domain: '#f59e0b',
    risk: '#ef4444',
    stakeholder: '#ec4899',
};

interface LensSelectorProps {
    lenses: Lens[];
    selectedIds: string[];
    onToggle: (lensId: string) => void;
    maxStack?: number;
    compact?: boolean;
}

const LensSelector: React.FC<LensSelectorProps> = ({
    lenses,
    selectedIds,
    onToggle,
    maxStack = 5,
    compact = false,
}) => {
    const { t } = useTranslation();
    const [search, setSearch] = React.useState('');
    const [category, setCategory] = React.useState<LensCategory | 'all'>('all');

    const filtered = useMemo(() => {
        let list = lenses;
        if (category !== 'all') list = list.filter((l) => l.category === category);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (l) => l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q),
            );
        }
        return [...list].sort((a, b) => b.priority - a.priority);
    }, [lenses, category, search]);

    const selectedSet = new Set(selectedIds);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {!compact && (
                <>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 6,
                            padding: '4px 8px',
                        }}
                    >
                        <Search size={12} color="#64748b" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('lenses.search')}
                            style={{
                                flex: 1,
                                background: 'none',
                                border: 'none',
                                outline: 'none',
                                color: 'var(--slate-200)',
                                fontSize: '0.75rem',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setCategory('all')}
                            style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: 5,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                background:
                                    category === 'all' ? 'rgba(139,92,246,0.2)' : 'transparent',
                                color: category === 'all' ? '#a78bfa' : '#64748b',
                            }}
                        >
                            {t('lenses.all')}
                        </button>
                        {LENS_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat === category ? 'all' : cat)}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 5,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.68rem',
                                    fontWeight: 600,
                                    background:
                                        category === cat
                                            ? `${CATEGORY_COLORS[cat]}22`
                                            : 'transparent',
                                    color: category === cat ? CATEGORY_COLORS[cat] : '#64748b',
                                }}
                            >
                                {t(`lenses.cat_${cat}`)}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filtered.length === 0 ? (
                    <div
                        style={{
                            padding: '1rem',
                            textAlign: 'center',
                            color: 'var(--slate-600)',
                            fontSize: '0.75rem',
                        }}
                    >
                        {t('lenses.no_results')}
                    </div>
                ) : (
                    filtered.map((lens) => {
                        const isSelected = selectedSet.has(lens.id);
                        const atLimit = selectedIds.length >= maxStack && !isSelected;
                        const color = CATEGORY_COLORS[lens.category] ?? '#8b5cf6';
                        return (
                            <div
                                key={lens.id}
                                onClick={() => {
                                    if (atLimit) return;
                                    onToggle(lens.id);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '0.4rem 0.6rem',
                                    borderRadius: 6,
                                    background: isSelected ? `${color}15` : 'rgba(0,0,0,0.2)',
                                    border: isSelected
                                        ? `1px solid ${color}55`
                                        : '1px solid rgba(255,255,255,0.04)',
                                    cursor: atLimit ? 'not-allowed' : 'pointer',
                                    opacity: atLimit ? 0.5 : 1,
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span
                                    style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isSelected ? color : 'var(--border-subtle)',
                                        color: isSelected ? '#0f172a' : '#64748b',
                                        flexShrink: 0,
                                    }}
                                >
                                    {isSelected ? <Check size={12} /> : <Plus size={12} />}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            color: 'var(--slate-200)',
                                        }}
                                    >
                                        {lens.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.68rem',
                                            color: 'var(--slate-500)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {lens.description}
                                    </div>
                                </div>
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        color,
                                        flexShrink: 0,
                                    }}
                                >
                                    {t(`lenses.cat_${lens.category}`)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default LensSelector;
