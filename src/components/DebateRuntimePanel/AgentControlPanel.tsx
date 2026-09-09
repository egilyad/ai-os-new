import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    Power,
    PowerOff,
    RotateCw,
    Send,
    Sliders,
    Thermometer,
    Brain,
    FileText,
    Loader2,
    Check,
} from 'lucide-react';
import {
    agentService,
    debateService,
    debateHumanService,
    rootLogger,
} from '../../kernel/instances';
const LOGGER = rootLogger.child('AgentControlPanel');
import { eventBus } from '../../kernel/instances';
import { EVENTS } from '../../kernel/events/event-names';
import type { DebateSessionSnapshot } from '../../kernel/instances';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { AgentAvatar } from '../AgentsPanel/AgentAvatar';

interface AgentControlPanelProps {
    session: DebateSessionSnapshot;
}

const OVERRIDE_PRESETS: Array<{
    id: string;
    label: string;
    description: string;
    config: Record<string, unknown>;
}> = [
    {
        id: 'strengthen_critic',
        label: 'Strengthen Critic',
        description: 'Lower temperature, require evidence',
        config: { temperature: 0.3, tools: ['critique', 'fact-check'] as unknown[] },
    },
    {
        id: 'lower_creativity',
        label: 'Lower Creativity',
        description: 'Temperature 0.2, focused reasoning',
        config: { temperature: 0.2 },
    },
    {
        id: 'require_sources',
        label: 'Require Sources',
        description: 'Push for citations and data',
        config: { temperature: 0.4, tools: ['web-search', 'citation'] as unknown[] },
    },
    {
        id: 'creative_brainstorm',
        label: 'Creative Brainstorm',
        description: 'High temperature, speculative',
        config: { temperature: 0.9 },
    },
    {
        id: 'balanced',
        label: 'Balanced',
        description: 'Reset to default parameters',
        config: { temperature: 0.7, tools: [] },
    },
];

