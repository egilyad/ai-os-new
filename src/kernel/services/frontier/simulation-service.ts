/**
 * SimulationService — Wave 13.37 + 13.40 (societies, economies, orgs; norms).
 *
 * Deterministic round-based TinyTroupe-style sims: each agent updates its
 * state from traits + round number (no LLM needed). Cross-model society norms
 * track rule adherence per society. Fully offline.
 */
import type { FrontierRepository } from '../../dal/frontier-repository';
import type { ISimulationService } from '../../contracts/frontier';
import type { SimAgent, Simulation, SocietyNorm } from '../../types/frontier-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Simulation');

function now(): number {
    return Date.now();
}

function hashStr(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
}

const MOODS = ['cooperating', 'competing', 'observing', 'trading', 'resting'];

export class SimulationService implements ISimulationService {
    constructor(private repo: FrontierRepository) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createSimulation(input: {
        name: string;
        kind?: Simulation['kind'];
        agents: Array<{ name: string; traits?: Record<string, number>; state?: string }>;
        rounds?: number;
    }): Promise<Simulation> {
        if (input.agents.length === 0) throw new Error('Simulation needs at least 1 agent');
        const sim: Simulation = {
            id: genId('sim'),
            name: input.name,
            kind: input.kind ?? 'society',
            agents: input.agents.map((a) => ({
                id: genId('sagent'),
                name: a.name,
                traits: { ...(a.traits ?? { openness: 0.5, drive: 0.5 }) },
                state: a.state ?? 'idle',
            })),
            rounds: 0,
            log: [`Round 0: ${input.agents.length} agents initialized`],
            createdAt: now(),
            updatedAt: now(),
        };
        await this.repo.putSimulation(sim);
        const target = input.rounds ?? 0;
        for (let i = 0; i < Math.min(target, 100); i++) {
            await this.step(sim.id);
            const updated = await this.repo.getSimulation(sim.id);
            if (updated) Object.assign(sim, updated);
        }
        return sim;
    }

    async step(id: string): Promise<Simulation> {
        const sim = await this.repo.getSimulation(id);
        if (!sim) throw new Error(`Simulation not found: ${id}`);
        sim.rounds += 1;
        const parts: string[] = [];
        for (const agent of sim.agents) {
            const h = hashStr(`${sim.id}:${agent.id}:${sim.rounds}`);
            const mood = MOODS[h % MOODS.length] as string;
            const drive = agent.traits['drive'] ?? 0.5;
            agent.state = drive > 0.7 && mood === 'resting' ? 'competing' : mood;
            parts.push(`${agent.name}→${agent.state}`);
        }
        sim.log.push(`Round ${sim.rounds}: ${parts.join(', ')}`);
        if (sim.log.length > 500) sim.log.splice(0, sim.log.length - 500);
        sim.updatedAt = now();
        await this.repo.putSimulation(sim);
        return sim;
    }

    async get(id: string): Promise<Simulation | null> {
        return this.repo.getSimulation(id);
    }

    async addNorm(societyId: string, rule: string): Promise<SocietyNorm> {
        const norm: SocietyNorm = {
            id: genId('norm'),
            societyId,
            rule: rule.slice(0, 500),
            adherence: 1,
            violations: 0,
            createdAt: now(),
        };
        await this.repo.putNorm(norm);
        return norm;
    }

    async recordAdherence(normId: string, followed: boolean): Promise<SocietyNorm> {
        const norm = await this.repo.getNorm(normId);
        if (!norm) throw new Error(`Norm not found: ${normId}`);
        if (followed) {
            norm.adherence = Math.min(1, norm.adherence + 0.05);
        } else {
            norm.violations += 1;
            norm.adherence = Math.max(0, norm.adherence - 0.1);
        }
        await this.repo.putNorm(norm);
        return norm;
    }

    async listNorms(societyId: string): Promise<SocietyNorm[]> {
        const all = await this.repo.listNorms();
        return all.filter((n) => n.societyId === societyId);
    }
}

export type { SimAgent };
