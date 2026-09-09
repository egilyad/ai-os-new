import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useCrewStore } from '../../stores/crewStore';
import { useCouncilStore } from '../../stores/councilStore';
import { useGraphStore } from '../../stores/graphStore';
import { usePersonaStore } from '../../stores/personaStore';
import { useOpsStore } from '../../stores/opsStore';
import { useInteropStore } from '../../stores/interopStore';
import { useMetaStore } from '../../stores/metaStore';
import { useTrustStore } from '../../stores/trustStore';
import { useFrontierStore } from '../../stores/frontierStore';
import { useRivalStore } from '../../stores/rivalStore';
import {
    agentForgeService,
    appBuilderService,
    argTechService,
    assistantService,
    autonomyService,
    codeAgentService,
    councilService,
    crewService,
    deckService,
    dotpromptService,
    dshService,
    dyadService,
    ecosystemService,
    evalService,
    federationService,
    formatService,
    forumPlusService,
    frontierOpsService,
    gensparkService,
    governanceService,
    graphService,
    groupChatService,
    gymService,
    hierarchyService,
    ideService,
    knowledgeService,
    malmoService,
    manusService,
    mesaService,
    meterService,
    mobileAccessService,
    n8nService,
    netLogoService,
    notebookService,
    openClawService,
    promptHubService,
    ragService,
    reactService,
    reflexionService,
    sharedContextService,
    supportService,
    totService,
} from '../../kernel/instances/services-extras';
import type { DebateFormatId } from '../../kernel/contracts/debateplus';

type FleetTab =
    | 'crews'
    | 'councils'
    | 'graphs'
    | 'persona'
    | 'ops'
    | 'interop'
    | 'meta'
    | 'trust'
    | 'frontier'
    | 'rivals';

const TABS: FleetTab[] = [
    'crews',
    'councils',
    'graphs',
    'persona',
    'ops',
    'interop',
    'meta',
    'trust',
    'frontier',
    'rivals',
];

const btn: React.CSSProperties = {
    padding: '0.4rem 0.8rem',
    borderRadius: 6,
    cursor: 'pointer',
    border: '1px solid #2a2a35',
    background: 'transparent',
    color: 'inherit',
};

const primaryBtn: React.CSSProperties = { ...btn, background: '#3b82f6', color: '#fff' };

const card: React.CSSProperties = {
    border: '1px solid #2a2a35',
    borderRadius: 8,
    padding: '0.6rem 0.8rem',
    marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    borderRadius: 6,
    border: '1px solid #2a2a35',
    background: 'transparent',
    color: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
};

function Section(props: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>{props.title}</h3>
            {props.children}
        </div>
    );
}

