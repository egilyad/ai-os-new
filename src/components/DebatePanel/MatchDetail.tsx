import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import type { TournamentMatch } from './tournament-types';
import { roleColors } from './tournament-constants';

interface Props {
    match: TournamentMatch;
    expandedMatch: string | null;
    onStartMatch?: (matchId: string) => void;
}

const MatchDetail: React.FC<Props> = ({ match, expandedMatch, onStartMatch }) => {
    if (expandedMatch !== match.id) return null;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
        >
            <div
                style={{
                    padding: '0.75rem',
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem',
                    }}
                >
                    <MessageSquare size={14} color="#3b82f6" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {match.topic}
                    </span>
                </div>
                <div
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: '0.6rem',
                                color: 'var(--slate-500)',
                                textTransform: 'uppercase',
                                marginBottom: '0.2rem',
                            }}
                        >
                            Participant A
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-200)', fontWeight: 600 }}>
                            {match.participantA.name}
                        </div>
                        <div
                            style={{
                                fontSize: '0.6rem',
                                color: roleColors[match.participantA.role],
                            }}
                        >
                            {match.participantA.role}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                fontSize: '0.6rem',
                                color: 'var(--slate-500)',
                                textTransform: 'uppercase',
                                marginBottom: '0.2rem',
                            }}
                        >
                            Result
                        </div>
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: match.winner ? '#10b981' : '#f59e0b',
                                fontWeight: 700,
                            }}
                        >
                            {match.winner === 'A' && '← Winner'}
                            {match.winner === 'B' && 'Winner →'}
                            {match.winner === 'draw' && 'Draw'}
                            {!match.winner && 'TBD'}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div
                            style={{
                                fontSize: '0.6rem',
                                color: 'var(--slate-500)',
                                textTransform: 'uppercase',
                                marginBottom: '0.2rem',
                            }}
                        >
                            Participant B
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-200)', fontWeight: 600 }}>
                            {match.participantB.name}
                        </div>
                        <div
                            style={{
                                fontSize: '0.6rem',
                                color: roleColors[match.participantB.role],
                            }}
                        >
                            {match.participantB.role}
                        </div>
                    </div>
                </div>
                {match.summary && (
                    <div
                        style={{
                            marginTop: '0.5rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            fontSize: '0.7rem',
                            color: 'var(--slate-400)',
                            lineHeight: 1.5,
                        }}
                    >
                        {match.summary}
                    </div>
                )}
                {match.status === 'pending' && onStartMatch && (
                    <button
                        onClick={() => onStartMatch(match.id)}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.4rem 1rem',
                            borderRadius: 6,
                            background: 'var(--accent)',
                            border: 'none',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                        }}
                    >
                        Start Match
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default MatchDetail;
