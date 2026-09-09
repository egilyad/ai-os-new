import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Scale, CheckCircle, AlertTriangle, Plus, RefreshCw, Info } from 'lucide-react';
import { BoPTrackerService } from '../../kernel/services/debate-runtime/debate-bop-service';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

export const BoPTrackerPanel: React.FC = () => {
    const { t } = useTranslation();
    const svc = useMemo(() => new BoPTrackerService(), []);
    const realAgents = useRealAgents();
    const agents = realAgents;
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some((a) => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    const [claimText, setClaimText] = useState('');
    const [round, setRound] = useState(1);
    const [version, setVersion] = useState(0);
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void version;

    const handleAdd = () => {
        const name = agents.find(a => a.id === agentId)?.name ?? agentId;
        const id = `c${Date.now()}`;
        svc.recordClaim(id, agentId, name, claimText, round);
        setVersion(v => v + 1);
        setRound(r => r + 1);
    };

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        svc.reset();
        liveArgs.forEach((a) => svc.recordClaim(`c_${a.id}`, a.agentId, a.agentName, a.content, a.round));
        setVersion(v => v + 1);
        setRound((r) => Math.max(r, ...liveArgs.map((a) => a.round)));
    }, [liveArgs, svc]);

    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const handleMeet = (claimId: string) => {
        svc.meetBurden(claimId);
        setVersion(v => v + 1);
    };

    const allUnmet = (svc as any).entries ? Array.from((svc as any).entries.values()) as Array<{ claimId: string; agentId: string; agentName: string; claimText: string; round: number; status: string }> : [];
    const unmetForSelected = svc.getUnmetForAgent(agentId);
    const ratios = agents.map(a => ({ agentId: a.id, name: a.name, ratio: svc.getMetRatio(a.id), unmet: svc.getUnmetForAgent(a.id).length }));

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)', fontSize: 14, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    No agents available — register agents in the topology to track burden of proof.
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Scale size={22} color="#f59e0b" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>BoP Tracker — {t('nav.bop_tracker')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontWeight: 600 }}>P0.10</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Tracks burden of proof — every new claim auto-assigns burden to its author. Tracks <code style={{ color: '#fbbf24' }}>assigned → met / unmet</code>. Consensus Engine penalizes unmet burdens. Met ratio = met/total.
            </p>

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
                    Claim text
                    <input value={claimText} onChange={e => setClaimText(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <Button variant="primary" onClick={handleAdd}><Plus size={14} /> Add claim (assign burden)</Button>
                <Button variant="ghost" onClick={() => { svc.reset(); setVersion(v => v + 1); }}><RefreshCw size={14} /> Reset</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={16} color="#f59e0b" /> Unmet for {agents.find(a => a.id === agentId)?.name} — {unmetForSelected.length}</div>
                    {unmetForSelected.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: '#22c55e', fontSize: 13, border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, background: 'rgba(34,197,94,0.06)' }}><CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />No unmet burdens — all met or no claims!</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {unmetForSelected.map(u => (
                                <div key={u.claimId} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>{u.agentName} · r{u.round} · {u.claimId.slice(0, 8)}</div>
                                        <div style={{ fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.4, marginTop: 2 }}>{u.claimText.slice(0, 120)}</div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleMeet(u.claimId)}><CheckCircle size={12} /> Meet</Button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Every claim auto-assigns burden to author. Call <code style={{ color: '#fbbf24' }}>meetBurden(claimId)</code> when evidence provided. See <code style={{ color: '#fbbf24' }}>debate-bop-service.ts:38</code>.</div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Scale size={16} color="#f59e0b" /> Met ratios — per agent</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ratios.map(r => (
                            <div key={r.agentId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-200)', minWidth: 50 }}>{r.name}</span>
                                <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                    <div style={{ width: `${r.ratio * 100}%`, height: '100%', background: r.ratio > 0.7 ? '#22c55e' : r.ratio > 0.4 ? '#eab308' : '#ef4444' }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: r.ratio > 0.7 ? '#22c55e' : r.ratio > 0.4 ? '#eab308' : '#ef4444', minWidth: 40, textAlign: 'right' }}>{(r.ratio * 100).toFixed(0)}%</span>
                                <span style={{ fontSize: 11, color: 'var(--slate-500)', minWidth: 60, textAlign: 'right' }}>{r.unmet} unmet</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)' }}>Met ratio = met/total, no claims = 1.0 (no penalty). Consensus Engine penalizes low ratio.</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)' }}>All claims ({allUnmet.length} total):</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto', marginTop: 4 }}>
                        {allUnmet.slice(0, 6).map(c => (
                            <div key={c.claimId} style={{ fontSize: 11, color: 'var(--slate-400)', padding: '4px 6px', borderRadius: 4, background: c.status === 'met' ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${c.status === 'met' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'}`, display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.status === 'met' ? '#22c55e' : '#f59e0b', flexShrink: 0 }} />
                                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.agentName} r{c.round}: {c.claimText.slice(0, 60)}</span>
                                <span style={{ fontSize: 10, color: c.status === 'met' ? '#22c55e' : '#fbbf24' }}>{c.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default BoPTrackerPanel;
