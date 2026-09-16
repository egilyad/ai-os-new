/**
 * MalmoService — Q.3 (grid missions with rewards, additive).
 *
 * Missions declare an ASCII map (# wall, . floor, G goal, digits = agent
 * spawns), named goals and per-move rewards. Agents move N/S/E/W;
 * stepping on G scores +10 and may finish the mission. Scoreboard tracks
 * per-agent totals. All in DAL kv.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IMalmoService } from '../../contracts/rivals11';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Malmo');

interface MissionDoc {
    id: string;
    name: string;
    map: string[];
    goals: string[];
    agents: Record<string, { x: number; y: number; score: number; done: boolean }>;
}

const DIRS: Record<string, [number, number]> = {
    N: [0, -1],
    S: [0, 1],
    E: [1, 0],
    W: [-1, 0],
};

export class MalmoService implements IMalmoService {
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

    async createMission(input: { name: string; map: string[]; goals?: string[] }): Promise<string> {
        if (input.map.length === 0) throw new Error('Mission needs a map');
        const width = input.map[0]?.length ?? 0;
        if (!input.map.every((r) => r.length === width)) throw new Error('Map rows must be equal width');
        const doc: MissionDoc = {
            id: genId('mission'),
            name: input.name.slice(0, 120),
            map: input.map.slice(0, 32),
            goals: (input.goals ?? ['reach the goal']).map((g) => g.slice(0, 200)),
            agents: {},
        };
        // Spawn agents on digit cells.
        doc.map.forEach((row, y) => {
            [...row].forEach((ch, x) => {
                if (/\d/.test(ch)) {
                    doc.agents[`agent${ch}`] = { x, y, score: 0, done: false };
                }
            });
        });
        if (Object.keys(doc.agents).length === 0) {
            doc.agents['agent0'] = { x: 0, y: 0, score: 0, done: false };
        }
        await this.dal.kv.set(`malmo/${doc.id}`, doc);
        return doc.id;
    }

    async act(missionId: string, agent: string, move: string): Promise<{ reward: number; done: boolean }> {
        const doc = await this.require(missionId);
        const a = doc.agents[agent];
        if (!a) throw new Error(`Agent not in mission: ${agent}`);
        if (a.done) return { reward: 0, done: true };
        const dir = DIRS[move.toUpperCase()];
        if (!dir) throw new Error(`Move must be N/S/E/W, got: ${move}`);
        const nx = a.x + dir[0];
        const ny = a.y + dir[1];
        const cell = doc.map[ny]?.[nx];
        if (cell === undefined || cell === '#') {
            return { reward: -1, done: false };
        }
        a.x = nx;
        a.y = ny;
        let reward = -0.1;
        let done = false;
        if (cell === 'G') {
            reward = 10;
            done = true;
            a.done = true;
            a.score += 10;
            this.events.emit(EVENTS.MALMO_GOAL, { missionId, agent });
        }
        a.score = Math.round((a.score + reward) * 100) / 100;
        await this.dal.kv.set(`malmo/${missionId}`, doc);
        return { reward, done };
    }

    async renderMap(missionId: string): Promise<string> {
        const doc = await this.require(missionId);
        const grid = doc.map.map((r) => [...r]);
        const marks = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let i = 0;
        for (const [name, a] of Object.entries(doc.agents)) {
            if (grid[a.y]?.[a.x] !== undefined && grid[a.y]?.[a.x] !== '#') {
                grid[a.y]![a.x] = marks[i++ % marks.length] as string;
            }
            void name;
        }
        return `mission: ${doc.name}\n${grid.map((r) => r.join('')).join('\n')}`;
    }

    async scoreboard(missionId: string): Promise<Record<string, number>> {
        const doc = await this.require(missionId);
        const out: Record<string, number> = {};
        for (const [name, a] of Object.entries(doc.agents)) out[name] = a.score;
        return out;
    }

    private async require(id: string): Promise<MissionDoc> {
        const doc = await this.dal.kv.get<MissionDoc>(`malmo/${id}`);
        if (!doc) throw new Error(`Mission not found: ${id}`);
        return doc;
    }
}
