import { PromptLibraryService } from './prompt-library-service';
import type { PromptTemplate } from '../contracts/prompt-library';
import { seedPromptsDemo, DEMO_PROMPT_TAG } from './prompts-demo-seed';

const kv = new Map<string, { value: unknown; version: number }>();

vi.mock('../instances/core-references', () => ({
    database: {
        getKv: async (id: string) => kv.get(id)?.value ?? null,
        getKvCas: async (id: string) => ({
            value: kv.get(id)?.value ?? null,
            version: kv.get(id)?.version ?? 0,
        }),
        setKvCas: async (id: string, value: unknown, version: number) => {
            const cur = kv.get(id)?.version ?? 0;
            if (cur !== version) return false;
            kv.set(id, { value, version: version + 1 });
            return true;
        },
    },
}));

describe('prompts-demo-seed', () => {
    beforeEach(() => {
        kv.clear();
    });

    it('seeds two Russian templates with variables', async () => {
        const service = new PromptLibraryService();
        const prompts = await seedPromptsDemo(service);
        expect(prompts).toHaveLength(2);
        for (const p of prompts) {
            expect(p.tags).toContain(DEMO_PROMPT_TAG);
            expect(p.variables.length).toBeGreaterThan(0);
        }
        const titles = prompts.map((p: PromptTemplate) => p.title);
        expect(titles.some((t) => t.includes('отказ'))).toBe(true);
        expect(titles.some((t) => t.includes('дайджест'))).toBe(true);
    });

    it('is idempotent: repeated calls reuse templates', async () => {
        const service = new PromptLibraryService();
        const first = await seedPromptsDemo(service);
        const second = await seedPromptsDemo(service);
        expect(second.map((p) => p.id).sort()).toEqual(first.map((p) => p.id).sort());
    });
});
