import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Lightbulb, Zap, RefreshCw, Info, Quote } from 'lucide-react';
import { InsightBus } from '../../kernel/services/debate-runtime/insight-bus';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

const TYPE_COLOR: Record<string, string> = { contradiction: '#ef4444', surprise: '#eab308', premise: '#22c55e' };
const TYPE_ICON: Record<string, string> = { contradiction: '🔴', surprise: '🟡', premise: '🟢' };

export const InsightBusPanel: React.FC = () => {
    const { t } = useTranslation();
    const realAgents = useRealAgents();
    const agents = realAgents;
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Insight Bus — {t('nav.insight_bus')}</h2>
                <div style={{ marginTop: 16, padding: 16, color: 'var(--slate-400)' }}>No agents available</div>
            </div>
        );
    }
    const newRoundArg = { agentId: agents[0]?.id ?? '', agentName: agents[0]?.name ?? '' };
    const bus = useMemo(() => new InsightBus(), []);
    const [version, setVersion] = useState(0);
    const [round, setRound] = useState(3);
    const [text, setText] = useState('');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void version;
    const insights = bus.getActiveInsights();
    const formatted = bus.getFormattedInsights('English');

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        bus.clearSession();
        const byRound = new Map<number, Array<{ agentId: string; content: string; agentName?: string }>>();
        for (const a of liveArgs) {
            const arr = byRound.get(a.round) ?? [];
            arr.push({ agentId: a.agentId, content: a.content, agentName: a.agentName });
            byRound.set(a.round, arr);
        }
        for (const [r, list] of byRound) bus.ingestRound(r, list);
        setVersion((v) => v + 1);
    }, [liveArgs, bus]);

    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const handleAdd = () => {
        bus.ingestRound(round, [{ ...newRoundArg, content: text }]);
        setVersion(v => v + 1);
        setRound(r => r + 1);
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Lightbulb size={22} color="#eab308" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Insight Bus — {t('nav.insight_bus')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(234,179,8,0.15)', color: '#facc15', fontWeight: 600 }}>P1.21</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Cross-round insight accumulation: extracts contradictions (contrast words + topic overlap), surprising arguments (lexical novelty), and foundational premises after each round, then re-injects them into prompts.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(234,179,8,0.15)', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)', flex: 1, minWidth: 300 }}>
                    New round content (contrast words: however/although/yet trigger contradiction)
                    <input value={text} onChange={e => setText(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <span style={{ fontSize: 13, color: 'var(--slate-300)', fontWeight: 600 }}>Round</span>
                <input type="number" min={1} max={20} value={round} onChange={e => setRound(parseInt(e.target.value) || 1)} style={{ width: 70, padding: '6px 8px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                <Button variant="primary" onClick={handleAdd}><Zap size={14} /> Ingest round</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
                <Button variant="ghost" onClick={() => { bus.clearSession(); setVersion(v => v + 1); }}><RefreshCw size={14} /> Clear</Button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--slate-500)' }}>{insights.length} insights · last {Math.min(3, round - 1)} rounds retained</span>
            </div>

            {insights.length === 0 && (
                <div style={{ padding: 12, fontSize: 13, color: 'var(--slate-400)', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                    No active debate — start or open one to analyze, or type a round and click Ingest round.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={16} color="#eab308" /> Active insights — {insights.length}</div>
                    {insights.length === 0 ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No insights yet — ingest a round with contrast words (however/although) or novel vocabulary.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {insights.map((ins, i) => (
                                <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${TYPE_COLOR[ins.type] ?? '#64748b'}33`, borderLeft: `3px solid ${TYPE_COLOR[ins.type] ?? '#64748b'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[ins.type] ?? '#a78bfa', textTransform: 'uppercase' }}>{TYPE_ICON[ins.type] ?? '•'} {ins.type}</span>
                                        <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>r{ins.round} · sig {(ins.significance * 100).toFixed(0)}%</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.4 }}>{ins.text}</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}><Quote size={10} /> {ins.quote.slice(0, 100)}</div>
                                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden' }}>
                                        <div style={{ width: `${ins.significance * 100}%`, height: '100%', background: TYPE_COLOR[ins.type] ?? '#64748b' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={16} color="#eab308" /> Formatted prompt injection</div>
                    {formatted ? (
                        <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-300)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.06)', maxHeight: 300, overflowY: 'auto' }}>{formatted}</pre>
                    ) : (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No formatted insights — need at least 2 arguments with contrast.</div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Last 3 rounds retained, max 3 per round. See <code style={{ color: '#facc15' }}>insight-bus.ts:112</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default InsightBusPanel;
