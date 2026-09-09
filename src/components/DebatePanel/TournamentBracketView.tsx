import React, { useState, useMemo } from 'react';
import { Swords, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { glassPanel } from '../../styles/common';
import type { TournamentBracket } from './tournament-types';
import { generateBracket } from './generateBracket';
import MatchCard from './MatchCard';
import MatchDetail from './MatchDetail';

export type { TournamentMatch, TournamentRound, TournamentBracket } from './tournament-types';

const topics = [
    'AI alignment vs capability',
    'Open source vs proprietary LLMs',
    'RAG vs fine-tuning',
    'Temperature 0 vs higher values',
    'Chain-of-thought vs direct prompting',
    'Multi-agent vs single-agent',
];

const participants = [
    'Architect',
    'Critic',
    'Researcher',
    'Data Scientist',
    'Security Engineer',
    'DevOps',
    'Creative',
    'PM',
];

export const TournamentBracketView: React.FC<{
    bracket?: TournamentBracket;
    onStartMatch?: (matchId: string) => void;
}> = ({ bracket: externalBracket, onStartMatch }) => {
    const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
    const defaultBracket = useMemo(() => generateBracket(topics, participants), []);
    const bracket = externalBracket || defaultBracket;

    return (
        <div
            style={{
                ...glassPanel,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                        style={{
                            padding: '0.5rem',
                            background: 'rgba(239,68,68,0.15)',
                            borderRadius: 10,
                            border: '1px solid rgba(239,68,68,0.3)',
                        }}
                    >
                        <Swords size={20} color="#ef4444" />
                    </div>
                    <div>
                        <h3
                            style={{
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                color: 'var(--slate-50)',
                                margin: 0,
                            }}
                        >
                            Tournament Bracket
                        </h3>
                        <p style={{ fontSize: '0.7rem', color: 'var(--slate-400)', margin: 0 }}>
                            {bracket.rounds.length} rounds •{' '}
                            {bracket.rounds[0]?.matches.length || 0} matchups
                        </p>
                    </div>
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    display: 'flex',
                    gap: 0,
                    alignItems: 'stretch',
                    paddingBottom: '0.5rem',
                }}
            >
                {bracket.rounds.map((round, ri) => (
                    <div
                        key={`round-${ri}`}
                        style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}
                    >
                        <div
                            style={{
                                padding: '0.4rem 0.6rem',
                                marginBottom: '0.5rem',
                                textAlign: 'center',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    color: ri === bracket.rounds.length - 1 ? '#f59e0b' : '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {round.name}
                            </span>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-around',
                                gap: 0,
                            }}
                        >
                            {round.matches.map((match) => (
                                <div
                                    key={match.id}
                                    style={{ display: 'flex', alignItems: 'center' }}
                                >
                                    <div style={{ flex: 1, padding: '0.25rem 0.25rem 0.25rem 0' }}>
                                        <MatchCard
                                            match={match}
                                            compact
                                            onClick={() =>
                                                setExpandedMatch(
                                                    expandedMatch === match.id ? null : match.id,
                                                )
                                            }
                                        />
                                    </div>
                                    {ri < bracket.rounds.length - 1 && (
                                        <div
                                            style={{
                                                width: 20,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 12,
                                                    height: 1,
                                                    background: 'var(--border-default)',
                                                }}
                                            />
                                            <ChevronRight
                                                size={12}
                                                color="#475569"
                                                style={{ flexShrink: 0 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {(() => {
                    const match = bracket.rounds
                        .flatMap((r) => r.matches)
                        .find((m) => m.id === expandedMatch);
                    if (!match) return null;
                    return (
                        <MatchDetail
                            match={match}
                            expandedMatch={expandedMatch}
                            onStartMatch={onStartMatch}
                        />
                    );
                })()}
            </AnimatePresence>
        </div>
    );
};
