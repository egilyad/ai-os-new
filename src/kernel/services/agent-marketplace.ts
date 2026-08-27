import type { ILifecycle } from '../contracts/lifecycle';
import type { IEventBus, IDatabaseService } from '../types/interfaces';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AgentMarketplace');
const STORAGE_KEY = 'agent_marketplace_items';
const MAX_ITEMS = 500;

export interface MarketplaceItem {
    id: string;
    type: 'prompt' | 'skill' | 'template' | 'topology';
    title: string;
    description: string;
    author: string;
    rating: number;
    downloads: number;
    content: unknown;
}

export interface AgentMarketplaceDeps {
    eventBus: IEventBus;
    database: IDatabaseService;
}

export class AgentMarketplace implements ILifecycle {
    private items: MarketplaceItem[] = [];
    private database: IDatabaseService;

    constructor(deps: AgentMarketplaceDeps) {
        this.database = deps.database;
    }

    async init() {
        try {
            const saved = await this.database.getKv<MarketplaceItem[]>(STORAGE_KEY);
            if (saved && saved.length > 0) {
                this.items = saved;
            } else {
                this.seedMockData();
                await this.persist();
            }
        } catch (e) {
            LOGGER.warn('init', 'Failed to load items, using defaults', { error: String(e) });
            this.seedMockData();
        }
    }
    async start() {
        LOGGER.info('AgentMarketplace', 'start: ready');
    }
    async destroy() {
        this.items = [];
        try {
            await this.database.setKv(STORAGE_KEY, []);
        } catch {
            /* ignore */
        }
    }

    private async persist(): Promise<void> {
        try {
            await this.database.setKv(STORAGE_KEY, this.items);
        } catch (e) {
            LOGGER.warn('persist', 'Failed to persist items', { error: String(e) });
        }
    }

    private seedMockData() {
        this.items.push(
            {
                id: 'item-1',
                type: 'topology',
                title: 'Security Audit Swarm',
                description: '3 agents checking for vulns',
                author: 'AI-OS Team',
                rating: 4.8,
                downloads: 120,
                content: {},
            },
            {
                id: 'item-2',
                type: 'prompt',
                title: 'Socratic Challenger',
                description: 'Advanced prompt for deep technical debates',
                author: 'Community',
                rating: 4.5,
                downloads: 89,
                content: 'You are a strict Socratic challenger...',
            },
            {
                id: 'item-3',
                type: 'template',
                title: 'Code Reviewer',
                description: 'Standard code review agent setup',
                author: 'Community',
                rating: 4.9,
                downloads: 340,
                content: {},
            },
        );
    }

    search(query: string, type?: MarketplaceItem['type']): MarketplaceItem[] {
        let results = this.items;
        if (type) results = results.filter((i) => i.type === type);
        if (query) {
            const q = query.toLowerCase();
            results = results.filter(
                (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
            );
        }
        return results;
    }

    publish(item: Omit<MarketplaceItem, 'id' | 'rating' | 'downloads'>): MarketplaceItem {
        if (!item.type || !['prompt', 'skill', 'template', 'topology'].includes(item.type)) {
            throw new Error('Invalid marketplace item type');
        }
        if (!item.title || typeof item.title !== 'string' || item.title.length < 1) {
            throw new Error('Item title is required');
        }
        if (!item.description || typeof item.description !== 'string') {
            throw new Error('Item description is required');
        }
        if (item.content == null) {
            throw new Error('Item content is required');
        }
        const contentSize =
            typeof item.content === 'string'
                ? item.content.length
                : JSON.stringify(item.content).length;
        if (contentSize > 1_048_576) {
            throw new Error('Item content exceeds 1MB limit');
        }
        const newItem: MarketplaceItem = {
            ...item,
            id: `mkt-${crypto.randomUUID()}`,
            rating: 0,
            downloads: 0,
        };
        if (this.items.length >= MAX_ITEMS) {
            this.items.shift();
        }
        this.items.push(newItem);
        void this.persist().catch((err) =>
            LOGGER.warn('AgentMarketplace', 'publish persist failed', { error: err }),
        );
        return { ...newItem };
    }

    install(itemId: string): MarketplaceItem | null {
        const item = this.items.find((i) => i.id === itemId);
        if (item) {
            item.downloads++;
            void this.persist().catch((err) =>
                LOGGER.warn('AgentMarketplace', 'install persist failed', { error: err }),
            );
            return { ...item };
        }
        return null;
    }
}
