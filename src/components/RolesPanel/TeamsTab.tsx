import React, { useState, useCallback } from 'react';
import { Users, Trash2, Play, BarChart3, MessageSquare, Zap } from 'lucide-react';
import type { RoleTeam, TeamExecution, TeamTemplate } from '../../kernel/contracts/role-team';
import type { UnifiedRoleEntry } from '../../kernel/contracts/unified-role';
import type { IRoleTeamService } from '../../kernel/contracts/role-team';
import TeamWizard from './TeamWizard';
import TeamPipeline from './TeamPipeline';
import TeamDetailsPanel from './TeamDetailsPanel';
import TeamChat from './TeamChat';
import { card, chip, STRATEGY_COLORS } from './consortia-constants';

interface TeamsTabProps {
    teamSvc: IRoleTeamService;
    teams: RoleTeam[];
    setTeams: (teams: RoleTeam[]) => void;
    roles: UnifiedRoleEntry[];
    teamTemplates: TeamTemplate[];
}

const TeamsTab: React.FC<TeamsTabProps> = ({ teamSvc, teams, setTeams, roles, teamTemplates }) => {
    const [showWizard, setShowWizard] = useState(false);
    const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});
    const [execResults, setExecResults] = useState<Record<string, TeamExecution>>({});
    const [executingTeams, setExecutingTeams] = useState<Set<string>>(new Set());
    const [selectedTeam, setSelectedTeam] = useState<RoleTeam | null>(null);
    const [chatTeam, setChatTeam] = useState<RoleTeam | null>(null);
    const [teamsView, setTeamsView] = useState<'my-teams' | 'marketplace'>('my-teams');

    const executeTeam = useCallback(
        async (teamId: string) => {
            const task = taskInputs[teamId]?.trim();
            if (!task) return;
            setExecutingTeams((prev) => new Set(prev).add(teamId));
            try {
                const result = await teamSvc.executeTeam(teamId, task);
                setExecResults((prev) => ({ ...prev, [teamId]: result }));
            } catch (e) {
                console.error('Team execution failed:', e);
            }
            setExecutingTeams((prev) => {
                const next = new Set(prev);
                next.delete(teamId);
                return next;
            });
        },
        [taskInputs, teamSvc],
    );

    const handleDeleteTeam = useCallback(
        (id: string) => {
            teamSvc.deleteTeam(id);
            setTeams(teamSvc.listTeams());
        },
        [teamSvc, setTeams],
    );

    const handleTeamToDebate = useCallback((team: RoleTeam) => {
        const participantRoles = team.roleIds.slice(0, 8);
        const strategyMap: Record<string, string> = {
            parallel: 'round-robin',
            sequential: 'round-robin',
            pipeline: 'round-robin',
            debate: 'socratic',
            consensus: 'consensus',
            hierarchical: 'moderated',
            swarm: 'free-for-all',
            tournament: 'tournament',
            'round-robin': 'round-robin',
            review: 'moderated',
        };
        const strategy = strategyMap[team.coordinationStrategy] || 'round-robin';
        const roles = encodeURIComponent(participantRoles.join(','));
        window.location.href = `/debate?strategy=${strategy}&roles=${roles}&team=${encodeURIComponent(team.name)}`;
    }, []);

    const refreshTeams = useCallback(() => setTeams(teamSvc.listTeams()), [teamSvc, setTeams]);

    return (
        <div>
            {showWizard && (
                <TeamWizard
                    templates={teamTemplates}
                    roles={roles}
                    onSave={(teamData) => {
                        teamSvc.createTeam(teamData as Omit<RoleTeam, 'id'>);
                        refreshTeams();
                        setShowWizard(false);
                    }}
                    onCancel={() => setShowWizard(false)}
                />
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 12,
                }}
            >
                {teamTemplates.map((tpl) => {
                    const isUsed = teams.some((t) => t.name === tpl.name);
                    return (
                        <div
                            key={tpl.id}
                            style={{
                                ...card,
                                borderLeft: `3px solid ${tpl.color}`,
                                opacity: isUsed ? 0.5 : 1,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 10,
                                        alignItems: 'center',
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{tpl.icon}</span>
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                color: 'var(--slate-200)',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            {tpl.name}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                            {tpl.recommendedRoles.length} roles · {tpl.domain}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        teamSvc.createFromTemplate(tpl.id);
                                        refreshTeams();
                                    }}
                                    disabled={isUsed}
                                    style={{
                                        padding: '5px 10px',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: isUsed
                                            ? 'rgba(255,255,255,0.05)'
                                            : 'rgba(16,185,129,0.2)',
                                        color: isUsed ? '#64748b' : '#34d399',
                                        cursor: isUsed ? 'default' : 'pointer',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    <Play size={12} /> {isUsed ? 'Added' : 'Use'}
                                </button>
                            </div>
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-400)',
                                    marginTop: 6,
                                }}
                            >
                                {tpl.description}
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 4,
                                    flexWrap: 'wrap',
                                    marginTop: 8,
                                }}
                            >
                                {tpl.recommendedRoles.slice(0, 4).map((r) => (
                                    <span
                                        key={r}
                                        style={{ ...chip(tpl.color), fontSize: '0.6rem' }}
                                    >
                                        {r}
                                    </span>
                                ))}
                                {tpl.recommendedRoles.length > 4 && (
                                    <span style={{ ...chip('#64748b'), fontSize: '0.6rem' }}>
                                        +{tpl.recommendedRoles.length - 4}
                                    </span>
                                )}
                            </div>
                            <div
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--slate-500)',
                                    marginTop: 6,
                                }}
                            >
                                {tpl.useCases.join(' · ')}
                            </div>
                            <span
                                style={{
                                    ...chip(STRATEGY_COLORS[tpl.defaultStrategy] || '#64748b'),
                                    fontSize: '0.6rem',
                                    marginTop: 6,
                                }}
                            >
                                {tpl.defaultStrategy}
                            </span>
                        </div>
                    );
                })}
            </div>

            {teams.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: 8,
                            margin: '16px 0 12px',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: 8,
                                padding: 2,
                            }}
                        >
                            <button
                                onClick={() => setTeamsView('my-teams')}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background:
                                        teamsView === 'my-teams'
                                            ? 'rgba(59,130,246,0.2)'
                                            : 'transparent',
                                    color: teamsView === 'my-teams' ? '#60a5fa' : '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                }}
                            >
                                My Teams ({teams.length})
                            </button>
                            <button
                                onClick={() => setTeamsView('marketplace')}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background:
                                        teamsView === 'marketplace'
                                            ? 'rgba(16,185,129,0.2)'
                                            : 'transparent',
                                    color: teamsView === 'marketplace' ? '#10b981' : '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                }}
                            >
                                Marketplace ({teamTemplates.length})
                            </button>
                        </div>
                    </div>

                    {teamsView === 'my-teams' && teams.length === 0 && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: 30,
                                color: 'var(--slate-500)',
                                fontSize: '0.85rem',
                            }}
                        >
                            <Users size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                            <div>
                                No teams yet. Create your first team from the templates below!
                            </div>
                        </div>
                    )}

                    {teamsView === 'my-teams' && teams.length > 0 && (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: 10,
                            }}
                        >
                            {teams.map((tm) => (
                                <div
                                    key={tm.id}
                                    style={{
                                        ...card,
                                        borderLeft: `3px solid ${tm.color || '#64748b'}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'start',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 10,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <span style={{ fontSize: '1.3rem' }}>
                                                {tm.icon || '👥'}
                                            </span>
                                            <div>
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        color: 'var(--slate-200)',
                                                        fontSize: '0.9rem',
                                                    }}
                                                >
                                                    {tm.name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        color: 'var(--slate-400)',
                                                    }}
                                                >
                                                    {tm.roleIds.length} members
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTeam(tm.id)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: 6,
                                                border: 'none',
                                                background: 'var(--error-tint)',
                                                color: 'var(--error)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-400)',
                                            marginTop: 6,
                                        }}
                                    >
                                        {tm.description}
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 4,
                                            flexWrap: 'wrap',
                                            marginTop: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                ...chip(
                                                    STRATEGY_COLORS[tm.coordinationStrategy] ||
                                                        '#64748b',
                                                ),
                                                fontSize: '0.6rem',
                                            }}
                                        >
                                            {tm.coordinationStrategy}
                                        </span>
                                        <span
                                            style={{
                                                ...chip('#64748b'),
                                                fontSize: '0.6rem',
                                            }}
                                        >
                                            {tm.metadata?.domain || 'custom'}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 4,
                                            marginTop: 8,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <button
                                            onClick={() => setSelectedTeam(tm)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 6,
                                                border: 'none',
                                                background: 'rgba(99,102,241,0.12)',
                                                color: '#818cf8',
                                                cursor: 'pointer',
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <BarChart3 size={11} /> Details
                                        </button>
                                        <button
                                            onClick={() => setChatTeam(tm)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 6,
                                                border: 'none',
                                                background: 'rgba(139,92,246,0.12)',
                                                color: 'var(--purple-muted)',
                                                cursor: 'pointer',
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <MessageSquare size={11} /> Chat
                                        </button>
                                        <button
                                            onClick={() => handleTeamToDebate(tm)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 6,
                                                border: 'none',
                                                background: 'rgba(239,68,68,0.12)',
                                                color: '#f87171',
                                                cursor: 'pointer',
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <Zap size={11} /> Debate
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                        <input
                                            type="text"
                                            placeholder="Enter task for team..."
                                            value={taskInputs[tm.id] || ''}
                                            onChange={(e) =>
                                                setTaskInputs((prev) => ({
                                                    ...prev,
                                                    [tm.id]: e.target.value,
                                                }))
                                            }
                                            style={{
                                                flex: 1,
                                                padding: '6px 10px',
                                                borderRadius: 6,
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(0,0,0,0.2)',
                                                color: 'var(--slate-200)',
                                                fontSize: '0.75rem',
                                            }}
                                        />
                                        <button
                                            onClick={() => executeTeam(tm.id)}
                                            disabled={
                                                executingTeams.has(tm.id) ||
                                                !taskInputs[tm.id]?.trim()
                                            }
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 6,
                                                border: 'none',
                                                background: executingTeams.has(tm.id)
                                                    ? 'rgba(59,130,246,0.3)'
                                                    : 'rgba(59,130,246,0.2)',
                                                color: executingTeams.has(tm.id)
                                                    ? '#93c5fd'
                                                    : '#60a5fa',
                                                cursor: executingTeams.has(tm.id)
                                                    ? 'wait'
                                                    : 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <Play size={12} /> Run
                                        </button>
                                    </div>
                                    {execResults[tm.id] &&
                                        (() => {
                                            const execData = execResults[tm.id]!;
                                            return (
                                                <TeamPipeline
                                                    execution={execData}
                                                    strategy={tm.coordinationStrategy}
                                                />
                                            );
                                        })()}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedTeam && (
                <TeamDetailsPanel
                    team={selectedTeam}
                    executionMap={execResults}
                    onClose={() => setSelectedTeam(null)}
                    onDebate={handleTeamToDebate}
                    onChat={(team: RoleTeam) => setChatTeam(team)}
                />
            )}
            {chatTeam && <TeamChat team={chatTeam} onClose={() => setChatTeam(null)} />}
        </div>
    );
};

export default TeamsTab;
