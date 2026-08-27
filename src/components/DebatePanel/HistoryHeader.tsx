import {
    Clock,
    RotateCcw,
    Search,
    BarChart3,
    MessageSquare,
    ChevronsDown,
    Filter,
} from 'lucide-react';

interface HistoryStats {
    total: number;
    avgArgs: number;
    avgRounds: number;
    longestArgs: number;
    longestRounds: number;
}

interface HistoryHeaderProps {
    count: number;
    filteredCount: number;
    stats: HistoryStats | null;
    searchQuery: string;
    strategyFilter: string;
    strategies: string[];
    onSearchChange: (v: string) => void;
    onStrategyChange: (v: string) => void;
    onRefresh: () => void;
    t: (key: string) => string;
}

const HistoryHeader: React.FC<HistoryHeaderProps> = ({
    count: _count,
    filteredCount,
    stats,
    searchQuery,
    strategyFilter,
    strategies,
    onSearchChange,
    onStrategyChange,
    onRefresh,
    t,
}) => (
    <div
        style={{
            flexShrink: 0,
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
    >
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
            }}
        >
            <h3
                style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: 'var(--slate-50)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <Clock size={20} color="#3b82f6" /> {t('debate_runtime.title')}{' '}
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                    ({filteredCount})
                </span>
            </h3>
            <button
                onClick={onRefresh}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--slate-500)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                }}
                title={t('common.refresh')}
                aria-label={t('common.refresh')}
            >
                <RotateCcw size={16} />
            </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.35rem 0.75rem',
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border)',
                }}
            >
                <Search size={14} color="#64748b" />
                <input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t('debate.search_history') + '...'}
                    style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        color: 'var(--slate-200)',
                        fontSize: '0.8rem',
                        outline: 'none',
                    }}
                    aria-label={t('debate.search_history')}
                />
            </div>
            <select
                value={strategyFilter}
                onChange={(e) => onStrategyChange(e.target.value)}
                style={{
                    padding: '0.35rem 0.6rem',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--slate-200)',
                    fontSize: '0.75rem',
                    outline: 'none',
                }}
                aria-label={t('debate.filter_strategy')}
            >
                <option value="all">{t('debate.all_strategies')}</option>
                {strategies.map((s) => (
                    <option key={s} value={s}>
                        {s.replace('_', ' ')}
                    </option>
                ))}
            </select>
        </div>

        {stats && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                    {
                        icon: BarChart3,
                        color: 'var(--accent)',
                        label: `${stats.total} ${t('debate.debates')}`,
                    },
                    {
                        icon: MessageSquare,
                        color: 'var(--success)',
                        label: `Ø ${stats.avgArgs} ${t('debate.arg_short')}`,
                    },
                    {
                        icon: ChevronsDown,
                        color: 'var(--warning)',
                        label: `Ø ${stats.avgRounds} ${t('debate.rounds')}`,
                    },
                    {
                        icon: Filter,
                        color: '#a855f7',
                        label: `${t('debate.longest')}: ${stats.longestRounds} ${t('debate.rounds')} / ${stats.longestArgs} ${t('debate.arg_short')}`,
                    },
                ].map((s) => {
                    const Icon = s.icon;
                    return (
                        <div
                            key={s.label}
                            style={{
                                padding: '0.4rem 0.7rem',
                                borderRadius: 8,
                                background: `${s.color}15`,
                                border: `1px solid ${s.color}20`,
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <Icon size={12} color={s.color} /> {s.label}
                        </div>
                    );
                })}
            </div>
        )}

        {searchQuery && filteredCount === 0 && (
            <div
                style={{
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--error)',
                    textAlign: 'center',
                }}
            >
                {t('debate.no_results')}
            </div>
        )}
    </div>
);

export default HistoryHeader;
