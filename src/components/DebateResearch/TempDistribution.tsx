import { Thermometer } from 'lucide-react';
import type { AuditedAgentPrompt } from '../../kernel/contracts/prompt-audit';

interface Props {
    agents: AuditedAgentPrompt[];
}

const TempDistribution: React.FC<Props> = ({ agents }) => {
    const buckets = [
        { label: '0-0.2', min: 0, max: 0.2, agents: [] as string[], color: 'var(--accent)' },
        { label: '0.2-0.4', min: 0.2, max: 0.4, agents: [] as string[], color: 'var(--success)' },
        { label: '0.4-0.6', min: 0.4, max: 0.6, agents: [] as string[], color: 'var(--warning)' },
        { label: '0.6+', min: 0.6, max: 1, agents: [] as string[], color: 'var(--error)' },
    ];
    for (const a of agents) {
        const b =
            buckets.find((b) => a.temperature >= b.min && a.temperature < b.max) ||
            buckets[buckets.length - 1]!;
        b.agents.push(a.name);
    }

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
                    marginBottom: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                }}
            >
                <Thermometer size={12} /> Temperature Distribution
            </div>
            <div style={{ display: 'flex', gap: 4, height: 24 }}>
                {buckets.map((b) => {
                    const pct = agents.length > 0 ? (b.agents.length / agents.length) * 100 : 0;
                    return (
                        <div
                            key={b.label}
                            style={{
                                flex: `${pct}`,
                                minWidth: pct > 0 ? 30 : 0,
                                background: `${b.color}25`,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${b.color}30`,
                            }}
                            title={b.agents.join(', ')}
                        >
                            <span style={{ fontSize: '0.6rem', color: b.color, fontWeight: 700 }}>
                                {b.label} ({b.agents.length})
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TempDistribution;
