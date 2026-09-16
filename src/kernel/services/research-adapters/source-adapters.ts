import type { ResearchSource, SourceCategory, SourceType } from '../../contracts/research-engine';
import type { ISourceAdapter, SourceAdapterConfig } from '../../contracts/research-adapter';
import { genId } from '../../../utils/gen-id';

// ── Typed JSON helpers (prefer these for NEW adapters) ──────────────────

function asObj(v: unknown): Record<string, unknown> {
    return (v ?? {}) as Record<string, unknown>;
}

function asArr(v: unknown): Record<string, unknown>[] {
    return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

// ── Helpers ────────────────────────────────────────────────────────────

function mkSource(
    title: string,
    url: string,
    snippet: string,
    category: SourceCategory,
    sourceType: SourceType,
    relevanceScore = 0.5,
    extra?: Partial<ResearchSource>,
): ResearchSource {
    return {
        id: genId('src'),
        title: title.slice(0, 200),
        url,
        snippet: snippet.slice(0, 500),
        category,
        sourceType,
        relevanceScore,
        timestamp: Date.now(),
        ...extra,
    };
}

async function safeFetch(
    url: string,
    timeoutMs = 8000,
    signal?: AbortSignal,
    apiKey?: string,
): Promise<Response | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let cleanup = () => {};
    try {
        const combined = signal
            ? combineSignals(signal, controller.signal)
            : { signal: controller.signal, cleanup: () => {} };
        cleanup = combined.cleanup;
        const headers: Record<string, string> = {};
        if (apiKey) headers['X-Api-Key'] = apiKey;
        const res = await fetch(url, { signal: combined.signal, keepalive: true, headers });
        cleanup();
        clearTimeout(timer);
        if (!res.ok) {
            res.body?.cancel()?.catch(() => {});
            return null;
        }
        return res;
    } catch {
        cleanup();
        clearTimeout(timer);
        return null;
    }
}

function combineSignals(
    s1: AbortSignal,
    s2: AbortSignal,
): { signal: AbortSignal; cleanup: () => void } {
    if (
        typeof AbortSignal !== 'undefined' &&
        typeof (AbortSignal as unknown as { any?: unknown }).any === 'function'
    ) {
        try {
            const signal = (
                AbortSignal as unknown as { any: (signals: AbortSignal[]) => AbortSignal }
            ).any([s1, s2]);
            return { signal, cleanup: () => {} };
        } catch {
            /* fall through */
        }
    }
    if (s1.aborted) return { signal: AbortSignal.abort(s1.reason), cleanup: () => {} };
    if (s2.aborted) return { signal: AbortSignal.abort(s2.reason), cleanup: () => {} };
    const controller = new AbortController();
    const onAbort1 = () => controller.abort(s1.reason);
    const onAbort2 = () => controller.abort(s2.reason);
    s1.addEventListener('abort', onAbort1, { once: true });
    s2.addEventListener('abort', onAbort2, { once: true });
    return {
        signal: controller.signal,
        cleanup: () => {
            s1.removeEventListener('abort', onAbort1);
            s2.removeEventListener('abort', onAbort2);
        },
    };
}

function stripHtml(text: string): string {
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractXml(xml: string, tag: string): string {
    const m = xml.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's'));
    return m ? stripHtml(m[1]!) : '';
}

// ── 1. DuckDuckGo (web, no key) ────────────────────────────────────────

class DuckDuckGoAdapter implements ISourceAdapter {
    name: SourceType = 'duckduckgo';
    displayName = 'DuckDuckGo';
    category: SourceCategory = 'web';
    description = 'Free web search — instant answers and related topics';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://api.duckduckgo.com/';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const sources: ResearchSource[] = [];
        const res = await safeFetch(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
            5000,
            signal,
        );
        if (!res) return sources;
        const data = asObj(await res.json());
        if (data.AbstractText && typeof data.AbstractText === 'string') {
            sources.push(
                mkSource(
                    typeof data.Headline === 'string' ? data.Headline : 'DuckDuckGo Result',
                    typeof data.AbstractURL === 'string' ? data.AbstractURL : '',
                    data.AbstractText as string,
                    'web',
                    'duckduckgo',
                    0.7,
                ),
            );
        }
        if (Array.isArray(data.RelatedTopics)) {
            for (const t of data.RelatedTopics.slice(0, 8)) {
                const topic = t as Record<string, unknown>;
                if (!topic.Text) continue;
                const text = String(topic.Text);
                sources.push(
                    mkSource(
                        text.split(' - ')[0]!.slice(0, 120),
                        typeof topic.FirstURL === 'string' ? topic.FirstURL : '',
                        text.slice(0, 300),
                        'web',
                        'duckduckgo',
                        0.5,
                    ),
                );
            }
        }
        return sources;
    }
}

