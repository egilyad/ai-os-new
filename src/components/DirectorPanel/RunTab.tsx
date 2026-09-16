import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { ConversationScenario } from '../../kernel/contracts/conversation/scenario';
import type { ConversationSession } from '../../kernel/contracts/conversation/session';
import type { TurnProposal } from '../../kernel/contracts/conversation/turn';
import { Button, AgentDisplay } from '../../components/Common';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { agentService } from '../../kernel/instances/services-core';
import { createDirectorControls } from '../../stores/directorController';
import { useDirectorStore } from '../../stores/directorStore';

const CARD: React.CSSProperties = {
    margin: '0.75rem 0',
    padding: '0.6rem 0.75rem',
    borderRadius: 8,
    border: '1px solid rgba(59,130,246,0.3)',
    background: 'rgba(59,130,246,0.08)',
};

const LOG_ROW: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    padding: '0.3rem 0.5rem',
    borderRadius: 6,
    border: '1px solid #2a2a35',
    marginBottom: '0.35rem',
};

type ObjectiveType = TurnProposal['objective']['type'];
const OVERRIDE_TYPES: ObjectiveType[] = [
    'INTRODUCE',
    'CRITIQUE',
    'RESPOND',
    'ANALYZE',
    'SUMMARIZE',
    'CHALLENGE',
    'CUSTOM',
];

/**
 * Run tab (B5.4c) — the full runtime UI bound to the Director runtime.
 *
 * The UI talks ONLY to `directorController` (which wraps `ConversationDirectorService`)
 * and observes live state through `DirectorStore` (fed by `conversation:*` events).
 * It never touches `ConversationDirectorService` directly and never becomes a second
 * orchestrator. `Override` reuses the existing `TurnProposal` contract.
 */
