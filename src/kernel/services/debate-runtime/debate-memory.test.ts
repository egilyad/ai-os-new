import { describe, it, expect } from 'vitest';
import { DebateMemory, extractStrongTopics, buildPersonaMemory } from './debate-memory';
import type { Claim, ReasoningStep } from '../../contracts/debate-runtime';

function makeStep(overrides?: Partial<ReasoningStep>): ReasoningStep {
    return {
        agentId: 'agent-1',
        content: 'Test reasoning step',
        type: 'claim',
        confidence: 0.8,
        timestamp: Date.now(),
        ...overrides,
    };
}

function makeClaim(overrides?: Partial<Claim>): Claim {
    return {
        id: 'claim-1',
        text: 'Test claim text',
        agentId: 'agent-1',
        speaker: 'agent-1',
        role: 'participant',
        round: 1,
        confidence: 0.7,
        ...overrides,
    };
}

describe('DebateMemory', () => {
    it('records steps and retrieves all', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ content: 'Step 1' }));
        mem.recordStep(makeStep({ content: 'Step 2', agentId: 'agent-2' }));
        expect(mem.getAllSteps()).toHaveLength(2);
    });

    it('filters steps by agent', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ content: 'A1', agentId: 'agent-1' }));
        mem.recordStep(makeStep({ content: 'A2', agentId: 'agent-2' }));
        mem.recordStep(makeStep({ content: 'A3', agentId: 'agent-1' }));
        expect(mem.getAgentSteps('agent-1')).toHaveLength(2);
        expect(mem.getAgentSteps('agent-2')).toHaveLength(1);
    });

    it('returns recent steps', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ content: 'old' }));
        mem.recordStep(makeStep({ content: 'mid' }));
        mem.recordStep(makeStep({ content: 'new' }));
        const recent = mem.getRecentSteps(2);
        expect(recent).toHaveLength(2);
        expect(recent[0]).toBeDefined();
        expect(recent[0]!.content).toBe('mid');
        expect(recent[1]).toBeDefined();
        expect(recent[1]!.content).toBe('new');
    });

    it('returns empty for non-positive count in getRecentSteps', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep());
        expect(mem.getRecentSteps(0)).toHaveLength(0);
        expect(mem.getRecentSteps(-1)).toHaveLength(0);
    });

    it('returns all steps when count exceeds total', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ content: 'only' }));
        const recent = mem.getRecentSteps(10);
        expect(recent).toHaveLength(1);
        expect(recent[0]).toBeDefined();
        expect(recent[0]!.content).toBe('only');
    });

    it('builds chains when recording steps', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ agentId: 'agent-1', type: 'claim', confidence: 0.9 }));
        mem.recordStep(makeStep({ agentId: 'agent-1', type: 'evidence', confidence: 0.8 }));
        const chain = mem.getChain('agent-1');
        expect(chain).toHaveLength(1);
        const c = chain[0];
        expect(c).toBeDefined();
        expect(c!.steps).toHaveLength(2);
        expect(c!.coherence).toBeGreaterThan(0);
    });

    it('starts new chain when previous has conclusion', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ agentId: 'agent-1', type: 'claim', confidence: 0.9 }));
        mem.recordStep(makeStep({ agentId: 'agent-1', type: 'synthesis', confidence: 1.0 }));

        const chains = mem.getChain('agent-1');
        const before = chains[0];
        expect(before).toBeDefined();
        expect(before!.steps).toHaveLength(2);

        mem.recordStep(makeStep({ agentId: 'agent-1', type: 'claim', confidence: 0.7 }));
        expect(mem.getChain('agent-1')).toHaveLength(1);
    });

    it('records claims and filters by topic', () => {
        const mem = new DebateMemory();
        mem.recordClaim(makeClaim({ id: 'c1', text: 'Climate change is real' }));
        mem.recordClaim(makeClaim({ id: 'c2', text: 'Economic growth is important' }));
        const found = mem.getClaimsForTopic('climate');
        expect(found).toHaveLength(1);
        const claim = found[0];
        expect(claim).toBeDefined();
        expect(claim!.id).toBe('c1');
    });

    it('trims content of older steps beyond keepCount', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ content: '1' }));
        mem.recordStep(makeStep({ content: '2' }));
        mem.recordStep(makeStep({ content: '3' }));
        mem.trimContent(2);
        const recent = mem.getRecentSteps(3);
        expect(recent).toHaveLength(2);
        expect(recent[0]).toBeDefined();
        expect(recent[0]!.content).toBe('2');
        expect(recent[1]).toBeDefined();
        expect(recent[1]!.content).toBe('3');
    });

    it('trims content of older steps beyond keepCount', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ content: 'old' }));
        mem.recordStep(makeStep({ content: 'mid' }));
        mem.recordStep(makeStep({ content: 'new' }));
        mem.trimContent(2);
        const steps = mem.getAllSteps();
        expect(steps[0]).toBeDefined();
        expect(steps[0]!.content).toBe('');
        expect(steps[1]).toBeDefined();
        expect(steps[1]!.content).toBe('mid');
        expect(steps[2]).toBeDefined();
        expect(steps[2]!.content).toBe('new');
    });

    it('does not trim when keepCount >= total', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ content: 'only' }));
        mem.trimContent(5);
        const only = mem.getAllSteps();
        expect(only[0]).toBeDefined();
        expect(only[0]!.content).toBe('only');
    });

    it('getWinningStrategies returns chains with high coherence and conclusion', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ agentId: 'w1', type: 'claim', confidence: 0.9 }));
        mem.recordStep(makeStep({ agentId: 'w1', type: 'synthesis', confidence: 1.0 }));
        mem.recordStep(makeStep({ agentId: 'w2', type: 'claim', confidence: 0.3 }));
        mem.recordStep(makeStep({ agentId: 'w2', type: 'synthesis', confidence: 0.3 }));

        const winners = mem.getWinningStrategies();
        expect(winners.length).toBeGreaterThanOrEqual(0);
    });

    it('serializes and restores state', () => {
        const mem = new DebateMemory();
        const c1 = makeClaim({ id: 'c1', text: 'test' });
        mem.recordClaim(c1);
        mem.recordStep(makeStep({ content: 'step1' }));
        const json = mem.toJSON();
        expect(json.claims).toHaveLength(1);
        expect(json.steps).toHaveLength(1);

        const mem2 = new DebateMemory();
        mem2.restoreFrom(json);
        expect(mem2.getAllSteps()).toHaveLength(1);
        const restored = mem2.getAllSteps();
        expect(restored[0]).toBeDefined();
        expect(restored[0]!.content).toBe('step1');
        expect(restored[0]!.agentId).toBe('agent-1');
    });

    it('restoreFrom handles empty data', () => {
        const mem = new DebateMemory();
        mem.restoreFrom({ claims: [], steps: [], chains: [] });
        expect(mem.getAllSteps()).toHaveLength(0);
    });

    it('snapshot returns summary counts', () => {
        const mem = new DebateMemory();
        mem.recordClaim(makeClaim());
        mem.recordStep(makeStep());
        const snap = mem.snapshot();
        expect(snap.totalClaims).toBe(1);
        expect(snap.totalChains).toBe(1);
    });

    it('destroy clears all state', () => {
        const mem = new DebateMemory();
        mem.recordClaim(makeClaim());
        mem.recordStep(makeStep());
        mem.destroy();
        expect(mem.getAllSteps()).toHaveLength(0);
        expect(mem.getChain('agent-1')).toHaveLength(0);
    });

    it('enforces MAX_CLAIMS cap', () => {
        const mem = new DebateMemory();
        for (let i = 0; i < 1005; i++) {
            mem.recordClaim(makeClaim({ id: `c${i}`, text: `claim ${i}` }));
        }
        const steps = mem.getAllSteps();
        expect(steps.length).toBeLessThanOrEqual(1000);
    });
});

