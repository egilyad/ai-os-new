import { describe, it, expect, beforeEach } from 'vitest';
import { useInvocationStore } from './invocationStore';
import { eventBus, EVENTS } from '../kernel/events/event-bus';

const emitTurnStart = (sessionId = 's1', participantId = 'a') =>
    eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId, participantId });

describe('InvocationStore (FA-04) — subscription teardown', () => {
    beforeEach(() => {
        useInvocationStore.getState().destroy();
        useInvocationStore.getState().ensureSubscribed();
    });

    it('observes conversation:* live output when subscribed', () => {
        emitTurnStart();
        expect(useInvocationStore.getState().feed.length).toBe(1);
    });

    it('destroy() resets state and stops observing events', () => {
        emitTurnStart();
        expect(useInvocationStore.getState().feed.length).toBe(1);

        useInvocationStore.getState().destroy();
        const cleared = useInvocationStore.getState();
        expect(cleared.invocations).toEqual({});
        expect(cleared.order).toEqual([]);
        expect(cleared.feed).toEqual([]);
        expect(cleared.log).toEqual([]);

        emitTurnStart('s2', 'b');
        expect(useInvocationStore.getState().feed.length).toBe(0);
    });

    it('ensureSubscribed() re-activates observation after destroy()', () => {
        useInvocationStore.getState().destroy();
        useInvocationStore.getState().ensureSubscribed();
        emitTurnStart();
        expect(useInvocationStore.getState().feed.length).toBe(1);
    });

    it('ensureSubscribed() is idempotent', () => {
        useInvocationStore.getState().ensureSubscribed();
        emitTurnStart();
        expect(useInvocationStore.getState().feed.length).toBe(1);
    });
});