function useAsyncError(): [string | null, (e: unknown) => void, () => void] {
    const [error, setError] = useState<string | null>(null);
    return [
        error,
        (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
        () => setError(null),
    ];
}

function CrewsTab() {
    const { t } = useTranslation();
    const crews = useCrewStore((s) => s.crews);
    const refresh = useCrewStore((s) => s.refresh);
    const [goal, setGoal] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, onError, clearError] = useAsyncError();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const run = async (id: string) => {
        setBusy(true);
        clearError();
        try {
            await crewService.startCrew(id);
            await refresh();
        } catch (e) {
            onError(e);
        } finally {
            setBusy(false);
        }
    };

    const forge = async () => {
        if (!goal.trim()) return;
        setBusy(true);
        clearError();
        try {
            const proposal = await agentForgeService.propose({ goal: goal.trim() });
            await agentForgeService.materialize(proposal);
            setGoal('');
            await refresh();
        } catch (e) {
            onError(e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <Section title={t('fleet.forge_title')}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                        style={{ ...inputStyle, flex: '1 1 200px' }}
                        placeholder={t('fleet.forge_placeholder')}
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                    />
                    <button style={primaryBtn} onClick={() => void forge()} disabled={busy}>
                        {t('fleet.forge_run')}
                    </button>
                </div>
            </Section>
            <Section title={t('fleet.crews_title')}>
                {crews.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {crews.map((c) => (
                    <div key={c.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {c.process} · {c.status} · {c.roles.length} roles · {c.taskIds.length} tasks
                        </div>
                        <div style={{ marginTop: '0.4rem' }}>
                            <button style={btn} onClick={() => void run(c.id)} disabled={busy}>
                                {t('fleet.run')}
                            </button>
                        </div>
                    </div>
                ))}
                <button style={btn} onClick={() => void refresh()}>
                    {t('fleet.refresh')}
                </button>
            </Section>
        </div>
    );
}

function CouncilsTab() {
    const { t } = useTranslation();
    const sessions = useCouncilStore((s) => s.sessions);
    const refresh = useCouncilStore((s) => s.refresh);
    const [topic, setTopic] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, onError, clearError] = useAsyncError();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const act = async (fn: () => Promise<unknown>) => {
        setBusy(true);
        clearError();
        try {
            await fn();
            await refresh();
        } catch (e) {
            onError(e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <input
                    style={{ ...inputStyle, flex: '1 1 200px' }}
                    placeholder={t('fleet.topic_placeholder')}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
                <button
                    style={primaryBtn}
                    disabled={busy || !topic.trim()}
                    onClick={() => void act(() => councilService.createSession({ topic: topic.trim() }).then(() => setTopic('')))}
                >
                    {t('fleet.create')}
                </button>
            </div>
            {sessions.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
            {sessions.map((s) => (
                <div key={s.id} style={card}>
                    <div style={{ fontWeight: 600 }}>{s.topic}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {s.phase} · {s.status} · {s.messages.length} msgs · {s.scores.length} judges
                        {s.winnerId ? ` · winner ${s.winnerId}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        <button style={btn} disabled={busy} onClick={() => void act(() => councilService.advancePhase(s.id))}>
                            {t('fleet.advance')}
                        </button>
                        <button style={btn} disabled={busy} onClick={() => void act(() => councilService.conclude(s.id))}>
                            {t('fleet.conclude')}
                        </button>
                    </div>
                </div>
            ))}
            <Section title={t('fleet.formats_title')}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {(['oxford', 'lincoln-douglas', 'popper', 'deliberative', 'munk', 'adversarial'] as DebateFormatId[]).map((f) => (
                        <button
                            key={f}
                            style={btn}
                            disabled={busy || !topic.trim()}
                            onClick={() => void act(() => formatService.run(f, topic.trim()))}
                        >
                            {t(`fleet.format_${f}`)}
                        </button>
                    ))}
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                        style={btn}
                        disabled={busy || !topic.trim()}
                        onClick={() => void act(() => argTechService.mineClaims(topic.trim()))}
                    >
                        {t('fleet.mine_claims')}
                    </button>
                </div>
            </Section>
        </div>
    );
}

function GraphsTab() {
    const { t } = useTranslation();
    const runs = useGraphStore((s) => s.runs);
    const refresh = useGraphStore((s) => s.refresh);
    const [topic, setTopic] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, onError, clearError] = useAsyncError();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const act = async (fn: () => Promise<unknown>) => {
        setBusy(true);
        clearError();
        try {
            await fn();
            await refresh();
        } catch (e) {
            onError(e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <input
                    style={{ ...inputStyle, flex: '1 1 200px' }}
                    placeholder={t('fleet.topic_placeholder')}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
                <button
                    style={primaryBtn}
                    disabled={busy || !topic.trim()}
                    onClick={() =>
                        void act(async () => {
                            const def = await graphService.buildModeGraph('sequential', { topic: topic.trim() });
                            await graphService.runGraph(def.id, { topic: topic.trim() });
                            setTopic('');
                        })
                    }
                >
                    {t('fleet.run_graph')}
                </button>
            </div>
            {runs.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
            {runs.map((r) => (
                <div key={r.id} style={card}>
                    <div style={{ fontWeight: 600 }}>{r.graphId.slice(0, 18)}…</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {r.status} · {r.stepCount} steps · {r.visited.length} visited
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        {r.status === 'paused' && (
                            <>
                                <button style={primaryBtn} disabled={busy} onClick={() => void act(() => graphService.approve(r.id))}>
                                    {t('fleet.approve')}
                                </button>
                                <button style={btn} disabled={busy} onClick={() => void act(() => graphService.reject(r.id, 'Rejected from Fleet'))}>
                                    {t('fleet.reject')}
                                </button>
                            </>
                        )}
                        <button style={btn} onClick={() => { const url = `${window.location.pathname}?tab=graphs&run=${r.id}`; window.history.pushState({}, '', url); try { navigator.clipboard.writeText(window.location.href); } catch {} }}>
                            Open
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PersonaTab() {
    const { t } = useTranslation();
    const contexts = usePersonaStore((s) => s.contexts);
    const goals = usePersonaStore((s) => s.goals);
    const refresh = usePersonaStore((s) => s.refresh);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, onError, clearError] = useAsyncError();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return (
        <div>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <input
                    style={{ ...inputStyle, flex: '1 1 200px' }}
                    placeholder={t('fleet.context_placeholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button
                    style={primaryBtn}
                    disabled={busy || !name.trim()}
                    onClick={() => {
                        setBusy(true);
                        clearError();
                        sharedContextService
                            .createContext({ name: name.trim(), scope: { kind: 'room', ref: 'fleet' } })
                            .then(() => {
                                setName('');
                                return refresh();
                            })
                            .catch(onError)
                            .finally(() => setBusy(false));
                    }}
                >
                    {t('fleet.create')}
                </button>
            </div>
            <Section title={t('fleet.contexts_title')}>
                {contexts.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {contexts.map((c) => (
                    <div key={c.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {c.scope.kind}:{c.scope.ref} · {c.memberIds.length} members
                        </div>
                    </div>
                ))}
            </Section>
            <Section title={t('fleet.goals_title')}>
                {goals.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {goals.slice(0, 20).map((g) => (
                    <div key={g.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{g.title}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {g.level} · {g.status} · {g.progress}%
                        </div>
                    </div>
                ))}
            </Section>
        </div>
    );
}

function OpsTab() {
    const { t } = useTranslation();
    const missions = useOpsStore((s) => s.missions);
    const notifications = useOpsStore((s) => s.notifications);
    const refresh = useOpsStore((s) => s.refresh);
    const [error, onError, clearError] = useAsyncError();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return (
        <div>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <Section title={t('fleet.missions_title')}>
                {missions.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {missions.map((m) => (
                    <div key={m.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{m.label}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {m.kind} · {m.status}
                        </div>
                    </div>
                ))}
            </Section>
            <Section title={t('fleet.notifications_title')}>
                {notifications.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {notifications.slice(0, 20).map((n) => (
                    <div key={n.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{n.title}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{n.body}</div>
                        <div style={{ marginTop: '0.4rem' }}>
                            <button
                                style={btn}
                                onClick={() => {
                                    clearError();
                                    mobileAccessService
                                        .markRead(n.id)
                                        .then(() => refresh())
                                        .catch(onError);
                                }}
                            >
                                {t('fleet.mark_read')}
                            </button>
                        </div>
                    </div>
                ))}
            </Section>
            <button
                style={btn}
                onClick={() => {
                    clearError();
                    hierarchyService
                        .tree()
                        .then(() => refresh())
                        .catch(onError);
                }}
            >
                {t('fleet.refresh')}
            </button>
        </div>
    );
}

function InteropTab() {
    const { t } = useTranslation();
    const peers = useInteropStore((s) => s.peers);
    const handoffs = useInteropStore((s) => s.handoffs);
    const refresh = useInteropStore((s) => s.refresh);
    const [peerName, setPeerName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, onError, clearError] = useAsyncError();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return (
        <div>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <input
                    style={{ ...inputStyle, flex: '1 1 200px' }}
                    placeholder={t('fleet.peer_placeholder')}
                    value={peerName}
                    onChange={(e) => setPeerName(e.target.value)}
                />
                <button
                    style={primaryBtn}
                    disabled={busy || !peerName.trim()}
                    onClick={() => {
                        setBusy(true);
                        clearError();
                        federationService
                            .addPeer({ name: peerName.trim(), baseUrl: 'local' })
                            .then(() => {
                                setPeerName('');
                                return refresh();
                            })
                            .catch(onError)
                            .finally(() => setBusy(false));
                    }}
                >
                    {t('fleet.add_peer')}
                </button>
            </div>
            {peers.map((p) => (
                <div key={p.id} style={card}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {p.trust} · {p.capabilities.length} caps
                    </div>
                </div>
            ))}
            <Section title={t('fleet.handoffs_title')}>
                {handoffs.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {handoffs.slice(0, 10).map((h) => (
                    <div key={h.id} style={card}>
                        <div style={{ fontSize: '0.85rem' }}>{h.task.slice(0, 120)}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            → {h.target} · {h.status}
                        </div>
                    </div>
                ))}
            </Section>
        </div>
    );
}

function MetaTab() {
    const { t } = useTranslation();
    const proposals = useMetaStore((s) => s.proposals);
    const packages = useMetaStore((s) => s.packages);
    const refresh = useMetaStore((s) => s.refresh);
    const [busy, setBusy] = useState(false);
    const [error, onError, clearError] = useAsyncError();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return (
        <div>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <Section title={t('fleet.proposals_title')}>
                {proposals.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {proposals.slice(0, 20).map((p) => (
                    <div key={p.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{p.target.slice(0, 100)}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {p.kind} · {p.status} · {p.confidence.toFixed(2)}
                        </div>
                    </div>
                ))}
            </Section>
            <Section title={t('fleet.packages_title')}>
                {packages.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {packages.slice(0, 20).map((p) => (
                    <div key={p.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {p.taskClass} · v{p.version} · {p.playbook.length} steps
                        </div>
                    </div>
                ))}
            </Section>
            <button
                style={btn}
                disabled={busy}
                onClick={() => {
                    setBusy(true);
                    clearError();
                    governanceService
                        .evaluate({ action: 'observe', subject: 'fleet' })
                        .then(() => refresh())
                        .catch(onError)
                        .finally(() => setBusy(false));
                }}
            >
                {t('fleet.refresh')}
            </button>
        </div>
    );
}

function TrustTab() {
    const { t } = useTranslation();
    const bundles = useTrustStore((s) => s.bundles);
    const snapshots = useTrustStore((s) => s.snapshots);
    const refresh = useTrustStore((s) => s.refresh);
    const [busy, setBusy] = useState(false);
    const [error, onError, clearError] = useAsyncError();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const act = async (fn: () => Promise<unknown>) => {
        setBusy(true);
        clearError();
        try {
            await fn();
            await refresh();
        } catch (e) {
            onError(e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <Section title={t('fleet.bundles_title')}>
                {bundles.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {bundles.map((b) => (
                    <div key={b.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{b.name}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {b.installedAt ? t('fleet.installed') : t('fleet.not_installed')}
                        </div>
                        {!b.installedAt && (
                            <div style={{ marginTop: '0.4rem' }}>
                                <button style={btn} disabled={busy} onClick={() => void act(() => ecosystemService.installBundle(b.id))}>
                                    {t('fleet.install')}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </Section>
            <Section title={t('fleet.snapshots_title')}>
                {snapshots.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {snapshots.slice(0, 10).map((s) => (
                    <div key={s.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{s.label}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {s.inventory.length} tables
                        </div>
                    </div>
                ))}
                <button style={btn} disabled={busy} onClick={() => void act(() => ecosystemService.snapshot('fleet-manual'))}>
                    {t('fleet.snapshot')}
                </button>
            </Section>
        </div>
    );
}

function FrontierTab() {
    const { t } = useTranslation();
    const benchmarks = useFrontierStore((s) => s.benchmarks);
    const runs = useFrontierStore((s) => s.runs);
    const orgs = useFrontierStore((s) => s.orgs);
    const refresh = useFrontierStore((s) => s.refresh);
    const [task, setTask] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, onError, clearError] = useAsyncError();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const act = async (fn: () => Promise<unknown>) => {
        setBusy(true);
        clearError();
        try {
            await fn();
            await refresh();
        } catch (e) {
            onError(e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <input
                    style={{ ...inputStyle, flex: '1 1 200px' }}
                    placeholder={t('fleet.bench_placeholder')}
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                />
                <button
                    style={primaryBtn}
                    disabled={busy || !task.trim()}
                    onClick={() =>
                        void act(async () => {
                            const b = await evalService.createBenchmark({
                                name: task.trim().slice(0, 80),
                                cases: [{ task: task.trim() }],
                            });
                            await evalService.runBenchmark(b.id, 'fleet');
                            setTask('');
                        })
                    }
                >
                    {t('fleet.run_bench')}
                </button>
            </div>
            {runs.slice(0, 10).map((r) => (
                <div key={r.id} style={card}>
                    <div style={{ fontSize: '0.85rem' }}>{r.subject}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {r.total}/{r.maxTotal}
                    </div>
                </div>
            ))}
            <Section title={t('fleet.orgs_title')}>
                {orgs.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {orgs.slice(0, 10).map((o) => (
                    <div key={o.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{o.name}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {o.status} · ♥ {o.heartbeats}
                        </div>
                        {o.status === 'active' && (
                            <div style={{ marginTop: '0.4rem' }}>
                                <button style={btn} disabled={busy} onClick={() => void act(() => frontierOpsService.heartbeat(o.id, 'fleet ping'))}>
                                    {t('fleet.heartbeat')}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </Section>
            {benchmarks.length > 0 && (
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                    {benchmarks.length} benchmarks
                </div>
            )}
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>
                knowledge: <KnowledgeCount />
            </div>
        </div>
    );
}

function KnowledgeCount() {
    const [count, setCount] = useState(0);
    useEffect(() => {
        knowledgeService
            .listSources()
            .then((s) => setCount(s.length))
            .catch(() => setCount(0));
    }, []);
    return <span>{count}</span>;
}

function RivalsTab() {
    const { t } = useTranslation();
    const loops = useRivalStore((s) => s.loops);
    const queue = useRivalStore((s) => s.queue);
    const refresh = useRivalStore((s) => s.refresh);
    const [goal, setGoal] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, onError, clearError] = useAsyncError();

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const act = async (fn: () => Promise<unknown>) => {
        setBusy(true);
        clearError();
        try {
            await fn();
            await refresh();
        } catch (e) {
            onError(e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <input
                    style={{ ...inputStyle, flex: '1 1 200px' }}
                    placeholder={t('fleet.goal_placeholder')}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                />
                <button
                    style={primaryBtn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => autonomyService.runGoal(goal.trim(), 5).then(() => setGoal('')))}
                >
                    {t('fleet.run_goal')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => dyadService.startDyad({ topic: goal.trim(), maxTurns: 6 }).then(() => setGoal('')))}
                >
                    {t('fleet.run_dyad')}
                </button>
                <button
                    style={btn}
                    disabled={busy}
                    onClick={() => void act(() => groupChatService.createChat({ name: 'fleet-chat', members: ['analyst', 'critic'] }).then((c) => groupChatService.nextTurn(c.id)))}
                >
                    {t('fleet.run_chat')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => reactService.run(goal.trim(), 4))}
                >
                    {t('fleet.run_react')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => ragService.answer(goal.trim(), 1))}
                >
                    {t('fleet.run_rag')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => codeAgentService.run(goal.trim(), 5))}
                >
                    {t('fleet.run_codeagent')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() =>
                        void act(() =>
                            assistantService
                                .defineAssistant({ name: goal.trim().slice(0, 40) })
                                .then((id) => assistantService.chat(id, goal.trim())),
                        )
                    }
                >
                    {t('fleet.run_assistant')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => appBuilderService.scaffold(goal.trim()))}
                >
                    {t('fleet.run_scaffold')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => ideService.askCodebase(goal.trim()))}
                >
                    {t('fleet.run_askcode')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => promptHubService.publish('fleet-adhoc', goal.trim()))}
                >
                    {t('fleet.save_prompt')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => forumPlusService.createPoll('fleet', goal.trim().slice(0, 120), ['yes', 'no']))}
                >
                    {t('fleet.run_poll')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => totService.search(goal.trim(), 3, 2, 2))}
                >
                    {t('fleet.run_tot')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => reflexionService.run(goal.trim(), 2))}
                >
                    {t('fleet.run_reflexion')}
                </button>
                <button
                    style={btn}
                    disabled={busy}
                    onClick={() => void act(() => meterService.checkAlerts())}
                >
                    {t('fleet.check_alerts')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => openClawService.importSoul(`# Identity\n${goal.trim()}`))}
                >
                    {t('fleet.soul_import')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => gensparkService.fanout(goal.trim()))}
                >
                    {t('fleet.fanout')}
                </button>
                <button
                    style={btn}
                    disabled={busy}
                    onClick={() => void act(() => dshService.healthCheck().then((h) => `plugins:${h.plugins} keys:${h.keys} queue:${h.queue}`))}
                >
                    {t('fleet.dsh_health')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => notebookService.createNotebook(goal.trim().slice(0, 80)).then((id) => notebookService.audioScript(id)))}
                >
                    {t('fleet.notebook_audio')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => dotpromptService.define({ name: 'fleet-adhoc', template: goal.trim() }).then(() => dotpromptService.render('fleet-adhoc')))}
                >
                    {t('fleet.dotprompt')}
                </button>
                <button
                    style={btn}
                    disabled={busy}
                    onClick={() => void act(() => netLogoService.createWorld(12).then((id) => netLogoService.seedTurtles(id, 'sheep', 15).then(() => netLogoService.tick(id, 10))))}
                >
                    {t('fleet.run_sim')}
                </button>
                <button
                    style={btn}
                    disabled={busy}
                    onClick={() => void act(() => mesaService.createModel('random').then((id) => mesaService.addAgents(id, 30).then(() => mesaService.step(id, 20))))}
                >
                    {t('fleet.run_mesa')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => gymService.make('bandit').then((id) => gymService.reset(id).then(() => gymService.step(id, '1'))))}
                >
                    {t('fleet.run_gym')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => malmoService.createMission({ name: goal.trim().slice(0, 60), map: ['#####', '#0.G#', '#####'] }).then((id) => malmoService.act(id, 'agent0', 'E')))}
                >
                    {t('fleet.run_mission')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => deckService.buildDeck(goal.trim(), 5))}
                >
                    {t('fleet.run_deck')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() => void act(() => supportService.openTicket(goal.trim().slice(0, 80), goal.trim()))}
                >
                    {t('fleet.run_ticket')}
                </button>
                <button
                    style={btn}
                    disabled={busy || !goal.trim()}
                    onClick={() =>
                        void act(() =>
                            n8nService
                                .defineWorkflow({
                                    name: goal.trim().slice(0, 60),
                                    nodes: [{ id: 'start', type: 'trigger' }],
                                    edges: [],
                                    entryId: 'start',
                                })
                                .then((id) => n8nService.run(id, { goal: goal.trim() })),
                        )
                    }
                >
                    {t('fleet.run_n8n')}
                </button>
            </div>
            <Section title={t('fleet.loops_title')}>
                {loops.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {loops.slice(0, 15).map((l) => (
                    <div key={l.id} style={card}>
                        <div style={{ fontWeight: 600 }}>{l.goal.slice(0, 100)}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {l.kind} · {l.status} · {l.iterations} iters
                        </div>
                    </div>
                ))}
            </Section>
            <Section title={t('fleet.queue_title')}>
                {queue.length === 0 && <p style={{ opacity: 0.6 }}>{t('fleet.empty')}</p>}
                {queue.slice(0, 15).map((q) => (
                    <div key={q.id} style={card}>
                        <div style={{ fontSize: '0.85rem' }}>
                            {q.kind}:{q.refId.slice(0, 16)}…
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{q.status}</div>
                    </div>
                ))}
            </Section>
        </div>
    );
}

const FleetPanel: React.FC<{ initialTab?: FleetTab }> = ({ initialTab }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<FleetTab>(initialTab ?? 'crews');
    // 6.3 deep-link: ?tab=graphs&run=xxx highlights card
    useEffect(() => {
        try {
            const sp = new URLSearchParams(window.location.search);
            const tab = sp.get('tab') as FleetTab | null;
            if (tab && TABS.includes(tab)) setActiveTab(tab);
        } catch { /* ignore */ }
    }, []);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #2a2a35' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t('fleet.title')}</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                    {t('fleet.subtitle')}
                </p>
            </div>
            <div
                style={{
                    display: 'flex',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid #2a2a35',
                    overflowX: 'auto',
                }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            cursor: 'pointer',
                            border: '1px solid #2a2a35',
                            background: activeTab === tab ? '#3b82f6' : 'transparent',
                            color: activeTab === tab ? '#fff' : 'inherit',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {t(`fleet.tab_${tab}`)}
                    </button>
                ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 1rem' }}>
                {activeTab === 'crews' && <CrewsTab />}
                {activeTab === 'councils' && <CouncilsTab />}
                {activeTab === 'graphs' && <GraphsTab />}
                {activeTab === 'persona' && <PersonaTab />}
                {activeTab === 'ops' && <OpsTab />}
                {activeTab === 'interop' && <InteropTab />}
                {activeTab === 'meta' && <MetaTab />}
                {activeTab === 'trust' && <TrustTab />}
                {activeTab === 'frontier' && <FrontierTab />}
                {activeTab === 'rivals' && <RivalsTab />}
            </div>
        </div>
    );
};

export default FleetPanel;
