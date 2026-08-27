import React, { useCallback, useEffect, useState } from 'react';
import {
    Users,
    UserPlus,
    Link,
    Share2,
    X,
    Copy,
    Check,
    Trash2,
    Plus,
    MessageSquare,
    Server,
} from 'lucide-react';
import PanelLoader from './PanelLoader';
import { teamCollaborationService } from '../kernel/instances';
import type {
    Team,
    InviteLink,
    SharedSession,
    CollaborationPermission,
} from '../kernel/contracts/team-collaboration';

const PERMISSION_COLORS: Record<CollaborationPermission, string> = {
    view: '#94a3b8',
    comment: '#3b82f6',
    edit: '#f59e0b',
    admin: '#ef4444',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    debate: <Users size={14} />,
    topology: <Server size={14} />,
    prompt: <MessageSquare size={14} />,
    workflow: <Share2 size={14} />,
};

const CollaborationPanel: React.FC = () => {
    const [tab, setTab] = useState<'teams' | 'shared'>('teams');
    const [teams, setTeams] = useState<Team[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [teamDesc, setTeamDesc] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [invites, setInvites] = useState<InviteLink[]>([]);
    const [sharedSessions, setSharedSessions] = useState<SharedSession[]>([]);
    const [copied, setCopied] = useState<string | null>(null);
    const [memberName, setMemberName] = useState('');

    const refresh = useCallback(() => {
        setTeams(teamCollaborationService.getTeams());
        if (selectedTeam) {
            setInvites(teamCollaborationService.getInvites(selectedTeam));
            setSharedSessions(teamCollaborationService.getSharedSessions(selectedTeam));
        }
    }, [selectedTeam]);

    useEffect(() => {
        refresh();
    }, [selectedTeam, refresh]);

    const handleCreate = () => {
        if (!teamName.trim()) return;
        teamCollaborationService.createTeam(teamName.trim(), teamDesc.trim(), 'local-user');
        setTeamName('');
        setTeamDesc('');
        setShowCreate(false);
        refresh();
    };

    const handleCreateInvite = () => {
        if (!selectedTeam) return;
        const invite = teamCollaborationService.createInvite(
            selectedTeam,
            'view',
            10,
            'local-user',
        );
        setInvites((prev) => [...prev, invite]);
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleAddMember = () => {
        if (!selectedTeam || !memberName.trim()) return;
        teamCollaborationService.addMember(selectedTeam, {
            id: memberName.trim(),
            name: memberName.trim(),
            role: 'view',
        });
        setMemberName('');
        refresh();
    };

    const team = teams.find((t) => t.id === selectedTeam);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header + tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={20} color="#a855f7" />
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Team Collaboration</span>
                <div style={{ flex: 1 }} />
                <button
                    onClick={() => setTab('teams')}
                    style={{
                        padding: '0.3rem 0.8rem',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: tab === 'teams' ? 'rgba(168,85,247,0.15)' : 'transparent',
                        color: tab === 'teams' ? '#a855f7' : '#64748b',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                    }}
                >
                    Teams
                </button>
                <button
                    onClick={() => setTab('shared')}
                    style={{
                        padding: '0.3rem 0.8rem',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: tab === 'shared' ? 'rgba(168,85,247,0.15)' : 'transparent',
                        color: tab === 'shared' ? '#a855f7' : '#64748b',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                    }}
                >
                    Shared Sessions
                </button>
            </div>

            {tab === 'teams' && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {/* Team list */}
                    <div
                        style={{
                            width: 240,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                        }}
                    >
                        <button
                            onClick={() => setShowCreate(true)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: 8,
                                border: '1px dashed rgba(168,85,247,0.3)',
                                background: 'transparent',
                                color: '#a855f7',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                justifyContent: 'center',
                            }}
                        >
                            <Plus size={14} /> New Team
                        </button>
                        {showCreate && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.3rem',
                                    padding: '0.5rem',
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.03)',
                                }}
                            >
                                <input
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="Team name"
                                    style={{
                                        padding: '0.3rem 0.5rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.8rem',
                                    }}
                                />
                                <input
                                    value={teamDesc}
                                    onChange={(e) => setTeamDesc(e.target.value)}
                                    placeholder="Description"
                                    style={{
                                        padding: '0.3rem 0.5rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.8rem',
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    <button
                                        onClick={handleCreate}
                                        style={{
                                            flex: 1,
                                            padding: '0.3rem',
                                            borderRadius: 6,
                                            border: 'none',
                                            background: 'rgba(168,85,247,0.2)',
                                            color: '#a855f7',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        Create
                                    </button>
                                    <button
                                        onClick={() => setShowCreate(false)}
                                        style={{
                                            padding: '0.3rem 0.5rem',
                                            borderRadius: 6,
                                            border: 'none',
                                            background: 'var(--error-tint)',
                                            color: 'var(--error)',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                        {teams.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTeam(t.id)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    background:
                                        selectedTeam === t.id
                                            ? 'rgba(168,85,247,0.1)'
                                            : 'rgba(255,255,255,0.02)',
                                    color: selectedTeam === t.id ? '#a855f7' : '#e2e8f0',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                }}
                            >
                                {t.name}
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        fontWeight: 400,
                                    }}
                                >
                                    {t.members.length} members
                                </div>
                            </button>
                        ))}
                        {teams.length === 0 && !showCreate && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    color: 'var(--slate-500)',
                                    fontSize: '0.8rem',
                                }}
                            >
                                No teams yet. Create one to start collaborating.
                            </div>
                        )}
                    </div>

                    {/* Team detail */}
                    {team && (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                                    {team.name}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                    {team.description}
                                </span>
                                <div style={{ flex: 1 }} />
                                <button
                                    onClick={() => {
                                        teamCollaborationService.deleteTeam(team.id);
                                        setSelectedTeam(null);
                                        refresh();
                                    }}
                                    style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: 'var(--error-tint)',
                                        color: 'var(--error)',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Members */}
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        color: 'var(--slate-500)',
                                        marginBottom: '0.4rem',
                                    }}
                                >
                                    MEMBERS ({team.members.length})
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.3rem',
                                    }}
                                >
                                    {team.members.map((m) => (
                                        <div
                                            key={m.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.3rem 0.5rem',
                                                borderRadius: 6,
                                                background: 'rgba(255,255,255,0.02)',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem',
                                                    flex: 1,
                                                }}
                                            >
                                                {m.name}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: 4,
                                                    background: `${PERMISSION_COLORS[m.role as CollaborationPermission]}20`,
                                                    color: PERMISSION_COLORS[
                                                        m.role as CollaborationPermission
                                                    ],
                                                }}
                                            >
                                                {m.role}
                                            </span>
                                            {m.id !== 'local-user' && (
                                                <button
                                                    onClick={() => {
                                                        teamCollaborationService.removeMember(
                                                            team.id,
                                                            m.id,
                                                        );
                                                        refresh();
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--error)',
                                                        cursor: 'pointer',
                                                        padding: 2,
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div
                                    style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem' }}
                                >
                                    <input
                                        value={memberName}
                                        onChange={(e) => setMemberName(e.target.value)}
                                        placeholder="Add member name..."
                                        style={{
                                            flex: 1,
                                            padding: '0.3rem 0.5rem',
                                            borderRadius: 6,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(0,0,0,0.3)',
                                            color: 'var(--slate-200)',
                                            fontSize: '0.8rem',
                                        }}
                                    />
                                    <button
                                        onClick={handleAddMember}
                                        style={{
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: 6,
                                            border: 'none',
                                            background: 'rgba(59,130,246,0.15)',
                                            color: '#60a5fa',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        <UserPlus size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Invites */}
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.4rem',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            color: 'var(--slate-500)',
                                        }}
                                    >
                                        INVITE LINKS
                                    </span>
                                    <button
                                        onClick={handleCreateInvite}
                                        style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 6,
                                            border: 'none',
                                            background: 'var(--purple-tint)',
                                            color: '#a855f7',
                                            cursor: 'pointer',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        <Plus size={12} /> Generate
                                    </button>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.3rem',
                                    }}
                                >
                                    {invites.map((inv) => (
                                        <div
                                            key={inv.code}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.3rem 0.5rem',
                                                borderRadius: 6,
                                                background: 'rgba(255,255,255,0.02)',
                                            }}
                                        >
                                            <Link size={14} color="#64748b" />
                                            <code
                                                style={{
                                                    flex: 1,
                                                    fontSize: '0.75rem',
                                                    color: 'var(--slate-200)',
                                                }}
                                            >
                                                {inv.code}
                                            </code>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                                                {inv.useCount}/{inv.maxUses} used
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.65rem',
                                                    padding: '0.1rem 0.3rem',
                                                    borderRadius: 3,
                                                    background: `${PERMISSION_COLORS[inv.permission]}20`,
                                                    color: PERMISSION_COLORS[inv.permission],
                                                }}
                                            >
                                                {inv.permission}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(inv.code)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color:
                                                        copied === inv.code ? '#22c55e' : '#64748b',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {copied === inv.code ? (
                                                    <Check size={14} />
                                                ) : (
                                                    <Copy size={14} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    teamCollaborationService.revokeInvite(
                                                        team.id,
                                                        inv.code,
                                                    );
                                                    refresh();
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--error)',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {invites.length === 0 && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                            No invite links yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {tab === 'shared' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {teams.length === 0 ? (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '2rem',
                                color: 'var(--slate-500)',
                                fontSize: '0.8rem',
                            }}
                        >
                            Create a team first to share sessions.
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {teams.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTeam(t.id)}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: 8,
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            background:
                                                selectedTeam === t.id
                                                    ? 'rgba(168,85,247,0.1)'
                                                    : 'rgba(255,255,255,0.02)',
                                            color: selectedTeam === t.id ? '#a855f7' : '#e2e8f0',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                            {selectedTeam && (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.3rem',
                                    }}
                                >
                                    {sharedSessions.map((s) => (
                                        <div
                                            key={s.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.4rem 0.75rem',
                                                borderRadius: 8,
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                            }}
                                        >
                                            {TYPE_ICONS[s.type]}
                                            <div style={{ flex: 1 }}>
                                                <div
                                                    style={{ fontWeight: 600, fontSize: '0.85rem' }}
                                                >
                                                    {s.title}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        color: 'var(--slate-500)',
                                                    }}
                                                >
                                                    Shared by {s.sharedBy} ·{' '}
                                                    {new Date(s.sharedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: '0.65rem',
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: 4,
                                                    background: `${PERMISSION_COLORS[s.permission]}20`,
                                                    color: PERMISSION_COLORS[s.permission],
                                                }}
                                            >
                                                {s.permission}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.65rem',
                                                    color: 'var(--slate-500)',
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {s.type}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    teamCollaborationService.unshareSession(
                                                        selectedTeam,
                                                        s.id,
                                                    );
                                                    refresh();
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--error)',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {sharedSessions.length === 0 && (
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--slate-500)',
                                                padding: '1rem',
                                                textAlign: 'center',
                                            }}
                                        >
                                            No shared sessions in this team.
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default function CollaborationPanelWrapper() {
    return (
        <PanelLoader title="Team Collaboration">
            <CollaborationPanel />
        </PanelLoader>
    );
}
