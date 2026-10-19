/**
 * ServiceBackedMemoryStore.consolidate — duplicate merge + Ebbinghaus forgetting.
 */
import { describe, it, expect, vi } from 'vitest';
import { ServiceBackedMemoryStore } from './service-backed-memory';
import { MemoryStoreType } from '../../contracts/memory-store';
import type { MemoryEntry } from '../../types/memory-types';
import type { MemoryService } from '../memory-engine';

const DAY = 24 * 3_600_000;

function entry(
    id: string,
    content: string,
    importance: number,
    timestamp: number,
): MemoryEntry {
    return {
        id,
        content,
        metadata: { source: 'user', type: 'episodic', timestamp, importance },
    };
}

function fakeService(memories: MemoryEntry[]): MemoryService {
    return {
        memories,
        deleteMemory: vi.fn(async (id: string) => {
            const idx = memories.findIndex((m) => m.id === id);
            if (idx >= 0) memories.splice(idx, 1);
        }),
    } as unknown as MemoryService;
}

describe('ServiceBackedMemoryStore.consolidate', () => {
    it('merges duplicates and forgets decayed low-importance memories', async () => {
        const now = Date.now();
        const stale = entry('stale', 'stale low value note', 0.1, now - 365 * DAY);
        const important = entry('important', 'critical decision record', 0.9, now - 365 * DAY);
        const dupLow = entry('dup-low', 'duplicated insight', 0.2, now - DAY);
        const dupHigh = entry('dup-high', 'duplicated insight', 0.7, now - DAY);
        const memories = [stale, important, dupLow, dupHigh];
        const svc = fakeService(memories);
        const store = new ServiceBackedMemoryStore(MemoryStoreType.EPISODIC, () => svc);

        const report = await store.consolidate();

        expect(report.entriesForgotten).toBe(1);
        expect(report.entriesConsolidated).toBe(1);
        const ids = memories.map((m) => m.id).sort();
        expect(ids).toEqual(['dup-high', 'important']);
    });

    it('returns an empty report without a memory service', async () => {
        const store = new ServiceBackedMemoryStore(MemoryStoreType.EPISODIC, () => undefined);
        const report = await store.consolidate();
        expect(report.entriesForgotten).toBe(0);
        expect(report.entriesConsolidated).toBe(0);
    });
});