// ── 2. Wikipedia (web/news, no key) ────────────────────────────────────

class WikipediaAdapter implements ISourceAdapter {
    name: SourceType = 'wikipedia';
    displayName = 'Wikipedia';
    category: SourceCategory = 'news';
    description = 'Free encyclopedia — summaries and structured knowledge';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://en.wikipedia.org/api/rest_v1/';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const sources: ResearchSource[] = [];
        const encoded = encodeURIComponent(query);
        const res = await safeFetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}?redirect=true`,
            5000,
            signal,
        );
        if (!res) return sources;
        const data = asObj(await res.json());
        if (data.title && data.extract) {
            sources.push(
                mkSource(
                    String(data.title),
                    `https://en.wikipedia.org/wiki/${encoded}`,
                    String(data.extract).slice(0, 400),
                    'news',
                    'wikipedia',
                    0.7,
                ),
            );
        }
        return sources;
    }
}

// ── 3. Google Custom Search (web, needs API key + CX) ──────────────────

class GoogleCustomSearchAdapter implements ISourceAdapter {
    name: SourceType = 'google_custom_search';
    displayName = 'Google Custom Search';
    category: SourceCategory = 'web';
    description = 'Google search results — requires API key and Search Engine ID';
    needsKey = true;
    isRestricted = false;
    baseUrl = 'https://www.googleapis.com/customsearch/v1';

    async search(
        query: string,
        config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const apiKey = config.apiKeys.google_custom_search;
        const cx = config.apiKeys.google_custom_search_cx;
        if (!apiKey || !cx) return [];
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const { signal: combined, cleanup } = signal
            ? combineSignals(signal, controller.signal)
            : { signal: controller.signal, cleanup: () => {} };
        const res = await fetch(
            `https://www.googleapis.com/customsearch/v1?cx=${cx}&q=${encodeURIComponent(query)}&num=10`,
            { signal: combined, keepalive: true, headers: { 'X-goog-api-key': apiKey } },
        );
        cleanup();
        clearTimeout(timer);

        if (!res) return [];
        const data = asObj(await res.json());
        const items = asArr(data.items);
        if (!items) return [];
        return items.map((item) =>
            mkSource(
                String(item.title || ''),
                String(item.link || ''),
                String(item.snippet || ''),
                'web',
                'google_custom_search',
                0.6,
            ),
        );
    }
}

// ── 4. ArXiv (academic, no key) ────────────────────────────────────────

class ArXivAdapter implements ISourceAdapter {
    name: SourceType = 'arxiv';
    displayName = 'ArXiv';
    category: SourceCategory = 'academic';
    description = 'Open-access preprint repository — physics, math, CS, q-bio, etc.';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://export.arxiv.org/api/query';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const sources: ResearchSource[] = [];
        const res = await safeFetch(
            `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10&sortBy=relevance`,
            10000,
            signal,
        );
        if (!res) return sources;
        const xml = await res.text();
        const entries = xml.split('<entry>').slice(1);
        for (const entry of entries) {
            const title = extractXml(entry, 'title').replace(/\s+/g, ' ').trim();
            const summary = extractXml(entry, 'summary').replace(/\s+/g, ' ').trim();
            const id = extractXml(entry, 'id');
            const authors = entry
                .split('<author>')
                .slice(1)
                .map((a) => extractXml(a, 'name'))
                .filter(Boolean);
            const published = extractXml(entry, 'published').slice(0, 4);
            const year = published ? parseInt(published, 10) : undefined;
            const doi = extractXml(entry, 'doi');
            if (title) {
                sources.push(
                    mkSource(title, id || '', summary.slice(0, 500), 'academic', 'arxiv', 0.7, {
                        authors,
                        year,
                        doi,
                    }),
                );
            }
        }
        return sources;
    }
}

// ── 5. PubMed (academic, no key) ────────────────────────────────────────

