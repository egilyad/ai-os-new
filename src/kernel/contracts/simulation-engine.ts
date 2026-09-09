/**
 * Simulation Engine contracts — Phase 63.
 *
 * Additive over WorldStateService. Parallel ticks (Promise.all) like TinyWorld parallel step.
 * Real agent act = PROVIDER-PENDING until AgentFactory wired; stub acts idle/move.
 */

import type { ILifecycle } from './lifecycle';
import type { SimulationWorld } from './simulation-world';

export interface AgentAct {
    agentId: string;
    action: 'idle' | 'move' | 'talk' | 'custom';
    targetRoomId?: string;
    message?: string;
    meta?: Record<string, unknown>;
}

export interface IAgentActPort {
    act(agentId: string, worldId: string, tick: number, world: SimulationWorld): Promise<AgentAct>;
}

export interface ISimulationEngineService extends ILifecycle {
    /** Run N ticks (parallel agents per tick). Emits sim:tick each tick + sim:completed at end. */
    run(worldId: string, ticks: number, opts?: { parallel?: boolean }): Promise<SimulationWorld>;
    /** Single tick (parallel). */
    step(worldId: string): Promise<{ world: SimulationWorld; acts: AgentAct[] }>;
    /** Status */
    status(worldId: string): Promise<{ tick: number; running: boolean } | null>;
}
