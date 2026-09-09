import { ResearchSourceSchema } from '../../contracts/research-engine';
import type { ResearchSource, SourceCategory, SourceType } from '../../contracts/research-engine';
import type { ISourceAdapter, SourceAdapterConfig } from '../../contracts/research-adapter';
import {
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
} from './source-adapters';
import { rootLogger } from '../logger-service';
const SAR_LOGGER = rootLogger.child('SourceAdapterRegistry');

const DEFAULT_CONFIG: SourceAdapterConfig = {
    apiKeys: {},
    enabledSources: [
        'duckduckgo',
        'wikipedia',
        'arxiv',
        'pubmed',
        'openalex',
        'crossref',
        'dblp',
        'semantic_scholar',
        'github',
        'stack_overflow',
    ],
    rateLimits: {},
};

export class SourceAdapterRegistry {
    private adapters: Map<SourceType, ISourceAdapter> = new Map();
    private config: SourceAdapterConfig = { ...DEFAULT_CONFIG };
    private categories: Map<SourceCategory, SourceType[]> = new Map();

    constructor() {
        this.registerDefaults();
    }

    private register(adapter: ISourceAdapter): void {
        this.adapters.set(adapter.name, adapter);
        const list = this.categories.get(adapter.category) || [];
        list.push(adapter.name);
        this.categories.set(adapter.category, list);
    }

    private registerDefaults(): void {
        this.register(new DuckDuckGoAdapter());
        this.register(new GoogleCustomSearchAdapter());
        this.register(new RedditAdapter());
        this.register(new GooglePatentsAdapter());
        this.register(new WolframAlphaAdapter());

        this.register(new WikipediaAdapter());
        this.register(new NewsAPIAdapter());

        this.register(new ArXivAdapter());
        this.register(new PubMedAdapter());
        this.register(new PubMedCentralAdapter());
        this.register(new SemanticScholarAdapter());
        this.register(new OpenAlexAdapter());
        this.register(new CrossrefAdapter());
        this.register(new DBLPAdapter());
        this.register(new COREAdapter());
        this.register(new BASEAdapter());
        this.register(new HALAdapter());
        this.register(new OpenAIREAdapter());
        this.register(new BioRxivAdapter());
        this.register(new MedRxivAdapter());
        this.register(new ChemRxivAdapter());

        this.register(
            new RestrictedAdapter(
                'ieee_xplore',
                'IEEE Xplore',
                'academic',
                'Engineering and technology research — requires subscription',
                'https://ieeexplore.ieee.org/',
            ),
        );
        this.register(
            new RestrictedAdapter(
                'acm_dl',
                'ACM Digital Library',
                'academic',
                'Computing research — requires subscription',
                'https://dl.acm.org/',
            ),
        );
        this.register(
            new RestrictedAdapter(
                'jstor',
                'JSTOR',
                'academic',
                'Academic journals, books, primary sources — requires subscription',
                'https://www.jstor.org/',
            ),
        );
        this.register(
            new RestrictedAdapter(
                'scopus',
                'Scopus',
                'academic',
                'Abstract and citation database — requires institutional access',
                'https://www.scopus.com/',
            ),
        );
        this.register(
            new RestrictedAdapter(
                'web_of_science',
                'Web of Science',
                'academic',
                'Citation index — requires institutional access',
                'https://www.webofscience.com/',
            ),
        );
        this.register(
            new RestrictedAdapter(
                'ssrn',
                'SSRN',
                'academic',
                'Social science preprint repository — free access limited',
                'https://ssrn.com/',
            ),
        );
        this.register(
            new RestrictedAdapter(
                'academia_edu',
                'Academia.edu',
                'academic',
                'Academic sharing platform — requires account',
                'https://www.academia.edu/',
            ),
        );
        this.register(
            new RestrictedAdapter(
                'researchgate',
                'ResearchGate',
                'academic',
                'Research networking platform — requires account',
                'https://www.researchgate.net/',
            ),
        );
        this.register(
            new RestrictedAdapter(
                'philpapers',
                'PhilPapers',
                'academic',
                'Philosophy research — requires subscription',
                'https://philpapers.org/',
            ),
        );
        this.register(
            new RestrictedAdapter(
                'open_library',
                'Open Library',
                'academic',
                'Open library catalog — free API, limited metadata',
                'https://openlibrary.org/',
            ),
        );
        this.register(
            new RestrictedAdapter(
                'science_gov',
                'Science.gov',
                'academic',
                'US government science portal — free, limited API',
                'https://www.science.gov/',
            ),
        );

        this.register(new GitHubAdapter());
        this.register(new StackOverflowAdapter());
    }

