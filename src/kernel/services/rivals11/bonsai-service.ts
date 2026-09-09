/**
 * BonsaiService — Q.1 (machine teaching lite, additive).
 *
 * Simulators declare states + actions (kv). Lessons bind a from→goal
 * curriculum; training runs Q-learning-ish episodes (epsilon-greedy over a
 * kv Q-table, reward = reached goal); assessment reports score + steps.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IBonsaiService } from '../../contracts/rivals11';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Bonsai');

interface SimDoc {
    name: string;
    states: string[];
    actions: string[];
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

export class BonsaiService implements IBonsaiService {
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

    async registerSim(name: string, states: string[], actions: string[]): Promise<void> {
        if (states.length < 2 || actions.length === 0) throw new Error('Sim needs ≥2 states and ≥1 action');
        const doc: SimDoc = {
            name: name.slice(0, 80),
            states: states.map((s) => s.slice(0, 80)).slice(0, 50),
            actions: actions.map((a) => a.slice(0, 80)).slice(0, 20),
        };
        await this.dal.kv.set(`bonsai-sim/${doc.name}`, doc);
    }

    async defineLesson(sim: string, fromState: string, goalState: string): Promise<string> {
        const doc = await this.dal.kv.get<SimDoc>(`bonsai-sim/${sim}`);
        if (!doc) throw new Error(`Simulator not found: ${sim}`);
        if (!doc.states.includes(fromState) || !doc.states.includes(goalState)) {
            throw new Error('Lesson states must exist in the simulator');
        }
        const id = `lesson:${sim}:${fromState}->${goalState}`;
        await this.dal.kv.set(`bonsai-lesson/${id}`, { sim, fromState, goalState });
        return id;
    }

    async train(lessonId: string, episodes = 50): Promise<{ policy: Record<string, string>; reward: number }> {
        const lesson = await this.dal.kv.get<{ sim: string; fromState: string; goalState: string }>(
            `bonsai-lesson/${lessonId}`,
        );
        if (!lesson) throw new Error(`Lesson not found: ${lessonId}`);
        const sim = await this.dal.kv.get<SimDoc>(`bonsai-sim/${lesson.sim}`);
        if (!sim) throw new Error(`Simulator not found: ${lesson.sim}`);
        const qKey = `bonsai-q/${lessonId}`;
        const q = (await this.dal.kv.get<Record<string, number>>(qKey)) ?? {};
        const rand = mulberry(hashSeed(lessonId));
        const goalIdx = sim.states.indexOf(lesson.goalState);
        let totalReward = 0;
        const caps = Math.max(1, Math.min(200, episodes));
        for (let ep = 0; ep < caps; ep++) {
            let idx = sim.states.indexOf(lesson.fromState);
            for (let step = 0; step < 20; step++) {
                const state = sim.states[idx] as string;
                // Epsilon-greedy over Q.
                let action: string;
                if (rand() < 0.2) {
                    action = sim.actions[Math.floor(rand() * sim.actions.length)] as string;
                } else {
                    let best = sim.actions[0] as string;
                    let bestQ = -Infinity;
                    for (const a of sim.actions) {
                        const v = q[`${state}|${a}`] ?? 0;
                        if (v > bestQ) {
                            bestQ = v;
                            best = a;
                        }
                    }
                    action = best;
                }
                // World model: next state drifts toward goal on "advance"-like actions.
                const drift = /advance|forward|next|go/i.test(action) ? 1 : 0;
                const next = Math.max(0, Math.min(sim.states.length - 1, idx + (rand() < 0.7 ? drift : drift - 1)));
                const reward = next === goalIdx ? 10 : -1;
                const key = `${state}|${action}`;
                q[key] = (q[key] ?? 0) + 0.2 * (reward - (q[key] ?? 0));
                totalReward += reward;
                idx = next;
                if (idx === goalIdx) break;
            }
        }
        await this.dal.kv.set(qKey, q);
        const policy: Record<string, string> = {};
        for (const state of sim.states) {
            let best = sim.actions[0] as string;
            let bestQ = -Infinity;
            for (const a of sim.actions) {
                const v = q[`${state}|${a}`] ?? 0;
                if (v > bestQ) {
                    bestQ = v;
                    best = a;
                }
            }
            policy[state] = best;
        }
        this.events.emit(EVENTS.BONSAI_TRAINED, { lessonId, reward: Math.round(totalReward) });
        return { policy, reward: Math.round((totalReward / caps) * 100) / 100 };
    }

    async assess(lessonId: string): Promise<{ score: number; steps: number }> {
        const lesson = await this.dal.kv.get<{ sim: string; fromState: string; goalState: string }>(
            `bonsai-lesson/${lessonId}`,
        );
        if (!lesson) throw new Error(`Lesson not found: ${lessonId}`);
        const sim = await this.dal.kv.get<SimDoc>(`bonsai-sim/${lesson.sim}`);
        if (!sim) throw new Error(`Simulator not found: ${lesson.sim}`);
        const q = (await this.dal.kv.get<Record<string, number>>(`bonsai-q/${lessonId}`)) ?? {};
        const rand = mulberry(hashSeed(`${lessonId}:assess`));
        let idx = sim.states.indexOf(lesson.fromState);
        const goalIdx = sim.states.indexOf(lesson.goalState);
        let steps = 0;
        for (; steps < 30; steps++) {
            if (idx === goalIdx) break;
            const state = sim.states[idx] as string;
            let best = sim.actions[0] as string;
            let bestQ = -Infinity;
            for (const a of sim.actions) {
                const v = q[`${state}|${a}`] ?? (rand() < 0.1 ? 1 : 0);
                if (v > bestQ) {
                    bestQ = v;
                    best = a;
                }
            }
            idx = Math.max(0, Math.min(sim.states.length - 1, idx + (/advance|forward|next|go/i.test(best) ? 1 : 0)));
        }
        const score = idx === goalIdx ? Math.max(0, 1 - steps / 30) : 0;
        return { score: Math.round(score * 100) / 100, steps };
    }
}
