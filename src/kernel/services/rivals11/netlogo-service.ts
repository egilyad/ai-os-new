/**
 * NetLogoService — Q.1 (grid turtles + BehaviorSpace, additive).
 *
 * Worlds in DAL kv: patches hold a resource field (diffuses), turtles have
 * breed/energy/position; tick rules: move → eat → reproduce → die.
 * BehaviorSpace runs param sweeps as fresh worlds. ASCII snapshot renders
 * the map for the console.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { INetLogoService } from '../../contracts/rivals11';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('NetLogo');

interface Turtle {
    id: string;
    breed: string;
    x: number;
    y: number;
    energy: number;
}

interface WorldDoc {
    id: string;
    size: number;
    breeds: string[];
    patches: number[][];
    turtles: Turtle[];
    ticks: number;
    eatGain: number;
    reproduceAt: number;
}

function hashSeed(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
}

function mulberry(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export class NetLogoService implements INetLogoService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createWorld(size = 16, breeds: string[] = ['wolves', 'sheep']): Promise<string> {
        const s = Math.max(4, Math.min(48, size));
        const patches: number[][] = Array.from({ length: s }, (_, y) =>
            Array.from({ length: s }, (_, x) => ((x * 7 + y * 13) % 5) + 1),
        );
        const doc: WorldDoc = {
            id: genId('world'),
            size: s,
            breeds: breeds.map((b) => b.slice(0, 40)),
            patches,
            turtles: [],
            ticks: 0,
            eatGain: 4,
            reproduceAt: 12,
        };
        await this.dal.kv.set(`nlworld/${doc.id}`, doc);
        return doc.id;
    }

    async seedTurtles(worldId: string, breed: string, count: number): Promise<void> {
        const world = await this.require(worldId);
        if (!world.breeds.includes(breed)) throw new Error(`Unknown breed: ${breed}`);
        const rand = mulberry(hashSeed(`${worldId}:${breed}`));
        for (let i = 0; i < Math.max(0, Math.min(500, count)); i++) {
            world.turtles.push({
                id: genId('turtle'),
                breed,
                x: Math.floor(rand() * world.size),
                y: Math.floor(rand() * world.size),
                energy: 6 + Math.floor(rand() * 6),
            });
        }
        await this.dal.kv.set(`nlworld/${worldId}`, world);
    }

    async tick(worldId: string, steps = 1): Promise<{ ticks: number; populations: Record<string, number> }> {
        const world = await this.require(worldId);
        const rand = mulberry(hashSeed(`${worldId}:${world.ticks}`));
        for (let s = 0; s < Math.max(1, Math.min(200, steps)); s++) {
            world.ticks += 1;
            // Diffusion: patches share a tenth with neighbours.
            const next = world.patches.map((row) => [...row]);
            for (let y = 0; y < world.size; y++) {
                for (let x = 0; x < world.size; x++) {
                    const give = Math.floor((world.patches[y]?.[x] ?? 0) / 10);
                    if (give > 0) {
                        next[y]![x]! -= give;
                        const nx = (x + 1) % world.size;
                        next[y]![nx]! += give;
                    }
                }
            }
            world.patches = next;
            const newborn: Turtle[] = [];
            for (const t of world.turtles) {
                t.x = (t.x + Math.floor(rand() * 3) - 1 + world.size) % world.size;
                t.y = (t.y + Math.floor(rand() * 3) - 1 + world.size) % world.size;
                const cell = world.patches[t.y]?.[t.x] ?? 0;
                if (cell > 0) {
                    world.patches[t.y]![t.x]! -= 1;
                    t.energy += world.eatGain;
                } else {
                    t.energy -= 1;
                }
                if (t.energy >= world.reproduceAt) {
                    t.energy = Math.floor(t.energy / 2);
                    newborn.push({ id: genId('turtle'), breed: t.breed, x: t.x, y: t.y, energy: t.energy });
                }
            }
            world.turtles = [...world.turtles.filter((t) => t.energy > 0), ...newborn].slice(0, 2000);
        }
        await this.dal.kv.set(`nlworld/${worldId}`, world);
        const populations: Record<string, number> = {};
        for (const t of world.turtles) populations[t.breed] = (populations[t.breed] ?? 0) + 1;
        this.events.emit(EVENTS.NETLOGO_TICK, { worldId, ticks: world.ticks });
        return { ticks: world.ticks, populations };
    }

    async snapshot(worldId: string): Promise<string> {
        const world = await this.require(worldId);
        const grid: string[][] = Array.from({ length: world.size }, () => new Array<string>(world.size).fill('·'));
        for (const t of world.turtles) {
            grid[t.y]![t.x] = t.breed.slice(0, 1).toUpperCase();
        }
        return `tick ${world.ticks} (${world.turtles.length} turtles)\n${grid.map((r) => r.join('')).join('\n')}`.slice(0, 4000);
    }

    async behaviorSpace(
        worldId: string,
        paramSets: Array<Record<string, number>>,
    ): Promise<Array<{ params: Record<string, number>; result: Record<string, number> }>> {
        const template = await this.require(worldId);
        const out: Array<{ params: Record<string, number>; result: Record<string, number> }> = [];
        for (const params of paramSets.slice(0, 12)) {
            const id = await this.createWorld(template.size, template.breeds);
            const exp = await this.require(id);
            if (params['eatGain'] !== undefined) exp.eatGain = Math.max(1, Math.floor(params['eatGain']));
            if (params['reproduceAt'] !== undefined) exp.reproduceAt = Math.max(4, Math.floor(params['reproduceAt']));
            await this.dal.kv.set(`nlworld/${id}`, exp);
            for (const breed of exp.breeds) await this.seedTurtles(id, breed, 20);
            const res = await this.tick(id, 30);
            out.push({ params: { ...params }, result: res.populations });
        }
        return out;
    }

    private async require(id: string): Promise<WorldDoc> {
        const doc = await this.dal.kv.get<WorldDoc>(`nlworld/${id}`);
        if (!doc) throw new Error(`World not found: ${id}`);
        return doc;
    }
}
