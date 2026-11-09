import { describe, it, expect, vi, afterEach } from 'vitest';
import { SandboxService } from './sandbox-service';

type ToolExecute = (toolId: string, input: unknown) => Promise<unknown>;

function makeService(overrides: { toolExecute?: ToolExecute } = {}) {
    const toolExecute: ToolExecute = overrides.toolExecute ?? (async () => '');
    return new SandboxService({
        toolService: { execute: toolExecute },
    });
}

type FakeBehavior = (msg: Record<string, unknown>, worker: FakeSandboxWorker) => unknown;

class FakeSandboxWorker {
    onmessage: ((e: { data: unknown }) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    postMessage = vi.fn((msg: Record<string, unknown>) => {
        queueMicrotask(() => {
            const next = behavior(msg, this);
            if (next !== undefined) this.onmessage?.({ data: next });
        });
    });
    terminate = vi.fn(() => {});
}

let behavior: FakeBehavior = () => undefined;

let workerClass: (typeof FakeSandboxWorker & { lastInstance: FakeSandboxWorker | null }) | null = null;

function stubWorker(b: FakeBehavior) {
    behavior = b;
    class WorkerFake extends FakeSandboxWorker {
        static lastInstance: FakeSandboxWorker | null = null;
        constructor() {
            super();
            WorkerFake.lastInstance = this;
        }
    }
    workerClass = WorkerFake as typeof FakeSandboxWorker & {
        lastInstance: FakeSandboxWorker | null;
    };
    vi.stubGlobal('Worker', WorkerFake as unknown as typeof Worker);
}

function lastSandboxWorker(): FakeSandboxWorker | null {
    return workerClass?.lastInstance ?? null;
}

function jsonResponse(body: string, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => body,
        body: null,
    } as unknown as Response;
}

describe('SandboxService.fetchUrl', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('rejects non-https URLs before any fetch', async () => {
        const svc = makeService();
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        await expect(svc.fetchUrl('http://example.com')).rejects.toThrow(/URL rejected/);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects private/local hosts (SSRF guard)', async () => {
        const svc = makeService();
        vi.stubGlobal('fetch', vi.fn());
        await expect(svc.fetchUrl('https://localhost:8080/x')).rejects.toThrow(/URL rejected/);
        await expect(svc.fetchUrl('https://127.0.0.1/x')).rejects.toThrow(/URL rejected/);
    });

    it('fetches an allowed https URL', async () => {
        const svc = makeService();
        const fetchMock = vi.fn(async () => jsonResponse('hello world'));
        vi.stubGlobal('fetch', fetchMock);
        await expect(svc.fetchUrl('https://api.example.com/data')).resolves.toBe('hello world');
    });

    it('throws on non-2xx responses', async () => {
        const svc = makeService();
        vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('oops', 500)));
        await expect(svc.fetchUrl('https://api.example.com/data')).rejects.toThrow(/HTTP 500/);
    });
});

describe('SandboxService.execute', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        workerClass = null;
    });

    it('resolves with the worker result', async () => {
        stubWorker(() => ({ type: 'result', result: 'done' }));
        const svc = makeService();
        await expect(svc.execute('return 1')).resolves.toBe('done');
        expect(lastSandboxWorker()?.terminate).toHaveBeenCalled();
    });

    it('rejects on worker error', async () => {
        stubWorker(() => ({ type: 'error', error: 'boom' }));
        const svc = makeService();
        await expect(svc.execute('throw')).rejects.toThrow(/boom/);
    });

    it('rejects on timeout', async () => {
        stubWorker(() => undefined);
        const svc = makeService();
        await expect(svc.execute('hang', {}, 10)).rejects.toThrow(/timed out/);
    });

    it('denies tool calls outside allowedTools', async () => {
        const toolExecute = vi.fn();
        stubWorker((msg) => {
            if (msg.code === 'USE_TOOL') {
                return {
                    type: 'cap_request',
                    requestId: 'r1',
                    method: 'executeTool',
                    params: { toolId: 'db.query', input: {} },
                };
            }
            if (msg.type === 'cap_response') {
                return { type: 'result', result: msg.error ?? 'after-tool' };
            }
            return undefined;
        });
        const svc = makeService({ toolExecute });
        await expect(svc.execute('USE_TOOL', {}, 100, ['other.tool'])).resolves.toBe(
            'Tool execution denied: db.query is not in allowedTools',
        );
        expect(toolExecute).not.toHaveBeenCalled();
    });

    it('executes allowed tool calls through toolService', async () => {
        const toolExecute = vi.fn(async () => 'tool-ok');
        stubWorker((msg) => {
            if (msg.code === 'USE_TOOL') {
                return {
                    type: 'cap_request',
                    requestId: 'r2',
                    method: 'executeTool',
                    params: { toolId: 'db.query', input: { q: 1 } },
                };
            }
            if (msg.type === 'cap_response') {
                return { type: 'result', result: msg.result ?? 'after-tool' };
            }
            return undefined;
        });
        const svc = makeService({ toolExecute });
        await expect(svc.execute('USE_TOOL', {}, 100, ['db.query'])).resolves.toBe('tool-ok');
        expect(toolExecute).toHaveBeenCalledWith('db.query', { q: 1 });
    });

    it('enforces the maximum tool execution count', async () => {
        const toolExecute = vi.fn(async () => 'ok');
        let calls = 0;
        stubWorker((msg) => {
            if (msg.code === 'USE_MANY_TOOLS') {
                calls = 0;
                return {
                    type: 'cap_request',
                    requestId: 'r-start',
                    method: 'executeTool',
                    params: { toolId: 'db.query', input: {} },
                };
            }
            if (msg.type === 'cap_response') {
                if (msg.error) return { type: 'result', result: msg.error };
                calls++;
                return {
                    type: 'cap_request',
                    requestId: `r-${calls}`,
                    method: 'executeTool',
                    params: { toolId: 'db.query', input: {} },
                };
            }
            return undefined;
        });
        const svc = makeService({ toolExecute });
        await expect(svc.execute('USE_MANY_TOOLS', {}, 500, ['db.query'])).resolves.toBe(
            'Rate limit exceeded: Sandbox allows maximum 10 tool calls',
        );
        expect(toolExecute).toHaveBeenCalledTimes(10);
    });
});
