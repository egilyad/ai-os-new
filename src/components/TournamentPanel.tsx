import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { autoDebateService } from '../kernel/instances';
import PanelLoader from './PanelLoader';
import { useTranslation } from '../i18n/useTranslation';
import type { TournamentResult } from '../kernel/contracts/auto-debate';

const TournamentPanel: React.FC = () => {
    const { t } = useTranslation();
    const [topic, setTopic] = useState('');
    const [participantCount, setParticipantCount] = useState(6);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<TournamentResult | null>(null);
    const [progress, setProgress] = useState('');
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const run = useCallback(async () => {
        setRunning(true);
        setResult(null);
        setProgress(t('debate.tournament_creating'));
        try {
            const tpc = topic.trim() || 'Should AI be regulated?';
            const r = await autoDebateService.runTournament(tpc, participantCount);
            if (!mountedRef.current) return;
            setResult(r);
            setProgress('');
        } catch (e) {
            if (!mountedRef.current) return;
            setProgress(`Error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            if (mountedRef.current) setRunning(false);
        }
    }, [topic, participantCount, t]);

    return (
        <PanelLoader title={t('debate.tournament_title')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 800 }}>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-end',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            {t('debate.tournament_topic')}
                        </div>
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={t('debate.tournament_topic_ph')}
                            style={{
                                width: '100%',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'var(--text-primary)',
                                fontSize: '0.8rem',
                            }}
                        />
                    </div>
                    <div style={{ width: 100 }}>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            {t('debate.tournament_participants')}
                        </div>
                        <input
                            type="number"
                            min={2}
                            max={20}
                            value={participantCount}
                            onChange={(e) =>
                                setParticipantCount(
                                    Math.max(2, Math.min(20, Number(e.target.value))),
                                )
                            }
                            style={{
                                width: '100%',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'var(--text-primary)',
                                fontSize: '0.8rem',
                            }}
                        />
                    </div>
                    <button
                        onClick={run}
                        disabled={running}
                        style={{
                            padding: '0.4rem 1.2rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: running ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.8)',
                            color: '#fff',
                            cursor: running ? 'default' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                        }}
                    >
                        {running ? t('debate.tournament_running') : t('debate.tournament_start')}
                    </button>
                </div>

                {progress && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {progress}
                    </div>
                )}

                {result && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                    >
                        <div
                            style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                            }}
                        >
                            {t('debate.tournament_results')}
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    fontWeight: 400,
                                    marginLeft: '0.5rem',
                                }}
                            >
                                {t('debate.tournament_meta', {
                                    p: result.participants.length,
                                    m: result.matches.length,
                                    s: (result.durationMs / 1000).toFixed(1),
                                })}
                            </span>
                        </div>

                        <div
                            style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            {t('debate.tournament_topic_label', { topic: result.topic })}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                }}
                            >
                                {t('debate.tournament_rankings')}
                            </div>
                            {result.rankings.map((r, i) => (
                                <div
                                    key={r.name}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.4rem 0.75rem',
                                        borderRadius: '6px',
                                        background:
                                            i === 0
                                                ? 'rgba(255,215,0,0.08)'
                                                : 'rgba(255,255,255,0.02)',
                                        border:
                                            i === 0
                                                ? '1px solid rgba(255,215,0,0.2)'
                                                : '1px solid rgba(255,255,255,0.05)',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 20,
                                            textAlign: 'center',
                                            fontSize: '0.8rem',
                                            color:
                                                i === 0
                                                    ? '#ffd700'
                                                    : i < 3
                                                      ? '#c0c0c0'
                                                      : 'var(--text-muted)',
                                        }}
                                    >
                                        {i === 0
                                            ? '🥇'
                                            : i === 1
                                              ? '🥈'
                                              : i === 2
                                                ? '🥉'
                                                : `#${i + 1}`}
                                    </span>
                                    <span
                                        style={{
                                            flex: 1,
                                            fontSize: '0.8rem',
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        {r.name}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>
                                        {t('debate.tournament_wins', { n: r.wins })}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--error)' }}>
                                        {t('debate.tournament_losses', { n: r.losses })}
                                    </span>
                                    <span
                                        style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                                    >
                                        {t('debate.tournament_score', {
                                            s: `${r.score > 0 ? '+' : ''}${r.score}`,
                                        })}
                                    </span>
                                    <div
                                        style={{
                                            width: 80,
                                            height: 6,
                                            borderRadius: 3,
                                            background: 'rgba(255,255,255,0.05)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                borderRadius: 3,
                                                width: `${Math.max(5, (r.wins / Math.max(1, r.wins + r.losses)) * 100)}%`,
                                                background: 'var(--success)',
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginTop: '0.5rem',
                            }}
                        >
                            {t('debate.tournament_matches')}
                        </div>
                        {result.matches.map((m) => (
                            <div
                                key={m.pairId}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    fontSize: '0.75rem',
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
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <span
                                            style={{
                                                color:
                                                    m.winner === m.participantA
                                                        ? '#22c55e'
                                                        : m.winner === m.participantB
                                                          ? '#ef4444'
                                                          : 'var(--text-muted)',
                                            }}
                                        >
                                            {m.participantA}
                                        </span>
                                        <span
                                            style={{
                                                color: 'var(--text-muted)',
                                                fontSize: '0.65rem',
                                            }}
                                        >
                                            {t('debate.tournament_vs')}
                                        </span>
                                        <span
                                            style={{
                                                color:
                                                    m.winner === m.participantB
                                                        ? '#22c55e'
                                                        : m.winner === m.participantA
                                                          ? '#ef4444'
                                                          : 'var(--text-muted)',
                                            }}
                                        >
                                            {m.participantB}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.5rem',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {m.completed ? (
                                            m.winner ? (
                                                <span
                                                    style={{ color: 'var(--success)', fontSize: '0.7rem' }}
                                                >
                                                    {t('debate.tournament_winner', { name: m.winner })}
                                                </span>
                                            ) : m.draw ? (
                                                <span
                                                    style={{ color: 'var(--warning)', fontSize: '0.7rem' }}
                                                >
                                                    {t('debate.tournament_draw')}
                                                </span>
                                            ) : null
                                        ) : m.sessionStatus === 'cancelled' ? (
                                            <span style={{ color: 'var(--warning)', fontSize: '0.7rem' }}>
                                                {t('debate.tournament_cancelled')}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--error)', fontSize: '0.7rem' }}>
                                                {t('debate.tournament_failed')}
                                            </span>
                                        )}
                                        <span
                                            style={{
                                                color: 'var(--text-muted)',
                                                fontSize: '0.65rem',
                                            }}
                                        >
                                            {t('debate.tournament_secs', {
                                                s: (m.durationMs / 1000).toFixed(1),
                                            })}
                                        </span>
                                    </div>
                                </div>
                                {m.error && (
                                    <div
                                        style={{
                                            color: 'var(--error)',
                                            fontSize: '0.65rem',
                                            marginTop: '0.25rem',
                                        }}
                                    >
                                        {m.error}
                                    </div>
                                )}
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </PanelLoader>
    );
};

export default TournamentPanel;
