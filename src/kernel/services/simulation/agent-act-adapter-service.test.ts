/**
 * AgentActAdapterService static test (phase64) — stub fallback without LLM.
 */

import { describe, it, expect } from 'vitest';
import { AgentActAdapterService } from './agent-act-adapter-service';

function fakeFactory(map: Record<string, { output: string; toolCalls?: string[] }>) {
    return {
        get: async (id: string) => (map[id] ? { id } as unknown as import('../../types/capability-types').AgentDefinition : null),
        execute: async (id: string) => {
            const entry = map[id];
            if (!entry) throw new Error('not found');
            return { output: entry.output, toolCalls: entry.toolCalls ?? [] };
        },
    } as unknown as import('../../contracts/capability').IAgentFactory;
}

const world: import('../../contracts/simulation-world').SimulationWorld = {
    id: 'w1', name: 'Test', rooms: [{ id: 'r1', name: 'Hall', x: 0, y: 0, w: 500, h: 500, agents: ['a1'] }, { id: 'r2', name: 'Lab', x: 600, y: 0, w: 300, h: 300, agents: [] }],
    relations: [], globalClock: 0, agentIds: ['a1'], createdAt: Date.now(), updatedAt: Date.now(),
};

describe('AgentActAdapterService (phase64)', () => {
    it('stub fallback when agent not found', async () => {
        const svc = new AgentActAdapterService({ agentFactory: fakeFactory({}) });
        await svc.init();
        const act = await svc.act('missing', 'w1', 1, world);
        expect(['idle','move','talk']).toContain(act.action);
        expect(act.meta?.via).toBe('stub-fallback');
        await svc.destroy();
    });

    it('parses move via room name', async () => {
        const svc = new AgentActAdapterService({ agentFactory: fakeFactory({ 'a1': { output: 'I will move to Lab' } }) });
        await svc.init();
        const act = await svc.act('a1', 'w1', 1, world);
        expect(act.action).toBe('move');
        expect(act.targetRoomId).toBe('r2');
        await svc.destroy();
    });

    it('parses talk', async () => {
        const svc = new AgentActAdapterService({ agentFactory: fakeFactory({ 'a1': { output: 'Hello everyone, I think we should discuss' } }) });
        await svc.init();
        const act = await svc.act('a1', 'w1', 1, world);
        expect(act.action).toBe('talk');
        expect(act.message).toContain('Hello');
        await svc.destroy();
    });

    it('fallback on execute error → stub', async () => {
        const svc = new AgentActAdapterService({ agentFactory: fakeFactory({ 'a1': { output: '' } }) });
        // make execute throw
        (svc as unknown as { deps: { agentFactory: { execute: () => Promise<never> } } }).deps.agentFactory.execute = async () => { throw new Error('LLM down'); };
        await svc.init();
        const act = await svc.act('a1', 'w1', 1, world);
        expect(act.meta?.via).toBe('stub-fallback');
        await svc.destroy();
    });
});
