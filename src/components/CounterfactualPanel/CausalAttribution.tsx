import { BarChart3 } from 'lucide-react';
import type { DecisionExplanation } from '../../kernel/contracts/counterfactual-explanation';

interface Props {
    explanation: DecisionExplanation;
}

const ComponentDiff: React.FC<{ component: string; provider: string; delta: number }> = ({
    component,
    provider,
    delta,
}) => {
    const color = delta > 0.01 ? '#22c55e' : delta < -0.01 ? '#ef4444' : '#64748b';
    return (
        <div
            key={`${provider}-${component}`}
            style={{
                fontSize: '0.7rem',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1px 0',
                fontFamily: 'monospace',
            }}
        >
            <span style={{ color: 'var(--slate-400)' }}>{String(component)}</span>
            <span style={{ color }}>
                {delta > 0 ? '+' : ''}
                {delta.toFixed(3)}
            </span>
        </div>
    );
};

const CausalAttribution: React.FC<Props> = ({ explanation }) => {
    if (!explanation.switched) return null;
    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 16,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BarChart3 size={14} color="#f59e0b" />
                <span
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--warning)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    }}
                >
                    Why it changed — Causal Attribution
                </span>
            </div>

            {explanation.decisiveComponents.length > 0 && (
                <>
                    <div
                        style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: 'var(--slate-400)',
                            marginBottom: 6,
                        }}
                    >
                        Primary trigger
                    </div>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: 'var(--warning)',
                            marginBottom: 8,
                        }}
                    >
                        {String(explanation.decisiveComponents[0]!.component)} (
                        {explanation.decisiveComponents[0]!.provider}):{' '}
                        {explanation.decisiveComponents[0]!.contribution > 0 ? '+' : ''}
                        {explanation.decisiveComponents[0]!.contribution.toFixed(3)}
                    </div>
                </>
            )}

            {explanation.decisiveComponents.length > 1 && (
                <>
                    <div
                        style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: 'var(--slate-400)',
                            marginBottom: 6,
                        }}
                    >
                        Secondary
                    </div>
                    {explanation.decisiveComponents.slice(1).map((dc) => (
                        <div
                            key={dc.component}
                            style={{
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                color: 'var(--slate-300)',
                                marginBottom: 2,
                            }}
                        >
                            {String(dc.component)} ({dc.provider}): {dc.contribution > 0 ? '+' : ''}
                            {dc.contribution.toFixed(3)}
                        </div>
                    ))}
                </>
            )}

            {explanation.providerExplanations
                .filter((pe) => pe.componentDiffs.length > 0)
                .map((pe) => (
                    <div key={pe.provider} style={{ marginTop: 12 }}>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: 'var(--slate-200)',
                                marginBottom: 4,
                            }}
                        >
                            {pe.provider}
                        </div>
                        {pe.componentDiffs
                            .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                            .slice(0, 5)
                            .map((cd) => (
                                <ComponentDiff
                                    key={String(cd.component)}
                                    component={String(cd.component)}
                                    provider={pe.provider}
                                    delta={cd.delta}
                                />
                            ))}
                    </div>
                ))}

            <div
                style={{
                    marginTop: 12,
                    paddingTop: 8,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div
                    style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: 'var(--slate-400)',
                        marginBottom: 4,
                    }}
                >
                    Decision margin shift
                </div>
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        color:
                            explanation.marginShift > 0
                                ? '#22c55e'
                                : explanation.marginShift < 0
                                  ? '#ef4444'
                                  : '#64748b',
                    }}
                >
                    {explanation.marginShift > 0 ? '+' : ''}
                    {explanation.marginShift.toFixed(3)}
                    <span style={{ color: 'var(--slate-400)', marginLeft: 8, fontSize: '0.65rem' }}>
                        ({explanation.originalWinner} → {explanation.simulatedWinner})
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CausalAttribution;
