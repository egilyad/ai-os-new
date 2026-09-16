/**
 * Simulation World contracts — Phase 62 (World State).
 *
 * Additive, keyValue: sim:world:<id> (no Dexie migration).
 * Coords 0..1000 like ComputerService, for SimulationPanel SVG.
 */

import type { ILifecycle } from './lifecycle';

export interface WorldRoom {
    id: string;
    name: string;
    x: number; // 0..1000
    y: number;
    w: number; // 1..1000
    h: number;
    agents: string[]; // agentIds in room
    props?: Record<string, unknown>;
}

export interface WorldRelation {
    id: string;
    from: string; // agentId
    to: string;   // agentId
    kind: 'friend' | 'trust' | 'influence' | 'custom';
    weight: number; // 0..1
}

export interface SimulationWorld {
    id: string;
    name: string;
    rooms: WorldRoom[];
    relations: WorldRelation[];
    globalClock: number; // ticks
    agentIds: string[]; // all agents in world
    createdAt: number;
    updatedAt: number;
}

export interface IWorldStateService extends ILifecycle {
    create(input: { name: string; rooms?: Omit<WorldRoom, 'agents'>[]; agentIds?: string[] }): Promise<SimulationWorld>;
    get(worldId: string): Promise<SimulationWorld | null>;
    list(): Promise<SimulationWorld[]>;
    remove(worldId: string): Promise<void>;
    update(worldId: string, patch: Partial<Pick<SimulationWorld, 'name' | 'rooms' | 'relations' | 'agentIds'>>): Promise<SimulationWorld>;
    /** Move agent to room (validates 0..1000 coords already in room). */
    moveAgent(worldId: string, agentId: string, roomId: string): Promise<SimulationWorld>;
    /** Tick clock + emit sim:tick. */
    tick(worldId: string): Promise<SimulationWorld>;
}
