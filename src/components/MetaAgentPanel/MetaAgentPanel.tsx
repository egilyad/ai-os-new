import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Target, RefreshCw, Info, Zap } from 'lucide-react';
import { MetaAgentController } from '../../kernel/services/debate-runtime/debate-meta-agent-controller';
import { ArgumentGraphService } from '../../kernel/services/debate-runtime/debate-argument-graph-service';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

type Arg = { id: string; agentId: string; agentName: string; content: string; round: number };

const ROLE_COLOR: Record<string, string> = {
    devils_advocate: '#ef4444', synthesizer: '#22c55e', evidence_harvester: '#eab308', rhetoric_optimizer: '#8b5cf6', standard: '#64748b',
};
const ROLE_LABEL: Record<string, string> = {
    devils_advocate: "Devil's Advocate", synthesizer: 'Synthesizer', evidence_harvester: 'Evidence Harvester', rhetoric_optimizer: 'Rhetoric Optimizer', standard: 'Standard',
};

export const MetaAgentPanel: React.FC = () => {
    const { t } = useTranslation();
    const realAgents = useRealAgents();
    const agents = realAgents;
    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();
    const [argList, setArgList] = useState<Arg[]>([]);
    const { controller, graph } = useMemo(() => {
        const g = new ArgumentGraphService();
        // Seed graph with args for centrality demo
        for (const a of argList) {
            try { (g as any).addNode?.({ id: a.id, agentId: a.agentId, agentName: a.agentName, content: a.content, round: a.round }); } catch {}
        }
        const c = new MetaAgentController(g);
        return { controller: c, graph: g };
    }, [argList]);
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    const [round, setRound] = useState(4);
    const [directive, setDirective] = useState<ReturnType<MetaAgentController['getDirective']>>(null);

    useEffect(() => {
        setAgentId(prev => (agents.some(a => a.id === prev) ? prev : (agents[0]?.id ?? '')));
    }, [agents]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        setArgList(liveArgs.map((a) => ({ id: a.id, agentId: a.agentId, agentName: a.agentName, content: a.content, round: a.round })));
    }, [liveArgs]);

    const handleGet = () => {
        const name = agents.find(a => a.id === agentId)?.name ?? agentId;
        const d = controller.getDirective(agentId, name, argList, round);
        setDirective(d);
    };

    const allDirectives = agents.map(a => {
        const d = controller.getDirective(a.id, a.name, argList, round);
        return { agentId: a.id, agentName: a.name, directive: d };
    });

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bot size={22} color="#8b5cf6" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Meta Agent — {t('nav.meta_agent')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 600 }}>P0.8</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Per-round tactical role assignment via graph stats: own arg count, avg centrality, attacked opponents, support ratio. Roles: <code style={{ color: '#a78bfa' }}>devils_advocate / synthesizer / evidence_harvester / rhetoric_optimizer / standard</code>.
            </p>

            {agents.length === 0 && (
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#f87171' }}>
                    No agents available
                </div>
            )}

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
                <Button variant="primary" onClick={handleGet}><Target size={14} /> Get directive</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate ({liveArgs.length})</Button>
                <Button variant="ghost" onClick={() => setDirective(null)}><RefreshCw size={14} /> Clear</Button>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)' }}>{argList.length} args · graph {graph ? 'ready' : 'no graph'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={16} color="#8b5cf6" /> Directive — {agents.find(a => a.id === agentId)?.name} r{round}</div>
                    {!directive ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No directive — need ≥3 args and round &gt;1, or graph says standard. Click Get directive.</div>
                    ) : (
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: `1px solid ${ROLE_COLOR[directive.role] ?? '#8b5cf6'}55` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: ROLE_COLOR[directive.role] ?? '#8b5cf6', borderRadius: 4, padding: '2px 8px' }}>{ROLE_LABEL[directive.role] ?? directive.role}</span>
                                <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{directive.role}</span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: ROLE_COLOR[directive.role] ?? '#a78bfa', marginBottom: 6 }}>{directive.emphasis}</div>
                            <div style={{ fontSize: 13, color: 'var(--slate-300)', lineHeight: 1.5 }}>{directive.instruction}</div>
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Logic: many low-centrality → rhetoric_optimizer; few args → evidence_harvester; few opponents attacked → devils_advocate; high support → devils_advocate; late + centrality → synthesizer. See <code style={{ color: '#a78bfa' }}>debate-meta-agent-controller.ts:60</code>.</div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Bot size={16} color="#8b5cf6" /> All agents — r{round}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {allDirectives.map(({ agentId: id, agentName, directive: d }) => (
                            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: d ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${d ? (ROLE_COLOR[d.role] ?? '#8b5cf6') + '40' : 'rgba(255,255,255,0.06)'}` }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-200)', minWidth: 90 }}>{agentName}</span>
                                {d ? (
                                    <>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: ROLE_COLOR[d.role] ?? '#8b5cf6', borderRadius: 4, padding: '2px 6px' }}>{ROLE_LABEL[d.role] ?? d.role}</span>
                                        <span style={{ fontSize: 11, color: 'var(--slate-400)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.emphasis}</span>
                                    </>
                                ) : (
                                    <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>— no directive (standard)</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default MetaAgentPanel;
