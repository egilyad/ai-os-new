import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { routerService } from '../../kernel/instances/services-core';
import { budgetService } from '../../kernel/instances/services-extras';
import { agemsTaskService } from '../../kernel/services/agems-task-service';
import VisGraph, { type VisGraphNode, type VisGraphEdge } from '../Common/VisGraph';

type Lens = 'routing' | 'cost' | 'task';

const STATUS_COLOR: Record<string, string> = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    IN_REVIEW: '#8b5cf6',
    IN_TESTING: '#06b6d4',
    VERIFIED: '#10b981',
    AWAITING_APPROVAL: '#f97316',
    COMPLETED: '#22c55e',
    FAILED: '#ef4444',
    BLOCKED: '#7f1d1d',
    CANCELLED: '#64748b',
};

const GraphWorkbenchPanel: React.FC = () => {
    const [lens, setLens] = useState<Lens>('routing');
    const [routingNodes, setRoutingNodes] = useState<VisGraphNode[]>([]);
    const [routingEdges, setRoutingEdges] = useState<VisGraphEdge[]>([]);
    const [costNodes, setCostNodes] = useState<VisGraphNode[]>([]);
    const [costEdges, setCostEdges] = useState<VisGraphEdge[]>([]);
    const [taskNodes, setTaskNodes] = useState<VisGraphNode[]>([]);
    const [taskEdges, setTaskEdges] = useState<VisGraphEdge[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadRouting = useCallback(async () => {
        try {
            const history = routerService.getDecisionHistory?.(12) ?? [];
            const nodes: VisGraphNode[] = [];
            const edges: VisGraphEdge[] = [];
            const providerNodeId = new Map<string, string>();

            history.forEach((d, i) => {
                const reqId = d.requestId || `req-${i}`;
                const reqNode = `req:${reqId}`;
                nodes.push({
                    id: reqNode,
                    label: `Req ${i + 1}`,
                    color: '#94a3b8',
                    size: 8,
                    title: `strategy: ${d.strategy} · selected: ${d.selected} · ${new Date(d.timestamp).toLocaleTimeString()}`,
                });

                // Provider candidates
                (d.scores || []).forEach((s) => {
                    const pid = `p:${s.provider}`;
                    if (!providerNodeId.has(s.provider)) {
                        providerNodeId.set(s.provider, pid);
                        nodes.push({
                            id: pid,
                            label: s.provider,
                            color: s.provider === d.selected ? '#22c55e' : '#3b82f6',
                            size: s.provider === d.selected ? 20 : 12,
                            title: `score: ${s.score.toFixed(3)}`,
                        });
                    }
                    edges.push({
                        id: `e:${reqId}:${s.provider}`,
                        from: reqNode,
                        to: pid,
                        color: s.provider === d.selected ? '#22c55e' : 'rgba(148,163,184,0.4)',
                        width: s.provider === d.selected ? 2.5 : 1,
                    });
                });
            });

            setRoutingNodes(nodes);
            setRoutingEdges(edges);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    const loadCost = useCallback(async () => {
        try {
            const summary = budgetService.getSpendSummary?.();
            const nodes: VisGraphNode[] = [];
            const edges: VisGraphEdge[] = [];
            if (!summary) {
                setCostNodes(nodes);
                setCostEdges(edges);
                return;
            }
            const globalNode = 'cost:global';
            nodes.push({
                id: globalNode,
                label: 'Global',
                color: '#f97316',
                size: 28,
                title: `spent $${summary.global.spent.toFixed(2)} / $${summary.global.budget.toFixed(2)} (${summary.global.pct.toFixed(0)}%)`,
            });

            (summary.providers || []).forEach((p) => {
                const pid = `costp:${p.provider}`;
                nodes.push({
                    id: pid,
                    label: p.provider,
                    color: '#f59e0b',
                    size: 8 + Math.min(20, p.pct),
                    title: `spent $${p.spent.toFixed(2)} / $${p.budget.toFixed(2)}`,
                });
                edges.push({ id: `ce:${p.provider}`, from: globalNode, to: pid, color: '#f59e0b', width: Math.max(1, p.pct / 20) });
            });

            (summary.agents || []).forEach((a) => {
                const aid = `costa:${a.agentId}`;
                nodes.push({
                    id: aid,
                    label: a.name || a.agentId,
                    color: '#8b5cf6',
                    size: 10,
                    title: `spent $${a.spent.toFixed(2)}`,
                });
                edges.push({ id: `ae:${a.agentId}`, from: globalNode, to: aid, color: '#8b5cf6', width: 1.2 });
            });

            setCostNodes(nodes);
            setCostEdges(edges);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    const loadTask = useCallback(async () => {
        try {
            const tasks = await agemsTaskService.list?.();
            const nodes: VisGraphNode[] = [];
            const edges: VisGraphEdge[] = [];
            if (!tasks) {
                setTaskNodes(nodes);
                setTaskEdges(edges);
                return;
            }
            const byProject = new Map<string, string>();
            tasks.slice(0, 60).forEach((t) => {
                const pid = `task:${t.id}`;
                nodes.push({
                    id: pid,
                    label: t.title.slice(0, 28),
                    color: STATUS_COLOR[t.status] || '#64748b',
                    size: 12,
                    title: `${t.status} · ${t.priority} · ${t.type}`,
                });
                if (t.projectId) {
                    if (!byProject.has(t.projectId)) {
                        const nid = `proj:${t.projectId}`;
                        byProject.set(t.projectId, nid);
                        nodes.push({ id: nid, label: `Project ${t.projectId.slice(0, 8)}`, color: '#14b8a6', size: 16 });
                    }
                    edges.push({ id: `te:${t.id}`, from: pid, to: byProject.get(t.projectId)!, color: '#14b8a6', width: 1 });
                }
            });
            setTaskNodes(nodes);
            setTaskEdges(edges);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    const load = useCallback(
        async (l: Lens) => {
            setLoading(true);
            setError(null);
            if (l === 'routing') await loadRouting();
            else if (l === 'cost') await loadCost();
            else await loadTask();
            setLoading(false);
        },
        [loadRouting, loadCost, loadTask],
    );

    useEffect(() => {
        void load(lens);
    }, [lens, load]);

    const currentNodes = useMemo(() => {
        if (lens === 'routing') return routingNodes;
        if (lens === 'cost') return costNodes;
        return taskNodes;
    }, [lens, routingNodes, costNodes, taskNodes]);

    const currentEdges = useMemo(() => {
        if (lens === 'routing') return routingEdges;
        if (lens === 'cost') return costEdges;
        return taskEdges;
    }, [lens, routingEdges, costEdges, taskEdges]);

    const lensBtn = (l: Lens, label: string) => (
        <button
            onClick={() => setLens(l)}
            style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                border: lens === l ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                background: lens === l ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: lens === l ? 'var(--slate-100)' : 'var(--slate-400)',
                fontWeight: 700,
                cursor: 'pointer',
            }}
        >
            {label}
        </button>
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.9rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Graph Workbench</h2>
                <div style={{ display: 'flex', gap: 6 }}>
                    {lensBtn('routing', '🔀 Routing')}
                    {lensBtn('cost', '💰 Cost')}
                    {lensBtn('task', '✅ Tasks')}
                </div>
                {loading && <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>loading…</span>}
            </div>
            {error && <div style={{ color: 'var(--error)', fontSize: 12 }}>{error}</div>}
            <div style={{ flex: 1, minHeight: 0 }}>
                {currentNodes.length === 0 ? (
                    <div style={{ color: 'var(--slate-500)', fontSize: 13, padding: 24, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                        Нет данных для этой линзы
                    </div>
                ) : (
                    <VisGraph nodes={currentNodes} edges={currentEdges} onClickNode={() => {}} height={640} />
                )}
            </div>
        </div>
    );
};

export default GraphWorkbenchPanel;
