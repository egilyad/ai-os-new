import { describe, expect, it } from 'vitest';
import { StrategyManager } from './debate-strategy-manager';

describe('StrategyManager (SPEC_07)', () => {
    const manager = new StrategyManager();

    it('компилирует builtin через наследование StrategyRegistry', () => {
        const program = manager.compile('builtin.socratic');
        expect(program).toBeDefined();
        expect(program!.topology.kind).toBe('roundtable');
        expect(program!.turnPolicy.stopWhen).toBe('agreement');
    });

    it('returnCompiled возвращает отсортированные программы', () => {
        const programs = manager.listCompiled();
        expect(programs.length).toBeGreaterThanOrEqual(33);
        expect(programs[0]!.id).toBe('builtin.argument_tree');
    });

    it('getStrategySelectOptions возвращает опции', () => {
        const options = manager.getStrategySelectOptions();
        expect(options.length).toBeGreaterThanOrEqual(33);
        expect(options.every((o) => o.id.startsWith('builtin.'))).toBe(true);
    });
});
