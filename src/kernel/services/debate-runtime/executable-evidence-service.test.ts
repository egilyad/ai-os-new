import { describe, it, expect } from 'vitest';
import { ExecutableEvidenceService } from './executable-evidence-service';

describe('ExecutableEvidenceService', () => {
    const svc = new ExecutableEvidenceService();
    it('detects testable claim', () => {
        expect(svc.hasTestableClaim('We saw 42% growth and $100 cost')).toBe(true);
        expect(svc.hasTestableClaim('I like solar energy')).toBe(false);
    });
    it('detects code block', () => {
        expect(svc.hasCodeBlock('Here is code: ```python\nprint(42)\n```')).toBe(true);
        expect(svc.hasCodeBlock('No code here just text')).toBe(false);
    });
    it('validate maps sentences', () => {
        const res = svc.validate('Growth was 42%. No code. Another sentence without numbers.');
        expect(res.length).toBeGreaterThan(0);
        expect(res[0]).toHaveProperty('isTestable');
        expect(res[0]).toHaveProperty('hasCode');
    });
});
