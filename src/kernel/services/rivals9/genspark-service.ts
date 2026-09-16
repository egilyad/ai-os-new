/**
 * GensparkService — N.3 (multi-model fanout + sheets + long tasks).
 *
 * fanout: same prompt across N providers (per-call provider override),
 * then a synthesis pass. sheets: rows → RFC-4180 CSV download string.
 * longTask: enqueue crew/graph run, drain immediately, notify the inbox.
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IRunQueueService } from '../../contracts/rivals';
import type { IMobileAccessService } from '../../contracts/ops';
import type { IGensparkService } from '../../contracts/rivals9';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Genspark');

function csvCell(v: unknown): string {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export class GensparkService implements IGensparkService {
    constructor(
        private events: IEventBus,
        private llm?: ILLMClientService,
        private queue?: IRunQueueService,
        private inbox?: IMobileAccessService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Genspark', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async fanout(prompt: string, providers: string[] = ['deepseek', 'qwen', 'kimi']): Promise<{
        answers: string[];
        synthesis: string;
    }> {
        const list = providers.map((p) => p.trim()).filter((p) => p.length > 0).slice(0, 5);
        if (list.length === 0) throw new Error('Fanout needs at least 1 provider');
        const answers: string[] = [];
        if (this.llm) {
            const results = await Promise.all(
                list.map(async (provider) => {
                    try {
                        const res = await this.llm!.chat(
                            [
                                { role: 'system', content: 'Answer directly and completely.' },
                                { role: 'user', content: prompt.slice(0, 4000) },
                            ],
                            { provider, temperature: 0.5, maxTokens: 1000 },
                        );
                        return res.error ? `(error on ${provider}: ${res.error})` : res.content;
                    } catch (e) {
                        return `(failed on ${provider}: ${e instanceof Error ? e.message : String(e)})`;
                    }
                }),
            );
            answers.push(...results);
        } else {
            for (const p of list) answers.push(`[echo:${p}] ${prompt.slice(0, 200)}`);
        }
        let synthesis = answers[0] ?? '';
        if (this.llm && answers.length > 1) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Synthesize these model answers into one best answer. Keep citations of who said what.' },
                        {
                            role: 'user',
                            content: answers.map((a, i) => `[${list[i]}]: ${a.slice(0, 1500)}`).join('\n---\n'),
                        },
                    ],
                    { temperature: 0.3, maxTokens: 1500 },
                );
                if (!res.error) synthesis = res.content;
            } catch (e) {
                LOGGER.warn('Genspark', 'fanout synthesis failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        this.events.emit(EVENTS.GEN_FANOUT, { providers: list.length });
        return { answers, synthesis };
    }

    async sheets(rows: Array<Record<string, unknown>>): Promise<string> {
        if (rows.length === 0) return '';
        const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))].slice(0, 30);
        const lines = [headers.map(csvCell).join(',')];
        for (const row of rows.slice(0, 5000)) {
            lines.push(headers.map((h) => csvCell(row[h])).join(','));
        }
        this.events.emit(EVENTS.GEN_SHEETS, { rows: rows.length, cols: headers.length });
        return lines.join('\n');
    }

    async longTask(kind: 'crew' | 'graph', refId: string, notifyTitle = 'Long task done'): Promise<string> {
        if (!this.queue) throw new Error('Run queue unavailable');
        const item = await this.queue.enqueue(kind, refId, { via: 'genspark-longtask' });
        const done = await this.queue.drain(1);
        const mine = done.find((d) => d.id === item.id);
        const summary = `${kind}:${refId} → ${mine?.status ?? 'queued'} (${(mine?.result ?? '').slice(0, 200)})`;
        if (this.inbox) {
            try {
                await this.inbox.notify({ title: notifyTitle, body: summary.slice(0, 500), actionRef: `${kind}:${refId}` });
            } catch {
                // inbox best-effort
            }
        }
        this.events.emit(EVENTS.GEN_LONGTASK, { kind, refId, status: mine?.status ?? 'queued' });
        return summary;
    }
}
