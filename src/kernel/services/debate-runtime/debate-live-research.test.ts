import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IGeminiResearchService } from '../../contracts/gemini-research';
import { getLiveResearchText, clearLiveResearchCache } from './debate-live-research';

function mockService(
    impl?: Partial<IGeminiResearchService> & { isAvailable?: boolean },
): IGeminiResearchService {
    return {
        isAvailable: true,
        enhancedSearch: async (query: string) => ({
            query,
            answer: 'Antioxidants neutralize free radicals in laboratory studies.',
            sources: [
                {
                    title: 'NIH review on antioxidants',
                    uri: 'https://nih.gov/antioxidants',
                    snippet: 'A comprehensive review of trial data.',
                    relevanceScore: 0.9,
                },
            ],
            confidence: 0.8,
            latency: 10,
        }),
        ...impl,
    } as unknown as IGeminiResearchService;
}

const base = {
    sessionId: 'sess-1',
    round: 2,
    topic: 'Do antioxidant supplements extend lifespan?',
    opponentSnippets: ['No trial shows mortality benefit in humans.'],
    language: 'English',
};

describe('getLiveResearchText (live web research per round)', () => {
    beforeEach(() => clearLiveResearchCache());

    it('returns undefined without a service, when unavailable, or before round 1', async () => {
        expect(await getLiveResearchText(undefined, base)).toBeUndefined();
        expect(
            await getLiveResearchText(mockService({ isAvailable: false }), base),
        ).toBeUndefined();
        expect(await getLiveResearchText(mockService(), { ...base, round: 0 })).toBeUndefined();
    });

    it('formats a compact block with query, summary, and linked sources', async () => {
        const text = await getLiveResearchText(mockService(), base);
        expect(text).toBeDefined();
        expect(text!).toContain('Query: Do antioxidant supplements extend lifespan?');
        expect(text!).toContain('free radicals');
        expect(text!).toContain('[NIH review on antioxidants](https://nih.gov/antioxidants)');
        expect(text!).toContain('Cite these sources as [title](url)');
    });

    it('searches once per round and shares the block (cache)', async () => {
        const search = vi.fn(async (query: string) => ({
            query,
            answer: 'a',
            sources: [{ title: 't', uri: 'https://x.example/a', snippet: 's', relevanceScore: 1 }],
            confidence: 1,
            latency: 1,
        }));
        const svc = mockService({ enhancedSearch: search });
        const first = await getLiveResearchText(svc, base);
        const second = await getLiveResearchText(svc, {
            ...base,
            opponentSnippets: ['different snippet, same round'],
        });
        expect(search).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('returns undefined on service errors and empty sources', async () => {
        const failing = mockService({
            enhancedSearch: async () => {
                throw new Error('boom');
            },
        });
        expect(await getLiveResearchText(failing, base)).toBeUndefined();
        const empty = mockService({
            enhancedSearch: async (query: string) => ({
                query,
                answer: 'nothing',
                sources: [],
                confidence: 0,
                latency: 1,
            }),
        });
        expect(await getLiveResearchText(empty, base)).toBeUndefined();
    });

    it('gives up on a hanging search (timeout)', async () => {
        const hanging = mockService({
            enhancedSearch: () => new Promise<never>(() => {}),
        });
        const text = await getLiveResearchText(hanging, { ...base, timeoutMs: 50 });
        expect(text).toBeUndefined();
    });
});
