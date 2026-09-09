/**
 * WorldStateService — Phase 62 (World State).
 *
 * Additive, keyValue: sim:world:<id> + sim:world:index (no migration).
 * Coords 0..1000 like ComputerService, for SimulationPanel SVG 1000×1000.
 * Events: sim:world:created, sim:world:tick (best-effort).
 */

import type { IWorldStateService, SimulationWorld, WorldRoom } from '../../contracts/simulation-world';
import type { DatabaseService } from '../database-service';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';

const LOGGER = rootLogger.child('WorldState');
const PREFIX = 'sim:world:';
const INDEX = 'sim:world:index';

function now(): number { return Date.now(); }

function validateRoom(r: Omit<WorldRoom, 'agents'>): void {
    if (!r.name?.trim()) throw new Error('Room name required');
    for (const k of ['x','y','w','h'] as const) {
        const v = Number((r as Record<string, unknown>)[k]);
        if (!Number.isFinite(v) || v < 0 || v > 1000) throw new Error(`Room ${r.name}: ${k} must be 0..1000`);
    }
    if (r.w < 1 || r.h < 1) throw new Error(`Room ${r.name}: w/h must be >=1`);
}

export class WorldStateService implements IWorldStateService {
    constructor(private deps: { database: DatabaseService; events: IEventBus }) {}

    async init(): Promise<void> { LOGGER.info('init', {}); }
    async destroy(): Promise<void> {}

    async create(input: { name: string; rooms?: Omit<WorldRoom, 'agents'>[]; agentIds?: string[] }): Promise<SimulationWorld> {
        if (!input.name?.trim()) throw new Error('World name required');
        const rooms: WorldRoom[] = (input.rooms ?? [{ id: 'room-1', name: 'Main Hall', x: 100, y: 100, w: 800, h: 600 }]).map((r) => {
            validateRoom(r);
            return { ...r, agents: [] };
        });
        const world: SimulationWorld = {
            id: genId('simworld'),
            name: input.name.trim().slice(0, 120),
            rooms,
            relations: [],
            globalClock: 0,
            agentIds: [...(input.agentIds ?? [])],
            createdAt: now(),
            updatedAt: now(),
        };
        // distribute agents round-robin to rooms if provided
        if (world.agentIds.length > 0) {
            world.agentIds.forEach((aid, i) => {
                const room = rooms[i % rooms.length];
                if (room) room.agents.push(aid);
            });
        }
        await this.deps.database.setKv(`${PREFIX}${world.id}`, world);
        const idx = (await this.deps.database.getKv<string[]>(INDEX)) ?? [];
        idx.push(world.id);
        await this.deps.database.setKv(INDEX, [...new Set(idx)]);
        try {
            (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                (EVENTS as unknown as Record<string, string>).SIM_WORLD_CREATED ?? ('sim:world:created' as unknown as string),
                { worldId: world.id, name: world.name },
            );
        } catch { /* ignore */ }
        LOGGER.info('world created', { worldId: world.id });
        return world;
    }

    async get(worldId: string): Promise<SimulationWorld | null> {
        return (await this.deps.database.getKv<SimulationWorld>(`${PREFIX}${worldId}`)) ?? null;
    }

    async list(): Promise<SimulationWorld[]> {
        const idx = (await this.deps.database.getKv<string[]>(INDEX)) ?? [];
        const out: SimulationWorld[] = [];
        for (const id of idx) {
            const w = await this.get(id);
            if (w) out.push(w);
        }
        return out.sort((a, b) => b.createdAt - a.createdAt);
    }

    async remove(worldId: string): Promise<void> {
        await this.deps.database.setKv(`${PREFIX}${worldId}`, null as unknown as SimulationWorld);
        try {
            const dbAny = this.deps.database as unknown as { keyValue: { delete: (id: string) => Promise<void> } };
            try { await dbAny.keyValue.delete(`${PREFIX}${worldId}`); } catch { /* fallback set null */ }
        } catch { /* ignore */ }
        const idx = (await this.deps.database.getKv<string[]>(INDEX)) ?? [];
        await this.deps.database.setKv(INDEX, idx.filter((x) => x !== worldId));
    }

    async update(worldId: string, patch: Partial<Pick<SimulationWorld, 'name' | 'rooms' | 'relations' | 'agentIds'>>): Promise<SimulationWorld> {
        const w = await this.get(worldId);
        if (!w) throw new Error(`World not found: ${worldId}`);
        if (patch.name !== undefined) w.name = patch.name.trim().slice(0, 120) || w.name;
        if (patch.rooms !== undefined) {
            patch.rooms.forEach((r) => validateRoom(r as Omit<WorldRoom, 'agents'>));
            w.rooms = patch.rooms as WorldRoom[];
        }
        if (patch.relations !== undefined) w.relations = patch.relations;
        if (patch.agentIds !== undefined) w.agentIds = [...patch.agentIds];
        w.updatedAt = now();
        await this.deps.database.setKv(`${PREFIX}${worldId}`, w);
        return w;
    }

    async moveAgent(worldId: string, agentId: string, roomId: string): Promise<SimulationWorld> {
        const w = await this.get(worldId);
        if (!w) throw new Error(`World not found: ${worldId}`);
        if (!w.agentIds.includes(agentId)) throw new Error(`Agent ${agentId} not in world ${worldId}`);
        const target = w.rooms.find((r) => r.id === roomId);
        if (!target) throw new Error(`Room not found: ${roomId}`);
        for (const r of w.rooms) r.agents = r.agents.filter((a) => a !== agentId);
        target.agents.push(agentId);
        w.updatedAt = now();
        await this.deps.database.setKv(`${PREFIX}${worldId}`, w);
        return w;
    }

    async tick(worldId: string): Promise<SimulationWorld> {
        const w = await this.get(worldId);
        if (!w) throw new Error(`World not found: ${worldId}`);
        w.globalClock += 1;
        w.updatedAt = now();
        await this.deps.database.setKv(`${PREFIX}${worldId}`, w);
        try {
            (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                (EVENTS as unknown as Record<string, string>).SIM_TICK ?? ('sim:tick' as unknown as string),
                { worldId, tick: w.globalClock },
            );
        } catch { /* ignore */ }
        return w;
    }
}
