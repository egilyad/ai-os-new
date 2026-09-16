import { PILL } from './counterfactual-constants';
import type { CounterfactualResult } from '../../kernel/contracts/counterfactual';

interface Props {
    result: CounterfactualResult;
}

const ScoreComparison: React.FC<Props> = ({ result }) => (
    <div
        style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 16,
        }}
    >
        <div
            style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--slate-400)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
            }}
        >
            Score Comparison
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.scoreDiffs.map((d) => {
                const deltaStr = `${d.delta > 0 ? '+' : ''}${d.delta.toFixed(3)}`;
                const deltaColor =
                    d.delta > 0.05 ? '#22c55e' : d.delta < -0.05 ? '#ef4444' : '#64748b';
                const isSelOrig = d.provider === result.original.selected;
                const isSelSim = d.provider === result.simulated.selected;
                return (
                    <div
                        key={d.provider}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '0.75rem',
                        }}
                    >
                        <span style={{ fontWeight: 700, color: 'var(--slate-200)', minWidth: 80 }}>
                            {d.provider}
                        </span>
                        <div
                            style={{
                                flex: 1,
                                height: 4,
                                background: 'rgba(255,255,255,0.06)',
                                borderRadius: 2,
                                display: 'flex',
                            }}
                        >
                            <div
                                style={{
                                    width: `${Math.min(d.originalScore * 100, 100)}%`,
                                    height: '100%',
                                    background: 'var(--accent)',
                                    borderRadius: 2,
                                    opacity: 0.6,
                                }}
                            />
                            <div
                                style={{
                                    width: `${Math.min(d.simulatedScore * 100, 100)}%`,
                                    height: '100%',
                                    background: deltaColor,
                                    borderRadius: 2,
                                    marginLeft: 2,
                                    opacity: 0.8,
                                }}
                            />
                        </div>
                        <span
                            style={{
                                color: deltaColor,
                                minWidth: 60,
                                textAlign: 'right',
                                fontFamily: 'monospace',
                            }}
                        >
                            {deltaStr}
                        </span>
                        {isSelOrig && (
                            <span
                                style={{
                                    ...PILL,
                                    background: 'var(--accent-tint)',
                                    color: '#60a5fa',
                                }}
                            >
                                ORIG
                            </span>
                        )}
                        {isSelSim && (
                            <span
                                style={{
                                    ...PILL,
                                    background: 'var(--warning-tint)',
                                    color: 'var(--warning)',
                                }}
                            >
                                SIM
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);

export default ScoreComparison;
