import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Anchor, CheckCircle, RefreshCw, Info, FileText } from 'lucide-react';
import { AnchoringService } from '../../kernel/services/debate-runtime/debate-entanglement-engine';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

type Arg = { id: string; agentId: string; agentName: string; content: string; round: number };

export const AnchoringPanel: React.FC = () => {
    const { t } = useTranslation();
    const svc = useMemo(() => new AnchoringService(), []);
    const agents = useRealAgents();
    const [args, setArgs] = useState<Arg[]>([]);
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    const [round, setRound] = useState(4);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some((a) => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    const [text, setText] = useState('');

    const anchors = useMemo(() => svc.extractAnchors(args, round, 2), [svc, args, round]);
    const prompt = useMemo(() => svc.buildDeltaPrompt(anchors, 'English'), [svc, anchors]);

    const handleAdd = () => {
        if (!agentId) return;
        const name = agents.find((a) => a.id === agentId)?.name ?? agentId;
        setArgs((a) => [...a, { id: `m${Date.now()}`, agentId, agentName: name, content: text, round }]);
    };

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        setArgs(liveArgs.map((a) => ({ id: a.id, agentId: a.agentId, agentName: a.agentName, content: a.content, round: a.round })));
        setRound((r) => Math.max(r, ...liveArgs.map((a) => a.round)));
    }, [liveArgs]);

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Anchor size={22} color="#10b981" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Anchoring — {t('nav.anchoring')}</h2>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                </div>
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-400)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No agents available.</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Anchor size={22} color="#10b981" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Anchoring — {t('nav.anchoring')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600 }}>P0.5</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Extracts **anchored common ground** — claims not challenged for ≥2 rounds — and builds a <code style={{ color: '#10b981' }}>Do NOT re-argue</code> delta prompt. Focus on unresolved points.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(16,185,129,0.15)', flexWrap: 'wrap' }}>
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
                    New claim text
                    <input value={text} onChange={e => setText(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <Button variant="primary" onClick={handleAdd}>Add claim</Button>
                <Button variant="ghost" onClick={() => setArgs([])}><RefreshCw size={14} /> Clear claims</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Anchor size={16} color="#10b981" /> Arguments — {args.length} total</div>
                    {args.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No arguments yet — load an active debate or add a claim to analyze.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                            {args.map(a => (
                                <div key={a.id} style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--slate-300)' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--slate-200)' }}>{a.agentName}</span> <span style={{ color: 'var(--slate-500)' }}>r{a.round}</span> — {a.content.slice(0, 100)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={16} color="#22c55e" /> Anchors — {anchors.length} common ground</div>
                    {anchors.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No anchors yet — need ≥2 rounds unchallenged + not duplicate (jaccard &lt;0.35).</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {anchors.map(a => (
                                <div key={a.claimId} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 12, color: 'var(--slate-300)' }}>
                                    <div style={{ fontWeight: 700, color: '#22c55e', fontSize: 11, marginBottom: 2 }}>{a.agentName} · r{a.roundResolved} · {Math.round(a.confidence * 100)}%</div>
                                    <div>{a.text.slice(0, 140)}</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 2 }}>ID {a.claimId.slice(0, 8)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {prompt ? (
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--slate-300)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} color="#10b981" /> Delta prompt (do NOT re-argue)</div>
                            <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-300)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.06)', maxHeight: 180, overflowY: 'auto' }}>{prompt}</pre>
                        </div>
                    ) : (
                        <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> No delta prompt — need at least one anchor.</div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Heuristic: not challenged for ≥2 rounds + other agents present + ≥5 words, dedup jaccard &gt;0.35. See <code style={{ color: '#10b981' }}>debate-entanglement-engine.ts:218</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default AnchoringPanel;
