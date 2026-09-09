import React, { useEffect, useMemo, useState } from 'react';
import { Scale, TrendingUp, RefreshCw, Info } from 'lucide-react';
import { BayesianJudge } from '../../kernel/services/debate-runtime/bayesian-judge';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

export const BayesianJudgePanel: React.FC = () => {
    const { t } = useTranslation();
    const agents = useRealAgents();
    const { args: liveArgs, topic: liveTopic, sessionId, hasLiveDebate } = useDebateArguments();
    const judge = useMemo(() => {
        const j = new BayesianJudge();
        j.reset(agents.map(a => a.id));
        return j;
        // isolated service — keep same instance across agent switches
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [version, setVersion] = useState(0);
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some(a => a.id === agentId)) {
            setAgentId(agents[0]?.id ?? '');
        }
    }, [agents, agentId]);
    const [strength, setStrength] = useState(0.6);
    const [history, setHistory] = useState<Array<{ agentId: string; strength: number; posterior: number; round: number }>>([]);
    const [round, setRound] = useState(1);

    const beliefs = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        void version;
        return judge.getAllBeliefs();
    }, [judge, version]);

    const handleUpdate = () => {
        judge.update(agentId, strength);
        const posterior = judge.getPosterior(agentId);
        setHistory(h => [...h, { agentId, strength, posterior, round }]);
        setRound(r => r + 1);
        setVersion(v => v + 1);
    };

    const handleReset = () => {
        judge.reset(agents.map(a => a.id));
        setHistory([]);
        setRound(1);
        setVersion(v => v + 1);
    };

    const selectedBelief = beliefs.find(b => b.agentId === agentId);

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Scale size={22} color="#7c3aed" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Bayesian Judge — {t('nav.bayesian_judge')}</h2>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                </div>
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-400)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No agents available.</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Scale size={22} color="#7c3aed" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Bayesian Judge — {t('nav.bayesian_judge')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', fontWeight: 600 }}>P1.6</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                {hasLiveDebate && (
                    <span title={sessionId ?? ''} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.12)', color: '#10b981', fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Active debate: {liveTopic}
                    </span>
                )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Each argument is evidence. Prior 0.5 → posterior via Bayes: P(H|E)=P(E|H)P(H)/[P(E|H)P(H)+P(E|¬H)P(¬H)]. Strength −1…1 maps to likelihood via logistic. Final score blends raw evaluator with posterior.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <span style={{ fontSize: 13, color: 'var(--slate-300)', fontWeight: 600 }}>Agent:</span>
                <select value={agentId} onChange={e => setAgentId(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <span style={{ fontSize: 13, color: 'var(--slate-300)', fontWeight: 600, marginLeft: 8 }}>Strength:</span>
                <input type="range" min={-1} max={1} step={0.1} value={strength} onChange={e => setStrength(parseFloat(e.target.value))} style={{ width: 140 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: strength > 0 ? '#22c55e' : strength < 0 ? '#ef4444' : 'var(--slate-400)', minWidth: 40 }}>{strength.toFixed(1)}</span>
                <Button variant="primary" onClick={handleUpdate}>Update belief</Button>
                <Button variant="ghost" onClick={handleReset}><RefreshCw size={14} /> Reset</Button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--slate-500)' }}>Round {round}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                {/* Beliefs table + bars */}
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontWeight: 700, fontSize: 13, color: 'var(--slate-200)' }}>
                        <TrendingUp size={16} color="#7c3aed" /> Beliefs — posterior
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {beliefs.map(b => {
                            const pct = b.posterior * 100;
                            const isSelected = b.agentId === agentId;
                            return (
                                <div key={b.agentId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: isSelected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-200)', width: 60 }}>{agents.find(a => a.id === b.agentId)?.name.split(' ')[0] ?? b.agentId}</div>
                                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: b.posterior > 0.6 ? '#22c55e' : b.posterior < 0.4 ? '#ef4444' : '#7c3aed', transition: 'width 0.3s' }} />
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: b.posterior > 0.6 ? '#22c55e' : b.posterior < 0.4 ? '#ef4444' : '#a78bfa', minWidth: 48, textAlign: 'right' }}>{pct.toFixed(1)}%</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)', minWidth: 40, textAlign: 'right' }}>{b.updates} upd</div>
                                </div>
                            );
                        })}
                    </div>
                    {selectedBelief && (
                        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.5 }}>
                            <strong style={{ color: 'var(--slate-100)' }}>Selected:</strong> prior 0.5 → posterior {selectedBelief.posterior.toFixed(3)} after {selectedBelief.updates} updates. Adjusted score for raw 0.7 = {judge.getAdjustedScore(agentId, 0.7).toFixed(3)} (blends with posterior).
                        </div>
                    )}
                </div>

                {/* History graph */}
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={16} color="#7c3aed" /> History — posterior trace
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)', fontWeight: 400 }}>{history.length} updates</span>
                    </div>
                    {history.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No updates yet — move the slider and click Update belief.</div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'end', gap: 3, height: 120, padding: '8px 4px 4px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {history.map((h, i) => {
                                const hPct = h.posterior * 100;
                                const COLORS = ['#3b82f6', '#ef4444', '#10b981'] as const;
                                const idx = agents.findIndex(a => a.id === h.agentId);
                                const color = idx >= 0 ? COLORS[idx % COLORS.length]! : '#10b981';
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                        <div style={{ width: '100%', height: `${hPct}%`, minHeight: 2, background: color, borderRadius: 2, opacity: 0.85, transition: 'height 0.3s' }} title={`${h.agentId} strength ${h.strength} → ${h.posterior.toFixed(2)}`} />
                                        <span style={{ fontSize: 9, color: 'var(--slate-500)' }}>{h.round}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {history.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            {agents.map((a, idx) => {
                                const COLORS = ['#3b82f6', '#ef4444', '#10b981'] as const;
                                const c = COLORS[idx % COLORS.length]!;
                                return (
                                    <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 3, background: c, borderRadius: 1 }} /> {a.name.split(' ')[0]}</span>
                                );
                            })}
                            <span style={{ marginLeft: 'auto' }}><Info size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />likelihood via logistic, updates Bayesian</span>
                        </div>
                    )}
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default BayesianJudgePanel;
