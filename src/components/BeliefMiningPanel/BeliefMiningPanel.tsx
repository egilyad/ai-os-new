import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Brain, Search, Zap, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { BeliefMiningService } from '../../kernel/services/debate-runtime/debate-belief-mining-service';
import { useTranslation } from '../../i18n/useTranslation';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';

type Arg = { id: string; agentId: string; agentName: string; content: string; round: number };

const TYPE_COLOR: Record<string, string> = {
    value_judgment: '#a855f7', causal_assumption: '#06b6d4', epistemic_stance: '#eab308', deontic_claim: '#f97316', ontological_frame: '#22c55e',
};
const CONFLICT_COLOR: Record<string, string> = {
    value_inversion: '#ef4444', causal_contradiction: '#f97316', epistemic_divergence: '#eab308', ontological_mismatch: '#8b5cf6',
};

export const BeliefMiningPanel: React.FC = () => {
    const { t } = useTranslation();
    const svc = useMemo(() => new BeliefMiningService(), []);
    const agents = useRealAgents();
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    const [liveLoadedArgs, setLiveLoadedArgs] = useState<Arg[] | null>(null);
    const args = liveLoadedArgs ?? [];

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        setLiveLoadedArgs(liveArgs.map((a) => ({ id: a.id, agentId: a.agentId, agentName: a.agentName, content: a.content, round: a.round })));
    }, [liveArgs]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);
    const [version, setVersion] = useState(0);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void version;
    const beliefs = useMemo(() => svc.extractBeliefs(args), [svc, args, version]);
    const conflicts = useMemo(() => svc.mineConflicts(args, 2), [svc, args, version]);

    const byAgent = useMemo(() => {
        const m = new Map<string, typeof beliefs>();
        for (const b of beliefs) {
            const list = m.get(b.agentId) ?? [];
            list.push(b);
            m.set(b.agentId, list);
        }
        return Array.from(m.entries());
    }, [beliefs]);

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Brain size={22} color="#a855f7" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Belief Mining — {t('nav.belief_mining')}</h2>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                </div>
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-400)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No agents available.</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Brain size={22} color="#a855f7" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Belief Mining — {t('nav.belief_mining')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', fontWeight: 600 }}>P0.6</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Extracts implicit beliefs (value judgments, causal assumptions, epistemic stances, deontic claims, ontological frames) via heuristic patterns, then detects cross-agent conflicts by type and severity.
            </p>

            {args.length === 0 && (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-400)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No active debate — start or open one to analyze.</div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(168,85,247,0.15)' }}>
                <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>{beliefs.length} beliefs from {args.length} args · {conflicts.length} conflicts</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Button variant="ghost" size="sm" onClick={() => setVersion(v => v + 1)}><RefreshCw size={14} /> Re-mine</Button>
                    <Button variant="primary" size="sm" onClick={() => setVersion(v => v + 1)}><Search size={14} /> Mine conflicts</Button>
                    <Button variant="secondary" size="sm" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Search size={16} color="#a855f7" /> Mined beliefs — {beliefs.length}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {byAgent.map(([agentId, list]) => (
                            <div key={agentId} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-200)', marginBottom: 6 }}>{list[0]?.agentName} — {list.length} beliefs</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {list.slice(0, 4).map((b, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: `1px solid ${TYPE_COLOR[b.type] ?? '#64748b'}33` }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: TYPE_COLOR[b.type] ?? '#64748b', borderRadius: 3, padding: '1px 5px', minWidth: 60, textAlign: 'center' }}>{b.type.replace('_', ' ')}</span>
                                            <span style={{ flex: 1, color: 'var(--slate-300)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.premise.slice(0, 80)}</span>
                                            <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>{Math.round(b.confidence * 100)}% · r{b.round}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={16} color="#ef4444" /> Conflicts — {conflicts.length} (max 3, sorted by severity)</div>
                    {conflicts.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: '#22c55e', fontSize: 13, border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, background: 'rgba(34,197,94,0.06)' }}>No conflicts — beliefs are aligned or not overlapping enough (overlap &lt;0.15).</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {conflicts.map((c, i) => (
                                <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: CONFLICT_COLOR[c.type] ? `${CONFLICT_COLOR[c.type]}14` : 'rgba(255,255,255,0.03)', border: `1px solid ${CONFLICT_COLOR[c.type] ?? '#64748b'}33` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: CONFLICT_COLOR[c.type] ?? '#64748b', borderRadius: 4, padding: '2px 8px', textTransform: 'uppercase' }}>{c.type.replace('_', ' ')}</span>
                                        <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>sev {(c.severity * 100).toFixed(0)}% · r{c.round}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.4, marginBottom: 4 }}>{c.description}</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span><strong style={{ color: 'var(--slate-400)' }}>{c.agentA}:</strong> {c.beliefA.slice(0, 70)}</span>
                                        <span><strong style={{ color: 'var(--slate-400)' }}>{c.agentB}:</strong> {c.beliefB.slice(0, 70)}</span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden' }}>
                                        <div style={{ width: `${c.severity * 100}%`, height: '100%', background: CONFLICT_COLOR[c.type] ?? '#64748b' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Overlap &gt;0.15 + same belief type + polarity check. See <code style={{ color: '#c4b5fd' }}>debate-belief-mining-service.ts:164</code>.</div>
                </div>
            </div>

            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--slate-400)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR.value_judgment }} /> value</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR.causal_assumption }} /> causal</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR.epistemic_stance }} /> epistemic</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR.deontic_claim }} /> deontic</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR.ontological_frame }} /> ontological</span>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default BeliefMiningPanel;
