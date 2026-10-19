/**
 * LlmPersonaPort — LLM-backed IPersonaLlmPort (style distillation + summaries).
 */
import { describe, it, expect, vi } from 'vitest';
import { LlmPersonaPort } from './llm-task-executor';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { LongTermMemory } from '../../types/persona-types';

function fakeClient(content: string) {
    const chat = vi.fn(async (_messages: unknown[], _options?: unknown) => ({ content }));
    return { client: { chat } as unknown as ILLMClientService, chat };
}

function mem(content: string, tier: LongTermMemory['tier'] = 'core'): LongTermMemory {
    return { id: content, ownerId: 'o', tier, content, createdAt: 1, updatedAt: 1 };
}

describe('LlmPersonaPort', () => {
    it('parses distilled style JSON', async () => {
        const { client } = fakeClient('{"styleNotes":["terse"],"judgments":["skeptical"]}');
        const port = new LlmPersonaPort({ client });
        expect(await port.distillStyle(['a long sample text'])).toEqual({
            styleNotes: ['terse'],
            judgments: ['skeptical'],
        });
    });

    it('falls back to line-split on non-JSON output', async () => {
        const { client } = fakeClient('uses metaphors\ndirect tone');
        const port = new LlmPersonaPort({ client });
        const out = await port.distillStyle(['sample']);
        expect(out.styleNotes).toEqual(['uses metaphors', 'direct tone']);
        expect(out.judgments).toEqual([]);
    });

    it('short-circuits empty samples', async () => {
        const { client, chat } = fakeClient('x');
        const port = new LlmPersonaPort({ client });
        expect(await port.distillStyle([])).toEqual({ styleNotes: [], judgments: [] });
        expect(chat).not.toHaveBeenCalled();
    });

    it('summarizes memories through the client', async () => {
        const { client, chat } = fakeClient('compact profile');
        const port = new LlmPersonaPort({ client });
        expect(await port.summarizeMemories([mem('alpha'), mem('beta', 'archival')])).toBe(
            'compact profile',
        );
        const messages = chat.mock.calls[0]![0] as { role: string; content: string }[];
        expect(messages[0]!.role).toBe('system');
        expect(messages[1]!.content).toContain('[core] alpha');
        expect(messages[1]!.content).toContain('[archival] beta');
    });

    it('handles empty memory list without calling the client', async () => {
        const { client, chat } = fakeClient('x');
        const port = new LlmPersonaPort({ client });
        expect(await port.summarizeMemories([])).toBe('No long-term memories.');
        expect(chat).not.toHaveBeenCalled();
    });
});
