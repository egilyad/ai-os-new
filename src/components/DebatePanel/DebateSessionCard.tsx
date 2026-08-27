import { ChevronDown, ChevronRight, MessageSquare, Clock } from 'lucide-react';
import type { DebateSession } from '../../kernel/contracts/debate-types';
import { CONCLUSION_COLORS, getConclusionType } from './debate-memory-helpers';

interface Props {
    session: DebateSession;
    isExpanded: boolean;
    onToggle: () => void;
}

const DebateSessionCard: React.FC<Props> = ({ session, isExpanded, onToggle }) => {
    const argCount = (session.arguments ?? []).length;
    const conclusionType = getConclusionType(session.convergenceScore);

    return (
        <div
            style={{
                padding: '0.65rem 0.75rem',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s',
            }}
            onClick={onToggle}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {isExpanded ? (
                    <ChevronDown size={14} color="var(--text-muted)" />
                ) : (
                    <ChevronRight size={14} color="var(--text-muted)" />
                )}
                <span
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: CONCLUSION_COLORS[conclusionType] || '#6b7280',
                    }}
                />
                <span
                    style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {session.topic}
                </span>
                <span
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                    }}
                >
                    <MessageSquare size={10} /> {argCount}
                </span>
                <span
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                    }}
                >
                    <Clock size={10} />{' '}
                    {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : '—'}
                </span>
            </div>
            {session.consensus && (
                <p
                    style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        margin: '4px 0 0 20px',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: isExpanded ? undefined : 2,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {session.consensus}
                </p>
            )}
            {isExpanded && (
                <div
                    style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            marginBottom: 6,
                        }}
                    >
                        Key Arguments ({Math.min(5, argCount)} of {argCount})
                    </div>
                    {(session.arguments ?? []).slice(-5).map((arg) => (
                        <div
                            key={arg.id}
                            style={{
                                padding: '0.35rem 0.5rem',
                                marginBottom: 4,
                                borderRadius: 6,
                                background: 'rgba(255,255,255,0.02)',
                                borderLeft: '3px solid rgba(139,92,246,0.3)',
                                fontSize: '0.72rem',
                                color: 'var(--text-main)',
                                lineHeight: 1.4,
                            }}
                        >
                            <span style={{ fontWeight: 600, color: '#a855f7' }}>
                                {arg.agentName}
                            </span>
                            : {arg.content.slice(0, 200)}
                            {arg.content.length > 200 ? '...' : ''}
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <Badge>
                            Rounds: {session.currentRound}/{session.maxRounds}
                        </Badge>
                        <Badge>Convergence: {Math.round(session.convergenceScore * 100)}%</Badge>
                        <Badge>Participants: {session.participants?.length ?? 0}</Badge>
                    </div>
                </div>
            )}
        </div>
    );
};

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
        style={{
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.04)',
            padding: '2px 8px',
            borderRadius: 4,
        }}
    >
        {children}
    </div>
);

export default DebateSessionCard;
