import { describe, expect, it } from 'vitest';
import {
    buildTopologyForStrategy,
    isKnownStrategy,
    resolveStrategyConfig,
    resolveStrategyConfigForMode,
    roundToAvailableTopology,
} from './debate-session-bridge';
import { BUILTIN_STRATEGIES } from './debate-strategy-definitions';
import type { DebateParticipant, DebateStrategy } from '../../contracts/debate-types';

const baseline: DebateParticipant[] = [
    { id: 'a', name: 'A', role: 'pro' },
    { id: 'b', name: 'B', role: 'con' },
    { id: 'c', name: 'C', role: 'neutral' },
];

describe('buildTopologyForStrategy', () => {
    it('defaults to roundtable for round_robin and strategies without handlers', () => {
        expect(buildTopologyForStrategy('round_robin', baseline).type).toBe('roundtable');
        expect(buildTopologyForStrategy('cross-examination', baseline).type).toBe('roundtable');
        expect(buildTopologyForStrategy('socratic', baseline).type).toBe('roundtable');
        expect(buildTopologyForStrategy('free_for_all', baseline).type).toBe('roundtable');
    });

    it('maps sequential → linear', () => {
        const topo = buildTopologyForStrategy('sequential', baseline);
        expect(topo.type).toBe('linear');
        expect(topo.nodes).toHaveLength(baseline.length);
        expect(topo.edges).toHaveLength(baseline.length - 1);
    });

    it('maps tree-of-thought → tree (star from first node)', () => {
        const topo = buildTopologyForStrategy('tree-of-thought', baseline);
        expect(topo.type).toBe('tree-of-thought');
        expect(topo.edges).toHaveLength(baseline.length - 1);
    });

    it('maps judge only when a judge participant exists; else falls back to roundtable', () => {
        expect(buildTopologyForStrategy('judge', baseline).type).toBe('roundtable');
        const withJudge = buildTopologyForStrategy('judge', [
            ...baseline,
            { id: 'j', name: 'Judge', role: 'judge' },
        ]);
        expect(withJudge.type).toBe('judge');
    });

    it('maps red-blue only when attacker & defender exist; else falls back to roundtable', () => {
        expect(buildTopologyForStrategy('red-blue', baseline).type).toBe('roundtable');
        const present = buildTopologyForStrategy('red-blue', [
            { id: 'atk', name: 'Atk', role: 'attacker' },
            { id: 'def', name: 'Def', role: 'defender' },
        ]);
        expect(present.type).toBe('red-blue');
        expect(present.edges.length).toBeGreaterThanOrEqual(2);
    });

    it('обрабатывает все enum-стратегии без падений', () => {
        const enums: DebateStrategy[] = [
            'round_robin',
            'socratic',
            'argument_tree',
            'constrained',
            'moderated',
            'free_for_all',
            'jury_trial',
            'cross-examination',
            'tournament',
            'sequential',
            'tree-of-thought',
            'judge',
            'red-blue',
        ];
        const withJudge = [
            ...baseline,
            { id: 'j', name: 'Judge', role: 'judge' as const },
            { id: 'atk', name: 'Atk', role: 'attacker' as const },
            { id: 'def', name: 'Def', role: 'defender' as const },
        ];
        for (const s of enums) {
            const topo = buildTopologyForStrategy(s, withJudge);
            expect(topo.type, s).toMatch(/roundtable|linear|judge|tree-of-thought|red-blue/);
        }
    });
});

