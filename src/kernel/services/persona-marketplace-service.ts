import type {
    IPersonaMarketplaceService,
    PersonaListing,
    PersonaCategory,
} from '../contracts/persona-marketplace';
import { BucketStorageAdapter } from './storage-adapter';

const STORAGE_KEY = 'persona_marketplace_v1';
const MAX_LISTINGS = 2000;

const SEED_PERSONAS: PersonaListing[] = [
    {
        id: 'pm-1',
        name: 'Elara Strategist',
        description: 'Strategic planning expert with military simulation background',
        category: 'professional',
        author: 'Core',
        version: '1.0',
        rating: 4.8,
        downloads: 1240,
        price: 0,
        tags: ['strategy', 'planning', 'analysis'],
        promptPreview: 'You are Elara, a seasoned strategist...',
        installed: false,
        createdAt: Date.now() - 86400000 * 30,
    },
    {
        id: 'pm-2',
        name: 'Dr. Nova Quantum',
        description: 'Quantum physicist specialized in multi-agent systems',
        category: 'academic',
        author: 'Research Labs',
        version: '2.1',
        rating: 4.6,
        downloads: 890,
        price: 0,
        tags: ['science', 'research', 'quantum'],
        promptPreview: 'You are Dr. Nova, a quantum physicist...',
        installed: false,
        createdAt: Date.now() - 86400000 * 25,
    },
    {
        id: 'pm-3',
        name: 'Pixel Artist Bot',
        description: 'Creative AI for visual design and art direction',
        category: 'creative',
        author: 'Artisan AI',
        version: '1.3',
        rating: 4.9,
        downloads: 2100,
        price: 0,
        tags: ['art', 'design', 'creative'],
        promptPreview: 'You are a digital artist...',
        installed: false,
        createdAt: Date.now() - 86400000 * 20,
    },
    {
        id: 'pm-4',
        name: 'Code Sage',
        description: 'Senior software architect with 20+ years experience',
        category: 'technical',
        author: 'DevTools Inc',
        version: '3.0',
        rating: 4.7,
        downloads: 3400,
        price: 0,
        tags: ['coding', 'architecture', 'review'],
        promptPreview: 'You are Code Sage, a software architect...',
        installed: false,
        createdAt: Date.now() - 86400000 * 15,
    },
    {
        id: 'pm-5',
        name: 'Mythos Weaver',
        description: 'Fantasy world-building and narrative design specialist',
        category: 'entertainment',
        author: 'StoryForge',
        version: '1.0',
        rating: 4.5,
        downloads: 670,
        price: 0,
        tags: ['fantasy', 'writing', 'world-building'],
        promptPreview: 'You are a master storyteller...',
        installed: false,
        createdAt: Date.now() - 86400000 * 10,
    },
    {
        id: 'pm-6',
        name: 'Data Oracle',
        description: 'Data science and statistical analysis expert',
        category: 'professional',
        author: 'Core',
        version: '2.0',
        rating: 4.4,
        downloads: 1560,
        price: 0,
        tags: ['data', 'analytics', 'statistics'],
        promptPreview: 'You are Data Oracle...',
        installed: false,
        createdAt: Date.now() - 86400000 * 7,
    },
    {
        id: 'pm-7',
        name: 'Philosopher AI',
        description: 'Ethical reasoning and philosophical debate specialist',
        category: 'academic',
        author: 'Socratic Labs',
        version: '1.2',
        rating: 4.3,
        downloads: 430,
        price: 0,
        tags: ['philosophy', 'ethics', 'debate'],
        promptPreview: 'You are a philosopher...',
        installed: false,
        createdAt: Date.now() - 86400000 * 5,
    },
    {
        id: 'pm-8',
        name: 'DevOps Guardian',
        description: 'Infrastructure and deployment automation expert',
        category: 'technical',
        author: 'Ops Team',
        version: '1.5',
        rating: 4.6,
        downloads: 2800,
        price: 0,
        tags: ['devops', 'infrastructure', 'deploy'],
        promptPreview: 'You are a DevOps engineer...',
        installed: false,
        createdAt: Date.now() - 86400000 * 3,
    },
    {
        id: 'pm-9',
        name: 'Empathy Engine',
        description: 'Emotional intelligence and interpersonal dynamics',
        category: 'custom',
        author: 'Community',
        version: '1.0',
        rating: 4.2,
        downloads: 310,
        price: 0,
        tags: ['empathy', 'psychology', 'communication'],
        promptPreview: 'You are an empathy-focused AI...',
        installed: false,
        createdAt: Date.now() - 86400000,
    },
    {
        id: 'pm-10',
        name: 'Legal Mind',
        description: 'Legal analysis and contract review specialist',
        category: 'professional',
        author: 'LexAI',
        version: '2.0',
        rating: 4.1,
        downloads: 980,
        price: 0,
        tags: ['legal', 'contracts', 'compliance'],
        promptPreview: 'You are a legal expert...',
        installed: false,
        createdAt: Date.now(),
    },
];

