import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import type {
    ExecutionMode,
    ExecutionTarget,
    InvocationContext,
    InvocationRequest,
} from '../../kernel/contracts/invocation';
import { invocationEngine } from '../../kernel/instances/services-extras';
import { agentService } from '../../kernel/instances/services-core';
import { useInvocationStore } from '../../stores/invocationStore';
import { StatusBadge, Button, AgentDisplay } from '../../components/Common';

interface AgentOption {
    id: string;
    name: string;
    role: string;
}

const WHERE_OPTIONS: { value: InvocationContext['type']; key: string }[] = [
    { value: 'room', key: 'room' },
    { value: 'forum-topic', key: 'forum' },
    { value: 'conversation', key: 'conversation' },
];

const MODE_OPTIONS: { value: ExecutionMode; key: string }[] = [
    { value: 'chat', key: 'chat' },
    { value: 'debate', key: 'debate' },
    { value: 'director-scenario', key: 'director-scenario' },
];

const CARD: React.CSSProperties = {
    margin: '0.75rem 0',
    padding: '0.6rem 0.75rem',
    borderRadius: 8,
    border: '1px solid rgba(34,211,238,0.3)',
    background: 'rgba(34,211,238,0.08)',
};

const LOG_ROW: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    padding: '0.3rem 0.5rem',
    borderRadius: 6,
    border: '1px solid #2a2a35',
    marginBottom: '0.35rem',
    fontSize: '0.78rem',
};

const AVATAR: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(34,211,238,0.25)',
    fontWeight: 600,
    fontSize: '0.8rem',
};

const FIELD: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: '0.75rem',
    opacity: 0.9,
};

/**
 * Room Panel (Step 6, human-facing surface).
 *
 * The UI is a PURE consumer of the Invocation Engine:
 *  - it raises an `InvocationRequest` via `invocationEngine.invoke` (the only
 *    write path, a method call — never a bus event);
 *  - it observes lifecycle + live output through `useInvocationStore`
 *    (fed by `invocation:*` + `conversation:*` events).
 * The human picks an Agent / Where / Mode / Task; the UI translates that into
 * the technical `InvocationRequest` (target { agentId }, context, constraints).
 * It does not own any `Invocation` state and never becomes an orchestrator.
 */
