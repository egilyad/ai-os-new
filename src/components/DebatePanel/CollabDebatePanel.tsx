import React, { useState, useEffect, useRef } from 'react';
import {
    Users,
    UserPlus,
    UserMinus,
    Send,
    MessageSquare,
    Shield,
    Swords,
    Scale,
} from 'lucide-react';
import { collaborativeService, eventBus, rootLogger } from '../../kernel/instances';
import type { DebateSession } from '../../kernel/contracts/debate-types';
import type { CollabRole, HumanParticipant } from '../../kernel/services/collaborative-service';
const LOGGER = rootLogger.child('CollabDebatePanel');

const ROLE_ICONS: Record<CollabRole, React.ReactNode> = {
    pro: <Swords size={14} />,
    con: <Shield size={14} />,
    judge: <Scale size={14} />,
    neutral: <MessageSquare size={14} />,
};

const ROLE_COLORS: Record<CollabRole, string> = {
    pro: '#3b82f6',
    con: '#ef4444',
    judge: '#f59e0b',
    neutral: '#94a3b8',
};

interface Props {
    session: DebateSession;
    getAgentLabel: (id: string) => string;
}

const CollabDebatePanel: React.FC<Props> = ({ session }) => {
    const [userName, setUserName] = useState('');
    const [role, setRole] = useState<CollabRole>('pro');
    const [participants, setParticipants] = useState<HumanParticipant[]>([]);
    const [message, setMessage] = useState('');
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        const unsub = eventBus.onSafe<DebateSession>('debate:updated', () => {
            if (!isMounted.current) return;
            queueMicrotask(() => {
                if (isMounted.current) {
                    setParticipants(collaborativeService.getParticipants(session.id));
                }
            });
        });
        return unsub;
    }, [session.id]);

    const handleJoin = async () => {
        if (!userName.trim()) return;
        setError(null);
        try {
            await collaborativeService.joinDebate(session.id, userName.trim(), role);
            setJoined(true);
            setParticipants(collaborativeService.getParticipants(session.id));
        } catch (err) {
            LOGGER.warn('CollabDebatePanel', 'Failed to join', { error: err });
            setError(err instanceof Error ? err.message : 'Failed to join debate');
        }
    };

    const handleLeave = () => {
        collaborativeService.leaveDebate(session.id, userName.trim());
        setJoined(false);
        setParticipants(collaborativeService.getParticipants(session.id));
    };

    const handleSend = async () => {
        if (!message.trim()) return;
        await collaborativeService.submitArgument(session.id, userName.trim(), message.trim());
        setMessage('');
    };

    return (
        <div
            style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                padding: '1rem 2rem',
                background: 'rgba(0,0,0,0.15)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                <Users size={16} color="#a855f7" />
                <span style={{ fontWeight: 700, color: 'var(--slate-200)', fontSize: '0.9rem' }}>
                    Collaborative Mode
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                    {participants.length} human participant{participants.length !== 1 ? 's' : ''}
                </span>
            </div>

            {!joined ? (
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Your name"
                        style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                            width: 140,
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    />
                    {(['pro', 'con', 'judge', 'neutral'] as CollabRole[]).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background:
                                    role === r ? `${ROLE_COLORS[r]}20` : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${role === r ? ROLE_COLORS[r] : 'rgba(255,255,255,0.1)'}`,
                                color: role === r ? ROLE_COLORS[r] : '#94a3b8',
                            }}
                        >
                            {ROLE_ICONS[r]} {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                    <button
                        onClick={handleJoin}
                        style={{
                            padding: '0.4rem 1rem',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background: 'rgba(168,85,247,0.15)',
                            border: '1px solid rgba(168,85,247,0.3)',
                            color: '#a855f7',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <UserPlus size={16} /> Join
                    </button>
                    {error && (
                        <div
                            style={{
                                width: '100%',
                                padding: '0.4rem 0.75rem',
                                borderRadius: 8,
                                background: 'var(--error-tint)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: 'var(--error)',
                                fontSize: '0.75rem',
                            }}
                        >
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', gap: 6 }}>
                        {participants.map((p) => (
                            <span
                                key={p.userName}
                                style={{
                                    padding: '2px 10px',
                                    borderRadius: 6,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    background: `${ROLE_COLORS[p.role]}20`,
                                    border: `1px solid ${ROLE_COLORS[p.role]}40`,
                                    color: ROLE_COLORS[p.role],
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {ROLE_ICONS[p.role]} {p.userName}
                            </span>
                        ))}
                    </div>
                    <div style={{ flex: 1, display: 'flex', gap: '0.5rem', minWidth: 200 }}>
                        {role === 'judge' ? (
                            <span
                                style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--warning)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <Scale size={14} /> Judge — rate arguments using the vote panel
                            </span>
                        ) : (
                            <>
                                <input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={`Your ${role} argument...`}
                                    style={{
                                        flex: 1,
                                        padding: '0.4rem 0.75rem',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.85rem',
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button
                                    onClick={handleSend}
                                    style={{
                                        padding: '0.4rem 0.75rem',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        background: `${ROLE_COLORS[role]}20`,
                                        border: `1px solid ${ROLE_COLORS[role]}40`,
                                        color: ROLE_COLORS[role],
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    <Send size={14} />
                                </button>
                            </>
                        )}
                    </div>
                    <button
                        onClick={handleLeave}
                        style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background: 'var(--error-tint)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: 'var(--error)',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <UserMinus size={14} /> Leave
                    </button>
                </div>
            )}
        </div>
    );
};

export default CollabDebatePanel;
