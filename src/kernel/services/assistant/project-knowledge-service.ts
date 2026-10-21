/**
 * ProjectKnowledgeService — the assistant's map of SuperAgents OS.
 *
 * The assistant must answer questions about *this* system: what a component
 * is, how it is wired, where it lives in the code and which panel opens it.
 * A language model cannot know that — the system changes every day.
 *
 * Three layers of knowledge are assembled here:
 *  - documentary (layer A): wiki articles — their text, sources, freshness;
 *  - structural (layer B): the panel → route → component → tests chain and
 *    the component catalogue, all derived from the *code* by the wiki
 *    generators, not from names;
 *  - operational (layer D): what is reachable right now — the panels that
 *    exist and the routes they live at.
 *
 * The article corpus lives in the UI layer (`src/components/WikiPanel`), and
 * the kernel must not import UI modules (dependency rule `no-ui-in-kernel`).
 * The corpus is therefore *pushed* into the service by the UI
 * (`setCorpusProvider`), while the structural layer comes from the generated
 * artifacts in `src/generated/` — they are plain data, safe for the kernel.
 *
 * Trust levels follow the design note: a panel that exists in the registry is
 * "discovered"; it becomes "verified" only when the assistant actually
 * executed the action and observed the result.
 */
import { WIKI_CONNECTIONS } from '../../../generated/wiki-connections';
import { WIKI_PANEL_MAP } from '../../../generated/wiki-panel-map';
import { Bm25Service } from '../rag/bm25-service';

/** A wiki article as the assistant sees it. */
export interface KnowledgeArticle {
    slug: string;
    title: string;
    section: string;
    body: string;
    freshness?: string;
    sources?: string[];
    related?: string[];
    tags?: string[];
}

/** A panel of the application: where it lives and what implements it. */
export interface KnowledgePanel {
    id: string;
    route: string;
    component: string | null;
    article: string | null;
    tests: string[];
    section: string;
}

export interface KnowledgeHit {
    kind: 'article' | 'panel';
    /** Article slug or panel id. */
    id: string;
    title: string;
    score: number;
    snippet?: string;
    route?: string;
}

export interface KnowledgeContext {
    hits: KnowledgeHit[];
    /** Ready-to-inject markdown block. */
    markdown: string;
}

export type KnowledgeCorpusProvider = () => KnowledgeArticle[];

const MAX_SNIPPET = 400;

function tokens(text: string): string[] {
    return text
        .toLowerCase()
        .split(/[^a-zа-яё0-9]+/u)
        .filter((t) => t.length > 2);
}

/**
 * Panel ids and code are English; the user asks in Russian. Without this the
 * query "где память" finds nothing, which reads as "the system does not know
 * its own memory panel".
 */
const QUERY_ALIASES: Record<string, string[]> = {
    агент: ['agent', 'agents'],
    память: ['memory'],
    ключ: ['key', 'keys'],
    дебат: ['debate', 'debates'],
    спор: ['debate'],
    настройк: ['settings'],
    роль: ['role', 'roles'],
    команда: ['team', 'crew'],
    инструмент: ['tool', 'tools'],
    модель: ['model', 'models'],
    провайдер: ['provider', 'providers'],
    лог: ['log', 'logs'],
    трасс: ['trace', 'traces'],
    бюджет: ['budget'],
    стоимост: ['cost', 'costs'],
    безопасност: ['security', 'permission'],
    политик: ['policy'],
    задач: ['task', 'tasks'],
    канал: ['channel', 'channels'],
    проект: ['project', 'projects'],
    граф: ['graph'],
    знани: ['knowledge'],
    навык: ['skill', 'skills'],
    умени: ['skill'],
    журнал: ['journal'],
    событи: ['event', 'events'],
    метрик: ['metric', 'metrics'],
    здоровь: ['health'],
    хранил: ['storage', 'store'],
    файл: ['file', 'files'],
    поиск: ['search'],
    помощник: ['assistant'],
    сесси: ['session', 'sessions'],
    опрос: ['poll', 'survey'],
    совет: ['council'],
    консенсус: ['consensus'],
    воркфлоу: ['workflow'],
    сценари: ['scenario'],
    симуляци: ['simulation'],
    интеграци: ['integration'],
    подключени: ['connector'],
};

