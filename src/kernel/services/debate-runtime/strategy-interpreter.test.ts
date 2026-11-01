import { describe, expect, it } from 'vitest';
import { draft, interpret } from './strategy-interpreter';

describe('strategy-interpreter (SPEC_07)', () => {
    it('sequence → linear/sequential, без quality', () => {
        const p = interpret(draft('builtin.brainstorming', 'sequence'));
        expect(p.topology.kind).toBe('linear');
        expect(p.turnPolicy.order).toBe('sequential');
        expect(Object.keys(p.qualityMask)).toHaveLength(0);
    });

    it('debate_graph → roundtable/free', () => {
        const p = interpret(draft('builtin.round_robin', 'debate_graph'));
        expect(p.topology.kind).toBe('roundtable');
        expect(p.turnPolicy.order).toBe('free');
    });

    it('critic_loop → roundtable/adversarial + quality critic/socratic-pivot', () => {
        const p = interpret(draft('builtin.socratic', 'critic_loop', { maxRounds: 6 }));
        expect(p.topology.kind).toBe('roundtable');
        expect(p.turnPolicy.order).toBe('adversarial');
        expect(p.turnPolicy.stopWhen).toBe('agreement');
        expect(p.qualityMask['critic']).toBe(true);
        expect(p.qualityMask['socratic-pivot']).toBe(true);
        expect(p.turnPolicy.maxIterations).toBe(6);
    });

    it('voting → judge/free + quality blind-evaluation/bayesian-judges', () => {
        const p = interpret(draft('builtin.brainstorming', 'voting'));
        expect(p.topology.kind).toBe('judge');
        expect(p.qualityMask['blind-evaluation']).toBe(true);
        expect(p.qualityMask['bayesian-judges']).toBe(true);
    });

    it('peer_review → judge/sequential + judge-deliberation', () => {
        const p = interpret(draft('builtin.constrained', 'peer_review'));
        expect(p.topology.kind).toBe('judge');
        expect(p.turnPolicy.order).toBe('sequential');
        expect(p.qualityMask['judge-deliberation']).toBe(true);
    });

    it('сохраняет convergenceThreshold/earlyExitConfidence', () => {
        const p = interpret(
            draft('builtin.round_robin', 'debate_graph', {
                convergenceThreshold: 0.85,
                earlyExitConfidence: 0.9,
            }),
        );
        expect(p.convergenceThreshold).toBe(0.85);
        expect(p.earlyExitConfidence).toBe(0.9);
    });
});
