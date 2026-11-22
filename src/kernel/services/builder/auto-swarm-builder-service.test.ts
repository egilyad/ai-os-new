import { describe, it, expect } from 'vitest';
import { AutoSwarmBuilderService } from './auto-swarm-builder-service';

const spec = {
    name: 'Research team',
    goal: 'Study a topic',
    agents: [
        { id: 'a1', role: 'researcher', prompt: 'Find reliable sources on the topic.' },
        { id: 'a2', role: 'writer', prompt: 'Write a structured report from the findings.' },
    ],
    topology: 'sequential',
};

describe('AutoSwarmBuilderService', () => {
    it('builds a validated team spec from LLM output', async () => {
        const svc = new AutoSwarmBuilderService({
            chat: async () => ({ content: `Here: ${JSON.stringify(spec)}` }),
        });
        const r = await svc.build('Create a research team');
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.spec.agents).toHaveLength(2);
            expect(r.spec.topology).toBe('sequential');
        }
    });

    it('returns an error on malformed LLM output', async () => {
        const svc = new AutoSwarmBuilderService({
            chat: async () => ({ content: 'no json here' }),
        });
        const r = await svc.build('x');
        expect(r.ok).toBe(false);
    });

    it('rejects a spec that fails schema validation', async () => {
        const svc = new AutoSwarmBuilderService({
            chat: async () => ({ content: JSON.stringify({ ...spec, agents: [] }) }),
        });
        const r = await svc.build('x');
        expect(r.ok).toBe(false);
    });

    it('rejects an empty request', async () => {
        const svc = new AutoSwarmBuilderService({ chat: async () => ({ content: '' }) });
        expect((await svc.build('   ')).ok).toBe(false);
    });
});
