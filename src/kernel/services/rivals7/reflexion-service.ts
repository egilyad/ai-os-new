/**
 * ReflexionService — M.2 (actor + verbal self-reflection + retry, additive).
 *
 * Trials run through ToolRunner (or LLM ask); failures produce a textual
 * reflection stored per task-kind in DAL kv; retries prepend past
 * reflections. Success is judged by an LLM critic or `expect` substring.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IReflexionService } from '../../contracts/rivals7';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Reflexion');

export class ReflexionService implements IReflexionService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private llm?: ILLMClientService,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Reflexion', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    private kindOf(task: string): string {
        const words = task.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((w) => w.length > 3).slice(0, 3);
        return words.join('-') || 'general';
    }

    async run(task: string, maxTrials = 3): Promise<{ answer: string; trials: number; reflections: string[] }> {
        const kind = this.kindOf(task);
        const memory = (await this.dal.kv.get<string[]>(`reflexion/${kind}`)) ?? [];
        const trials = Math.max(1, Math.min(6, maxTrials));
        const reflections: string[] = [];

        for (let t = 0; t < trials; t++) {
            const attempt = await this.attempt(task, [...memory, ...reflections]);
            const verdict = await this.critique(task, attempt);
            if (verdict.ok) {
                this.events.emit(EVENTS.REFLEXION_DONE, { trials: t + 1, ok: true });
                return { answer: attempt, trials: t + 1, reflections };
            }
            const reflection = await this.reflect(task, attempt, verdict.note);
            reflections.push(reflection);
            memory.push(reflection);
            if (memory.length > 10) memory.splice(0, memory.length - 10);
            await this.dal.kv.set(`reflexion/${kind}`, memory);
            this.events.emit(EVENTS.REFLEXION_TRIAL, { trial: t + 1, ok: false });
        }
        return {
            answer: `(unresolved after ${trials} trials) Last reflection: ${reflections[reflections.length - 1] ?? 'none'}`,
            trials,
            reflections,
        };
    }

    async reflections(taskKind?: string): Promise<string[]> {
        if (taskKind) return (await this.dal.kv.get<string[]>(`reflexion/${taskKind}`)) ?? [];
        const rows = await this.dal.kv.list('reflexion/');
        return rows.flatMap((r) => r.value as string[]).slice(-30);
    }

    private async attempt(task: string, reflections: string[]): Promise<string> {
        const preface = reflections.length > 0
            ? `Past reflections to avoid repeating mistakes:\n${reflections.map((r) => `- ${r.slice(0, 300)}`).join('\n')}\n`
            : '';
        if (this.tools) {
            try {
                const res = await this.tools.runWithTools(`${preface}Task: ${task}`, {
                    agentId: 'reflexion-actor',
                    maxRounds: 2,
                });
                if (res.output) return res.output;
            } catch (e) {
                LOGGER.warn('Reflexion', 'reflexion attempt failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Solve the task directly.' },
                        { role: 'user', content: `${preface}Task: ${task.slice(0, 3000)}` },
                    ],
                    { temperature: 0.5, maxTokens: 800 },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('Reflexion', 'reflexion llm failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return `[echo] ${task}`;
    }

    private async critique(task: string, attempt: string): Promise<{ ok: boolean; note: string }> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'You are a strict evaluator. Reply PASS or FAIL: <one-line reason>.' },
                        { role: 'user', content: `Task: ${task.slice(0, 1000)}\nAttempt:\n${attempt.slice(0, 3000)}` },
                    ],
                    { temperature: 0.1, maxTokens: 150 },
                );
                if (!res.error) {
                    const ok = /^pass\b/i.test(res.content.trim());
                    return { ok, note: res.content.trim().slice(0, 300) };
                }
            } catch (e) {
                LOGGER.warn('Reflexion', 'reflexion critique failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return { ok: attempt.length > 0 && !attempt.startsWith('[echo]'), note: 'offline heuristic' };
    }

    private async reflect(task: string, attempt: string, note: string): Promise<string> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Write a 2-sentence self-reflection: what went wrong and what to try differently.' },
                        { role: 'user', content: `Task: ${task.slice(0, 800)}\nAttempt: ${attempt.slice(0, 2000)}\nEvaluator: ${note}` },
                    ],
                    { temperature: 0.5, maxTokens: 200 },
                );
                if (!res.error) return res.content.trim().slice(0, 500);
            } catch (e) {
                LOGGER.warn('Reflexion', 'reflexion reflect failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return `Attempt failed (${note}); try a different approach next trial.`;
    }
}
