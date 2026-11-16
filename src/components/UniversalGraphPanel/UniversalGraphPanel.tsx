import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectManagerService } from '../../kernel/instances/services-extras';
import { ProjectGraphRepository } from '../../kernel/services/project-graph/project-graph-repository';
import { getContainer } from '../../kernel/service-helper';
import { useTranslation } from '../../i18n/useTranslation';
import { buildNavigationGraphData } from '../Common/navigation-graph-data';
import { getBrain } from '../WikiBrainPanel/use-wiki-brain';
import type { ProjectGraphNode, ProjectGraphEdge } from '../../kernel/types/project-types';
import type { TWikiPage } from '../../kernel/contracts/wiki-brain';

interface GraphView {
    nodes: ProjectGraphNode[];
    edges: ProjectGraphEdge[];
}

const KIND_COLORS: Record<string, string> = {
    project: '#3b82f6',
    goal: '#f59e0b',
    task: '#10b981',
    debate: '#a855f7',
    knowledge: '#22d3ee',
    agent: '#f43f5e',
    decision: '#eab308',
    artifact: '#8b5cf6',
    note: '#94a3b8',
    concept: '#2dd4bf',
    requirement: '#fb923c',
    document: '#38bdf8',
    research: '#c084fc',
    codebase: '#4ade80',
    website: '#60a5fa',
    subgraph: '#64748b',
};

/**
 * UniversalGraphPanel — basic read-only viewer for the project graph
 * (universal entity-relationship graph). Picks a project, loads its nodes and
 * edges, and renders them grouped by kind with an edge list.
 */
