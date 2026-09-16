/**
 * AutonomyService — F.3 (AutoGPT goal loop + BabyAGI task queue, additive).
 *
 * runGoal: plan → act (ToolRunner) → critique cycles until done/stuck/maxIters.
 * runTaskQueue: create → prioritize → execute over a live task list.
 * Every iteration checkpoints into `agentLoops`; stuck detection stops loops
 * that repeat the same critique twice.
 */
import type { IEventBus } from '../../types/interfaces';
import type { RivalRepository } from '../../dal/rival-repository';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IAutonomyService } from '../../contracts/rivals';
import type { AgentLoop } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Autonomy');

function now(): number {
    return Date.now();
}

export interface AutonomyDeps {
    repo: RivalRepository;
    events: IEventBus;
    llm?: ILLMClientService;
    tools?: IToolRunnerService;
}

export class AutonomyService implements IAutonomyService {
    private aborted = new Set<string>();

    constructor(private deps: AutonomyDeps) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        this.aborted.clear();
    }

    async runGoal(goal: string, maxIterations = 8): Promise<AgentLoop> {
        const t = now();
        const loop: AgentLoop = {
            id: genId('loop'),
            kind: 'autonomy',
            goal,
            status: 'running',
            iterations: 0,
            maxIterations: Math.max(1, Math.min(30, maxIterations)),
            taskList: [],
            log: [`Goal: ${goal.slice(0, 300)}`],
            createdAt: t,
            updatedAt: t,
        };
        await this.deps.repo.putLoop(loop);
        let context = '';
        let lastCritique = '';
        let repeat = 0;

        while (loop.iterations < loop.maxIterations) {
            if (this.aborted.has(loop.id)) {
                loop.status = 'aborted';
                break;
            }
            loop.iterations += 1;
            const plan = await this.think(`Plan step ${loop.iterations} for: ${goal}\nSo far:\n${context.slice(-3000)}`);
            const acted = await this.act(plan);
            const critique = await this.think(
                `Critique this result for goal "${goal.slice(0, 200)}":\n${acted.slice(0, 2000)}\n` +
                    `Reply with either DONE: <summary> or NEXT: <what remains>.`,
            );
            loop.log.push(`#${loop.iterations} plan: ${plan.slice(0, 300)}`);
            loop.log.push(`#${loop.iterations} critique: ${critique.slice(0, 300)}`);
            context += `\n[${loop.iterations}] ${acted.slice(0, 1000)}\n`;
            if (critique === lastCritique) repeat += 1;
            else repeat = 0;
            lastCritique = critique;
            loop.updatedAt = now();
            await this.deps.repo.putLoop(loop);
            this.events.emit(EVENTS.LOOP_ITER, { loopId: loop.id, iteration: loop.iterations });

            if (/^done:/i.test(critique.trim())) {
                loop.status = 'completed';
                loop.result = critique.replace(/^done:\s*/i, '').slice(0, 4000);
                break;
            }
            if (repeat >= 2) {
                loop.status = 'stuck';
                loop.result = `Stuck after ${loop.iterations} iterations (repeated critique).`;
                break;
            }
        }
        if (loop.status === 'running') {
            loop.status = 'failed';
            loop.result = `Max iterations (${loop.maxIterations}) reached without DONE.`;
        }
        loop.updatedAt = now();
        await this.deps.repo.putLoop(loop);
        return loop;
    }

    async runTaskQueue(objective: string, maxIterations = 10): Promise<AgentLoop> {
        const t = now();
        const loop: AgentLoop = {
            id: genId('loop'),
            kind: 'task_queue',
            goal: objective,
            status: 'running',
            iterations: 0,
            maxIterations: Math.max(1, Math.min(40, maxIterations)),
            taskList: [],
            log: [`Objective: ${objective.slice(0, 300)}`],
            createdAt: t,
            updatedAt: t,
        };
        await this.deps.repo.putLoop(loop);

        while (loop.iterations < loop.maxIterations) {
            if (this.aborted.has(loop.id)) {
                loop.status = 'aborted';
                break;
            }
            loop.iterations += 1;
            // Create: propose up to 3 new tasks from the current state.
            const proposal = await this.think(
                `Objective: ${objective}\nDone so far: ${loop.taskList.filter((x) => x.status === 'done').map((x) => x.text).join(' | ') || 'none'}\n` +
                    `Propose up to 3 next concrete tasks, one per line starting with "- ".`,
            );
            for (const line of proposal.split('\n')) {
                const m = line.match(/^-\s*(.+)/);
                if (m && loop.taskList.length < 20) {
                    loop.taskList.push({ id: genId('tq'), text: m[1]!.trim().slice(0, 300), status: 'pending' });
                }
            }
            // Prioritize: first pending task wins (creation order = priority).
            const next = loop.taskList.find((x) => x.status === 'pending');
            if (!next) {
                loop.status = 'completed';
                loop.result = `All ${loop.taskList.length} tasks done.`;
                break;
            }
            next.status = 'doing';
            const acted = await this.act(next.text);
            next.status = 'done';
            loop.log.push(`#${loop.iterations} done: ${next.text} → ${acted.slice(0, 300)}`);
            loop.updatedAt = now();
            await this.deps.repo.putLoop(loop);
            this.events.emit(EVENTS.LOOP_ITER, { loopId: loop.id, iteration: loop.iterations });
        }
        if (loop.status === 'running') {
            loop.status = 'failed';
            loop.result = `Max iterations (${loop.maxIterations}) reached.`;
        }
        loop.updatedAt = now();
        await this.deps.repo.putLoop(loop);
        return loop;
    }

    async getLoop(id: string): Promise<AgentLoop | null> {
        return this.deps.repo.getLoop(id);
    }

    async listLoops(): Promise<AgentLoop[]> {
        return this.deps.repo.listLoops();
    }

    async abortLoop(id: string): Promise<void> {
        this.aborted.add(id);
        const loop = await this.deps.repo.getLoop(id);
        if (loop && loop.status === 'running') {
            loop.status = 'aborted';
            loop.updatedAt = now();
            await this.deps.repo.putLoop(loop);
        }
    }

    private async think(prompt: string): Promise<string> {
        if (this.deps.llm) {
            try {
                const res = await this.deps.llm.chat(
                    [
                        { role: 'system', content: 'You are an autonomous agent core. Be terse and actionable.' },
                        { role: 'user', content: prompt.slice(0, 6000) },
                    ],
                    { temperature: 0.4, maxTokens: 600 },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('autonomy think failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return `NEXT: continue working (${prompt.slice(0, 80)}…)`;
    }

    private async act(task: string): Promise<string> {
        if (this.deps.tools) {
            try {
                const res = await this.deps.tools.runWithTools(task, { agentId: 'autonomy-loop', maxRounds: 2 });
                return res.output || '(no output)';
            } catch (e) {
                LOGGER.warn('autonomy act failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return await this.think(`Execute: ${task}`);
    }
}
