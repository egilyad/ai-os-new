import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, Target, BarChart3, Check, Info } from 'lucide-react';
import { SteelmanService } from '../../kernel/services/debate-runtime/debate-steelman-service';
import type { SteelmanTarget } from '../../kernel/contracts/debate-steelman';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

type Arg = { id: string; agentId: string; agentName: string; content: string; round: number };

export const SteelmanPanel: React.FC = () => {
    const { t } = useTranslation();
    const realAgents = useRealAgents();
    const agents = realAgents;
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    const [loadedArgs, setLoadedArgs] = useState<Arg[] | null>(null);
    const args = loadedArgs ?? [];
    const [agentId, setAgentId] = useState(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some(a => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    const [manualPick, setManualPick] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState<SteelmanTarget | null>(null);

    const svc = useMemo(() => new SteelmanService(), []);

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        setLoadedArgs(liveArgs.map(a => ({ id: a.id, agentId: a.agentId, agentName: a.agentName, content: a.content, round: a.round })));
        setAgentId(liveArgs[0]?.agentId ?? agentId);
    }, [liveArgs, agentId]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const opponentArgs = useMemo(() => args.filter(a => a.agentId !== agentId), [args, agentId]);

    const scored = useMemo(() => {
        const maxRound = Math.max(...opponentArgs.map(a => a.round), 1);
        return opponentArgs.map(a => {
            const recency = a.round / Math.max(1, maxRound);
            const substance = Math.min(1, Math.max(0, (a.content.length - 50) / 500));
            const score = recency * 0.5 + substance * 0.5;
            return { arg: a, score };
        }).sort((a, b) => b.score - a.score);
    }, [opponentArgs]);

    const recommended = useMemo(() => svc.selectTarget(agentId, args), [svc, agentId, args]);
    const selected = useMemo(() => {
        if (manualPick) return scored.find(s => s.arg.id === manualPick)?.arg ?? null;
        return recommended ? args.find(a => a.id === recommended.claimId) ?? null : null;
    }, [manualPick, recommended, scored, args]);

    const maxScore = Math.max(...scored.map(s => s.score), 0.01);

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={22} color="#8b5cf6" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Steelman — {t('nav.steelman')}</h2>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                </div>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)', fontSize: 14, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10 }}>
                    No agents available — register agents to use Steelman.
                </div>
                <ModuleInfo moduleKey="debate" />
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={22} color="#8b5cf6" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Steelman — {t('nav.steelman')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 600 }}>P0.9</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Before rebutting, restate the opponent's position in its strongest form and request confirmation. Prevents strawman attacks and forces genuine engagement.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <span style={{ fontSize: 13, color: 'var(--slate-300)', fontWeight: 600 }}>Agent:</span>
                <select value={agentId} onChange={e => { setAgentId(e.target.value); setManualPick(null); setConfirmed(null); }} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>→ will steelman opponent's best claim</span>
                {recommended && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#a78bfa' }}><Target size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Recommended: {recommended.claimId} (r{recommended.round})</span>}
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
            </div>

            {!hasLiveDebate && args.length === 0 && (
                <div style={{ padding: 10, textAlign: 'center', color: 'var(--slate-400)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
                    No active debate — start or open one to analyze live arguments.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 14, alignItems: 'start' }}>
                {/* Graph */}
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontWeight: 700, fontSize: 13, color: 'var(--slate-200)' }}>
                        <BarChart3 size={16} color="#8b5cf6" /> Scores — recency (50%) + substance (50%)
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)', fontWeight: 400 }}>{opponentArgs.length} opponent claims</span>
                    </div>
                    {scored.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13 }}>No opponent claims to steelman — add at least one opponent argument.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {scored.map(({ arg, score }) => {
                                const isRecommended = recommended?.claimId === arg.id;
                                const isSelected = selected?.id === arg.id;
                                return (
                                    <div key={arg.id} onClick={() => setManualPick(arg.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(139,92,246,0.4)' : isRecommended ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)', width: 28 }}>r{arg.round}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, color: 'var(--slate-200)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{arg.agentName}: {arg.content.slice(0, 90)}…</div>
                                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden' }}>
                                                <div style={{ width: `${(score / maxScore) * 100}%`, height: '100%', background: isRecommended ? '#8b5cf6' : '#64748b', transition: 'width 0.3s' }} />
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: isRecommended ? '#a78bfa' : 'var(--slate-400)', minWidth: 40, textAlign: 'right' }}>{(score * 100).toFixed(0)}%</div>
                                        {isRecommended && <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: 'rgba(139,92,246,0.2)', color: '#a78bfa', fontWeight: 700 }}>REC</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Click a bar to pick target manually — otherwise the service's recommendation is used.</div>
                </div>

                {/* Target picker detail */}
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} color="#8b5cf6" /> Target picker</div>
                    {!selected ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Select an opponent claim on the left — or use the recommended one.</div>
                    ) : (
                        <>
                            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, marginBottom: 4 }}>{selected.agentName} — r{selected.round} · {selected.id}</div>
                                <div style={{ fontSize: 13, color: 'var(--slate-100)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selected.content}</div>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--slate-400)', lineHeight: 1.5, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <strong style={{ color: 'var(--slate-200)' }}>Steelman draft:</strong> “If I understand correctly, you argue that <em>{selected.content.slice(0, 140)}…</em> Is this a fair and strong restatement of your position?”
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Button variant="primary" onClick={() => setConfirmed({ opponentId: selected.agentId, opponentName: selected.agentName, claimText: selected.content.slice(0, 400), claimId: selected.id, round: selected.round })}><Check size={14} /> Confirm steelman</Button>
                                <Button variant="ghost" onClick={() => { setManualPick(null); setConfirmed(null); }}>Reset to recommended</Button>
                            </div>
                            {confirmed && (
                                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#86efac', fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <Check size={14} /> Confirmed — ready to inject as pre-rebuttal prompt for <strong style={{ marginLeft: 4 }}>{agents.find(a => a.id === agentId)?.name}</strong>.
                                </div>
                            )}
                        </>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 4 }}>Heuristic: recency 50% + substance (50-550 chars) 50%. No LLM. See <code style={{ color: '#a78bfa' }}>debate-steelman-service.ts:31</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default SteelmanPanel;