const UniversalGraphPanel: React.FC = () => {
    const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
    const [projectId, setProjectId] = useState('');
    const [source, setSource] = useState<'project' | 'navigation' | 'documents'>('project');
    const [view, setView] = useState<GraphView>({ nodes: [], edges: [] });
    const [docs, setDocs] = useState<TWikiPage[]>([]);
    const [attached, setAttached] = useState<Set<string>>(() => new Set());
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        void projectManagerService
            .list()
            .then((list) => {
                setProjects(list.map((p) => ({ id: p.id, name: p.name })));
                if (list.length > 0) setProjectId(list[0]!.id);
            })
            .catch(() => setError('Failed to load projects'));
    }, []);

    useEffect(() => {
        if (source === 'project' && !projectId) return;
        setLoading(true);
        setError(null);
        if (source === 'navigation') {
            const data = buildNavigationGraphData(t);
            setView(data);
            setSelectedNode(null);
            setLoading(false);
            return;
        }
        if (source === 'documents') {
            void (async () => {
                try {
                    const pages = await getBrain().store.listPages({ limit: 10000 });
                    setDocs(pages);
                } catch (e) {
                    setError(e instanceof Error ? e.message : String(e));
                } finally {
                    setLoading(false);
                }
            })();
            return;
        }
        const repo = new ProjectGraphRepository();
        void Promise.all([repo.listNodes({ projectId }), repo.listEdges(projectId)])
            .then(([nodes, edges]) => {
                setView({ nodes, edges });
                setSelectedNode(null);
            })
            .catch((e) => setError(e instanceof Error ? e.message : String(e)))
            .finally(() => setLoading(false));
    }, [projectId, source, t]);

    const attachPage = async (slug: string) => {
        if (!projectId) {
            setMessage('Сначала выберите проект');
            return;
        }
        try {
            const brain = getBrain();
            const page = await brain.store.getPageBySlug(slug);
            if (!page) {
                setMessage(`Страница не найдена: ${slug}`);
                return;
            }
            const graphSvc = getContainer().get<{
                upsertNode(input: {
                    projectId: string;
                    kind: string;
                    label: string;
                    refType?: string;
                    refId?: string;
                }): Promise<{ id: string }>;
                link(input: { projectId: string; from: string; to: string; relation: string }): Promise<unknown>;
            }>('projectGraphService');
            const node = await graphSvc.upsertNode({
                projectId,
                kind: 'knowledge',
                label: page.frontmatter.title,
                refType: 'wiki-page',
                refId: slug,
            });
            await graphSvc.link({ projectId, from: projectId, to: node.id, relation: 'contains' });
            for (const src of page.frontmatter.sources ?? []) {
                const s = await brain.store.getSource(src.sourceId);
                if (s && !s.projectId) {
                    await brain.store.putSource({ ...s, projectId });
                }
            }
            setAttached((prev) => new Set(prev).add(slug));
            setMessage(`Прикреплено: ${slug}`);
        } catch (e) {
            setMessage(e instanceof Error ? e.message : String(e));
        }
    };

    const grouped = useMemo(() => {
        const map = new Map<string, ProjectGraphNode[]>();
        for (const n of view.nodes) {
            const bucket = map.get(n.kind) ?? [];
            bucket.push(n);
            map.set(n.kind, bucket);
        }
        return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
    }, [view.nodes]);

    const incident = useMemo(() => {
        if (!selectedNode) return [];
        return view.edges.filter((e) => e.from === selectedNode || e.to === selectedNode);
    }, [view.edges, selectedNode]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Universal Graph</span>
                <select
                    value={source}
                    onChange={(e) =>
                        setSource(e.target.value as 'project' | 'navigation' | 'documents')
                    }
                    style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                        fontSize: 12,
                        color: 'inherit',
                    }}
                >
                    <option value="project">Project</option>
                    <option value="navigation">Navigation</option>
                    <option value="documents">Документы</option>
                </select>
                {source === 'project' && (
                    <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-elevated)',
                            fontSize: 12,
                            color: 'inherit',
                        }}
                    >
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                )}
                <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                    {view.nodes.length} nodes · {view.edges.length} edges
                </span>
            </div>

            {error && <div style={{ fontSize: 12, color: 'var(--error)' }}>{error}</div>}
            {loading && <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>Loading…</div>}
            {message && <div style={{ fontSize: 12, color: 'var(--slate-400)', marginBottom: 8 }}>{message}</div>}

            {source === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-400)' }}>
                        Документы вики ({docs.length})
                    </div>
                    {docs.length === 0 && !loading && (
                        <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                            Страниц нет.
                        </div>
                    )}
                    {docs.slice(0, 200).map((p) => (
                        <div
                            key={p.slug}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                fontSize: 12,
                            }}
                        >
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.frontmatter.title}
                            </span>
                            <code style={{ color: 'var(--slate-500)', fontSize: 11 }}>{p.slug}</code>
                            {attached.has(p.slug) ? (
                                <span style={{ color: 'var(--ok)', fontSize: 12 }}>✓</span>
                            ) : (
                                <button
                                    onClick={() => void attachPage(p.slug)}
                                    disabled={!projectId}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        border: '1px solid rgba(59,130,246,0.3)',
                                        background: 'transparent',
                                        color: '#60a5fa',
                                        fontSize: 11,
                                        cursor: projectId ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    Прикрепить
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {grouped.length === 0 && !loading && (
                <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                    No graph nodes for this project yet.
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 8,
                }}
            >
                {grouped.map(([kind, nodes]) => (
                    <div
                        key={kind}
                        style={{
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 10,
                            padding: '8px 10px',
                            background: 'rgba(255,255,255,0.02)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: 'var(--slate-500)',
                                textTransform: 'uppercase',
                                marginBottom: 6,
                            }}
                        >
                            <span style={{ color: KIND_COLORS[kind] ?? '#94a3b8' }}>●</span> {kind}{' '}
                            ({nodes.length})
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                maxHeight: 160,
                                overflowY: 'auto',
                            }}
                        >
                            {nodes.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() =>
                                        setSelectedNode(selectedNode === n.id ? null : n.id)
                                    }
                                    style={{
                                        textAlign: 'left',
                                        padding: '4px 8px',
                                        borderRadius: 6,
                                        border:
                                            selectedNode === n.id
                                                ? '1px solid #3b82f6'
                                                : '1px solid rgba(255,255,255,0.05)',
                                        background:
                                            selectedNode === n.id
                                                ? 'rgba(59,130,246,0.12)'
                                                : 'transparent',
                                        color: 'var(--slate-200)',
                                        fontSize: 11,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {n.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {selectedNode && (
                <div
                    style={{
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        padding: '8px 10px',
                        fontSize: 11,
                    }}
                >
                    {(() => {
                        const sel = view.nodes.find((n) => n.id === selectedNode);
                        if (!sel) return null;
                        return (
                            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700 }}>{sel.label}</span>
                                {sel.refType === 'wiki-page' && sel.refId && (
                                    <>
                                        <code style={{ color: 'var(--slate-500)', fontSize: 11 }}>{sel.refId}</code>
                                        <button
                                            onClick={() => navigate('/wiki-brain')}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 6,
                                                border: '1px solid rgba(59,130,246,0.3)',
                                                background: 'transparent',
                                                color: '#60a5fa',
                                                fontSize: 11,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Открыть в Wiki Brain
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })()}
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Relations</div>
                    {incident.length === 0 && (
                        <span style={{ color: 'var(--slate-500)' }}>none</span>
                    )}
                    {incident.map((e) => (
                        <div
                            key={e.id}
                            style={{
                                display: 'flex',
                                gap: 6,
                                padding: '2px 0',
                                color: 'var(--slate-400)',
                            }}
                        >
                            <span>{e.from}</span>
                            <span style={{ color: '#60a5fa' }}>{e.relation}</span>
                            <span>{e.to}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UniversalGraphPanel;
