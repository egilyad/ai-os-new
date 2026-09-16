import { describe, it, expect } from 'vitest';
import { ShadowOpponentService } from './debate-shadow-opponent-service';

describe('ShadowOpponentService', () => {
    it('returns null for short draft', async () => {
        const svc = new ShadowOpponentService();
        const adapter = { sendMessage: async () => ({ content: 'strengthened' }) } as any;
        const res = await svc.strengthenArgument('short', 'prompt', 'alice', 'Alice', adapter, 'model', 'key', new AbortController().signal);
        expect(res).toBeNull();
    });
    it('returns null when aborted', async () => {
        const svc = new ShadowOpponentService();
        const adapter = { sendMessage: async () => ({ content: 'x' }) } as any;
        const ac = new AbortController(); ac.abort();
        const res = await svc.strengthenArgument('This is a long enough draft content that exceeds fifty characters for testing purpose.', 'prompt', 'alice', 'Alice', adapter, 'model', 'key', ac.signal);
        expect(res).toBeNull();
    });
    it('strengthens with mock adapter', async () => {
        const svc = new ShadowOpponentService();
        const adapter = {
            sendMessage: async () => ({ content: '=== CRITIQUE === weak === STRENGTHENED === improved content with more evidence' }),
        } as any;
        const draft = 'This is a sufficiently long draft argument about climate policy that needs strengthening and contains enough characters.';
        const res = await svc.strengthenArgument(draft, 'You are Alice, pro climate action', 'alice', 'Alice', adapter, 'model', 'key', new AbortController().signal, 'English');
        if (res) {
            expect(res).toHaveProperty('strengthenedContent');
            expect(res.originalContent).toBe(draft);
        } else {
            expect(res).toBeNull();
        }
    });
});