class PubMedAdapter implements ISourceAdapter {
    name: SourceType = 'pubmed';
    displayName = 'PubMed';
    category: SourceCategory = 'academic';
    description = 'Biomedical literature from MEDLINE — 35M+ citations';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const sources: ResearchSource[] = [];
        const searchRes = await safeFetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=10`,
            8000,
            signal,
        );
        if (!searchRes) return sources;
        const searchData = asObj(await searchRes.json());
        const esr = searchData.esearchresult as Record<string, unknown> | undefined;
        const idList = (esr?.idlist as string[]) || [];
        if (idList.length === 0) return sources;

        const ids = idList.slice(0, 10).join(',');
        const summaryRes = await safeFetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`,
            8000,
            signal,
        );
        if (!summaryRes) return sources;
        const summaryData = asObj(await summaryRes.json());
        const result = (summaryData?.result as Record<string, unknown>) || {};
        for (const id of idList.slice(0, 10)) {
            const item = result[id] as Record<string, unknown> | undefined;
            if (!item) continue;
            const title = String(item.title || '');
            const authors = ((item.authors as Array<Record<string, string>>) || []).map(
                (a) => a.name || a.fullname || '',
            );
            const pubDate = String(item.pubdate || item.pubDate || '');
            const source = String(item.source || item.fulljournalname || 'PubMed');
            const doi = String(item.elocationid || '').replace('doi: ', '');
            sources.push(
                mkSource(
                    title,
                    `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                    `Published in ${source} (${pubDate}). Authors: ${authors.join(', ').slice(0, 200)}`,
                    'academic',
                    'pubmed',
                    0.7,
                    { authors, year: parseInt(pubDate.slice(0, 4), 10) || undefined, doi },
                ),
            );
        }
        return sources;
    }
}

// ── 6. PubMed Central (academic, no key) ───────────────────────────────

class PubMedCentralAdapter implements ISourceAdapter {
    name: SourceType = 'pubmed_central';
    displayName = 'PubMed Central';
    category: SourceCategory = 'academic';
    description = 'Free full-text archive of biomedical and life sciences literature';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://www.ncbi.nlm.nih.gov/pmc/tools/oa-service/';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(query)}&retmode=json&retmax=10`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const pmcEsr = data.esearchresult as Record<string, unknown> | undefined;
        const idList = (pmcEsr?.idlist as string[]) || [];
        return idList.map((id) =>
            mkSource(
                `PubMed Central article ${id}`,
                `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${id}/`,
                `PubMed Central article related to: ${query}`,
                'academic',
                'pubmed_central',
                0.6,
            ),
        );
    }
}

// ── 7. Semantic Scholar (academic, needs API key) ──────────────────────

class SemanticScholarAdapter implements ISourceAdapter {
    name: SourceType = 'semantic_scholar';
    displayName = 'Semantic Scholar';
    category: SourceCategory = 'academic';
    description = 'AI-powered research paper database — 200M+ papers';
    needsKey = true;
    isRestricted = false;
    baseUrl = 'https://api.semanticscholar.org/graph/v1';

    async search(
        query: string,
        config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const apiKey = config.apiKeys.semantic_scholar;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['x-api-key'] = apiKey;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const { signal: combined, cleanup } = signal
            ? combineSignals(signal, controller.signal)
            : { signal: controller.signal, cleanup: () => {} };
        try {
            const res = await fetch(
                `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=title,url,abstract,authors,year,externalIds,citationCount`,
                { headers, signal: combined, keepalive: true },
            );
            cleanup();
            clearTimeout(timer);
            if (!res.ok) {
                res.body?.cancel()?.catch(() => {});
                return [];
            }
            const data = asObj(await res.json());
            const papers = asArr(data.data);
            return papers.map((p) =>
                mkSource(
                    String(p.title || ''),
                    String(p.url || ''),
                    String(p.abstract || '').slice(0, 500),
                    'academic',
                    'semantic_scholar',
                    0.75,
                    {
                        authors: ((p.authors as Array<Record<string, string>>) || []).map(
                            (a) => a.name ?? '',
                        ),
                        year: p.year ? Number(p.year) : undefined,
                        citationCount: p.citationCount ? Number(p.citationCount) : undefined,
                    },
                ),
            );
        } catch {
            return [];
        }
    }
}

// ── 8. OpenAlex (academic, no key) ──────────────────────────────────────

class OpenAlexAdapter implements ISourceAdapter {
    name: SourceType = 'openalex';
    displayName = 'OpenAlex';
    category: SourceCategory = 'academic';
    description = 'Open catalog of scholarly research — 250M+ works, free API';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://api.openalex.org/works';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=10&sort=relevance_score:desc`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const results = asArr(data.results);
        return results.map((r) =>
            mkSource(
                String(r.title || ''),
                String(r.doi ? `https://doi.org/${r.doi}` : r.id || ''),
                String(r.abstract_inverted_index ? r.abstract_inverted_index : ''),
                'academic',
                'openalex',
                Number(r.relevance_score) || 0.6,
                {
                    authors: asArr(r.authorships).map((a: Record<string, unknown>) =>
                        String((a.author as Record<string, string>)?.name || ''),
                    ),
                    year: r.publication_year ? Number(r.publication_year) : undefined,
                    doi: r.doi ? String(r.doi).replace('https://doi.org/', '') : undefined,
                    citationCount: r.cited_by_count ? Number(r.cited_by_count) : undefined,
                },
            ),
        );
    }
}

