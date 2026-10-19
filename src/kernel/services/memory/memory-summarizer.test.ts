/**
 * MemorySummarizer — LLM consolidation of recent mesh entries.
 */
import { describe, it, expect, vi } from 'vitest';
import { MemorySummarizer, MIN_SUMMARY_ENTRIES } from './memory-summarizer';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { MemoryEntry } from '../../types/memory-types';

function entry(id: string, content: string): MemoryEntry {
    return {
        id,
        content,
        metadata: { source: 'user', type: 'chat_query', timestamp: Date.now(), importance: 0.5 },
    };
}

function entries(n: number): MemoryEntry[] {
    return Array.from({ length: n }, (_, i) => entry(`e${i}`, `fact number ${i}`));
}

function fakeClient(result: { content?: string; error?: string } | Error) {
    const chat = vi.fn(async (_messages: unknown[], _options?: unknown) => {
        if (result instanceof Error) throw result;
        return result;
    });
    return { client: { chat } as unknown as ILLMClientService, chat };
}

describe('MemorySummarizer', () => {
    it('returns null without a client', async () => {
        const s = new MemorySummarizer();
        expect(await s.summarize(entries(10))).toBeNull();
    });

    it('skips when there is too little to summarize', async () => {
        const { client, chat } = fakeClient({ content: 'x' });
        const s = new MemorySummarizer(client);
        expect(await s.summarize(entries(MIN_SUMMARY_ENTRIES - 1))).toBeNull();
        expect(chat).not.toHaveBeenCalled();
    });

    it('summarizes entries through the client and trims output', async () => {
        const { client, chat } = fakeClient({ content: '  - alpha\n- beta  ' });
        const s = new MemorySummarizer(client);
        expect(await s.summarize(entries(MIN_SUMMARY_ENTRIES))).toBe('- alpha\n- beta');
        const messages = chat.mock.calls[0]![0] as { role: string; content: string }[];
        expect(messages[0]!.role).toBe('system');
        expect(messages[1]!.content).toContain('fact number 0');
        expect(messages[1]!.content).toContain('[user/chat_query; imp 0.50]');
    });

    it('returns null on client error or throw', async () => {
        const errored = fakeClient({ error: 'rate limited' });
        expect(await new MemorySummarizer(errored.client).summarize(entries(10))).toBeNull();

        const thrown = fakeClient(new Error('boom'));
        expect(await new MemorySummarizer(thrown.client).summarize(entries(10))).toBeNull();
    });
});
