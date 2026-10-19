/**
 * MemoryOrchestrator.summarizeRecent — nightly LLM consolidation into a
 * `consolidation_summary` entry, with cooldown/dedupe and retention of the
 * newest few summaries.
 */
import { describe, it, expect, vi } from 'vitest';
import { MemoryOrchestrator, CONSOLIDATION_SUMMARY_TYPE } from './memory-orchestrator';
import type { MemoryService } from './memory-engine';
import type { MemoryEntry } from '../types/memory-types';

const HOUR = 60 * 60 * 1000;

function entry(
    id: string,
    type: string,
    timestamp: number,
    content = `note ${id}`,
): MemoryEntry {
    return {
        id,
        content,
        metadata: { source: type === CONSOLIDATION_SUMMARY_TYPE ? 'summary' : 'user', type, timestamp, importance: 0.5 },
    };
}

function recent(n: number): MemoryEntry[] {
    const now = Date.now();
    return Array.from({ length: n }, (_, i) => entry(`r${i}`, 'chat_query', now - i * 1000));
}

function setup(initial: MemoryEntry[], summaryText: string | null = 'SUMMARY') {
    const store = vi.fn(async (_entry: Omit<MemoryEntry, 'id'>) => {});
    const deleteMemory = vi.fn(async (_id: string) => {});
    const svc = {
        getMemories: (limit?: number) => initial.slice(0, limit ?? initial.length),
        store,
        deleteMemory,
    } as unknown as MemoryService;
    const summarizer = { summarize: vi.fn(async () => summaryText) };
    const orch = new MemoryOrchestrator(() => svc, () => summarizer);
    return { orch, store, deleteMemory, summarizer };
}

describe('MemoryOrchestrator.summarizeRecent', () => {
    it('stores an LLM summary of recent entries', async () => {
        const { orch, store } = setup(recent(8));
        expect(await orch.summarizeRecent()).toBe(true);
        const stored = store.mock.calls[0]![0];
        expect(stored.content).toBe('SUMMARY');
        expect(stored.metadata.type).toBe(CONSOLIDATION_SUMMARY_TYPE);
        expect(stored.metadata.source).toBe('summary');
    });

    it('skips below the entry threshold', async () => {
        const { orch, store, summarizer } = setup(recent(3));
        expect(await orch.summarizeRecent()).toBe(false);
        expect(summarizer.summarize).not.toHaveBeenCalled();
        expect(store).not.toHaveBeenCalled();
    });

    it('respects the cooldown of an existing summary', async () => {
        const now = Date.now();
        const existing = entry('s0', CONSOLIDATION_SUMMARY_TYPE, now - HOUR, 'OLD');
        const { orch, store } = setup([...recent(8), existing]);
        expect(await orch.summarizeRecent()).toBe(false);
        expect(store).not.toHaveBeenCalled();
    });

    it('skips when the summary text is unchanged', async () => {
        const now = Date.now();
        const existing = entry('s0', CONSOLIDATION_SUMMARY_TYPE, now - 10 * HOUR, 'SUMMARY');
        const { orch, store } = setup([...recent(8), existing], 'SUMMARY');
        expect(await orch.summarizeRecent()).toBe(false);
        expect(store).not.toHaveBeenCalled();
    });

    it('prunes the oldest summary beyond the cap', async () => {
        const now = Date.now();
        const summaries = Array.from({ length: 5 }, (_, i) =>
            entry(`s${i}`, CONSOLIDATION_SUMMARY_TYPE, now - (10 + i) * HOUR, `old ${i}`),
        );
        const { orch, store, deleteMemory } = setup([...recent(8), ...summaries], 'NEW');
        expect(await orch.summarizeRecent()).toBe(true);
        expect(store).toHaveBeenCalledTimes(1);
        expect(deleteMemory).toHaveBeenCalledWith('s4');
    });
});
