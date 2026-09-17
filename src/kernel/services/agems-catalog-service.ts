import { getDexieDb } from './dexie-schema';

export interface CatalogAgent {
    id?: number;
    slug: string;
    name: string;
    description: string;
    systemPrompt: string;
    llmProvider: string;
    llmModel: string;
    tags: string[];
    toolSlugs: string[];
    skillSlugs: string[];
    authorOrg?: string;
    downloads: number;
}

export class AgemsCatalogService {
    async listAgents(query?: string): Promise<CatalogAgent[]> {
        let arr = (await getDexieDb().catalogAgents.toArray()) as unknown as CatalogAgent[];
        if (query) {
            const q = query.toLowerCase();
            arr = arr.filter((a) => a.name.toLowerCase().includes(q) || a.slug.includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)));
        }
        return arr;
    }

    async importAgent(slug: string): Promise<string> {
        const found = (await getDexieDb().catalogAgents.where('slug').equals(slug).first()) as unknown as CatalogAgent | undefined;
        if (!found) throw new Error(`Catalog agent not found: ${slug}`);
        // Create agent via agentService.spawn with catalog data
        const { agentService } = await import('../instances');
        const id = agentService.spawnAgent(found.name, undefined, {
            prompt: found.systemPrompt,
            provider: found.llmProvider,
            model: found.llmModel,
            slug: found.slug,
        });
        // increment downloads
        await getDexieDb().catalogAgents.update(found.id as number, { downloads: (found.downloads ?? 0) + 1 } as never);
        return id ?? slug;
    }

    async seedIfEmpty(): Promise<void> {
        const count = await getDexieDb().catalogAgents.count();
        if (count > 0) return;
        const seed: CatalogAgent[] = [
            { slug: 'researcher', name: 'Researcher', description: 'Deep research & synthesis', systemPrompt: 'You are a research agent. Be thorough.', llmProvider: 'openrouter', llmModel: 'meta-llama/llama-3.1-8b-instruct', tags: ['research'], toolSlugs: ['web_search'], skillSlugs: [], downloads: 0 },
            { slug: 'coder', name: 'Coder', description: 'Writes clean code', systemPrompt: 'You are an expert coder.', llmProvider: 'groq', llmModel: 'llama-3.3-70b-versatile', tags: ['coding'], toolSlugs: ['read_file'], skillSlugs: [], downloads: 0 },
        ];
        await getDexieDb().catalogAgents.bulkAdd(seed as never);
    }
}

export const agemsCatalogService = new AgemsCatalogService();
