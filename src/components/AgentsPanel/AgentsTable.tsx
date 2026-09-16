import React from 'react';
import { Pause, Play, Copy, Trash2, Settings2 } from 'lucide-react';
import { AgentAvatar } from './AgentAvatar';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import type { AgentWithStats } from './AgentsPanelContext';

interface AgentsTableProps {
    agents: AgentWithStats[];
    agentStats: Record<string, { calls: number; tokens: number; latency: number; errors?: number }>;
    onSelect: (id: string) => void;
    onToggleStatus: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDeleteRequest: (id: string, name: string) => void;
    t: (key: string) => string;
}

export const AgentsTable: React.FC<AgentsTableProps> = ({ agents, agentStats, onSelect, onToggleStatus, onDuplicate, onDeleteRequest, t }) => {
    if (agents.length === 0) return null;

    return (
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', background: 'rgba(15,23,42,0.4)' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left', color: 'var(--slate-400, #94a3b8)', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 14px', fontWeight: 600, width: '32%' }}>Agent</th>
                            <th style={{ padding: '10px 14px', fontWeight: 600 }}>Role</th>
                            <th style={{ padding: '10px 14px', fontWeight: 600 }}>Provider / Model</th>
                            <th style={{ padding: '10px 14px', fontWeight: 600, width: 90 }}>Status</th>
                            <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Calls</th>
                            <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Latency</th>
                            <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right', width: 160 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map(agent => {
                            const stats = agentStats[agent.id];
                            const identity = resolveAgentIdentity(agent.id);
                            const calls = stats?.calls ?? 0;
                            const latency = stats?.latency ?? 0;
                            const isActive = agent.status === 'active';
                            return (
                                <tr
                                    key={agent.id}
                                    onClick={() => onSelect(agent.id)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${agent.name} - ${agent.role} - ${agent.status}`}
                                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(agent.id); } }}
                                    style={{
                                        borderTop: '1px solid rgba(255,255,255,0.06)',
                                        cursor: 'pointer',
                                        transition: 'background 120ms',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <td style={{ padding: '10px 14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                            <AgentAvatar agentId={agent.id} name={agent.name} size={28} emoji={identity.avatar.emoji} color={identity.avatar.color} url={identity.avatar.url} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--slate-100)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 14px', color: 'var(--slate-200)', whiteSpace: 'nowrap' }}>{agent.role}</td>
                                    <td style={{ padding: '10px 14px', color: 'var(--slate-300)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                        {agent.providerId === 'Auto' ? 'Smart Router' : agent.providerId}
                                        {agent.model !== 'auto' ? ` · ${agent.model.split('/').pop()?.split(':').pop()}` : ''}
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
                                            background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.15)',
                                            color: isActive ? '#10b981' : '#94a3b8',
                                            border: `1px solid ${isActive ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)'}`
                                        }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#10b981' : '#64748b', display: 'inline-block' }} />
                                            {isActive ? 'Active' : agent.status === 'paused' ? 'Paused' : agent.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--slate-200)', fontVariantNumeric: 'tabular-nums' }}>{calls.toLocaleString()}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', color: latency < 500 ? '#10b981' : latency < 1000 ? '#f59e0b' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{latency ? `${latency}ms` : '—'}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => onSelect(agent.id)}
                                                title="Configure"
                                                aria-label={`Configure ${agent.name}`}
                                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-300)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <Settings2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => onToggleStatus(agent.id)}
                                                title={isActive ? t('agents.pause_agent_title') : t('agents.resume_agent_title')}
                                                aria-label={isActive ? `Pause ${agent.name}` : `Resume ${agent.name}`}
                                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(15,23,42,0.6)', color: isActive ? '#10b981' : '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                {isActive ? <Pause size={14} /> : <Play size={14} />}
                                            </button>
                                            <button
                                                onClick={() => onDuplicate(agent.id)}
                                                title="Duplicate"
                                                aria-label={`Duplicate ${agent.name}`}
                                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(100,116,139,0.2)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-300)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteRequest(agent.id, agent.name)}
                                                title="Delete"
                                                aria-label={`Delete ${agent.name}`}
                                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
