/**
 * CatalogService tests — AGEMS port Phase 8.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CatalogService } from './catalog-service';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function makeCatalogDb() {
    const agents = new Map<string, Record<string, unknown>>();
    const skills = new Map<string, Record<string, unknown>>();
    return {
        catalogAgents: {
            toArray: async () => Array.from(agents.values()),
            get: async (id: string) => agents.get(id),
            put: async (v: Record<string, unknown>) => { agents.set(v.id as string, v); return v.id as string; },
            delete: async (id: string) => { agents.delete(id); },
        },
        catalogSkills: {
            toArray: async () => Array.from(skills.values()),
            get: async (id: string) => skills.get(id),
            put: async (v: Record<string, unknown>) => { skills.set(v.id as string, v); return v.id as string; },
            delete: async (id: string) => { skills.delete(id); },
        },
    };
}

describe('CatalogService', () => {
    let db: ReturnType<typeof makeCatalogDb>;
    let svc: CatalogService;

    beforeEach(() => {
        db = makeCatalogDb();
        svc = new CatalogService(db);
    });

    describe('agents', () => {
        it('imports and retrieves an agent', async () => {
            const agent = await svc.importAgent({
                slug: 'test-agent',
                name: 'Test Agent',
                type: 'assistant',
                description: 'A test agent',
                systemPrompt: 'You are a test',
                llmProvider: 'openai',
                llmModel: 'gpt-4',
                tags: ['test'],
                toolSlugs: [],
                skillSlugs: [],
                authorOrg: 'test-org',
            });
            expect(agent.id).toMatch(/^catalog-agent-/);
            expect(agent.downloads).toBe(0);

            const retrieved = await svc.getAgent(agent.id);
            expect(retrieved?.name).toBe('Test Agent');
        });

        it('lists agents with filters', async () => {
            await svc.importAgent({ slug: 'a1', name: 'Agent One', type: 'assistant', description: 'desc', systemPrompt: '', llmProvider: '', llmModel: '', tags: ['alpha'], toolSlugs: [], skillSlugs: [], authorOrg: 'org1' });
            await svc.importAgent({ slug: 'a2', name: 'Agent Two', type: 'debater', description: 'desc', systemPrompt: '', llmProvider: '', llmModel: '', tags: ['beta'], toolSlugs: [], skillSlugs: [], authorOrg: 'org2' });

            const byType = await svc.listAgents({ type: 'debater' });
            expect(byType.length).toBe(1);
            expect(byType[0].slug).toBe('a2');

            const byTag = await svc.listAgents({ tags: ['alpha'] });
            expect(byTag.length).toBe(1);
        });

        it('searches agents by name', async () => {
            await svc.importAgent({ slug: 'alpha', name: 'Alpha Bot', type: 'assistant', description: 'desc', systemPrompt: '', llmProvider: '', llmModel: '', tags: [], toolSlugs: [], skillSlugs: [], authorOrg: '' });
            await svc.importAgent({ slug: 'beta', name: 'Beta Bot', type: 'assistant', description: 'desc', systemPrompt: '', llmProvider: '', llmModel: '', tags: [], toolSlugs: [], skillSlugs: [], authorOrg: '' });

            const results = await svc.listAgents({ search: 'Alpha' });
            expect(results.length).toBe(1);
            expect(results[0].slug).toBe('alpha');
        });

        it('increments downloads', async () => {
            const agent = await svc.importAgent({ slug: 'x', name: 'X', type: 't', description: '', systemPrompt: '', llmProvider: '', llmModel: '', tags: [], toolSlugs: [], skillSlugs: [], authorOrg: '' });
            await svc.incrementAgentDownloads(agent.id);
            const updated = await svc.getAgent(agent.id);
            expect(updated?.downloads).toBe(1);
        });

        it('removes an agent', async () => {
            const agent = await svc.importAgent({ slug: 'x', name: 'X', type: 't', description: '', systemPrompt: '', llmProvider: '', llmModel: '', tags: [], toolSlugs: [], skillSlugs: [], authorOrg: '' });
            await svc.removeAgent(agent.id);
            expect(await svc.getAgent(agent.id)).toBeUndefined();
        });
    });

    describe('skills', () => {
        it('imports and retrieves a skill', async () => {
            const skill = await svc.importSkill({
                slug: 'test-skill',
                name: 'Test Skill',
                description: 'A test skill',
                content: 'skill content',
                version: '1.0.0',
                type: 'custom',
                tags: ['test'],
            });
            expect(skill.id).toMatch(/^catalog-skill-/);
            expect(skill.downloads).toBe(0);

            const retrieved = await svc.getSkill(skill.id);
            expect(retrieved?.name).toBe('Test Skill');
        });

        it('lists skills with filters', async () => {
            await svc.importSkill({ slug: 's1', name: 'Skill One', description: 'desc', content: '', version: '1.0', type: 'builtin', tags: ['a'] });
            await svc.importSkill({ slug: 's2', name: 'Skill Two', description: 'desc', content: '', version: '1.0', type: 'custom', tags: ['b'] });

            const byType = await svc.listSkills({ type: 'custom' });
            expect(byType.length).toBe(1);
            expect(byType[0].slug).toBe('s2');
        });

        it('searches across both agents and skills', async () => {
            await svc.importAgent({ slug: 'alpha', name: 'Alpha Agent', type: 't', description: '', systemPrompt: '', llmProvider: '', llmModel: '', tags: [], toolSlugs: [], skillSlugs: [], authorOrg: '' });
            await svc.importSkill({ slug: 'alpha-skill', name: 'Alpha Skill', description: '', content: '', version: '1.0', type: 'custom', tags: [] });

            const results = await svc.search('Alpha');
            expect(results.agents.length).toBe(1);
            expect(results.skills.length).toBe(1);
        });
    });
});
