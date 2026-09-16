import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Crosshair, ShieldAlert, Zap, RefreshCw, Info, BarChart3, GitBranch, Target } from 'lucide-react';
import { ArgumentGraphService } from '../../kernel/services/debate-runtime/debate-argument-graph-service';
import { VulnerabilityTargetingService } from '../../kernel/services/debate-runtime/debate-vulnerability-service';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import type { VulnerabilityTarget } from '../../kernel/contracts/debate-vulnerability';
import type { GraphBuildInput } from '../../kernel/contracts/debate-argument-graph';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

const VULN_COLOR: Record<string, string> = {
    orphan: '#ef4444',
    abandoned: '#f97316',
    overextended: '#eab308',
    weak_centrality: '#8b5cf6',
    unchallenged: '#06b6d4',
};

export const VulnTargetingPanel: React.FC = () => {
    const { t } = useTranslation();
    const realAgents = useRealAgents();
    const agents = realAgents;

    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();

    const derivedArgs: GraphBuildInput[] = [];

    const { graph, svc } = useMemo(() => {
        const g = new ArgumentGraphService();
        const s = new VulnerabilityTargetingService(g);
        return { graph: g, svc: s };
    }, []);

    const [args, setArgs] = useState<GraphBuildInput[]>(() => []);
    const [attackerId, setAttackerId] = useState<string>(() => agents[2]?.id ?? agents[0]?.id ?? '');
    const [currentRound, setCurrentRound] = useState<number>(4);
    const [maxTargets, setMaxTargets] = useState<number>(3);
    const [language, setLanguage] = useState<'English' | 'Russian'>('English');
    const [newContent, setNewContent] = useState<string>('However the opponent claim about solar scaling is flawed and contradicts evidence — but we can test orphan vulnerability by attacking again.');
    const [newAgentId, setNewAgentId] = useState<string>(() => agents[2]?.id ?? agents[0]?.id ?? '');
    const [version, setVersion] = useState(0);

    // keep attackerId valid when agents switch
    useEffect(() => {
        if (!agents.some((a) => a.id === attackerId)) {
            setAttackerId(agents[2]?.id ?? agents[0]?.id ?? '');
        }
    }, [agents, attackerId]);

    useEffect(() => {
        if (!agents.some((a) => a.id === newAgentId)) {
            setNewAgentId(agents[2]?.id ?? agents[0]?.id ?? '');
        }
    }, [agents, newAgentId]);

    // force recompute on version change
    void version;
    const stats = graph.getStats();
    const edges = graph.getAllEdges();
    const nodes = graph.getAllNodes();
    const attackerName = agents.find((a) => a.id === attackerId)?.name ?? attackerId;
    const targets = useMemo(() => {
        if (!graph.initialized || nodes.length < 4) return [] as VulnerabilityTarget[];
        return svc.findVulnerabilities(attackerId, attackerName, currentRound, maxTargets);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attackerId, attackerName, currentRound, maxTargets, version, nodes.length]);
    const prompt = useMemo(() => svc.buildTargetingPrompt(targets, language), [svc, targets, language]);

    const handleAdd = () => {
        if (!newContent.trim()) return;
        const id = `n${Date.now()}`;
        const agentName = agents.find((a) => a.id === newAgentId)?.name ?? newAgentId;
        const next: GraphBuildInput = {
            id,
            agentId: newAgentId,
            agentName,
            content: newContent,
            round: currentRound,
            timestamp: Date.now(),
            confidence: 0.75,
        };
        const updated = [...args, next];
        setArgs(updated);
        graph.build(updated);
        setVersion((v) => v + 1);
    };

    const handleRebuild = () => {
        graph.build(args);
        setVersion((v) => v + 1);
    };

    const handleReset = () => {
        setArgs([...derivedArgs]);
        graph.build(derivedArgs);
        setVersion((v) => v + 1);
        setCurrentRound(4);
    };

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        const mapped: GraphBuildInput[] = liveArgs.map((a, i) => ({
            id: a.id,
            agentId: a.agentId,
            agentName: a.agentName,
            content: a.content,
            round: a.round,
            timestamp: i + 1,
            confidence: 0.8,
        }));
        graph.build(mapped);
        setArgs(mapped);
        setVersion((v) => v + 1);
    }, [liveArgs, graph]);

    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Crosshair size={22} color="#ef4444" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Vuln Targeting — {t('nav.vuln_targeting')}</h2>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                </div>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)', fontSize: 14, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10 }}>
                    No agents available — register agents to use Vuln Targeting.
                </div>
                <ModuleInfo moduleKey="debate" />
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Crosshair size={22} color="#ef4444" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Vuln Targeting — {t('nav.vuln_targeting')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontWeight: 600 }}>P0.4</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Uses the unified argument graph to find opponent&apos;s weakest claims — 5 scorers (orphan, abandoned, overextended, weak_centrality, unchallenged) with
                per-claim best-score dedup, top-N sorted. Initialized needs ≥4 nodes; opponent = all nodes where <code style={{ color: '#ef4444' }}>agentId !== attacker</code>.
            </p>

            {!hasLiveDebate && args.length === 0 && (
                <div style={{ padding: 10, textAlign: 'center', color: 'var(--slate-400)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
                    No active debate — start or open one to analyze live arguments.
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'end',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    flexWrap: 'wrap',
                }}
            >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Attacker
                    <select
                        value={attackerId}
                        onChange={(e) => setAttackerId(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}
                    >
                        {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Round
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={currentRound}
                        onChange={(e) => setCurrentRound(parseInt(e.target.value) || 4)}
                        style={{ width: 70, padding: '6px 8px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Max targets
                    <input
                        type="number"
                        min={1}
                        max={5}
                        value={maxTargets}
                        onChange={(e) => setMaxTargets(parseInt(e.target.value) || 3)}
                        style={{ width: 70, padding: '6px 8px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Language
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}
                    >
                        <option value="English">English</option>
                        <option value="Russian">Russian</option>
                    </select>
                </label>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Button variant="ghost" onClick={handleRebuild}>
                        <GitBranch size={14} /> Rebuild
                    </Button>
                    <Button variant="ghost" onClick={handleReset}>
                        <RefreshCw size={14} /> Reset
                    </Button>
                    <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>
                        Load active debate ({liveArgs.length})
                    </Button>
                </span>
                <span style={{ fontSize: 11, color: 'var(--slate-500)', width: '100%' }}>
                    nodes {stats.totalNodes} · edges {stats.totalEdges} · orphans {stats.orphanNodes} · components {stats.connectedComponents}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 14, alignItems: 'start' }}>
                {/* Left: graph + add + targets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <BarChart3 size={16} color="#ef4444" /> Graph — {nodes.length} nodes / {edges.length} edges
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                            {nodes.map((n) => (
                                <span
                                    key={n.id}
                                    style={{
                                        fontSize: 11,
                                        padding: '3px 6px',
                                        borderRadius: 6,
                                        background: n.agentId === attackerId ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${n.agentId === attackerId ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                        color: 'var(--slate-300)',
                                    }}
                                >
                                    {n.id} {n.agentName} r{n.round}
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                            {edges.slice(0, 12).map((e) => (
                                <div
                                    key={e.id}
                                    style={{ fontSize: 11, color: 'var(--slate-400)', display: 'flex', gap: 6, alignItems: 'center', padding: '4px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                                >
                                    <span style={{ fontWeight: 700, color: e.type === 'attacks' ? '#f87171' : e.type === 'supports' ? '#22c55e' : '#a78bfa' }}>{e.type}</span>
                                    <span>
                                        {e.sourceId} → {e.targetId}
                                    </span>
                                    <span style={{ marginLeft: 'auto', color: 'var(--slate-500)' }}>
                                        {e.method} {(e.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                            {edges.length === 0 && <div style={{ fontSize: 11, color: 'var(--slate-500)', padding: 8, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 6 }}>No edges yet — need ≥4 nodes + cross-agent Jaccard &gt;0.12</div>}
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'end' }}>
                            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                                New claim (current round, to test edge creation)
                                <input
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}
                                />
                            </label>
                            <select
                                value={newAgentId}
                                onChange={(e) => setNewAgentId(e.target.value)}
                                style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}
                            >
                                {agents.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            <Button variant="primary" onClick={handleAdd}>
                                <Target size={14} /> Add claim
                            </Button>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Info size={12} /> edges: `explicit_parent | jaccard &gt;0.6 duplicate | &gt;0.12 attack/support via adversarial/supportive words | same_topic refine`. See{' '}
                            <code style={{ color: '#f87171' }}>debate-argument-graph-service.ts:66</code>.
                        </div>
                    </div>

                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldAlert size={16} color="#ef4444" /> Vulnerabilities — {targets.length} for {attackerName} (r{currentRound})
                        </div>
                        {targets.length === 0 ? (
                            <div
                                style={{
                                    padding: 12,
                                    textAlign: 'center',
                                    color: 'var(--slate-500)',
                                    fontSize: 12,
                                    border: '1px dashed rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                }}
                            >
                                No vulnerabilities — need initialized graph (≥4 nodes) and opponent claims with scores &gt;0. Load a live debate or add claims.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {targets.map((t) => (
                                    <div
                                        key={`${t.targetClaimId}-${t.type}`}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: 8,
                                            background: 'rgba(239,68,68,0.06)',
                                            border: `1px solid ${VULN_COLOR[t.type] ?? '#64748b'}33`,
                                            borderLeft: `3px solid ${VULN_COLOR[t.type] ?? '#64748b'}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: VULN_COLOR[t.type] ?? '#a78bfa',
                                                    textTransform: 'uppercase',
                                                    background: `${VULN_COLOR[t.type] ?? '#64748b'}18`,
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                }}
                                            >
                                                {t.type}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: VULN_COLOR[t.type] ?? '#a78bfa' }}>{(t.score * 100).toFixed(0)}%</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--slate-200)', lineHeight: 1.4 }}>
                                            [{t.opponentName}] {t.targetClaimText}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 4 }}>{t.detail} — id {t.targetClaimId}</div>
                                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(100, t.score * 100)}%`, height: '100%', background: VULN_COLOR[t.type] ?? '#64748b' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Info size={12} /> 5 scorers: orphan (attacked no defend) · abandoned (≥3 rounds, no follow-up) · overextended (attack/support ratio) · weak_centrality (&lt;0.3) · unchallenged (never addressed). See{' '}
                            <code style={{ color: '#f87171' }}>debate-vulnerability-service.ts:111</code>.
                        </div>
                    </div>
                </div>

                {/* Right: prompt + stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div
                        style={{
                            padding: 14,
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.6)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Zap size={16} color="#ef4444" /> Prompt injection
                        </div>
                        {prompt ? (
                            <pre
                                style={{
                                    margin: 0,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'var(--slate-900)',
                                    color: 'var(--slate-300)',
                                    fontSize: 11,
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.4,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    maxHeight: 320,
                                    overflowY: 'auto',
                                }}
                            >
                                {prompt}
                            </pre>
                        ) : (
                            <div
                                style={{
                                    padding: 12,
                                    textAlign: 'center',
                                    color: 'var(--slate-500)',
                                    fontSize: 12,
                                    border: '1px dashed rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                }}
                            >
                                No prompt — need at least one vulnerability. Switch attacker/round or add claim.
                            </div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                            Built via <code style={{ color: '#f87171' }}>buildTargetingPrompt(targets, language)</code> — injected as <code>### ⚔ Vulnerability Targeting</code> in{' '}
                            <code style={{ color: '#a78bfa' }}>debate-prompt-builder.ts:354</code>.
                        </div>
                    </div>

                    <div
                        style={{
                            padding: 14,
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.6)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <BarChart3 size={16} color="#8b5cf6" /> Stats
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, color: 'var(--slate-400)' }}>
                            <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                nodes <strong style={{ color: 'var(--slate-100)' }}>{stats.totalNodes}</strong> · edges <strong style={{ color: 'var(--slate-100)' }}>{stats.totalEdges}</strong>
                            </div>
                            <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                orphans <strong style={{ color: '#f87171' }}>{stats.orphanNodes}</strong> · components <strong style={{ color: '#a78bfa' }}>{stats.connectedComponents}</strong>
                            </div>
                            <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                longestPath <strong>{stats.longestPath}</strong> · avgConf <strong>{stats.averageConfidence.toFixed(2)}</strong>
                            </div>
                            <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                attack/support <strong>{stats.attackRatio === Infinity ? '∞' : stats.attackRatio.toFixed(2)}</strong> / {stats.supportRatio === Infinity ? '∞' : stats.supportRatio.toFixed(2)}
                            </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--slate-500)', lineHeight: 1.4 }}>
                            Centrality = degree/(n-1) → weak if &lt;0.3. Overextended = attack/support*0.3. Abandoned = roundsSince*0.1 after 3. Orphan = attacked &gt;0 no defend. Unchallenged = never addressed by attacker.
                        </div>
                    </div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default VulnTargetingPanel;
