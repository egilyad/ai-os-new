/**
 * SelfConsistencyService — M.2 (Wang et al., additive).
 *
 * Samples N reasoning paths at high temperature, normalizes answers
 * (trim/case/punctuation/whitespace), majority-votes; confidence = winning
 * share. Offline: single echo path, confidence 1.
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ISelfConsistencyService } from '../../contracts/rivals7';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('SelfCon');

function normalize(s: string): string {
    return s.trim().toLowerCase().replace(/[.,!?;:«»"'\s]+$/u, '').replace(/\s+/g, ' ');
}

export class SelfConsistencyService implements ISelfConsistencyService {
    constructor(
        private events: IEventBus,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async sample(task: string, n = 5): Promise<{ answer: string; confidence: number; votes: number }> {
        const count = Math.max(1, Math.min(11, n));
        const paths: string[] = [];
        if (this.llm) {
            const results = await Promise.all(
                Array.from({ length: count }, async () => {
                    try {
                        const res = await this.llm!.chat(
                            [
                                { role: 'system', content: 'Reason step by step, then give the final answer after "ANSWER:".' },
                                { role: 'user', content: task.slice(0, 3000) },
                            ],
                            { temperature: 0.9, maxTokens: 800 },
                        );
                        if (res.error) return '';
                        const m = res.content.match(/ANSWER:\s*([\s\S]+)/i);
                        return (m ? m[1]! : res.content).trim().slice(0, 1000);
                    } catch (e) {
                        LOGGER.warn('SelfCon', 'selfcon path failed', { error: e instanceof Error ? e.message : String(e) });
                        return '';
                    }
                }),
            );
            for (const r of results) {
                if (r) paths.push(r);
            }
        }
        if (paths.length === 0) {
            return { answer: `[echo] ${task.slice(0, 300)}`, confidence: 1, votes: 1 };
        }
        const buckets = new Map<string, { count: number; repr: string }>();
        for (const p of paths) {
            const key = normalize(p);
            const e = buckets.get(key) ?? { count: 0, repr: p };
            e.count += 1;
            buckets.set(key, e);
        }
        let best = { count: 0, repr: paths[0] as string };
        for (const b of buckets.values()) {
            if (b.count > best.count) best = b;
        }
        const confidence = Math.round((best.count / paths.length) * 100) / 100;
        this.events.emit(EVENTS.SELFCON_VOTE, { paths: paths.length, confidence });
        return { answer: best.repr, confidence, votes: best.count };
    }
}
