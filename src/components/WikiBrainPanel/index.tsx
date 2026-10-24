import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlow, Controls, Background, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getContainer } from '../../kernel/service-helper';
import { tokens } from '../../styles/tokens';
import type { IWikiBrainService } from '../../kernel/contracts/wiki-brain';

interface Stats {
    pages: number;
    sources: number;
    pending: number;
    total: number;
    issues: number;
}

interface PageRow {
    slug: string;
    title: string;
    type: string;
}

interface QueueRow {
    id: string;
    status: string;
}

interface LintRow {
    rule: string;
    severity: string;
    message: string;
}

const label: React.CSSProperties = {
    fontSize: 12,
    color: tokens.slate[500],
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
};

const statBox: React.CSSProperties = {
    background: tokens.surface,
    border: `1px solid ${tokens.borderSubtle}`,
    borderRadius: 8,
    padding: '12px 14px',
};

const statValue: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: tokens.slate[200] };

const input: React.CSSProperties = {
    width: '100%',
    background: tokens.surface,
    border: `1px solid ${tokens.borderDefault}`,
    borderRadius: 8,
    padding: '8px 10px',
    color: tokens.slate[200],
    fontSize: 14,
};

export default function WikiBrainPanel() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [pages, setPages] = useState<PageRow[]>([]);
    const [queue, setQueue] = useState<QueueRow[]>([]);
    const [lint, setLint] = useState<LintRow[]>([]);
    const [graph, setGraph] = useState<{ nodes: unknown[]; edges: unknown[] }>({ nodes: [], edges: [] });
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        try {
            const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
            const store = brain.store;
            const [allPages, allSources, allQueue, issues, g] = await Promise.all([
                store.listPages({ limit: 10000 }),
                store.listSources({ limit: 10000 }),
                store.listQueue(),
                brain.lint.listIssues(),
                brain.graph.toFlowGraph(),
            ]);
            const pending = allQueue.filter((t) => t.status === 'pending').length;
            setStats({
                pages: allPages.length,
                sources: allSources.length,
                pending,
                total: allQueue.length,
                issues: issues.length,
            });
            setPages(
                allPages
                    .slice(0, 20)
                    .map((p) => ({ slug: p.slug, title: p.frontmatter.title, type: p.frontmatter.type })),
            );
            setQueue(
                allQueue
                    .slice(0, 10)
                    .map((t) => ({ id: t.id, status: t.status })),
            );
            setLint(
                issues
                    .slice(0, 10)
                    .map((i) => ({ rule: i.rule, severity: i.severity, message: i.message })),
            );
            setGraph({ nodes: g.nodes, edges: g.edges });
        } catch {
            setStats(null);
        }
    }, []);

    const flowNodes = useMemo<Node[]>(
        () =>
            graph.nodes.map((n, index) => {
                const node = n as { id: string; label: string };
                const angle = graph.nodes.length > 1 ? (2 * Math.PI * index) / graph.nodes.length : 0;
                const radius = 140;
                return {
                    id: node.id,
                    position: {
                        x: radius * Math.cos(angle),
                        y: radius * Math.sin(angle),
                    },
                    data: { label: node.label },
                };
            }),
        [graph],
    );

    const flowEdges = useMemo<Edge[]>(
        () =>
            graph.edges.map((e) => {
                const edge = e as { id: string; source: string; target: string };
                return { id: edge.id, source: edge.source, target: edge.target };
            }),
        [graph],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const enqueue = async () => {
        if (!title.trim() || !content.trim()) return;
        setBusy(true);
        setMessage('');
        try {
            const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
            const store = brain.store;
            const encoder = new TextEncoder();
            const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(content));
            const sha256 = Array.from(new Uint8Array(buffer))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
            const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
            const sourceId = `src-${uid()}`;
            const taskId = `task-${uid()}`;
            await store.putSource({
                id: sourceId,
                kind: 'markdown',
                title,
                origin: title,
                sha256,
                sizeBytes: content.length,
                language: 'auto',
                contentText: content,
                meta: {},
                importedAt: new Date().toISOString(),
            });
            await store.enqueue({ id: taskId, sourceId, status: 'pending', attempts: 0, priority: 0 });
            setMessage(`Queued "${title}" for ingest`);
            setTitle('');
            setContent('');
            await load();
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto', color: tokens.slate[200] }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Wiki Brain</h1>
            <p style={{ color: tokens.slate[400], marginBottom: 24, fontSize: 14 }}>
                LLM-compiled knowledge base — separate IndexedDB, isolated from the product memory.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                <div style={statBox}>
                    <div style={label}>Pages</div>
                    <div style={statValue}>{stats?.pages ?? '–'}</div>
                </div>
                <div style={statBox}>
                    <div style={label}>Sources</div>
                    <div style={statValue}>{stats?.sources ?? '–'}</div>
                </div>
                <div style={statBox}>
                    <div style={label}>Queued</div>
                    <div style={statValue}>{stats?.pending ?? '–'}</div>
                </div>
                <div style={statBox}>
                    <div style={label}>Lint issues</div>
                    <div style={statValue}>{stats?.issues ?? '–'}</div>
                </div>
            </div>

            <div style={{ background: tokens.surface, border: `1px solid ${tokens.borderSubtle}`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
                <div style={label}>Queue a markdown source</div>
                <input
                    style={{ ...input, marginBottom: 8 }}
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                    style={{ ...input, minHeight: 90 }}
                    placeholder="Paste markdown content…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <button
                    style={{
                        marginTop: 10,
                        background: busy ? tokens.borderDefault : tokens.success,
                        color: tokens.slate[950],
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontWeight: 700,
                        cursor: busy ? 'default' : 'pointer',
                    }}
                    disabled={busy || !title.trim() || !content.trim()}
                    onClick={enqueue}
                >
                    {busy ? 'Queuing…' : 'Queue for ingest'}
                </button>
                {message && <div style={{ marginTop: 8, fontSize: 13, color: tokens.slate[400] }}>{message}</div>}
            </div>

            <div style={label}>Recent pages</div>
            {pages.length === 0 ? (
                <div style={{ color: tokens.slate[500], fontSize: 14 }}>No pages yet.</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {pages.map((p) => (
                        <li
                            key={p.slug}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                background: tokens.surface,
                                border: `1px solid ${tokens.borderSubtle}`,
                                borderRadius: 8,
                                padding: '10px 12px',
                                marginBottom: 6,
                            }}
                        >
                            <span>{p.title}</span>
                            <span style={{ color: tokens.slate[500], fontSize: 13 }}>
                                {p.slug} · {p.type}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <div style={{ ...label, marginTop: 24 }}>Ingest queue</div>
            {queue.length === 0 ? (
                <div style={{ color: tokens.slate[500], fontSize: 14 }}>Queue is empty.</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {queue.map((t) => (
                        <li
                            key={t.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                background: tokens.surface,
                                border: `1px solid ${tokens.borderSubtle}`,
                                borderRadius: 8,
                                padding: '10px 12px',
                                marginBottom: 6,
                            }}
                        >
                            <span>{t.id}</span>
                            <span style={{ color: tokens.slate[500], fontSize: 13 }}>{t.status}</span>
                        </li>
                    ))}
                </ul>
            )}

            <div style={{ ...label, marginTop: 24 }}>Lint issues</div>
            {lint.length === 0 ? (
                <div style={{ color: tokens.slate[500], fontSize: 14 }}>No lint issues.</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {lint.map((i) => (
                        <li
                            key={`${i.rule}-${i.message}`}
                            style={{
                                background: tokens.surface,
                                border: `1px solid ${tokens.borderSubtle}`,
                                borderRadius: 8,
                                padding: '10px 12px',
                                marginBottom: 6,
                            }}
                        >
                            <div>
                                <span style={{ fontWeight: 600 }}>{i.rule}</span>{' '}
                                <span style={{ color: tokens.slate[500], fontSize: 13 }}>[{i.severity}]</span>
                            </div>
                            <div style={{ color: tokens.slate[400], fontSize: 13, marginTop: 2 }}>{i.message}</div>
                        </li>
                    ))}
                </ul>
            )}

            <div style={{ ...label, marginTop: 24 }}>Knowledge graph</div>
            <div
                style={{
                    height: 420,
                    background: tokens.surface,
                    border: `1px solid ${tokens.borderSubtle}`,
                    borderRadius: 10,
                    overflow: 'hidden',
                }}
            >
                <ReactFlow nodes={flowNodes} edges={flowEdges} fitView>
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}
