import { describe, expect, it } from 'vitest';
import { compileBuiltin, draft, interpret, programToPlan } from './strategy-interpreter';
import { BUILTIN_STRATEGIES } from './debate-strategy-definitions';
import type { TopologyKind } from '../../contracts/strategy-program';

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

    it('compileBuiltin компилирует известные имена', () => {
        expect(compileBuiltin('builtin.socratic')?.topology.kind).toBe('roundtable');
        expect(compileBuiltin('builtin.round_robin')?.root).toBe('debate_graph');
        expect(compileBuiltin('builtin.brainstorming')?.topology.kind).toBe('linear');
        expect(compileBuiltin('unknown.strategy')).toBeNull();
    });

    it('programToPlan конвертирует программу в план', () => {
        const p = interpret(draft('builtin.socratic', 'critic_loop', { maxRounds: 6 }));
        const plan = programToPlan(p);
        expect(plan.topology).toBe('roundtable');
        expect(plan.techniques).toContain('critic');
        expect(plan.maxRounds).toBe(6);
        expect(plan.order).toBe('adversarial');
        expect(plan.stopWhen).toBe('agreement');
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

    it('compileBuiltin покрывает все BUILTIN_STRATEGIES', () => {
        const ids = BUILTIN_STRATEGIES.map((d) => d.id);
        expect(ids.length).toBeGreaterThanOrEqual(33);
        const uncovered = ids.filter((id) => compileBuiltin(id) === null);
        expect(uncovered, `uncovered: ${uncovered.join(', ')}`).toEqual([]);
    });

    it('каждая builtin-программа даёт валидную топологию', () => {
        const kinds = new Set<TopologyKind>([
            'linear',
            'roundtable',
            'judge',
            'tree-of-thought',
            'red-blue',
        ]);
        for (const id of BUILTIN_STRATEGIES.map((d) => d.id)) {
            const program = compileBuiltin(id);
            expect(program, id).not.toBeNull();
            expect(kinds.has(program!.topology.kind), `${id} -> ${program!.topology.kind}`).toBe(
                true,
            );
            expect(program!.topology.maxRounds).toBeGreaterThanOrEqual(1);
        }
    });

    it('неизвестный корень → fallback на roundtable', () => {
        const draft = { id: 'x', name: 'x', root: 'unknown_root' } as never;
        const p = interpret(draft);
        expect(p.topology.kind).toBe('roundtable');
        expect(p.turnPolicy.order).toBe('free');
    });

    it('maxRounds нормализуется в минимум 1', () => {
        const p = interpret(draft('builtin.round_robin', 'debate_graph', { maxRounds: 0 }));
        expect(p.topology.maxRounds).toBe(1);
        expect(p.turnPolicy.maxIterations).toBeUndefined();
    });
});
