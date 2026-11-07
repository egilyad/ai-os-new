import { describe, it, expect, vi } from 'vitest';
import { TraceService } from './trace-service';
import type { ExecutionTrace } from '../contracts/observability';

function trace(id: string, partial: Partial<ExecutionTrace> = {}): ExecutionTrace {
    return {
        id,
        startTime: 1000,
        input: 'hello',
        status: 'completed',
        steps: [{ id: 's1', nodeId: 'n1', label: 'step', status: 'done', timestamp: 1001 }],
        provider: 'openrouter',
        model: 'gpt-4o',
        totalTokens: 10,
        ...partial,
    };
}

function makeService() {
    const eventBus = { on: vi.fn(() => () => {}), onSafe: vi.fn(() => () => {}), emit: vi.fn() };
    const svc = new TraceService({ eventBus, database: {} as never });
    return { svc, eventBus };
}

describe('TraceService', () => {
    it('addTrace appends and getTraces returns it', () => {
        const { svc } = makeService();
        svc.addTrace(trace('t1'));
        expect(svc.getTraces()).toHaveLength(1);
        expect(svc.getTrace('t1')?.provider).toBe('openrouter');
    });

    it('addTrace replaces an existing trace with the same id', () => {
        const { svc } = makeService();
        svc.addTrace(trace('t1', { status: 'running' }));
        svc.addTrace(trace('t1', { status: 'completed', output: 'ok' }));
        expect(svc.getTraces()).toHaveLength(1);
        expect(svc.getTrace('t1')?.status).toBe('completed');
        expect(svc.getTrace('t1')?.output).toBe('ok');
    });

    it('getFilteredTraces filters by status, provider and search', () => {
        const { svc } = makeService();
        svc.addTrace(trace('t1', { status: 'completed', provider: 'openrouter', input: 'alpha' }));
        svc.addTrace(trace('t2', { status: 'failed', provider: 'gemini', input: 'beta' }));
        expect(svc.getFilteredTraces({ status: 'completed' })).toHaveLength(1);
        expect(svc.getFilteredTraces({ provider: 'gemini' })).toHaveLength(1);
        expect(svc.getFilteredTraces({ search: 'alpha' })).toHaveLength(1);
    });

    it('getTraceStats computes totals and success rate', () => {
        const { svc } = makeService();
        svc.addTrace(trace('t1', { status: 'completed', startTime: 1000, endTime: 3000 }));
        svc.addTrace(trace('t2', { status: 'failed', startTime: 2000 }));
        svc.addTrace(trace('t3', { status: 'running', startTime: 3000 }));
        const stats = svc.getTraceStats();
        expect(stats.total).toBe(3);
        expect(stats.completed).toBe(1);
        expect(stats.failed).toBe(1);
        expect(stats.running).toBe(1);
        expect(stats.successRate).toBeCloseTo(1 / 3);
        expect(stats.avgDuration).toBe(2000);
    });
});
