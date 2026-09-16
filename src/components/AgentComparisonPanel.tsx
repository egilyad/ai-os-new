import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Search, Users, Activity, Zap, Clock, AlertCircle, Loader2 } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { AgentComparison } from './AgentsPanel/AgentComparison';
import { resolveAgentIdentity } from '../kernel/services/agent-identity';
import { AgentAvatar } from './AgentsPanel/AgentAvatar';

interface AgentEntry {
    id: string;
    name: string;
    role: string;
    status: string;
    model: string;
    providerId: string;
    temperature: number;
    tools: string[];
    systemPrompt: string;
    stats: {
        calls: number;
        tokens: number;
        latency: number;
        errors?: number;
        avgTokensPerCall?: number;
        lastActive?: number;
    };
    elo?: number;
}

const AgentComparisonPanelContent: React.FC = () => {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [agents, setAgents] = useState<AgentEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const m = await import('../kernel/instances');
                const agentList = m.agentService.getAgents();
                const leaderboard = m.eloService.getLeaderboard(100);
                const eloMap = new Map(leaderboard.map((e) => [e.agentId, e.elo]));
                const merged: AgentEntry[] = agentList.map((a) => {
                    const identity = resolveAgentIdentity(a.id);
                    return {
                        id: a.id,
                        name: identity.displayName || a.name,
                        role: a.role || 'General',
                        status: a.status || 'ready',
                        model: '—',
                        providerId: '—',
                        temperature: 0.5,
                        tools: [],
                        systemPrompt: '',
                        stats: {
                            calls: a.stats.calls || 0,
                            tokens: a.stats.tokens || 0,
                            latency: a.stats.latency || 0,
                            errors: a.stats.errors || 0,
                            avgTokensPerCall: a.stats.avgTokensPerCall || 0,
                            lastActive: a.stats.lastActive || Date.now(),
                        },
                        elo: eloMap.get(a.id) || 1000,
                    };
                });
                if (!cancelled) setAgents(merged);
            } catch {
                if (!cancelled) setAgents([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const filtered = useMemo(
        () =>
            agents.filter(
                (a) =>
                    a.name.toLowerCase().includes(search.toLowerCase()) ||
                    a.role.toLowerCase().includes(search.toLowerCase()),
            ),
        [agents, search],
    );

    const toggle = (id: string) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : prev.length >= 2
                  ? [prev[1]!, id]
                  : [...prev, id],
        );
    };

    const selectedAgents = selected
        .map((id) => agents.find((a) => a.id === id))
        .filter(Boolean) as AgentEntry[];

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 200,
                    gap: 8,
                    color: 'var(--slate-400)',
                }}
            >
                <Loader2 size={20} className="animate-spin" />
                Loading agents...
            </div>
        );
    }

    return (
        <div
            style={{
                padding: 16,
                height: '100%',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
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
                    <BarChart3 size={20} color="#a855f7" /> Agent Comparison Tool
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)' }}>
                    Select up to 2 agents to compare side by side
                </p>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    background: 'var(--slate-900)',
                    borderRadius: 8,
                    padding: '8px 12px',
                }}
            >
                <Search size={16} color="#64748b" />
                <input
                    placeholder="Search agents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        color: 'var(--slate-200)',
                        fontSize: 13,
                        outline: 'none',
                    }}
                />
            </div>

            {selected.length === 2 && selectedAgents.length === 2 && (
                <AgentComparison agents={selectedAgents} onClose={() => setSelected([])} />
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 12,
                }}
            >
                {filtered.map((agent) => {
                    const isSelected = selected.includes(agent.id);
                    const identity = resolveAgentIdentity(agent.id);
                    return (
                        <div
                            key={agent.id}
                            onClick={() => toggle(agent.id)}
                            style={{
                                background: 'var(--slate-800)',
                                borderRadius: 12,
                                border: isSelected
                                    ? '2px solid #a855f7'
                                    : '1px solid rgba(255,255,255,0.06)',
                                padding: 14,
                                cursor: 'pointer',
                                transition: 'border-color 0.15s',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 10,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AgentAvatar
                                        agentId={agent.id}
                                        name={agent.name}
                                        size={18}
                                        emoji={identity.avatar.emoji}
                                        color={identity.avatar.color}
                                        url={identity.avatar.url}
                                    />
                                    <span
                                        style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-200)' }}
                                    >
                                        {agent.name}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        padding: '2px 8px',
                                        borderRadius: 4,
                                        fontSize: 11,
                                        background:
                                            agent.status === 'ready'
                                                ? 'rgba(16,185,129,0.15)'
                                                : 'rgba(245,158,11,0.15)',
                                        color: agent.status === 'ready' ? '#10b981' : '#f59e0b',
                                    }}
                                >
                                    {agent.status}
                                </div>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 10 }}>
                                {agent.role}
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 6,
                                    fontSize: 12,
                                    color: 'var(--slate-400)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Zap size={12} /> {agent.model}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Users size={12} /> {agent.providerId}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Activity size={12} /> {agent.stats.calls.toLocaleString()}{' '}
                                    calls
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={12} /> {agent.stats.latency}ms
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <BarChart3 size={12} /> {(agent.stats.tokens / 1000).toFixed(0)}
                                    K tokens
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle
                                        size={12}
                                        color={
                                            agent.stats.errors && agent.stats.errors > 20
                                                ? '#ef4444'
                                                : '#10b981'
                                        }
                                    />{' '}
                                    {agent.stats.errors || 0} errors
                                </div>
                                {agent.elo != null && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            gridColumn: '1 / -1',
                                        }}
                                    >
                                        <BarChart3 size={12} color="#a855f7" /> ELO: {agent.elo}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AgentComparisonPanel: React.FC = () => (
    <PanelLoader name="Agent Comparison">
        <AgentComparisonPanelContent />
    </PanelLoader>
);

export default AgentComparisonPanel;