// ── 9. Crossref (academic, no key) ──────────────────────────────────────

class CrossrefAdapter implements ISourceAdapter {
    name: SourceType = 'crossref';
    displayName = 'Crossref';
    category: SourceCategory = 'academic';
    description = 'DOI registration agency — metadata for 150M+ scholarly works';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://api.crossref.org/works';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=10&sort=relevance&order=desc`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const msg = data['message'] as Record<string, unknown> | undefined;
        const items = asArr(msg?.['items']);
        return items.map((item: Record<string, unknown>) => {
            const title = (item.title as string[])?.[0] || '';
            const authors = ((item.author as Array<Record<string, string>>) || []).map((a) =>
                `${a.given || ''} ${a.family || ''}`.trim(),
            );
            const published = item.published as Record<string, unknown> | undefined;
            const dateParts = published?.['date-parts'] as number[] | undefined;
            const date = dateParts?.[0];
            const containerTitle = item['container-title'] as string[] | undefined;
            const isRefCount = item['is-referenced-by-count'] as number | undefined;
            return mkSource(
                title,
                item.URL ? String(item.URL) : `https://doi.org/${item.DOI}`,
                `Published in ${containerTitle?.[0] || 'unknown journal'}. Authors: ${authors.join(', ').slice(0, 200)}`,
                'academic',
                'crossref',
                0.65,
                {
                    authors,
                    year: date ? Number(date) : undefined,
                    doi: item.DOI ? String(item.DOI) : undefined,
                    citationCount: isRefCount ? Number(isRefCount) : undefined,
                },
            );
        });
    }
}

// ── 10. DBLP (academic, no key) ────────────────────────────────────────

class DBLPAdapter implements ISourceAdapter {
    name: SourceType = 'dblp';
    displayName = 'DBLP';
    category: SourceCategory = 'academic';
    description = 'Computer science bibliography — 7M+ publications';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://dblp.org/search/publ/api';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://dblp.org/search/publ/api?q=${encodeURIComponent(query)}&format=json&h=10`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const dblpResult = data.result as Record<string, unknown> | undefined;
        const dblpHits = dblpResult?.hits as Record<string, unknown> | undefined;
        const hits = asArr(dblpHits?.hit);
        return hits.map((h) => {
            const info = (h.info as Record<string, unknown>) || {};
            const authors = (
                ((info.authors as Record<string, unknown>)?.author as Array<
                    Record<string, string> | string
                >) || []
            ).map((a: Record<string, string> | string) =>
                typeof a === 'string' ? a : a.text || '',
            );
            return mkSource(
                String(info.title || ''),
                String(info.url || ''),
                `Authors: ${authors.join(', ').slice(0, 200)}. Year: ${info.year || 'N/A'}`,
                'academic',
                'dblp',
                0.6,
                { authors, year: info.year ? Number(info.year) : undefined },
            );
        });
    }
}

// ── 11. CORE (academic, needs API key) ─────────────────────────────────

class COREAdapter implements ISourceAdapter {
    name: SourceType = 'core';
    displayName = 'CORE';
    category: SourceCategory = 'academic';
    description = 'Aggregator of open-access research — 250M+ papers';
    needsKey = true;
    isRestricted = false;
    baseUrl = 'https://api.core.ac.uk/v3/';

