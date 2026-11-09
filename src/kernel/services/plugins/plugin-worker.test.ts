import { describe, expect, it, vi, afterEach } from 'vitest';
import { PluginWorkerClient } from './plugin-worker';

class FakeWorker {
    onmessage: ((e: { data: unknown }) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    postMessage = vi.fn((msg: unknown) => {
        const m = msg as { type: string; payload: { code: string } };
        queueMicrotask(() => {
            this.onmessage?.({
                data: {
                    requestId: (msg as { requestId: string }).requestId,
                    type: 'result',
                    payload: { result: m.payload.code.toUpperCase() },
                },
            });
        });
    });
    terminate = vi.fn();
}

let currentWorker: FakeWorker | null = null;

vi.stubGlobal(
    'Worker',
    function WorkerFake() {
        currentWorker = new FakeWorker();
        return currentWorker;
    } as unknown as typeof Worker,
);

afterEach(() => {
    currentWorker = null;
    vi.useRealTimers();
});

describe('PluginWorkerClient (SPEC_06 §3)', () => {
    it('выполняет код в воркере и возвращает результат', async () => {
        const client = new PluginWorkerClient();
        const result = await client.run({ code: 'return "hi"' });
        expect(result).toEqual({ result: 'RETURN "HI"' });
        client.destroy();
    });

    it('отклоняет при ошибке воркера', async () => {
        const client = new PluginWorkerClient();
        client.ensure();
        const original = currentWorker;
        original!.postMessage = vi.fn((msg: unknown) => {
            queueMicrotask(() => {
                original!.onmessage?.({
                    data: {
                        requestId: (msg as { requestId: string }).requestId,
                        type: 'error',
                        payload: { message: 'boom' },
                    },
                });
            });
        });
        await expect(client.run({ code: 'throw new Error("boom")' })).rejects.toThrow('boom');
        client.destroy();
    });

    it('destroy отклоняет pending и терминатует воркер', async () => {
        const client = new PluginWorkerClient();
        const p = client.run({ code: 'return 1', timeout: 50 });
        client.destroy();
        await expect(p).rejects.toThrow(/destroyed/);
        expect(currentWorker?.terminate).toHaveBeenCalled();
    });
});
