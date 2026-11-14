import { describe, it, expect, vi } from 'vitest';
import { TaskExecutorDispatcher } from './task-executor-dispatcher';
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
});
