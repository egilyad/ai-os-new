import { eventBus } from '../events/event-bus';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
import type { TaskHandoffService } from './task-handoff';

const LOGGER = rootLogger.child('TaskExecutorDispatcher');

export interface HandoffInvokeRequest {
    source: 'module-event';
    caller: { kind: 'event'; id: string };
    target: { agentId: string };
    reason: string;
    context: { type: 'conversation'; ref: string };
    constraints?: { ttlMs?: number };
}

export interface TaskExecutorDispatcherDeps {
    handoff: TaskHandoffService;
    invoke?(req: HandoffInvokeRequest): Promise<{
        id: string;
        status: string;
        rejectionReason?: string;
    }>;
}

/**
 * M2.2 — subscribes to handoff initiation, accepts pending handoffs and — when
 * an invocation engine is wired — executes them for real: the accepted handoff
 * becomes an invocation (source=handoff), whose outcome closes the handoff
 * (completed/failed). This turns the delegation loop into an executed one:
 * `tasks.create` → handoff → executor pickup → invocation → result.
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
                    await this.executeHandoff(id);
                } catch (e) {
                    LOGGER.warn('TaskExecutorDispatcher', 'dispatch failed', {
                        id,
                        error: e,
                    });
                    await this.deps.handoff.fail(id, e instanceof Error ? e.message : String(e));
                }
            })();
        });
    }

    private async executeHandoff(id: string): Promise<void> {
        const invoice = this.deps.invoke;
        if (!invoice) return;
        const handoff = this.deps.handoff.getHandoffs().find((h) => h.id === id);
        if (!handoff) return;
        try {
            const res = await invoice({
                source: 'module-event',
                caller: { kind: 'event', id: handoff.fromAgent },
                target: { agentId: handoff.toAgent },
                reason: handoff.description,
                context: { type: 'conversation', ref: id },
                constraints: handoff.deadline
                    ? { ttlMs: handoff.deadline - Date.now() }
                    : undefined,
            });
            if (res.status === 'rejected' || res.rejectionReason) {
                await this.deps.handoff.fail(id, res.rejectionReason ?? res.status);
            } else {
                await this.deps.handoff.complete(id, `invocation ${res.id} (${res.status})`);
            }
        } catch (e) {
            await this.deps.handoff.fail(id, e instanceof Error ? e.message : String(e));
        }
    }

    stop(): void {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
    }

    destroy(): void {
        this.stop();
    }
}
