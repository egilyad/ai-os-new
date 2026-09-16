/**
 * GymService — Q.3 (Gymnasium-style env API, additive).
 *
 * Built-ins: bandit (K-armed, seeded rewards), gridworld (goal + holes),
 * cartlite (1-D balance). Custom tabular envs: states + transition table
 * `{state: {action: {next, reward, done}}}`. Seeded RNG per instance.
 * Instances live in DAL kv (`gym/*`).
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IGymService } from '../../contracts/rivals11';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Gym');

type EnvKind = 'bandit' | 'gridworld' | 'cartlite' | 'custom';

interface EnvInstance {
    id: string;
    env: string;
    kind: EnvKind;
    state: Record<string, unknown>;
    seed: number;
    steps: number;
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

export class GymService implements IGymService {
    constructor(private dal: DataAccessLayer) {}

    async init(): Promise<void> {
        LOGGER.info('Gym', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async make(env: string): Promise<string> {
        const clean = env.trim();
        let kind: EnvKind = 'custom';
        if (clean === 'bandit' || clean === 'gridworld' || clean === 'cartlite') kind = clean;
        const inst: EnvInstance = {
            id: genId('gym'),
            env: clean.slice(0, 80),
            kind,
            state: {},
            seed: 1,
            steps: 0,
        };
        if (kind === 'custom') {
            const table = await this.dal.kv.get<Record<string, Record<string, { next: string; reward: number; done: boolean }>>>(
                `gym-table/${clean}`,
            );
            if (!table) throw new Error(`Unknown env (no custom table): ${env}`);
        }
        await this.dal.kv.set(`gym/${inst.id}`, inst);
        return inst.id;
    }

    /** Register a custom tabular env: transitions[state][action] = {next, reward, done}. */
    async defineTable(
        env: string,
        table: Record<string, Record<string, { next: string; reward: number; done: boolean }>>,
        start: string,
    ): Promise<void> {
        await this.dal.kv.set(`gym-table/${env.slice(0, 80)}`, table);
        await this.dal.kv.set(`gym-start/${env.slice(0, 80)}`, start);
    }

    async reset(instanceId: string, seed = 1): Promise<string> {
        const inst = await this.require(instanceId);
        inst.seed = seed;
        inst.steps = 0;
        if (inst.kind === 'bandit') inst.state = { means: [0.2, 0.5, 0.8] };
        else if (inst.kind === 'gridworld') inst.state = { x: 0, y: 0 };
        else if (inst.kind === 'cartlite') inst.state = { pos: 0 };
        else {
            const start = await this.dal.kv.get<string>(`gym-start/${inst.env}`);
            inst.state = { at: start ?? 's0' };
        }
        await this.dal.kv.set(`gym/${instanceId}`, inst);
        return this.describe(inst);
    }

    async step(instanceId: string, action: string): Promise<{ obs: string; reward: number; done: boolean }> {
        const inst = await this.require(instanceId);
        const rand = mulberry(inst.seed * 100003 + inst.steps * 97 + 13);
        inst.steps += 1;
        let obs = '';
        let reward = 0;
        let done = false;
        if (inst.kind === 'bandit') {
            const arm = Math.max(0, Math.min(2, Number(action)));
            if (!Number.isInteger(arm)) throw new Error('bandit action must be 0|1|2');
            const means = (inst.state['means'] ?? [0.2, 0.5, 0.8]) as number[];
            reward = rand() < (means[arm] ?? 0.2) ? 1 : 0;
            obs = `pull ${arm} → ${reward}`;
        } else if (inst.kind === 'gridworld') {
            let x = (inst.state['x'] ?? 0) as number;
            let y = (inst.state['y'] ?? 0) as number;
            if (action === 'N') y -= 1;
            else if (action === 'S') y += 1;
            else if (action === 'E') x += 1;
            else if (action === 'W') x -= 1;
            else throw new Error('gridworld action must be N/S/E/W');
            x = Math.max(0, Math.min(3, x));
            y = Math.max(0, Math.min(3, y));
            inst.state = { x, y };
            if (x === 3 && y === 3) {
                reward = 10;
                done = true;
            } else if ((x === 1 && y === 1) || (x === 2 && y === 2)) {
                reward = -5;
                done = true;
            } else {
                reward = -0.1;
            }
            obs = `(${x},${y})`;
        } else if (inst.kind === 'cartlite') {
            const push = action === 'R' ? 1 : action === 'L' ? -1 : 0;
            if (push === 0) throw new Error('cartlite action must be L|R');
            const pos = ((inst.state['pos'] ?? 0) as number) + push * (0.3 + rand() * 0.2);
            inst.state = { pos: Math.round(pos * 100) / 100 };
            if (Math.abs(pos) > 2) {
                reward = -10;
                done = true;
            } else {
                reward = 1;
            }
            obs = `pos=${(inst.state['pos'] as number).toFixed(2)}`;
        } else {
            const table = await this.dal.kv.get<
                Record<string, Record<string, { next: string; reward: number; done: boolean }>>
            >(`gym-table/${inst.env}`);
            const at = String(inst.state['at'] ?? '');
            const edge = table?.[at]?.[action];
            if (!edge) throw new Error(`No transition: ${at} + ${action}`);
            inst.state = { at: edge.next };
            reward = edge.reward;
            done = edge.done;
            obs = edge.next;
        }
        await this.dal.kv.set(`gym/${instanceId}`, inst);
        return { obs, reward, done };
    }

    private async require(id: string): Promise<EnvInstance> {
        const inst = await this.dal.kv.get<EnvInstance>(`gym/${id}`);
        if (!inst) throw new Error(`Gym instance not found: ${id}`);
        return inst;
    }

    private describe(inst: EnvInstance): string {
        if (inst.kind === 'bandit') return 'arms 0|1|2 (hidden means)';
        if (inst.kind === 'gridworld') return '(0,0); goal (3,3); holes (1,1),(2,2)';
        if (inst.kind === 'cartlite') return 'pos=0; keep |pos|<=2 with L|R';
        return `at=${String(inst.state['at'] ?? '?')}`;
    }
}
