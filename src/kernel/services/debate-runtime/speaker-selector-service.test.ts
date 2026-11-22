import { describe, it, expect } from 'vitest';
import { SpeakerSelectorService } from './speaker-selector-service';

const candidates = [
    { id: 'a1', name: 'Analyst', role: 'analysis' },
    { id: 'a2', name: 'Critic', role: 'critic' },
];

describe('SpeakerSelectorService', () => {
    it('returns the LLM-chosen valid speaker', async () => {
        const svc = new SpeakerSelectorService({
            chat: async () => ({
                content: 'Answer: {"speakerId":"a2","reason":"needs critique","confidence":0.8}',
            }),
        });
        const d = await svc.select({ topic: 'Design review', candidates, history: [] });
        expect(d?.speakerId).toBe('a2');
        expect(d?.reason).toBe('needs critique');
        expect(d?.confidence).toBeCloseTo(0.8);
    });

    it('rejects an unknown speaker id', async () => {
        const svc = new SpeakerSelectorService({
            chat: async () => ({ content: '{"speakerId":"ghost","reason":"x","confidence":1}' }),
        });
        expect(await svc.select({ topic: 'x', candidates, history: [] })).toBeNull();
    });

    it('returns null on empty candidates or malformed output', async () => {
        const svc = new SpeakerSelectorService({ chat: async () => ({ content: 'nonsense' }) });
        expect(await svc.select({ topic: 'x', candidates: [], history: [] })).toBeNull();
        expect(await svc.select({ topic: 'x', candidates, history: [] })).toBeNull();
    });
});
