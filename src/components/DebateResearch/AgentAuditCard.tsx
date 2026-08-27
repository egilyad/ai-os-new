import type { AuditedAgentPrompt } from '../../kernel/contracts/prompt-audit';
import { GROUP_COLORS } from './prompt-audit-constants';

interface Props {
    agent: AuditedAgentPrompt;
}

const AgentAuditCard: React.FC<Props> = ({ agent }) => {
    const tempColor =
        agent.temperature < 0.2
            ? '#3b82f6'
            : agent.temperature < 0.4
              ? '#10b981'
              : agent.temperature < 0.6
                ? '#f59e0b'
                : '#ef4444';

    return (
        <div
            style={{
                marginBottom: '0.4rem',
                padding: '0.6rem 0.8rem',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.03)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: '0.3rem',
                }}
            >
                <div
                    style={{
                        width: 3,
                        height: 14,
                        borderRadius: 2,
                        background: GROUP_COLORS[agent.group] || '#64748b',
                    }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-200)' }}>
                    {agent.name}
                </span>
                <span
                    style={{
                        fontSize: '0.62rem',
                        color: 'var(--slate-500)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.04)',
                    }}
                >
                    {agent.group}
                </span>
                <span style={{ fontSize: '0.62rem', color: tempColor, fontWeight: 600 }}>
                    T:{agent.temperature}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>{agent.wordCount}w</span>
                {agent.hasTools && (
                    <span
                        style={{
                            fontSize: '0.6rem',
                            padding: '0.1rem 0.3rem',
                            borderRadius: 3,
                            background: 'rgba(16,185,129,0.12)',
                            color: 'var(--success)',
                        }}
                    >
                        {agent.tools.length}t
                    </span>
                )}
                {agent.hasKeyTerms && (
                    <span
                        style={{
                            fontSize: '0.6rem',
                            padding: '0.1rem 0.3rem',
                            borderRadius: 3,
                            background: 'rgba(245,158,11,0.12)',
                            color: 'var(--warning)',
                        }}
                    >
                        C
                    </span>
                )}
            </div>
            <p
                style={{
                    margin: 0,
                    fontSize: '0.72rem',
                    color: 'var(--slate-400)',
                    lineHeight: 1.4,
                }}
            >
                {agent.prompt}
            </p>
        </div>
    );
};

export default AgentAuditCard;
