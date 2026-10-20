import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryService } from './memory-engine';

interface WorkerMessage {
    requestId: string;
    type: string;
    payload?: Record<string, unknown>;
}

class FakeWorker {
    static instances: FakeWorker[] = [];
    posted: WorkerMessage[] = [];
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;

    constructor() {
        FakeWorker.instances.push(this);
    }

    postMessage(data: WorkerMessage): void {
        this.posted.push(data);
        const reply = (type: string, payload?: Record<string, unknown>): void => {
            queueMicrotask(() => {
                this.onmessage?.({
                    data: { requestId: data.requestId, type, payload },
                } as MessageEvent);
            });
        };
        switch (data.type) {
            case 'init':
                reply('init');
                break;
            case 'enable_semantic':
                reply('semantic_ready');
                break;
            case 'upsert': {
                const entry = data.payload?.['entry'] as { id?: string } | undefined;
                reply('upsert', { id: entry?.id, embedding: undefined });
                break;
            }
            case 'search_semantic':
                reply('search_semantic', { hits: [] });
                break;
            default:
                reply(data.type);
        }
    }

    terminate(): void {
        /* noop */
    }
}

function makeDatabase() {
    const table = {
        orderBy: () => ({
            reverse: () => ({
                limit: () => ({ toArray: async () => [] }),
            }),
        }),
        put: vi.fn(async () => {}),
        bulkPut: vi.fn(async () => {}),
        update: vi.fn(async () => 1),
        get: vi.fn(async () => undefined),
        delete: vi.fn(async () => {}),
        count: vi.fn(async () => 0),
        toArray: vi.fn(async () => []),
    };
    return { memories: table } as unknown as never;
}

function makeEventBus() {
    return {
        on: vi.fn(() => () => {}),
        onSafe: vi.fn(() => () => {}),
        emit: vi.fn(),
        emitOnce: vi.fn(),
    } as never;
}

describe('MemoryService provider embeddings', () => {
    const originalWorker = globalThis.Worker;

    beforeEach(() => {
        FakeWorker.instances = [];
        (globalThis as unknown as { Worker: unknown }).Worker = FakeWorker;
    });

    afterEach(() => {
        (globalThis as unknown as { Worker: unknown }).Worker = originalWorker;
    });

    it('sends provider vectors to the search worker', async () => {
        const embedder = {
            embed: vi.fn(async (texts: string[]) =>
                texts.map(() => [0.1, 0.2, 0.3]),
            ),
        };
        const service = new MemoryService({
            database: makeDatabase(),
            eventBus: makeEventBus(),
            getEmbedder: () => embedder,
        });

        await service.store({
            content: 'The deploy pipeline runs on Fridays',
            metadata: { source: 'test', type: 'note', timestamp: Date.now(), importance: 0.8 },
        });

        // let the worker handshake + upsert settle
        await new Promise((r) => setTimeout(r, 20));

        const worker = FakeWorker.instances[0];
        expect(worker).toBeDefined();
        const upsert = worker!.posted.find((m) => m.type === 'upsert');
        expect(upsert).toBeDefined();
        expect(upsert!.payload?.['vector']).toEqual([0.1, 0.2, 0.3]);
        expect(upsert!.payload?.['vectorSpace']).toBe('provider');
        expect(embedder.embed).toHaveBeenCalledWith(['The deploy pipeline runs on Fridays']);
        service.destroy();
    });

    it('falls back to hash vectors when no embedder is available', async () => {
        const service = new MemoryService({
            database: makeDatabase(),
            eventBus: makeEventBus(),
            getEmbedder: () => undefined,
        });

        await service.store({
            content: 'Offline memory entry without any provider',
            metadata: { source: 'test', type: 'note', timestamp: Date.now(), importance: 0.8 },
        });
        await new Promise((r) => setTimeout(r, 20));

        const worker = FakeWorker.instances[0];
        const upsert = worker!.posted.find((m) => m.type === 'upsert');
        expect(upsert).toBeDefined();
        expect(upsert!.payload?.['vector']).toBeUndefined();
        service.destroy();
    });

    it('keeps the hash path when the provider fails', async () => {
        const embedder = {
            embed: vi.fn(async () => {
                throw new Error('provider down');
            }),
        };
        const service = new MemoryService({
            database: makeDatabase(),
            eventBus: makeEventBus(),
            getEmbedder: () => embedder,
        });

        await service.store({
            content: 'Entry that cannot be embedded by the provider',
            metadata: { source: 'test', type: 'note', timestamp: Date.now(), importance: 0.8 },
        });
        await new Promise((r) => setTimeout(r, 20));

        const worker = FakeWorker.instances[0];
        const upsert = worker!.posted.find((m) => m.type === 'upsert');
        expect(upsert).toBeDefined();
        expect(upsert!.payload?.['vector']).toBeUndefined();
        service.destroy();
    });

    it('re-embeds existing entries with the provider model', async () => {
        const embedder = {
            embed: vi.fn(async (texts: string[]) => texts.map(() => [0.5, 0.5])),
            describe: () => ({ model: 'text-embedding-3-small' }),
        };
        const service = new MemoryService({
            database: makeDatabase(),
            eventBus: makeEventBus(),
            getEmbedder: () => embedder,
        });

        await service.store({
            content: 'Legacy entry stored with hash vectors only',
            metadata: { source: 'test', type: 'note', timestamp: Date.now(), importance: 0.8 },
        });
        await new Promise((r) => setTimeout(r, 20));

        const result = await service.backfillProviderEmbeddings();
        expect(result.failed).toBe(false);
        expect(result.embedded).toBe(1);

        const worker = FakeWorker.instances[0];
        const providerUpserts = worker!.posted.filter(
            (m) => m.type === 'upsert' && m.payload?.['vectorSpace'] === 'provider',
        );
        expect(providerUpserts.length).toBeGreaterThan(0);
        service.destroy();
    });

    it('reports failure when no embedder is configured', async () => {
        const service = new MemoryService({
            database: makeDatabase(),
            eventBus: makeEventBus(),
            getEmbedder: () => undefined,
        });
        const result = await service.backfillProviderEmbeddings();
        expect(result).toEqual({ embedded: 0, skipped: 0, failed: true });
        service.destroy();
    });
});