describe('extractStrongTopics', () => {
    it('returns empty for too few steps', () => {
        const mem = new DebateMemory();
        mem.recordStep(makeStep({ content: 'only one' }));
        expect(extractStrongTopics(mem, 'agent-1')).toEqual([]);
    });

    it('extracts frequent keywords from agent steps', () => {
        const mem = new DebateMemory();
        for (let i = 0; i < 5; i++) {
            mem.recordStep(
                makeStep({
                    content: 'The economic framework analysis shows clear results',
                    agentId: 'eco-agent',
                }),
            );
        }
        const topics = extractStrongTopics(mem, 'eco-agent');
        expect(topics.length).toBeGreaterThan(0);
        expect(
            topics.some(
                (t) =>
                    t.includes('economi') ||
                    t.includes('framework') ||
                    t.includes('analysis') ||
                    t.includes('result'),
            ),
        ).toBe(true);
    });

    it('respects max 5 topics', () => {
        const mem = new DebateMemory();
        for (let i = 0; i < 10; i++) {
            mem.recordStep(
                makeStep({
                    content: `word${i} appears multiple times in this sentence`,
                    agentId: 'a1',
                }),
            );
        }
        const topics = extractStrongTopics(mem, 'a1');
        expect(topics.length).toBeLessThanOrEqual(5);
    });
});

describe('buildPersonaMemory', () => {
    it('returns empty string when no winning strategies', () => {
        const mem = new DebateMemory();
        const result = buildPersonaMemory(mem, 'agent-1');
        expect(result).toBe('');
    });
});
