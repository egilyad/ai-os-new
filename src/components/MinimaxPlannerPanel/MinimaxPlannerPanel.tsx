import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GitMerge, Target, Shield, Zap, Info, RefreshCw } from 'lucide-react';
import { MinimaxPlanner } from '../../kernel/services/debate-runtime/debate-minimax-planner';
import { ArgumentGraphService } from '../../kernel/services/debate-runtime/debate-argument-graph-service';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

const TYPE_COLOR: Record<string, string> = {
    attack_high_centrality: '#ef4444', attack_low_support: '#f97316', defend_own_weak: '#eab308',
    support_own_strong: '#22c55e', refine_own_claim: '#06b6d4', challenge_unattacked: '#8b5cf6',
};
const TYPE_LABEL: Record<string, string> = {
    attack_high_centrality: 'Attack High Centrality', attack_low_support: 'Attack Low Support',
    defend_own_weak: 'Defend Own Weak', support_own_strong: 'Support Own Strong',
    refine_own_claim: 'Refine Own Claim', challenge_unattacked: 'Challenge Unattacked',
};

export const MinimaxPlannerPanel: React.FC = () => {
    const { t } = useTranslation();
    const realAgents = useRealAgents();
    const agents = realAgents;
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    type Arg = { id: string; agentId: string; agentName: string; content: string; round: number };
    const buildPlanner = (argList: Arg[]) => {
        const g = new ArgumentGraphService();
        g.build(argList.map((a) => ({ id: a.id, agentId: a.agentId, agentName: a.agentName, content: a.content, round: a.round })));
        return { planner: new MinimaxPlanner(g), graph: g };
    };
    const [services, setServices] = useState(() => buildPlanner([]));
    const planner = services.planner;
    const graph = services.graph;

    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some(a => a.id === agentId)) setAgentId(agents[0]?.id ?? 'alice');
    }, [agents, agentId]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        const g = new ArgumentGraphService();
        g.build(liveArgs.map((a) => ({ id: a.id, agentId: a.agentId, agentName: a.agentName, content: a.content, round: a.round })));
        setServices({ planner: new MinimaxPlanner(g), graph: g });
    }, [liveArgs]);
    const [round, setRound] = useState(3);
    const [best, setBest] = useState<ReturnType<MinimaxPlanner['plan']>>(null);
    const [candidates, setCandidates] = useState<ReturnType<MinimaxPlanner['plan']>[]>([]);

    const handlePlan = () => {
        const name = agents.find(a => a.id === agentId)?.name ?? agentId;
        const move = planner.plan(agentId, name, round);
        setBest(move);
        // Generate all candidates for display by calling private method via inspection
        try {
            const all = (planner as any)._generateCandidates?.(agentId, round) ?? (move ? [move] : []);
            setCandidates(all.slice(0, 6));
        } catch {
            setCandidates(move ? [move] : []);
        }
    };

    const graphInfo = useMemo(() => {
        try {
            const nodes = (graph as any).getAllNodes?.() ?? [];
            const initialized = (graph as any).initialized ?? nodes.length > 0;
            return { count: nodes.length, initialized };
        } catch {
            return { count: 0, initialized: false };
        }
    }, [graph]);

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GitMerge size={22} color="#f97316" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Minimax Planner — {t('nav.minimax_planner')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(249,115,22,0.15)', color: '#fb923c', fontWeight: 600 }}>P0.7</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Strategic move planning via 2-ply minimax on the argument graph: generates 5 candidate types (attack high centrality / low support, defend weak, support strong, challenge unattacked), evaluates with centrality + support ratio, simulates opponent best response, picks max-min.
            </p>

            {agents.length === 0 && (
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#f87171' }}>
                    No agents available
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(249,115,22,0.15)', flexWrap: 'wrap' }}>
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
                <Button variant="primary" onClick={handlePlan}><Target size={14} /> Plan move</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
                <Button variant="ghost" onClick={() => { setBest(null); setCandidates([]); }}><RefreshCw size={14} /> Clear</Button>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)' }}>{graphInfo.count} nodes · {graphInfo.initialized ? 'initialized' : 'heuristic fallback'} · 2-ply minimax</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={16} color="#f97316" /> Best move — minimax</div>
                    {!best ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No move — need ≥3 nodes and initialized graph. Click Plan move for {agents.find(a => a.id === agentId)?.name} r{round}.</div>
                    ) : (
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(249,115,22,0.08)', border: `1px solid ${TYPE_COLOR[best.type] ?? '#f97316'}55` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: TYPE_COLOR[best.type] ?? '#f97316', borderRadius: 4, padding: '2px 8px' }}>{TYPE_LABEL[best.type] ?? best.type}</span>
                                <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>score {(best.score * 100).toFixed(0)}% · dmg {(best.expectedDamage * 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--slate-200)', fontWeight: 600, marginBottom: 4 }}>{best.targetClaim.slice(0, 120)}</div>
                            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>ID {best.targetNodeId}</div>
                            <div style={{ fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.4, marginTop: 8, padding: '8px 10px', borderRadius: 6, background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.06)' }}>{best.rationale}</div>
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> 5 candidate types, 2-ply: ourValue − opponentResponse*0.5. See <code style={{ color: '#fb923c' }}>debate-minimax-planner.ts:23</code>.</div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={16} color="#f97316" /> Candidates — {candidates.length}</div>
                        {candidates.length === 0 ? (
                            <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No candidates — graph may be empty or {'<3'} nodes. Load an active debate to analyze.</div>
                        ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {candidates.map((c, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: c!.type === best?.type ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${c!.type === best?.type ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: TYPE_COLOR[c!.type] ?? '#64748b', borderRadius: 3, padding: '2px 6px', minWidth: 90, textAlign: 'center' }}>{TYPE_LABEL[c!.type] ?? c!.type}</span>
                                    <span style={{ flex: 1, fontSize: 11, color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c!.targetClaim.slice(0, 60)}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[c!.type] ?? '#f97316', minWidth: 36, textAlign: 'right' }}>{(c!.score * 100).toFixed(0)}%</span>
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

export default MinimaxPlannerPanel;
