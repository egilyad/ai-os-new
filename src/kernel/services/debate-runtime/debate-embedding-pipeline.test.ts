import { describe, it, expect } from 'vitest';
import { DebateEmbeddingPipeline } from './debate-embedding-pipeline';
import { DebateRAGRetriever } from './debate-rag-retriever';
import type { MemoryUnit } from './debate-memory-extractor';

// Deterministic toy embeddings: identical texts → cosine 1.0.
async function embedText(text: string): Promise<Float32Array> {
    let h1 = 0;
    let h2 = 0;
    for (const ch of text) {
        h1 = (h1 + ch.charCodeAt(0)) % 97;
        h2 = (h2 * 31 + ch.charCodeAt(0)) % 89;
    }
    return new Float32Array([h1 / 97, h2 / 89, 0.5]);
}

function unit(over: Partial<MemoryUnit> = {}): MemoryUnit {
    return {
        id: 'u1',
        sessionId: 's1',
        type: 'argument',
        content: 'nuclear baseload electricity generation capacity',
        agentId: 'ag1',
        round: 1,
        confidence: 0.8,
        relatedUnitIds: [],
        metadata: {},
        extractedAt: 1000,
        ...over,
    };
}

function fakeStore() {
    const kv = new Map<string, unknown>();
    return {
        kv,
        config: {
            get: async <T,>(key: string): Promise<T | null> =>
                (kv.has(key) ? (kv.get(key) as T) : null),
            set: async <T,>(key: string, value: T): Promise<void> => {
                kv.set(key, value);
            },
        },
    };
}

describe('DebateEmbeddingPipeline P4 (fed index, persisted chunks)', () => {
    it('processMemoryUnits → searchSimilar round-trip', async () => {
        const pipeline = new DebateEmbeddingPipeline({ embedText });
        const n = await pipeline.processMemoryUnits('s1', [unit()]);
        expect(n).toHaveLength(1);
        const hits = await pipeline.searchSimilar(
            'nuclear baseload electricity generation capacity',
            5,
            's1',
        );
        expect(hits).toHaveLength(1);
        expect(hits[0]!.score).toBeCloseTo(1.0, 3);
    });

    it('caps chunks per session', async () => {
        const pipeline = new DebateEmbeddingPipeline({ embedText });
        const units = Array.from({ length: 5 }, (_, i) =>
            unit({ id: `u${i}`, content: `claim number ${i} about energy policy today` }),
        );
        // Feed beyond the cap in small batches.
        for (let b = 0; b < 45; b++) {
            await pipeline.processMemoryUnits(
                's1',
                units.map((u) => ({ ...u, id: `${u.id}-b${b}` })),
            );
        }
        expect(pipeline.getSessionChunks('s1').length).toBeLessThanOrEqual(200);
        expect(pipeline.getStats().totalSessions).toBe(1);
    });

    it('persists chunks across instances via the store', async () => {
        const store = fakeStore();
        const first = new DebateEmbeddingPipeline({ embedText, store });
        await first.init();
        await first.processMemoryUnits('s1', [unit()]);
        const second = new DebateEmbeddingPipeline({ embedText, store });
        await second.init();
        expect(second.getSessionChunks('s1')).toHaveLength(1);
        expect(second.getSessionChunks('s1')[0]!.text).toContain('nuclear baseload');
    });

    it('works memory-only without a store', async () => {
        const pipeline = new DebateEmbeddingPipeline({ embedText });
        await pipeline.init();
        await pipeline.processMemoryUnits('s1', [unit()]);
        expect(pipeline.getSessionChunks('s1')).toHaveLength(1);
    });
});

describe('DebateRAGRetriever P4 (indexUnits + injection)', () => {
    it('indexUnits feeds retrieval and prompt injection', async () => {
        const pipeline = new DebateEmbeddingPipeline({ embedText });
        const retriever = new DebateRAGRetriever({ embeddingPipeline: pipeline });
        expect(await retriever.indexUnits('s1', [])).toBe(0);
        const count = await retriever.indexUnits('s1', [unit()]);
        expect(count).toBe(1);

        const ctx = await retriever.retrieveRelevantDebates(
            'nuclear baseload electricity generation capacity',
            's1',
        );
        expect(ctx.chunks.length).toBeGreaterThan(0);

        const prompt = await retriever.injectMemoryIntoDebate(
            's1',
            'nuclear baseload electricity generation capacity',
            'base prompt',
        );
        expect(prompt).toContain('base prompt');
        expect(prompt).toContain('[Memory 1 from this debate]');
        expect(prompt).toContain('<external_data>');
    });

    it('leaves the prompt untouched when the index is empty', async () => {
        const pipeline = new DebateEmbeddingPipeline({ embedText });
        const retriever = new DebateRAGRetriever({ embeddingPipeline: pipeline });
        expect(await retriever.injectMemoryIntoDebate('s1', 'anything', 'base')).toBe('base');
    });

    it('rehydrates persisted chunks across instances (lazy init wiring)', async () => {
        const store = fakeStore();
        const first = new DebateRAGRetriever({
            embeddingPipeline: new DebateEmbeddingPipeline({ embedText, store }),
        });
        await first.indexUnits('s1', [unit()]);

        const second = new DebateRAGRetriever({
            embeddingPipeline: new DebateEmbeddingPipeline({ embedText, store }),
        });
        const ctx = await second.retrieveRelevantDebates(
            'nuclear baseload electricity generation capacity',
            's2',
        );
        expect(ctx.chunks.length).toBeGreaterThan(0);
        expect(ctx.chunks[0]!.chunk.sessionId).toBe('s1');
        expect(ctx.chunks[0]!.source).toBe('similar_debate');
    });
});
