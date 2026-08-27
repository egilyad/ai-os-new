import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Gauge, AlertTriangle, CheckCircle, BarChart3, RefreshCw } from 'lucide-react';
import { CalibrationService } from '../../kernel/services/debate-runtime/calibration-service';
import { useTranslation } from '../../i18n/useTranslation';
import { useDebateArguments } from '../../hooks/useDebateArguments';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';

export const CalibrationPanel: React.FC = () => {
    const { t } = useTranslation();
    const svc = useMemo(() => new CalibrationService(), []);
    const realAgents = useRealAgents();
    const { args: liveArgs, topic: liveTopic, sessionId, hasLiveDebate } = useDebateArguments();
    const agents = useMemo(() => realAgents.map((a) => ({ id: a.id, name: a.name })), [realAgents]);
    const [text, setText] = useState('');
    const loadDebate = useCallback(() => {
        if (liveArgs.length) setText(liveArgs.map((a) => a.content).join('\n\n'));
    }, [liveArgs, setText]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
    }, [sessionId]);
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some((a) => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);

    const result = useMemo(() => svc.scoreClaims(text), [svc, text]);
    const prompt = useMemo(() => svc.getCalibrationPrompt(agentId, 2, 'English'), [svc, agentId, result]);

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)', fontSize: 14, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    No agents available — register agents in the topology to run calibration.
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Gauge size={22} color="#06b6d4" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Calibration — {t('nav.calibration')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(6,182,214,0.15)', color: '#22d3ee', fontWeight: 600 }}>P1.3</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                {hasLiveDebate && (
                    <span title={sessionId ?? ''} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.12)', color: '#10b981', fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Active debate: {liveTopic}
                    </span>
                )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Heuristic claim-level confidence scoring + calibration enforcement. Detects overconfidence (certain + no citation) and underconfidence, tracks history per agent.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(6,182,214,0.15)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--slate-300)', fontWeight: 600 }}>Agent:</span>
                <select value={agentId} onChange={e => setAgentId(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                    {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                        </option>
                    ))}
                </select>
                <Button variant="ghost" size="sm" onClick={() => svc.clearSession()}><RefreshCw size={14} /> Clear history</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate</Button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--slate-500)' }}>avg heuristic {result.avgHeuristic.toFixed(2)} · {result.violations.length} violations</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 8 }}>Input text</div>
                        <textarea value={text} onChange={e => setText(e.target.value)} rows={5} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, resize: 'vertical' }} />
                    </div>

                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={16} color="#06b6d4" /> Scores — per claim</div>
                        {result.scores.length === 0 ? (
                            <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Enter at least one sentence &gt;20 chars.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {result.scores.map((s, i) => (
                                    <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: s.mismatch > 0.3 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.mismatch > 0.3 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                                        <div style={{ fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.4, marginBottom: 6 }}>{s.claimText}</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--slate-500)' }}>
                                            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(6,182,214,0.12)', color: '#22d3ee' }}>heur {s.heuristicScore.toFixed(2)}</span>
                                            {s.statedConfidence >= 0 && <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>stated {s.statedConfidence.toFixed(2)}</span>}
                                            {s.mismatch > 0.3 && <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}><AlertTriangle size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />mismatch {s.mismatch.toFixed(2)}</span>}
                                            {s.hasCitation && <span style={{ color: '#22c55e' }}>● citation</span>}
                                            {s.hasData && <span style={{ color: '#22c55e' }}>● data</span>}
                                            {s.hasAbsoluteLanguage && <span style={{ color: '#ef4444' }}>● absolute</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {result.violations.length ? <AlertTriangle size={16} color="#ef4444" /> : <CheckCircle size={16} color="#22c55e" />} Violations — {result.violations.length}
                        </div>
                        {result.violations.length === 0 ? (
                            <div style={{ padding: 12, textAlign: 'center', color: '#22c55e', fontSize: 13, border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, background: 'rgba(34,197,94,0.06)' }}><CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />No calibration violations — well calibrated!</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {result.violations.map((v, i) => (
                                    <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: v.violationType === 'overconfident' ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)', border: `1px solid ${v.violationType === 'overconfident' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`, fontSize: 12, color: 'var(--slate-300)' }}>
                                        <span style={{ fontWeight: 700, color: v.violationType === 'overconfident' ? '#f87171' : '#facc15' }}>{v.violationType}</span> — {v.claimSnippet} <span style={{ color: 'var(--slate-500)' }}>(score {v.score.toFixed(2)})</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 8 }}>Enforcement prompt preview</div>
                        {prompt ? (
                            <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-300)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.06)' }}>{prompt}</pre>
                        ) : (
                            <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No prompt — history clean or not enough rounds. Add violations then check.</div>
                        )}
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)' }}>P1.3 — heuristic: citation +0.25, data +0.15, absolute −0.2, hedge −0.1; mismatch &gt;0.3 → violation. See <code style={{ color: '#22d3ee' }}>calibration-service.ts:52</code>.</div>
                    </div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default CalibrationPanel;
