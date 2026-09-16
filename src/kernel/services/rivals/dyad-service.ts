/**
 * DyadService — F.3 (CAMEL-style role-playing dyad, additive).
 *
 * AI-user ↔ AI-assistant with inception prompts (role + task + stop rules),
 * alternating turns until maxTurns / stop phrase / assistant declares done.
 * Recorded as an AgentLoop (kind 'dyad') with a final summary.
 */
import type { IEventBus } from '../../types/interfaces';
import type { RivalRepository } from '../../dal/rival-repository';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IDyadService } from '../../contracts/rivals';
import type { AgentLoop } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Dyad');

function now(): number {
    return Date.now();
}

export class DyadService implements IDyadService {
    constructor(
        private repo: RivalRepository,
        private events: IEventBus,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Dyad', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async startDyad(input: {
        topic: string;
        userRole?: string;
        assistantRole?: string;
        maxTurns?: number;
        stopPhrases?: string[];
    }): Promise<AgentLoop> {
        const userRole = input.userRole ?? 'AI User';
        const assistantRole = input.assistantRole ?? 'AI Assistant';
        const maxTurns = Math.max(2, Math.min(30, input.maxTurns ?? 10));
        const stopPhrases = input.stopPhrases ?? ['<TASK_DONE>'];
        const t = now();
        const loop: AgentLoop = {
            id: genId('loop'),
            kind: 'dyad',
            goal: input.topic,
            status: 'running',
            iterations: 0,
            maxIterations: maxTurns,
            taskList: [],
            log: [`Dyad on "${input.topic.slice(0, 200)}": ${userRole} ↔ ${assistantRole}`],
            createdAt: t,
            updatedAt: t,
        };

        const userSystem =
            `You are ${userRole}. Instruct ${assistantRole} to solve: ${input.topic}. ` +
            `Give one instruction at a time. When satisfied, reply exactly <TASK_DONE>.`;
        const assistantSystem =
            `You are ${assistantRole}. Solve the task from ${userRole} step by step. ` +
            `Ask for clarification when blocked. When the task is complete, reply exactly <TASK_DONE>.`;

        let userMsg = `Task: ${input.topic}`;
        let finished = false;
        while (loop.iterations < maxTurns && !finished) {
            loop.iterations += 1;
            const assistantReply = await this.say(assistantSystem, userMsg, assistantRole, loop.id);
            loop.log.push(`[${assistantRole}]: ${assistantReply.slice(0, 400)}`);
            if (stopPhrases.some((p) => assistantReply.includes(p))) {
                finished = true;
                loop.result = `Done in ${loop.iterations} turns.`;
                break;
            }
            const userReply = await this.say(userSystem, assistantReply, userRole, loop.id);
            loop.log.push(`[${userRole}]: ${userReply.slice(0, 400)}`);
            if (stopPhrases.some((p) => userReply.includes(p))) {
                finished = true;
                loop.result = `Done in ${loop.iterations} turns.`;
                break;
            }
            userMsg = userReply;
            loop.updatedAt = now();
            await this.repo.putLoop(loop);
        }
        loop.status = finished ? 'completed' : 'stuck';
        if (!finished) loop.result = `Max turns (${maxTurns}) without <TASK_DONE>.`;
        loop.updatedAt = now();
        await this.repo.putLoop(loop);
        this.events.emit(EVENTS.DYAD_DONE, { loopId: loop.id, turns: loop.iterations });
        return loop;
    }

    private async say(system: string, user: string, role: string, sessionId: string): Promise<string> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: system.slice(0, 2000) },
                        { role: 'user', content: user.slice(0, 4000) },
                    ],
                    { temperature: 0.7, maxTokens: 600, cacheScope: { agentId: role, sessionId } },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('Dyad', 'dyad turn failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return `[${role}] acknowledges.`;
    }
}
