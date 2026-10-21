/**
 * AssistantNavigationService — the assistant's way to drive the interface.
 *
 * The kernel does not navigate: the UI owns the router. The assistant asks
 * for a route, the UI opens it and confirms — the assistant only reports a
 * navigation when the UI confirmed it. Without the confirmation it must say
 * "requested", not "opened".
 *
 * Same pattern as the approval channel: the kernel waits, the UI answers.
 */
import type { AssistantNavigationRequest } from '../../contracts/assistant';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('AssistantNav');

const DEFAULT_TIMEOUT_MS = 15_000;

interface Pending {
    request: AssistantNavigationRequest;
    settle: (ok: boolean) => void;
    timer: ReturnType<typeof setTimeout>;
}

export class AssistantNavigationService {
    private pending = new Map<string, Pending>();
    private counter = 0;

    constructor(private readonly deps: { eventBus: IEventBus }) {}

    /** Ask the UI to open a route. Resolves true when the UI confirmed. */
    async open(
        route: string,
        reason: string,
        params?: Record<string, unknown>,
        timeoutMs = DEFAULT_TIMEOUT_MS,
    ): Promise<boolean> {
        const now = Date.now();
        const request: AssistantNavigationRequest = {
            id: `nav-${now}-${++this.counter}`,
            route,
            params,
            reason,
            createdAt: now,
        };

        const confirmed = await new Promise<boolean>((resolve) => {
            const timer = setTimeout(() => {
                this.pending.delete(request.id);
                LOGGER.warn('AssistantNav', 'navigation not confirmed — treating as failed', {
                    route,
                });
                resolve(false);
            }, timeoutMs);
            this.pending.set(request.id, { request, settle: resolve, timer });
        });

        this.deps.eventBus.emit(EVENTS.ASSISTANT_NAVIGATION_RESOLVED, {
            id: request.id,
            route,
            confirmed,
        });
        return confirmed;
    }

    /** The UI calls this after it actually navigated. */
    confirm(id: string): boolean {
        const entry = this.pending.get(id);
        if (!entry) return false;
        clearTimeout(entry.timer);
        this.pending.delete(id);
        entry.settle(true);
        return true;
    }

    listPending(): AssistantNavigationRequest[] {
        return [...this.pending.values()].map((p) => p.request);
    }

    destroy(): void {
        for (const [, entry] of this.pending) {
            clearTimeout(entry.timer);
            entry.settle(false);
        }
        this.pending.clear();
    }
}
