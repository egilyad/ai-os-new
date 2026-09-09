import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlaskConical, Zap, RefreshCw, GitMerge } from 'lucide-react';
import { ConceptBlender } from '../../kernel/services/debate-runtime/concept-blender';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

type BlendArg = { agentId: string; content: string; round: number };

export const ConceptBlenderPanel: React.FC = () => {
    const { t } = useTranslation();
    const blender = useMemo(() => new ConceptBlender(), []);
    const realAgents = useRealAgents();
    const agents = realAgents;
    const [args, setArgs] = useState<BlendArg[]>([]);
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    const [topic, setTopic] = useState('');
    const [round, setRound] = useState(1);
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some((a) => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    const [result, setResult] = useState<ReturnType<ConceptBlender['generateBlend']> | null>(null);
    const [deadlock, setDeadlock] = useState<ReturnType<ConceptBlender['detectDeadlock']> | null>(null);

    const handleDetect = () => {
        const d = blender.detectDeadlock(agentId, agents.find(a => a.id === agentId)?.name ?? agentId, args, round);
        setDeadlock(d);
        if (d) {
            const r = blender.generateBlend(d, topic, 'English');
            setResult(r);
        } else {
            setResult(null);
        }
    };

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        setArgs(liveArgs.map((a) => ({ agentId: a.agentId, content: a.content, round: a.round })));
        setRound((r) => Math.max(r, ...liveArgs.map((a) => a.round)));
    }, [liveArgs]);

    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const handleGenerateOnly = () => {
        if (!deadlock) return;
        const r = blender.generateBlend(deadlock, topic, 'English');
        setResult(r);
    };

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)', fontSize: 14, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    No agents available — register agents in the topology to blend concepts.
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FlaskConical size={22} color="#a855f7" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Concept Blender — {t('nav.concept_blender')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', fontWeight: 600 }}>P1.29</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                When deadlocked, invents new frameworks combining opposing concepts (Efficiency+Equity → Regenerative Equilibrium). Detects stalemate via triggers (`you're ignoring`, `as I already said`, `circular`, `irreconcilable`) + intensity.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(168,85,247,0.15)', flexWrap: 'wrap' }}>
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
                    Topic
                    <input value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <Button variant="primary" onClick={handleDetect}><Zap size={14} /> Detect deadlock</Button>
                <Button variant="ghost" onClick={handleGenerateOnly} disabled={!deadlock}>Generate blend</Button>
                <Button variant="ghost" onClick={() => { setDeadlock(null); setResult(null); }}><RefreshCw size={14} /> Clear</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><GitMerge size={16} color="#a855f7" /> Deadlock signal — 6 recent args</div>
                    {!deadlock ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No deadlock — intensity &lt;0.3 or &lt;6 args. Load an active debate to analyze its arguments.</div>
                    ) : (
                        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#ef4444', borderRadius: 4, padding: '2px 8px' }}>DEADLOCK</span>
                                <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>intensity {(deadlock.intensity * 100).toFixed(0)}% · stalemate {deadlock.stalemateRounds} rounds</span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--slate-200)', fontWeight: 600 }}>{deadlock.clashingConcepts[0]} <span style={{ color: 'var(--slate-500)' }}>vs</span> {deadlock.clashingConcepts[1]}</div>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                <div style={{ width: `${deadlock.intensity * 100}%`, height: '100%', background: '#ef4444' }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>present: {deadlock.present ? 'true' : 'false'}</div>
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)' }}>Triggers: `you're ignoring` / `as I already said` / `circular` / `irreconcilable` + intensity = hits/6. See <code style={{ color: '#c4b5fd' }}>concept-blender.ts:8</code>.</div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={16} color="#22c55e" /> Blends — {result ? result.blends.length : 0}</div>
                    {!result ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No blends — detect deadlock first, then generate.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.5 }}>
                                <strong style={{ color: '#22c55e' }}>Best:</strong> {result.bestBlendText}
                            </div>
                            {result.blends.map((b, i) => (
                                <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#22c55e', borderRadius: 4, padding: '2px 8px' }}>{b.name}</span>
                                        <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{b.parentA} + {b.parentB}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.4, marginBottom: 4 }}>{b.synthesis}</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-400)', fontStyle: 'italic' }}>{b.novelInsight}</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 4 }}>{b.resolutionPath}</div>
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

function Lightbulb(props: { size: number; color: string }) {
    return <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>;
}

export default ConceptBlenderPanel;
