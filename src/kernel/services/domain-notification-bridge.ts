import type { ILifecycle } from '../contracts/lifecycle';
import { EVENTS } from '../events/event-names';

interface DomainNotificationDeps {
    eventBus: {
        on(event: string, cb: (data?: unknown) => void): () => void;
        emit(event: string, data?: unknown): void;
    };
}

type NotificationType = 'success' | 'error' | 'info' | 'warning';

/** Reads domain events and turns the user-relevant ones into system notifications. */
export class DomainNotificationBridge implements ILifecycle {
    private unsubs: Array<() => void> = [];

    constructor(private deps: DomainNotificationDeps) {}

    async init(): Promise<void> {
        if (this.unsubs.length > 0) return;
        this.unsubs.push(
            this.deps.eventBus.on(EVENTS.DEBATE_SESSION_COMPLETED, (data) => {
                const payload = data as { sessionId?: unknown; error?: unknown } | undefined;
                const id = typeof payload?.sessionId === 'string' ? payload.sessionId : 'unknown';
                if (typeof payload?.error === 'string' && payload.error.length > 0) {
                    this.notify(
                        `Дебат ${id} завершён с ошибкой: ${payload.error.slice(0, 160)}`,
                        'error',
                        'debate',
                    );
                    return;
                }
                this.notify(`Дебат ${id} завершён`, 'success', 'debate');
            }),
            this.deps.eventBus.on(EVENTS.DEBATE_SESSION_FAILED, (data) => {
                const payload = data as { sessionId?: unknown; error?: unknown } | undefined;
                const id = typeof payload?.sessionId === 'string' ? payload.sessionId : 'unknown';
                const reason =
                    typeof payload?.error === 'string'
                        ? payload.error.slice(0, 160)
                        : 'причина не указана';
                this.notify(`Дебат ${id} прерван: ${reason}`, 'error', 'debate');
            }),
            this.deps.eventBus.on(EVENTS.CRYSTAL_REFUTED, (data) => {
                const payload = data as { crystalId?: unknown; reason?: unknown } | undefined;
                const id = typeof payload?.crystalId === 'string' ? payload.crystalId : 'unknown';
                const reason =
                    typeof payload?.reason === 'string'
                        ? payload.reason.slice(0, 160)
                        : 'без причины';
                this.notify(`Кристалл ${id} опровергнут: ${reason}`, 'warning', 'crystal');
            }),
            this.deps.eventBus.on(EVENTS.MEMORY_PROMOTED, (data) => {
                const payload = data as { memoryId?: unknown; tier?: unknown } | undefined;
                const id = typeof payload?.memoryId === 'string' ? payload.memoryId : 'unknown';
                const tier = typeof payload?.tier === 'string' ? payload.tier : 'долгосрочную';
                this.notify(`Память ${id} повышена до ${tier}`, 'info', 'memory');
            }),
        );
    }

    async destroy(): Promise<void> {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
    }

    private notify(message: string, type: NotificationType, source: string): void {
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, { message, type, source });
    }
}
