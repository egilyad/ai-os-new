import type { GovScenarioResult } from '../../kernel/contracts/gov-stress-test';
import { CATEGORY_COLORS, iconForResult } from './gov-stress-constants';

interface Props {
    result: GovScenarioResult;
}

const ScenarioResultCard: React.FC<Props> = ({ result }) => {
    const { scenario, result: outcome, violatedRules, suggestedMitigation } = result;

    return (
        <div
            style={{
                marginBottom: '0.4rem',
                padding: '0.55rem 0.75rem',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.2)',
                border: `1px solid ${outcome === 'block' ? 'rgba(239,68,68,0.12)' : outcome === 'warn' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.08)'}`,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 3,
                }}
            >
                {iconForResult(outcome)}
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-200)' }}>
                    {scenario.name}
                </span>
                <span
                    style={{
                        fontSize: '0.62rem',
                        color: CATEGORY_COLORS[scenario.category] || '#64748b',
                        padding: '0.1rem 0.35rem',
                        borderRadius: 3,
                        background: `${CATEGORY_COLORS[scenario.category] || '#64748b'}15`,
                    }}
                >
                    {scenario.category}
                </span>
            </div>
            <p
                style={{
                    margin: 0,
                    fontSize: '0.7rem',
                    color: 'var(--slate-400)',
                    lineHeight: 1.4,
                }}
            >
                {scenario.description}
            </p>
            {violatedRules.length > 0 && (
                <div
                    style={{
                        marginTop: 4,
                        display: 'flex',
                        gap: 3,
                        flexWrap: 'wrap',
                    }}
                >
                    {violatedRules.map((rule, j) => (
                        <span
                            key={j}
                            style={{
                                fontSize: '0.62rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: 3,
                                background: 'rgba(239,68,68,0.06)',
                                color: 'var(--error)',
                            }}
                        >
                            {rule}
                        </span>
                    ))}
                </div>
            )}
            <div
                style={{
                    marginTop: 4,
                    fontSize: '0.65rem',
                    color: 'var(--slate-500)',
                    fontStyle: 'italic',
                }}
            >
                → {suggestedMitigation}
            </div>
        </div>
    );
};

export default ScenarioResultCard;