    async search(
        query: string,
        config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const apiKey = config.apiKeys.core;
        if (!apiKey) return [];
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const { signal: combined, cleanup } = signal
            ? combineSignals(signal, controller.signal)
            : { signal: controller.signal, cleanup: () => {} };
        try {
            const res = await fetch(
                `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(query)}&limit=10`,
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    signal: combined,
                    keepalive: true,
                },
            );
            cleanup();
            clearTimeout(timer);
            if (!res.ok) {
                res.body?.cancel()?.catch(() => {});
                return [];
            }
            const data = asObj(await res.json());
            const results = asArr(data.results);
            return results.map((r) =>
                mkSource(
                    String(r.title || ''),
                    String(r.sourceUrl || r.downloadUrl || r.id || ''),
                    String(r.abstract || '').slice(0, 500),
                    'academic',
                    'core',
                    0.65,
                    {
                        authors: ((r.authors as Array<Record<string, string>>) || []).map(
                            (a) => a.name || '',
                        ),
                        year: r.yearPublished ? Number(r.yearPublished) : undefined,
                        doi: r.doi ? String(r.doi) : undefined,
                    },
                ),
            );
        } catch {
            return [];
        }
    }
}

// ── 12. BASE (academic, no key) ────────────────────────────────────────

class BASEAdapter implements ISourceAdapter {
    name: SourceType = 'base';
    displayName = 'BASE';
    category: SourceCategory = 'academic';
    description = 'Bielefeld Academic Search Engine — 300M+ documents';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://api.base-search.net/cgi-bin/BaseHttpSearchInterface.fcgi';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://api.base-search.net/cgi-bin/BaseHttpSearchInterface.fcgi?func=PerformSearch&query=${encodeURIComponent(query)}&format=json&hits=10`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const baseResp = data.response as Record<string, unknown> | undefined;
        const docs = asArr(baseResp?.docs);
        return docs.map((d: Record<string, unknown>) =>
            mkSource(
                String((d.title as string[])?.[0] || ''),
                String((d.url as string[])?.[0] || (d.link as string[])?.[0] || ''),
                String((d.description as string[])?.[0] || '').slice(0, 500),
                'academic',
                'base',
                0.55,
                {
                    authors: Array.isArray(d.author) ? (d.author as string[]).map(String) : [],
                    year: (d.year as string[])?.[0] ? Number((d.year as string[])[0]) : undefined,
                },
            ),
        );
    }
}

// ── 13. HAL (academic, no key) ─────────────────────────────────────────

class HALAdapter implements ISourceAdapter {
    name: SourceType = 'hal';
    displayName = 'HAL';
    category: SourceCategory = 'academic';
    description = 'French open archive — 1M+ scholarly documents';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://api.archives-ouvertes.fr/search/';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://api.archives-ouvertes.fr/search/?q=${encodeURIComponent(query)}&rows=10&wt=json`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const halResp = data.response as Record<string, unknown> | undefined;
        const docs = asArr(halResp?.docs);
        return docs.map((d: Record<string, unknown>) =>
            mkSource(
                String((d.title_s as string[])?.[0] || (d.title as string[])?.[0] || ''),
                String(
                    (d.uri_s as string[])?.[0] ||
                        (d.link as string[])?.[0] ||
                        'https://hal.science/' + String(d.docid_s || ''),
                ),
                String((d.abstract_s as string[])?.[0] || '').slice(0, 500),
                'academic',
                'hal',
                0.6,
                {
                    authors:
                        Array.isArray(d.authFirstName_s) && Array.isArray(d.authLastName_s)
                            ? (d.authFirstName_s as string[]).map((f: string, i: number) =>
                                  `${f} ${(d.authLastName_s as string[])[i] || ''}`.trim(),
                              )
                            : [],
                    year: (d.productionDate_s as string[])?.[0]
                        ? Number(String((d.productionDate_s as string[])[0]).slice(0, 4))
                        : undefined,
                },
            ),
        );
    }
}

// ── 14. OpenAIRE (academic, no key) ────────────────────────────────────