/** Expand a query token with its English counterparts (prefix match). */
function expand(token: string): string[] {
    const out = [token];
    for (const [stem, values] of Object.entries(QUERY_ALIASES)) {
        if (token.startsWith(stem) || stem.startsWith(token)) out.push(...values);
    }
    return out;
}

function queryTokens(text: string): string[] {
    const out = new Set<string>();
    for (const token of tokens(text)) {
        for (const expanded of expand(token)) out.add(expanded);
    }
    return [...out];
}

/** First line of the body that mentions one of the query words. */
function snippet(body: string, query: string): string {
    const q = tokens(query);
    for (const line of body.split('\n')) {
        const low = line.toLowerCase();
        if (line.trim() && q.some((t) => low.includes(t))) {
            return line.trim().slice(0, MAX_SNIPPET);
        }
    }
    return (body.split('\n').find((l) => l.trim()) ?? '').trim().slice(0, MAX_SNIPPET);
}

export class ProjectKnowledgeService {
    private corpus: KnowledgeArticle[] = [];
    private corpusProvider: KnowledgeCorpusProvider | null = null;
    private bm25: Bm25Service | null = null;
    private bm25For = -1;
    private panels = new Map<string, KnowledgePanel>();

    constructor() {
        this.buildPanels();
    }

    /** The UI pushes the article corpus here (the kernel cannot import it). */
    setCorpusProvider(provider: KnowledgeCorpusProvider | null): void {
        this.corpusProvider = provider;
        this.corpus = [];
        this.bm25 = null;
        this.bm25For = -1;
    }

    /** Rebuild the panel map from the generated artifacts. */
    private buildPanels(): void {
        this.panels.clear();
        // Panels known to the code (component path) — the structural layer.
        for (const [id, component] of Object.entries(WIKI_PANEL_MAP)) {
            this.panels.set(id, {
                id,
                route: `/${id}`,
                component,
                article: null,
                tests: [],
                section: '',
            });
        }
        // Panels with a wiki article — adds route, component and tests.
        for (const [slug, connections] of Object.entries(WIKI_CONNECTIONS)) {
            for (const conn of connections) {
                const existing = this.panels.get(conn.panelId);
                const panel: KnowledgePanel = existing ?? {
                    id: conn.panelId,
                    route: conn.route,
                    component: conn.component,
                    article: slug,
                    tests: [],
                    section: '',
                };
                panel.route = conn.route || panel.route;
                panel.component = conn.component ?? panel.component;
                panel.article = slug;
                panel.tests = conn.tests ?? [];
                this.panels.set(conn.panelId, panel);
            }
        }
    }

    private articles(): KnowledgeArticle[] {
        if (this.corpus.length > 0) return this.corpus;
        if (!this.corpusProvider) return [];
        this.corpus = this.corpusProvider() ?? [];
        this.bm25 = null;
        this.bm25For = -1;
        return this.corpus;
    }

    private async index(): Promise<Bm25Service | null> {
        const articles = this.articles();
        if (articles.length === 0) return null;
        if (!this.bm25 || this.bm25For !== articles.length) {
            this.bm25 = new Bm25Service();
            await this.bm25.init();
            await this.bm25.build(
                articles.map((a) => ({
                    id: a.slug,
                    text: `${a.title}\n${(a.tags ?? []).join(' ')}\n${a.body}`,
                })),
            );
            this.bm25For = articles.length;
        }
        return this.bm25;
    }

    /** All panels, optionally filtered by a free-text query. */
    panelsMatching(query?: string): KnowledgePanel[] {
        const all = [...this.panels.values()].sort((a, b) => a.id.localeCompare(b.id));
        const q = (query ?? '').trim().toLowerCase();
        if (!q) return all;
        const qt = queryTokens(q);
        return all.filter((p) => {
            const hay = `${p.id} ${p.route} ${p.component ?? ''} ${p.article ?? ''}`.toLowerCase();
            return qt.some((t) => hay.includes(t));
        });
    }

