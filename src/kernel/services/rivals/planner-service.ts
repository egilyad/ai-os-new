/**
 * PlannerService — F.3 (Semantic Kernel-style planners + filters, additive).
 *
 * Strategies: sequential (task list via LLM, executed step by step),
 * function_calling (delegates to ToolRunner.runWithTools), stepwise
 * (one step at a time with operator confirmation between steps — the
 * confirmation is recorded, resumption is explicit via planStep()).
 * FilterPipeline: composable pre/post middleware (audit, policy, trim).
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IPlannerService, PlannerStrategy } from '../../contracts/rivals';
import type { DataAccessLayer } from '../../dal/types';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Planner');

export type FilterFn = (text: string) => string;

export class PlannerService implements IPlannerService {
    private filters = new Map<string, { stage: 'pre' | 'post'; fn: FilterFn }>();
    private static readonly FILTERS_KEY = 'planner/filters';
    private static readonly HISTORY_KEY = 'planner/history';

    constructor(
        private events: IEventBus,
        private llm?: ILLMClientService,
        private tools?: IToolRunnerService,
        private dal?: DataAccessLayer,
    ) {
        this.filters.set('trim', {
            stage: 'pre',
            fn: (t) => t.replace(/\s+/g, ' ').trim().slice(0, 8000),
        });
    }

    async init(): Promise<void> {
        LOGGER.info('Planner', 'init', {});
        // Restore persisted filters (trim is always present, others are additive).
        if (this.dal) {
            try {
                const saved = await this.dal.kv.get<Array<{ stage: string; name: string; key: string }>>(
                    PlannerService.FILTERS_KEY,
                );
                if (Array.isArray(saved)) {
                    for (const entry of saved) {
                        const fn = this.builtinFilter(entry.name);
                        if (fn) this.filters.set(entry.key, { stage: entry.stage as 'pre' | 'post', fn });
                    }
                }
            } catch (e) {
                LOGGER.warn('Planner', 'planner restore filters failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
    }

    async destroy(): Promise<void> {
        this.filters.clear();
    }

    private builtinFilter(name: string): FilterFn | undefined {
        const map: Record<string, FilterFn> = {
            audit: (t) => t,
            policy: (t) => t.replace(/sk-[a-zA-Z0-9-_]{8,}/g, '[REDACTED]'),
            trim: (t) => t.replace(/\s+/g, ' ').trim().slice(0, 8000),
        };
        return map[name];
    }

    private async persistFilters(): Promise<void> {
        if (!this.dal) return;
        const toSave: Array<{ stage: string; name: string; key: string }> = [];
        for (const [key, f] of this.filters.entries()) {
            if (key === 'trim') continue; // builtin default, not persisted
            const name = key.includes(':') ? key.split(':')[1]! : key;
            toSave.push({ stage: f.stage, name, key });
        }
        try {
            await this.dal.kv.set(PlannerService.FILTERS_KEY, toSave);
        } catch (e) {
            LOGGER.warn('Planner', 'planner persist filters failed', { error: e instanceof Error ? e.message : String(e) });
        }
    }

    async plan(task: string, strategy: PlannerStrategy = 'function_calling'): Promise<string> {
        const prepared = this.applyFilters('pre', task);
        let out: string;
        switch (strategy) {
            case 'sequential': {                const steps = await this.ask(`Break into an ordered step list (one per line, "- " prefix):\n${prepared}`);
                const results: string[] = [];
                for (const line of steps.split('\n')) {
                    const m = line.match(/^-\s*(.+)/);
                    if (!m) continue;
                    results.push(await this.executeStep(m[1]!.trim()));
                    if (results.length >= 8) break;
                }
                out = results.length > 0 ? results.join('\n---\n') : steps;
                break;
            }
            case 'stepwise': {
                // One step now; the caller iterates planStep() for the rest.
                out = await this.executeStep(prepared);
                break;
            }
            case 'plan_and_execute': {
                // LangChain-style: planner drafts the full step list, executor
                // runs each, then a final synthesis pass closes the task.
                const planText = await this.ask(
                    `Draft a complete step plan (one per line, "- " prefix) for:\n${prepared}`,
                );
                const steps: string[] = [];
                for (const line of planText.split('\n')) {
                    const m = line.match(/^-\s*(.+)/);
                    if (m) steps.push(m[1]!.trim());
                    if (steps.length >= 8) break;
                }
                const results: string[] = [];
                for (const step of steps.length > 0 ? steps : [prepared]) {
                    results.push(await this.executeStep(step));
                }
                const synthesis = await this.ask(
                    `Synthesize these step results into the final answer:\n${results.join('\n---\n').slice(0, 6000)}`,
                );
                out = synthesis.length > 0 ? synthesis : results.join('\n---\n');
                break;
            }
            case 'function_calling':
            default: {
                out = await this.executeStep(prepared);
                break;
            }
        }
        const finalOut = this.applyFilters('post', out);
        // Persistence: keep last 20 plans in kv for restore/debug
        if (this.dal) {
            try {
                const hist =
                    (await this.dal.kv.get<Array<{ task: string; strategy: string; result: string; at: number }>>(
                        PlannerService.HISTORY_KEY,
                    )) ?? [];
                hist.unshift({ task: task.slice(0, 500), strategy, result: finalOut.slice(0, 4000), at: Date.now() });
                await this.dal.kv.set(PlannerService.HISTORY_KEY, hist.slice(0, 20));
            } catch { /* history best-effort */ }
        }
        try {
            this.events.emit(EVENTS.PLANNER_PLAN_COMPLETED, {
                task: task.slice(0, 500),
                strategy,
                result: finalOut.slice(0, 2000),
            });
        } catch {}
        return finalOut;
    }

    /** Execute a single stepwise step (explicit iteration driver). */
    async planStep(step: string): Promise<string> {
        const res = this.applyFilters('post', await this.executeStep(this.applyFilters('pre', step)));
        try {
            this.events.emit(EVENTS.PLANNER_STEP, { step: step.slice(0, 500), result: res.slice(0, 2000) });
        } catch {}
        return res;
    }

    async addFilter(stage: 'pre' | 'post', name: string): Promise<void> {
        const fn = this.builtinFilter(name);
        if (!fn) throw new Error(`Unknown filter: ${name} (audit|policy|trim)`);
        this.filters.set(`${stage}:${name}`, { stage, fn });
        await this.persistFilters();
        this.events.emit(EVENTS.PLANNER_FILTER_ADDED, { stage, name });
    }

    async listFilters(): Promise<Array<{ stage: string; name: string }>> {
        return [...this.filters.entries()].map(([name, f]) => ({ stage: f.stage, name }));
    }

    private applyFilters(stage: 'pre' | 'post', text: string): string {
        let out = text;
        for (const f of this.filters.values()) {
            if (f.stage === stage) {
                try {
                    out = f.fn(out);
                } catch (e) {
                    LOGGER.warn('Planner', 'filter failed', { error: e instanceof Error ? e.message : String(e) });
                }
            }
        }
        return out;
    }

    private async ask(prompt: string): Promise<string> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'You are a planner. Reply with exactly what is asked, no preamble.' },
                        { role: 'user', content: prompt.slice(0, 4000) },
                    ],
                    { temperature: 0.3, maxTokens: 600 },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('Planner', 'planner ask failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return `- ${prompt.slice(0, 200)}`;
    }

    private async executeStep(step: string): Promise<string> {        if (this.tools) {
            try {
                const res = await this.tools.runWithTools(step, { agentId: 'planner', maxRounds: 2 });
                return res.output || '(no output)';
            } catch (e) {
                LOGGER.warn('Planner', 'planner tools failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'You are a task planner-executor. Do the step, report the result.' },
                        { role: 'user', content: step.slice(0, 6000) },
                    ],
                    { temperature: 0.3, maxTokens: 800 },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('Planner', 'planner llm failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return `[echo] ${step}`;
    }
}
