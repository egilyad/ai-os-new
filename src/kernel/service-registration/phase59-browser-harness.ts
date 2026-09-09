/**
 * Phase 59 — Browser Harness (GAP G6, STATIC GAP CLOSURE).
 *
 * Registers (additive, no migration):
 *   - browserHarnessService (hardened schemas + handoff artifact over ComputerService)
 *
 * Real browser execution = BLOCKED-RUNTIME (handoff).
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { IComputerService } from '../contracts/rivals5';
import { BrowserHarnessService } from '../services/browser/browser-harness-service';

export const registerPhase59: Phase = ({ register }) => {
    register('browserHarnessService', (c: IContainer) => {
        return new BrowserHarnessService({
            dal: c.get<DataAccessLayer>('dal'),
            computer: c.get<IComputerService>('computerService'),
            events: c.get<IEventBus>('eventBus'),
        });
    });
};
