/**
 * Phase 79 — capability trust.
 *
 * Registers the honesty ledger: what the system claims it can do
 * (declared), what the code proves (discovered) and what was actually
 * executed and observed (verified).
 *
 * The assistant reads this ledger before it makes a claim to the operator.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import { CapabilityTrustService } from '../services/capability-trust/capability-trust-service';

export const registerPhase79: Phase = ({ register }) => {
    register('capabilityTrustService', (c: IContainer) => {
        return new CapabilityTrustService({
            eventBus: c.get<IEventBus>('eventBus'),
        });
    });
};
