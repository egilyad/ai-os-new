import { describe, expect, it } from 'vitest';
import { compileLensStack } from './lens-compiler';
import type { Lens } from '../types/lens-types';

function lens(id: string, transform: Lens['transform'], priority = 1): Lens {
    return { id, name: id, transform, priority } as unknown as Lens;
}

const lenses = new Map<string, Lens>([
    ['a', lens('a', { kind: 'prompt-prefix', text: 'focus on risk' }, 2)],
    ['b', lens('b', { kind: 'perspective-inject', questions: ['what if?'] }, 1)],
    [
        'c',
        lens('c', {
            kind: 'scoring-rubric',
            rubric: { dimensions: ['clarity', 'risk'], maxScore: 10 },
        }),
    ],
]);

const getLens = (id: string) => lenses.get(id);
const validate = (ids: string[]) => ({
    valid: ids.every((id) => lenses.has(id)),
    errors: ids.filter((id) => !lenses.has(id)).map((id) => `Unknown lens: ${id}`),
    resolvedOrder: [...ids].sort(
        (x, y) => (getLens(y)?.priority ?? 0) - (getLens(x)?.priority ?? 0),
    ),
});

describe('compileLensStack', () => {
    it('применяет приоритет и все kinds трансформаций', () => {
        const result = compileLensStack(['b', 'a', 'c'], getLens, validate);
        expect(result.order).toEqual(['a', 'b', 'c']);
        expect(result.system.join(' ')).toContain('focus on risk');
        expect(result.system.join(' ')).toContain('what if?');
        expect(result.outputRules.join(' ')).toContain('clarity, risk');
    });

    it('отмечает неизвестные линзы и ошибки валидации', () => {
        const result = compileLensStack(['a', 'missing'], getLens, validate);
        expect(result.dropped).toEqual(['missing']);
        expect(result.errors).toContain('Unknown lens: missing');
        expect(result.system).toHaveLength(1);
    });
});
