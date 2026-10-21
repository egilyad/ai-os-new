import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToolApprovalService } from './tool-approval-service';
import { EVENTS } from '../../events/event-names';

function fakeBus() {
    const handlers = new Map<string, Array<(data: unknown) => void>>();
    return {
        on: (event: string, cb: (data: unknown) => void) => {
            const list = handlers.get(event) ?? [];
            list.push(cb);
            handlers.set(event, list);
            return () => {
                const current = handlers.get(event) ?? [];
                handlers.set(
                    event,
                    current.filter((h) => h !== cb),
                );
            };
        },
        off: () => {},
        onSafe: (event: string, cb: (data: unknown) => void) => {
            const list = handlers.get(event) ?? [];
            list.push(cb);
            handlers.set(event, list);
            return () => {};
        },
        emit: vi.fn((event: string, data?: unknown) => {
            for (const cb of handlers.get(event) ?? []) cb(data);
        }),
        subscribeAll: () => () => {},
        getSubscriptionStats: () => ({ totalCallbacks: 0, perEvent: {} }),
    };
}

describe('ToolApprovalService', () => {
    let bus: ReturnType<typeof fakeBus>;
    let svc: ToolApprovalService;

    beforeEach(() => {
        bus = fakeBus();
        svc = new ToolApprovalService({ eventBus: bus as never });
        // A human is watching (the UI announces itself on mount).
        svc.setAttended(true);
    });

    afterEach(() => {
        svc.destroy();
    });

    it('publishes the request and resolves when a human allows it', async () => {
        const pending = svc.request({
            toolId: 't-delete-file',
            agentId: 'agent-1',
            action: 'tool:exec',
            reason: 'Удалить файл?',
            input: { path: 'a.txt' },
        });

        // The question must be visible while it is open.
        expect(bus.emit).toHaveBeenCalledWith(
            EVENTS.TOOL_APPROVAL_REQUESTED,
            expect.objectContaining({ toolId: 't-delete-file', agentId: 'agent-1' }),
        );
        expect(svc.listPending()).toHaveLength(1);

        const id = svc.listPending()[0]!.id;
        expect(svc.resolve(id, 'allow')).toBe(true);

        await expect(pending).resolves.toBe('allow');
        expect(svc.listPending()).toHaveLength(0);
    });

    it('denies when a human rejects', async () => {
        const pending = svc.request({ toolId: 't-web', reason: 'Отправить запрос?' });
        const id = svc.listPending()[0]!.id;
        svc.resolve(id, 'deny');
        await expect(pending).resolves.toBe('deny');
    });

    it('fails closed on timeout', async () => {
        vi.useFakeTimers();
        try {
            const pending = svc.request({
                toolId: 't-code',
                reason: 'Выполнить?',
                timeoutMs: 1000,
            });
            vi.advanceTimersByTime(1100);
            await expect(pending).resolves.toBe('deny');
        } finally {
            vi.useRealTimers();
        }
    });

    it('denies everything still open on destroy', async () => {
        const pending = svc.request({ toolId: 't-code', reason: '?' });
        svc.destroy();
        await expect(pending).resolves.toBe('deny');
    });

    it('ignores an unknown id', () => {
        expect(svc.resolve('nope', 'allow')).toBe(false);
    });

    it('denies immediately when nobody is attending', async () => {
        svc.setAttended(false);
        await expect(svc.request({ toolId: 't-code', reason: '?' })).resolves.toBe('deny');
        expect(svc.listPending()).toHaveLength(0);
    });
});
