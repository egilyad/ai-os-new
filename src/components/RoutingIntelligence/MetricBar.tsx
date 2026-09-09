import { flexCenterGap2, flexColGap1 } from '../../styles/common';

interface Props {
    label: string;
    control: number;
    experiment: number;
    higherIsBetter: boolean;
    format?: (v: number) => string;
}

function MetricBar({ label, control, experiment, higherIsBetter, format }: Props) {
    const f = format || ((v: number) => v.toFixed(2));
    const improvement = control > 0 ? ((experiment - control) / control) * 100 : 0;
    const win = higherIsBetter ? improvement > 0 : improvement < 0;
    return (
        <div style={flexColGap1}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--slate-400)',
                    fontWeight: 600,
                }}
            >
                <span>{label}</span>
                <span
                    style={{ color: win ? '#10b981' : improvement === 0 ? '#94a3b8' : '#ef4444' }}
                >
                    {improvement > 0 ? '+' : ''}
                    {improvement.toFixed(1)}%
                </span>
            </div>
            <div style={flexCenterGap2}>
                <div
                    style={{
                        flex: 1,
                        height: 24,
                        borderRadius: 6,
                        background: 'rgba(59,130,246,0.15)',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            width: `${Math.min(100, (control / Math.max(control, experiment)) * 100)}%`,
                            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                            borderRadius: 6,
                            transition: 'width 0.3s',
                        }}
                    />
                </div>
                <span
                    style={{
                        fontSize: '0.72rem',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        width: 70,
                        textAlign: 'right',
                    }}
                >
                    C: {f(control)}
                </span>
            </div>
            <div style={flexCenterGap2}>
                <div
                    style={{
                        flex: 1,
                        height: 24,
                        borderRadius: 6,
                        background: 'rgba(139,92,246,0.15)',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            width: `${Math.min(100, (experiment / Math.max(control, experiment)) * 100)}%`,
                            background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                            borderRadius: 6,
                            transition: 'width 0.3s',
                        }}
                    />
                </div>
                <span
                    style={{
                        fontSize: '0.72rem',
                        color: 'var(--purple)',
                        fontWeight: 700,
                        width: 70,
                        textAlign: 'right',
                    }}
                >
                    E: {f(experiment)}
                </span>
            </div>
        </div>
    );
}

export default MetricBar;
