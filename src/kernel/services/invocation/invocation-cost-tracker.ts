import type { IEventBus, IDatabaseService } from '../../types/interfaces';
import type { ICostCalculator } from '../../contracts/pricing';
import { EVENTS } from '../../events/event-names';
import type { InvocationCostRecord } from '../../types/invocation-types';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('InvocationCostTracker');

export interface InvocationCostTrackerDeps {
    eventBus: IEventBus;
    costCalculator: ICostCalculator;
    database: IDatabaseService;
}

/**
 * Cost-attribution Phase 1 bridge.
 *
 * A pure observer over the existing `chat:stream:end` event (no new bus or
 * adapter). When a streamed turn carries an `invocationId` — injected by
 * `ChatExecutor` from request metadata and threaded through the ConversationCore
 * chain by the Invocation Engine — its cost is accumulated into the
 * `invocationCosts` Dexie table, keyed by `invocationId`.
 *
 * This links per-turn LLM spend to the invocation that produced it, enabling
 * per-invocation cost UX (Phase 2) without touching the execution path.
 */
export class InvocationCostTracker {
    private unsubs: Array<() => void> = [];

    constructor(private readonly deps: InvocationCostTrackerDeps) {
        this.subscribe();
    }

    private subscribe(): void {
        this.unsubs.push(
            this.deps.eventBus.onSafe<{
                requestId?: string;
                model?: string;
                tokens?: number;
                inputTokens?: number;
                outputTokens?: number;
                agentId?: string;
                invocationId?: string;
            }>(EVENTS.STREAM_END, (d) => {
                if (!d.invocationId || !d.model) return;
                const input = d.inputTokens ?? Math.round((d.tokens || 0) * 0.3);
                const output = d.outputTokens ?? Math.round((d.tokens || 0) * 0.7);
                const cost = this.deps.costCalculator.calculateCost(d.model, input, output);
                void this.record(d.invocationId, cost);
            }),
        );
    }

    private async record(invocationId: string, cost: number): Promise<void> {
        try {
            const table = this.deps.database.invocationCosts;
            const existing = await table.get(invocationId);
            const now = Date.now();
            if (existing) {
                await table.put({
                    invocationId,
                    accumulatedCost: existing.accumulatedCost + cost,
                    turnCount: existing.turnCount + 1,
                    firstSeenAt: existing.firstSeenAt,
                    updatedAt: now,
                });
            } else {
                const row: InvocationCostRecord = {
                    invocationId,
                    accumulatedCost: cost,
                    turnCount: 1,
                    firstSeenAt: now,
                    updatedAt: now,
                };
                await table.put(row);
            }
        } catch (e) {
            LOGGER.warn('InvocationCostTracker', 'Failed to record invocation cost', { error: e });
        }
    }

    /** Read the accumulated cost for an invocation (Phase 2 UX). */
    getCost(invocationId: string): Promise<InvocationCostRecord | undefined> {
        return this.deps.database.invocationCosts.get(invocationId);
    }

    /** All accumulated per-invocation costs keyed by invocationId (Phase 2 UX). */
    async getAllCosts(): Promise<Record<string, number>> {
        try {
            const rows = await this.deps.database.invocationCosts.toArray();
            const map: Record<string, number> = {};
            for (const r of rows) map[r.invocationId] = r.accumulatedCost;
            return map;
        } catch (e) {
            LOGGER.warn('InvocationCostTracker', 'Failed to read invocation costs', { error: e });
            return {};
        }
    }

    destroy(): void {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
    }
}
