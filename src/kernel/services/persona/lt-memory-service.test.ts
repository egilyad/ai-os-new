/**
 * LtMemoryService tests — temporal validity of memory links (validFrom/validTo/observedAt).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LtMemoryService, isLinkValidAt } from './lt-memory-service';
import type { PersonaRepository } from '../../dal/persona-repository';
import type { LongTermMemory, MemoryLink } from '../../types/persona-types';
import type { IEventBus } from '../../types/interfaces';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function fakeRepo() {
    const memories = new Map<string, LongTermMemory>();
    const links = new Map<string, MemoryLink>();
    const repo = {
        putMemory: async (m: LongTermMemory) => {
            memories.set(m.id, { ...m });
        },
        getMemory: async (id: string) => (memories.has(id) ? { ...memories.get(id)! } : null),
        listMemories: async (ownerId: string) =>
            [...memories.values()].filter((m) => m.ownerId === ownerId).map((m) => ({ ...m })),
        deleteMemory: async (id: string) => {
            memories.delete(id);
        },
        putLink: async (l: MemoryLink) => {
            links.set(l.id, { ...l });
        },
        getLink: async (id: string) => (links.has(id) ? { ...links.get(id)! } : null),
        listLinks: async () => [...links.values()].map((l) => ({ ...l })),
    };
    return repo as unknown as PersonaRepository;
}

describe('LtMemoryService temporal links', () => {
    let svc: LtMemoryService;

    beforeEach(() => {
        const bus = { emit: vi.fn() } as unknown as IEventBus;
        svc = new LtMemoryService(fakeRepo(), bus);
    });

    it('stamps validFrom/observedAt and traverses neighbors', async () => {
        const a = await svc.remember({ ownerId: 'o', content: 'alpha node' });
        const b = await svc.remember({ ownerId: 'o', content: 'beta node' });
        const link = await svc.link(a.id, b.id, 'relates');
        expect(link.validFrom).toBeGreaterThan(0);
        expect(link.observedAt).toBeGreaterThan(0);
        expect(link.validTo).toBeNull();
        const nb = await svc.neighbors(a.id);
        expect(nb.map((m) => m.id)).toContain(b.id);
    });

    it('excludes expired links from traversal', async () => {
        const a = await svc.remember({ ownerId: 'o', content: 'alpha' });
        const b = await svc.remember({ ownerId: 'o', content: 'beta' });
        const link = await svc.link(a.id, b.id, 'relates');
        await svc.closeLink(link.id);
        expect(await svc.neighbors(a.id)).toHaveLength(0);
    });

    it('honors asOf for historical traversal', async () => {
        const a = await svc.remember({ ownerId: 'o', content: 'alpha' });
        const b = await svc.remember({ ownerId: 'o', content: 'beta' });
        await svc.link(a.id, b.id, 'relates', { validFrom: 1000, validTo: 2000 });
        expect(await svc.neighbors(a.id, 1, 1500)).toHaveLength(1);
        expect(await svc.neighbors(a.id, 1, 500)).toHaveLength(0);
        expect(await svc.neighbors(a.id, 1, 2500)).toHaveLength(0);
    });

    it('isLinkValidAt: favors createdAt when validFrom absent', () => {
        const link: MemoryLink = { id: 'l', fromId: 'a', toId: 'b', relation: 'relates', createdAt: 1000 };
        expect(isLinkValidAt(link, 999)).toBe(false);
        expect(isLinkValidAt(link, 1000)).toBe(true);
        expect(isLinkValidAt({ ...link, validTo: 1500 }, 1500)).toBe(false);
        expect(isLinkValidAt({ ...link, validTo: 1500 }, 1499)).toBe(true);
    });
});

describe('LtMemoryService associative recall (PPR)', () => {
    let svc: LtMemoryService;

    beforeEach(() => {
        const bus = { emit: vi.fn() } as unknown as IEventBus;
        svc = new LtMemoryService(fakeRepo(), bus);
    });

    async function seedGraph() {
        const a = await svc.remember({ ownerId: 'o', content: 'a' });
        const b = await svc.remember({ ownerId: 'o', content: 'b' });
        const c = await svc.remember({ ownerId: 'o', content: 'c' });
        const d = await svc.remember({ ownerId: 'o', content: 'd' });
        const ab = await svc.link(a.id, b.id, 'relates');
        await svc.link(b.id, c.id, 'relates');
        await svc.link(a.id, d.id, 'relates');
        return { a, b, c, d, ab };
    }

    it('ranks related memories by PPR and excludes the seed', async () => {
        const { a, b, c, d } = await seedGraph();
        const hits = await svc.associativeRecall(a.id, { limit: 3 });
        expect(hits.map((h) => h.memory.id)).toEqual([b.id, d.id, c.id]);
        expect(hits.every((h) => h.score > 0)).toBe(true);
    });

    it('respects temporal validity (closed links drop out)', async () => {
        const { a, d, ab } = await seedGraph();
        await svc.closeLink(ab.id);
        const hits = await svc.associativeRecall(a.id, { limit: 3 });
        expect(hits.map((h) => h.memory.id)).toEqual([d.id]);
    });
});
