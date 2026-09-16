import React, { useState } from 'react';
import {
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    RotateCcw,
} from 'lucide-react';
import type { TeamExecution, TeamStrategy, RoleOutput } from '../../kernel/contracts/role-team';
import { STRATEGY_COLORS } from '../../kernel/contracts/role-team';

interface TeamPipelineProps {
    execution: TeamExecution;
    strategy: TeamStrategy;
    onReRunRole?: (roleId: string) => void;
}

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    border: '1px solid rgba(255,255,255,0.08)',
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    pending: {
        icon: <Clock size={14} />,
        color: 'var(--slate-500)',
        bg: 'rgba(100,116,139,0.1)',
    },
    running: {
        icon: <Loader2 size={14} className="animate-spin" />,
        color: 'var(--accent)',
        bg: 'rgba(59,130,246,0.1)',
    },
    completed: {
        icon: <CheckCircle2 size={14} />,
        color: 'var(--success)',
        bg: 'rgba(16,185,129,0.1)',
    },
    failed: {
        icon: <XCircle size={14} />,
        color: 'var(--error)',
        bg: 'rgba(239,68,68,0.1)',
    },
};

const statusIcon = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

const TeamPipeline: React.FC<TeamPipelineProps> = ({ execution, strategy, onReRunRole }) => {
    const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
    const [showSynthesis, setShowSynthesis] = useState(false);

    const outputs = Object.values(execution.roleOutputs);
    const completedCount = outputs.filter((o) => o.status === 'completed').length;
    const totalCount = outputs.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const toggleRole = (roleId: string) => {
        setExpandedRoles((prev) => {
            const next = new Set(prev);
            if (next.has(roleId)) next.delete(roleId);
            else next.add(roleId);
            return next;
        });
    };

    const roleNode = (output: RoleOutput, _index: number) => {
        const cfg = statusIcon(output.status);
        const expanded = expandedRoles.has(output.roleId);

        return (
            <div
                key={output.roleId}
                style={{
                    ...card,
                    borderLeft: `3px solid ${cfg!.color}`,
                    background: cfg!.bg,
                    marginBottom: 6,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                    }}
                    onClick={() => toggleRole(output.roleId)}
                >
                    <div
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: cfg!.color + '20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {cfg!.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontWeight: 600,
                                color: 'var(--slate-200)',
                                fontSize: '0.8rem',
                            }}
                        >
                            {output.roleId}
                        </div>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: cfg!.color,
                                fontWeight: 500,
                                textTransform: 'capitalize',
                            }}
                        >
                            {output.status}
                            {output.latency != null && output.status === 'completed'
                                ? ` · ${output.latency}ms`
                                : ''}
                            {output.tokens != null && output.tokens > 0
                                ? ` · ${output.tokens} tok`
                                : ''}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {onReRunRole && output.status === 'completed' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReRunRole(output.roleId);
                                }}
                                title="Re-run this role"
                                style={{
                                    padding: '3px 6px',
                                    borderRadius: 4,
                                    border: 'none',
                                    background: 'var(--success-tint)',
                                    color: '#34d399',
                                    cursor: 'pointer',
                                    fontSize: '0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                }}
                            >
                                <RotateCcw size={10} /> Re-run
                            </button>
                        )}
                        {output.output && (
                            <button
                                style={{
                                    padding: '3px 6px',
                                    borderRadius: 4,
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--slate-400)',
                                    cursor: 'pointer',
                                    fontSize: '0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        )}
                    </div>
                </div>

                {expanded && output.output && (
                    <div
                        style={{
                            marginTop: 8,
                            padding: 8,
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            color: 'var(--slate-300)',
                            whiteSpace: 'pre-wrap',
                            maxHeight: 200,
                            overflowY: 'auto',
                            lineHeight: 1.4,
                            fontFamily: 'monospace',
                        }}
                    >
                        {output.output}
                    </div>
                )}

                {output.error && (
                    <div
                        style={{
                            marginTop: 6,
                            padding: '4px 8px',
                            background: 'var(--error-tint)',
                            borderRadius: 4,
                            fontSize: '0.7rem',
                            color: '#f87171',
                        }}
                    >
                        Error: {output.error}
                    </div>
                )}
            </div>
        );
    };

    const renderLayout = () => {
        switch (strategy) {
            case 'parallel':
                return (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: 6,
                        }}
                    >
                        {outputs.map((o, i) => roleNode(o, i))}
                    </div>
                );
            case 'pipeline':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {outputs.map((o, i) => (
                            <div key={o.roleId}>
                                {i > 0 && (
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            color: 'var(--slate-500)',
                                            fontSize: '0.6rem',
                                            padding: '2px 0',
                                        }}
                                    >
                                        ↓ output feeds next role
                                    </div>
                                )}
                                {roleNode(o, i)}
                            </div>
                        ))}
                    </div>
                );
            case 'debate':
                return (
                    <div>
                        {outputs.map((o, i) => (
                            <div key={o.roleId}>
                                {i > 0 && (
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            color: 'var(--slate-500)',
                                            fontSize: '0.6rem',
                                            padding: '2px 0',
                                        }}
                                    >
                                        ┄ counter-argument ┄
                                    </div>
                                )}
                                {roleNode(o, i)}
                            </div>
                        ))}
                    </div>
                );
            case 'hierarchical': {
                const leaderId = execution.roleOutputs ? Object.keys(execution.roleOutputs)[0] : '';
                const subRoles = Object.entries(execution.roleOutputs).filter(
                    ([id]) => id !== leaderId,
                );
                return (
                    <div>
                        <div style={{ marginBottom: 4 }}>
                            {leaderId && roleNode(execution.roleOutputs[leaderId]!, 0)}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-around',
                                padding: '4px 0',
                                color: 'var(--slate-500)',
                                fontSize: '0.6rem',
                            }}
                        >
                            ↓ delegates to ↓
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                gap: 4,
                                marginLeft: 20,
                            }}
                        >
                            {subRoles.map(([, o], i) => roleNode(o, i))}
                        </div>
                    </div>
                );
            }
            case 'tournament':
                return (
                    <div>
                        {outputs.map((o, i) => (
                            <div key={o.roleId}>
                                {i > 0 && i % 2 === 0 && (
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            color: 'var(--slate-500)',
                                            fontSize: '0.6rem',
                                            padding: '2px 0',
                                        }}
                                    >
                                        🏆 winner advances
                                    </div>
                                )}
                                {roleNode(o, i)}
                            </div>
                        ))}
                    </div>
                );
            default:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {outputs.map((o, i) => roleNode(o, i))}
                    </div>
                );
        }
    };

    return (
        <div
            style={{
                marginTop: 12,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            fontWeight: 700,
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        {execution.status === 'completed'
                            ? '✅'
                            : execution.status === 'failed'
                              ? '❌'
                              : '⏳'}{' '}
                        {execution.status === 'completed'
                            ? 'Completed'
                            : execution.status === 'failed'
                              ? 'Failed'
                              : execution.status === 'aborted'
                                ? 'Aborted'
                                : 'Running...'}
                        <span
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-500)',
                                fontWeight: 400,
                            }}
                        >
                            · {completedCount}/{totalCount} roles ·{' '}
                            {execution.metrics?.totalDuration || 0}ms
                        </span>
                    </div>
                    <div
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--slate-500)',
                            textTransform: 'capitalize',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <span
                            style={{
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                background: STRATEGY_COLORS[strategy],
                            }}
                        />
                        {strategy}
                    </div>
                </div>
                {/* Progress bar */}
                <div
                    style={{
                        marginTop: 6,
                        height: 4,
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            width: `${progressPct}%`,
                            background:
                                execution.status === 'completed'
                                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                                    : execution.status === 'failed'
                                      ? 'linear-gradient(90deg, #ef4444, #f87171)'
                                      : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                            borderRadius: 2,
                            transition: 'width 0.3s ease',
                        }}
                    />
                </div>
            </div>

            {/* Pipeline visualization */}
            <div style={{ padding: 10 }}>{renderLayout()}</div>

            {/* Metrics footer */}
            {execution.metrics && (
                <div
                    style={{
                        padding: '8px 14px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        gap: 16,
                        flexWrap: 'wrap',
                        fontSize: '0.7rem',
                        color: 'var(--slate-500)',
                    }}
                >
                    <span>
                        Duration:{' '}
                        <strong style={{ color: 'var(--slate-400)' }}>
                            {execution.metrics.totalDuration}ms
                        </strong>
                    </span>
                    <span>
                        Tokens:{' '}
                        <strong style={{ color: 'var(--slate-400)' }}>
                            {execution.metrics.totalTokens}
                        </strong>
                    </span>
                    <span>
                        Cost:{' '}
                        <strong style={{ color: 'var(--slate-400)' }}>
                            ${(execution.metrics.totalCost || 0).toFixed(6)}
                        </strong>
                    </span>
                    <span>
                        Success rate:{' '}
                        <strong style={{ color: 'var(--slate-400)' }}>
                            {(execution.metrics.successRate * 100).toFixed(0)}%
                        </strong>
                    </span>
                </div>
            )}

            {/* Synthesis toggle */}
            {execution.synthesis && (
                <div
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div
                        onClick={() => setShowSynthesis(!showSynthesis)}
                        style={{
                            padding: '8px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--purple-muted)',
                            userSelect: 'none',
                        }}
                    >
                        {showSynthesis ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        Synthesis
                    </div>
                    {showSynthesis && (
                        <div
                            style={{
                                padding: '8px 14px 12px',
                                fontSize: '0.75rem',
                                color: 'var(--slate-300)',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.5,
                                background: 'rgba(0,0,0,0.15)',
                                maxHeight: 300,
                                overflowY: 'auto',
                            }}
                        >
                            {execution.synthesis}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamPipeline;
