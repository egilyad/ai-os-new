/**
 * MemoryMcpServer — built-in MCP server (resources + tools) over a memory engine.
 */
import { describe, it, expect, vi } from 'vitest';
import { MemoryMcpServer } from './memory-mcp-server';
import type { IMemoryEngine } from '../../contracts/memory';
import type { ILtMemoryService } from '../../contracts/persona';
import type { MemoryEntry, MemoryStats } from '../../types/memory-types';

const DAY = 24 * 3_600_000;

function entry(id: string, content: string, agentId?: string): MemoryEntry {
    return {
        id,
        content,
        metadata: {
            source: 'user',
            type: 'chat_query',
            timestamp: Date.now() - DAY,
            importance: 0.5,
            agentId,
        },
    };
}

function stats(total: number): MemoryStats {
    return {
        totalEntries: total,
        totalTokens: total * 4,
        uniqueSources: 1,
        byType: { chat_query: total },
        byImportance: { low: 0, medium: total, high: 0, critical: 0 },
        avgImportance: 0.5,
        oldestEntry: Date.now() - DAY,
        newestEntry: Date.now(),
        totalStorageBytes: total * 16,
        lastPruned: null,
    };
}

function makeEngine(memories: MemoryEntry[]) {
    const engine = {
        store: vi.fn(async (e: Omit<MemoryEntry, 'id'>) => {
            memories.push({ ...e, id: `m${memories.length + 1}` });
        }),
        storeBatch: vi.fn(),
        search: vi.fn(async () =>
            memories.map((e) => ({ entry: e, score: 1, matchedOn: 'keyword' as const })),
        ),
        searchAdvanced: vi.fn(
            async (q: { filter?: Record<string, unknown> }) =>
                memories
                    .filter((e) => !q.filter?.agentId || e.metadata.agentId === q.filter.agentId)
                    .map((e) => ({ entry: e, score: 1, matchedOn: 'keyword' as const })),
        ),
        getMemories: (limit = 100) => memories.slice(0, limit),
        getMemory: (id: string) => memories.find((e) => e.id === id),
        deleteMemory: vi.fn(async (id: string) => {
            const i = memories.findIndex((e) => e.id === id);
            if (i >= 0) memories.splice(i, 1);
        }),
        updateMemory: vi.fn(),
        getStats: () => stats(memories.length),
        prune: vi.fn(),
        clear: vi.fn(),
        recall: vi.fn(() => memories.slice(0, 1)),
    } as unknown as IMemoryEngine;
    return engine;
}

function parseTool(result: unknown): unknown {
    const content = (result as { content: { text: string }[] }).content;
    return JSON.parse(content[0]!.text);
}

describe('MemoryMcpServer', () => {
    it('answers initialize with capabilities', async () => {
        const server = new MemoryMcpServer({ memoryService: makeEngine([]) });
        const init = (await server.handle('initialize')) as {
            protocolVersion: string;
            capabilities: Record<string, unknown>;
        };
        expect(init.protocolVersion).toBe('2025-03-26');
        expect(init.capabilities).toHaveProperty('resources');
        expect(init.capabilities).toHaveProperty('tools');
    });

    it('lists tools (associative only with long-term memory)', async () => {
        const base = new MemoryMcpServer({ memoryService: makeEngine([]) });
        const names = base.listTools().map((t) => t.name);
        expect(names).toEqual(
            expect.arrayContaining([
                'memory.search',
                'memory.store',
                'memory.recall',
                'memory.delete',
                'memory.stats',
            ]),
        );
        expect(names).not.toContain('memory.associated');

        const withLt = new MemoryMcpServer({
            memoryService: makeEngine([]),
            ltMemoryService: {} as ILtMemoryService,
        });
        expect(withLt.listTools().map((t) => t.name)).toContain('memory.associated');
    });

    it('memory.search applies the namespace filter', async () => {
        const engine = makeEngine([entry('a', 'alpha', 'agent-1'), entry('b', 'beta', 'agent-2')]);
        const server = new MemoryMcpServer({ memoryService: engine });
        const result = await server.handle('tools/call', {
            name: 'memory.search',
            arguments: { query: 'a', agentId: 'agent-1' },
        });
        const hits = parseTool(result) as { id: string }[];
        expect(hits.map((h) => h.id)).toEqual(['a']);
        expect(engine.searchAdvanced).toHaveBeenCalledWith(
            expect.objectContaining({ filter: { agentId: 'agent-1' } }),
        );
    });

    it('memory.store sanitizes + stores with defaults', async () => {
        const engine = makeEngine([]);
        const server = new MemoryMcpServer({ memoryService: engine });
        await server.handle('tools/call', {
            name: 'memory.store',
            arguments: { content: 'hello world', type: 'note' },
        });
        expect(engine.store).toHaveBeenCalledTimes(1);
        const stored = (engine.store as unknown as { mock: { calls: unknown[][] } }).mock
            .calls[0]![0] as MemoryEntry;
        expect(stored.content).toBe('hello world');
        expect(stored.metadata.type).toBe('note');
        expect(stored.metadata.source).toBe('system');
    });

    it('reads stats + entries resources', async () => {
        const server = new MemoryMcpServer({ memoryService: makeEngine([entry('x', 'c')]) });
        const stats = (await server.handle('resources/read', { uri: 'memory://stats' })) as {
            contents: { text: string }[];
        };
        expect(JSON.parse(stats.contents[0]!.text).totalEntries).toBe(1);
        const entries = (await server.handle('resources/read', { uri: 'memory://entries' })) as {
            contents: { text: string }[];
        };
        expect(JSON.parse(entries.contents[0]!.text)).toHaveLength(1);
    });

    it('rejects unknown methods/tools/resources', async () => {
        const server = new MemoryMcpServer({ memoryService: makeEngine([]) });
        await expect(server.handle('no/such')).rejects.toThrow(/Method not found/);
        await expect(
            server.handle('tools/call', { name: 'nope', arguments: {} }),
        ).rejects.toThrow(/Unknown tool/);
        await expect(server.handle('resources/read', { uri: 'memory://nope' })).rejects.toThrow(
            /Unknown resource/,
        );
    });
});