const RunTab: React.FC<{ scenario?: ConversationScenario | null }> = ({ scenario }) => {
    const { t } = useTranslation();
    const controls = useMemo(() => createDirectorControls(), []);
    const status = useDirectorStore((s) => s.status);
    const currentParticipantId = useDirectorStore((s) => s.currentParticipantId);
    const turnLog = useDirectorStore((s) => s.turnLog);
    const history = useDirectorStore((s) => s.history);

    // Rehydrate persisted past runs (Q7) on first mount.
    useEffect(() => {
        useDirectorStore.getState?.()?.ensureSubscribed?.();
        void controls.loadHistory();
        return () => {
            useDirectorStore.getState?.()?.destroy?.();
        };
    }, [controls]);

    const [overrideOpen, setOverrideOpen] = useState(false);
    const [overrideParticipant, setOverrideParticipant] = useState('');
    const [overrideType, setOverrideType] = useState<ObjectiveType>('CHALLENGE');
    const [overrideObjective, setOverrideObjective] = useState('');
    const [checkpointLabel, setCheckpointLabel] = useState('');

    if (!scenario) {
        return (
            <div>
                <h3 style={{ marginTop: 0 }}>{t('director.run.heading')}</h3>
                <p style={{ opacity: 0.75 }}>{t('director.run.noScenario')}</p>
            </div>
        );
    }

    const isRunning = status === 'running';
    const isPaused = status === 'paused';
    const busy = isRunning || isPaused;
    const canRun = !busy;

    // Live Session (blueprint separation) — distinct id per run, checkpoints
    // captured during the run. Read on every render so the card + list stay
    // in sync with the DirectorStore-driven re-renders.
    const session = controls.getSession();
    const checkpoints = controls.getCheckpoints();

    // Bind the "current objective" to the specific executed step (by its planned
    // turn index), not just the participant id — otherwise a participant that
    // appears in multiple turns would show the wrong objective. Falls back to the
    // Nth occurrence of that participant in the script when no step id is known.
    const currentTurn = (() => {
        if (currentParticipantId == null) return undefined;
        const running = [...turnLog]
            .reverse()
            .find((e) => e.status === 'running' && e.participantId === currentParticipantId);
        if (running && running.turnIndex != null && running.turnIndex >= 0) {
            return scenario.turns[running.turnIndex];
        }
        const occ = turnLog.filter((e) => e.participantId === currentParticipantId).length;
        const occIdxs = scenario.turns
            .map((t, i) => (t.participantId === currentParticipantId ? i : -1))
            .filter((i) => i >= 0);
        const target = occIdxs[Math.min(occ, occIdxs.length) - 1] ?? occIdxs[occIdxs.length - 1];
        return target != null ? scenario.turns[target] : undefined;
    })();

    // Progress accounting separates the scripted plan from operator-injected
    // overrides and failures, so injected turns no longer skew the percentage.
    const plannedTotal = scenario.turns.length;
    const plannedDone = turnLog.filter(
        (e) => e.injected !== true && e.status === 'complete',
    ).length;
    const injectedDone = turnLog.filter(
        (e) => e.injected === true && e.status === 'complete',
    ).length;
    const failed = turnLog.filter((e) => e.status === 'error').length;
    const progress = plannedTotal > 0 ? Math.round((plannedDone / plannedTotal) * 100) : 0;

    const conversationRoleOf = (pid?: string | null) =>
        pid ? scenario.participants.find((p) => p.id === pid)?.role : undefined;
    const currentIdentity = useMemo(
        () => resolveAgentIdentity(currentParticipantId ?? '', { resolver: agentService }),
        [currentParticipantId],
    );

    const handleRun = async () => {
        await controls.load(scenario.id);
        await controls.run();
    };

    const handleOverride = () => {
        if (!overrideParticipant || !overrideObjective) return;
        const proposal: TurnProposal = {
            participantId: overrideParticipant,
            objective: { type: overrideType, description: overrideObjective, constraints: [] },
        };
        controls.override(proposal);
        setOverrideOpen(false);
        setOverrideParticipant('');
        setOverrideType('CHALLENGE');
        setOverrideObjective('');
    };

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>{t('director.run.heading')}</h3>

            <div style={CARD}>
                <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                    {t('director.run.selected')}
                </div>
                <div style={{ fontWeight: 600 }}>{scenario.name}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                    {scenario.participants.length} · {scenario.turns.length} · v{scenario.version}
                </div>
                {session && (
                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                        {t('director.run.session')}: {session.id.slice(0, 8)}
                    </div>
                )}
            </div>

            <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
            >
                <span className={`badge status-${status}`}>
                    {t(`director.run.status.${status}`)}
                </span>
                {currentParticipantId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>
                            {t('director.run.current')}:
                        </span>
                        <AgentDisplay agentId={currentParticipantId} variant="compact" size={28} />
                    </div>
                )}
                {currentTurn && (
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                        {t('director.run.objective')}: {currentTurn.objective.description}
                    </span>
                )}
            </div>

            <div style={{ margin: '0.5rem 0' }}>
                <div
                    style={{
                        height: 8,
                        borderRadius: 4,
                        background: 'var(--border-default)',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)' }} />
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 4 }}>
                    {t('director.run.progress')}: {plannedDone}/{plannedTotal}{' '}
                    {t('director.run.progress.planned')}
                    {injectedDone > 0 &&
                        ` · ${injectedDone} ${t('director.run.progress.injected')}`}
                    {failed > 0 && ` · ${failed} ${t('director.run.progress.failed')}`}
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.5rem 0' }}>
                <Button variant="primary" onClick={handleRun} disabled={!canRun}>
                    {t('director.run.run')}
                </Button>
                <Button variant="secondary" onClick={() => controls.pause()} disabled={!isRunning}>
                    {t('director.run.pause')}
                </Button>
                <Button variant="secondary" onClick={() => controls.resume()} disabled={!isPaused}>
                    {t('director.run.resume')}
                </Button>
                <Button variant="secondary" onClick={() => controls.skip()} disabled={!busy}>
                    {t('director.run.skip')}
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => setOverrideOpen((o) => !o)}
                    disabled={!busy}
                >
                    {t('director.run.override')}
                </Button>
                <Button variant="danger" onClick={() => controls.abort()} disabled={!busy}>
                    {t('director.run.abort')}
                </Button>
                <input
                    value={checkpointLabel}
                    onChange={(e) => setCheckpointLabel(e.target.value)}
                    placeholder={t('director.run.checkpoint.label')}
                    style={{ width: 140 }}
                />
                <Button
                    variant="secondary"
                    onClick={() => {
                        controls.checkpoint(checkpointLabel || undefined);
                        setCheckpointLabel('');
                    }}
                    disabled={!session}
                >
                    {t('director.run.checkpoint')}
                </Button>
            </div>

            {overrideOpen && (
                <div style={CARD}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <select
                            value={overrideParticipant}
                            onChange={(e) => setOverrideParticipant(e.target.value)}
                        >
                            <option value="">{t('director.run.overrideParticipant')}</option>
                            {scenario.participants.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {resolveAgentIdentity(p.id, { resolver: agentService }).displayName} · {p.role}
                                </option>
                            ))}
                        </select>
                        <select
                            value={overrideType}
                            onChange={(e) => setOverrideType(e.target.value as ObjectiveType)}
                            aria-label={t('director.run.overrideType')}
                        >
                            {OVERRIDE_TYPES.map((tp) => (
                                <option key={tp} value={tp}>
                                    {t(`director.run.overrideType.${tp}`)}
                                </option>
                            ))}
                        </select>
                        <input
                            value={overrideObjective}
                            onChange={(e) => setOverrideObjective(e.target.value)}
                            placeholder={t('director.run.overrideObjective')}
                        />
                        <Button
                            variant="primary"
                            onClick={handleOverride}
                            disabled={!overrideParticipant || !overrideObjective}
                        >
                            {t('director.run.overrideSubmit')}
                        </Button>
                    </div>
                </div>
            )}

            {checkpoints.length > 0 && (
                <div style={{ margin: '0.5rem 0' }}>
                    <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                        {t('director.run.checkpoints')}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {checkpoints.map((c) => (
                            <li
                                key={c.id}
                                style={{ ...LOG_ROW, fontSize: '0.75rem', opacity: 0.8 }}
                            >
                                <span style={{ fontWeight: 600 }}>{c.label || '—'}</span>
                                <span style={{ opacity: 0.7 }}>
                                    {t('director.run.checkpoint.cursor')}: {c.cursor} ·{' '}
                                    {c.results.length}
                                </span>
                                <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>
                                    {new Date(c.at).toLocaleTimeString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <h4 style={{ margin: '1rem 0 0.5rem' }}>{t('director.run.log')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {turnLog.map((e, i) => {
                    return (
                        <li
                            key={i}
                            style={{ ...LOG_ROW, opacity: e.status === 'running' ? 1 : 0.8 }}
                        >
                            <AgentDisplay agentId={e.participantId} variant="compact" size={28} />
                            <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: 8 }}>
                                {t(`director.run.turnStatus.${e.status}`)}
                            </span>
                            {e.content && (
                                <span style={{ fontSize: '0.8rem', opacity: 0.9, marginLeft: 8 }}>
                                    {e.content}
                                </span>
                            )}
                            {e.success === false && (
                                <span style={{ color: '#f87171', fontSize: '0.75rem', marginLeft: 8 }}>
                                    {e.error}
                                </span>
                            )}
                        </li>
                    );
                })}
                {turnLog.length === 0 && (
                    <li style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                        {t('director.run.logEmpty')}
                    </li>
                )}
            </ul>

            <h4 style={{ margin: '1rem 0 0.5rem' }}>{t('director.run.history')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {history.map((h: ConversationSession) => (
                    <li key={h.id} style={{ ...LOG_ROW, fontSize: '0.75rem', opacity: 0.85 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 600 }}>{h.scenarioName}</span>
                            <span style={{ opacity: 0.7 }}>
                                {t('director.run.history.status')}: {h.status} ·{' '}
                                {t('director.run.history.checkpoints')}: {h.checkpoints.length} ·{' '}
                                {new Date(h.updatedAt).toLocaleString()}
                            </span>
                        </div>
                    </li>
                ))}
                {history.length === 0 && (
                    <li style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                        {t('director.run.history.empty')}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default RunTab;
