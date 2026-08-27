import { Search, ArrowUpDown, Eye, EyeOff, BarChart3, X, Loader2 } from 'lucide-react';
import { FILTER_DIRS, FILTER_ICONS } from './project-os-utils';
import type { FilterKey, SortKey } from './project-os-utils';

interface Props {
    filter: FilterKey;
    sortBy: SortKey;
    showSensitive: boolean;
    showStats: boolean;
    searchQuery: string;
    searching: boolean;
    onSetFilter: (f: FilterKey) => void;
    onSetSortBy: (s: SortKey) => void;
    onToggleSensitive: () => void;
    onToggleStats: () => void;
    onSearch: (q: string) => void;
}

const ProjectToolbar: React.FC<Props> = ({
    filter,
    sortBy,
    showSensitive,
    showStats: _showStats,
    searchQuery,
    searching,
    onSetFilter,
    onSetSortBy,
    onToggleSensitive,
    onToggleStats,
    onSearch,
}) => {
    const cycleSort = () => {
        const next: SortKey = sortBy === 'name' ? 'size' : sortBy === 'size' ? 'type' : 'name';
        onSetSortBy(next);
    };

    return (
        <div
            style={{
                padding: '0.35rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                flexWrap: 'wrap',
            }}
        >
            {(Object.keys(FILTER_DIRS) as FilterKey[]).map((key) => (
                <button
                    key={key}
                    onClick={() => onSetFilter(key)}
                    style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        background: filter === key ? 'rgba(139,92,246,0.2)' : 'transparent',
                        color: filter === key ? '#a855f7' : '#64748b',
                    }}
                >
                    {FILTER_ICONS[key]}
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
            ))}
            <div
                style={{
                    flex: 1,
                    minWidth: 100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 5,
                    padding: '3px 7px',
                    marginLeft: 4,
                }}
            >
                <Search size={11} color="#64748b" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search..."
                    style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--slate-200)',
                        fontSize: '0.72rem',
                    }}
                />
                {searching && <Loader2 size={10} />}
                {searchQuery && (
                    <button
                        onClick={() => onSearch('')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-500)',
                            cursor: 'pointer',
                            padding: 0,
                        }}
                    >
                        <X size={10} />
                    </button>
                )}
            </div>
            <button
                onClick={cycleSort}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--slate-500)',
                    cursor: 'pointer',
                    padding: 3,
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <ArrowUpDown size={11} />{' '}
                {sortBy === 'name' ? 'Name' : sortBy === 'size' ? 'Size' : 'Type'}
            </button>
            <button
                onClick={onToggleSensitive}
                style={{
                    background: 'none',
                    border: 'none',
                    color: showSensitive ? '#f59e0b' : '#64748b',
                    cursor: 'pointer',
                    padding: 3,
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                {showSensitive ? <EyeOff size={11} /> : <Eye size={11} />}{' '}
                {showSensitive ? 'Hide' : 'Sensitive'}
            </button>
            <button
                onClick={onToggleStats}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--slate-500)',
                    cursor: 'pointer',
                    padding: 3,
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <BarChart3 size={11} /> Stats
            </button>
        </div>
    );
};

export default ProjectToolbar;
