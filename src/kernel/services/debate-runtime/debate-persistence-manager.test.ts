import { describe, it, expect, vi } from 'vitest';
import { DebatePersistenceManager } from './debate-persistence-manager';
import { DebateMemory } from './debate-memory';

function makeManager() {
    const saved: unknown[] = [];
    const debateStore = {
        saveSnapshot: vi.fn(async (rec: unknown) => {
            saved.push(rec);
            return 1;
        }),
    };
    const state = {
        sessions: new Map<string, never>(),
        budgets: new Map<string, never>(),
        memories: new Map<string, DebateMemory>(),
        contexts: new Map<string, never>(),
        preflightDone: new Set<string>(),
        providerResolver: {},
    };
    const mgr = new DebatePersistenceManager(state as never, {
        debateStore,
        eventBus: { emit: vi.fn() },
    } as never);
    return { mgr, saved: saved as Array<Record<string, unknown>>, state };
}

function liveSession() {
    const args = Array.from({ length: 3 }, (_, i) => ({
        id: `s1-r1-${i}`,
        agentId: 'ag1',
        content: `live argument ${i}`,
        round: 1,
        timestamp: 1000 + i,
    }));
    return {
        id: 's1',
        topic: 't',
        participants: [],
        snapshot: () => ({
            id: 's1',
            topic: 't',
            topology: { type: 'roundtable' },
            phase: 'active',
            round: 1,
            totalTokens: 0,
            totalCost: 0,
            agentStates: [],
            arguments: args,
            participants: [],
            startedAt: 1000,
            language: 'en',
            version: 2,
            failedProviders: [],
            failedModels: [],
        }),
    };
}

function liveMemory(steps: number): DebateMemory {
    const mem = new DebateMemory();
    for (let i = 0; i < steps; i++) {
        mem.recordStep({
            agentId: 'ag1',
            content: `live step content ${i} with enough length`,
            type: 'claim',
            confidence: 0.8,
            timestamp: 1000 + i,
        });
    }
    return mem;
}

describe('DebatePersistenceManager P4 prune-on-save', () => {
    it('prunes the saved copy beyond the last 8 steps, keeps live memory full', async () => {
        const { mgr, saved, state } = makeManager();
        state.sessions.set('s1', liveSession() as never);
        state.memories.set('s1', liveMemory(12));

        await mgr.saveSnapshot('s1');

        expect(saved).toHaveLength(1);
        const memJson = JSON.parse(String(saved[0]!['memory'])) as {
            steps: Array<{ content: string }>;
            chains: Array<{ steps: Array<{ content: string }> }>;
        };
        expect(memJson.steps).toHaveLength(12);
        expect(memJson.steps.slice(0, 4).every((s) => s.content === '')).toBe(true);
        expect(memJson.steps.slice(4).every((s) => s.content.includes('live step'))).toBe(
            true,
        );
        // Chains pruned in the copy too.
        expect(memJson.chains[0]!.steps.slice(0, 4).every((s) => s.content === '')).toBe(true);
        // Live memory untouched.
        const live = (state.memories.get('s1') as DebateMemory).getAllSteps();
        expect(live.every((s) => s.content.includes('live step'))).toBe(true);
    });

    it('leaves short histories unpruned', async () => {
        const { mgr, saved, state } = makeManager();
        state.sessions.set('s1', liveSession() as never);
        state.memories.set('s1', liveMemory(3));

        await mgr.saveSnapshot('s1');

        const memJson = JSON.parse(String(saved[0]!['memory'])) as {
            steps: Array<{ content: string }>;
        };
        expect(memJson.steps.every((s) => s.content.includes('live step'))).toBe(true);
    });
});
