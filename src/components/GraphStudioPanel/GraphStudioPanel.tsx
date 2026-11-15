import React, { useEffect, useMemo, useRef, useState } from 'react';
import { projectManagerService } from '../../kernel/instances/services-extras';
import { ProjectGraphRepository } from '../../kernel/services/project-graph/project-graph-repository';
import { getWikiBrainDB } from '../../kernel/services/wiki-brain/wiki-brain-dexie';
import type { ProjectGraphNode, ProjectGraphEdge } from '../../kernel/types/project-types';
import VisGraph from '../Common/VisGraph';
import {
    GRAPH_STUDIO_PRESETS,
    loadGraphStudioConfig,
    saveGraphStudioConfig,
    type GraphStudioConfig,
} from './graph-studio-config';

const PALETTES: Record<GraphStudioConfig['style']['palette'], string[]> = {
    default: [
        '#8b5cf6',
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#22d3ee',
        '#a855f7',
        '#64748b',
    ],
    neon: ['#ff2d95', '#00e5ff', '#a3ff12', '#ffd60a', '#ff7a00', '#7b2cbf', '#00f5d4', '#b0b0b0'],
    clusters: [
        '#f94144',
        '#f3722c',
        '#f8961e',
        '#f9c74f',
        '#90be6d',
        '#43aa8b',
        '#577590',
        '#277da1',
    ],
};

function computeComponents(
    nodes: ProjectGraphNode[],
    edges: ProjectGraphEdge[],
): Map<string, number> {
    const adj = new Map<string, Set<string>>();
    for (const n of nodes) adj.set(n.id, new Set());
    for (const e of edges) {
        adj.get(e.from)?.add(e.to);
        adj.get(e.to)?.add(e.from);
    }
    const cluster = new Map<string, number>();
    let next = 0;
    for (const n of nodes) {
        if (cluster.has(n.id)) continue;
        const queue = [n.id];
        cluster.set(n.id, next);
        while (queue.length > 0) {
            const cur = queue.pop()!;
            for (const nb of adj.get(cur) ?? []) {
                if (!cluster.has(nb)) {
                    cluster.set(nb, next);
                    queue.push(nb);
                }
            }
        }
        next++;
    }
    return cluster;
}

const KIND_KEY: Record<string, number> = {
    project: 0,
    goal: 1,
    task: 2,
    debate: 3,
    knowledge: 4,
    agent: 5,
    decision: 6,
    artifact: 0,
    note: 1,
    concept: 2,
    requirement: 3,
    document: 4,
    research: 5,
    codebase: 6,
    website: 7,
    subgraph: 7,
};

/**
 * GraphStudioPanel — visual graph studio: sidebar controls (semantics,
 * physics, styles, interaction) driving a vis-network force simulation.
 */
