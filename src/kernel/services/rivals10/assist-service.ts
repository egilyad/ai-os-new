/**
 * AssistService — P.2 (CCAI-style operator assist, additive).
 *
 * smartReplies (3 short options via LLM or templates), nextActions
 * (ranked candidates by overlap with context), surfaceKnowledge (top
 * knowledge hit). Pure helper — no persistence.
 */
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IKnowledgeService } from '../../contracts/parity';
import type { IAssistService } from '../../contracts/rivals10';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Assist');

const FALLBACK_REPLIES = [
    'Thanks — looking into this now.',
    'Could you share a bit more detail?',
    'Resolved on my side — please confirm.',
];

const ACTION_CATALOG = [
    'escalate to human',
    'search knowledge base',
    'open a ticket',
    'run diagnostics',
    'schedule a callback',
    'offer a refund',
];

function tokens(s: string): Set<string> {
    return new Set(s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2));
}

export class AssistService implements IAssistService {
    constructor(
        private llm?: ILLMClientService,
        private knowledge?: IKnowledgeService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async smartReplies(context: string): Promise<string[]> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Suggest exactly 3 short operator replies, one per line starting with "- ". Under 12 words each.' },
                        { role: 'user', content: context.slice(0, 2000) },
                    ],
                    { temperature: 0.5, maxTokens: 200 },
                );
                if (!res.error) {
                    const lines = res.content
                        .split('\n')
                        .map((l) => l.replace(/^-\s*/, '').trim())
                        .filter((l) => l.length > 0)
                        .slice(0, 3);
                    if (lines.length > 0) return lines;
                }
            } catch (e) {
                LOGGER.warn('smartReplies failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return [...FALLBACK_REPLIES];
    }

    async nextActions(context: string, candidates: string[] = ACTION_CATALOG): Promise<string[]> {
        const ctx = tokens(context);
        const scored = candidates.map((c) => {
            const ct = tokens(c);
            let hit = 0;
            for (const t of ct) if (ctx.has(t)) hit += 1;
            return { action: c, score: ct.size > 0 ? hit / ct.size : 0 };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 3).map((s) => s.action);
    }

    async surfaceKnowledge(context: string): Promise<string> {
        if (!this.knowledge) return '(no knowledge backend)';
        const hits = await this.knowledge.retrieve(context, 2);
        if (hits.length === 0) return 'No relevant knowledge.';
        return hits.map((h) => `[${h.title}] ${h.chunk.slice(0, 400)}`).join('\n---\n');
    }
}
