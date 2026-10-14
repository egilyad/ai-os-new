import { describe, it, expect, vi } from 'vitest';
import { ToolService } from './tool-executor';
import { EVENTS } from '../events/event-names';

function makeService() {
    const kv = new Map<string, unknown>();
    return new ToolService({
        eventBus: {
            emit: vi.fn(),
            emitOnce: vi.fn(() => true),
        },
        database: {
            getKv: async <T,>(id: string): Promise<T | null> =>
                (kv.has(id) ? (kv.get(id) as T) : null),
            setKv: async <T,>(id: string, value: T): Promise<void> => {
                kv.set(id, value);
            },
        },
    });
}

describe('ToolService unimplemented tools (P-CRIT-4)', () => {
    it.each(['t-read-file', 't-list-files', 't-summarize', 't-translate', 't-web-search', 't-api-call'])(
        '%s fails loud instead of fabricating success',
        async (toolId) => {
            const svc = makeService();
            const res = await svc.execute(toolId, {});
            expect(res.status).toBe('error');
            expect(res.error).toMatch(/not implemented/i);
        },
    );

    it('t-web denies by default until domains are allow-listed (M-3)', async () => {
        const svc = makeService();
        const res = await svc.execute('t-web', { url: 'https://example.com/data' });
        expect(res.status).toBe('error');
        expect(res.error).toMatch(/no allowed domains/i);
    });

    it('records unknown-tool throws as error with reason', async () => {
        const svc = makeService();
        await expect(svc.execute('no-such-tool', { a: 1 })).rejects.toThrow(/not found/i);
        const hist = svc.getExecutionHistory('no-such-tool');
        expect(hist).toHaveLength(1);
        expect(hist[0]!.status).toBe('error');
        expect(hist[0]!.reason).toBe('NOT_FOUND');
    });

    it('records disabled-tool throws as denied', async () => {
        const svc = makeService();
        await svc.updateTool('t-code', { enabled: false });
        await expect(svc.execute('t-code', {})).rejects.toThrow(/disabled/i);
        const hist = svc.getExecutionHistory('t-code');
        expect(hist).toHaveLength(1);
        expect(hist[0]!.status).toBe('denied');
        expect(hist[0]!.reason).toMatch(/disabled/i);
    });

    it('does not emit success events for unimplemented tools', async () => {        const emit = vi.fn();
        const svc = new ToolService({
            eventBus: { emit, emitOnce: vi.fn(() => true) },
            database: {
                getKv: async (): Promise<null> => null,
                setKv: async (): Promise<void> => {},
            },
        });
        const res = await svc.execute('t-read-file', {});
        expect(res.status).toBe('error');
        const successCalls = emit.mock.calls.filter((c) => c[0] === EVENTS.TOOL_EXECUTION_SUCCESS);
        expect(successCalls).toHaveLength(0);
    });
});

describe('ToolService P1 durable trail (shared sink, no parallel journal)', () => {
    function makeSharedService(kv: Map<string, unknown>) {
        return new ToolService({
            eventBus: { emit: vi.fn(), emitOnce: vi.fn(() => true) },
            database: {
                getKv: async <T,>(id: string): Promise<T | null> =>
                    (kv.has(id) ? (kv.get(id) as T) : null),
                setKv: async <T,>(id: string, value: T): Promise<void> => {
                    kv.set(id, value);
                },
            },
        });
    }

    it('records external success with linkage and restores it after reload', async () => {
        const kv = new Map<string, unknown>();
        const svc = makeSharedService(kv);
        await svc.init();
        await svc.recordExternalExecution({
            toolId: 'runner.math',
            input: { expr: '2+2' },
            output: '4',
            status: 'success',
            link: { agentId: 'a1', runId: 'run-9', taskId: 'task-3' },
            duration: 5,
        });
        const reloaded = makeSharedService(kv);
        await reloaded.init();
        const hist = reloaded.getExecutionHistory('runner.math');
        expect(hist).toHaveLength(1);
        expect(hist[0]!.status).toBe('success');
        expect(hist[0]!.output).toBe('4');
        expect(hist[0]!.link).toMatchObject({ agentId: 'a1', runId: 'run-9', taskId: 'task-3' });
    });

    it('records external denials with reason', async () => {
        const svc = makeService();
        await svc.recordExternalExecution({
            toolId: 'computer.use',
            status: 'denied',
            reason: 'blocked by approval policy',
            link: { agentId: 'a1' },
        });
        const hist = svc.getExecutionHistory('computer.use');
        expect(hist).toHaveLength(1);
        expect(hist[0]!.status).toBe('denied');
        expect(hist[0]!.reason).toBe('blocked by approval policy');
    });

    it('caps mixed own+external history newest-first', async () => {
        const svc = makeService();
        for (let i = 0; i < 210; i++) {
            await svc.recordExternalExecution({ toolId: `ext.${i}`, status: 'success' });
        }
        const hist = svc.getExecutionHistory();
        expect(hist).toHaveLength(200);
        expect(hist[0]!.toolId).toBe('ext.209');
    });

    it('keeps both instances rows: load-then-record never clobbers', async () => {
        const kv = new Map<string, unknown>();
        const first = makeSharedService(kv);
        await first.init();
        await first.recordExternalExecution({ toolId: 'a', status: 'success' });
        // Second instance loads first (merge path), then records: no loss.
        const second = makeSharedService(kv);
        await second.init();
        await second.recordExternalExecution({ toolId: 'b', status: 'success' });
        const third = makeSharedService(kv);
        await third.init();
        const hist = third.getExecutionHistory();
        expect(hist).toHaveLength(2);
        expect(hist[0]!.toolId).toBe('b');
        expect(hist[1]!.toolId).toBe('a');
        expect(new Set(hist.map((e) => e.id)).size).toBe(2);
    });

    it('mints unique ids for rapid records', async () => {
        const svc = makeService();
        await svc.recordExternalExecution({ toolId: 'x', status: 'success' });
        await svc.recordExternalExecution({ toolId: 'x', status: 'success' });
        const hist = svc.getExecutionHistory('x');
        expect(hist[0]!.id).not.toBe(hist[1]!.id);
        expect(hist[0]!.id.startsWith('exec-')).toBe(true);
    });

    it('truncates base64-heavy payloads instead of bloating KV', async () => {
        const svc = makeService();
        await svc.recordExternalExecution({
            toolId: 'shot',
            output: 'A'.repeat(9000),
            status: 'success',
        });
        const hist = svc.getExecutionHistory('shot');
        const out = String(hist[0]!.output);
        expect(out.length).toBeLessThan(9000);
        expect(out).toContain('[truncated');
    });
});
