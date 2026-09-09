import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Zap, RefreshCw, Info, Target, AlertTriangle } from 'lucide-react';
import { ScratchpadService } from '../../kernel/services/debate-runtime/scratchpad-service';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

type Arg = { id: string; agentId: string; agentName: string; content: string; round: number };

export const ScratchpadPanel: React.FC = () => {
    const { t } = useTranslation();
    const svc = useMemo(() => new ScratchpadService(), []);
    const realAgents = useRealAgents();
    const agents = realAgents;
    const { args: liveArgs, sessionId, topic: liveTopic, hasLiveDebate } = useDebateArguments();
    const [liveLoadedArgs, setLiveLoadedArgs] = useState<Arg[] | null>(null);
    const args = liveLoadedArgs ?? [];
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some(a => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    const [round, setRound] = useState(3);
    const [topic, setTopic] = useState('');

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        setLiveLoadedArgs(liveArgs.map((a) => ({ id: a.id, agentId: a.agentId, agentName: a.agentName, content: a.content, round: a.round })));
        if (liveTopic) setTopic(liveTopic);
    }, [liveArgs, liveTopic]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);
    const [analysis, setAnalysis] = useState<ReturnType<ScratchpadService['analyze']> | null>(null);

    const handleAnalyze = () => {
        const role = agents.find(a => a.id === agentId)?.role ?? 'neutral';
        const res = svc.analyze(agentId, role, round, args, topic, 'English');
        setAnalysis(res);
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ClipboardList size={22} color="#6366f1" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Scratchpad — {t('nav.scratchpad')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 600 }}>P2.11</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Pre-generation tactical analysis — not visible to other agents. Finds unchallenged opponent args (no `but/however` later) and contradictions (market vs regulation, freedom vs security).
            </p>

            {agents.length === 0 && (
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#f87171' }}>
                    No agents available
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(99,102,241,0.15)', flexWrap: 'wrap' }}>
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
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)', flex: 1, minWidth: 250 }}>
                    Topic
                    <input value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <Button variant="primary" onClick={handleAnalyze}><Zap size={14} /> Analyze</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
                <Button variant="ghost" onClick={() => setAnalysis(null)}><RefreshCw size={14} /> Clear</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} color="#6366f1" /> History — {args.length} args</div>
                        {args.length === 0 ? (
                            <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No active debate — start or open one to analyze.</div>
                        ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                            {args.map(a => (
                                <div key={a.id} style={{ padding: '6px 8px', borderRadius: 6, background: a.agentId === agentId ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${a.agentId === agentId ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)'}`, fontSize: 12, color: 'var(--slate-300)' }}>
                                    <span style={{ fontWeight: 700, color: a.agentId === agentId ? '#a78bfa' : 'var(--slate-400)' }}>{a.agentName} r{a.round}</span> — {a.content.slice(0, 80)}
                                </div>
                            ))}
                        </div>
                        )}
                    </div>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={16} color="#f59e0b" /> Tactical focus</div>
                        {!analysis ? (
                            <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Click Analyze to generate tactical focus.</div>
                        ) : (
                            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: 'var(--slate-200)', lineHeight: 1.5 }}>{analysis.tacticalFocus}</div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList size={16} color="#6366f1" /> Weaknesses — {analysis ? analysis.weaknesses.length : 0}</div>
                        {!analysis || analysis.weaknesses.length === 0 ? (
                            <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No unchallenged weaknesses — all opponent args were challenged.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {analysis.weaknesses.map((w, i) => (
                                    <div key={i} style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', fontSize: 12, color: 'var(--slate-300)' }}>{w.slice(0, 120)}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Info size={16} color="#06b6d4" /> Opportunities — {analysis ? analysis.opportunities.length : 0}</div>
                        {!analysis ? (
                            <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Analyze to see opportunities.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {analysis.opportunities.map((o, i) => (
                                    <div key={i} style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', fontSize: 12, color: 'var(--slate-300)' }}>{o}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--slate-300)', marginBottom: 6 }}>Prompt block (injected, hidden from opponents)</div>
                        {!analysis ? (
                            <div style={{ fontSize: 11, color: 'var(--slate-500)', fontStyle: 'italic' }}>No prompt yet.</div>
                        ) : (
                            <pre style={{ margin: 0, padding: '8px 10px', borderRadius: 6, background: 'var(--slate-900)', color: 'var(--slate-400)', fontSize: 11, whiteSpace: 'pre-wrap', lineHeight: 1.4, border: '1px solid rgba(255,255,255,0.06)', maxHeight: 120, overflowY: 'auto' }}>{analysis.promptBlock.slice(0, 500)}</pre>
                        )}
                    </div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default ScratchpadPanel;
