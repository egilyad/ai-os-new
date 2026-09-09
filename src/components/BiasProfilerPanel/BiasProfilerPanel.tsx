import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, ShieldAlert, RefreshCw, Info, Target, Lightbulb } from 'lucide-react';
import { BiasProfiler } from '../../kernel/services/debate-runtime/bias-profiler';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

const BIAS_COLOR: Record<string, string> = {
    confirmation_bias: '#8b5cf6', anchoring: '#06b6d4', dunning_kruger: '#f59e0b', availability_heuristic: '#10b981',
    false_dilemma: '#ef4444', slippery_slope: '#f97316', strawman: '#ec4899', ad_hominem: '#dc2626',
    appeal_to_authority: '#6366f1', status_quo_bias: '#78716c', bandwagon: '#eab308', optimism_bias: '#22c55e', unknown: '#64748b',
};

export const BiasProfilerPanel: React.FC = () => {
    const { t } = useTranslation();
    const profiler = useMemo(() => new BiasProfiler(), []);
    const agents = useRealAgents();
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some(a => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    const [round, setRound] = useState(2);
    const [text, setText] = useState('');
    const [profile, setProfile] = useState<ReturnType<BiasProfiler['analyzeArgument']> | null>(null);

    const handleAnalyze = () => {
        const p = profiler.analyzeArgument(agentId, round, text);
        setProfile(p);
    };

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        let selected: ReturnType<BiasProfiler['analyzeArgument']> | null = null;
        let last: ReturnType<BiasProfiler['analyzeArgument']> | null = null;
        const firstId = liveArgs[0]?.agentId ?? agentId;
        liveArgs.forEach((a) => {
            const p = profiler.analyzeArgument(a.agentId, a.round, a.content);
            last = p;
            if (a.agentId === firstId) selected = p;
        });
        setAgentId(firstId);
        setProfile(selected ?? last);
    }, [liveArgs, profiler, agentId]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const opponentId = agents.find(a => a.id !== agentId)?.id ?? agentId;
    const exploit = agentId ? profiler.getExploitPrompt(opponentId, round, 'English') : '';
    const mitigation = agentId ? profiler.getMitigationPrompt(agentId, round, 'English') : '';

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Eye size={22} color="#f59e0b" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Bias Profiler — {t('nav.bias_profiler')}</h2>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                </div>
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-400)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No agents available.</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Eye size={22} color="#f59e0b" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Bias Profiler — {t('nav.bias_profiler')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontWeight: 600 }}>P1.18</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Detects 15 cognitive biases (confirmation, anchoring, Dunning-Kruger, strawman, ad hominem…) via pattern heuristics. Provides exploit/mitigation prompts.
            </p>

            {!hasLiveDebate && !profile && (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-400)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No active debate — start or open one to analyze live arguments.</div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(245,158,11,0.15)', flexWrap: 'wrap' }}>
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
                    Content
                    <input value={text} onChange={e => setText(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <Button variant="primary" onClick={handleAnalyze}><ShieldAlert size={14} /> Analyze</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
                <Button variant="ghost" onClick={() => profiler.clearSession()}><RefreshCw size={14} /> Clear session</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={16} color="#f59e0b" /> Profile — {profile ? `${profile.biases.length} biases, overall ${(profile.overallScore * 100).toFixed(0)}%` : 'no analysis yet'}</div>
                    {!profile ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Click Analyze to profile the content above.</div>
                    ) : profile.biases.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: '#22c55e', fontSize: 13, border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, background: 'rgba(34,197,94,0.06)' }}>No biases detected — clean argument!</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: BIAS_COLOR[profile.dominantBias] ?? '#64748b', borderRadius: 4, padding: '2px 8px' }}>{profile.dominantBias}</span>
                                <span style={{ fontSize: 12, color: 'var(--slate-300)' }}>dominant · overall {(profile.overallScore * 100).toFixed(0)}%</span>
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)' }}>agent {profile.agentId} · r{profile.round}</span>
                            </div>
                            {profile.biases.map((b, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: BIAS_COLOR[b.type] ?? '#64748b', borderRadius: 3, padding: '2px 6px', minWidth: 90, textAlign: 'center' }}>{b.type}</span>
                                    <span style={{ flex: 1, fontSize: 11, color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.evidence.slice(0, 60)}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: b.isExploitable ? '#f87171' : '#64748b', minWidth: 36, textAlign: 'right' }}>{(b.score * 100).toFixed(0)}%</span>
                                    <span style={{ fontSize: 10, color: b.isExploitable ? '#f87171' : 'var(--slate-600)', border: `1px solid ${b.isExploitable ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 3, padding: '1px 4px' }}>{b.isExploitable ? 'exploitable' : 'not'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} color="#f59e0b" /> Prompts</div>
                    <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Target size={12} /> Exploit (opponent)</div>
                        <pre style={{ margin: 0, fontSize: 11, color: 'var(--slate-400)', whiteSpace: 'pre-wrap', lineHeight: 1.4, maxHeight: 100, overflowY: 'auto' }}>{exploit || 'No exploitable bias for opponent at this round.'}</pre>
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Lightbulb size={12} /> Mitigation (self)</div>
                        <pre style={{ margin: 0, fontSize: 11, color: 'var(--slate-400)', whiteSpace: 'pre-wrap', lineHeight: 1.4, maxHeight: 100, overflowY: 'auto' }}>{mitigation || 'No mitigation needed — no strong bias detected for you.'}</pre>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> 15 types, weight 0.5-0.9, exploitable flag. See <code style={{ color: '#fbbf24' }}>bias-profiler.ts:15</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default BiasProfilerPanel;
