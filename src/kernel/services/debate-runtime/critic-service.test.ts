import { describe, it, expect } from 'vitest';
import { CriticService } from './critic-service';

describe('CriticService', () => {
    const s = new CriticService();
    it('flags absolute without source', () => {
        expect(s.critique('Always true for everyone').some((c) => c.severity === 'high')).toBe(true);
        expect(s.passes('Always true')).toBe(false);
    });
    it('passes well-supported', () => {
        expect(s.passes('This argument cites source 42 with detailed data and reasoning.')).toBe(true);
    });
    it('detects short', () => {
        expect(s.critique('hi').some((c) => c.issue === 'too short')).toBe(true);
    });
});
