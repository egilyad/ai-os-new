/**
 * Phase 63 — Simulation Engine (Simulation Lab).
 *
 * Registers (additive):
 *   - simulationEngineService (parallel ticks over WorldState, stub act port)
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { IWorldStateService } from '../contracts/simulation-world';
import { SimulationEngineService } from '../services/simulation/simulation-engine-service';

export const registerPhase63: Phase = ({ register }) => {
    register('simulationEngineService', (c: IContainer) => new SimulationEngineService({
        worldState: c.get<IWorldStateService>('worldStateService'),
        events: c.get<IEventBus>('eventBus'),
    }));
};
