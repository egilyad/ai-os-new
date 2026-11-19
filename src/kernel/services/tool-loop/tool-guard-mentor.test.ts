import { describe, it, expect, vi } from 'vitest';
import { createToolGuardMentor, fallbackMentorText } from './tool-guard-mentor';
import type { ILLMClientService } from '../../contracts/provider-adapter';

const client = (content: string): ILLMClientService =>
    ({
        chat: vi.fn().mockResolvedValue({ content, error: undefined }),
    }) as unknown as ILLMClientService;

const ctx = {
    kind: 'same-tool' as const,
    name: 'workspace.read',
    count: 3,
    userPrompt: 'read the file',
    recentCalls: [
        { name: 'workspace.read', args: {}, ok: true, output: 'x' },
        { name: 'workspace.read', args: {}, ok: true, output: 'x' },
        { name: 'workspace.read', args: {}, ok: true, output: 'x' },
    ],
};

describe('fallbackMentorText', () => {
    it('produces the deterministic guidance for same-tool', () => {
        expect(fallbackMentorText(ctx)).toContain('workspace.read');
        expect(fallbackMentorText(ctx)).toContain('3 times in a row');
    });

    it('produces the deterministic guidance for total-calls', () => {
        expect(
            fallbackMentorText({ kind: 'total-calls', count: 8, userPrompt: '', recentCalls: [] }),
        ).toContain('8 tool calls');
    });
});

describe('createToolGuardMentor', () => {
    it('calls the LLM client and returns its guidance', async () => {
        const chat = vi
            .fn()
            .mockResolvedValue({ content: 'mentor: try another approach', error: undefined });
        const mentor = createToolGuardMentor({
            client: { chat } as unknown as ILLMClientService,
        });
        const text = await mentor(ctx);
        expect(text).toBe('mentor: try another approach');
        expect(chat).toHaveBeenCalledTimes(1);
        const [messages] = chat.mock.calls[0]!;
        expect(messages[0]!.role).toBe('system');
        expect(messages[1]!.role).toBe('user');
        expect(messages[1]!.content).toContain('workspace.read');
    });

    it('falls back when the client returns an error', async () => {
        const mentor = createToolGuardMentor({
            client: { chat: vi.fn().mockResolvedValue({ content: '', error: 'boom' }) } as never,
        });
        const text = await mentor(ctx);
        expect(text).toContain('loop guard');
    });

    it('falls back when the client throws', async () => {
        const mentor = createToolGuardMentor({
            client: { chat: vi.fn().mockRejectedValue(new Error('network')) } as never,
        });
        const text = await mentor(ctx);
        expect(text).toContain('loop guard');
    });

    it('falls back when the client returns an empty answer', async () => {
        const mentor = createToolGuardMentor({ client: client('   ') });
        const text = await mentor(ctx);
        expect(text).toContain('loop guard');
    });

    it('works without an LLM client (pure fallback)', async () => {
        const mentor = createToolGuardMentor();
        const text = await mentor(ctx);
        expect(text).toContain('workspace.read');
    });
});
