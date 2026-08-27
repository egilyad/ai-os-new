import { useNavigate } from 'react-router-dom';
import { Target, Lightbulb, CheckCircle } from 'lucide-react';
import type { StrategyComparison } from '../../kernel/contracts/routing-experiments';

interface Props {
    comparison: StrategyComparison[];
}

const StrategyComparisonCard: React.FC<Props> = ({ comparison }) => {
    const navigate = useNavigate();
    if (comparison.length <= 1) return null;

    return (
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
                    marginBottom: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                }}
            >
                <Target size={12} /> Strategy Comparison
                <button
                    onClick={() =>
                        navigate(
                            `/hypothesis-gen?source=${encodeURIComponent('routing-experiments')}&title=${encodeURIComponent('Routing experiment: ' + comparison.length + ' strategies compared')}`,
                        )
                    }
                    style={{
                        marginLeft: 'auto',
                        background: 'var(--purple-tint)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        color: '#a855f7',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                    }}
                >
                    <Lightbulb size={10} /> Hypothesis
                </button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
                {comparison.map((c) => {
                    const bestLatency = Math.min(...comparison.map((x) => x.avgLatency));
                    const bestCost = Math.min(...comparison.map((x) => x.avgCost));
                    const bestError = Math.min(...comparison.map((x) => x.avgErrorRate));
                    const bestUniqueness = Math.max(...comparison.map((x) => x.avgUniqueness));
                    const isBestLatency = c.avgLatency === bestLatency;
                    const isBestCost = c.avgCost === bestCost;
                    const isBestError = c.avgErrorRate === bestError;
                    const isBestUnique = c.avgUniqueness === bestUniqueness;
                    const score =
                        (isBestLatency ? 1 : 0) +
                        (isBestCost ? 1 : 0) +
                        (isBestError ? 1 : 0) +
                        (isBestUnique ? 1 : 0);
                    return (
                        <div
                            key={c.strategy}
                            style={{
                                flex: 1,
                                padding: '0.5rem 0.65rem',
                                borderRadius: 8,
                                background:
                                    score >= 2 ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.2)',
                                border: `1px solid ${score >= 2 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)'}`,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    marginBottom: 4,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        color: score >= 2 ? '#34d399' : '#94a3b8',
                                    }}
                                >
                                    {c.strategy}
                                </span>
                                {score >= 2 && <CheckCircle size={10} color="#10b981" />}
                            </div>
                            <div
                                style={{
                                    fontSize: '0.62rem',
                                    color: isBestLatency ? '#10b981' : '#64748b',
                                }}
                            >
                                Latency: {c.avgLatency}ms{isBestLatency ? ' ✓' : ''}
                            </div>
                            <div
                                style={{
                                    fontSize: '0.62rem',
                                    color: isBestCost ? '#10b981' : '#64748b',
                                }}
                            >
                                Cost: ${c.avgCost.toFixed(3)}
                                {isBestCost ? ' ✓' : ''}
                            </div>
                            <div
                                style={{
                                    fontSize: '0.62rem',
                                    color: isBestError ? '#10b981' : '#64748b',
                                }}
                            >
                                Error: {(c.avgErrorRate * 100).toFixed(0)}%{isBestError ? ' ✓' : ''}
                            </div>
                            <div
                                style={{
                                    fontSize: '0.62rem',
                                    color: isBestUnique ? '#10b981' : '#64748b',
                                }}
                            >
                                Unique: {c.avgUniqueness}%{isBestUnique ? ' ✓' : ''}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StrategyComparisonCard;
