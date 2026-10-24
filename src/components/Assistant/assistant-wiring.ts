/**
 * Assistant wiring — the interface side of the assistant.
 *
 * The kernel owns the assistant's brain and its kernel-level actions. Two
 * things can only come from here:
 *  1. the wiki corpus — the kernel must not import `src/components`;
 *  2. the UI-owned actions (keys, MCP, skills) and the navigation channel —
 *     they drive the application, not the runtime.
 */
import {
    assistantActionRegistry,
    panelActionRegistry,
    projectKnowledgeService,
    keyService,
    mcpService,
    skillService,
} from '../../kernel/instances/services-core';
import { WIKI_ARTICLES } from '../WikiPanel/wiki-articles';
import {
    ensurePanelActionCatalog,
    setPanelActionExtrasServices,
} from './panel-actions-catalog';
import {
    auditService,
    federatedMemoryService,
    promptLibraryService,
    promptVersionService,
    researchRunService,
    wikiBrainService,
} from '../../kernel/instances/services-extras';

let wired = false;

function articleCorpus() {
    return WIKI_ARTICLES.map((a) => ({
        slug: a.slug,
        title: a.title,
        section: a.section,
        body: a.body,
        freshness: String(a.freshness ?? ''),
        sources: a.sources,
        related: a.related,
        tags: a.tags,
    }));
}

/** Idempotent: safe to call from every mount of the assistant panel. */
export function ensureAssistantWiring(): void {
    if (wired) return;
    wired = true;

    try {
        projectKnowledgeService.setCorpusProvider(articleCorpus);
    } catch {
        /* container not ready — the assistant works without articles */
    }

    // The panels can only advertise their capabilities from here: the kernel
    // must not import UI singletons. `panel.list/read/act` reach all of them.
    try {
        // The prompts / federation services are injected rather than imported
        // by the catalog, so the catalog stays cheap for its unit test.
        setPanelActionExtrasServices({
            federated: federatedMemoryService,
            prompts: promptLibraryService,
            promptVersions: promptVersionService,
            audit: auditService,
            research: researchRunService,
            wiki: {
                stats: async () => {
                    const [pages, sources] = await Promise.all([
                        wikiBrainService.store.listPages({ limit: 10000 }),
                        wikiBrainService.store.listSources({ limit: 10000 }),
                    ]);
                    return { pages: pages.length, sources: sources.length };
                },
                recentPages: async (limit = 10) => {
                    const pages = await wikiBrainService.store.listPages({ limit });
                    return pages.map((p) => ({
                        slug: p.slug,
                        title: p.frontmatter.title,
                        type: p.frontmatter.type,
                    }));
                },
                runLint: async () => (await wikiBrainService.lint.runAll()).length,
                enqueueSource: async ({ title, content }) => {
                    const encoder = new TextEncoder();
                    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(content));
                    const sha256 = Array.from(new Uint8Array(buffer))
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join('');
                    const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
                    const sourceId = `src-${uid()}`;
                    const taskId = `task-${uid()}`;
                    await wikiBrainService.store.putSource({
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
                    await wikiBrainService.store.enqueue({
                        id: taskId,
                        sourceId,
                        status: 'pending',
                        attempts: 0,
                        priority: 0,
                    });
                    return { sourceId, taskId };
                },
                queueSummary: async () => {
                    const all = await wikiBrainService.store.listQueue();
                    const pending = all.filter((t) => t.status === 'pending').length;
                    return { pending, total: all.length };
                },
                search: async (query) => {
                    const results = await wikiBrainService.query.search(query, { topK: 5 });
                    return results.map((r) => ({
                        slug: r.page.slug,
                        title: r.page.frontmatter.title,
                        snippet: r.snippet.slice(0, 120),
                    }));
                },
                putCuratedPage: async ({ slug, title, body }) => {
                    const now = new Date().toISOString();
                    await wikiBrainService.store.putPage({
                        id: `pg-${crypto.randomUUID?.() ?? `${Date.now()}`}`,
                        slug,
                        frontmatter: {
                            slug,
                            title,
                            type: 'curated',
                            sources: [],
                            aliases: [],
                            tags: [],
                            language: 'en',
                            createdAt: now,
                            updatedAt: now,
                            reviewState: 'auto',
                            graphIn: 0,
                            graphOut: 0,
                        },
                        body,
                        sha256: '',
                        rawMarkdown: body,
                    });
                    return { slug };
                },
                runWorker: async () => {
                    await wikiBrainService.ingest.startQueueWorker();
                    const all = await wikiBrainService.store.listQueue();
                    const pending = all.filter((t) => t.status === 'pending').length;
                    return { pending, total: all.length };
                },
            },
        });
        ensurePanelActionCatalog(panelActionRegistry);
    } catch {
        /* catalog is optional — the kernel actions still work */
    }

    try {
        assistantActionRegistry.attachUiActions({
                keys: {
                    getKeys: () =>
                        keyService.getKeys().map((k) => ({
                            id: k.id,
                            provider: k.provider,
                            status: String(k.status ?? 'unknown'),
                        })),
                    checkHealth: async (keyId?: string) => {
                        const health = await keyService.checkHealth(keyId);
                        return {
                            id: health.id,
                            status: String(health.status ?? 'unknown'),
                            latency: health.latency,
                        };
                    },
                },
                mcp: {
                    listServers: async () => {
                        const servers = mcpService.getServers();
                        return servers.map((s) => ({
                            id: s.id,
                            name: s.name,
                            status: s.status,
                            tools: s.capabilities,
                        }));
                    },
                },
                skills: {
                    getSkills: () =>
                        skillService.getSkills().map((s) => ({
                            id: s.id,
                            name: s.name,
                            description: s.description,
                        })),
                },
            });
    } catch {
        /* UI services are optional; the kernel actions still work */
    }
}