    panel(id: string): KnowledgePanel | null {
        return this.panels.get(id) ?? null;
    }

    panelByRoute(route: string): KnowledgePanel | null {
        const normalized = route.startsWith('/') ? route : `/${route}`;
        for (const p of this.panels.values()) {
            if (p.route === normalized) return p;
        }
        return null;
    }

    article(slug: string): KnowledgeArticle | null {
        return this.articles().find((a) => a.slug === slug) ?? null;
    }

    /** The panel → route → component → tests chain for one panel. */
    connections(panelId: string): {
        panelId: string;
        route: string;
        component: string | null;
        tests: string[];
        article: string | null;
    } | null {
        const panel = this.panel(panelId);
        if (!panel) return null;
        return {
            panelId: panel.id,
            route: panel.route,
            component: panel.component,
            tests: panel.tests,
            article: panel.article,
        };
    }

    /**
     * Search the system knowledge: articles by meaning (BM25) and panels by
     * name. Both are returned so the assistant can answer "what is this" and
     * "where do I open it" in one step.
     */
    async search(query: string, limit = 8): Promise<KnowledgeHit[]> {
        const q = query.trim();
        if (q.length < 2) return [];
        const hits: KnowledgeHit[] = [];

        const articles = this.articles();
        if (articles.length > 0) {
            const index = await this.index();
            const found = (await index?.search(q, limit)) ?? [];
            for (const hit of found) {
                const article = articles.find((a) => a.slug === hit.id);
                if (!article) continue;
                hits.push({
                    kind: 'article',
                    id: article.slug,
                    title: article.title,
                    score: hit.score,
                    snippet: snippet(article.body, q),
                });
            }
        }

        for (const panel of this.panelsMatching(q)) {
            hits.push({
                kind: 'panel',
                id: panel.id,
                title: panel.id,
                score: 1,
                route: panel.route,
                snippet: panel.component
                    ? `${panel.route} → ${panel.component}`
                    : panel.route,
            });
        }

        return hits.slice(0, limit);
    }

    /**
     * A ready-to-inject context block for the assistant prompt.
     *
     * It states the trust level explicitly: what the documentation claims and
     * where the implementation actually is. The assistant must not present a
     * documented capability as a working one.
     */
    async context(query: string, limit = 6): Promise<KnowledgeContext> {
        const hits = await this.search(query, limit);
        if (hits.length === 0) return { hits, markdown: '' };

        const lines: string[] = ['[SYSTEM KNOWLEDGE]'];
        for (const hit of hits) {
            if (hit.kind === 'article') {
                const article = this.article(hit.id);
                lines.push(
                    `- article "${hit.title}" (${hit.id}) — ${hit.snippet ?? ''}${
                        article?.freshness ? ` [${article.freshness}]` : ''
                    }`,
                );
                if (article?.sources?.length) {
                    lines.push(`  sources: ${article.sources.slice(0, 4).join(', ')}`);
                }
            } else {
                const panel = this.panel(hit.id);
                const tests = panel?.tests.length ? ` tests: ${panel.tests.slice(0, 3).join(', ')}` : '';
                lines.push(
                    `- panel "${panel?.id}" route ${panel?.route} → ${panel?.component ?? 'unknown'}${tests}`,
                );
            }
        }
        lines.push(
            'Note: documentation states intent; the panel/component chain is derived from the code. Verify before claiming a behaviour.',
        );
        return { hits, markdown: lines.join('\n') };
    }

    /** Compact statistics — used by the panel header and by diagnostics. */
    stats(): { panels: number; articles: number; withArticle: number; withTests: number } {
        const articles = this.articles();
        let withArticle = 0;
        let withTests = 0;
        for (const p of this.panels.values()) {
            if (p.article) withArticle += 1;
            if (p.tests.length > 0) withTests += 1;
        }
        return {
            panels: this.panels.size,
            articles: articles.length,
            withArticle,
            withTests,
        };
    }
}
