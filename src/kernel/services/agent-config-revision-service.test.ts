import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentConfigRevisionService } from './agent-config-revision-service';
import type { AgemsAgentCore } from '../types/agems-agent';

describe('AgentConfigRevisionService', () => {
    let service: AgentConfigRevisionService;
    let kvStore: Map<string, unknown>;
    let emitSpy: ReturnType<typeof vi.fn>;

    const sampleAgent: AgemsAgentCore = {
        id: 'agent-1',
        name: 'Test Agent',
        slug: 'test-agent',
        type: 'AUTONOMOUS',
        status: 'ACTIVE',
        llmProvider: 'OPENAI',
        llmModel: 'gpt-4o',
        llmConfig: { temperature: 0.7, maxTokens: 4096 },
        systemPrompt: 'You are a test agent.',
        runtimeConfig: { mode: 'API', maxIterations: 10, timeoutMs: 30000 },
        ownerId: 'user-1',
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    beforeEach(() => {
        kvStore = new Map();
        emitSpy = vi.fn();

        const fakeDeps = {
            database: {
                getKv: async <T>(id: string) => (kvStore.get(id) as T) || null,
                setKv: async <T>(id: string, value: T) => {
                    kvStore.set(id, value);
                },
            },
            eventBus: { emit: emitSpy },
        };

        service = new AgentConfigRevisionService(fakeDeps);
    });

    it('returns empty array when no revisions exist', async () => {
        const revs = await service.getRevisions('agent-1');
        expect(revs).toEqual([]);
    });

    it('saves revision and emits event', async () => {
        const rev = await service.saveRevision(
            'agent-1',
            sampleAgent,
            { name: { old: 'Old Name', new: 'Test Agent' } },
            'user-1',
            'Initial version',
        );

        expect(rev.version).toBe(1);
        expect(rev.agentId).toBe('agent-1');
        expect(rev.snapshot).toEqual(sampleAgent);
        expect(emitSpy).toHaveBeenCalledWith('agent:configRevisionSaved', { agentId: 'agent-1', version: 1 });

        const revs = await service.getRevisions('agent-1');
        expect(revs.length).toBe(1);
    });

    it('increments version numbers on successive revisions', async () => {
        await service.saveRevision('agent-1', sampleAgent, {});
        const rev2 = await service.saveRevision('agent-1', { ...sampleAgent, version: 2 }, {});

        expect(rev2.version).toBe(2);
        const revs = await service.getRevisions('agent-1');
        expect(revs.length).toBe(2);
    });

    it('rolls back to a target version', async () => {
        await service.saveRevision('agent-1', sampleAgent, {});
        const updatedAgent = { ...sampleAgent, name: 'Updated Agent', version: 2 };
        await service.saveRevision('agent-1', updatedAgent, {});

        const target = await service.rollback('agent-1', 1);
        expect(target).toEqual(sampleAgent);
        expect(emitSpy).toHaveBeenCalledWith('agent:configRollback', { agentId: 'agent-1', version: 1 });
    });

    it('returns null when rolling back to non-existent version', async () => {
        const res = await service.rollback('agent-1', 99);
        expect(res).toBeNull();
    });
});
