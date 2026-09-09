import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Clock, Trophy } from 'lucide-react';
import type { TournamentMatch } from './tournament-types';
import { statusColors, roleColors } from './tournament-constants';

interface Props {
    match: TournamentMatch;
    compact?: boolean;
    onClick?: () => void;
}

const MatchCard: React.FC<Props> = ({ match, compact, onClick }) => {
    const borderColor = statusColors[match.status];
    const isWinnerA = match.winner === 'A';
    const isWinnerB = match.winner === 'B';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClick}
            style={{
                padding: compact ? '0.5rem 0.6rem' : '0.75rem',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${borderColor}40`,
                borderLeft: `3px solid ${borderColor}`,
                cursor: onClick ? 'pointer' : 'default',
                minWidth: compact ? 140 : 200,
                transition: 'border-color 0.15s',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    marginBottom: '0.4rem',
                }}
            >
                {match.status === 'completed' && <CheckCircle2 size={10} color="#10b981" />}
                {match.status === 'active' && <Zap size={10} color="#3b82f6" />}
                {match.status === 'pending' && <Clock size={10} color="#64748b" />}
                <span
                    style={{
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        color: statusColors[match.status],
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    {match.status}
                </span>
                {match.strategy && (
                    <span style={{ fontSize: '0.5rem', color: 'var(--slate-500)', marginLeft: 'auto' }}>
                        {match.strategy}
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.3rem',
                        borderRadius: 4,
                        background: isWinnerA ? 'rgba(16,185,129,0.1)' : 'transparent',
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            color: roleColors[match.participantA.role],
                        }}
                    >
                        ●
                    </span>
                    <span
                        style={{
                            fontSize: '0.65rem',
                            fontWeight: isWinnerA ? 800 : 500,
                            color: isWinnerA ? '#10b981' : '#e2e8f0',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {match.participantA.name}
                    </span>
                    {isWinnerA && <Trophy size={10} color="#f59e0b" />}
                </div>
                <div
                    style={{
                        textAlign: 'center',
                        fontSize: '0.5rem',
                        color: 'var(--slate-500)',
                        fontWeight: 700,
                    }}
                >
                    vs
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.3rem',
                        borderRadius: 4,
                        background: isWinnerB ? 'rgba(16,185,129,0.1)' : 'transparent',
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            color: roleColors[match.participantB.role],
                        }}
                    >
                        ●
                    </span>
                    <span
                        style={{
                            fontSize: '0.65rem',
                            fontWeight: isWinnerB ? 800 : 500,
                            color: isWinnerB ? '#10b981' : '#e2e8f0',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {match.participantB.name}
                    </span>
                    {isWinnerB && <Trophy size={10} color="#f59e0b" />}
                </div>
            </div>

            {!compact && match.topic && (
                <div
                    style={{
                        marginTop: '0.4rem',
                        paddingTop: '0.3rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.6rem',
                        color: 'var(--slate-400)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {match.topic}
                </div>
            )}

            {!compact && match.status === 'completed' && match.argumentCount != null && (
                <div
                    style={{
                        marginTop: '0.3rem',
                        display: 'flex',
                        gap: '0.75rem',
                        fontSize: '0.5rem',
                        color: 'var(--slate-500)',
                    }}
                >
                    {match.rounds != null && <span>{match.rounds} rounds</span>}
                    {match.argumentCount != null && <span>{match.argumentCount} args</span>}
                    {match.convergenceScore != null && (
                        <span>{Math.round(match.convergenceScore * 100)}% conv.</span>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default MatchCard;
