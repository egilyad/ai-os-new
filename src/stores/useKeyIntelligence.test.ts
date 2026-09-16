import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockEventBus, mockRuntime, mockRootLogger, emit } = vi.hoisted(() => {
    const handlers = new Map<string, Array<(data: unknown) => void>>();
    const subscribe = (event: string, cb: (data: unknown) => void) => {
        const list = handlers.get(event) ?? [];
        list.push(cb);
        handlers.set(event, list);
        return () => {
            const current = handlers.get(event);
            if (!current) return;
            const i = current.indexOf(cb);
            if (i >= 0) current.splice(i, 1);
        };
    };
    const emit = vi.fn((event: string, data: unknown) => {
        (handlers.get(event) ?? []).forEach((cb) => cb(data));
    });
    const mockRuntime = {
        getService: vi.fn(),
    };
    const mockRootLogger = {
        error: vi.fn(),
    };
    return {
        mockEventBus: { on: subscribe, onSafe: subscribe, emit },
        mockRuntime,
        mockRootLogger,
        emit,
    };
});

vi.mock('../kernel/runtime', () => ({ runtime: mockRuntime }));
vi.mock('../kernel/events/event-bus', () => ({ eventBus: mockEventBus }));
vi.mock('../kernel/instances', () => ({ rootLogger: mockRootLogger }));

import { useKeyIntelligence } from './useKeyIntelligence';
import { EVENTS } from '../kernel/events/event-names';

const makeInput = () => ({ rawText: 'paste me' });

const makeReport = () => ({
    analyzed: 1,
    added: 1,
    updated: 0,
    skipped: 0,
    invalid: 0,
});

describe('useKeyIntelligence', () => {
    beforeEach(() => {
        emit.mockClear();
        mockRuntime.getService.mockClear();
        mockRootLogger.error.mockClear();
    });

    it('initializes with no report, not loading, no error', () => {
        const { result } = renderHook(() => useKeyIntelligence());
        expect(result.current.report).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('');
    });

    it('runs the pipeline and stores the report', async () => {
        const pipeline = { run: vi.fn(async () => makeReport()) };
        mockRuntime.getService.mockReturnValue(pipeline);
        const { result } = renderHook(() => useKeyIntelligence());
        await act(async () => {
            await result.current.runPipeline(makeInput());
        });
        expect(mockRuntime.getService).toHaveBeenCalledWith('keyIntelligencePipeline');
        expect(pipeline.run).toHaveBeenCalledWith(makeInput());
        expect(result.current.report).toEqual(makeReport());
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('');
    });

    it('sets loading true while running and false afterwards', async () => {
        let resolve!: (r: unknown) => void;
        const pipeline = {
            run: vi.fn(() => new Promise((res) => (resolve = res))),
        };
        mockRuntime.getService.mockReturnValue(pipeline);
        const { result } = renderHook(() => useKeyIntelligence());
        let promise: Promise<void>;
        act(() => {
            promise = result.current.runPipeline(makeInput());
        });
        expect(result.current.loading).toBe(true);
        await act(async () => {
            resolve(makeReport());
            await promise;
        });
        expect(result.current.loading).toBe(false);
    });

    it('sets error and emits pipeline error event on failure', async () => {
        const pipeline = { run: vi.fn(async () => Promise.reject(new Error('boom'))) };
        mockRuntime.getService.mockReturnValue(pipeline);
        const { result } = renderHook(() => useKeyIntelligence());
        await act(async () => {
            await result.current.runPipeline(makeInput());
        });
        expect(result.current.error).toBe('boom');
        expect(emit).toHaveBeenCalledWith(EVENTS.KEY_INTELLIGENCE_PIPELINE_ERROR, {
            message: 'boom',
            input: makeInput(),
        });
        expect(mockRootLogger.error).toHaveBeenCalled();
    });

    it('uses a fallback message for non-Error failures', async () => {
        const pipeline = { run: vi.fn(async () => Promise.reject('string-failure')) };
        mockRuntime.getService.mockReturnValue(pipeline);
        const { result } = renderHook(() => useKeyIntelligence());
        await act(async () => {
            await result.current.runPipeline(makeInput());
        });
        expect(result.current.error).toBe('Pipeline execution failed');
    });

    it('reset clears report, loading and error', async () => {
        const pipeline = { run: vi.fn(async () => makeReport()) };
        mockRuntime.getService.mockReturnValue(pipeline);
        const { result } = renderHook(() => useKeyIntelligence());
        await act(async () => {
            await result.current.runPipeline(makeInput());
        });
        act(() => {
            result.current.reset();
        });
        expect(result.current.report).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('');
    });

    it('ignores late resolution after unmount', async () => {
        let resolve!: (r: unknown) => void;
        const pipeline = { run: vi.fn(() => new Promise((res) => (resolve = res))) };
        mockRuntime.getService.mockReturnValue(pipeline);
        const { result, unmount } = renderHook(() => useKeyIntelligence());
        let promise: Promise<void>;
        act(() => {
            promise = result.current.runPipeline(makeInput());
        });
        unmount();
        await act(async () => {
            resolve(makeReport());
            await promise.catch(() => {});
        });
        expect(result.current.report).toBeNull();
    });
});
