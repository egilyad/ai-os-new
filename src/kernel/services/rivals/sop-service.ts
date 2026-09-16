/**
 * SopService — F.3 (MetaGPT-style SOPs, additive).
 *
 * SOP = ordered phases (role + artifact + instruction). `runSop()` executes
 * each phase as an LLM turn (or echo offline) and records artifacts into an
 * AgentLoop log; roles subscribe to artifact kinds via EventBus (`sop:*`).
 * In-memory definitions (process text, not data) + persisted runs.
 */
import type { IEventBus } from '../../types/interfaces';
import type { RivalRepository } from '../../dal/rival-repository';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ISopService } from '../../contracts/rivals';
import type { AgentLoop, SopDefinition, SopPhase } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('SOP');

function now(): number {
    return Date.now();
}

export class SopService implements ISopService {
    private defs = new Map<string, SopDefinition>();

    constructor(
        private repo: RivalRepository,
        private events: IEventBus,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
        // Built-in SOP: software crew (MetaGPT's signature pipeline).
        if (this.defs.size === 0) {
            await this.defineSop('software-crew', [
                { name: 'PRD', role: 'ProductManager', artifact: 'prd', instruction: 'Write requirements: users, stories, acceptance.' },
                { name: 'Design', role: 'Architect', artifact: 'design', instruction: 'Design modules, files, interfaces from the PRD.' },
                { name: 'Tasks', role: 'ProjectManager', instruction: 'Break the design into an ordered task list.', artifact: 'tasks' },
                { name: 'Code', role: 'Engineer', artifact: 'code', instruction: 'Implement each task, file by file.' },
                { name: 'QA', role: 'QaEngineer', artifact: 'qa-report', instruction: 'Review the code, list defects and fixes.' },
            ]);
        }
    }

    async destroy(): Promise<void> {
        this.defs.clear();
    }

    async defineSop(
        name: string,
        phases: Array<{ name: string; role: string; artifact: string; instruction: string }>,
    ): Promise<SopDefinition> {
        if (phases.length === 0) throw new Error('SOP needs at least 1 phase');
        const def: SopDefinition = {
            id: genId('sop'),
            name,
            phases: phases.map((p) => ({ ...p }) as SopPhase),
            createdAt: now(),
        };
        this.defs.set(def.id, def);
        return def;
    }

    async listSops(): Promise<SopDefinition[]> {
        return [...this.defs.values()];
    }

    async runSop(sopId: string, goal: string): Promise<AgentLoop> {
        const def = this.defs.get(sopId);
        if (!def) throw new Error(`SOP not found: ${sopId}`);
        const t = now();
        const loop: AgentLoop = {
            id: genId('loop'),
            kind: 'sop',
            goal,
            status: 'running',
            iterations: 0,
            maxIterations: def.phases.length,
            taskList: [],
            log: [`SOP "${def.name}" started: ${goal.slice(0, 200)}`],
            createdAt: t,
            updatedAt: t,
        };
        let context = `Goal: ${goal}`;
        for (const phase of def.phases) {
            const artifact = await this.runPhase(phase, context);
            loop.iterations += 1;
            loop.log.push(`[${phase.role} → ${phase.artifact}]: ${artifact.slice(0, 500)}`);
            context += `\n--- ${phase.artifact} by ${phase.role}\n${artifact}\n`;
            loop.updatedAt = now();
            await this.repo.putLoop(loop);
            this.events.emit(EVENTS.SOP_PHASE, {
                loopId: loop.id,
                phase: phase.name,
                artifact: phase.artifact,
                role: phase.role,
            });
        }
        loop.status = 'completed';
        loop.result = context.slice(-4000);
        loop.updatedAt = now();
        await this.repo.putLoop(loop);
        return loop;
    }

    private async runPhase(phase: SopPhase, context: string): Promise<string> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content: `You are ${phase.role} in a software pipeline. ${phase.instruction}`,
                        },
                        { role: 'user', content: context.slice(-8000) },
                    ],
                    { temperature: 0.4, maxTokens: 1200, cacheScope: { role: phase.role } },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('sop phase llm failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return `[${phase.role}] ${phase.instruction} (echo)`;
    }
}
