import { describe, it, expect, vi } from 'vitest';
import { MemoryAccessTracker, ACCESS_DEBOUNCE_MS } from './memory-access-tracker';
import type { MemoryEntry } from '../../types/memory-types';

function entry(id: string, lastAccessed?: number): MemoryEntry {
    return {
        id,
        content: id,
        metadata: {
            source: 'user',
            type: 'note',
            timestamp: 1,
            importance: 0.5,
            ...(lastAccessed !== undefined ? { lastAccessed } : {}),
        },
    };
}

function build(entries: MemoryEntry[]) {
    const byId = new Map(entries.map((e) => [e.id, e]));
    const save = vi.fn(async () => {});
    const onFlush = vi.fn();
    const tracker = new MemoryAccessTracker({
        get: (id) => byId.get(id),
        save,
        onFlush,
        now: () => 100,
        setTimer: () => 1,
        clearTimer: () => {},
    });
    return { tracker, save, onFlush };
}

describe('MemoryAccessTracker', () => {
    it('marks lastAccessed and persists once per flush', async () => {
        const a = entry('a');
        const { tracker, save, onFlush } = build([a]);
        tracker.touch(['a', 'a', 'missing']);
        await tracker.flush();
        expect(a.metadata.lastAccessed).toBe(100);
        expect(save).toHaveBeenCalledTimes(1);
        expect(onFlush).toHaveBeenCalledWith([a]);
    });

    it('deduplicates ids across touches before flushing', async () => {
        const a = entry('a');
        const { tracker, save } = build([a]);
        tracker.touch(['a']);
        tracker.touch(['a']);
        await tracker.flush();
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('flushes on the debounce timer without an explicit flush', async () => {
        const a = entry('a');
        const save = vi.fn(async () => {});
        let fire: (() => void) | undefined;
        const tracker = new MemoryAccessTracker({
            get: () => a,
            save,
            now: () => 7,
            setTimer: (fn) => {
                fire = fn;
                return 1;
            },
            clearTimer: () => {},
        });
        tracker.touch(['a']);
        expect(save).not.toHaveBeenCalled();
        fire!();
        await Promise.resolve();
        await Promise.resolve();
        expect(save).toHaveBeenCalledTimes(1);
        expect(a.metadata.lastAccessed).toBe(7);
    });

    it('keeps going when a save fails', async () => {
        const a = entry('a');
        const b = entry('b');
        const save = vi
            .fn()
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValueOnce(undefined);
        const tracker = new MemoryAccessTracker({
            get: (id) => (id === 'a' ? a : b),
            save,
            now: () => 5,
            setTimer: () => 1,
            clearTimer: () => {},
        });
        tracker.touch(['a', 'b']);
        await tracker.flush();
        expect(save).toHaveBeenCalledTimes(2);
        expect(b.metadata.lastAccessed).toBe(5);
    });

    it('ignores unknown ids and empty batches', async () => {
        const { tracker, save } = build([]);
        tracker.touch([]);
        tracker.touch(['ghost']);
        await tracker.flush();
        expect(save).not.toHaveBeenCalled();
    });

    it('exposes a sane debounce window', () => {
        expect(ACCESS_DEBOUNCE_MS).toBeGreaterThan(0);
    });
});
