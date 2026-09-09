import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, TrendingDown, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { StanceDriftTracker } from '../../kernel/services/debate-runtime/stance-drift-tracker';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

const DIMENSIONS = ['prescription', 'certainty', 'urgency', 'scope', 'activism'] as const;
const DIM_COLOR: Record<string, string> = {
    prescription: '#8b5cf6', certainty: '#06b6d4', urgency: '#ef4444', scope: '#22c55e', activism: '#f59e0b',
};
const DRIFT_COLOR: Record<string, string> = {
    legitimate_evolution: '#22c55e', strategic_pivot: '#eab308', goalpost_shift: '#ef4444',
};

export const StanceDriftPanel: React.FC = () => {
    const { t } = useTranslation();
    const realAgents = useRealAgents();
    const agents = realAgents;
    const { args: liveArgs, sessionId, topic, hasLiveDebate } = useDebateArguments();
    const tracker = useMemo(() => {
        const tr = new StanceDriftTracker();
        tr.reset(agents.map(a => a.id), 'energy policy');
        return tr;
    }, [agents]);
    const [version, setVersion] = useState(0);
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some((a) => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);
    const [round, setRound] = useState(2);
    const [text, setText] = useState('');

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        const ids = Array.from(new Set(liveArgs.map((a) => a.agentId)));
        tracker.reset(ids, topic ?? 'debate');
        liveArgs.forEach((a) => tracker.registerArgument(a.agentId, a.agentName, a.round, a.content));
        setAgentId(liveArgs[0]?.agentId ?? agentId);
        setVersion((v) => v + 1);
    }, [liveArgs, topic, tracker, agentId]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void version;
    const events = tracker.getAllDriftEvents();
    const agentEvents = events.filter(e => e.agentId === agentId);
    const penalty = tracker.getDriftPenalty(agentId);
    const summary = tracker.getDriftSummary('English');
    const callout = tracker.getDriftCalloutText(agentId, 'English');

    const handleAdd = () => {
        const name = agents.find(a => a.id === agentId)?.name ?? agentId;
        tracker.registerArgument(agentId, name, round, text);
        setVersion(v => v + 1);
        setRound(r => r + 1);
    };

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Activity size={22} color="#ef4444" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Stance Drift — {t('nav.stance_drift')}</h2>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                </div>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)', fontSize: 14, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10 }}>
                    No agents available — register agents to use Stance Drift.
                </div>
                <ModuleInfo moduleKey="debate" />
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Activity size={22} color="#ef4444" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Stance Drift — {t('nav.stance_drift')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontWeight: 600 }}>P1.8</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Tracks per-agent stance vectors (prescription/certainty/urgency/scope/activism) via keyword heuristics. Classifies shifts as <code style={{ color: '#22c55e' }}>legitimate_evolution</code> / <code style={{ color: '#eab308' }}>strategic_pivot</code> / <code style={{ color: '#ef4444' }}>goalpost_shift</code> by cosine similarity.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(239,68,68,0.15)', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Agent
                    <select value={agentId} onChange={e => setAgentId(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Round
                    <input type="number" min={1} max={20} value={round} onChange={e => setRound(parseInt(e.target.value) || 1)} style={{ width: 70, padding: '6px 8px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)', flex: 1, minWidth: 300 }}>
                    Content (use “I changed my mind” for legitimate, or abrupt shift for goalpost)
                    <input value={text} onChange={e => setText(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <Button variant="primary" onClick={handleAdd}>Register</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>
                    Load active debate ({liveArgs.length})
                </Button>
                <Button variant="ghost" onClick={() => { tracker.reset(agents.map(a => a.id), 'energy policy'); setVersion(v => v + 1); }}><RefreshCw size={14} /> Reset</Button>
                <span style={{ fontSize: 12, color: 'var(--slate-500)', marginLeft: 'auto' }}>Penalty: <strong style={{ color: penalty < 1 ? '#ef4444' : '#22c55e' }}>{penalty.toFixed(2)}×</strong></span>
            </div>

            {!hasLiveDebate && (
                <div style={{ padding: 10, textAlign: 'center', color: 'var(--slate-400)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
                    No active debate — start or open one to analyze live arguments.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><TrendingDown size={16} color="#ef4444" /> Drift events — {agentEvents.length} for {agents.find(a => a.id === agentId)?.name}</div>
                    {agentEvents.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: '#22c55e', fontSize: 13, border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, background: 'rgba(34,197,94,0.06)' }}><CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />No drift — consistent stance</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {agentEvents.map((e, i) => (
                                <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: e.driftType === 'goalpost_shift' ? 'rgba(239,68,68,0.08)' : e.driftType === 'strategic_pivot' ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${e.driftType === 'goalpost_shift' ? 'rgba(239,68,68,0.2)' : e.driftType === 'strategic_pivot' ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: DRIFT_COLOR[e.driftType] ?? '#a78bfa', textTransform: 'uppercase' }}>{e.driftType.replace('_', ' ')}</span>
                                        <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>r{e.fromRound} → r{e.round} · sim {(e.cosineSimilarity * 100).toFixed(0)}%</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: 'var(--slate-400)' }}>
                                        {DIMENSIONS.map(d => (
                                            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ width: 70, color: 'var(--slate-500)' }}>{d}</span>
                                                <span style={{ color: DIM_COLOR[d] }}>{e.before[d].toFixed(2)}</span>
                                                <span style={{ color: 'var(--slate-600)' }}>→</span>
                                                <span style={{ color: DIM_COLOR[d] }}>{e.after[d].toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> &lt;0.35 = goalpost_shift, &lt;0.65 = strategic_pivot, else legitimate. See <code style={{ color: '#f87171' }}>stance-drift-tracker.ts:90</code>.</div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={16} color="#eab308" /> Summary & callout</div>
                    {summary ? <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--slate-300)' }}>{summary}</div> : <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No drift yet.</div>}
                    {callout ? (
                        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#fca5a5', whiteSpace: 'pre-wrap' }}>{callout}</div>
                    ) : (
                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>No goalpost callout — need a recent goalpost_shift for this agent.</div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Penalty map: legitimate 1.0×, pivot 0.85×, goalpost 0.7×.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default StanceDriftPanel;
