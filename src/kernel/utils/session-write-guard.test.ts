import { describe, it, expect } from 'vitest';
import { isStaleSessionWrite, mergeStaleSession } from './session-write-guard';
import type { ChatSession } from '../contracts/storage/session-store';

function session(partial: Partial<ChatSession> & { id: string }): ChatSession {
    return {
        title: '',
        history: [],
        createdAt: 0,
        updatedAt: 0,
        ...partial,
    };
}

describe('isStaleSessionWrite', () => {
    it('treats a behind-version snapshot as stale', () => {
        const incoming = session({ id: 's1', version: 2 });
        const current = session({ id: 's1', version: 5 });
        expect(isStaleSessionWrite(incoming, current)).toBe(true);
    });

    it('accepts same-or-newer versions', () => {
        expect(isStaleSessionWrite(session({ id: 's1', version: 5 }), session({ id: 's1', version: 5 }))).toBe(false);
        expect(isStaleSessionWrite(session({ id: 's1', version: 6 }), session({ id: 's1', version: 5 }))).toBe(false);
    });

    it('accepts version-less snapshots (legacy) regardless of current version', () => {
        expect(isStaleSessionWrite(session({ id: 's1' }), session({ id: 's1', version: 9 }))).toBe(false);
    });

    it('accepts writes when there is no current record', () => {
        expect(isStaleSessionWrite(session({ id: 's1', version: 3 }), undefined)).toBe(false);
    });
});

describe('mergeStaleSession', () => {
    it('unions history by entry id', () => {
        const current = session({
            id: 's1',
            history: [{ id: 'a', role: 'user', text: 'A', responses: [], timestamp: 1 }],
            updatedAt: 100,
        });
        const incoming = session({
            id: 's1',
            history: [
                { id: 'a', role: 'user', text: 'A', responses: [], timestamp: 1 },
                { id: 'b', role: 'assistant', text: 'B', responses: [], timestamp: 2 },
            ],
            updatedAt: 50,
        });
        const merged = mergeStaleSession(current, incoming);
        expect(merged.history.map((h) => h.id)).toEqual(['a', 'b']);
        expect(merged.updatedAt).toBe(100);
    });

    it('returns current unchanged when incoming adds nothing', () => {
        const current = session({
            id: 's1',
            history: [{ id: 'a', role: 'user', text: 'A', responses: [], timestamp: 1 }],
            updatedAt: 100,
        });
        const incoming = session({
            id: 's1',
            history: [{ id: 'a', role: 'user', text: 'A', responses: [], timestamp: 1 }],
            updatedAt: 90,
        });
        expect(mergeStaleSession(current, incoming)).toBe(current);
    });
});