const RoomPanel: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const invocations = useInvocationStore((s) => s.invocations);
    const order = useInvocationStore((s) => s.order);
    const feed = useInvocationStore((s) => s.feed);
    const costs = useInvocationStore((s) => s.costs);
    const selectedId = useInvocationStore((s) => s.selectedId);
    const select = useInvocationStore((s) => s.select);
    const clearView = useInvocationStore((s) => s.clearView);
    const clearHistory = useInvocationStore((s) => s.clearHistory);
    // FX-04: the "Details" affordance exposes internal entity IDs / policyRef /
    // sessionRef to end users. Gate it behind dev-only so production users see
    // only human-meaningful labels (sessionRef.kind is already in the subtitle).
    const showDebugDetails = import.meta.env?.DEV ?? false;

    const [agents] = useState<AgentOption[]>(() => {
        try {
            return agentService.getAgents().map((a) => ({ id: a.id, name: a.name, role: a.role }));
        } catch {
            return [];
        }
    });
    const [agentId, setAgentId] = useState('');
    const [where, setWhere] = useState<InvocationContext['type']>('room');
    const [mode, setMode] = useState<ExecutionMode>('chat');
    const [task, setTask] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<Record<string, { task?: string }>>({});
    const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

    // Load persisted invocations (history survives page reload) and merge with
    // live events by id — no duplicates because both key on the same id.
    useEffect(() => {
        useInvocationStore.getState?.()?.ensureSubscribed?.();
        void useInvocationStore.getState().loadHistory();
        void useInvocationStore.getState().loadCosts();
        return () => {
            useInvocationStore.getState?.()?.destroy?.();
        };
    }, []);

    const openSession = (ref: ExecutionTarget) => {
        if (ref.kind === 'debate') navigate(`/debate?mode=runtime&sessionId=${ref.ref}`);
        else if (ref.kind === 'conversation') navigate(`/director?session=${ref.ref}`);
    };

    const idToName = useMemo(() => {
        const m: Record<string, string> = {};
        for (const a of agents) m[a.id] = a.name;
        return m;
    }, [agents]);

    // Scope the live feed to the selected invocation's session (honest, not a
    // global mix). Fall back to the most recent invocation that has a session,
    // otherwise show all feed while nothing is selected.
    const activeId =
        selectedId ?? order.find((id) => invocations[id]?.sessionRef) ?? order[0] ?? null;
    const activeSessionRef = activeId ? invocations[activeId]?.sessionRef : undefined;
    const scopedFeed = activeSessionRef
        ? feed.filter((e) => e.sessionId === activeSessionRef.ref)
        : feed;

    const handleInvoke = async () => {
        setError(null);
        if (!agentId || !task.trim()) {
            setError(t('room.invoke.validation'));
            return;
        }
        const req: InvocationRequest = {
            source: 'human-mention',
            caller: { kind: 'human', id: 'room-ui' },
            target: { agentId },
            reason: task.trim(),
            context: { type: where, ref: 'general' },
            constraints: { mode },
        };
        try {
            const inv = await invocationEngine.invoke(req);
            setMeta((m) => ({ ...m, [inv.id]: { task: task.trim() } }));
        } catch (e) {
            console.error('RoomPanel: invocation failed', e);
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes('no matching enabled policy')) {
                setError(t('room.error.noPolicy'));
            } else {
                setError(t('room.error.generic'));
            }
        }
    };

    const displayName = (id?: string): string => {
        if (!id) return t('room.unknownAgent');
        return idToName[id] ?? id;
    };

    return (
        <div>
            <h2 style={{ marginTop: 0 }}>{t('room.title')}</h2>
            <p style={{ opacity: 0.7 }}>{t('room.subtitle')}</p>

            {/* ── Invoke form (the single write path) ── */}
            <div style={CARD}>
                <div style={{ fontWeight: 600, marginBottom: '0.6rem' }}>
                    {t('room.invoke.heading')}
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        alignItems: 'flex-end',
                    }}
                >
                    <label style={FIELD}>
                        {t('room.invoke.agent')}
                        <select
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            style={{ minWidth: 200 }}
                        >
                            <option value="">{t('room.invoke.agentPlaceholder')}</option>
                            {agents.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name} — {a.role}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={FIELD}>
                        {t('room.invoke.where')}
                        <select
                            value={where}
                            onChange={(e) => setWhere(e.target.value as InvocationContext['type'])}
                        >
                            {WHERE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {t(`room.invoke.where.${o.key}`)}
                                </option>
                            ))}
                        </select>
                        <span style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: 2 }}>{t(`room.invoke.where.hint.${where}` as any)}</span>
                    </label>

                    <label style={FIELD}>
                        {t('room.invoke.mode')}
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as ExecutionMode)}
                        >
                            {MODE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {t(`room.invoke.mode.${o.key}`)}
                                </option>
                            ))}
                        </select>
                        <span style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: 2 }}>{t(`room.invoke.mode.hint.${mode}` as any)}</span>
                    </label>
                </div>

                <label style={{ ...FIELD, marginTop: 10 }}>
                    {t('room.invoke.task')}
                    <textarea
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        placeholder={t('room.invoke.taskPlaceholder')}
                        rows={2}
                        style={{ minWidth: 320, resize: 'vertical' }}
                    />
                </label>

                <div style={{ marginTop: 10 }}>
                    <Button variant="primary" onClick={handleInvoke}>
                        {t('room.invoke.submit')}
                    </Button>
                </div>
                {error && (
                    <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span>{error}</span>
                        {error === t('room.error.noPolicy') && (
                            <Button variant="ghost" size="sm" onClick={() => navigate('/policies')}>
                                {t('room.error.noPolicyAction')}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Invocation lifecycle list (read-only observer) ── */}
            <h3 style={{ margin: '1rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                {t('room.invocations.heading')}
                <Button variant="ghost" size="sm" onClick={() => clearHistory()}>
                    {t('room.clearHistory')}
                </Button>
            </h3>
            {order.length === 0 && (
                <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                    {t('room.invocations.empty')}
                </div>
            )}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {order.map((id) => {
                    const v = invocations[id]!;
                    const agentId = v.agents?.[0]?.id ?? (v.target && 'agentId' in v.target ? v.target.agentId : undefined);
                    const whereLabel = v.context ? t(`room.invoke.where.${v.context.type}`) : '';
                    const taskText = meta[id]?.task ?? v.reason;
                    const isOpen = !!openDetails[id];
                    return (
                        <li
                            key={id}
                            onClick={() => select(id)}
                            style={{
                                ...LOG_ROW,
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'flex-start',
                                cursor: 'pointer',
                                borderColor: id === activeId ? 'rgba(34,211,238,0.7)' : undefined,
                                background: id === activeId ? 'rgba(34,211,238,0.12)' : undefined,
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <AgentDisplay agentId={agentId || ''} variant="compact" size={28} />
                                <div style={{ opacity: 0.75, fontSize: '0.74rem', marginLeft: 36 }}>
                                    {whereLabel}
                                    {v.sessionRef ? ` · ${v.sessionRef.kind}` : ''}
                                </div>
                                {taskText && (
                                    <div
                                        style={{
                                            opacity: 0.85,
                                            fontSize: '0.74rem',
                                            marginTop: 2,
                                        }}
                                    >
                                        “{taskText}”
                                    </div>
                                )}
                                {v.rejectionReason && (
                                    <div style={{ color: '#f87171', fontSize: '0.74rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <span>{v.rejectionReason.includes('no matching enabled policy') ? t('room.error.noPolicy') : v.rejectionReason}</span>
                                        {v.rejectionReason.includes('no matching enabled policy') && (
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate('/policies'); }}>
                                                {t('room.error.noPolicyAction')}
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {isOpen && (
                                    <div
                                        style={{
                                            fontFamily: 'monospace',
                                            opacity: 0.6,
                                            fontSize: '0.7rem',
                                            marginTop: 4,
                                        }}
                                    >
                                        <div>id: {id.slice(0, 8)}</div>
                                        {v.policyRef && (
                                            <div>policy: {v.policyRef.slice(0, 8)}</div>
                                        )}
                                        {v.sessionRef && (
                                            <div>
                                                session: {v.sessionRef.kind}/
                                                {v.sessionRef.ref.slice(0, 8)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <StatusBadge status={v.status} label={t(`room.status.${v.status}`)} />
                            {costs[id] != null && (
                                <span
                                    className="badge"
                                    style={{ opacity: 0.8, fontSize: '0.68rem' }}
                                    title={`${t('room.invocation.cost')}`}
                                >
                                    {t('room.invocation.cost')}: ${costs[id]!.toFixed(4)}
                                </span>
                            )}
                            {v.sessionRef &&
                            (v.sessionRef.kind === 'conversation' ||
                                v.sessionRef.kind === 'debate') ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openSession(v.sessionRef!)}
                                >
                                    {t('room.invocation.openSession')}
                                </Button>
                            ) : null}
                            {showDebugDetails && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setOpenDetails((o) => ({ ...o, [id]: !o[id] }))}
                                >
                                    {t('room.invocation.details')}
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ul>

            {/* ── Live output from the execution subsystem (scoped to session) ── */}
            <h3 style={{ margin: '1rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                {t('room.feed.heading')}
                <Button variant="ghost" size="sm" onClick={() => clearView()}>
                    {t('room.clearView')}
                </Button>
            </h3>
            {activeSessionRef && activeId && (
                <div style={{ opacity: 0.6, fontSize: '0.72rem', marginBottom: 6 }}>
                    {t('room.feed.scoped', {
                        name: <AgentDisplay agentId={invocations[activeId]?.agents?.[0]?.id ?? (invocations[activeId]?.target && 'agentId' in invocations[activeId]!.target! ? invocations[activeId]!.target!.agentId : '')} variant="name" />
                    })}
                </div>
            )}
            {scopedFeed.length === 0 && (
                <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>{t('room.feed.empty')}</div>
            )}
            <div style={{ maxHeight: 240, overflowY: 'auto' }} role="log" aria-live="polite">
                {scopedFeed.map((e, i) => (
                    <div key={i} style={LOG_ROW}>
                        <span style={{ opacity: 0.6 }}>{new Date(e.at).toLocaleTimeString()}</span>
                        <span
                            style={{
                                color:
                                    e.kind === 'turn-error'
                                        ? '#f87171'
                                        : e.kind === 'turn-start'
                                          ? '#fbbf24'
                                          : '#86efac',
                            }}
                        >
                            {e.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomPanel;
