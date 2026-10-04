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
            getKv: vi.fn(async (id: string) => kv.get(id) ?? null),
            setKv: vi.fn(async (id: string, value: unknown) => {
                kv.set(id, value);
            }),
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

    it('does not emit success events for unimplemented tools', async () => {
        const emit = vi.fn();
        const svc = new ToolService({
            eventBus: { emit, emitOnce: vi.fn(() => true) },
            database: {
                getKv: vi.fn(async () => null),
                setKv: vi.fn(async () => {}),
            },
        });
        const res = await svc.execute('t-read-file', {});
        expect(res.status).toBe('error');
        const successCalls = emit.mock.calls.filter((c) => c[0] === EVENTS.TOOL_EXECUTION_SUCCESS);
        expect(successCalls).toHaveLength(0);
    });
});
