import { describe, it, expect, vi } from 'vitest';
import { TaskExecutorDispatcher, type HandoffInvokeRequest } from './task-executor-dispatcher';
import { eventBus } from '../events/event-bus';
import { EVENTS } from '../events/event-names';

describe('task-executor-dispatcher', () => {
    it('accepts handoffs when AGENT_HANDOFF_INITIATED fires', async () => {
        const accept = vi.fn(async () => undefined);
        const dispatcher = new TaskExecutorDispatcher({
            handoff: { accept } as never,
        });
        dispatcher.start();

        eventBus.emit(EVENTS.AGENT_HANDOFF_INITIATED, {
            id: 'handoff-1',
            fromAgent: 'assistant',
            toAgent: 'agent-research',
            description: 'x',
        });

        await new Promise((r) => setTimeout(r, 50));
        expect(accept).toHaveBeenCalledWith('handoff-1');
        dispatcher.stop();
    });

    it('executes accepted handoff via invocation engine and completes it', async () => {
        const complete = vi.fn(async () => undefined);
        const fail = vi.fn(async () => undefined);
        const handoffStub = {
            accept: vi.fn(async () => undefined),
            complete,
            fail,
            getHandoffs: () => [
                {
                    id: 'handoff-1',
                    fromAgent: 'assistant',
                    toAgent: 'agent-research',
                    description: 'x',
                    status: 'accepted',
                },
            ],
        } as never;
        const invoke = vi.fn(async (_req: HandoffInvokeRequest) => ({
            id: 'inv-1',
            status: 'done',
        }));
        const dispatcher = new TaskExecutorDispatcher({ handoff: handoffStub, invoke });
        dispatcher.start();

        eventBus.emit(EVENTS.AGENT_HANDOFF_INITIATED, {
            id: 'handoff-1',
            fromAgent: 'assistant',
            toAgent: 'agent-research',
            description: 'x',
        });

        await new Promise((r) => setTimeout(r, 50));
        expect(invoke).toHaveBeenCalledTimes(1);
        expect(invoke.mock.calls[0]?.[0]).toMatchObject({
            source: 'module-event',
            target: { agentId: 'agent-research' },
        });
        expect(complete).toHaveBeenCalledWith('handoff-1', expect.stringContaining('inv-1'));
        expect(fail).not.toHaveBeenCalled();
        dispatcher.stop();
    });

    it('fails handoff when invocation is rejected', async () => {
        const complete = vi.fn(async () => undefined);
        const fail = vi.fn(async () => undefined);
        const handoffStub = {
            accept: vi.fn(async () => undefined),
            complete,
            fail,
            getHandoffs: () => [
                {
                    id: 'handoff-2',
                    fromAgent: 'assistant',
                    toAgent: 'agent-research',
                    description: 'x',
                    status: 'accepted',
                },
            ],
        } as never;
        const invoke = vi.fn(async () => ({
            id: 'inv-2',
            status: 'rejected',
            rejectionReason: 'no budget',
        }));
        const dispatcher = new TaskExecutorDispatcher({ handoff: handoffStub, invoke });
        dispatcher.start();

        eventBus.emit(EVENTS.AGENT_HANDOFF_INITIATED, {
            id: 'handoff-2',
            fromAgent: 'assistant',
            toAgent: 'agent-research',
            description: 'x',
        });

        await new Promise((r) => setTimeout(r, 50));
        expect(fail).toHaveBeenCalledWith('handoff-2', 'no budget');
        expect(complete).not.toHaveBeenCalled();
        dispatcher.stop();
    });
});
