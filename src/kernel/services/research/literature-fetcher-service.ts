import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { TWikiSource } from '../../contracts/wiki-brain/types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('LiteratureFetcher');

export interface LiteraturePaper {
    id: string;
    title: string;
    summary: string;
    url: string;
    authors: string[];
    source: 'arxiv' | 'web';
}

export interface LiteratureFetchOptions {
    maxResults?: number;
}

export interface ILiteratureProvider {
    readonly id: string;
    readonly label: string;
    fetch(query: string, opts?: LiteratureFetchOptions): Promise<LiteraturePaper[]>;
}

function stripTags(input: string): string {
    return input
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseArxiv(xml: string): LiteraturePaper[] {
    const papers: LiteraturePaper[] = [];
    const entries = xml.split('<entry>').slice(1);
    for (const raw of entries) {
        const end = raw.indexOf('</entry>');
        const entry = end >= 0 ? raw.slice(0, end) : raw;
        const idMatch = entry.match(/<id>\s*(.*?)\s*<\/id>/);
        const titleMatch = entry.match(/<title>\s*([\s\S]*?)\s*<\/title>/);
        const summaryMatch = entry.match(/<summary>\s*([\s\S]*?)\s*<\/summary>/);
        const authors = [...entry.matchAll(/<name>\s*([\s\S]*?)\s*<\/name>/g)].map((m) =>
            stripTags(m[1]!),
        );
        const title = titleMatch ? stripTags(titleMatch[1]!) : '';
        const summary = summaryMatch ? stripTags(summaryMatch[1]!) : '';
        if (!title) continue;
        papers.push({
            id: idMatch ? idMatch[1]!.trim() : genId('lit'),
            title,
            summary: summary.slice(0, 2000),
            url: idMatch ? idMatch[1]!.trim() : '',
            authors,
            source: 'arxiv',
        });
    }
    return papers;
}

export class ArxivProvider implements ILiteratureProvider {
    readonly id = 'arxiv';
    readonly label = 'arXiv API';

    async fetch(query: string, opts: LiteratureFetchOptions = {}): Promise<LiteraturePaper[]> {
        const max = opts.maxResults ?? 5;
        const url =
            `http://export.arxiv.org/api/query?search_query=` +
            `${encodeURIComponent(query)}&max_results=${max}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`arxiv http ${res.status}`);
        const xml = await res.text();
        return parseArxiv(xml);
    }
}

export class WebStubProvider implements ILiteratureProvider {
    readonly id = 'web';
    readonly label = 'web search (not configured)';

    async fetch(_query: string, _opts?: LiteratureFetchOptions): Promise<LiteraturePaper[]> {
        return [];
    }
}

export class PerplexityProvider implements ILiteratureProvider {
    readonly id = 'perplexity';
    readonly label = 'Perplexity (sonar-deep-research)';

    constructor(
        private apiKey = (globalThis as { process?: { env?: Record<string, string> } }).process?.env
            ?.PERPLEXITY_API_KEY ?? '',
        private model = 'sonar-deep-research',
    ) {}

    async fetch(query: string, opts: LiteratureFetchOptions = {}): Promise<LiteraturePaper[]> {
        if (!this.apiKey) return [];
        const res = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: query }],
                max_tokens: opts.maxResults ? opts.maxResults * 800 : 4000,
            }),
        });
        if (!res.ok) throw new Error(`perplexity http ${res.status}`);
        const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content ?? '';
        if (!content) return [];
        const url = `perplexity:${encodeURIComponent(query.slice(0, 80))}`;
        return [
            {
                id: genId('lit'),
                title: `Perplexity deep research: ${query.slice(0, 120)}`,
                summary: content.slice(0, 2000),
                url,
                authors: ['Perplexity'],
                source: 'web',
            },
        ];
    }
}

export interface LiteratureFetchResult {
    provider: string;
    providerLabel: string;
    papers: LiteraturePaper[];
}

export interface LiteratureFetcherServiceDeps {
    store?: IWikiStore;
}

function fnv1a64(input: string): string {
    let h = 0xcbf29ce484222325n;
    const prime = 0x100000001b3n;
    for (let i = 0; i < input.length; i++) {
        h ^= BigInt(input.charCodeAt(i));
        h = (h * prime) & 0xffffffffffffffffn;
    }
    return h.toString(16).padStart(16, '0');
}

/**
 * LiteratureFetcherService — F5b: external literature retrieval (SciAgents
 * pattern). Providers plug in via ILiteratureProvider; results can be ingested
 * as TWikiSource records (kind=url) for the wiki research loop to consume.
 */
export class LiteratureFetcherService {
    private providers = new Map<string, ILiteratureProvider>();

    constructor(
        private deps: LiteratureFetcherServiceDeps = {},
        providers: ILiteratureProvider[] = [
            new ArxivProvider(),
            new PerplexityProvider(),
            new WebStubProvider(),
        ],
    ) {
        for (const p of providers) this.providers.set(p.id, p);
    }

    registerProvider(provider: ILiteratureProvider): void {
        this.providers.set(provider.id, provider);
    }

    listProviders(): Array<{ id: string; label: string }> {
        return [...this.providers.values()].map((p) => ({ id: p.id, label: p.label }));
    }

    async fetch(
        query: string,
        opts: { provider?: string; maxResults?: number } = {},
    ): Promise<LiteratureFetchResult[]> {
        const requested = opts.provider;
        const targets = requested
            ? ([this.providers.get(requested)].filter(Boolean) as ILiteratureProvider[])
            : [...this.providers.values()];
        const results: LiteratureFetchResult[] = [];
        for (const provider of targets) {
            try {
                const papers = await provider.fetch(query, { maxResults: opts.maxResults });
                results.push({ provider: provider.id, providerLabel: provider.label, papers });
            } catch (e) {
                LOGGER.warn('LiteratureFetcher', 'fetch failed', {
                    provider: provider.id,
                    error: String(e),
                });
                results.push({ provider: provider.id, providerLabel: provider.label, papers: [] });
            }
        }
        return results;
    }

    async ingestAsSources(papers: LiteraturePaper[], projectId?: string): Promise<number> {
        if (!this.deps.store) return 0;
        let count = 0;
        for (const paper of papers) {
            const sha = fnv1a64(`${paper.title}|${paper.url}|${paper.summary.slice(0, 500)}`);
            const existing = await this.deps.store.getSourceBySha256(sha);
            if (existing) continue;
            const source: TWikiSource = {
                id: genId('src'),
                kind: 'url',
                title: paper.title,
                origin: paper.url || `arxiv:${paper.id}`,
                sha256: sha,
                sizeBytes: paper.summary.length,
                language: 'auto',
                contentText: paper.summary,
                meta: {
                    source: paper.source,
                    authors: paper.authors,
                    fetchedAt: new Date().toISOString(),
                },
                projectId,
                importedAt: new Date().toISOString(),
            };
            await this.deps.store.putSource(source);
            count++;
        }
        return count;
    }
}
