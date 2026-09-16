import { Search } from 'lucide-react';
import { getNodeColor } from './graph-utils';

interface SearchAndFilterProps {
    searchQuery: string;
    typeFilter: string | null;
    typeCounts: Record<string, number>;
    uniqueTypes: string[];
    totalMemories: number;
    onSearchChange: (v: string) => void;
    onTypeFilterChange: (type: string | null) => void;
    t: (key: string) => string;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
    searchQuery,
    typeFilter,
    typeCounts,
    uniqueTypes,
    totalMemories,
    onSearchChange,
    onTypeFilterChange,
    t,
}) => (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 240 }}>
            <Search
                size={14}
                style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--slate-500)',
                }}
                aria-hidden="true"
            />
            <input
                type="text"
                placeholder={t('knowledge.search_placeholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10,
                    color: 'white',
                    fontSize: '0.8rem',
                    outline: 'none',
                }}
                aria-label={t('knowledge.search_placeholder')}
            />
        </div>
        <div
            style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}
            role="group"
            aria-label={t('common.aria.filter')}
        >
            <button
                onClick={() => onTypeFilterChange(null)}
                style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: 8,
                    border: 'none',
                    background: typeFilter === null ? 'rgba(168,85,247,0.15)' : 'rgba(0,0,0,0.3)',
                    color: typeFilter === null ? '#a855f7' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                }}
                aria-pressed={typeFilter === null}
                aria-label="Show all node types"
            >
                {t('knowledge.filter_all').replace('{0}', String(totalMemories))}
            </button>
            {uniqueTypes.map((type) => (
                <button
                    key={type}
                    onClick={() => onTypeFilterChange(typeFilter === type ? null : type)}
                    style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: 8,
                        border: 'none',
                        background:
                            typeFilter === type ? `${getNodeColor(type)}20` : 'rgba(0,0,0,0.3)',
                        color: typeFilter === type ? getNodeColor(type) : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                    }}
                    aria-pressed={typeFilter === type}
                    aria-label={`Filter by type ${type}`}
                >
                    {type} ({typeCounts[type] || 0})
                </button>
            ))}
        </div>
    </div>
);

export default SearchAndFilter;
