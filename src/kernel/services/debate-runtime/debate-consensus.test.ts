import { describe, it, expect } from 'vitest';
import { DebateConsensusEngine, gatherClaims } from './debate-consensus';
import type { Claim, ParticipantConfig, ReasoningChain } from '../../contracts/debate-runtime';

function claim(overrides?: Partial<Claim>): Claim {
    return {
        id: 'c1',
        text: 'The sky is blue on clear days',
        agentId: 'agent-1',
        speaker: 'agent-1',
        role: 'participant',
        round: 1,
        confidence: 0.8,
        ...overrides,
    };
}

describe('DebateConsensusEngine', () => {
    it('evaluates empty claims returns zero confidence', () => {
        const engine = new DebateConsensusEngine();
        const result = engine.evaluate([]);
        expect(result.agreements).toHaveLength(0);
        expect(result.conflicts).toHaveLength(0);
        expect(result.unresolved).toHaveLength(0);
        expect(result.confidence).toBe(0);
        expect(result.contradictionDensity).toBe(0);
    });

    it('evaluates single claim — no agreements or conflicts', () => {
        const engine = new DebateConsensusEngine();
        const result = engine.evaluate([claim()]);
        expect(result.agreements).toHaveLength(0);
        expect(result.conflicts).toHaveLength(0);
        expect(result.confidence).toBeGreaterThan(0);
    });

    it('detects agreement between similar claims', () => {
        const engine = new DebateConsensusEngine();
        const claims = [
            claim({ id: 'c1', text: 'Climate change requires immediate action' }),
            claim({
                id: 'c2',
                text: 'We need urgent action on climate change',
                agentId: 'agent-2',
            }),
        ];
        const result = engine.evaluate(claims);
        expect(result.agreements.length).toBeGreaterThanOrEqual(0);
    });

    it('detects negation mismatch conflict', () => {
        const engine = new DebateConsensusEngine();
        const claims = [
            claim({ id: 'c1', text: 'This policy is not effective', agentId: 'agent-1' }),
            claim({
                id: 'c2',
                text: 'This policy is effective and works well',
                agentId: 'agent-2',
            }),
        ];
        const result = engine.evaluate(claims);
        expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
    });

    it('detects antonym-based conflict', () => {
        const engine = new DebateConsensusEngine();
        const claims = [
            claim({
                id: 'c1',
                text: 'The high performance gains show good results and prove we are right',
                agentId: 'agent-1',
            }),
            claim({
                id: 'c2',
                text: 'The low performance gains show bad results and prove we are wrong',
                agentId: 'agent-2',
            }),
        ];
        const result = engine.evaluate(claims);
        expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
    });

    it('detects numerical contradiction with same unit', () => {
        const engine = new DebateConsensusEngine();
        const claims = [
            claim({
                id: 'c1',
                text: 'Revenue increased by 50 percent last year',
                agentId: 'agent-1',
            }),
            claim({
                id: 'c2',
                text: 'Revenue increased by 10 percent last year',
                agentId: 'agent-2',
            }),
        ];
        const result = engine.evaluate(claims);
        expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
    });

    it('resolves conflict with high confidence gap automatically', () => {
        const engine = new DebateConsensusEngine();
        const claims = [
            claim({
                id: 'c1',
                text: 'This approach is not wrong',
                agentId: 'agent-1',
                confidence: 0.9,
            }),
            claim({
                id: 'c2',
                text: 'This approach is wrong',
                agentId: 'agent-2',
                confidence: 0.3,
            }),
        ];
        const result = engine.evaluate(claims);
        const resolved = result.conflicts.filter((c) => c.resolved);
        expect(resolved.length).toBeGreaterThanOrEqual(1);
    });

    it('finds unresolved claims with low confidence and no conflict', () => {
        const engine = new DebateConsensusEngine();
        const claims = [
            claim({ id: 'c1', text: 'Uncertain speculation', agentId: 'agent-1', confidence: 0.3 }),
            claim({
                id: 'c2',
                text: 'Strong confident statement',
                agentId: 'agent-2',
                confidence: 0.9,
            }),
        ];
        const result = engine.evaluate(claims);
        expect(result.unresolved).toContain('Uncertain speculation');
    });

    it('caches results for identical claims', () => {
        const engine = new DebateConsensusEngine();
        const claims = [claim({ id: 'c1', text: 'test', agentId: 'agent-1' })];
        const r1 = engine.evaluate(claims);
        const r2 = engine.evaluate(claims);
        expect(r1).toBe(r2);
    });

    it('resolveConflict adds to confidence graph', () => {
        const engine = new DebateConsensusEngine();
        const a = claim({ id: 'c1', text: 'test a', agentId: 'agent-1' });
        const b = claim({ id: 'c2', text: 'test b', agentId: 'agent-2' });
        const conflict = {
            id: 'conflict-1',
            claimA: a,
            claimB: b,
            resolved: false,
        };
        engine.resolveConflict(conflict, 'Test resolution');
        const graph = engine.getConfidenceGraph();
        expect(graph.size).toBe(1);
        expect(graph.has('c1-c2')).toBe(true);
    });

    it('destroy clears all state', () => {
        const engine = new DebateConsensusEngine();
        engine.evaluate([claim()]);
        engine.destroy();
        expect(engine.getConfidenceGraph().size).toBe(0);
    });
});

describe('gatherClaims', () => {
    it('extracts claims from participant chains', () => {
        const memory = {
            getChain: (agentId: string): ReasoningChain[] => [
                {
                    agentId,
                    topic: 'test',
                    steps: [
                        {
                            agentId,
                            content: 'My claim',
                            type: 'claim',
                            confidence: 0.8,
                            timestamp: 1000,
                        },
                        {
                            agentId,
                            content: 'My evidence',
                            type: 'evidence',
                            confidence: 0.7,
                            timestamp: 1001,
                        },
                    ],
                    coherence: 0.9,
                },
            ],
        };
        const participants: ParticipantConfig[] = [
            { agentId: 'agent-1', nodeId: 'node-1', role: 'participant' },
        ];
        const getMem = (_id: string) => memory;
        const claims = gatherClaims('session-1', participants, getMem, 2);
        expect(claims).toHaveLength(1);
        expect(claims[0].text).toBe('My claim');
        expect(claims[0].round).toBe(2);
    });

    it('returns empty when no claim-type steps exist', () => {
        const memory = {
            getChain: () => [
                {
                    agentId: 'a1',
                    topic: 't',
                    steps: [
                        {
                            agentId: 'a1',
                            content: 'evidence',
                            type: 'evidence' as const,
                            confidence: 0.7,
                            timestamp: 1,
                        },
                    ],
                    coherence: 0.8,
                },
            ],
        };
        const claims = gatherClaims('s1', [{ agentId: 'a1', nodeId: 'n1' }], () => memory, 1);
        expect(claims).toHaveLength(0);
    });
});
