import React, { useState } from 'react';
import { Network, Wifi, WifiOff, Clock, Activity, Power, PowerOff } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { agentProtocolService } from '../kernel/instances';

const CAPABILITY_COLORS: Record<string, string> = {
    chat: '#3b82f6',
    memory: '#10b981',
    tools: '#f59e0b',
    delegation: '#a855f7',
    reasoning: '#ef4444',
};

const AgentProtocolPanelContent: React.FC = () => {
    const [agents, setAgents] = useState(() => agentProtocolService.getRegisteredAgents());
    const [messages, setMessages] = useState(() => agentProtocolService.getMessageHistory());
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [agentId, setAgentId] = useState('');
    const [agentName, setAgentName] = useState('');

    const refresh = () => {
        setAgents([...agentProtocolService.getRegisteredAgents()]);
        setMessages([...agentProtocolService.getMessageHistory()]);
    };

    const handleRegister = () => {
        if (!agentId.trim() || !agentName.trim()) return;
        agentProtocolService.registerAgent(agentId, agentName);
        setShowForm(false);
        setAgentId('');
        setAgentName('');
        refresh();
    };

    const selectedCapabilities = selectedAgent
        ? agentProtocolService.getCapabilities(selectedAgent)
        : [];

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: '0 0 4px',
                            fontSize: 18,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Network size={20} color="#8b5cf6" /> Agent-to-Agent Protocol
                    </h2>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)' }}>
                        Inter-agent communication layer — messaging, capabilities, and discovery
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        background: showForm ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.15)',
                        color: showForm ? '#ef4444' : '#8b5cf6',
                    }}
                >
                    {showForm ? <PowerOff size={16} /> : <Power size={16} />}
                    {showForm ? 'Cancel' : 'Register Agent'}
                </button>
            </div>

            {showForm && (
                <div
                    style={{
                        background: 'var(--slate-800)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <input
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            placeholder="Agent ID..."
                            style={{
                                flex: 1,
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                        <input
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            placeholder="Display Name..."
                            style={{
                                flex: 1,
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                    </div>
                    <button
                        onClick={handleRegister}
                        disabled={!agentId.trim() || !agentName.trim()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            background: 'rgba(139,92,246,0.2)',
                            color: 'var(--purple)',
                            fontSize: 13,
                            fontWeight: 600,
                            opacity: agentId.trim() && agentName.trim() ? 1 : 0.5,
                        }}
                    >
                        <Power size={14} /> Register
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Registered Agents ({agents.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {agents.map((a) => (
                            <div
                                key={a.agentId}
                                onClick={() =>
                                    setSelectedAgent(selectedAgent === a.agentId ? null : a.agentId)
                                }
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    background: selectedAgent === a.agentId ? '#1e293b' : '#0f172a',
                                    border:
                                        selectedAgent === a.agentId
                                            ? '1px solid rgba(139,92,246,0.3)'
                                            : '1px solid rgba(255,255,255,0.04)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 4,
                                    }}
                                >
                                    {a.status === 'online' ? (
                                        <Wifi size={14} color="#10b981" />
                                    ) : a.status === 'busy' ? (
                                        <Activity size={14} color="#f59e0b" />
                                    ) : (
                                        <WifiOff size={14} color="#64748b" />
                                    )}
                                    <span
                                        style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-200)' }}
                                    >
                                        {a.agentName}
                                    </span>
                                    <span
                                        style={{
                                            marginLeft: 'auto',
                                            fontSize: 10,
                                            color: 'var(--slate-500)',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {a.status}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--slate-600)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <span>{a.agentId}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={10} />{' '}
                                        {Math.round((Date.now() - a.lastSeen) / 60000)}m ago
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedAgent && selectedCapabilities.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <h4
                                style={{
                                    margin: '0 0 6px',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--slate-400)',
                                }}
                            >
                                Capabilities
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {selectedCapabilities.map((c) => (
                                    <div
                                        key={c.name}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '6px 10px',
                                            borderRadius: 6,
                                            fontSize: 12,
                                            background: 'var(--slate-900)',
                                            color: c.enabled ? '#e2e8f0' : '#475569',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                background: CAPABILITY_COLORS[c.name] || '#64748b',
                                            }}
                                        />
                                        <span
                                            style={{ fontWeight: 600, textTransform: 'capitalize' }}
                                        >
                                            {c.name}
                                        </span>
                                        <span
                                            style={{
                                                marginLeft: 'auto',
                                                fontSize: 10,
                                                color: 'var(--slate-500)',
                                            }}
                                        >
                                            v{c.version}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Message Log ({messages.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    background: 'var(--slate-900)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    borderLeft: `3px solid ${CAPABILITY_COLORS[msg.capability] || '#64748b'}`,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: 2,
                                    }}
                                >
                                    <span style={{ color: 'var(--slate-400)', fontWeight: 600 }}>
                                        {msg.sourceAgentId}
                                    </span>
                                    <span style={{ color: 'var(--slate-500)' }}>{msg.type}</span>
                                </div>
                                <div style={{ color: 'var(--slate-500)' }}>
                                    {msg.targetAgentId && <span>→ {msg.targetAgentId} · </span>}
                                    {msg.capability}
                                </div>
                                <div style={{ marginTop: 2, color: 'var(--slate-600)' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString()} · trace:{' '}
                                    {msg.traceId}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AgentProtocolPanel: React.FC = () => (
    <PanelLoader name="Agent Protocol">
        <AgentProtocolPanelContent />
    </PanelLoader>
);

export default AgentProtocolPanel;
