import React from 'react';
import { Play, Pause, Square, Activity, Download, FileText } from 'lucide-react';
import { debateEngine, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('DebateSessionHeader');
import type { DebateSession } from '../../kernel/instances';
import { buildDebateMarkdown } from './debate-markdown';
import { debateStatusDot, debateStatusText, flexGap2 } from '../../styles/common';
import { Button } from '../Common';

interface DebateSessionHeaderProps {
    session: DebateSession;
    now: number;
    factCheckLevel: 'off' | 'sampled' | 'all';
    onFactCheckLevelChange: (level: 'off' | 'sampled' | 'all') => void;
    isMountedRef: React.MutableRefObject<boolean>;
    setError: (error: string | null) => void;
    clearError: () => void;
    t: (key: string) => string;
}

export const DebateSessionHeader: React.FC<DebateSessionHeaderProps> = ({
    session,
    now,
    factCheckLevel,
    onFactCheckLevelChange,
    isMountedRef,
    setError,
    clearError,
    t,
}) => {
    const isActive = session.status === 'active';
    const isPaused = session.status === 'paused';
    const isTerminal =
        session.status === 'completed' ||
        session.status === 'cancelled' ||
        session.status === 'failed';

    const handlePause = () => {
        try {
            debateEngine.pauseSession(session.id);
            setError(null);
        } catch {
            if (isMountedRef.current) {
                setError(t('debate.error_pause'));
                clearError();
            }
        }
    };

    const handleResume = () => {
        try {
            debateEngine.resumeSession(session.id);
            setError(null);
        } catch {
            if (isMountedRef.current) {
                setError(t('debate.error_resume'));
                clearError();
            }
        }
    };

    const handleStop = () => {
        LOGGER.info('DebateSessionHeader', 'Stop clicked', {
            id: session.id,
            status: session.status,
            phase: (session as { status?: string }).status,
        });
        try {
            debateEngine.cancelSession(session.id);
            LOGGER.info('DebateSessionHeader', 'cancelSession OK', { id: session.id });
            setError(null);
        } catch (e) {
            if (isMountedRef.current) {
                LOGGER.error('DebateSessionHeader', 'cancelSession failed', { error: e });
                setError(t('debate.error_stop'));
                clearError();
            }
        }
    };

    const handleExportJson = () => {
        const exportData = {
            topic: session.topic,
            strategy: session.strategy,
            status: session.status,
            maxRounds: session.maxRounds,
            currentRound: session.currentRound,
            participants: (session.participants ?? []).map((p) => ({
                id: p.id,
                name: p.name,
                role: p.role,
                model: p.modelId,
            })),
            arguments: (session.arguments ?? []).map((a) => ({
                id: a.id,
                agentId: a.agentId,
                content: a.content,
                round: a.round,
                timestamp: a.timestamp,
                confidence: a.confidence,
            })),
            graphMetrics: session.graphMetrics,
            interpretation: session.interpretation,
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debate-${(session.topic ?? '').slice(0, 50).replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportMarkdown = () => {
        const md = buildDebateMarkdown(session);
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debate-${(session.topic ?? '').slice(0, 50).replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="debate-header-session">
            <div className="debate-status-badge">
                <span style={debateStatusText}>
                    <Activity size={16} color="#a855f7" aria-hidden="true" />{' '}
                    {t('debate.round')
                        .replace('{0}', String(session.currentRound))
                        .replace('{1}', String(session.maxRounds))}
                    <span style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                        {' | '}
                        {session.arguments?.filter((a) => a.round === session.currentRound)
                            .length ?? 0}{' '}
                        args
                    </span>
                    {isActive &&
                        (() => {
                            const roundArgs = (session.arguments ?? []).filter(
                                (a) => a.round === session.currentRound,
                            );
                            const firstTs =
                                roundArgs.length > 0
                                    ? Math.min(...roundArgs.map((a) => a.timestamp ?? now))
                                    : now;
                            const elapsed = Math.floor((now - firstTs) / 1000);
                            const mins = Math.floor(elapsed / 60);
                            const secs = elapsed % 60;
                            return (
                                <span
                                    style={{
                                        color: 'var(--slate-500)',
                                        fontSize: '0.7rem',
                                        fontFamily: 'monospace',
                                        marginLeft: 6,
                                    }}
                                >
                                    ⏱ {String(mins).padStart(2, '0')}:
                                    {String(secs).padStart(2, '0')}
                                </span>
                            );
                        })()}
                </span>
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: isActive ? '#10b981' : isPaused ? '#f59e0b' : '#64748b',
                    }}
                >
                    {isActive ? (
                        <div className="pulsing" style={debateStatusDot} />
                    ) : (
                        <Pause size={14} />
                    )}
                    {(session.status ?? 'active').toUpperCase()}
                    {session.consensus && (
                        <span style={{ marginLeft: 8, color: '#34d399', fontSize: '0.7rem' }}>
                            (Consensus: {session.consensus})
                        </span>
                    )}
                </span>
            </div>

            <div style={flexGap2}>
                {isActive ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePause}
                        className="btn-secondary"
                        style={{
                            color: 'var(--warning)',
                            borderColor: 'rgba(245,158,11,0.2)',
                            background: 'rgba(245,158,11,0.05)',
                        }}
                        title={t('debate.pause')}
                        aria-label={t('debate.pause')}
                    >
                        <Pause size={18} aria-hidden="true" />
                    </Button>
                ) : isPaused ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResume}
                        className="btn-secondary"
                        style={{
                            color: 'var(--success)',
                            borderColor: 'rgba(16,185,129,0.2)',
                            background: 'rgba(16,185,129,0.05)',
                        }}
                        title={t('debate.resume')}
                        aria-label={t('debate.resume')}
                    >
                        <Play size={18} fill="currentColor" aria-hidden="true" />
                    </Button>
                ) : null}
                {!isTerminal && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStop}
                        className="btn-secondary"
                        style={{
                            color: 'var(--error)',
                            borderColor: 'rgba(239,68,68,0.2)',
                            background: 'rgba(239,68,68,0.05)',
                        }}
                        title={t('debate.stop')}
                        aria-label={t('debate.stop')}
                    >
                        <Square size={18} fill="currentColor" aria-hidden="true" />
                    </Button>
                )}
                {!isTerminal && (
                    <select
                        value={factCheckLevel}
                        onChange={(e) =>
                            onFactCheckLevelChange(e.target.value as 'off' | 'sampled' | 'all')
                        }
                        style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            background: 'rgba(30,30,50,0.8)',
                            color: 'var(--slate-200)',
                            border: '1px solid rgba(100,116,139,0.3)',
                            cursor: 'pointer',
                        }}
                        title="Fact-Check Level"
                    >
                        <option value="off">Fact-Check: Off</option>
                        <option value="sampled">Fact-Check: Sampled</option>
                        <option value="all">Fact-Check: All</option>
                    </select>
                )}
                {session.status === 'completed' && (
                    <div style={{ position: 'relative', display: 'inline-flex', gap: 0 }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleExportJson}
                            className="btn-secondary"
                            style={{
                                color: 'var(--accent)',
                                borderColor: 'rgba(59,130,246,0.2)',
                                background: 'rgba(59,130,246,0.05)',
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                            }}
                            title="Export JSON"
                            aria-label="Export debate as JSON"
                        >
                            <Download size={18} aria-hidden="true" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleExportMarkdown}
                            className="btn-secondary"
                            style={{
                                color: 'var(--success)',
                                borderColor: 'rgba(16,185,129,0.2)',
                                background: 'rgba(16,185,129,0.05)',
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                borderLeft: 'none',
                            }}
                            title="Export Markdown"
                            aria-label="Export debate as Markdown"
                        >
                            <FileText size={18} aria-hidden="true" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebateSessionHeader;
