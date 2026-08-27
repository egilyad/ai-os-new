/**
 * Phase 22 — Cost-attribution bridge (InvocationCostTracker).
 *
 * Registers `invocationCostTracker`: a pure observer over `chat:stream:end`
 * that accumulates per-invocation cost into the `invocationCosts` Dexie table
 * (added in Dexie v21). It depends on phase 1 (pricingService), phase 0
 * (eventBus) and the database registered by earlier phases.
 *
 * No new bus/adapter/facade — the tracker reuses the existing STREAM_END event
 * and the existing Dexie `invocationCosts` table. It is force-resolved at
 * startup so it begins listening immediately (it has no UI consumer yet, which
 * arrives in Phase 2).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus, IDatabaseService } from '../types/interfaces';
import type { ICostCalculator } from '../contracts/pricing';
import { InvocationCostTracker } from '../services/invocation/invocation-cost-tracker';

export const registerPhase22: Phase = ({ register, get }) => {
    register('invocationCostTracker', (c: IContainer) => {
        return new InvocationCostTracker({
            eventBus: c.get<IEventBus>('eventBus'),
            costCalculator: c.get<ICostCalculator>('pricingService'),
            database: c.get<IDatabaseService>('database'),
        });
    });
    // Force instantiation at startup so the tracker subscribes to STREAM_END.
    // Safe: eventBus, and database/pricingService are registered by earlier phases.
    void get('invocationCostTracker');
};