describe('resolveStrategyConfig (DSL interpreter integration)', () => {
    it('builtin.socratic → roundtable + critic/socratic-pivot quality', () => {
        const res = resolveStrategyConfig('builtin.socratic', baseline);
        expect(res.topology.type).toBe('roundtable');
        expect(res.forcedQuality).toEqual(expect.arrayContaining(['critic', 'socratic-pivot']));
    });

    it('builtin.brainstorming → linear', () => {
        const res = resolveStrategyConfig('builtin.brainstorming', baseline);
        expect(res.topology.type).toBe('linear');
    });

    it('builtin.constrained → judge when judge present', () => {
        const withJudge = resolveStrategyConfig('builtin.constrained', [
            ...baseline,
            { id: 'j', name: 'Judge', role: 'judge' },
        ]);
        expect(withJudge.topology.type).toBe('judge');
    });

    it('socratic применяет maxRounds из DSL (6)', () => {
        const res = resolveStrategyConfig('builtin.socratic', baseline);
        expect(res.topology.maxRounds).toBe(6);
    });

    it('socratic (roundtable-fallback) сохраняет stopWhen из плана', () => {
        const res = resolveStrategyConfig('builtin.socratic', baseline);
        expect(res.topology.type).toBe('roundtable');
        expect(res.stopWhen).toBe('agreement');
    });

    it('resolveStrategyConfig обрабатывает все BUILTIN без исключений', () => {
        const withJudge = [...baseline, { id: 'j', name: 'Judge', role: 'judge' as const }];
        for (const def of BUILTIN_STRATEGIES) {
            const res = resolveStrategyConfig(def.id, withJudge);
            expect(res.topology.type, def.id).toMatch(
                /roundtable|linear|judge|tree-of-thought|red-blue/,
            );
            expect(Array.isArray(res.forcedQuality), def.id).toBe(true);
        }
    });

    it('builtin.constrained без судьи → откат на roundtable с сохранением качества', () => {
        const res = resolveStrategyConfig('builtin.constrained', baseline);
        expect(res.topology.type).toBe('roundtable');
        expect(res.forcedQuality).toEqual(expect.arrayContaining(['judge-deliberation']));
    });

    it('пустые участники не роняют резолюцию', () => {
        const enums: DebateStrategy[] = [
            'round_robin',
            'socratic',
            'sequential',
            'tree-of-thought',
            'judge',
            'red-blue',
        ];
        for (const s of enums) {
            expect(() => buildTopologyForStrategy(s, []), s).not.toThrow();
        }
        expect(() => resolveStrategyConfig('builtin.socratic', [])).not.toThrow();
    });

    it('roundToAvailableTopology откатывается на roundtable при нехватке ролей', () => {
        expect(roundToAvailableTopology('judge', baseline).type).toBe('roundtable');
        expect(roundToAvailableTopology('red-blue', baseline).type).toBe('roundtable');
        const present = roundToAvailableTopology('red-blue', [
            { id: 'a', name: 'A', role: 'attacker' },
            { id: 'b', name: 'B', role: 'defender' },
        ]);
        expect(present.type).toBe('red-blue');
    });

    it('isKnownStrategy распознаёт enum и builtin', () => {
        expect(isKnownStrategy('round_robin')).toBe(true);
        expect(isKnownStrategy('tree-of-thought')).toBe(true);
        expect(isKnownStrategy('builtin.socratic')).toBe(true);
        expect(isKnownStrategy('bogus.strategy')).toBe(false);
    });

    it('enum tournament → linear', () => {
        expect(buildTopologyForStrategy('tournament', baseline).type).toBe('linear');
    });

    it('resolveStrategyConfig не мутирует входных участников', () => {
        const participants: DebateParticipant[] = [
            { id: 'a', name: 'A', role: 'pro' },
            { id: 'b', name: 'B', role: 'con' },
        ];
        const snapshot = JSON.stringify(participants);
        resolveStrategyConfig('builtin.socratic', participants);
        resolveStrategyConfig('judge', participants);
        expect(JSON.stringify(participants)).toBe(snapshot);
    });

    it('resolveStrategyConfigForMode применяет режим и резолвит стратегию', () => {
        const res = resolveStrategyConfigForMode('strict_logic', baseline);
        expect(res.topology.type).toBe('roundtable');
        expect(res.temperature).toBe(0.3);
        expect(res.forcedQuality).toEqual(
            expect.arrayContaining(['evidence-triangulation', 'fact-checking']),
        );
    });

    it('resolveStrategyConfigForMode покрывает все режимы без падений', () => {
        const modes = ['strict_logic', 'scientific_review', 'brainstorming', 'jury_trial'];
        for (const mode of modes) {
            expect(() => resolveStrategyConfigForMode(mode, baseline), mode).not.toThrow();
        }
    });
});
