import { motion } from 'framer-motion';
import { X, BarChart3 } from 'lucide-react';

interface AgentData {
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
}

interface AgentComparisonProps {
    agents: AgentData[];
    onClose: () => void;
}

const statRow = (label: string, a: string, b: string, higherBetter = true) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    const aWins = higherBetter ? numA > numB : numA < numB;
    const bWins = higherBetter ? numB > numA : numB < numA;
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 8,
                alignItems: 'center',
                padding: '0.4rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
        >
            <div
                style={{
                    textAlign: 'right',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: aWins ? '#10b981' : '#e2e8f0',
                }}
            >
                {a}
            </div>
            <div
                style={{ fontSize: '0.65rem', color: 'var(--slate-500)', textAlign: 'center', minWidth: 80 }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: bWins ? '#10b981' : '#e2e8f0',
                }}
            >
                {b}
            </div>
        </div>
    );
};

export const AgentComparison: React.FC<AgentComparisonProps> = ({ agents, onClose }) => {
    if (agents.length < 2) return null;
    const [a, b] = agents as [AgentData, AgentData];

    const successA =
        a.stats.calls > 0
            ? Math.max(0, ((a.stats.calls - (a.stats.errors || 0)) / a.stats.calls) * 100).toFixed(
                  1,
              )
            : '--';
    const successB =
        b.stats.calls > 0
            ? Math.max(0, ((b.stats.calls - (b.stats.errors || 0)) / b.stats.calls) * 100).toFixed(
                  1,
              )
            : '--';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
            }}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                style={{
                    background: 'var(--slate-800)',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.1)',
                    width: '100%',
                    maxWidth: 700,
                    maxHeight: '80vh',
                    overflow: 'auto',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChart3 size={18} color="#3b82f6" />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-200)' }}>
                            Agent Comparison
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: 6,
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Agent Names */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr',
                        gap: 8,
                        padding: '1rem 1.5rem',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#60a5fa' }}>
                            {a.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{a.role}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-600)', fontWeight: 700 }}>VS</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#a855f7' }}>
                            {b.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{b.role}</div>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ padding: '0 1.5rem 1rem' }}>
                    <div
                        style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: 'var(--slate-500)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.5rem',
                        }}
                    >
                        Performance
                    </div>
                    {statRow(
                        'Calls',
                        a.stats.calls.toLocaleString(),
                        b.stats.calls.toLocaleString(),
                    )}
                    {statRow(
                        'Tokens',
                        a.stats.tokens > 1000
                            ? `${(a.stats.tokens / 1000).toFixed(1)}K`
                            : String(a.stats.tokens),
                        b.stats.tokens > 1000
                            ? `${(b.stats.tokens / 1000).toFixed(1)}K`
                            : String(b.stats.tokens),
                    )}
                    {statRow('Latency', `${a.stats.latency}ms`, `${b.stats.latency}ms`, false)}
                    {statRow('Success', `${successA}%`, `${successB}%`)}
                    {statRow(
                        'Errors',
                        String(a.stats.errors || 0),
                        String(b.stats.errors || 0),
                        false,
                    )}
                </div>

                {/* Config */}
                <div style={{ padding: '0 1.5rem 1rem' }}>
                    <div
                        style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: 'var(--slate-500)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.5rem',
                        }}
                    >
                        Configuration
                    </div>
                    {statRow('Temperature', a.temperature.toFixed(1), b.temperature.toFixed(1))}
                    {statRow('Tools', String(a.tools.length), String(b.tools.length))}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                            marginTop: '0.5rem',
                        }}
                    >
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                            <span style={{ color: 'var(--slate-500)' }}>Provider: </span>
                            {a.providerId}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                            <span style={{ color: 'var(--slate-500)' }}>Provider: </span>
                            {b.providerId}
                        </div>
                    </div>
                </div>

                {/* Prompt Preview */}
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <div
                        style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: 'var(--slate-500)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.5rem',
                        }}
                    >
                        System Prompt
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                background: 'rgba(0,0,0,0.2)',
                                padding: '0.5rem',
                                borderRadius: 8,
                                maxHeight: 80,
                                overflow: 'auto',
                                fontFamily: 'monospace',
                            }}
                        >
                            {a.systemPrompt.length > 150
                                ? a.systemPrompt.slice(0, 150) + '...'
                                : a.systemPrompt}
                        </div>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                background: 'rgba(0,0,0,0.2)',
                                padding: '0.5rem',
                                borderRadius: 8,
                                maxHeight: 80,
                                overflow: 'auto',
                                fontFamily: 'monospace',
                            }}
                        >
                            {b.systemPrompt.length > 150
                                ? b.systemPrompt.slice(0, 150) + '...'
                                : b.systemPrompt}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AgentComparison;
