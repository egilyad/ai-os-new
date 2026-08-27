import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link2, Target, CheckCircle, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { EntanglementEngine, AnchoringService } from '../../kernel/services/debate-runtime/debate-entanglement-engine';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

type Arg = { id: string; agentId: string; agentName: string; content: string; round: number };

export const EntanglementPanel: React.FC = () => {
    const { t } = useTranslation();
    const engines = useMemo(() => ({ ent: new EntanglementEngine(), anchor: new AnchoringService() }), []);
    const realAgents = useRealAgents();
    const agents = realAgents;
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Entanglement — {t('nav.entanglement')}</h2>
                <div style={{ marginTop: 16, padding: 16, color: 'var(--slate-400)' }}>No agents available</div>
            </div>
        );
    }
    const [argList, setArgList] = useState<Arg[]>([]);
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some((a) => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        setArgList(liveArgs.map((a) => ({ id: a.id, agentId: a.agentId, agentName: a.agentName, content: a.content, round: a.round })));
    }, [liveArgs]);

    const [round, setRound] = useState(3);
    const [response, setResponse] = useState('');
    const [constraint, setConstraint] = useState<ReturnType<EntanglementEngine['getConstraint']>>(null);

    const validation = useMemo(() => {
        if (!constraint) return null;
        return engines.ent.validateEntanglement(response, constraint);
    }, [engines.ent, response, constraint]);

    const anchors = useMemo(() => engines.anchor.extractAnchors(argList, round, 2), [engines.anchor, round, argList]);
    const deltaPrompt = useMemo(() => engines.anchor.buildDeltaPrompt(anchors, 'English'), [engines.anchor, anchors]);

    const handleGetConstraint = () => {
        const c = engines.ent.getConstraint(agentId, agents.find(a => a.id === agentId)?.name ?? agentId, argList, round);
        setConstraint(c);
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link2 size={22} color="#7c3aed" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Entanglement — {t('nav.entanglement')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', fontWeight: 600 }}>P0.1</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Forces agents to directly engage with a specific opponent claim. <code style={{ color: '#a78bfa' }}>getConstraint()</code> picks the most addressable claim (stance + recency + not already addressed), <code style={{ color: '#a78bfa' }}>validateEntanglement()</code> checks explicit reference and term overlap.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(124,58,237,0.15)', flexWrap: 'wrap' }}>
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
                <Button variant="primary" onClick={handleGetConstraint}><Target size={14} /> Get constraint</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
                <Button variant="ghost" onClick={() => setConstraint(null)}><RefreshCw size={14} /> Clear</Button>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)' }}>{argList.length} args · {anchors.length} anchors</span>
            </div>

            {argList.length === 0 && (
                <div style={{ padding: 12, fontSize: 13, color: 'var(--slate-400)', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                    No active debate — start or open one to analyze, or click Load active debate.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} color="#7c3aed" /> Constraint</div>
                    {!constraint ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No constraint — click Get constraint for {agents.find(a => a.id === agentId)?.name} r{round}.</div>
                    ) : (
                        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ fontSize: 12, color: 'var(--slate-300)' }}><strong style={{ color: '#a78bfa' }}>{constraint.opponentName}</strong> → <strong style={{ color: 'var(--slate-100)' }}>{constraint.responseType}</strong> {constraint.mustQuoteOpponent && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>must quote</span>}</div>
                            <div style={{ fontSize: 12, color: 'var(--slate-200)', lineHeight: 1.4, padding: '8px 10px', borderRadius: 6, background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.06)' }}>{constraint.targetClaimText}</div>
                            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>ID {constraint.targetClaimId} · r{round}</div>
                            {constraint.contextPhrase && <div style={{ fontSize: 11, color: 'var(--slate-400)', fontStyle: 'italic', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>{constraint.contextPhrase}</div>}
                        </div>
                    )}
                    <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--slate-300)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Info size={12} /> Anchors — common ground (≥2 rounds unchallenged)</div>
                        {anchors.length === 0 ? (
                            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>No anchors yet — need ≥2 rounds unchallenged claims.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {anchors.slice(0, 4).map(a => (
                                    <div key={a.claimId} style={{ fontSize: 11, color: 'var(--slate-400)', padding: '4px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>{a.agentName}: “{a.text.slice(0, 80)}” · r{a.roundResolved} · {Math.round(a.confidence * 100)}%</div>
                                ))}
                            </div>
                        )}
                        {deltaPrompt && <pre style={{ margin: '8px 0 0 0', padding: '8px 10px', borderRadius: 6, background: 'var(--slate-900)', color: 'var(--slate-300)', fontSize: 11, whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.06)', maxHeight: 120, overflowY: 'auto' }}>{deltaPrompt.slice(0, 400)}</pre>}
                    </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={16} color="#22c55e" /> Validate response</div>
                    <textarea value={response} onChange={e => setResponse(e.target.value)} rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, resize: 'vertical' }} placeholder="Write a response that quotes the opponent and addresses the target claim..." />
                    {validation && (
                        <div style={{ padding: '10px 12px', borderRadius: 8, background: validation.engaged ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${validation.engaged ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', gap: 8, alignItems: 'center' }}>
                            {validation.engaged ? <CheckCircle size={16} color="#22c55e" /> : <AlertTriangle size={16} color="#ef4444" />}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: validation.engaged ? '#22c55e' : '#f87171' }}>{validation.engaged ? 'Engaged ✓' : 'Not engaged ✗'}</div>
                                <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 2 }}>similarity {(validation.similarityToTarget! * 100).toFixed(1)}% · {validation.reason || 'explicit reference + term overlap'}</div>
                            </div>
                        </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Engaged if explicit ref (“as you said”) OR term overlap &gt;0.15 OR jaccard &gt;0.2. See <code style={{ color: '#a78bfa' }}>debate-entanglement-engine.ts:173</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default EntanglementPanel;
