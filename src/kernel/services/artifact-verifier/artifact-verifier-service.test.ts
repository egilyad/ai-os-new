import { describe, it, expect, vi } from 'vitest';
import { ArtifactVerifierService } from './artifact-verifier-service';

describe('ArtifactVerifierService', () => {
    it('passes a clean artifact with expected keywords (heuristic)', async () => {
        const svc = new ArtifactVerifierService();
        const result = await svc.verify({
            task: 'Implement auth',
            output: 'Implemented token-based authentication with refresh rotation.',
            expectedOutput: 'token authentication refresh',
        });
        expect(result.verdict).toBe('pass');
        expect(result.via).toBe('heuristic');
        expect(result.checks.nonEmpty).toBe(true);
    });

    it('rejects empty output', async () => {
        const svc = new ArtifactVerifierService();
        const result = await svc.verify({ task: 'x', output: '   ' });
        expect(result.verdict).toBe('reject');
        expect(result.score).toBe(0);
    });

    it('rejects output with error markers', async () => {
        const svc = new ArtifactVerifierService();
        const result = await svc.verify({ task: 'x', output: 'TODO: implement later' });
        expect(result.verdict).toBe('reject');
        expect(result.checks.noErrorMarkers).toBe(false);
    });

    it('uses LLM judge when deterministic checks fail', async () => {
        const judge = vi.fn(async () => ({
            score: 0.8,
            passed: true,
            reasoning: 'semantically equivalent',
            via: 'llm' as const,
        }));
        const svc = new ArtifactVerifierService({ judge });
        const result = await svc.verify({
            task: 'x',
            output: 'TODO: revisit',
            expectedOutput: 'completely other words',
        });
        expect(judge).toHaveBeenCalled();
        expect(result.verdict).toBe('pass');
        expect(result.via).toBe('llm');
    });

    it('falls back to heuristic verdict when judge throws', async () => {
        const judge = vi.fn(async () => {
            throw new Error('judge down');
        });
        const svc = new ArtifactVerifierService({ judge });
        const result = await svc.verify({ task: 'x', output: 'ERROR: partial work' });
        expect(result.via).toBe('heuristic');
        expect(result.reasoning).toContain('judge failed');
    });
});
