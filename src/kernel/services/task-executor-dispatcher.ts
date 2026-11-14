import { eventBus } from '../events/event-bus';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
import type { TaskHandoffService } from './task-handoff';

const LOGGER = rootLogger.child('TaskExecutorDispatcher');

export interface TaskExecutorDispatcherDeps {
    handoff: TaskHandoffService;
}

/**
 * M2.2 — subscribes to handoff initiation and marks pending handoffs as
 * accepted the moment an executor is available. This closes the delegation
 * loop at the protocol level: `tasks.create` → handoff → executor pickup.
 */
export class TaskExecutorDispatcher {
    private unsubscribe?: () => void;

    constructor(private deps: TaskExecutorDispatcherDeps) {}

    start(): void {
        if (this.unsubscribe) return;
        this.unsubscribe = eventBus.on(EVENTS.AGENT_HANDOFF_INITIATED, (payload) => {
            const id = (payload as { id?: string })?.id;
            if (!id) return;
            void (async () => {
                try {
                    await this.deps.handoff.accept(id);
                    LOGGER.info('TaskExecutorDispatcher', 'handoff accepted', { id });
                } catch (e) {
                    LOGGER.warn('TaskExecutorDispatcher', 'accept failed', {
                        id,
                        error: e,
                    });
                }
            })();
        });
    }

    stop(): void {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
    }

    destroy(): void {
        this.stop();
    }
}
