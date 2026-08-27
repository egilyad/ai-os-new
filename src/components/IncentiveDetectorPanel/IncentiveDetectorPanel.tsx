import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DollarSign, AlertTriangle, Info, Search, RefreshCw } from 'lucide-react';
import { IncentiveDetector } from '../../kernel/services/debate-runtime/incentive-detector';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

export const IncentiveDetectorPanel: React.FC = () => {
    const { t } = useTranslation();
    const detector = useMemo(() => new IncentiveDetector(), []);
    const realAgents = useRealAgents();
    const { args: liveArgs, topic: liveTopic, sessionId, hasLiveDebate } = useDebateArguments();
    const agents = realAgents;
    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Incentive Detector — {t('nav.incentive_detector')}</h2>
                <div style={{ marginTop: 16, padding: 16, color: 'var(--slate-400)' }}>No agents available</div>
            </div>
        );
    }
    const loadDebate = useCallback(() => { if (liveTopic) setTopic(liveTopic); }, [liveTopic]);
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    const [topic, setTopic] = useState('');
    const [text, setText] = useState('');
    const [analysis, setAnalysis] = useState<ReturnType<IncentiveDetector['analyze']> | null>(null);

    useEffect(() => { if (hasLiveDebate) loadDebate(); }, [sessionId]);

    const handleAnalyze = () => {
        const name = agents.find(a => a.id === agentId)?.name ?? agentId;
        const res = detector.analyze(agentId, name, text, topic);
        setAnalysis(res);
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DollarSign size={22} color="#f59e0b" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Incentive Detector — {t('nav.incentive_detector')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontWeight: 600 }}>P0.17</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                {hasLiveDebate && (
                    <span title={sessionId ?? ''} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.12)', color: '#10b981', fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Active debate: {liveTopic}
                    </span>
                )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Analyzes who benefits from stated positions — keyword match 12 stakeholder patterns (profit, regulation, gov, IP, AI, workers…) + topic. Flags conflict of interest when ≥2 stakeholders.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Agent
                    <select value={agentId} onChange={e => setAgentId(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Topic
                    <input value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)', gridColumn: '1 / -1' }}>
                    Content (trigger keywords: profit, regulation, tax, patent, AI, workers, consumer, pharma, media, environment…)
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={3} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, resize: 'vertical' }} />
                </label>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button variant="primary" onClick={handleAnalyze}><Search size={14} /> Analyze incentives</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate</Button>
                <Button variant="ghost" onClick={() => setAnalysis(null)}><RefreshCw size={14} /> Clear</Button>
            </div>

            {!analysis && (
                <div style={{ padding: 12, fontSize: 13, color: 'var(--slate-400)', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                    No active debate — start or open one to analyze, or type a position and click Analyze incentives.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={16} color="#f59e0b" /> Profiles — {analysis ? analysis.profiles.length : 0}</div>
                    {!analysis ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No analysis — click Analyze incentives.</div>
                    ) : analysis.profiles.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: '#22c55e', fontSize: 13, border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, background: 'rgba(34,197,94,0.06)' }}>No stakeholders detected — no obvious incentives.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {analysis.profiles.map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#f59e0b', borderRadius: 4, padding: '2px 6px', minWidth: 110, textAlign: 'center' }}>{p.stakeholder}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, color: 'var(--slate-300)' }}>{p.stake} · <span style={{ color: p.direction === 'for' ? '#f87171' : '#22c55e' }}>{p.direction}</span></div>
                                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>{p.estimatedValue} · impact {(p.credibilityImpact * 100).toFixed(0)}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {analysis && (
                        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: analysis.conflictOfInterest ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${analysis.conflictOfInterest ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, fontSize: 12, color: analysis.conflictOfInterest ? '#fca5a5' : '#86efac', display: 'flex', gap: 6, alignItems: 'center' }}>
                            <AlertTriangle size={14} color={analysis.conflictOfInterest ? '#ef4444' : '#22c55e'} /> {analysis.conflictOfInterest ? 'Conflict of interest: ≥2 stakeholders benefit' : 'No conflict — single stakeholder'}
                        </div>
                    )}
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><Info size={16} color="#f59e0b" /> Disclosure prompt</div>
                    {!analysis?.disclosurePrompt ? (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No disclosure needed — no conflict.</div>
                    ) : (
                        <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: '#fca5a5', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5, border: '1px solid rgba(239,68,68,0.2)' }}>{analysis.disclosurePrompt}</pre>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> 12 stakeholder patterns, value est. + impact. See <code style={{ color: '#fbbf24' }}>incentive-detector.ts:8</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default IncentiveDetectorPanel;
