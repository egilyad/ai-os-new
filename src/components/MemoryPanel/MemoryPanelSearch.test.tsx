import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import MemoryPanel from './MemoryPanel';
import type { MemoryEntry } from '../../types/memory';

const memos = vi.hoisted(() => ({
    memories: [] as MemoryEntry[],
    searchImpl: null as null | ((q: string) => Promise<Array<{ entry: MemoryEntry }>>),
}));

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        eventBus: {
            emit: vi.fn(),
            on: vi.fn(() => vi.fn()),
            onSafe: vi.fn(() => vi.fn()),
            off: vi.fn(),
        },
        EVENTS: { NOTIFICATION: 'notification', SETTINGS_UPDATED: 'settings', MEMORY_UPDATED: 'mem' },
        CONFIG: { services: { memory: { semanticEnabled: false } } },
        configService: { updateServices: vi.fn(async () => {}) },
        memoryService: {
            getMemories: () => [...memos.memories],
            search: (q: string) =>
                memos.searchImpl ? memos.searchImpl(q) : Promise.resolve([]),
        },
        memoryGraphService: {
            build: () => ({ nodes: [], edges: [] }),
        },
    };
});

vi.mock('../../kernel/services/memory-demo-seed', () => ({
    seedMemoryDemo: vi.fn(),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

function entry(i: number, content: string): MemoryEntry {
    return {
        id: `m${i}`,
        content,
        metadata: { source: 'test', type: 'note', timestamp: Date.now(), importance: 0.5 },
    } as MemoryEntry;
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    memos.searchImpl = null;
});

describe('MemoryPanel search/export honesty (Zone 4)', () => {
    beforeEach(() => {
        memos.memories = Array.from({ length: 6 }, (_, i) => entry(i, `memory alpha content ${i}`));
    });

    it('exports the full index, not the 5-hit search view', async () => {
        memos.searchImpl = async () => [{ entry: memos.memories[0]! }];
        let blobText = '';
        Object.defineProperty(URL, 'createObjectURL', {
            value: vi.fn((blob: Blob) => {
                void blob.text().then((t) => {
                    blobText = t;
                });
                return 'blob:mock';
            }),
            configurable: true,
        });
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        render(<MemoryPanel />);
        fireEvent.change(screen.getByPlaceholderText('memory.search_exact'), { target: { value: 'alpha' } });
        await waitFor(() => expect(screen.getByText('memory.export_vectors')).toBeDefined());
        fireEvent.click(screen.getByText('memory.export_vectors'));
        await waitFor(() => expect(blobText.length).toBeGreaterThan(0));
        const exported = JSON.parse(blobText) as Array<{ id: string }>;
        expect(exported).toHaveLength(6);
        expect(exported.map((e) => e.id).sort()).toEqual(
            memos.memories.map((m) => m.id).sort(),
        );
        clickSpy.mockRestore();
    });

    it('keeps index stats on the full set while searching', async () => {
        memos.searchImpl = async () => [{ entry: memos.memories[0]! }];
        render(<MemoryPanel />);
        fireEvent.change(screen.getByPlaceholderText('memory.search_exact'), { target: { value: 'alpha' } });
        await waitFor(() => expect(screen.getByText(/Top 5 matches/)).toBeDefined());
        // Entries stat still reflects the 6-entry index, not the 1-hit view.
        const label = screen.getByText('memory.entries_label');
        const box = label.closest('div')?.parentElement;
        expect(box?.textContent).toContain('6');
    });
});
