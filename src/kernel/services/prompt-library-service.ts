import { BUILT_IN_TEMPLATES } from '../contracts/prompt-library';
import type { PromptTemplate } from '../contracts/prompt-library';

const STORAGE_KEY = 'prompt_library';
let nextId = Date.now();

function generateId(): string {
    return `prompt-${nextId++}-${Math.random().toString(36).slice(2, 8)}`;
}

export class PromptLibraryService {
    private cache: PromptTemplate[] | null = null;

    private async db(): Promise<import('../types/interfaces').IDatabaseService> {
        const { database } = await import('../instances/core-references');
        return database;
    }

    async getAll(): Promise<PromptTemplate[]> {
        if (this.cache) return this.cache;
        const d = await this.db();
        const saved = await d.getKv<PromptTemplate[]>(STORAGE_KEY);
        const custom = saved ?? [];
        const all = [...BUILT_IN_TEMPLATES, ...custom];
        this.cache = all;
        return all;
    }

    async getById(id: string): Promise<PromptTemplate | undefined> {
        const all = await this.getAll();
        return all.find((p) => p.id === id);
    }

    async create(
        data: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'isBuiltIn'>,
    ): Promise<PromptTemplate> {
        const now = Date.now();
        const prompt: PromptTemplate = {
            ...data,
            id: generateId(),
            variables: data.variables ?? [],
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
            isBuiltIn: false,
        };
        const d = await this.db();
        for (let attempt = 0; attempt < 3; attempt++) {
            const { value, version } = await d.getKvCas<PromptTemplate[]>(STORAGE_KEY);
            const saved = value ?? [];
            saved.push(prompt);
            if (await d.setKvCas(STORAGE_KEY, saved, version)) break;
        }
        this.cache = null;
        return prompt;
    }

    async update(
        id: string,
        data: Partial<Omit<PromptTemplate, 'id' | 'createdAt' | 'isBuiltIn'>>,
    ): Promise<PromptTemplate | undefined> {
        const d = await this.db();
        for (let attempt = 0; attempt < 3; attempt++) {
            const { value, version } = await d.getKvCas<PromptTemplate[]>(STORAGE_KEY);
            const saved = value ?? [];
            const idx = saved.findIndex((p) => p.id === id);
            if (idx === -1) return undefined;
            saved[idx] = { ...saved[idx]!, ...data, updatedAt: Date.now() };
            if (await d.setKvCas(STORAGE_KEY, saved, version)) break;
        }
        this.cache = null;
        const d2 = await this.db();
        const all = (await d2.getKv<PromptTemplate[]>(STORAGE_KEY)) ?? [];
        return all.find((p) => p.id === id);
    }

    async remove(id: string): Promise<boolean> {
        const d = await this.db();
        for (let attempt = 0; attempt < 3; attempt++) {
            const { value, version } = await d.getKvCas<PromptTemplate[]>(STORAGE_KEY);
            const saved = value ?? [];
            const filtered = saved.filter((p) => p.id !== id);
            if (filtered.length === saved.length) return false;
            if (await d.setKvCas(STORAGE_KEY, filtered, version)) break;
        }
        this.cache = null;
        return true;
    }

    async incrementUsage(id: string): Promise<void> {
        const d = await this.db();
        for (let attempt = 0; attempt < 3; attempt++) {
            const { value, version } = await d.getKvCas<PromptTemplate[]>(STORAGE_KEY);
            const saved = value ?? [];
            const idx = saved.findIndex((p) => p.id === id);
            if (idx === -1) return;
            saved[idx]!.usageCount++;
            if (await d.setKvCas(STORAGE_KEY, saved, version)) break;
        }
        this.cache = null;
    }

    async search(query: string): Promise<PromptTemplate[]> {
        const all = await this.getAll();
        const q = query.toLowerCase();
        return all.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.content.toLowerCase().includes(q) ||
                p.tags.some((t) => t.toLowerCase().includes(q)) ||
                p.category.toLowerCase().includes(q),
        );
    }

    async getByCategory(category: string): Promise<PromptTemplate[]> {
        const all = await this.getAll();
        return all.filter((p) => p.category === category);
    }

    getCategories(): string[] {
        const cats = new Set(BUILT_IN_TEMPLATES.map((p) => p.category));
        return [...cats].sort();
    }
}