export class PersonaMarketplaceService implements IPersonaMarketplaceService {
    private listings: PersonaListing[] = [];
    private loaded = false;

    #load(): void {
        if (this.loaded) return;
        const raw = BucketStorageAdapter.UI.getSync<PersonaListing[]>(STORAGE_KEY);
        if (raw && raw.length > 0) {
            this.listings = raw;
        } else {
            this.listings = SEED_PERSONAS.map((p) => ({ ...p }));
            BucketStorageAdapter.UI.setSync(STORAGE_KEY, this.listings);
        }
        this.loaded = true;
    }

    #persist(): void {
        BucketStorageAdapter.UI.setSync(STORAGE_KEY, this.listings);
    }

    getListings(category?: PersonaCategory): PersonaListing[] {
        this.#load();
        let result = this.listings;
        if (category) result = result.filter((l) => l.category === category);
        return result.map((l) => ({ ...l }));
    }

    search(query: string): PersonaListing[] {
        this.#load();
        const q = query.toLowerCase();
        return this.listings
            .filter(
                (l) =>
                    l.name.toLowerCase().includes(q) ||
                    l.description.toLowerCase().includes(q) ||
                    l.tags.some((t) => t.includes(q)),
            )
            .map((l) => ({ ...l }));
    }

    install(id: string): void {
        this.#load();
        const p = this.listings.find((l) => l.id === id);
        if (p) {
            p.installed = true;
            p.downloads++;
            this.#persist();
        }
    }

    uninstall(id: string): void {
        this.#load();
        const p = this.listings.find((l) => l.id === id);
        if (p) {
            p.installed = false;
            this.#persist();
        }
    }

    rate(id: string, rating: number): void {
        this.#load();
        const p = this.listings.find((l) => l.id === id);
        if (p) {
            p.rating = (p.rating * p.downloads + rating) / (p.downloads + 1);
            this.#persist();
        }
    }

    getInstalled(): PersonaListing[] {
        this.#load();
        return this.listings.filter((l) => l.installed).map((l) => ({ ...l }));
    }

    addListing(
        listing: Omit<PersonaListing, 'id' | 'createdAt' | 'installed' | 'downloads' | 'rating'>,
    ): PersonaListing {
        this.#load();
        const entry: PersonaListing = {
            ...listing,
            id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: Date.now(),
            installed: false,
            downloads: 0,
            rating: 0,
        };
        if (this.listings.length >= MAX_LISTINGS) {
            this.listings.shift();
        }
        this.listings.push(entry);
        this.#persist();
        return { ...entry };
    }

    private static readonly ALLOWED_UPDATE_FIELDS = new Set([
        'name',
        'description',
        'category',
        'author',
        'version',
        'price',
        'tags',
        'promptPreview',
    ]);

    updateListing(id: string, updates: Partial<PersonaListing>): void {
        this.#load();
        const idx = this.listings.findIndex((l) => l.id === id);
        if (idx === -1) throw new Error(`Persona ${id} not found`);
        const filtered: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (PersonaMarketplaceService.ALLOWED_UPDATE_FIELDS.has(key)) {
                filtered[key] = value;
            }
        }
        Object.assign(this.listings[idx]!, filtered);
        this.#persist();
    }

    removeListing(id: string): void {
        this.#load();
        this.listings = this.listings.filter((l) => l.id !== id);
        this.#persist();
    }
}
