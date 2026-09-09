import { Layers } from 'lucide-react';
import { GROUP_COLORS, GROUP_ORDER } from './prompt-audit-constants';

interface Props {
    groupCounts: Record<string, number>;
    agentsCount: number;
    groupFilter: string;
    onSetGroupFilter: (g: string) => void;
}

const GroupDistribution: React.FC<Props> = ({
    groupCounts,
    agentsCount,
    groupFilter,
    onSetGroupFilter,
}) => (
    <div
        style={{
            padding: '0.6rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}
    >
        <div
            style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--slate-500)',
                marginBottom: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
            }}
        >
            <Layers size={12} /> Groups
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {GROUP_ORDER.filter((g) => groupCounts[g]).map((g) => {
                const pct = agentsCount > 0 ? ((groupCounts[g] || 0) / agentsCount) * 100 : 0;
                const color = GROUP_COLORS[g] || '#64748b';
                return (
                    <div
                        key={g}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 5,
                            background: `${color}10`,
                            border:
                                groupFilter === g ? `1px solid ${color}` : '1px solid transparent',
                            cursor: 'pointer',
                        }}
                        onClick={() => onSetGroupFilter(groupFilter === g ? 'all' : g)}
                    >
                        <div
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: color,
                            }}
                        />
                        <span style={{ fontSize: '0.68rem', color: 'var(--slate-400)' }}>{g}</span>
                        <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>
                            {groupCounts[g]} ({Math.round(pct)}%)
                        </span>
                    </div>
                );
            })}
            {groupFilter !== 'all' && (
                <button
                    onClick={() => onSetGroupFilter('all')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        fontSize: '0.65rem',
                        padding: '0.2rem 0.4rem',
                    }}
                >
                    Clear
                </button>
            )}
        </div>
    </div>
);

export default GroupDistribution;
