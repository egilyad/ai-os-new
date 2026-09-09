import { describe, it, expect } from 'vitest';
import {
    useChatStore,
    useActiveSessionHistory,
    useSessions,
    useActiveSessionId,
    useSystemPrompt,
    useHasMoreSessions,
    useChatStoreHydration,
    DEFAULT_HISTORY,
} from './useChatStore';

describe('useChatStore barrel', () => {
    it('re-exports the chat store instance', () => {
        expect(useChatStore.getState).toBeTypeOf('function');
        expect(useChatStore.setState).toBeTypeOf('function');
        expect(Array.isArray(DEFAULT_HISTORY)).toBe(true);
    });

    it('re-exports hooks as functions', () => {
        expect(useActiveSessionHistory).toBeTypeOf('function');
        expect(useSessions).toBeTypeOf('function');
        expect(useActiveSessionId).toBeTypeOf('function');
        expect(useSystemPrompt).toBeTypeOf('function');
        expect(useHasMoreSessions).toBeTypeOf('function');
        expect(useChatStoreHydration).toBeTypeOf('function');
    });
});
