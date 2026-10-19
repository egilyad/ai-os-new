/**
 * matchesMemoryQuery — metadata/namespace filter used by searchAdvanced/recall.
 */
import { describe, it, expect } from 'vitest';
import { matchesMemoryQuery } from './memory-search-utils';
import type { MemoryEntry } from '../../types/memory-types';

function entry(metadata: Partial<MemoryEntry['metadata']>): MemoryEntry {
    return {
        id: 'e1',
        content: 'hello world',
        metadata: {
            source: 'user',
            type: 'chat_query',
            timestamp: 1_000,
            importance: 0.5,
            ...metadata,
        },
    };
}

describe('matchesMemoryQuery', () => {
    it('matches everything without a filter', () => {
        expect(matchesMemoryQuery(entry({}), undefined)).toBe(true);
        expect(matchesMemoryQuery(entry({}), {})).toBe(true);
    });

    it('filters by namespace metadata (agent/role/session/chat)', () => {
        const e = entry({ agentId: 'a1', roleId: 'r1', sessionId: 's1', chatId: 'c1' });
        expect(matchesMemoryQuery(e, { agentId: 'a1' })).toBe(true);
        expect(matchesMemoryQuery(e, { agentId: 'a2' })).toBe(false);
        expect(matchesMemoryQuery(e, { sessionId: 's1', chatId: 'c1' })).toBe(true);
        expect(matchesMemoryQuery(e, { roleId: 'r2' })).toBe(false);
    });

    it('filters by source/type/collection and importanceMin', () => {
        const e = entry({ source: 'agent', type: 'decision', collection: 'long_term' });
        expect(matchesMemoryQuery(e, { source: 'agent', type: 'decision' })).toBe(true);
        expect(matchesMemoryQuery(e, { type: 'chat_query' })).toBe(false);
        expect(matchesMemoryQuery(e, { collection: 'ephemeral' })).toBe(false);
        expect(matchesMemoryQuery(e, { importanceMin: 0.4 })).toBe(true);
        expect(matchesMemoryQuery(e, { importanceMin: 0.9 })).toBe(false);
    });

    it('filters by timeRange', () => {
        const e = entry({ timestamp: 5_000 });
        expect(matchesMemoryQuery(e, { timeRange: { from: 1_000, to: 9_000 } })).toBe(true);
        expect(matchesMemoryQuery(e, { timeRange: { from: 6_000 } })).toBe(false);
        expect(matchesMemoryQuery(e, { timeRange: { to: 4_000 } })).toBe(false);
    });

    it('filters by tags (labels/category/domain)', () => {
        const e = entry({ tags: { labels: ['идея'], category: 'research', domain: 'physics' } });
        expect(matchesMemoryQuery(e, { tags: ['идея'] })).toBe(true);
        expect(matchesMemoryQuery(e, { tags: ['research'] })).toBe(true);
        expect(matchesMemoryQuery(e, { tags: ['physics'] })).toBe(true);
        expect(matchesMemoryQuery(e, { tags: ['other'] })).toBe(false);
    });
});
