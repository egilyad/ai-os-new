import { describe, expect, it } from 'vitest';
import { addVetoCount } from './veto-counts';

describe('addVetoCount', () => {
    it('увеличивает счётчик по каждому шаблону', () => {
        const first = addVetoCount({}, { templateIds: ['exc-1', 'exc-2'] });
        const second = addVetoCount(first, { templateIds: ['exc-1'] });
        expect(second).toEqual({ 'exc-1': 2, 'exc-2': 1 });
    });

    it('игнорирует пустые и битые события', () => {
        expect(addVetoCount({}, { templateIds: [] })).toEqual({});
        expect(addVetoCount({}, undefined)).toEqual({});
        expect(addVetoCount({ 'exc-1': 1 }, { nope: true })).toEqual({ 'exc-1': 1 });
    });
});