class OpenAIREAdapter implements ISourceAdapter {
    name: SourceType = 'openaire';
    displayName = 'OpenAIRE';
    category: SourceCategory = 'academic';
    description = 'European open-access research gateway — aggregated publications';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://api.openaire.eu/search/publications';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://api.openaire.eu/search/publications?keywords=${encodeURIComponent(query)}&size=10&format=json`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const oaResp = data.response as Record<string, unknown> | undefined;
        const oaResults = oaResp?.results as Record<string, unknown> | undefined;
        const results = asArr(oaResults?.result);
        return results.map((r: Record<string, unknown>) => {
            const rMeta = r.metadata as Record<string, unknown> | undefined;
            const ent = rMeta?.['oaf:entity'] as Record<string, unknown> | undefined;
            const result = ent?.['oaf:result'] as Record<string, unknown> | undefined;
            const rTitle = result?.title as Record<string, unknown> | undefined;
            const title = String(rTitle?.['$'] || '');
            const creators = asArr(result?.creator);
            const authors = creators.map((c: Record<string, unknown>) => String(c['$'] || ''));
            const rAccept = result?.dateOfAcceptance as Record<string, unknown> | undefined;
            const rMod = result?.dateOfModification as Record<string, unknown> | undefined;
            const date = String(rAccept?.['$'] || rMod?.['$'] || '');
            const rPid = result?.pid as Record<string, unknown> | undefined;
            return mkSource(
                title,
                String(rPid?.['$'] || String(r['_url'] || '')),
                `Authors: ${authors.join(', ').slice(0, 200)}. Date: ${date}`,
                'academic',
                'openaire',
                0.55,
                { authors, year: date ? Number(String(date).slice(0, 4)) : undefined },
            );
        });
    }
}

// ── 15-17. BioRxiv / MedRxiv / ChemRxiv (academic, no key) ─────────────

class BioRxivAdapter implements ISourceAdapter {
    name: SourceType = 'biorxiv';
    displayName = 'BioRxiv';
    category: SourceCategory = 'academic';
    description = 'Preprint server for biology — free API for recent articles';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://api.biorxiv.org/details/biorxiv/';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://api.biorxiv.org/search?query=${encodeURIComponent(query)}`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const collection = asArr(data.collection);
        return collection.slice(0, 10).map((item) =>
            mkSource(
                String(item.title || ''),
                `https://www.biorxiv.org/content/${item.doi || item.id || ''}`,
                String(item.abstract || '').slice(0, 500),
                'academic',
                'biorxiv',
                0.6,
                {
                    authors: Array.isArray(item.authors) ? item.authors.map(String) : [],
                    year: item.date ? Number(String(item.date).slice(0, 4)) : undefined,
                    doi: item.doi ? String(item.doi) : undefined,
                },
            ),
        );
    }
}

class MedRxivAdapter implements ISourceAdapter {
    name: SourceType = 'medrxiv';
    displayName = 'MedRxiv';
    category: SourceCategory = 'academic';
    description = 'Preprint server for medicine — free API';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://api.medrxiv.org/details/medrxiv/';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://api.medrxiv.org/search?query=${encodeURIComponent(query)}`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const collection = asArr(data.collection);
        return collection.slice(0, 10).map((item) =>
            mkSource(
                String(item.title || ''),
                `https://www.medrxiv.org/content/${item.doi || item.id || ''}`,
                String(item.abstract || '').slice(0, 500),
                'academic',
                'medrxiv',
                0.6,
                {
                    authors: Array.isArray(item.authors) ? item.authors.map(String) : [],
                    year: item.date ? Number(String(item.date).slice(0, 4)) : undefined,
                    doi: item.doi ? String(item.doi) : undefined,
                },
            ),
        );
    }
}

class ChemRxivAdapter implements ISourceAdapter {
    name: SourceType = 'chemrxiv';
    displayName = 'ChemRxiv';
    category: SourceCategory = 'academic';
    description = 'Preprint server for chemistry — free access';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://chemrxiv.org/engage/chemrxiv/public-api/';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://chemrxiv.org/engage/chemrxiv/public-api/v1/items?search=${encodeURIComponent(query)}&limit=10`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const results = asArr(data.results || data.items);
        return results.map((item) =>
            mkSource(
                String(item.title || ''),
                String(
                    item.url ||
                        `https://chemrxiv.org/engage/chemrxiv/article-details/${item.id || ''}`,
                ),
                String(item.abstract || '').slice(0, 500),
                'academic',
                'chemrxiv',
                0.6,
                {
                    authors: Array.isArray(item.authors) ? item.authors.map(String) : [],
                    year: item.publishedDate
                        ? Number(String(item.publishedDate).slice(0, 4))
                        : undefined,
                    doi: item.doi ? String(item.doi) : undefined,
                },
            ),
        );
    }
}

// ── 18. News API (news, needs API key) ─────────────────────────────────

class NewsAPIAdapter implements ISourceAdapter {
    name: SourceType = 'news_api';
    displayName = 'News API';
    category: SourceCategory = 'news';
    description = 'Global news aggregation — 80K+ sources, free tier available';
    needsKey = true;
    isRestricted = false;
    baseUrl = 'https://newsapi.org/v2/';

