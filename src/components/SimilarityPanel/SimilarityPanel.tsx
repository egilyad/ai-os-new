import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, RefreshCw, AlertTriangle, CheckCircle, Info, BarChart3 } from 'lucide-react';
import { SimilarityMonitor } from '../../kernel/services/debate-runtime/similarity-monitor';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

export const SimilarityPanel: React.FC = () => {
    const { t } = useTranslation();
    const monitor = useMemo(() => new SimilarityMonitor(), []);
    const realAgents = useRealAgents();
    const agents = realAgents;
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some(a => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    const [round, setRound] = useState(2);
    const [content, setContent] = useState('');
    const [last, setLast] = useState<ReturnType<SimilarityMonitor['recordArgument']> | null>(null);
    const [history, setHistory] = useState<Array<{ agentId: string; round: number; content: string; record: ReturnType<SimilarityMonitor['recordArgument']> }>>([]);
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();

    const handleRecord = () => {
        const rec = monitor.recordArgument(agentId, round, content);
        setLast(rec);
        setHistory(h => [...h, { agentId, round, content: content.slice(0, 80), record: rec }]);
        setRound(r => r + 1);
    };

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        monitor.clearSession();
        const recs = liveArgs.map((a) => {
            const rec = monitor.recordArgument(a.agentId, a.round, a.content);
            return { agentId: a.agentId, round: a.round, content: a.content.slice(0, 80), record: rec };
        });
        setHistory(recs);
        setLast(recs[recs.length - 1]?.record ?? null);
        setRound((r) => Math.max(r, ...liveArgs.map((a) => a.round)));
    }, [liveArgs, monitor]);

    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Copy size={22} color="#7c3aed" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Similarity — {t('nav.similarity')}</h2>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                </div>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)', fontSize: 14, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10 }}>
                    No agents available — register agents to use Similarity.
                </div>
                <ModuleInfo moduleKey="debate" />
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Copy size={22} color="#7c3aed" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Similarity — {t('nav.similarity')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', fontWeight: 600 }}>P1.26</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Echo Chamber / Redundancy Monitor — Jaccard token overlap (≥2 chars, sliding window 3, threshold 0.65). Flags redundant turns for forced-novelty prompt.
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
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)', flex: 1, minWidth: 300 }}>
                    Content (≥30 chars triggers check)
                    <input value={content} onChange={e => setContent(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <Button variant="primary" onClick={handleRecord}>Record</Button>
                <Button variant="ghost" onClick={() => { monitor.clearSession(); setLast(null); setHistory([]); setRound(1); }}><RefreshCw size={14} /> Clear session</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={16} color="#7c3aed" /> Last record — {last ? `${last.agentId} r${last.round}` : 'none'}</div>
                    {!last ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Click Record to check similarity against last 3 turns.</div>
                    ) : (
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: last.isRedundant ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${last.isRedundant ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {last.isRedundant ? <AlertTriangle size={16} color="#ef4444" /> : <CheckCircle size={16} color="#22c55e" />}
                                <span style={{ fontSize: 13, fontWeight: 700, color: last.isRedundant ? '#f87171' : '#22c55e' }}>{last.isRedundant ? 'Redundant ✗' : 'Novel ✓'}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)' }}>threshold 0.65</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, color: 'var(--slate-400)' }}>Similarity</span>
                                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(100, last.similarityScore * 100)}%`, height: '100%', background: last.isRedundant ? '#ef4444' : '#22c55e' }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: last.isRedundant ? '#f87171' : '#22c55e', minWidth: 40, textAlign: 'right' }}>{(last.similarityScore * 100).toFixed(1)}%</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>comparedWith: {last.comparedWith ? last.comparedWith.slice(0, 12) : '—'} (hash) · window 3 · min 30 chars</div>
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Jaccard of token sets (≥3 chars), FNV-1a hash for dedup. See <code style={{ color: '#a78bfa' }}>similarity-monitor.ts:12</code>.</div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10 }}>History — {history.length} turns</div>
                    {history.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No history.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                            {history.slice().reverse().slice(0, 10).map((h, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: h.record.isRedundant ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${h.record.isRedundant ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)'}` }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)' }}>{h.agentId} r{h.round}</span>
                                    <span style={{ flex: 1, fontSize: 11, color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.content.slice(0, 50)}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: h.record.isRedundant ? '#f87171' : '#22c55e', minWidth: 40, textAlign: 'right' }}>{(h.record.similarityScore * 100).toFixed(0)}%</span>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: h.record.isRedundant ? '#ef4444' : '#22c55e', flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default SimilarityPanel;
