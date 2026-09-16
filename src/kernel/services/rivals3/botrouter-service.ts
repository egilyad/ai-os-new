/**
 * BotRouterService — H.3 (Botpress-style autonomous routing + analytics).
 *
 * The LLM picks the next node from an explicit candidate list (JSON vote);
 * offline fallback is deterministic rotation. Node hits persist in DAL kv
 * for funnel-style analytics. `kbAnswer()` delegates to RagService.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IRagService } from '../../contracts/rivals2';
import type { IBotRouterService } from '../../contracts/rivals3';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('BotRouter');

export class BotRouterService implements IBotRouterService {
    private cursor = 0;

    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private llm?: ILLMClientService,
        private rag?: IRagService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async route(candidates: string[], context: string): Promise<string> {
        if (candidates.length === 0) throw new Error('No routing candidates');
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content: `Pick the next node. Reply with EXACTLY one of: ${candidates.join(' | ')}`,
                        },
                        { role: 'user', content: context.slice(0, 2000) },
                    ],
                    { temperature: 0.1, maxTokens: 40 },
                );
                if (!res.error) {
                    const pick = candidates.find((c) => res.content.includes(c));
                    if (pick) {
                        await this.recordNode(pick);
                        return pick;
                    }
                }
            } catch (e) {
                LOGGER.warn('route failed, rotation fallback', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        const pick = candidates[this.cursor++ % candidates.length] as string;
        await this.recordNode(pick);
        return pick;
    }

    async recordNode(nodeId: string): Promise<void> {
        const key = `botnodes/${nodeId}`;
        const hits = ((await this.dal.kv.get<number>(key)) ?? 0) + 1;
        await this.dal.kv.set(key, hits);
        this.events.emit(EVENTS.BOTROUTE_NODE, { nodeId, hits });
    }

    async analytics(): Promise<Array<{ nodeId: string; hits: number }>> {
        const rows = await this.dal.kv.list('botnodes/');
        return rows
            .map((r) => ({ nodeId: r.id.replace(/^botnodes\//, ''), hits: r.value as number }))
            .sort((a, b) => b.hits - a.hits);
    }

    async kbAnswer(query: string): Promise<string> {
        if (!this.rag) return '(no KB backend)';
        const res = await this.rag.answer(query, 0);
        return res.answer;
    }
}
