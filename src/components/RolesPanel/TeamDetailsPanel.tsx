import React, { useMemo, useState } from 'react';
import {
    BarChart3,
    History,
    GitCompare,
    Activity,
    Clock,
    CheckCircle2,
    Zap,
    Users,
} from 'lucide-react';
import type { RoleTeam, TeamExecution, TeamAnalytics } from '../../kernel/contracts/role-team';
import { roleTeamService } from '../../kernel/instances';
import TeamPipeline from './TeamPipeline';
import { STRATEGY_COLORS } from '../../kernel/contracts/role-team';

interface TeamDetailsPanelProps {
    team: RoleTeam;
    executionMap: Record<string, TeamExecution>;
    onClose: () => void;
    onDebate?: (team: RoleTeam) => void;
    onChat?: (team: RoleTeam) => void;
}

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 14,
    border: '1px solid rgba(255,255,255,0.08)',
};

const chip = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: '0.7rem',
    fontWeight: 600,
    background: `${color}20`,
    color,
    border: `1px solid ${color}40`,
});

const TeamDetailsPanel: React.FC<TeamDetailsPanelProps> = ({
    team,
    executionMap,
    onClose,
    onDebate,
    onChat,
}) => {
    const [activeTab, setActiveTab] = useState<'analytics' | 'history' | 'compatibility'>(
        'analytics',
    );

    const analytics: TeamAnalytics = useMemo(
        () => roleTeamService.getTeamAnalytics(team.id),
        [team.id],
    );

    const executions: TeamExecution[] = useMemo(
        () => roleTeamService.getExecutionHistory(team.id),
        [team.id],
    );

    const allCompatibility = useMemo(() => roleTeamService.getCompatibilityMatrix(), []);

    const tabBtn = (
        tab: 'analytics' | 'history' | 'compatibility',
        label: string,
        icon: React.ReactNode,
    ) => (
        <button
            onClick={() => setActiveTab(tab)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === tab ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: activeTab === tab ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
            }}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: '#1a1b2e',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.1)',
                    maxWidth: 900,
                    width: '100%',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    padding: 24,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: 20,
                    }}
                >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: `${team.color || '#3b82f6'}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                            }}
                        >
                            {team.icon || '👥'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--slate-200)', fontSize: '1.1rem' }}>
                                {team.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: 2 }}>
                                {team.description}
                            </div>
                            <div
                                style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}
                            >
                                <span
                                    style={chip(
                                        STRATEGY_COLORS[team.coordinationStrategy] || '#64748b',
                                    )}
                                >
                                    {team.coordinationStrategy}
                                </span>
                                <span style={{ ...chip('#64748b') }}>
                                    {team.metadata?.domain || 'custom'}
                                </span>
                                <span style={{ ...chip('#3b82f6') }}>
                                    {team.roleIds.length} roles
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {onChat && (
                            <button
                                onClick={() => onChat(team)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: 'rgba(139,92,246,0.15)',
                                    color: 'var(--purple-muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <Users size={12} /> Chat
                            </button>
                        )}
                        {onDebate && (
                            <button
                                onClick={() => onDebate(team)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: 'rgba(239,68,68,0.15)',
                                    color: '#f87171',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <Zap size={12} /> Debate
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent',
                                color: 'var(--slate-400)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        display: 'flex',
                        gap: 4,
                        marginBottom: 16,
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        paddingBottom: 8,
                    }}
                >
                    {tabBtn('analytics', 'Analytics', <BarChart3 size={14} />)}
                    {tabBtn('history', `History (${executions.length})`, <History size={14} />)}
                    {tabBtn('compatibility', `Compatibility`, <GitCompare size={14} />)}
                </div>

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: 10,
                                marginBottom: 16,
                            }}
                        >
                            <div style={{ ...card, textAlign: 'center' }}>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-500)',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Executions
                                </div>
                                <div
                                    style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-200)',
                                        marginTop: 4,
                                    }}
                                >
                                    {analytics.totalExecutions}
                                </div>
                            </div>
                            <div style={{ ...card, textAlign: 'center' }}>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-500)',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Success Rate
                                </div>
                                <div
                                    style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        color:
                                            analytics.successRate > 0.7
                                                ? '#34d399'
                                                : analytics.successRate > 0.3
                                                  ? '#f59e0b'
                                                  : '#ef4444',
                                        marginTop: 4,
                                    }}
                                >
                                    {(analytics.successRate * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div style={{ ...card, textAlign: 'center' }}>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-500)',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Avg Duration
                                </div>
                                <div
                                    style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-200)',
                                        marginTop: 4,
                                    }}
                                >
                                    {analytics.avgDuration > 1000
                                        ? `${(analytics.avgDuration / 1000).toFixed(1)}s`
                                        : `${analytics.avgDuration.toFixed(0)}ms`}
                                </div>
                            </div>
                            <div style={{ ...card, textAlign: 'center' }}>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-500)',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Avg Cost
                                </div>
                                <div
                                    style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-200)',
                                        marginTop: 4,
                                    }}
                                >
                                    ${analytics.avgCost.toFixed(6)}
                                </div>
                            </div>
                        </div>

                        {/* Per-role contribution */}
                        {Object.keys(analytics.perRoleContribution).length > 0 && (
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-500)',
                                        marginBottom: 8,
                                    }}
                                >
                                    Per-Role Token Contribution
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {Object.entries(analytics.perRoleContribution)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([roleId, tokens]) => {
                                            const maxTokens = Math.max(
                                                ...Object.values(analytics.perRoleContribution),
                                            );
                                            const pct =
                                                maxTokens > 0 ? (tokens / maxTokens) * 100 : 0;
                                            return (
                                                <div
                                                    key={roleId}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            color: 'var(--slate-400)',
                                                            minWidth: 120,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {roleId}
                                                    </div>
                                                    <div
                                                        style={{
                                                            flex: 1,
                                                            height: 8,
                                                            background: 'rgba(255,255,255,0.06)',
                                                            borderRadius: 4,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                height: '100%',
                                                                width: `${pct}%`,
                                                                background:
                                                                    'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                                                borderRadius: 4,
                                                                transition: 'width 0.3s',
                                                            }}
                                                        />
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            color: 'var(--slate-500)',
                                                            minWidth: 50,
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        {tokens}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {analytics.totalExecutions === 0 && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: 30,
                                    color: 'var(--slate-500)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                <Activity size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                                <div>No execution data yet. Run a task to see analytics.</div>
                            </div>
                        )}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div>
                        {executions.length === 0 ? (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: 30,
                                    color: 'var(--slate-500)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                <History size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                                <div>No execution history yet.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {executions.slice(0, 20).map((exec) => (
                                    <div
                                        key={exec.id}
                                        style={{
                                            ...card,
                                            borderLeft: `3px solid ${exec.status === 'completed' ? '#10b981' : exec.status === 'failed' ? '#ef4444' : '#f59e0b'}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: 6,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                {exec.status === 'completed' ? (
                                                    <CheckCircle2 size={14} color="#10b981" />
                                                ) : exec.status === 'failed' ? (
                                                    <span style={{ color: 'var(--error)' }}>❌</span>
                                                ) : (
                                                    <Clock size={14} color="#f59e0b" />
                                                )}
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        color: 'var(--slate-200)',
                                                        fontSize: '0.8rem',
                                                    }}
                                                >
                                                    {exec.status}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        color: 'var(--slate-500)',
                                                    }}
                                                >
                                                    {new Date(exec.startedAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            {exec.metrics && (
                                                <div
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        color: 'var(--slate-500)',
                                                        display: 'flex',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <span>{exec.metrics.totalDuration}ms</span>
                                                    <span>{exec.metrics.totalTokens}tok</span>
                                                    <span>
                                                        ${(exec.metrics.totalCost || 0).toFixed(6)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.72rem',
                                                color: 'var(--slate-400)',
                                                whiteSpace: 'pre-wrap',
                                                maxHeight: 40,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            Task: {exec.task}
                                        </div>
                                        {executionMap[exec.id] &&
                                            (() => {
                                                const execData = executionMap[exec.id]!;
                                                return (
                                                    <div style={{ marginTop: 8 }}>
                                                        <TeamPipeline
                                                            execution={execData}
                                                            strategy={team.coordinationStrategy}
                                                        />
                                                    </div>
                                                );
                                            })()}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Compatibility Tab */}
                {activeTab === 'compatibility' && (
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: 12 }}>
                            How this team relates to other teams based on domain overlap and shared
                            roles.
                        </div>

                        {/* Compact matrix table */}
                        {allCompatibility.length === 0 ? (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: 30,
                                    color: 'var(--slate-500)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                <GitCompare size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                                <div>Need at least 2 teams to compute compatibility.</div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'grid', gap: 6 }}>
                                    {allCompatibility.slice(0, 30).map((entry) => {
                                        const isDirectMatch =
                                            entry.roleA === team.id || entry.roleB === team.id;
                                        return (
                                            <div
                                                key={`${entry.roleA}-${entry.roleB}`}
                                                style={{
                                                    ...card,
                                                    padding: '8px 12px',
                                                    borderLeft: `3px solid ${entry.synergyLabel === 'synergy' ? '#10b981' : entry.synergyLabel === 'conflict' ? '#ef4444' : '#f59e0b'}`,
                                                    opacity: isDirectMatch ? 1 : 0.5,
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
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            flex: 1,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize: '0.72rem',
                                                                color: 'var(--slate-400)',
                                                                fontWeight: isDirectMatch
                                                                    ? 600
                                                                    : 400,
                                                            }}
                                                        >
                                                            {entry.roleA}
                                                        </span>
                                                        <span
                                                            style={{
                                                                color: 'var(--slate-500)',
                                                                fontSize: '0.6rem',
                                                            }}
                                                        >
                                                            ↔
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: '0.72rem',
                                                                color: 'var(--slate-400)',
                                                                fontWeight: isDirectMatch
                                                                    ? 600
                                                                    : 400,
                                                            }}
                                                        >
                                                            {entry.roleB}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                padding: '2px 8px',
                                                                borderRadius: 4,
                                                                fontSize: '0.6rem',
                                                                fontWeight: 600,
                                                                background:
                                                                    entry.synergyLabel === 'synergy'
                                                                        ? 'rgba(16,185,129,0.15)'
                                                                        : entry.synergyLabel ===
                                                                            'conflict'
                                                                          ? 'rgba(239,68,68,0.15)'
                                                                          : 'rgba(245,158,11,0.15)',
                                                                color:
                                                                    entry.synergyLabel === 'synergy'
                                                                        ? '#34d399'
                                                                        : entry.synergyLabel ===
                                                                            'conflict'
                                                                          ? '#f87171'
                                                                          : '#f59e0b',
                                                            }}
                                                        >
                                                            {entry.synergyLabel}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: '0.65rem',
                                                                color: 'var(--slate-500)',
                                                                minWidth: 30,
                                                                textAlign: 'right',
                                                            }}
                                                        >
                                                            {entry.score.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {entry.note && (
                                                    <div
                                                        style={{
                                                            fontSize: '0.62rem',
                                                            color: 'var(--slate-500)',
                                                            marginTop: 4,
                                                            fontStyle: 'italic',
                                                        }}
                                                    >
                                                        {entry.note}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetailsPanel;
