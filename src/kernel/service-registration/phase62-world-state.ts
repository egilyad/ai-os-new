/**
 * Phase 62 — World State (Simulation Lab).
 *
 * Registers (additive, keyValue sim:world:<id>):
 *   - worldStateService (rooms 0..1000, relations, globalClock)
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import { WorldStateService } from '../services/simulation/world-state-service';

export const registerPhase62: Phase = ({ register }) => {
    register('worldStateService', (c: IContainer) => new WorldStateService({
        database: c.get<DatabaseService>('database'),
        events: c.get<IEventBus>('eventBus'),
    }));
};
