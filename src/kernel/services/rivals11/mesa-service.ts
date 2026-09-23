/**
 * MesaService — Q.1 (schedulers + DataCollector + batch runs, additive).
 *
 * Models in DAL kv: agents with energy; schedulers random (shuffle),
 * simultaneous (two-phase), staged (breed order). DataCollector records
 * population + mean energy per step; batch_run aggregates over param sets.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IMesaService } from '../../contracts/rivals11';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Mesa');

interface MesaAgent {
    id: string;
    energy: number;
}

interface MesaModel {
    id: string;
    scheduler: 'random' | 'simultaneous' | 'staged';
    agents: MesaAgent[];
    series: Record<string, number[]>;
    steps: number;
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

export class MesaService implements IMesaService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Mesa', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createModel(scheduler: 'random' | 'simultaneous' | 'staged' = 'random'): Promise<string> {
        const model: MesaModel = {
            id: genId('mesa'),
            scheduler,
            agents: [],
            series: { population: [], meanEnergy: [] },
            steps: 0,
        };
        await this.dal.kv.set(`mesa/${model.id}`, model);
        return model.id;
    }

    async addAgents(modelId: string, count: number, energy = 5): Promise<void> {
        const model = await this.require(modelId);
        const rand = mulberry(hashSeed(`${modelId}:seed`));
        for (let i = 0; i < Math.max(0, Math.min(1000, count)); i++) {
            model.agents.push({ id: genId('magent'), energy: energy + Math.floor(rand() * 4) });
        }
        await this.dal.kv.set(`mesa/${modelId}`, model);
    }

    async step(modelId: string, steps = 1): Promise<Record<string, number[]>> {
        const model = await this.require(modelId);
        const rand = mulberry(hashSeed(`${modelId}:${model.steps}`));
        for (let s = 0; s < Math.max(1, Math.min(200, steps)); s++) {
            model.steps += 1;
            const order = [...model.agents];
            if (model.scheduler === 'random') {
                for (let i = order.length - 1; i > 0; i--) {
                    const j = Math.floor(rand() * (i + 1));
                    [order[i], order[j]] = [order[j]!, order[i]!];
                }
            }
            if (model.scheduler === 'simultaneous') {
                // Two-phase: compute deltas, then apply (no intra-step advantage).
                const deltas = order.map(() => (rand() < 0.5 ? 1 : -1));
                order.forEach((a, i) => {
                    a.energy += deltas[i] ?? 0;
                });
            } else {
                for (const a of order) {
                    a.energy += rand() < 0.55 ? 1 : -1;
                }
            }
            model.agents = model.agents.filter((a) => a.energy > 0).slice(0, 5000);
            const mean =
                model.agents.length > 0
                    ? model.agents.reduce((x, a) => x + a.energy, 0) / model.agents.length
                    : 0;
            const population = model.series.population ?? (model.series.population = []);
            const meanEnergy = model.series.meanEnergy ?? (model.series.meanEnergy = []);
            population.push(model.agents.length);
            meanEnergy.push(Math.round(mean * 100) / 100);
            if (population.length > 1000) {
                population.splice(0, population.length - 1000);
                meanEnergy.splice(0, meanEnergy.length - 1000);
            }
        }
        await this.dal.kv.set(`mesa/${modelId}`, model);
        this.events.emit(EVENTS.MESA_STEP, { modelId, steps: model.steps });
        return { ...model.series };
    }

    async batchRun(paramSets: Array<{ agents: number; steps: number }>): Promise<Array<{
        params: Record<string, number>;
        mean: number;
    }>> {
        const out: Array<{ params: Record<string, number>; mean: number }> = [];
        for (const p of paramSets.slice(0, 12)) {
            const id = await this.createModel('random');
            await this.addAgents(id, Math.max(1, Math.min(500, Math.floor(p.agents))));
            await this.step(id, Math.max(1, Math.min(100, Math.floor(p.steps))));
            const model = await this.require(id);
            const pop = model.series.population;
            const mean = pop.length > 0 ? pop.reduce((a, b) => a + b, 0) / pop.length : 0;
            out.push({ params: { agents: p.agents, steps: p.steps }, mean: Math.round(mean * 100) / 100 });
        }
        return out;
    }

    private async require(id: string): Promise<MesaModel> {
        const model = await this.dal.kv.get<MesaModel>(`mesa/${id}`);
        if (!model) throw new Error(`Mesa model not found: ${id}`);
        return model;
    }
}
