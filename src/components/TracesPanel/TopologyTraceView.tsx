import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTopologyTraceStore } from '../../stores/topologyTraceStore';

const NODE_COLORS: Record<string, string> = {
    router: '#3b82f6',
    agent: '#a855f7',
    tool: '#10b981',
    guardrail: '#f59e0b',
    aggregator: '#ef4444',
};

const TopologyTraceView: React.FC = () => {
    const steps = useTopologyTraceStore((s) => s.steps);
    const clearAll = useTopologyTraceStore((s) => s.clearAll);

    const nodeMap = new Map<
        string,
        Array<{ nodeId: string; status: string; duration?: number; timestamp: number }>
    >();
    for (const step of steps) {
        const arr = nodeMap.get(step.nodeId) || [];
        arr.push({
            nodeId: step.nodeId,
            status: step.status,
            duration: step.duration,
            timestamp: step.timestamp,
        });
        nodeMap.set(step.nodeId, arr);
    }

    const nodes = [...nodeMap.entries()].reverse().map(([nodeId, entries]) => ({
        nodeId,
        status: entries[entries.length - 1]!.status,
        history: entries.slice(-3).reverse(),
        duration: entries[entries.length - 1]!.duration,
        timestamp: entries[entries.length - 1]!.timestamp,
    }));

    if (nodes.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                <Activity size={32} opacity={0.3} aria-hidden="true" />
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    No topology events yet
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Execute a topology to see live node transitions
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                    style={{
                        fontSize: '0.75rem',
                        color: 'var(--slate-500)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    Live Nodes ({nodes.length})
                </div>
                <button
                    onClick={clearAll}
                    style={{
                        fontSize: '0.7rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: 6,
                        background: 'var(--error-tint)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        fontWeight: 700,
                    }}
                >
                    Clear
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {nodes.map((n) => {
                    const type = n.nodeId.includes(':') ? n.nodeId.split(':')[0]! : 'agent';
                    const color = NODE_COLORS[type] || '#64748b';
                    const isActive = n.status === 'active';
                    const isError = n.status === 'error';
                    const isDone = n.status === 'done';
                    return (
                        <motion.div
                            key={n.nodeId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: 8,
                                background: isActive ? `${color}15` : 'rgba(0,0,0,0.2)',
                                border: `1px solid ${isActive ? `${color}40` : 'rgba(255,255,255,0.05)'}`,
                                transition: 'all 0.2s',
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.2,
                                        ease: 'easeInOut',
                                    }}
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: color,
                                        boxShadow: `0 0 8px ${color}`,
                                    }}
                                />
                            )}
                            {isDone && <CheckCircle size={14} color="#10b981" />}
                            {isError && <XCircle size={14} color="#ef4444" />}
                            {!isActive && !isDone && !isError && (
                                <div
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: 'var(--slate-600)',
                                    }}
                                />
                            )}
                            <span
                                style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: isActive ? color : isError ? '#ef4444' : '#cbd5e1',
                                    flex: 1,
                                }}
                            >
                                {n.nodeId}
                            </span>
                            {n.duration !== undefined && (
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-500)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    <Clock size={12} /> {n.duration}ms
                                </span>
                            )}
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    color: isActive ? color : 'var(--slate-500)',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                }}
                            >
                                {n.status}
                            </span>
                            {n.history && n.history.length > 1 && (
                                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                    {n.history
                                        .slice(0, 3)
                                        .map((h: { status: string }, i: number) => {
                                            const c =
                                                h.status === 'done'
                                                    ? '#10b981'
                                                    : h.status === 'active'
                                                      ? color
                                                      : h.status === 'error'
                                                        ? '#ef4444'
                                                        : '#475569';
                                            return (
                                                <div
                                                    key={`hist-${i}`}
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        background: c,
                                                    }}
                                                    title={h.status}
                                                />
                                            );
                                        })}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default TopologyTraceView;