    updateConfig(config: Partial<SourceAdapterConfig>): void {
        this.config = { ...this.config, ...config };
    }

    getConfig(): SourceAdapterConfig {
        return this.config;
    }

    getAdapter(type: SourceType): ISourceAdapter | undefined {
        return this.adapters.get(type);
    }

    getAllAdapters(): ISourceAdapter[] {
        return Array.from(this.adapters.values());
    }

    getAdaptersByCategory(category: SourceCategory): ISourceAdapter[] {
        const types = this.categories.get(category) || [];
        return types.map((t) => this.adapters.get(t)!).filter(Boolean);
    }

    getEnabledAdapters(): ISourceAdapter[] {
        return this.config.enabledSources
            .map((t) => this.adapters.get(t))
            .filter((a): a is ISourceAdapter => a != null);
    }

    getEnabledAdaptersByCategory(category: SourceCategory): ISourceAdapter[] {
        return this.getEnabledAdapters().filter((a) => a.category === category);
    }

    async searchAll(
        query: string,
        category?: SourceCategory,
        signal?: AbortSignal,
    ): Promise<Map<SourceType, ResearchSource[]>> {
        const results = new Map<SourceType, ResearchSource[]>();
        const adapters = category
            ? this.getEnabledAdaptersByCategory(category)
            : this.getEnabledAdapters();

        const promises = adapters.map(async (adapter) => {
            try {
                const sources = await adapter.search(query, this.config, signal);
                const valid = sources.filter((s) => {
                    const r = ResearchSourceSchema.safeParse(s);
                    if (!r.success) {
                        SAR_LOGGER.warn('SourceAdapterRegistry', 'Invalid result from', {
                            adapter: adapter.name,
                            issues: r.error.issues,
                        });
                    }
                    return r.success;
                });
                if (valid.length > 0) {
                    results.set(adapter.name, valid);
                }
            } catch (err) {
                SAR_LOGGER.warn('SourceAdapterRegistry', 'search failed for adapter', {
                    adapter: adapter.name,
                    error: String(err),
                });
            }
        });

        await Promise.allSettled(promises);
        return results;
    }

    async searchBySource(
        query: string,
        sourceTypes: SourceType[],
        signal?: AbortSignal,
    ): Promise<Map<SourceType, ResearchSource[]>> {
        const results = new Map<SourceType, ResearchSource[]>();
        const promises = sourceTypes.map(async (type) => {
            const adapter = this.adapters.get(type);
            if (!adapter) return;
            try {
                const sources = await adapter.search(query, this.config, signal);
                const valid = sources.filter((s) => {
                    const r = ResearchSourceSchema.safeParse(s);
                    if (!r.success) {
                        SAR_LOGGER.warn(
                            'SourceAdapterRegistry',
                            'Invalid result from (searchBySource)',
                            {
                                adapter: adapter.name,
                                issues: r.error.issues,
                            },
                        );
                    }
                    return r.success;
                });
                if (valid.length > 0) results.set(type, valid);
            } catch (err) {
                SAR_LOGGER.warn('SourceAdapterRegistry', 'searchBySource failed for adapter', {
                    adapter: adapter.name,
                    error: String(err),
                });
            }
        });
        await Promise.allSettled(promises);
        return results;
    }
}
