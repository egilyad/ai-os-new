import { List } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { CATEGORY_CONFIG, STATUS_CONFIG } from './hypothesis-constants';
import type { FilterTab } from './hypothesis-constants';
import type { HypothesisStatus } from '../../kernel/types/research-types';

interface FilterBarProps {
    filterTab: FilterTab;
    onFilterTabChange: (tab: FilterTab) => void;
    statusFilter: HypothesisStatus | 'all';
    onStatusFilterChange: (status: HypothesisStatus | 'all') => void;
    categoryCounts: Record<string, number>;
    statusCounts: Record<string, number>;
}

const tabStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '0.35rem 0.7rem',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: active ? `${color}18` : 'transparent',
    color: active ? color : 'var(--slate-500)',
    transition: 'all 0.15s',
});

const FilterBar: React.FC<FilterBarProps> = ({
    filterTab,
    onFilterTabChange,
    statusFilter,
    onStatusFilterChange,
    categoryCounts,
    statusCounts,
}) => {
    const { t } = useTranslation();

    return (
        <div
            style={{
                padding: '0.5rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                display: 'flex',
                gap: 4,
                flexWrap: 'wrap',
                alignItems: 'center',
            }}
        >
            <button
                onClick={() => onFilterTabChange('all')}
                style={tabStyle(filterTab === 'all', '#8b5cf6')}
            >
                <List size={13} /> All{' '}
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>({categoryCounts.all})</span>
            </button>
            {(Object.keys(CATEGORY_CONFIG) as FilterTab[]).map((key) => {
                if (key === 'all') return null;
                const cfg = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG];
                return (
                    <button
                        key={key}
                        onClick={() => onFilterTabChange(key as FilterTab)}
                        style={tabStyle(filterTab === key, cfg.color)}
                    >
                        {cfg.icon} {t(cfg.labelKey)}{' '}
                        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                            ({categoryCounts[key]})
                        </span>
                    </button>
                );
            })}
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 3 }}>
                {(Object.keys(STATUS_CONFIG) as HypothesisStatus[]).map((st) => (
                    <button
                        key={st}
                        onClick={() => onStatusFilterChange(statusFilter === st ? 'all' : st)}
                        style={{
                            ...tabStyle(statusFilter === st, STATUS_CONFIG[st].color),
                            fontSize: '0.68rem',
                            padding: '0.2rem 0.5rem',
                        }}
                    >
                        {statusCounts[st]}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FilterBar;
