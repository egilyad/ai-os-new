/**
 * SearchService — J.3 (search provider abstraction, additive).
 *
 * Named providers with key REFERENCE names (never secrets) fan out per
 * query; results merge + dedupe by URL/title. Providers without a wired
 * fetcher degrade to the local knowledge/workspace search; failures never
 * fail the whole query (graceful-degrade chain).
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IKnowledgeService } from '../../contracts/parity';
import type { ISearchService } from '../../contracts/rivals5';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('SearchProviders');

interface ProviderDoc {
    name: string;
    keyRef?: string;
}

type Fetcher = (query: string, limit: number) => Promise<Array<{ title: string; snippet: string }>>;

export class SearchService implements ISearchService {
    private fetchers = new Map<string, Fetcher>();

    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private knowledge?: IKnowledgeService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('SearchProviders', 'init', {});
    }

    async destroy(): Promise<void> {
        this.fetchers.clear();
    }

    /** Wire a real HTTP fetcher for a provider (integrations layer). */
    setFetcher(name: string, fn: Fetcher): void {
        this.fetchers.set(name, fn);
    }

    async registerProvider(name: string, keyRef?: string): Promise<void> {
        if (keyRef && /(sk-|password\s*[:=]|bearer\s+[a-z0-9])/i.test(keyRef)) {
            throw new Error('keyRef must be a reference name — never a secret');
        }
        const doc: ProviderDoc = { name: name.slice(0, 80), keyRef };
        await this.dal.kv.set(`search-provider/${doc.name}`, doc);
    }

    async search(query: string, limit = 8): Promise<Array<{ title: string; snippet: string; via: string }>> {
        const rows = await this.dal.kv.list('search-provider/');
        const providers = rows.map((r) => (r.value as ProviderDoc).name);
        const out: Array<{ title: string; snippet: string; via: string }> = [];
        const seen = new Set<string>();

        const push = (title: string, snippet: string, via: string) => {
            const key = `${title}|${snippet.slice(0, 80)}`.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            out.push({ title: title.slice(0, 200), snippet: snippet.slice(0, 500), via });
        };

        for (const name of providers) {
            const fetcher = this.fetchers.get(name);
            if (!fetcher) continue;
            try {
                const hits = await fetcher(query, limit);
                for (const h of hits.slice(0, limit)) push(h.title, h.snippet, name);
            } catch (e) {
                LOGGER.warn('SearchProviders', 'provider failed, continuing chain', {
                    name,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
            if (out.length >= limit) break;
        }
        // Local fallback always participates (graceful degrade).
        if (out.length < limit && this.knowledge) {
            try {
                const hits = await this.knowledge.retrieve(query, limit - out.length);
                for (const h of hits) push(h.title, h.chunk, 'local-knowledge');
            } catch (e) {
                LOGGER.warn('SearchProviders', 'local fallback failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        this.events.emit(EVENTS.SEARCH_FANOUT, { providers: providers.length, hits: out.length });
        return out.slice(0, Math.max(1, limit));
    }
}
