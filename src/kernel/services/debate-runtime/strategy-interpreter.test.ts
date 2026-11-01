import { describe, expect, it } from 'vitest';
import {
    compileBuiltin,
    compileDefinition,
    draft,
    interpret,
    isKnownBuiltin,
    programToPlan,
} from './strategy-interpreter';
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

    it('isKnownBuiltin распознаёт известные имена', () => {
        expect(isKnownBuiltin('builtin.socratic')).toBe(true);
        expect(isKnownBuiltin('builtin.contest_mode')).toBe(true);
        expect(isKnownBuiltin('unknown.strategy')).toBe(false);
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

    it('programToPlan для sequence-корня даёт order=sequential', () => {
        const plan = programToPlan(interpret(draft('builtin.brainstorming', 'sequence')));
        expect(plan.order).toBe('sequential');
        expect(plan.stopWhen).toBeUndefined();
    });

    it('programToPlan сохраняет convergenceThreshold', () => {
        const p = interpret(
            draft('builtin.round_robin', 'debate_graph', { convergenceThreshold: 0.8 }),
        );
        expect(programToPlan(p).convergenceThreshold).toBe(0.8);
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

    it('BUILTIN_STRATEGIES имеет уникальные id', () => {
        const ids = BUILTIN_STRATEGIES.map((d) => d.id);
        expect(new Set(ids).size).toBe(ids.length);
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

    it('compileDefinition компилирует полный DSL', () => {
        const p = compileDefinition({
            id: 'custom.socratic',
            root: { type: 'critic_loop', maxRounds: 6, earlyExitConfidence: 0.9 },
        });
        expect(p.topology.kind).toBe('roundtable');
        expect(p.turnPolicy.order).toBe('adversarial');
        expect(p.turnPolicy.stopWhen).toBe('agreement');
        expect(p.earlyExitConfidence).toBe(0.9);
    });

    it('compileDefinition покрывает все DSL-primitive-типы', () => {
        const expectations: Record<string, string> = {
            sequence: 'linear',
            debate_graph: 'roundtable',
            critic_loop: 'roundtable',
            voting: 'judge',
            peer_review: 'judge',
        };
        for (const [type, topology] of Object.entries(expectations)) {
            const p = compileDefinition({ id: `x.${type}`, root: { type } });
            expect(p.topology.kind, type).toBe(topology);
        }
    });

    it('compileDefinition принимает полный StrategyDefinition из реестра', () => {
        const def = BUILTIN_STRATEGIES.find((d) => d.id === 'builtin.socratic')!;
        const p = compileDefinition(def);
        expect(p.root).toBe('critic_loop');
        expect(p.topology.kind).toBe('roundtable');
        expect(p.turnPolicy.stopWhen).toBe('agreement');
        expect(p.id).toBe('builtin.socratic');
        expect(p.name).toBe('Socratic Method');
    });

    it('maxRounds нормализуется в минимум 1', () => {
        const p = interpret(draft('builtin.round_robin', 'debate_graph', { maxRounds: 0 }));
        expect(p.topology.maxRounds).toBe(1);
        expect(p.turnPolicy.maxIterations).toBeUndefined();
    });

    it('convergenceThreshold/earlyExitConfidence клампятся в 0–1', () => {
        const p = interpret(
            draft('builtin.round_robin', 'debate_graph', {
                convergenceThreshold: 1.5,
                earlyExitConfidence: -0.2,
            }),
        );
        expect(p.convergenceThreshold).toBe(1);
        expect(p.earlyExitConfidence).toBe(0);
    });
});