export const AgentControlPanel: React.FC<AgentControlPanelProps> = ({ session }) => {
    const [injectText, setInjectText] = useState<Record<string, string>>({});
    const [injecting, setInjecting] = useState<Record<string, boolean>>({});
    const [presetApplied, setPresetApplied] = useState<string | null>(null);
    const [restarting, setRestarting] = useState<string | null>(null);
    const [localTemps, setLocalTemps] = useState<Record<string, number>>({});
    const [localMaxTokens, setLocalMaxTokens] = useState<Record<string, number>>({});
    const presetTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => {
        return () => {
            if (presetTimeoutRef.current) clearTimeout(presetTimeoutRef.current);
        };
    }, []);

    const agents = useMemo(() => {
        const topAgents = agentService.getAgents();
        const sessionAgentIds = new Set(session.agentStates.map((a) => a.agentId));
        return topAgents.filter((a) => sessionAgentIds.has(a.id));
    }, [session.agentStates]);

    const handleToggle = useCallback((agentId: string) => {
        agentService.toggleAgent(agentId);
    }, []);

    const handleRestart = useCallback(async (agentId: string) => {
        setRestarting(agentId);
        try {
            await agentService.restartAgent(agentId);
        } catch (e) {
            LOGGER.warn('AgentControlPanel', 'restart failed', { error: e });
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Agent restart failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
                type: 'error',
            });
        } finally {
            setRestarting(null);
        }
    }, []);

    const handleTempChange = useCallback((agentId: string, value: number) => {
        setLocalTemps((prev) => ({ ...prev, [agentId]: value }));
        agentService.updateAgent(agentId, { temperature: value });
    }, []);

    const handleMaxTokensChange = useCallback((agentId: string, value: number) => {
        setLocalMaxTokens((prev) => ({ ...prev, [agentId]: value }));
        agentService.updateAgent(agentId, { maxTokens: value });
    }, []);

    const handleInject = useCallback(
        async (agentId: string) => {
            const text = injectText[agentId]?.trim();
            if (!text) return;
            setInjecting((prev) => ({ ...prev, [agentId]: true }));
            try {
                const activeSession = debateService.getActiveDebateSession();
                if (!activeSession) {
                    LOGGER.warn('AgentControlPanel', 'no active debate session');
                    eventBus.emit(EVENTS.NOTIFICATION, {
                        message: 'Cannot inject message — no active debate session',
                        type: 'error',
                    });
                    return;
                }
                const agent = agents.find((a) => a.id === agentId);
                await debateHumanService.addArgument(
                    activeSession,
                    `User → ${agent?.name || agentId}`,
                    text,
                    1.0,
                    { position: 'neutral' },
                );
                setInjectText((prev) => ({ ...prev, [agentId]: '' }));
            } catch (e) {
                LOGGER.warn('AgentControlPanel', 'inject failed', { error: e });
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Inject failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
                    type: 'error',
                });
            } finally {
                setInjecting((prev) => ({ ...prev, [agentId]: false }));
            }
        },
        [injectText, agents],
    );

    const handlePreset = useCallback(
        (presetId: string) => {
            setPresetApplied(presetId);
            for (const agent of agents) {
                const preset = OVERRIDE_PRESETS.find((p) => p.id === presetId);
                if (preset) {
                    agentService.updateAgent(agent.id, preset.config);
                    if (preset.config.temperature !== undefined) {
                        setLocalTemps((prev) => ({
                            ...prev,
                            [agent.id]: preset.config.temperature as number,
                        }));
                    }
                }
            }
            presetTimeoutRef.current = setTimeout(() => setPresetApplied(null), 1500);
        },
        [agents],
    );

    if (agents.length === 0) {
        return (
            <div
                style={{
                    padding: '1rem',
                    color: 'var(--slate-500)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                }}
            >
                No agents found in this session.
            </div>
        );
    }

    return (
        <div>
            {/* Override Presets */}
            <div style={{ marginBottom: '1rem' }}>
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--slate-400)',
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Sliders size={14} /> Override Presets
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {OVERRIDE_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => handlePreset(preset.id)}
                            style={{
                                padding: '0.35rem 0.7rem',
                                borderRadius: 6,
                                border: '1px solid rgba(139,92,246,0.25)',
                                background:
                                    presetApplied === preset.id
                                        ? 'rgba(16,185,129,0.15)'
                                        : 'rgba(139,92,246,0.08)',
                                color: presetApplied === preset.id ? '#10b981' : '#a78bfa',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.2s',
                            }}
                            title={preset.description}
                        >
                            {presetApplied === preset.id ? (
                                <Check size={12} />
                            ) : (
                                <Brain size={12} />
                            )}
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Agent Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {agents.map((agent) => {
                    const isPaused = agent.status === 'paused';
                    const temp = localTemps[agent.id] ?? 0.7;
                    const maxTokens = localMaxTokens[agent.id] ?? 500;
                    const identity = resolveAgentIdentity(agent.id);
                    return (
                        <div
                            key={agent.id}
                            style={{
                                padding: '0.75rem',
                                borderRadius: 10,
                                background: isPaused
                                    ? 'rgba(100,116,139,0.06)'
                                    : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isPaused ? 'rgba(100,116,139,0.15)' : 'var(--border)'}`,
                                opacity: isPaused ? 0.6 : 1,
                            }}
                        >
                            {/* Agent header */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 8,
                                }}
                            >
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: isPaused
                                            ? '#64748b'
                                            : agent.status === 'busy'
                                              ? '#22c55e'
                                              : agent.status === 'thinking'
                                                ? '#3b82f6'
                                                : '#64748b',
                                        flexShrink: 0,
                                    }}
                                />
                                <AgentAvatar
                                    agentId={agent.id}
                                    name={identity.displayName}
                                    size={24}
                                    emoji={identity.avatar.emoji}
                                    color={identity.avatar.color}
                                    url={identity.avatar.url}
                                />
                                <span
                                    style={{
                                        fontSize: '0.82rem',
                                        fontWeight: 600,
                                        color: 'var(--slate-200)',
                                        flex: 1,
                                    }}
                                >
                                    {identity.displayName || agent.name}
                                </span>
                                <span
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        background: 'rgba(255,255,255,0.04)',
                                    }}
                                >
                                    {identity.baseRole || agent.role}
                                </span>
                                <button
                                    onClick={() => handleToggle(agent.id)}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: 6,
                                        border: `1px solid ${isPaused ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.3)'}`,
                                        background: isPaused
                                            ? 'rgba(34,197,94,0.1)'
                                            : 'rgba(100,116,139,0.1)',
                                        color: isPaused ? '#22c55e' : '#64748b',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {isPaused ? <Power size={12} /> : <PowerOff size={12} />}
                                    {isPaused ? 'Enable' : 'Disable'}
                                </button>
                                <button
                                    onClick={() => handleRestart(agent.id)}
                                    disabled={restarting === agent.id}
                                    style={{
                                        padding: '4px',
                                        borderRadius: 6,
                                        border: '1px solid rgba(100,116,139,0.2)',
                                        background: 'transparent',
                                        color: 'var(--slate-500)',
                                        cursor: restarting === agent.id ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: restarting === agent.id ? 0.5 : 1,
                                    }}
                                >
                                    {restarting === agent.id ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <RotateCw size={12} />
                                    )}
                                </button>
                            </div>

                            {/* Controls */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.75rem',
                                    marginBottom: 8,
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.65rem',
                                            color: 'var(--slate-500)',
                                            marginBottom: 2,
                                        }}
                                    >
                                        <span>
                                            <Thermometer size={10} /> Temperature
                                        </span>
                                        <span style={{ fontWeight: 600, color: 'var(--slate-200)' }}>
                                            {temp.toFixed(1)}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        value={temp}
                                        onChange={(e) =>
                                            handleTempChange(agent.id, parseFloat(e.target.value))
                                        }
                                        style={{ width: '100%', height: 4, cursor: 'pointer' }}
                                    />
                                </div>
                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.65rem',
                                            color: 'var(--slate-500)',
                                            marginBottom: 2,
                                        }}
                                    >
                                        <span>
                                            <FileText size={10} /> Max Tokens
                                        </span>
                                        <span style={{ fontWeight: 600, color: 'var(--slate-200)' }}>
                                            {maxTokens}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={100}
                                        max={2000}
                                        step={100}
                                        value={maxTokens}
                                        onChange={(e) =>
                                            handleMaxTokensChange(
                                                agent.id,
                                                parseInt(e.target.value),
                                            )
                                        }
                                        style={{ width: '100%', height: 4, cursor: 'pointer' }}
                                    />
                                </div>
                            </div>

                            {/* Inject message */}
                            <div style={{ display: 'flex', gap: 4 }}>
                                <input
                                    value={injectText[agent.id] ?? ''}
                                    onChange={(e) =>
                                        setInjectText((prev) => ({
                                            ...prev,
                                            [agent.id]: e.target.value,
                                        }))
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' &&
                                            (injectText[agent.id] ?? '').trim() &&
                                            !injecting[agent.id]
                                        )
                                            handleInject(agent.id);
                                    }}
                                    placeholder={`Message to ${agent.name}...`}
                                    style={{
                                        flex: 1,
                                        padding: '0.3rem 0.5rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(100,116,139,0.2)',
                                        background: 'rgba(15,23,42,0.4)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.75rem',
                                        outline: 'none',
                                    }}
                                />
                                <button
                                    onClick={() => handleInject(agent.id)}
                                    disabled={!injectText[agent.id]?.trim() || injecting[agent.id]}
                                    style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(59,130,246,0.3)',
                                        background:
                                            injectText[agent.id]?.trim() && !injecting[agent.id]
                                                ? 'rgba(59,130,246,0.15)'
                                                : 'rgba(100,116,139,0.1)',
                                        color:
                                            injectText[agent.id]?.trim() && !injecting[agent.id]
                                                ? '#60a5fa'
                                                : '#64748b',
                                        cursor:
                                            injectText[agent.id]?.trim() && !injecting[agent.id]
                                                ? 'pointer'
                                                : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {injecting[agent.id] ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <Send size={12} />
                                    )}
                                    Send
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
