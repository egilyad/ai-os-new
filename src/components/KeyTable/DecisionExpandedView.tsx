import type { RouterDecision, PipelineStep } from '../../kernel/instances';
import { formatCost } from '../../shared/utils/format-cost';

const STEP_ICONS: Record<PipelineStep['status'], string> = {
    passed: '\u2713',
    blocked: '\u2717',
    retried: '\u21BB',
    cached: '\u2B50',
    fallback: '\u2192',
};
const STEP_COLORS: Record<PipelineStep['status'], string> = {
    passed: '#22c55e',
    blocked: '#ef4444',
    retried: '#f59e0b',
    cached: '#a855f7',
    fallback: '#3b82f6',
};

interface Props {
    decision: RouterDecision;
    keyId: string;
}

const DecisionExpandedView: React.FC<Props> = ({ decision: d, keyId }) => (
    <div
        style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '0.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
        }}
    >
        <div
            style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '0.25rem 1rem',
            }}
        >
            <span>Request ID:</span>
            <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{d.requestId}</span>
            <span>Strategy:</span>
            <span>{d.strategy}</span>
            <span>Classification:</span>
            <span>
                {d.classification.complexity}
                {d.classification.isCode ? ', code' : ''}
                {d.classification.isMultimodal ? ', multimodal' : ''}
                {d.classification.isLong ? ', long' : ''}
            </span>
            <span>Prompt length:</span>
            <span>{d.promptLength} chars</span>
            {d.estimatedCost !== undefined && (
                <>
                    <span>Est. cost:</span>
                    <span>{formatCost(d.estimatedCost)}</span>
                </>
            )}
            <span>Weights:</span>
            <span>
                TTFT {d.weights.ttft.toFixed(2)} / TPS {d.weights.tps.toFixed(2)} / Rel{' '}
                {d.weights.reliability.toFixed(2)}
            </span>
            {d.selected && (
                <>
                    <span>Selected:</span>
                    <span style={{ color: 'var(--success)' }}>{d.selected}</span>
                </>
            )}
            {d.secondBest && (
                <>
                    <span>2nd best:</span>
                    <span style={{ color: 'var(--warning)' }}>{d.secondBest}</span>
                </>
            )}
        </div>

        {d.steps.length > 0 && (
            <div>
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginBottom: '0.4rem',
                        color: 'var(--text-primary)',
                    }}
                >
                    Pipeline
                </div>
                {d.steps.map((s, i) => (
                    <div
                        key={`${s.name}-${s.provider ?? s.detail ?? i}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0',
                            fontSize: '0.75rem',
                        }}
                    >
                        <span style={{ color: STEP_COLORS[s.status], fontWeight: 700 }}>
                            {STEP_ICONS[s.status]}
                        </span>
                        <span
                            style={{
                                background: `${STEP_COLORS[s.status]}15`,
                                padding: '0.1rem 0.4rem',
                                borderRadius: '3px',
                                fontSize: '0.65rem',
                                color: STEP_COLORS[s.status],
                                fontFamily: 'monospace',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {s.name}
                        </span>
                        {s.provider && <span style={{ color: '#60a5fa' }}>{s.provider}</span>}
                        {s.detail && <span style={{ color: 'var(--text-muted)' }}>{s.detail}</span>}
                        {s.durationMs !== undefined && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                {s.durationMs}ms
                            </span>
                        )}
                    </div>
                ))}
            </div>
        )}

        {d.scores.length > 0 && (
            <div>
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginBottom: '0.4rem',
                        color: 'var(--text-primary)',
                    }}
                >
                    Scores
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>
                                Provider
                            </th>
                            <th style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>Score</th>
                            <th style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>
                                Reliability
                            </th>
                            <th style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>TTFT</th>
                            <th style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>TPS</th>
                            <th style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {d.scores.map((s) => (
                            <tr
                                key={s.provider}
                                style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                    background:
                                        s.provider === d.selected
                                            ? 'rgba(34,197,94,0.05)'
                                            : undefined,
                                }}
                            >
                                <td
                                    style={{
                                        padding: '0.3rem 0.5rem',
                                        fontWeight: s.provider === d.selected ? 600 : 400,
                                        color: s.provider === d.selected ? '#22c55e' : '#60a5fa',
                                    }}
                                >
                                    {s.provider}
                                </td>
                                <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>
                                    {s.score.toFixed(3)}
                                </td>
                                <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>
                                    {s.components.stabilityBonus?.toFixed(2) ?? '-'}
                                </td>
                                <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>
                                    {s.components.latencyPenalty?.toFixed(2) ?? '-'}
                                </td>
                                <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>—</td>
                                <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>
                                    {s.components.costPenalty?.toFixed(2) ?? '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {d.skipped.length > 0 && (
            <div>
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginBottom: '0.4rem',
                        color: 'var(--text-primary)',
                    }}
                >
                    Skipped Keys ({d.skipped.length})
                </div>
                {d.skipped.map((s) => (
                    <div
                        key={`${s.provider}-${s.keyId}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.2rem 0',
                            fontSize: '0.7rem',
                            opacity: s.keyId === keyId ? 1 : 0.6,
                        }}
                    >
                        <span
                            style={{
                                background: '#f59e0b20',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '3px',
                                color: 'var(--warning)',
                                fontFamily: 'monospace',
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                            }}
                        >
                            {s.stage}
                        </span>
                        <span style={{ color: '#60a5fa' }}>{s.provider}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{s.keyLabel}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {s.reason}
                        </span>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default DecisionExpandedView;
