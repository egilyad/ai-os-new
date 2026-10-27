import React, { useCallback, useEffect, useState } from 'react';
import { getContainer } from '../../kernel/service-helper';
import { tokens } from '../../styles/tokens';
import { useTranslation } from '../../i18n/useTranslation';
import { MarkdownRenderer } from '../ChatPanel/MarkdownRenderer';
import { KnowledgeGraphView, type GraphViewData } from '../viz/KnowledgeGraphView';
import { WIKI_ARTICLES } from '../WikiPanel/wiki-articles';
import type { IWikiBrainService } from '../../kernel/contracts/wiki-brain';
import type { TWikiPage, TWikiPageFrontmatter } from '../../kernel/contracts/wiki-brain';

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

const buttonStyle: React.CSSProperties = {
    background: tokens.accent,
    color: tokens.slate[950],
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontWeight: 700,
    cursor: 'pointer',
};

export default function WikiBrainPanel() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<Stats | null>(null);
    const [pages, setPages] = useState<PageRow[]>([]);
    const [queue, setQueue] = useState<QueueRow[]>([]);
    const [lint, setLint] = useState<LintRow[]>([]);
    const [graph, setGraph] = useState<GraphViewData>({ nodes: [], edges: [] });
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [storageMb, setStorageMb] = useState<number | null>(null);
    const [vault, setVault] = useState<{ name: string | null; attached: boolean; message?: string }>({
        name: null,
        attached: false,
    });
    const [selected, setSelected] = useState<TWikiPage | null>(null);

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
            const deg = new Map<string, number>();
            const bump = (id: string) => deg.set(id, (deg.get(id) ?? 0) + 1);
            for (const edge of g.edges) {
                bump(edge.source);
                bump(edge.target);
            }
            setGraph({
                nodes: g.nodes.map((n) => ({
                    id: n.id,
                    label: n.label,
                    type: 'knowledge',
                    degree: deg.get(n.id) ?? 0,
                })),
                edges: g.edges.map((e) => ({ source: e.source, target: e.target, kind: 'link', weight: 1 })),
            });
            try {
                if (navigator.storage?.estimate) {
                    const { usage } = await navigator.storage.estimate();
                    setStorageMb(usage ? Math.round(usage / 1024 / 1024) : null);
                }
            } catch {
                setStorageMb(null);
            }
        } catch {
            setStats(null);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    // Auto-fill Wiki Brain from the built-in wiki corpus on first open (empty store).
    useEffect(() => {
        let alive = true;
        void (async () => {
            try {
                const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
                const store = brain.store;
                const pages = await store.listPages({ limit: 1 });
                if (!alive) return;
                if (pages.length === 0) {
                    await syncFromBuiltinWiki();
                }
            } catch {
                /* store may be unavailable — ignore */
            }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const typeFromSection = (section: string): TWikiPageFrontmatter['type'] => {
        switch (section) {
            case 'guide':
                return 'overview';
            case 'architecture':
                return 'overview';
            case 'memory':
                return 'concept';
            case 'providers':
                return 'concept';
            case 'panels':
                return 'curated';
            case 'dev':
                return 'curated';
            default:
                return 'concept';
        }
    };

    const syncFromBuiltinWiki = async () => {
        setBusy(true);
        setMessage('');
        try {
            const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
            const store = brain.store;
            const now = new Date().toISOString();
            const pages: TWikiPage[] = [];
            let skipped = 0;

            for (const a of WIKI_ARTICLES) {
                const existing = await store.getPageBySlug(a.slug);
                if (existing) {
                    skipped += 1;
                    continue;
                }
                pages.push({
                    id: `wiki-${a.slug}`,
                    slug: a.slug,
                    frontmatter: {
                        slug: a.slug,
                        title: a.title,
                        type: typeFromSection(a.section),
                        sources: [],
                        aliases: [],
                        tags: a.tags ?? [],
                        language: 'ru',
                        createdAt: now,
                        updatedAt: now,
                        reviewState: 'auto',
                        graphIn: 0,
                        graphOut: 0,
                    },
                    body: a.body ?? '',
                    sha256: `wiki-${a.slug}`,
                    rawMarkdown: `# ${a.title}\n\n${a.body ?? ''}`,
                });
            }

            if (pages.length > 0) await store.bulkPutPages(pages);
            setMessage(`${t('wiki.sync_builtin_msg', { count: pages.length })} (пропущено: ${skipped})`);
            await load();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setMessage(t('wiki.error_msg', { message }));
        } finally {
            setBusy(false);
        }
    };

    const seedDemo = async () => {
        setBusy(true);
        setMessage('');
        try {
            const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
            const store = brain.store;
            const now = new Date().toISOString();
            const demos: Array<{ slug: string; title: string; type: TWikiPage['frontmatter']['type']; body: string }> = [
                {
                    slug: 'agent-system',
                    title: 'Система агентов',
                    type: 'overview',
                    body: 'Агенты в SuperAgents OS — это профили с ролями, перcна и набором инструментов. Они выполняют задачи, участвуют в дебатах и имеют свою память.',
                },
                {
                    slug: 'memory-engine',
                    title: 'Движок памяти',
                    type: 'concept',
                    body: 'MemoryEngine сочетает BM25 и семантические эмбеддинги. Хранит записи в таблице memories и поддерживает гибридный поиск.',
                },
                {
                    slug: 'debate-runtime',
                    title: 'Рантайм дебатов',
                    type: 'concept',
                    body: 'DebateEngine управляет сессиями дебатов: стратегии, раунды, вердикты. Есть синхронизация и вердикты в отдельной таблице.',
                },
                {
                    slug: 'knowledge-pipeline',
                    title: 'Конвейер знаний',
                    type: 'overview',
                    body: 'Knowledge → Crystal Vault → Junction → Synthesis → Knowledge Generator — единый путь превращения источников в проверенные утверждения.',
                },
            ];
            const pages: TWikiPage[] = demos.map((d, i) => ({
                id: `demo-page-${i}`,
                slug: d.slug,
                frontmatter: {
                    slug: d.slug,
                    title: d.title,
                    type: d.type,
                    sources: [{ sourceId: `demo-src-${i}`, title: d.title, sha256: `demo-${i}` }],
                    aliases: [],
                    tags: ['demo'],
                    language: 'ru',
                    createdAt: now,
                    updatedAt: now,
                    reviewState: 'auto',
                    graphIn: 0,
                    graphOut: 0,
                },
                body: d.body,
                sha256: `demo-sha-${i}`,
                rawMarkdown: `# ${d.title}\n\n${d.body}`,
            }));
            await store.bulkPutPages(pages);
            setMessage(t('wiki.demo_seeded_msg', { count: pages.length }));
            await load();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setMessage(t('wiki.error_msg', { message }));
        } finally {
            setBusy(false);
        }
    };

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
            setMessage(t('wiki.queued_msg', { title }));
            setTitle('');
            setContent('');
            await load();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setMessage(t('wiki.error_msg', { message }));
        } finally {
            setBusy(false);
        }
    };

    const openPage = async (slug: string) => {
        try {
            const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
            const page = await brain.store.getPageBySlug(slug);
            setSelected(page ?? null);
        } catch {
            setSelected(null);
        }
    };

    const setReview = async (slug: string, state: 'auto' | 'flagged' | 'approved' | 'rejected') => {
        try {
            const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
            const page = await brain.store.getPageBySlug(slug);
            if (!page) return;
            await brain.store.putPage({
                ...page,
                frontmatter: {
                    ...page.frontmatter,
                    reviewState: state,
                    updatedAt: new Date().toISOString(),
                },
            });
            setSelected((current) => (current && current.slug === slug ? { ...current, frontmatter: { ...current.frontmatter, reviewState: state, updatedAt: new Date().toISOString() } } : current));
            await load();
        } catch {
            // ignore review update failures
        }
    };

    const attachVault = async () => {
        try {
            const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
            const result = await brain.vault.attachVault();
            setVault({ name: result.name, attached: result.attached });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setVault((v) => ({ ...v, message: t('wiki.vault_error', { message }) }));
        }
    };

    const detachVault = async () => {
        const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
        await brain.vault.detachVault();
        setVault({ name: null, attached: false });
    };

    const exportVault = async () => {
        setBusy(true);
        try {
            const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
            const result = await brain.vault.exportToVault();
            setVault({ name: result.name, attached: result.attached, message: t('wiki.vault_export_done', { count: result.exported }) });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setVault((v) => ({ ...v, message: t('wiki.vault_error', { message }) }));
        } finally {
            setBusy(false);
        }
    };

    const importVault = async () => {
        setBusy(true);
        try {
            const brain = getContainer().get<IWikiBrainService>('wikiBrainService');
            const result = await brain.vault.importFromVault();
            setVault({
                name: result.name,
                attached: result.attached,
                message: t('wiki.vault_import_done', { imported: result.imported, skipped: result.skipped }),
            });
            await load();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setVault((v) => ({ ...v, message: t('wiki.vault_error', { message }) }));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto', color: tokens.slate[200] }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t('wiki.title')}</h1>
            <p style={{ color: tokens.slate[400], marginBottom: 24, fontSize: 14 }}>
                {t('wiki.subtitle')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                <div style={statBox}>
                    <div style={label}>{t('wiki.stat_pages')}</div>
                    <div style={statValue}>{stats?.pages ?? '–'}</div>
                </div>
                <div style={statBox}>
                    <div style={label}>{t('wiki.stat_sources')}</div>
                    <div style={statValue}>{stats?.sources ?? '–'}</div>
                </div>
                <div style={statBox}>
                    <div style={label}>{t('wiki.stat_queued')}</div>
                    <div style={statValue}>{stats?.pending ?? '–'}</div>
                </div>
                <div style={statBox}>
                    <div style={label}>{t('wiki.stat_lint')}</div>
                    <div style={statValue}>{stats?.issues ?? '–'}</div>
                </div>
            </div>

            <div style={{ background: tokens.surface, border: `1px solid ${tokens.borderSubtle}`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
                <div style={label}>{t('wiki.queue_title')}</div>
                <input
                    style={{ ...input, marginBottom: 8 }}
                    placeholder={t('wiki.title_placeholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                    style={{ ...input, minHeight: 90 }}
                    placeholder={t('wiki.content_placeholder')}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                    <button
                        style={{
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
                        {busy ? t('wiki.queuing') : t('wiki.queue_button')}
                    </button>
                    <button
                        style={{
                            background: 'transparent',
                            color: tokens.accent,
                            border: `1px solid ${tokens.accent}`,
                            borderRadius: 8,
                            padding: '8px 14px',
                            fontWeight: 700,
                            cursor: busy ? 'default' : 'pointer',
                        }}
                        disabled={busy}
                        onClick={seedDemo}
                        title="Добавить несколько примеров статей"
                    >
                        🎲 Демо
                    </button>
                    <button
                        style={{
                            background: tokens.accent,
                            color: tokens.slate[950],
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 14px',
                            fontWeight: 700,
                            cursor: busy ? 'default' : 'pointer',
                        }}
                        disabled={busy}
                        onClick={syncFromBuiltinWiki}
                        title="Импортировать все встроенные статьи вики (docs/wiki) в Wiki Brain"
                    >
                        ⬇ Синхронизировать из вики
                    </button>
                </div>
                {message && <div style={{ marginTop: 8, fontSize: 13, color: tokens.slate[400] }}>{message}</div>}
            </div>

            <div style={label}>{t('wiki.recent_pages')}</div>
            {pages.length === 0 ? (
                <div style={{ color: tokens.slate[500], fontSize: 14 }}>
                    {t('wiki.no_pages')} — Wiki Brain — это отдельное хранилище (не продуктовая память). Добавь источник через форму выше или нажми «Демо-засев», чтобы увидеть пример.
                </div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {pages.map((p) => (
                        <li
                            key={p.slug}
                            onClick={() => openPage(p.slug)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: tokens.surface,
                                border: `1px solid ${tokens.borderSubtle}`,
                                borderRadius: 8,
                                padding: '10px 12px',
                                marginBottom: 6,
                                cursor: 'pointer',
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

            {selected && (
                <div
                    style={{
                        marginTop: 24,
                        background: tokens.surface,
                        border: `1px solid ${tokens.borderSubtle}`,
                        borderRadius: 10,
                        padding: 16,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.frontmatter.title}</div>
                        <button
                            style={{ ...buttonStyle, background: tokens.borderDefault }}
                            onClick={() => setSelected(null)}
                        >
                            ✕
                        </button>
                    </div>
                    <div style={{ color: tokens.slate[500], fontSize: 13, marginBottom: 12 }}>
                        {selected.slug} · {selected.frontmatter.type} ·{' '}
                        {t(`wiki.review_${selected.frontmatter.reviewState}`)}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        {(['approved', 'flagged', 'rejected', 'auto'] as const).map((state) => (
                            <button
                                key={state}
                                style={{
                                    ...buttonStyle,
                                    background:
                                        selected.frontmatter.reviewState === state
                                            ? tokens.accent
                                            : tokens.borderDefault,
                                }}
                                onClick={() => setReview(selected.slug, state)}
                            >
                                {t(`wiki.review_${state}`)}
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                        <MarkdownRenderer content={selected.body} />
                    </div>
                </div>
            )}

            <div style={{ ...label, marginTop: 24 }}>{t('wiki.ingest_queue')}</div>
            {queue.length === 0 ? (
                <div style={{ color: tokens.slate[500], fontSize: 14 }}>{t('wiki.queue_empty')}</div>
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

            <div style={{ ...label, marginTop: 24 }}>{t('wiki.lint_issues')}</div>
            {lint.length === 0 ? (
                <div style={{ color: tokens.slate[500], fontSize: 14 }}>{t('wiki.no_lint')}</div>
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

            <div style={{ ...label, marginTop: 24 }}>{t('wiki.knowledge_graph')}</div>
            <div
                style={{
                    height: 420,
                    background: tokens.surface,
                    border: `1px solid ${tokens.borderSubtle}`,
                    borderRadius: 10,
                    overflow: 'hidden',
                }}
            >
                <KnowledgeGraphView data={graph} height={420} />
            </div>

            <div
                style={{
                    marginTop: 24,
                    background: tokens.surface,
                    border: `1px solid ${tokens.borderSubtle}`,
                    borderRadius: 10,
                    padding: 16,
                }}
            >
                <div style={label}>{t('wiki.vault_title')}</div>
                <div style={{ color: tokens.slate[400], fontSize: 13, marginBottom: 12 }}>
                    {vault.attached && vault.name
                        ? t('wiki.vault_attached', { name: vault.name })
                        : t('wiki.vault_not_attached')}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {!vault.attached ? (
                        <button
                            style={buttonStyle}
                            onClick={attachVault}
                        >
                            {t('wiki.vault_attach')}
                        </button>
                    ) : (
                        <button
                            style={{ ...buttonStyle, background: tokens.borderDefault }}
                            onClick={detachVault}
                        >
                            {t('wiki.vault_detach')}
                        </button>
                    )}
                    <button
                        style={{ ...buttonStyle, background: tokens.success, color: tokens.slate[950] }}
                        disabled={!vault.attached || busy}
                        onClick={exportVault}
                    >
                        {t('wiki.vault_export')}
                    </button>
                    <button
                        style={{ ...buttonStyle, background: tokens.accent }}
                        disabled={!vault.attached || busy}
                        onClick={importVault}
                    >
                        {t('wiki.vault_import')}
                    </button>
                </div>
                {vault.message && (
                    <div style={{ marginTop: 8, fontSize: 13, color: tokens.slate[400] }}>
                        {vault.message}
                    </div>
                )}
            </div>

            <div
                style={{
                    marginTop: 24,
                    background: tokens.surface,
                    border: `1px solid ${tokens.borderSubtle}`,
                    borderRadius: 10,
                    padding: 16,
                }}
            >
                <div style={label}>{t('wiki.settings_title')}</div>

                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t('wiki.settings_semantic')}</div>
                    <div style={{ color: tokens.slate[400], fontSize: 13, marginTop: 2 }}>
                        {t('wiki.settings_semantic_hint')}
                    </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t('wiki.settings_queue_worker')}</div>
                    <div style={{ color: tokens.slate[400], fontSize: 13, marginTop: 2 }}>
                        {t('wiki.settings_queue_worker_hint')}
                    </div>
                </div>

                <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t('wiki.settings_storage')}</div>
                    <div style={{ color: tokens.slate[400], fontSize: 13, marginTop: 2 }}>
                        {t('wiki.settings_storage_usage')}:{' '}
                        {storageMb === null ? '–' : `${storageMb} MB`}
                    </div>
                </div>
            </div>
        </div>
    );
}
