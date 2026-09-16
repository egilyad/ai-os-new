import { describe, it, expect, beforeEach } from 'vitest';
import { useDirectorStore } from './directorStore';
import { eventBus, EVENTS } from '../kernel/events/event-bus';

describe('DirectorStore (B4) — observes conversation:* events', () => {
    beforeEach(() => {
        useDirectorStore.getState().reset();
        useDirectorStore.getState().ensureSubscribed();
    });

    it('starts idle with an empty turn log', () => {
        const s = useDirectorStore.getState();
        expect(s.status).toBe('idle');
        expect(s.turnLog).toEqual([]);
        expect(s.currentParticipantId).toBeNull();
    });

    it('turn:start → running with a pending log entry', () => {
        eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId: 's1', participantId: 'a' });
        const s = useDirectorStore.getState();
        expect(s.status).toBe('running');
        expect(s.sessionId).toBe('s1');
        expect(s.currentParticipantId).toBe('a');
        expect(s.turnLog).toEqual([{ participantId: 'a', status: 'running' }]);
    });

    it('turn:complete → marks the running entry complete', () => {
        eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId: 's1', participantId: 'a' });
        eventBus.emit(EVENTS.CONVERSATION_TURN_COMPLETE, {
            sessionId: 's1',
            participantId: 'a',
            success: true,
        });
        const s = useDirectorStore.getState();
        expect(s.status).toBe('running');
        expect(s.currentParticipantId).toBeNull();
        expect(s.turnLog).toEqual([{ participantId: 'a', status: 'complete', success: true }]);
    });

    it('turn:error → status error and entry error', () => {
        eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId: 's1', participantId: 'a' });
        eventBus.emit(EVENTS.CONVERSATION_TURN_ERROR, {
            sessionId: 's1',
            participantId: 'a',
            error: 'boom',
        });
        const s = useDirectorStore.getState();
        expect(s.status).toBe('error');
        expect(s.turnLog).toEqual([
            { participantId: 'a', status: 'error', success: false, error: 'boom' },
        ]);
    });

    it('paused / resumed / aborted update status', () => {
        eventBus.emit(EVENTS.CONVERSATION_PAUSED, { sessionId: 's1' });
        expect(useDirectorStore.getState().status).toBe('paused');

        eventBus.emit(EVENTS.CONVERSATION_RESUMED, { sessionId: 's1' });
        expect(useDirectorStore.getState().status).toBe('running');

        eventBus.emit(EVENTS.CONVERSATION_ABORTED, { sessionId: 's1' });
        expect(useDirectorStore.getState().status).toBe('aborted');
    });

    it('accumulates a multi-turn log across events', () => {
        eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId: 's1', participantId: 'a' });
        eventBus.emit(EVENTS.CONVERSATION_TURN_COMPLETE, {
            sessionId: 's1',
            participantId: 'a',
            success: true,
        });
        eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId: 's1', participantId: 'b' });
        eventBus.emit(EVENTS.CONVERSATION_TURN_COMPLETE, {
            sessionId: 's1',
            participantId: 'b',
            success: true,
        });
        const s = useDirectorStore.getState();
        expect(s.turnLog).toEqual([
            { participantId: 'a', status: 'complete', success: true },
            { participantId: 'b', status: 'complete', success: true },
        ]);
    });

    it('completed → status completed after the final turn (B6.2)', () => {
        eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId: 's1', participantId: 'a' });
        eventBus.emit(EVENTS.CONVERSATION_TURN_COMPLETE, {
            sessionId: 's1',
            participantId: 'a',
            success: true,
        });
        eventBus.emit(EVENTS.CONVERSATION_COMPLETED, { sessionId: 's1' });
        const s = useDirectorStore.getState();
        expect(s.status).toBe('completed');
        expect(s.turnLog).toEqual([{ participantId: 'a', status: 'complete', success: true }]);
    });

    describe('teardown (FA-04)', () => {
        it('destroy() resets state and stops observing events', () => {
            eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId: 's1', participantId: 'a' });
            expect(useDirectorStore.getState().turnLog.length).toBe(1);

            useDirectorStore.getState().destroy();
            const cleared = useDirectorStore.getState();
            expect(cleared.status).toBe('idle');
            expect(cleared.turnLog).toEqual([]);

            eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId: 's2', participantId: 'b' });
            expect(useDirectorStore.getState().turnLog.length).toBe(0);
        });

        it('ensureSubscribed() re-activates observation after destroy()', () => {
            useDirectorStore.getState().destroy();
            useDirectorStore.getState().ensureSubscribed();
            eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId: 's1', participantId: 'a' });
            expect(useDirectorStore.getState().turnLog.length).toBe(1);
        });

        it('ensureSubscribed() is idempotent', () => {
            useDirectorStore.getState().ensureSubscribed();
            useDirectorStore.getState().ensureSubscribed();
            eventBus.emit(EVENTS.CONVERSATION_TURN_START, { sessionId: 's1', participantId: 'a' });
            expect(useDirectorStore.getState().turnLog.length).toBe(1);
        });
    });
});
