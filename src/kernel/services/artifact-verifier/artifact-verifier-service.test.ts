import { describe, it, expect, vi } from 'vitest';
import { ArtifactVerifierService } from './artifact-verifier-service';

describe('ArtifactVerifierService', () => {
    it('passes a clean artifact with expected keywords (heuristic)', async () => {
        const svc = new ArtifactVerifierService();
        const result = await svc.verify({
            task: 'Implement auth',
            output:
                'Implemented token-based authentication with refresh rotation. ' +
                'Access tokens expire in fifteen minutes while refresh tokens ' +
                'rotate on every use and revoke prior sessions immediately.',
            expectedOutput: 'token authentication refresh rotation expiry sessions',
        });
        expect(result.verdict).toBe('pass');
        expect(result.via).toBe('heuristic');
        expect(result.checks.nonEmpty).toBe(true);
    });

    it('does not pass on partial keyword overlap or stub-like output', async () => {
        const svc = new ArtifactVerifierService();
        const partial = await svc.verify({
            task: 'x',
            output: 'token authentication refresh done',
            expectedOutput: 'token authentication refresh rotation expiry validation',
        });
        expect(partial.verdict).not.toBe('pass');
        const stub = await svc.verify({ task: 'x', output: 'TODO: placeholder implementation' });
        expect(stub.verdict).toBe('reject');
        expect(stub.checks.substantive).toBe(false);
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
