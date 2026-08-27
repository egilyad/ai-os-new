import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, BarChart3, RefreshCw, Info, Target } from 'lucide-react';
import { FrameTracker } from '../../kernel/services/debate-runtime/frame-tracker';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

const FRAME_COLOR: Record<string, string> = {
    crisis: '#ef4444', opportunity: '#22c55e', moral: '#a855f7', economic: '#eab308', scientific: '#06b6d4',
    legal: '#64748b', security: '#f97316', progress: '#3b82f6', tradition: '#78716c', fairness: '#ec4899',
    efficiency: '#10b981', risk: '#f59e0b', identity: '#8b5cf6', global: '#38bdf8', local: '#84cc16',
};

export const FrameTrackerPanel: React.FC = () => {
    const { t } = useTranslation();
    const realAgents = useRealAgents();
    const agents = realAgents;
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Frame Tracker — {t('nav.frame_tracker')}</h2>
                <div style={{ marginTop: 16, padding: 16, color: 'var(--slate-400)' }}>No agents available</div>
            </div>
        );
    }
    const tracker = useMemo(() => new FrameTracker(), []);
    const [version, setVersion] = useState(0);
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some(a => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        tracker.clearSession();
        liveArgs.forEach((a) => tracker.registerFrame(a.agentId, a.agentName, a.round, a.content));
        setVersion((v) => v + 1);
    }, [liveArgs, tracker]);
    const [round, setRound] = useState(3);
    const [text, setText] = useState('');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void version;
    const entries = (tracker as any).entries as Array<{ frame: string; agentId: string; agentName: string; round: number; reasoning: string }>;
    const counts = useMemo(() => {
        const m = new Map<string, number>();
        for (const e of entries) m.set(e.frame, (m.get(e.frame) ?? 0) + 1);
        return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    }, [entries, version]);
    const dominant = tracker.getDominantFrame();
    const prompt = tracker.getFramePrompt('English');
    const maxCount = Math.max(...counts.map(([, c]) => c), 1);

    const handleAdd = () => {
        const name = agents.find(a => a.id === agentId)?.name ?? agentId;
        tracker.registerFrame(agentId, name, round, text);
        setVersion(v => v + 1);
        setRound(r => r + 1);
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Layers size={22} color="#8b5cf6" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Frame Tracker — {t('nav.frame_tracker')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 600 }}>P1.12</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Tracks how the topic is framed (crisis/opportunity/moral/economic/scientific… 15 frames) via keyword heuristics. Shows dominant frame and lets agents reinforce or challenge it.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(139,92,246,0.15)', flexWrap: 'wrap' }}>
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
                    Content (frame keywords: crisis, opportunity, moral, economic, scientific, legal, security, progress, fairness, risk, global, local…)
                    <input value={text} onChange={e => setText(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <Button variant="primary" onClick={handleAdd}>Register frame</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
                <Button variant="ghost" onClick={() => { tracker.clearSession(); setVersion(v => v + 1); }}><RefreshCw size={14} /> Clear</Button>
            </div>

            {entries.length === 0 && (
                <div style={{ padding: 12, fontSize: 13, color: 'var(--slate-400)', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                    No active debate — start or open one to analyze, or type content and click Register frame.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={16} color="#8b5cf6" /> Frames — frequency {dominant && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)', fontWeight: 400 }}>dominant: {dominant.frame} {(dominant.frequency * 100).toFixed(0)}%</span>}</div>
                    {counts.length === 0 ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No frames yet.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {counts.map(([frame, cnt]) => (
                                <div key={frame} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: FRAME_COLOR[frame] ?? '#64748b', borderRadius: 4, padding: '2px 6px', minWidth: 80, textAlign: 'center' }}>{frame}</span>
                                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                        <div style={{ width: `${(cnt / maxCount) * 100}%`, height: '100%', background: FRAME_COLOR[frame] ?? '#64748b' }} />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-300)', minWidth: 24, textAlign: 'right' }}>{cnt}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ marginTop: 10, maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {entries.slice(-8).reverse().map((e, i) => (
                            <div key={i} style={{ fontSize: 11, color: 'var(--slate-400)', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <span style={{ fontWeight: 700, color: FRAME_COLOR[e.frame] ?? '#a78bfa' }}>{e.frame}</span> · {e.agentName} r{e.round} · <span style={{ color: 'var(--slate-300)' }}>{e.reasoning.slice(0, 80)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} color="#8b5cf6" /> Prompt preview</div>
                    {prompt ? (
                        <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-300)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.06)' }}>{prompt}</pre>
                    ) : (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No dominant frame yet.</div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> 15 frames via keyword heuristics. See <code style={{ color: '#a78bfa' }}>frame-tracker.ts:8</code>.</div>
                    {dominant && (
                        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', fontSize: 12, color: 'var(--slate-300)' }}>
                            Dominant: <strong style={{ color: FRAME_COLOR[dominant.frame] ?? '#a78bfa' }}>{dominant.frame}</strong> {(dominant.frequency * 100).toFixed(0)}% — reinforce or challenge with justification.
                        </div>
                    )}
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default FrameTrackerPanel;
