/**
 * RagService — G.1 (LlamaIndex-style agentic RAG loop, additive).
 *
 * answer(): rewrite query → retrieve → synthesize → critique → refine
 * (up to N rounds). Citations ride along from KnowledgeService hits.
 * Offline: single retrieve + extractive summary.
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IKnowledgeService } from '../../contracts/parity';
import type { IRagService } from '../../contracts/rivals2';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('RagLoop');

export class RagService implements IRagService {
    constructor(
        private events: IEventBus,
        private knowledge?: IKnowledgeService,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async answer(query: string, refineRounds = 1): Promise<{
        answer: string;
        citations: string[];
        rounds: number;
    }> {
        const rounds = Math.max(0, Math.min(2, refineRounds));
        const rewritten = await this.rewrite(query);
        let hits = await this.retrieve(rewritten);
        let draft = await this.synthesize(query, hits);
        let done = 0;
        for (let r = 0; r < rounds; r++) {
            const verdict = await this.critique(query, draft);
            done = r + 1;
            if (/sufficient/i.test(verdict)) break;
            hits = await this.retrieve(`${rewritten} ${verdict.slice(0, 120)}`);
            draft = await this.synthesize(query, hits);
        }
        const citations = [...new Set(hits.map((h) => h.title))];
        this.events.emit(EVENTS.RAG_ANSWERED, { citations: citations.length, rounds: done });
        return { answer: draft, citations, rounds: done };
    }

    private async rewrite(query: string): Promise<string> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Rewrite the user query as a precise retrieval query. Reply with the query only.' },
                        { role: 'user', content: query.slice(0, 1000) },
                    ],
                    { temperature: 0.2, maxTokens: 120 },
                );
                if (!res.error && res.content.trim()) return res.content.trim().slice(0, 500);
            } catch (e) {
                LOGGER.warn('rewrite failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return query;
    }

    private async retrieve(query: string): Promise<Array<{ title: string; chunk: string }>> {
        if (!this.knowledge) return [];
        try {
            return await this.knowledge.retrieve(query, 5);
        } catch (e) {
            LOGGER.warn('retrieve failed', { error: e instanceof Error ? e.message : String(e) });
            return [];
        }
    }

    private async synthesize(query: string, hits: Array<{ title: string; chunk: string }>): Promise<string> {
        if (hits.length === 0) return `No knowledge found for: ${query.slice(0, 200)}`;
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Answer the question using ONLY the passages. Cite [n] after each claim.' },
                        {
                            role: 'user',
                            content:
                                `Q: ${query.slice(0, 500)}\nPassages:\n` +
                                hits.map((h, i) => `[${i + 1}] ${h.title}: ${h.chunk.slice(0, 600)}`).join('\n'),
                        },
                    ],
                    { temperature: 0.3, maxTokens: 800 },
                );
                if (!res.error) return res.content;
            } catch (e) {
                LOGGER.warn('synthesize failed, extractive fallback', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        return (
            `Answer for "${query.slice(0, 160)}" from ${hits.length} passage(s):\n` +
            hits.map((h, i) => `[${i + 1}] ${h.title}: ${h.chunk.slice(0, 400)}`).join('\n')
        );
    }

    private async critique(query: string, draft: string): Promise<string> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content: 'You judge RAG answers. Reply SUFFICIENT or MISSING: <what is missing>.',
                        },
                        { role: 'user', content: `Q: ${query.slice(0, 500)}\nA: ${draft.slice(0, 2000)}` },
                    ],
                    { temperature: 0.2, maxTokens: 150 },
                );
                if (!res.error) return res.content.trim().slice(0, 300);
            } catch (e) {
                LOGGER.warn('critique failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return 'SUFFICIENT';
    }
}
