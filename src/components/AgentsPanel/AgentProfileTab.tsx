import { Copy, Pencil, Swords, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Agent } from './AgentsPanelContext';

interface AgentProfileTabProps {
    agent: Agent;
    agentStats: Record<
        string,
        {
            calls: number;
            tokens: number;
            latency: number;
            errors?: number;
            avgTokensPerCall?: number;
            lastActive?: number;
        }
    >;
    onDuplicateAgent: (agentId: string) => void;
    onResetAgentStats: (agentId: string) => void;
    onEdit: () => void;
    onClose: () => void;
}

const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: '0.45rem 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    fontSize: '0.82rem',
};

const labelStyle: React.CSSProperties = { color: 'var(--slate-500)', fontWeight: 600 };
const valueStyle: React.CSSProperties = {
    color: 'var(--slate-200)',
    textAlign: 'right',
    wordBreak: 'break-word',
};

const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '0.55rem 0.5rem',
    borderRadius: 10,
    border: '1px solid rgba(100,116,139,0.3)',
    background: 'rgba(15,23,42,0.5)',
    color: 'var(--slate-200)',
    fontWeight: 700,
    fontSize: '0.78rem',
    cursor: 'pointer',
    flex: 1,
};

// T3.2: read-only agent card — characteristics + binding + stats + quick actions
const AgentProfileTab: React.FC<AgentProfileTabProps> = ({
    agent,
    agentStats,
    onDuplicateAgent,
    onResetAgentStats,
    onEdit,
    onClose,
}) => {
    const navigate = useNavigate();
    const stats = agentStats[agent.id];
    const pinned = agent.providerId && agent.providerId !== 'Auto';
    const binding = pinned
        ? `${agent.providerId} / ${agent.model}${agent.keyId ? ` / ${agent.keyId.slice(0, 8)}…` : ' (pool)'}`
        : `Auto (rotation) / ${agent.model}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', marginBottom: 4 }}>
                    CHARACTERISTICS
                </div>
                <div>
                    <div style={rowStyle}><span style={labelStyle}>Role</span><span style={valueStyle}>{agent.role}</span></div>
                    <div style={rowStyle}><span style={labelStyle}>Status</span><span style={valueStyle}>{agent.status}</span></div>
                    <div style={rowStyle}><span style={labelStyle}>Temperature</span><span style={valueStyle}>{agent.temperature}</span></div>
                    <div style={rowStyle}><span style={labelStyle}>Tools</span><span style={valueStyle}>{agent.tools.length > 0 ? agent.tools.join(', ') : '—'}</span></div>
                    <div style={rowStyle}><span style={labelStyle}>Skills</span><span style={valueStyle}>{agent.skills.length > 0 ? agent.skills.join(', ') : '—'}</span></div>
                </div>
            </div>

            <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', marginBottom: 4 }}>
                    KEY / MODEL BINDING
                </div>
                <div style={rowStyle}><span style={labelStyle}>Binding</span><span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>{binding}</span></div>
            </div>

            <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', marginBottom: 4 }}>
                    DESCRIPTION
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
                    {agent.description}
                </p>
            </div>

            <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', marginBottom: 4 }}>
                    STATISTICS
                </div>
                {!stats || stats.calls === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--slate-500)' }}>No runs yet.</p>
                ) : (
                    <div>
                        <div style={rowStyle}><span style={labelStyle}>Calls</span><span style={valueStyle}>{stats.calls}</span></div>
                        <div style={rowStyle}><span style={labelStyle}>Tokens</span><span style={valueStyle}>{stats.tokens}</span></div>
                        <div style={rowStyle}><span style={labelStyle}>Latency</span><span style={valueStyle}>{stats.latency} ms</span></div>
                        {stats.errors !== undefined && (
                            <div style={rowStyle}><span style={labelStyle}>Errors</span><span style={valueStyle}>{stats.errors}</span></div>
                        )}
                        {stats.lastActive !== undefined && (
                            <div style={rowStyle}><span style={labelStyle}>Last active</span><span style={valueStyle}>{new Date(stats.lastActive).toLocaleString()}</span></div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                    style={btnStyle}
                    onClick={() => {
                        onClose();
                        navigate('/debate');
                    }}
                    aria-label="Open debates"
                >
                    <Swords size={14} /> To debate
                </button>
                <button style={btnStyle} onClick={onEdit} aria-label="Edit agent">
                    <Pencil size={14} /> Edit
                </button>
                <button style={btnStyle} onClick={() => onDuplicateAgent(agent.id)} aria-label="Duplicate agent">
                    <Copy size={14} /> Duplicate
                </button>
                <button style={btnStyle} onClick={() => onResetAgentStats(agent.id)} aria-label="Reset agent stats">
                    <RotateCcw size={14} /> Reset stats
                </button>
            </div>
        </div>
    );
};

export default AgentProfileTab;
