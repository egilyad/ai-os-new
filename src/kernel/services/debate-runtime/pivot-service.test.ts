import { describe, it, expect } from 'vitest';
import { PivotService } from './pivot-service';

describe('PivotService', () => {
    const s = new PivotService();
    it('no pivot on insufficient data', () => {
        expect(s.evaluate('alice', [0.6], 1).shouldPivot).toBe(false);
    });
    it('pivot when declining low scores', () => {
        expect(s.evaluate('alice', [0.6, 0.4, 0.2], 4).shouldPivot).toBe(true);
    });
    it('no pivot when stable', () => {
        expect(s.evaluate('alice', [0.7, 0.75, 0.8], 4).shouldPivot).toBe(false);
    });
});
