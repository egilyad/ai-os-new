import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Activity,
    Zap,
    AlertTriangle,
    RefreshCw,
    ArrowRightLeft,
    PlayCircle,
    Trash2,
    ChevronDown,
    ChevronUp,
    Pause,
    Play,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus, EVENTS } from '../../kernel/instances';
import { glassPanel } from '../../styles/common';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';

export interface ActivityEvent {
    id: string;
    type:
        | 'step_complete'
        | 'stream_end'
        | 'lifecycle'
        | 'spawn'
        | 'remove'
        | 'restart'
        | 'handoff'
        | 'error';
    agentId: string;
    agentName: string;
    message: string;
    detail?: string;
    timestamp: number;
    status?: string;
    duration?: number;
}

const MAX_EVENTS = 100;

const typeConfig: Record<
    ActivityEvent['type'],
    { icon: typeof Activity; color: string; bg: string }
> = {
    step_complete: { icon: Zap, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
    stream_end: { icon: Activity, color: 'var(--accent)', bg: 'rgba(59,130,246,0.1)' },
    lifecycle: { icon: RefreshCw, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
    spawn: { icon: PlayCircle, color: 'var(--purple)', bg: 'rgba(139,92,246,0.1)' },
    remove: { icon: Trash2, color: 'var(--error)', bg: 'rgba(239,68,68,0.1)' },
    restart: { icon: RefreshCw, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    handoff: { icon: ArrowRightLeft, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    error: { icon: AlertTriangle, color: 'var(--error)', bg: 'rgba(239,68,68,0.1)' },
};

const lifecycleColors: Record<string, string> = {
    ready: '#10b981',
    busy: '#f59e0b',
    paused: '#64748b',
    initializing: '#3b82f6',
    terminated: '#ef4444',
    error: '#ef4444',
    idle: '#8b5cf6',
};

const getAgentName = (id: string): string => {
    const identity = resolveAgentIdentity(id);
    return identity.displayName || id;
};

export const LiveActivityStream: React.FC = () => {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [typeFilter, setTypeFilter] = useState<ActivityEvent['type'] | 'all'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [autoScroll] = useState(true);
    const listRef = useRef<HTMLDivElement>(null);
    const isMountedRef = useRef(true);
    const idCounter = useRef(0);
    const pausedBuffer = useRef<Omit<ActivityEvent, 'id'>[]>([]);

    const pushEvent = useCallback(
        (evt: Omit<ActivityEvent, 'id'>) => {
            if (!isMountedRef.current) return;
            if (isPaused) {
                pausedBuffer.current.push(evt);
                return;
            }
            const id = `${Date.now()}-${idCounter.current++}`;
            setEvents((prev) => {
                const next = [{ ...evt, id }, ...prev];
                return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
            });
        },
        [isPaused],
    );

    const flushBuffer = useCallback(() => {
        const buf = pausedBuffer.current;
        if (buf.length === 0) return;
        pausedBuffer.current = [];
        setEvents((prev) => {
            const next = buf
                .map((evt, i) => ({ ...evt, id: `${Date.now()}-flush-${i}` }))
                .concat(prev);
            return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
        });
    }, []);

    useEffect(() => {
        isMountedRef.current = true;

        const unsubs = [
            eventBus.onSafe<{
                nodeId?: string;
                duration?: number;
                status?: string;
                output?: string;
                provider?: string;
                model?: string;
            }>(EVENTS.COGNITIVE_STEP_COMPLETED, (d) => {
                if (!d.nodeId) return;
                pushEvent({
                    type: 'step_complete',
                    agentId: d.nodeId,
                    agentName: getAgentName(d.nodeId),
                    message: `Step completed${d.status ? ` (${d.status})` : ''}`,
                    detail: d.output ? d.output.slice(0, 200) : undefined,
                    timestamp: Date.now(),
                    status: d.status,
                    duration: d.duration,
                });
            }),
            eventBus.onSafe<{
                requestId?: string;
                provider?: string;
                model?: string;
                tokens?: number;
            }>(EVENTS.STREAM_END, (d) => {
                if (!d.requestId) return;
                pushEvent({
                    type: 'stream_end',
                    agentId: d.provider || 'unknown',
                    agentName: d.provider || 'unknown',
                    message: `Stream response ${d.model ? `(${d.model})` : ''}`,
                    detail: d.tokens ? `${d.tokens} tokens` : undefined,
                    timestamp: Date.now(),
                });
            }),
            eventBus.onSafe<{ id: string; from: string; to: string }>(
                EVENTS.AGENT_LIFECYCLE_CHANGE,
                (d) => {
                    pushEvent({
                        type: 'lifecycle',
                        agentId: d.id,
                        agentName: getAgentName(d.id),
                        message: `${d.from} → ${d.to}`,
                        timestamp: Date.now(),
                        status: d.to,
                    });
                },
            ),
            eventBus.onSafe<{ id: string; name?: string }>(EVENTS.SYSTEM_NODE_SPAWN, (d) => {
                pushEvent({
                    type: 'spawn',
                    agentId: d.id,
                    agentName: d.name || getAgentName(d.id),
                    message: `Agent spawned${d.name ? `: ${d.name}` : ''}`,
                    timestamp: Date.now(),
                    status: 'ready',
                });
            }),
            eventBus.onSafe<{ id: string }>(EVENTS.SYSTEM_NODE_REMOVED, (d) => {
                pushEvent({
                    type: 'remove',
                    agentId: d.id,
                    agentName: getAgentName(d.id),
                    message: 'Agent removed',
                    timestamp: Date.now(),
                    status: 'terminated',
                });
            }),
            eventBus.onSafe<{ id: string }>(EVENTS.AGENT_RESTARTED, (d) => {
                pushEvent({
                    type: 'restart',
                    agentId: d.id,
                    agentName: getAgentName(d.id),
                    message: 'Agent restarted',
                    timestamp: Date.now(),
                    status: 'ready',
                });
            }),
            eventBus.onSafe<{ from?: string; to?: string; reason?: string }>(
                EVENTS.AGENT_HANDOFF_INITIATED,
                (d) => {
                    pushEvent({
                        type: 'handoff',
                        agentId: d.from || 'unknown',
                        agentName: d.from ? getAgentName(d.from) : 'unknown',
                        message: `Handoff ${d.from || '?'} → ${d.to || '?'}`,
                        detail: d.reason,
                        timestamp: Date.now(),
                    });
                },
            ),
        ];

        return () => {
            isMountedRef.current = false;
            unsubs.forEach((u) => u());
        };
    }, [pushEvent]);

    // Auto-scroll to top
    useEffect(() => {
        if (autoScroll && listRef.current) {
            listRef.current.scrollTop = 0;
        }
    }, [events.length, autoScroll]);

    const filtered = typeFilter === 'all' ? events : events.filter((e) => e.type === typeFilter);

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    };

    const typeCounts = events.reduce(
        (acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    return (
        <div
            style={{
                ...glassPanel,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                        style={{
                            padding: '0.5rem',
                            background: 'rgba(16,185,129,0.15)',
                            borderRadius: 10,
                            border: '1px solid rgba(16,185,129,0.3)',
                        }}
                    >
                        <Activity size={20} color="#10b981" />
                    </div>
                    <div>
                        <h3
                            style={{
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                color: 'var(--slate-50)',
                                margin: 0,
                            }}
                        >
                            Live Activity Stream
                        </h3>
                        <p style={{ fontSize: '0.7rem', color: 'var(--slate-400)', margin: 0 }}>
                            {events.length} events • {filtered.length} shown
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                        onClick={() => {
                            setIsPaused(!isPaused);
                            if (isPaused) flushBuffer();
                        }}
                        style={{
                            padding: '0.3rem',
                            borderRadius: 6,
                            background: isPaused ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isPaused ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            color: isPaused ? '#ef4444' : '#94a3b8',
                            cursor: 'pointer',
                        }}
                        title={isPaused ? 'Resume feed' : 'Pause feed'}
                    >
                        {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                        onClick={() => {
                            setEvents([]);
                            idCounter.current = 0;
                        }}
                        style={{
                            padding: '0.3rem',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                        }}
                        title="Clear all"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Filter chips */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.3rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.75rem',
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={() => setTypeFilter('all')}
                    style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        borderRadius: 6,
                        border: `1px solid ${typeFilter === 'all' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                        background: typeFilter === 'all' ? 'rgba(59,130,246,0.15)' : 'transparent',
                        color: typeFilter === 'all' ? '#60a5fa' : '#94a3b8',
                        cursor: 'pointer',
                    }}
                >
                    All ({events.length})
                </button>
                {(Object.keys(typeConfig) as Array<ActivityEvent['type']>).map((type) => (
                    <button
                        key={type}
                        onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                        style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            borderRadius: 6,
                            border: `1px solid ${typeFilter === type ? typeConfig[type].color : 'var(--border-default)'}`,
                            background: typeFilter === type ? typeConfig[type].bg : 'transparent',
                            color: typeFilter === type ? typeConfig[type].color : 'var(--slate-400)',
                            cursor: 'pointer',
                        }}
                    >
                        {type.replace('_', ' ')} ({typeCounts[type] || 0})
                    </button>
                ))}
            </div>

            {/* Event list */}
            <div
                ref={listRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                }}
            >
                {filtered.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--slate-500)',
                            gap: '0.5rem',
                        }}
                    >
                        <Activity size={32} style={{ opacity: 0.3 }} />
                        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {isPaused
                                ? 'Feed is paused — click play to resume'
                                : 'No activity yet — waiting for agent events…'}
                        </p>
                        {isPaused && (
                            <p style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                                Paused events will not be captured
                            </p>
                        )}
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {filtered.map((evt) => {
                            const cfg = typeConfig[evt.type];
                            const Icon = cfg.icon;
                            const isExpanded = expandedId === evt.id;
                            return (
                                <motion.div
                                    key={evt.id}
                                    initial={{ opacity: 0, x: -20, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                                    exit={{ opacity: 0, x: 20, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                                    style={{
                                        display: 'flex',
                                        gap: '0.75rem',
                                        padding: '0.6rem 0.75rem',
                                        borderRadius: 10,
                                        background: cfg.bg,
                                        border: `1px solid ${cfg.color}20`,
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        transition: 'border-color 0.15s',
                                    }}
                                >
                                    {/* Icon */}
                                    <div
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            background: `${cfg.color}20`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Icon size={14} color={cfg.color} />
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginBottom: '0.15rem',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    color: 'var(--slate-50)',
                                                }}
                                            >
                                                {evt.agentName}
                                            </span>
                                            {evt.status && lifecycleColors[evt.status] && (
                                                <span
                                                    style={{
                                                        fontSize: '0.55rem',
                                                        fontWeight: 700,
                                                        color: lifecycleColors[evt.status],
                                                        background: `${lifecycleColors[evt.status]}15`,
                                                        padding: '0.1rem 0.35rem',
                                                        borderRadius: 4,
                                                    }}
                                                >
                                                    {evt.status}
                                                </span>
                                            )}
                                            {evt.duration != null && (
                                                <span
                                                    style={{
                                                        fontSize: '0.55rem',
                                                        fontWeight: 600,
                                                        color: 'var(--slate-400)',
                                                        fontFamily: 'monospace',
                                                    }}
                                                >
                                                    {evt.duration}ms
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--slate-300)',
                                                margin: 0,
                                            }}
                                        >
                                            {evt.message}
                                        </p>
                                        {isExpanded && evt.detail && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                style={{
                                                    marginTop: '0.4rem',
                                                    padding: '0.5rem',
                                                    borderRadius: 6,
                                                    background: 'rgba(0,0,0,0.3)',
                                                    fontSize: '0.65rem',
                                                    color: 'var(--slate-400)',
                                                    fontFamily: 'monospace',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-all',
                                                    maxHeight: 80,
                                                    overflow: 'auto',
                                                }}
                                            >
                                                {evt.detail}
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    <div
                                        style={{
                                            fontSize: '0.55rem',
                                            color: 'var(--slate-500)',
                                            fontFamily: 'monospace',
                                            flexShrink: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            gap: '0.2rem',
                                        }}
                                    >
                                        <span>{formatTime(evt.timestamp)}</span>
                                        {isExpanded ? (
                                            <ChevronUp size={10} />
                                        ) : (
                                            <ChevronDown size={10} />
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};
