import { Target } from 'lucide-react';
import { STRATEGY_COLORS } from './prompt-audit-constants';

interface Props {
    strategyCounts: Record<string, number>;
    agentsCount: number;
}

const StrategyDistribution: React.FC<Props> = ({ strategyCounts, agentsCount }) => (
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
            <Target size={12} /> Strategy Distribution
        </div>
        <div style={{ display: 'flex', gap: 4, height: 22 }}>
            {Object.entries(strategyCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([strategy, count]) => {
                    const pct = agentsCount > 0 ? (count / agentsCount) * 100 : 0;
                    const color = STRATEGY_COLORS[strategy] || '#64748b';
                    return (
                        <div
                            key={strategy}
                            style={{
                                flex: `${pct}`,
                                minWidth: pct > 5 ? 50 : 0,
                                background: `${color}20`,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${color}30`,
                            }}
                        >
                            <span style={{ fontSize: '0.55rem', color, fontWeight: 600 }}>
                                {strategy} ({count})
                            </span>
                        </div>
                    );
                })}
        </div>
    </div>
);

export default StrategyDistribution;
