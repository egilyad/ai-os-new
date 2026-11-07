import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { SessionAffinityStore } from './session-affinity-store';

function makeStore() {
    const eventBus = {
        on: () => () => {},
        onSafe: () => () => {},
        emit: () => {},
    };
    return new SessionAffinityStore(eventBus as never);
}

describe('SessionAffinityStore', () => {
    it('binds a key to a session and retrieves it', () => {
        const store = makeStore();
        store.bind('s1', 'k1', 'openrouter');
        expect(store.getBoundKey('s1')?.keyId).toBe('k1');
        expect(store.isSessionBound('s1')).toBe(true);
    });

    it('supports participant-scoped bindings', () => {
        const store = makeStore();
        store.bind('s1', 'k1', 'openrouter', 'p1');
        store.bind('s1', 'k2', 'openrouter', 'p2');
        expect(store.getBoundKey('s1', 'p1')?.keyId).toBe('k1');
        expect(store.getBoundKey('s1', 'p2')?.keyId).toBe('k2');
    });

    it('unbinds a single participant or the whole session', () => {
        const store = makeStore();
        store.bind('s1', 'k1', 'openrouter', 'p1');
        store.bind('s1', 'k2', 'openrouter', 'p2');
        store.unbind('s1', 'p1');
        expect(store.getBoundKey('s1', 'p1')).toBeUndefined();
        expect(store.getBoundKey('s1', 'p2')).toBeDefined();
        store.unbind('s1');
        expect(store.isSessionBound('s1')).toBe(false);
    });

    it('evictUnhealthy removes bindings for unhealthy keys', () => {
        const store = makeStore();
        store.bind('s1', 'k1', 'openrouter');
        store.bind('s2', 'k2', 'openrouter');
        const evicted = store.evictUnhealthy((keyId) => keyId !== 'k1');
        expect(evicted).toEqual(['k1']);
        expect(store.getBoundKey('s1')).toBeUndefined();
        expect(store.getBoundKey('s2')).toBeDefined();
    });
});