    async search(
        query: string,
        config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const apiKey = config.apiKeys.news_api;
        if (!apiKey) return [];
        const res = await safeFetch(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=10&language=en&sortBy=relevancy`,
            8000,
            signal,
            apiKey,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const articles = asArr(data.articles);
        return articles.map((a) =>
            mkSource(
                String(a.title || ''),
                String(a.url || ''),
                String(a.description || a.content || ''),
                'news',
                'news_api',
                0.65,
            ),
        );
    }
}

// ── 19. GitHub (code, needs API key) ───────────────────────────────────

class GitHubAdapter implements ISourceAdapter {
    name: SourceType = 'github';
    displayName = 'GitHub';
    category: SourceCategory = 'code';
    description = 'Code repositories — 200M+ repos, search by code/repo/topic';
    needsKey = true;
    isRestricted = false;
    baseUrl = 'https://api.github.com/search/repositories';

    async search(
        query: string,
        config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const token = config.apiKeys.github;
        const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const { signal: combined, cleanup } = signal
            ? combineSignals(signal, controller.signal)
            : { signal: controller.signal, cleanup: () => {} };
        try {
            const res = await fetch(
                `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`,
                { headers, signal: combined, keepalive: true },
            );
            cleanup();
            clearTimeout(timer);
            if (!res.ok) {
                res.body?.cancel()?.catch(() => {});
                return [];
            }
            const data = asObj(await res.json());
            const items = asArr(data.items);
            return items.map((r: Record<string, unknown>) => {
                const githubOwner = r.owner as Record<string, unknown> | undefined;
                return mkSource(
                    String(r.full_name ?? ''),
                    String(r.html_url ?? ''),
                    String(r.description ?? '').slice(0, 500),
                    'code',
                    'github',
                    0.7,
                    {
                        authors: [String(githubOwner?.login ?? '')],
                        year: r.created_at ? Number(String(r.created_at).slice(0, 4)) : undefined,
                    },
                );
            });
        } catch {
            return [];
        }
    }
}

// ── 20. Stack Overflow (code, needs API key) ───────────────────────────

class StackOverflowAdapter implements ISourceAdapter {
    name: SourceType = 'stack_overflow';
    displayName = 'Stack Overflow';
    category: SourceCategory = 'code';
    description = 'Q&A for programmers — 23M+ questions, free API';
    needsKey = true;
    isRestricted = false;
    baseUrl = 'https://api.stackexchange.com/2.3/';

    async search(
        query: string,
        config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const apiKey = config.apiKeys.stack_overflow;
        // Note: StackExchange API only supports auth via URL query param `key`.
        // This is a rate-limit-only key (higher quota), not a security credential.
        // Unlike Google Custom Search (which also had this issue, now fixed to use
        // X-goog-api-key header), StackExchange has no header-based alternative.
        const url = `https://api.stackexchange.com/2.3/search/advanced?q=${encodeURIComponent(query)}&site=stackoverflow&order=desc&sort=relevance&pagesize=10${apiKey ? `&key=${apiKey}` : ''}`;
        const res = await safeFetch(url, 8000, signal);
        if (!res) return [];
        const data = asObj(await res.json());
        const items = asArr(data.items);
        return items.map((q: Record<string, unknown>) => {
            const soOwner = q.owner as Record<string, unknown> | undefined;
            return mkSource(
                String(q.title ?? ''),
                String(q.link ?? ''),
                String(q.body_markdown ?? q.excerpt ?? '').slice(0, 500),
                'code',
                'stack_overflow',
                0.6,
                {
                    authors: [String(soOwner?.display_name ?? '')],
                },
            );
        });
    }
}

// ── 21. Reddit (web, no key) ───────────────────────────────────────────

class RedditAdapter implements ISourceAdapter {
    name: SourceType = 'reddit';
    displayName = 'Reddit';
    category: SourceCategory = 'web';
    description = 'Social news aggregation — community discussions on every topic';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://www.reddit.com/search.json';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=10&sort=relevance&t=all`,
            6000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const redditData = data.data as Record<string, unknown> | undefined;
        const children = asArr(redditData?.children);
        return children.map((c: Record<string, unknown>) => {
            const d = c.data as Record<string, unknown> | undefined;
            return mkSource(
                String(d?.title || ''),
                `https://www.reddit.com${d?.permalink || ''}`,
                String(d?.selftext || d?.body || '').slice(0, 400),
                'web',
                'reddit',
                0.45,
                {
                    authors: [String(d?.author || '')],
                },
            );
        });
    }
}

