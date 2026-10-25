import { describe, expect, it } from 'vitest';
import { MockAdapter } from './mock-adapter';
import { LLMError } from '../core/errors';

const msgs = [
    { role: 'user' as const, content: 'hello' },
    { role: 'assistant' as const, content: 'world' },
];

describe('MockAdapter', () => {
    it('echo mode returns role-prefixed content per line', async () => {
        const a = new MockAdapter({ mode: 'echo' });
        const res = await a.sendMessage(msgs, 'mock-model-v1', 'k');
        expect(res.content).toBe('[user] hello\n[assistant] world');
        expect(res.finishReason).toBe('STOP');
        expect(res.tokens).toBe(10);
    });

    it('preset mode returns the preset string', async () => {
        const a = new MockAdapter({ mode: 'preset', presetResponse: 'fixed answer' });
        const res = await a.sendMessage(msgs, 'mock-model-v1', 'k');
        expect(res.content).toBe('fixed answer');
    });

    it('error mode throws LLMError(500)', async () => {
        const a = new MockAdapter({ mode: 'error', failWith: 'boom' });
        await expect(a.sendMessage(msgs, 'mock-model-v1', 'k')).rejects.toBeInstanceOf(LLMError);
    });

    it('streamMessage emits words then terminal STOP', async () => {
        const a = new MockAdapter({ mode: 'echo' });
        const chunks: string[] = [];
        let meta: { finishReason?: string } | undefined;
        await a.streamMessage(msgs, 'mock-model-v1', 'k', (c, m) => {
            chunks.push(c);
            if (m?.finishReason) meta = m;
        });
        expect(chunks.join('')).toContain('[user] hello');
        expect(meta?.finishReason).toBe('STOP');
    });

    it('checkHealth respects healthStatus', async () => {
        const ok = new MockAdapter();
        expect((await ok.checkHealth('k')).status).toBe('active');
        const bad = new MockAdapter({ healthStatus: 'error' });
        expect((await bad.checkHealth('k')).status).toBe('error');
    });

    it('getAvailableModels returns configured models', async () => {
        const a = new MockAdapter({ models: ['m1', 'm2'] });
        expect(await a.getAvailableModels('k')).toEqual(['m1', 'm2']);
    });
});
