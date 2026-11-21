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

    it('compare: accepts a real score increase', () => {
        const svc = new ArtifactVerifierService();
        const r = svc.compare(
            { overall: 6, axes: { correctness: 6, clarity: 5 } },
            { overall: 7, axes: { correctness: 8, clarity: 5 } },
        );
        expect(r.outcome).toBe('ACCEPTED_SCORE_INCREASE');
        expect(r.revert).toBe(false);
        expect(r.deltas['correctness']).toBe(2);
    });

    it('compare: reverts when overall drops', () => {
        const svc = new ArtifactVerifierService();
        const r = svc.compare({ overall: 7 }, { overall: 5 });
        expect(r.outcome).toBe('REJECTED_SCORE_DECREASE');
        expect(r.revert).toBe(true);
    });

    it('compare: reverts on sub-axis degradation with unchanged overall', () => {
        const svc = new ArtifactVerifierService();
        const r = svc.compare(
            { overall: 7, axes: { correctness: 7, clarity: 7 } },
            { overall: 7, axes: { correctness: 8, clarity: 5 } },
        );
        expect(r.outcome).toBe('REJECTED_DEGRADATION');
        expect(r.revert).toBe(true);
        expect(r.totalDrop).toBe(2);
        expect(r.totalGain).toBe(1);
    });

    it('compare: accepts neutral-improvement when gains outweigh drops', () => {
        const svc = new ArtifactVerifierService();
        const r = svc.compare(
            { overall: 7, axes: { correctness: 7, clarity: 7 } },
            { overall: 7, axes: { correctness: 9, clarity: 7 } },
        );
        expect(r.outcome).toBe('ACCEPTED_NEUTRAL_IMPROVEMENT');
        expect(r.revert).toBe(false);
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