const GraphStudioPanel: React.FC = () => {
    const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
    const [projectId, setProjectId] = useState('');
    const [source, setSource] = useState<'project' | 'wiki'>('project');
    const [nodes, setNodes] = useState<ProjectGraphNode[]>([]);
    const [edges, setEdges] = useState<ProjectGraphEdge[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<GraphStudioConfig>(loadGraphStudioConfig);
    const graphRef = useRef<{
        focus(id: string): void;
        fit(): void;
        stabilize(iterations?: number): void;
    } | null>(null);

    useEffect(() => {
        void projectManagerService
            .list()
            .then((list) => {
                const mapped = list.map((p) => ({ id: p.id, name: p.name }));
                setProjects(mapped);
                if (mapped.length > 0) setProjectId(mapped[0]!.id);
            })
            .catch(() => setError('Failed to load projects'));
    }, []);

    useEffect(() => {
        const t = setTimeout(() => saveGraphStudioConfig(config), 400);
        return () => clearTimeout(t);
    }, [config]);

    useEffect(() => {
        if (source === 'project' && !projectId) return;
        setLoading(true);
        setError(null);
        const load =
            source === 'wiki'
                ? async () => {
                      const db = getWikiBrainDB();
                      const [pages, links] = await Promise.all([
                          db.pages.toArray(),
                          db.links.toArray(),
                      ]);
                      const ns: ProjectGraphNode[] = pages.map((p) => ({
                          id: p.slug,
                          projectId: '',
                          kind: 'knowledge',
                          label: p.frontmatter.title ?? p.slug,
                          createdAt: 0,
                          updatedAt: 0,
                      }));
                      const es: ProjectGraphEdge[] = links.map((l) => ({
                          id: l.id,
                          projectId: '',
                          from: l.fromSlug,
                          to: l.toSlug,
                          relation: (l.kind === 'citation'
                              ? 'cites'
                              : 'connected_to') as ProjectGraphEdge['relation'],
                          weight: 1,
                          createdAt: 0,
                      }));
                      return [ns, es];
                  }
                : async () => {
                      const repo = new ProjectGraphRepository();
                      return Promise.all([
                          repo.listNodes({ projectId }),
                          repo.listEdges(projectId),
                      ]);
                  };
        void load()
            .then(([ns, es]) => {
                setNodes(ns as ProjectGraphNode[]);
                setEdges(es as ProjectGraphEdge[]);
            })
            .catch((e) => setError(e instanceof Error ? e.message : String(e)))
            .finally(() => setLoading(false));
    }, [projectId, source]);

    const filtered = useMemo(() => {
        const threshold = config.semantics.proximityThreshold / 100;
        const visibleEdges = edges.filter((e) => e.weight >= threshold);
        const visible = new Set<string>();
        for (const e of visibleEdges) {
            visible.add(e.from);
            visible.add(e.to);
        }
        let visibleNodes = nodes;
        if (config.semantics.hideOrphans) {
            visibleNodes = nodes.filter((n) => visible.has(n.id) || n.kind === 'project');
        }
        const query = config.semantics.query.trim().toLowerCase();
        if (query) {
            visibleNodes = visibleNodes.filter(
                (n) => n.label.toLowerCase().includes(query) || n.id.toLowerCase().includes(query),
            );
        }
        return { nodes: visibleNodes, edges: visibleEdges };
    }, [nodes, edges, config.semantics]);

    const graphNodes = useMemo(() => {
        const palette = PALETTES[config.style.palette];
        const degree = new Map<string, number>();
        for (const e of filtered.edges) {
            degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
            degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
        }
        const clusters =
            config.style.palette === 'clusters'
                ? computeComponents(filtered.nodes, filtered.edges)
                : null;
        return filtered.nodes.map((n) => {
            const deg = degree.get(n.id) ?? 0;
            const size = config.style.nodeSizeMode === 'degree' ? Math.max(6, 10 + deg * 1.5) : 12;
            const color = clusters
                ? (palette[(clusters.get(n.id) ?? 0) % palette.length] ?? palette[7]!)
                : (palette[KIND_KEY[n.kind] ?? 7] ?? palette[7]!);
            return {
                id: n.id,
                label: n.label,
                color,
                size,
            };
        });
    }, [filtered, config.style]);

    const graphEdges = useMemo(() => {
        return filtered.edges.map((e) => ({
            id: e.id,
            from: e.from,
            to: e.to,
            width: Math.max(0.5, e.weight * 4 * config.style.edgeThicknessScale),
            color: '#64748b',
        }));
    }, [filtered.edges, config.style.edgeThicknessScale]);

    const physicsOptions = useMemo(
        () =>
            config.physics.frozen
                ? { enabled: false }
                : {
                      stabilization: { iterations: 200 },
                      barnesHut: {
                          gravitationalConstant: -config.physics.repulsion,
                          centralGravity: config.physics.gravity,
                          springLength: config.physics.springLength,
                          springConstant: config.physics.springConstant,
                          damping: 0.09,
                      },
                  },
        [config.physics],
    );

    const setSemantics = (patch: Partial<GraphStudioConfig['semantics']>) =>
        setConfig((prev) => ({ ...prev, semantics: { ...prev.semantics, ...patch } }));
    const setPhysics = (patch: Partial<GraphStudioConfig['physics']>) =>
        setConfig((prev) => ({ ...prev, physics: { ...prev.physics, ...patch } }));
    const setStyle = (patch: Partial<GraphStudioConfig['style']>) =>
        setConfig((prev) => ({ ...prev, style: { ...prev.style, ...patch } }));
    const setInteraction = (patch: Partial<GraphStudioConfig['interaction']>) =>
        setConfig((prev) => ({ ...prev, interaction: { ...prev.interaction, ...patch } }));

    const visibleNodes = filtered.nodes;
    const visibleEdges = filtered.edges;

    useEffect(() => {
        const q = config.semantics.query.trim().toLowerCase();
        if (!q) return;
        const t = setTimeout(() => {
            const found = visibleNodes.find(
                (n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q),
            );
            if (found && graphRef.current) graphRef.current.focus(found.id);
        }, 350);
        return () => clearTimeout(t);
    }, [config.semantics.query, visibleNodes]);

    return (
        <div style={{ display: 'flex', gap: 12, padding: '1rem', height: '100%' }}>
            {/* Sidebar controls */}
            <div
                style={{
                    width: 260,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    overflowY: 'auto',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: '0.9rem',
                    background: 'var(--bg-elevated)',
                }}
            >
                <div style={{ fontWeight: 800, fontSize: 14 }}>Graph Studio</div>

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {GRAPH_STUDIO_PRESETS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() =>
                                setConfig({
                                    ...p.config,
                                    semantics: {
                                        ...p.config.semantics,
                                        query: config.semantics.query,
                                    },
                                })
                            }
                            style={{
                                padding: '3px 8px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'transparent',
                                color: 'var(--slate-300)',
                                fontSize: 10,
                                cursor: 'pointer',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as 'project' | 'wiki')}
                    style={controlStyle}
                >
                    <option value="project">Project graph</option>
                    <option value="wiki">Wiki graph</option>
                </select>

                {source === 'project' && (
                    <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        style={controlStyle}
                    >
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                )}

                <div style={groupStyle}>
                    <div style={groupTitleStyle}>Semantics</div>
                    <label style={labelStyle}>
                        Proximity threshold: {config.semantics.proximityThreshold}%
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={config.semantics.proximityThreshold}
                            onChange={(e) =>
                                setSemantics({ proximityThreshold: Number(e.target.value) })
                            }
                            style={{ width: '100%' }}
                        />
                    </label>
                    <label style={labelStyle}>
                        <input
                            type="checkbox"
                            checked={config.semantics.hideOrphans}
                            onChange={(e) => setSemantics({ hideOrphans: e.target.checked })}
                        />{' '}
                        Hide orphans
                    </label>
                    <input
                        placeholder="Search & focus…"
                        value={config.semantics.query}
                        onChange={(e) => setSemantics({ query: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && graphRef.current) {
                                const found = visibleNodes.find(
                                    (n) =>
                                        n.label
                                            .toLowerCase()
                                            .includes(config.semantics.query.toLowerCase()) ||
                                        n.id
                                            .toLowerCase()
                                            .includes(config.semantics.query.toLowerCase()),
                                );
                                if (found) graphRef.current.focus(found.id);
                            }
                        }}
                        style={controlStyle}
                    />
                </div>

                <div style={groupStyle}>
                    <div style={groupTitleStyle}>Physics</div>
                    <label style={labelStyle}>
                        Repulsion: {config.physics.repulsion}
                        <input
                            type="range"
                            min={500}
                            max={8000}
                            step={100}
                            value={config.physics.repulsion}
                            onChange={(e) => setPhysics({ repulsion: Number(e.target.value) })}
                            style={{ width: '100%' }}
                        />
                    </label>
                    <label style={labelStyle}>
                        Spring length: {config.physics.springLength}
                        <input
                            type="range"
                            min={40}
                            max={400}
                            step={10}
                            value={config.physics.springLength}
                            onChange={(e) => setPhysics({ springLength: Number(e.target.value) })}
                            style={{ width: '100%' }}
                        />
                    </label>
                    <label style={labelStyle}>
                        Gravity: {config.physics.gravity.toFixed(2)}
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={config.physics.gravity}
                            onChange={(e) => setPhysics({ gravity: Number(e.target.value) })}
                            style={{ width: '100%' }}
                        />
                    </label>
                    <label style={labelStyle}>
                        <input
                            type="checkbox"
                            checked={config.physics.frozen}
                            onChange={(e) => setPhysics({ frozen: e.target.checked })}
                        />{' '}
                        Freeze simulation
                    </label>
                    <button onClick={() => graphRef.current?.stabilize(200)} style={buttonStyle}>
                        Resimulate
                    </button>
                </div>

                <div style={groupStyle}>
                    <div style={groupTitleStyle}>Style</div>
                    <label style={labelStyle}>
                        Node size
                        <select
                            value={config.style.nodeSizeMode}
                            onChange={(e) =>
                                setStyle({ nodeSizeMode: e.target.value as 'fixed' | 'degree' })
                            }
                            style={controlStyle}
                        >
                            <option value="degree">By degree</option>
                            <option value="fixed">Fixed</option>
                        </select>
                    </label>
                    <label style={labelStyle}>
                        Palette
                        <select
                            value={config.style.palette}
                            onChange={(e) =>
                                setStyle({
                                    palette: e.target.value as 'default' | 'neon' | 'clusters',
                                })
                            }
                            style={controlStyle}
                        >
                            <option value="default">Default</option>
                            <option value="neon">Neon</option>
                            <option value="clusters">Clusters</option>
                        </select>
                    </label>
                    <label style={labelStyle}>
                        Edge thickness: {config.style.edgeThicknessScale.toFixed(2)}
                        <input
                            type="range"
                            min={0.5}
                            max={3}
                            step={0.1}
                            value={config.style.edgeThicknessScale}
                            onChange={(e) =>
                                setStyle({ edgeThicknessScale: Number(e.target.value) })
                            }
                            style={{ width: '100%' }}
                        />
                    </label>
                </div>

                <div style={groupStyle}>
                    <div style={groupTitleStyle}>Interaction</div>
                    <label style={labelStyle}>
                        <input
                            type="checkbox"
                            checked={config.interaction.highlightNeighbors}
                            onChange={(e) =>
                                setInteraction({ highlightNeighbors: e.target.checked })
                            }
                        />{' '}
                        Highlight neighbors
                    </label>
                    <label style={labelStyle}>
                        <input
                            type="checkbox"
                            checked={config.interaction.dimOthers}
                            onChange={(e) => setInteraction({ dimOthers: e.target.checked })}
                        />{' '}
                        Dim others
                    </label>
                    <label style={labelStyle}>
                        <input
                            type="checkbox"
                            checked={config.interaction.dragNodes}
                            onChange={(e) => setInteraction({ dragNodes: e.target.checked })}
                        />{' '}
                        Drag nodes (pinning)
                    </label>
                    <button onClick={() => graphRef.current?.fit()} style={buttonStyle}>
                        Fit view
                    </button>
                </div>

                {error && <div style={{ fontSize: 11, color: 'var(--error)' }}>{error}</div>}
                {loading && <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Loading…</div>}
                <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                    {visibleNodes.length} nodes · {visibleEdges.length} edges
                </div>
            </div>

            {/* Canvas */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <VisGraph
                    nodes={graphNodes}
                    edges={graphEdges}
                    height={560}
                    physics={!config.physics.frozen}
                    onReady={(ref) => {
                        graphRef.current = ref;
                    }}
                    interactionOptions={{
                        hover: true,
                        highlightNeighbors: config.interaction.highlightNeighbors,
                        dimOthers: config.interaction.dimOthers,
                        dragNodes: config.interaction.dragNodes,
                        dragView: true,
                        zoomView: true,
                    }}
                    physicsOptions={physicsOptions}
                />
            </div>
        </div>
    );
};

const controlStyle: React.CSSProperties = {
    width: '100%',
    padding: '5px 8px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg-main)',
    color: 'inherit',
    fontSize: 12,
};

const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
    color: 'var(--slate-400)',
};

const groupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: 10,
};

const groupTitleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'var(--slate-500)',
};

const buttonStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid rgba(59,130,246,0.3)',
    background: 'transparent',
    color: '#60a5fa',
    fontSize: 12,
    cursor: 'pointer',
};

export default GraphStudioPanel;
