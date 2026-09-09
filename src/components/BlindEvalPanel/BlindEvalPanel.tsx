import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { EyeOff, Eye, Scale, BarChart3, Info } from 'lucide-react';
import { BlindEvaluationService } from '../../kernel/services/debate-runtime/blind-evaluation-service';
import type { Claim } from '../../kernel/services/debate-runtime/debate-governor/types';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

export const BlindEvalPanel: React.FC = () => {
    const { t } = useTranslation();
    const [blind, setBlind] = useState(true);
    const agents = useRealAgents();
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    const [liveClaims, setLiveClaims] = useState<Claim[] | null>(null);
    const [liveIds, setLiveIds] = useState<string[] | null>(null);
    const claims = useMemo(() => {
        if (liveClaims) return liveClaims;
        return [];
    }, [liveClaims]);
    const derivedIds = useMemo(() => {
        if (liveIds) return liveIds;
        return agents.slice(0, 3).map((a) => a.id);
    }, [agents, liveIds]);
    const AGENT_COLORS: Record<string, string> = useMemo(() => {
        const cols = ['#3b82f6', '#ef4444', '#10b981'];
        const m: Record<string, string> = {};
        agents.slice(0, 3).forEach((a, i) => (m[a.id] = cols[i % 3]));
        return m;
    }, [agents]);
    // keep useEffect import used (no-op sync) to satisfy lint / future agent sync
    useEffect(() => { if (hasLiveDebate) loadDebate(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sessionId]);
    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        setLiveClaims(liveArgs.map((a) => ({ id: a.id, agentId: a.agentId, text: a.content, confidence: 0.8 })));
        setLiveIds(Array.from(new Set(liveArgs.map((a) => a.agentId))));
    }, [liveArgs]);
    const svc = useMemo(() => new BlindEvaluationService(), []);
    const scores = useMemo(() => {
        const map = svc.evaluateBlindly(derivedIds, claims, () => []);
        return Array.from(map.entries()).map(([agentId, s]) => ({ agentId, ...s }));
    }, [svc, derivedIds, claims]);

    // For blind view, hide agentId in claim list
    const displayClaims = claims.map(c => ({ ...c, displayAgent: blind ? `Agent-${c.agentId.slice(0, 2).toUpperCase()}` : c.agentId })) as Array<Claim & { displayAgent: string }>;

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {blind ? <EyeOff size={22} color="#6366f1" /> : <Eye size={22} color="#6366f1" />}
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Blind Eval — {t('nav.blind_eval')}</h2>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                </div>
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-400)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No agents available.</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {blind ? <EyeOff size={22} color="#6366f1" /> : <Eye size={22} color="#6366f1" />}
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Blind Eval — {t('nav.blind_eval')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 600 }}>P2.12</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: blind ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)', color: blind ? '#818cf8' : '#10b981' }}>{blind ? 'Blind' : 'Open'}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Judge arguments without knowing which agent made them. Scores based only on content: length, evidence markers, rebuttal patterns, structure, numbers, confidence. No halo, no identity.
            </p>

            {claims.length === 0 && (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-400)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No active debate — start or open one to analyze.</div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <Button variant={blind ? 'primary' : 'ghost'} size="sm" onClick={() => setBlind(true)}><EyeOff size={14} /> Blind</Button>
                <Button variant={!blind ? 'primary' : 'ghost'} size="sm" onClick={() => setBlind(false)}><Eye size={14} /> Open (with identity)</Button>
                <Button variant="secondary" size="sm" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: 6 }}><Info size={12} /> overall = 0.4*argQ +0.2*rebut +0.2*pers +0.2*fact</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 14, alignItems: 'start' }}>
                {/* Claims list */}
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Scale size={16} color="#6366f1" /> Claims — {blind ? 'anonymized' : 'with identity'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {displayClaims.map(c => (
                            <div key={c.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${AGENT_COLORS[c.agentId] ?? '#6366f1'}` }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: AGENT_COLORS[c.agentId] ?? '#818cf8', marginBottom: 2 }}>{c.displayAgent} · conf {c.confidence.toFixed(2)}</div>
                                <div style={{ fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.4 }}>{c.text}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scores */}
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={16} color="#6366f1" /> Blind scores</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {scores.map(s => (
                            <div key={s.agentId} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: AGENT_COLORS[s.agentId] ?? 'var(--slate-200)' }}>{s.agentId}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: s.overall > 0.6 ? '#22c55e' : s.overall < 0.4 ? '#ef4444' : '#eab308' }}>{(s.overall * 100).toFixed(0)}%</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                    <div style={{ width: `${s.overall * 100}%`, height: '100%', background: AGENT_COLORS[s.agentId] ?? '#6366f1', transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 11, color: 'var(--slate-500)' }}>
                                    <span>argQ {(s.argumentQuality * 100).toFixed(0)}%</span>
                                    <span>rebut {(s.rebuttalStrength * 100).toFixed(0)}%</span>
                                    <span>pers {(s.persuasiveness * 100).toFixed(0)}%</span>
                                    <span>fact {(s.factuality * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', lineHeight: 1.4 }}>
                        Scores computed by <code style={{ color: '#818cf8' }}>blind-evaluation-service.ts:31 scoreClaimBlind</code> — evidence (+0.2), rebuttal (+0.08 per pattern), structure, numbers, confidence. No agentId context.
                    </div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default BlindEvalPanel;
