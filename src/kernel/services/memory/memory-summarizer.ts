/**
 * MemorySummarizer — LLM pass over the memory mesh that condenses recent
 * entries into one durable summary entry (used by nightly consolidation).
 *
 * Returns null when no client is wired or there is too little to summarize, so
 * the offline path simply skips summarization instead of fabricating text.
 */

import type { AdapterMessage, ILLMClientService } from '../../contracts/provider-adapter';
import type { MemoryEntry } from '../../types/memory-types';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('MemorySummarizer');

export const MIN_SUMMARY_ENTRIES = 6;
const MAX_INPUT_ENTRIES = 60;
const MAX_ENTRY_CHARS = 400;
const MAX_SUMMARY_CHARS = 2000;

export interface MemorySummarizerOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export class MemorySummarizer {
    constructor(
        private client?: ILLMClientService,
        private options: MemorySummarizerOptions = {},
    ) {}

    async summarize(entries: MemoryEntry[]): Promise<string | null> {
        if (!this.client || entries.length < MIN_SUMMARY_ENTRIES) return null;

        const lines = entries.slice(0, MAX_INPUT_ENTRIES).map((e) => {
            const importance = (e.metadata.importance ?? 0.5).toFixed(2);
            const content = e.content.replace(/\s+/g, ' ').trim().slice(0, MAX_ENTRY_CHARS);
            return `- [${e.metadata.source}/${e.metadata.type}; imp ${importance}] ${content}`;
        });
        const messages: AdapterMessage[] = [
            {
                role: 'system',
                content:
                    'You are a memory consolidation engine. Merge the entries into one compact, ' +
                    'durable summary. Preserve concrete facts, decisions, preferences and open ' +
                    'questions; drop small talk and duplicates. Reply with bullet points only, ' +
                    'no preamble, at most 12 bullets.',
            },
            { role: 'user', content: lines.join('\n') },
        ];

        try {
            const res = await this.client.chat(messages, {
                model: this.options.model,
                temperature: this.options.temperature ?? 0.3,
                maxTokens: this.options.maxTokens ?? 600,
                cacheScope: { role: 'memory-summary' },
            });
            if (res.error) {
                LOGGER.warn('MemorySummarizer', 'llm summarize failed', { error: res.error });
                return null;
            }
            const text = (res.content ?? '').trim();
            return text ? text.slice(0, MAX_SUMMARY_CHARS) : null;
        } catch (e) {
            LOGGER.warn('MemorySummarizer', 'llm summarize threw', {
                error: e instanceof Error ? e.message : String(e),
            });
            return null;
        }
    }
}
