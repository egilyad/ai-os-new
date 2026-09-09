import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Scale, AlertTriangle, CheckCircle, RefreshCw, Info } from 'lucide-react';
import { ConsistencyService } from '../../kernel/services/debate-runtime/debate-consistency-service';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

type Arg = { id: string; agentId: string; agentName?: string; content: string; round: number };

export const ConsistencyPanel: React.FC = () => {
    const { t } = useTranslation();
    const svc = useMemo(() => new ConsistencyService(), []);
    const realAgents = useRealAgents();
    const agents = realAgents;
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    const [loadedArgs, setLoadedArgs] = useState<Arg[] | null>(null);
    const derivedArgs = loadedArgs ?? [];
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some((a) => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    const [currentText, setCurrentText] = useState('');
    const [round, setRound] = useState(3);

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        setLoadedArgs(liveArgs.map(a => ({ id: a.id, agentId: a.agentId, agentName: a.agentName, content: a.content, round: a.round })));
        setAgentId(liveArgs[0]?.agentId ?? agentId);
    }, [liveArgs, agentId]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const result = useMemo(() => {
        const agentName = agents.find(a => a.id === agentId)?.name ?? agentId;
        return svc.checkConsistency(agentId, agentName, currentText, round, derivedArgs);
    }, [svc, agentId, currentText, round, agents, derivedArgs]);

    const ratio = useMemo(() => svc.getConsistencyRatio(agentId), [svc, agentId, result]);

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)', fontSize: 14, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    No agents available — register agents in the topology to check consistency.
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Scale size={22} color="#a855f7" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Consistency — {t('nav.consistency')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', fontWeight: 600 }}>P0.11</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Detects when agents contradict their own earlier claims across rounds. Jaccard similarity (0.35-0.85) + direct contradiction markers (`I was wrong`, `contrary to what I said`) without identity binding (`as I said before`) → Contradiction.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(168,85,247,0.15)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--slate-300)', fontWeight: 600 }}>Agent:</span>
                <select value={agentId} onChange={e => setAgentId(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <span style={{ fontSize: 13, color: 'var(--slate-300)', fontWeight: 600, marginLeft: 8 }}>Round:</span>
                <input type="number" min={1} max={10} value={round} onChange={e => setRound(parseInt(e.target.value) || 1)} style={{ width: 60, padding: '6px 8px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                <Button variant="ghost" size="sm" onClick={() => svc.reset()}><RefreshCw size={14} /> Reset history</Button>
                <Button variant="secondary" size="sm" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: ratio > 0.8 ? '#22c55e' : ratio > 0.5 ? '#eab308' : '#ef4444', fontWeight: 700 }}>Consistency ratio: {(ratio * 100).toFixed(0)}%</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 8 }}>Current claim to check</div>
                    <textarea value={currentText} onChange={e => setCurrentText(e.target.value)} rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, resize: 'vertical' }} />
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Try “I was wrong about solar” (direct contradiction) vs “As I said before, solar is good” (identity binding — not flagged).</div>
                    <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--slate-400)' }}>
                        Past claims for <strong style={{ color: 'var(--slate-200)' }}>{agents.find(a => a.id === agentId)?.name}</strong> (r &lt; {round}):
                        <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                            {derivedArgs.filter(a => a.agentId === agentId && a.round < round).map(a => <li key={a.id} style={{ marginBottom: 4 }}>{a.content.slice(0, 90)}… <span style={{ color: 'var(--slate-500)' }}>r{a.round}</span></li>)}
                            {derivedArgs.filter(a => a.agentId === agentId && a.round < round).length === 0 && <li style={{ color: 'var(--slate-500)' }}>No prior claims — cannot contradict.</li>}
                        </ul>
                    </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {result.length ? <AlertTriangle size={16} color="#ef4444" /> : <CheckCircle size={16} color="#22c55e" />} Result — {result.length} contradiction(s)
                    </div>
                    {result.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: '#22c55e', fontSize: 13, border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, background: 'rgba(34,197,94,0.06)' }}><CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />No contradiction — consistent!</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {result.map((c, i) => (
                                <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: c.isDirectContradiction ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)', border: `1px solid ${c.isDirectContradiction ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}` }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: c.isDirectContradiction ? '#f87171' : '#facc15', marginBottom: 4 }}>{c.isDirectContradiction ? 'Direct contradiction' : 'Potential'} · sim {(c.similarity * 100).toFixed(0)}% · r{c.earlierRound} → r{round}</div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-300)' }}><strong style={{ color: 'var(--slate-500)' }}>Earlier:</strong> {c.earlierClaimText}</div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-300)', marginTop: 4 }}><strong style={{ color: 'var(--slate-500)' }}>Current:</strong> {c.currentClaimText}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)' }}>Heuristic: Jaccard 0.35-0.85 + DIRECT_CONTRADICTION without IDENTITY_BINDING. See <code style={{ color: '#c4b5fd' }}>debate-consistency-service.ts:40</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default ConsistencyPanel;
