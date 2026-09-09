/**
 * SessionStateService — H.1 (Google ADK-style scopes + runners, additive).
 *
 * Scoped state (app/user/session) in DAL kv with delta writes and events.
 * ParallelAgents: fan-out N prompts through the LLM boundary + merge.
 * LoopAgent: repeat a body prompt until stop phrase or max iterations.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ISessionStateService } from '../../contracts/rivals3';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('SessionState');

type Scope = 'app' | 'user' | 'session';

export class SessionStateService implements ISessionStateService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    private key(scope: Scope, scopeId: string): string {
        return `sstate/${scope}/${scopeId}`;
    }

    async setState(scope: Scope, scopeId: string, key: string, value: unknown): Promise<void> {
        const k = this.key(scope, scopeId);
        const current = (await this.dal.kv.get<Record<string, unknown>>(k)) ?? {};
        current[key] = value;
        await this.dal.kv.set(k, current);
        this.events.emit(EVENTS.SESSION_DELTA, { scope, scopeId, key });
    }

    async getState(scope: Scope, scopeId: string): Promise<Record<string, unknown>> {
        return (await this.dal.kv.get<Record<string, unknown>>(this.key(scope, scopeId))) ?? {};
    }

    async runParallel(prompts: string[]): Promise<string[]> {
        if (prompts.length === 0) return [];
        const capped = prompts.slice(0, 6);
        if (!this.llm) return capped.map((p) => `[echo] ${p.slice(0, 200)}`);
        const results = await Promise.all(
            capped.map(async (p) => {
                try {
                    const res = await this.llm!.chat(
                        [
                            { role: 'system', content: 'Answer concisely.' },
                            { role: 'user', content: p.slice(0, 4000) },
                        ],
                        { temperature: 0.4, maxTokens: 600 },
                    );
                    return res.error ? `(error: ${res.error})` : res.content;
                } catch (e) {
                    return `(failed: ${e instanceof Error ? e.message : String(e)})`;
                }
            }),
        );
        return results;
    }

    async runLoop(body: string, maxIterations = 5, stopPhrase = '<LOOP_DONE>'): Promise<string> {
        const cap = Math.max(1, Math.min(15, maxIterations));
        let context = '';
        for (let i = 0; i < cap; i++) {
            const out = await this.single(`${body}\nProgress so far:\n${context.slice(-2000)}`);
            context += `\n[iter ${i + 1}] ${out.slice(0, 1000)}\n`;
            if (out.includes(stopPhrase)) return context.slice(-4000);
        }
        return context.slice(-4000);
    }

    private async single(prompt: string): Promise<string> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Loop body executor. Reply with <LOOP_DONE> when finished.' },
                        { role: 'user', content: prompt.slice(0, 4000) },
                    ],
                    { temperature: 0.4, maxTokens: 600 },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('loop body failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return `[echo] ${prompt.slice(0, 200)}`;
    }
}
