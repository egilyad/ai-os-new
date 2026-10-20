import { describe, expect, it, vi } from 'vitest';
import { ToolPipeline, type ToolPipelineMiddleware } from './tool-pipeline';

describe('ToolPipeline', () => {
    it('allows when no middleware blocks', async () => {
        const pipeline = new ToolPipeline();
        const result = await pipeline.runPre({ toolId: 't-code', input: { a: 1 } });
        expect(result.decision).toBe('allow');
        expect(result.input).toEqual({ a: 1 });
    });

    it('short-circuits on deny', async () => {
        const second = vi.fn();
        const pipeline = new ToolPipeline([
            {
                id: 'blocker',
                pre: () => ({ kind: 'deny', reason: 'not allowed' }),
            },
            { id: 'second', pre: second },
        ]);
        const result = await pipeline.runPre({ toolId: 't-code', input: null });
        expect(result.decision).toBe('deny');
        expect(result.reason).toBe('not allowed');
        expect(result.blockedBy).toBe('blocker');
        expect(second).not.toHaveBeenCalled();
    });

    it('rewrites the input on replace', async () => {
        const pipeline = new ToolPipeline([
            { id: 'rewrite', pre: () => ({ kind: 'replace', input: { sanitized: true } }) },
        ]);
        const result = await pipeline.runPre({ toolId: 't-code', input: { raw: true } });
        expect(result.decision).toBe('allow');
        expect(result.input).toEqual({ sanitized: true });
    });

    it('turns ask into deny when no approval channel is available', async () => {
        const pipeline = new ToolPipeline([
            { id: 'gate', pre: () => ({ kind: 'ask', reason: 'needs approval' }) },
        ]);
        const result = await pipeline.runPre({ toolId: 't-web', input: null });
        expect(result.decision).toBe('deny');
        expect(result.reason).toContain('no approval channel');
    });

    it('resolves ask through the approval resolver', async () => {
        const pipeline = new ToolPipeline(
            [{ id: 'gate', pre: () => ({ kind: 'ask', reason: 'needs approval' }) }],
            { resolve: async () => 'allow' },
        );
        const result = await pipeline.runPre({ toolId: 't-web', input: null });
        expect(result.decision).toBe('allow');
    });

    it('denies when the approval resolver rejects', async () => {
        const pipeline = new ToolPipeline(
            [{ id: 'gate', pre: () => ({ kind: 'ask', reason: 'needs approval' }) }],
            { resolve: async () => 'deny' },
        );
        const result = await pipeline.runPre({ toolId: 't-web', input: null });
        expect(result.decision).toBe('deny');
        expect(result.reason).toContain('approval rejected');
    });

    it('replaces the output in the post phase', async () => {
        const pipeline = new ToolPipeline([
            { id: 'mask', post: () => ({ kind: 'replace', output: 'masked' }) },
        ]);
        const result = await pipeline.runPost(
            { toolId: 't-web', input: null },
            { status: 'success', data: 'secret', timestamp: 1 },
        );
        expect(result.data).toBe('masked');
    });

    it('enriches an object output', async () => {
        const pipeline = new ToolPipeline([
            { id: 'enrich', post: () => ({ kind: 'enrich', output: { meta: true } }) },
        ]);
        const result = await pipeline.runPost(
            { toolId: 't-web', input: null },
            { status: 'success', data: { value: 1 }, timestamp: 1 },
        );
        expect(result.data).toEqual({ value: 1, meta: true });
    });

    it('blocks the outcome in the post phase', async () => {
        const pipeline = new ToolPipeline([
            { id: 'guard', post: () => ({ kind: 'block', reason: 'policy violation' }) },
        ]);
        const result = await pipeline.runPost(
            { toolId: 't-web', input: null },
            { status: 'success', data: 'x', timestamp: 1 },
        );
        expect(result.status).toBe('error');
        expect(result.error).toBe('policy violation');
    });

    it('ignores duplicate middleware registrations', () => {
        const pipeline = new ToolPipeline();
        const middleware: ToolPipelineMiddleware = { id: 'same' };
        pipeline.use(middleware);
        pipeline.use(middleware);
        expect(pipeline.list()).toHaveLength(1);
    });
});
