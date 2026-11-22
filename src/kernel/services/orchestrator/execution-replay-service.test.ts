import { describe, it, expect } from 'vitest';
import { ExecutionReplayService } from './execution-replay-service';

const steps = [
    { nodeId: 'a', input: { q: 1 }, output: { result: 'x' }, timestamp: 100 },
    { nodeId: 'b', input: { result: 'x' }, output: { result: 'y' }, timestamp: 150 },
    { nodeId: 'c', input: { dropped: true }, output: { result: 'z' }, timestamp: 200 },
];

describe('ExecutionReplayService', () => {
    it('reports duration and all steps', () => {
        const r = new ExecutionReplayService().replay(steps);
        expect(r.steps).toHaveLength(3);
        expect(r.durationMs).toBe(100);
    });

    it('detects a broken hand-off link', () => {
        const r = new ExecutionReplayService().replay(steps);
        expect(r.brokenLinks).toEqual(['b → c']);
    });

    it('rebuilds the expected input from the previous output', () => {
        const svc = new ExecutionReplayService();
        expect(svc.chainInput(steps, 1)).toEqual({ result: 'x' });
        expect(svc.chainInput(steps, 0)).toEqual({});
    });
});
