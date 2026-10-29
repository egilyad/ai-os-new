import { describe, it, expect } from 'vitest';
import { modelFamily } from './debate-runtime/debate-query-engine';
import { synthesize } from './research-algorithms';
import { sanitizeObject } from '../../shared/utils/sanitize';
import type { ResearchClaim } from '../contracts/research-engine';

/**
 * P1-4: eval/regression gate for the roadmap changes. These are pure,
 * deterministic assertions on the kernels we added (P0-4 masking, P1-2 family
 * diversity, P1-6 claim-centric evidence) so regressions are caught cheaply.
 */
describe('roadmap P0/P1 eval gates', () => {
    describe('P1-2 model family diversity', () => {
        it('classifies models into distinct families', () => {
            expect(modelFamily('openrouter', 'openai/gpt-oss-120b')).toBe('openai-gpt-oss');
            expect(modelFamily('groq', 'openai/gpt-oss-20b')).toBe('openai-gpt-oss');
            expect(modelFamily('nvidia', 'openai/gpt-oss-120b')).toBe('openai-gpt-oss');
            expect(modelFamily('gemini', 'gemini-2.5-pro')).toBe('gemini');
            expect(modelFamily('openrouter', 'anthropic/claude-3-5-sonnet')).toBe('anthropic');
            expect(modelFamily('openrouter', 'meta-llama/llama-3.3-70b')).toBe('llama');
        });

        it('falls back to provider-based family for bare/unknown models', () => {
            expect(modelFamily('gemini', 'auto')).toBe('gemini');
            expect(modelFamily('groq', '')).toBe('groq');
        });
    });

    describe('P1-6 claim-centric evidence', () => {
        it('synthesize attaches evidenceRefs aligned 1:1 with keyFindings', () => {
            const claims: ResearchClaim[] = [
                { id: 'c1', text: 'A is true', sourceId: 's1', confidence: 0.9, contradictions: [], timestamp: 0 },
                { id: 'c2', text: 'B is true', sourceId: 's2', confidence: 0.7, contradictions: [], timestamp: 0 },
            ];
            const s = synthesize(claims, 'Q');
            expect(s.keyFindings).toEqual(['A is true', 'B is true']);
            expect(s.evidenceRefs).toHaveLength(2);
            expect(s.evidenceRefs?.[0]).toMatchObject({ claimId: 'c1', sourceId: 's1' });
            expect(s.evidenceRefs?.[1]).toMatchObject({ claimId: 'c2', sourceId: 's2' });
        });

        it('drops low-confidence/contradicted claims from findings and evidence', () => {
            const claims: ResearchClaim[] = [
                { id: 'c1', text: 'A is true', sourceId: 's1', confidence: 0.2, contradictions: [], timestamp: 0 },
                { id: 'c2', text: 'B is true', sourceId: 's2', confidence: 0.9, contradictions: ['c1'], timestamp: 0 },
            ];
            const s = synthesize(claims, 'Q');
            expect(s.keyFindings).toEqual([]);
            expect(s.evidenceRefs).toHaveLength(0);
        });
    });

    describe('P0-4 masking', () => {
        it('sanitizeObject redacts secret-named fields and API keys', () => {
            const out = sanitizeObject({
                token: 'sk-or-v1-1234567890abcdefghijklmnopqrst',
                apiKey: 'AIzaSy1234567890abcdefghijklmnopqrstuvwxyz',
                ok: 'visible',
            }) as Record<string, string>;
            expect(out.token).toBe('[REDACTED]');
            expect(out.apiKey).toBe('[REDACTED]');
            expect(out.ok).toBe('visible');
        });

        it('sanitizeObject masks key-shaped strings inside plain text', () => {
            const out = sanitizeObject('use key sk-or-v1-1234567890abcdefghijklmnopqrst here');
            expect(String(out)).not.toContain('sk-or-v1');
        });
    });
});