// ── 22. Google Patents (web, no key) ───────────────────────────────────

class GooglePatentsAdapter implements ISourceAdapter {
    name: SourceType = 'google_patents';
    displayName = 'Google Patents';
    category: SourceCategory = 'web';
    description = 'Patent search — 120M+ patents from 100+ patent offices';
    needsKey = false;
    isRestricted = false;
    baseUrl = 'https://patents.google.com/api/';

    async search(
        query: string,
        _config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const res = await safeFetch(
            `https://patents.google.com/api/patents?q=${encodeURIComponent(query)}&num=10`,
            8000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const patents = asArr(data.patents);
        return patents.map((p) =>
            mkSource(
                String(p.title || ''),
                `https://patents.google.com/patent/${p.patentId || ''}`,
                String(p.abstract || '').slice(0, 500),
                'web',
                'google_patents',
                0.6,
                {
                    authors: Array.isArray(p.inventors) ? p.inventors.map(String) : [],
                    year: p.priorityDate ? Number(String(p.priorityDate).slice(0, 4)) : undefined,
                },
            ),
        );
    }
}

// ── 23. Wolfram Alpha (web, needs API key) ─────────────────────────────

class WolframAlphaAdapter implements ISourceAdapter {
    name: SourceType = 'wolfram_alpha';
    displayName = 'Wolfram Alpha';
    category: SourceCategory = 'web';
    description = 'Computational knowledge engine — factual answers to factual questions';
    needsKey = true;
    isRestricted = false;
    baseUrl = 'https://api.wolframalpha.com/v2/query';

    async search(
        query: string,
        config: SourceAdapterConfig,
        signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        const apiKey = config.apiKeys.wolfram_alpha;
        if (!apiKey) return [];
        const res = await safeFetch(
            `https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(query)}&format=plaintext&output=JSON&appid=${apiKey}`,
            10000,
            signal,
        );
        if (!res) return [];
        const data = asObj(await res.json());
        const qr = data.queryresult as Record<string, unknown> | undefined;
        const pods = asArr(qr?.pods);
        const sources: ResearchSource[] = [];
        for (const pod of pods.slice(0, 5) as Record<string, unknown>[]) {
            const subpods = asArr(pod.subpods);
            for (const sp of subpods) {
                const text = String(sp.plaintext ?? '');
                if (text.trim()) {
                    sources.push(
                        mkSource(
                            String(pod.title ?? 'Wolfram Alpha Result'),
                            'https://www.wolframalpha.com/input/?i=' + encodeURIComponent(query),
                            text.slice(0, 500),
                            'web',
                            'wolfram_alpha',
                            0.8,
                        ),
                    );
                }
            }
        }
        return sources;
    }
}

// ── 24-34. Restricted/Paid sources (mock data with guidance) ───────────

class RestrictedAdapter implements ISourceAdapter {
    constructor(
        public name: SourceType,
        public displayName: string,
        public category: SourceCategory,
        public description: string,
        public baseUrl: string,
    ) {
        this.isRestricted = true;
        this.needsKey = true;
    }
    needsKey = true;
    isRestricted = true;

    async search(
        query: string,
        _config: SourceAdapterConfig,
        _signal?: AbortSignal,
    ): Promise<ResearchSource[]> {
        return [
            mkSource(
                `${this.displayName} — Institutional Access Required`,
                this.baseUrl,
                `The ${this.displayName} API requires institutional subscription or API key. Configure in Settings > Research > API Keys to enable. Query: ${query}`,
                this.category,
                this.name,
                0.1,
            ),
        ];
    }
}

export {
    DuckDuckGoAdapter,
    WikipediaAdapter,
    GoogleCustomSearchAdapter,
    ArXivAdapter,
    PubMedAdapter,
    PubMedCentralAdapter,
    SemanticScholarAdapter,
    OpenAlexAdapter,
    CrossrefAdapter,
    DBLPAdapter,
    COREAdapter,
    BASEAdapter,
    HALAdapter,
    OpenAIREAdapter,
    BioRxivAdapter,
    MedRxivAdapter,
    ChemRxivAdapter,
    NewsAPIAdapter,
    GitHubAdapter,
    StackOverflowAdapter,
    RedditAdapter,
    GooglePatentsAdapter,
    WolframAlphaAdapter,
    RestrictedAdapter,
};
