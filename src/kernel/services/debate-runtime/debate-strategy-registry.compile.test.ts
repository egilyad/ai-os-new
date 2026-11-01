import { describe, expect, it } from 'vitest';
import { StrategyRegistry } from './debate-strategy-registry';
import { BUILTIN_STRATEGIES } from './debate-strategy-definitions';

describe('StrategyRegistry.compile (SPEC_07)', () => {
    const registry = new StrategyRegistry();

    it('компилирует builtin-стратегии в программу', () => {
        for (const def of BUILTIN_STRATEGIES) {
            const program = registry.compile(def.id);
            expect(program, def.id).toBeDefined();
            expect(program!.topology.maxRounds).toBeGreaterThanOrEqual(1);
        }
    });

    it('возвращает undefined для неизвестной стратегии', () => {
        expect(registry.compile('unknown.strategy')).toBeUndefined();
    });

    it('listCompiled возвращает программы всех зарегистрированных', () => {
        const programs = registry.listCompiled();
        expect(programs.length).toBeGreaterThanOrEqual(33);
        expect(programs.every((p) => p.topology.maxRounds! >= 1)).toBe(true);
    });

    it('getStrategySelectOptions возвращает сортированный список', () => {
        const options = registry.getStrategySelectOptions();
        expect(options.length).toBeGreaterThanOrEqual(33);
        expect(options[0]!.id).toBe('builtin.argument_tree');
        expect(options.every((o) => o.name.length > 0 && o.description.length > 0)).toBe(true);
    });
});
