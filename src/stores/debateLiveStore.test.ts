import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockEventBus, emit } = vi.hoisted(() => {
    const handlers = new Map<string, Array<(data: unknown) => void>>();
    const subscribe = (event: string, cb: (data: unknown) => void) => {
        const list = handlers.get(event) ?? [];
        list.push(cb);
        handlers.set(event, list);
        return () => {
            const current = handlers.get(event);
            if (!current) return;
            const i = current.indexOf(cb);
            if (i >= 0) current.splice(i, 1);
        };
    };
    return {
        mockEventBus: {
            on: subscribe,
            onSafe: subscribe,
            emit: (event: string, data: unknown) => {
                (handlers.get(event) ?? []).forEach((cb) => cb(data));
            },
        },
        emit: (event: string, data: unknown) => {
            (handlers.get(event) ?? []).forEach((cb) => cb(data));
        },
    };
});

vi.mock('../kernel/events/event-bus', () => ({
    eventBus: mockEventBus,
}));

import { useDebateLiveStore } from './debateLiveStore';
import { EVENTS } from '../kernel/events/event-names';

describe('debateLiveStore', () => {
    beforeEach(() => {
        useDebateLiveStore.getState().clearAll();
        useDebateLiveStore.getState().setAgentTimeout(30);
    });

    afterEach(() => {
        useDebateLiveStore.getState().clearAll();
    });

    it('initializes with empty state', () => {
        const s = useDebateLiveStore.getState();
        expect(s.agentEvents).toEqual([]);
        expect(s.roundEvents).toEqual([]);
        expect(s.streamingContent.size).toBe(0);
        expect(s.currentThinking.size).toBe(0);
        expect(s.emotions.size).toBe(0);
        expect(s.agentCountdowns.size).toBe(0);
        expect(s.agentAddressing.size).toBe(0);
        expect(s.memoryBubbles.size).toBe(0);
        expect(s.judgeWeights).toEqual({ pro: 0, con: 0, neutral: 0 });
        expect(s.agentQualityActivations.size).toBe(0);
        expect(s.recentQualityEvents).toEqual([]);
        expect(s.agentTimeoutSeconds).toBe(30);
    });

    it('appends chunk to streamingContent', () => {
        useDebateLiveStore.getState().setAgentTimeout(30);
        emit(EVENTS.DEBATE_AGENT_CHUNK, {
            sessionId: 's1',
            agentId: 'a1',
            chunk: 'Hello',
        });
        emit(EVENTS.DEBATE_AGENT_CHUNK, {
            sessionId: 's1',
            agentId: 'a1',
            chunk: ' world',
        });
        const sc = useDebateLiveStore.getState().streamingContent;
        expect(sc.get('s1:a1')).toBe('Hello world');
    });

    it('limits streamingContent to 100 keys', () => {
        for (let i = 0; i < 110; i++) {
            emit(EVENTS.DEBATE_AGENT_CHUNK, {
                sessionId: 's',
                agentId: `a${i}`,
                chunk: 'x',
            });
        }
        expect(useDebateLiveStore.getState().streamingContent.size).toBe(100);
    });

    it('truncates chunks over 10240 chars', () => {
        emit(EVENTS.DEBATE_AGENT_CHUNK, {
            sessionId: 's1',
            agentId: 'a1',
            chunk: 'x'.repeat(11000),
        });
        const val = useDebateLiveStore.getState().streamingContent.get('s1:a1');
        expect(val?.length).toBe(10240);
    });

    it('adds thinking event with countdown and curiosity emotion', () => {
        useDebateLiveStore.getState().setAgentTimeout(30);
        emit(EVENTS.DEBATE_AGENT_THINKING, { sessionId: 's1', agentId: 'a1' });
        const s = useDebateLiveStore.getState();
        expect(s.agentEvents).toHaveLength(1);
        expect(s.agentEvents[0]).toMatchObject({
            sessionId: 's1',
            agentId: 'a1',
            status: 'thinking',
        });
        expect(s.currentThinking.get('s1:a1')).toBe('a1');
        expect(s.emotions.get('s1:a1')).toBe('curiosity');
        expect(s.agentCountdowns.get('s1:a1')).toEqual({
            secondsLeft: 30,
            secondsTotal: 30,
        });
    });

    it('responded event removes thinking/streaming, sets confidence emotion', () => {
        emit(EVENTS.DEBATE_AGENT_THINKING, { sessionId: 's1', agentId: 'a1' });
        emit(EVENTS.DEBATE_AGENT_CHUNK, { sessionId: 's1', agentId: 'a1', chunk: 'partial' });
        emit(EVENTS.DEBATE_AGENT_RESPONDED, {
            sessionId: 's1',
            agentId: 'a1',
            content: 'full answer',
        });
        const s = useDebateLiveStore.getState();
        expect(s.agentEvents).toHaveLength(2);
        expect(s.agentEvents[1]).toMatchObject({ status: 'responded', content: 'full answer' });
        expect(s.currentThinking.has('s1:a1')).toBe(false);
        expect(s.streamingContent.has('s1:a1')).toBe(false);
        expect(s.emotions.get('s1:a1')).toBe('confidence');
        expect(s.agentCountdowns.has('s1:a1')).toBe(false);
    });

    it('error event sets anger emotion and clears thinking/streaming', () => {
        emit(EVENTS.DEBATE_AGENT_THINKING, { sessionId: 's1', agentId: 'a1' });
        emit(EVENTS.DEBATE_AGENT_CHUNK, { sessionId: 's1', agentId: 'a1', chunk: 'partial' });
        emit(EVENTS.DEBATE_AGENT_ERROR, {
            sessionId: 's1',
            agentId: 'a1',
            error: 'boom',
        });
        const s = useDebateLiveStore.getState();
        expect(s.agentEvents[1]).toMatchObject({ status: 'error', error: 'boom' });
        expect(s.emotions.get('s1:a1')).toBe('anger');
        expect(s.currentThinking.has('s1:a1')).toBe(false);
        expect(s.streamingContent.has('s1:a1')).toBe(false);
    });

    it('timeout event sets fear emotion', () => {
        emit(EVENTS.DEBATE_AGENT_TIMEOUT, {
            sessionId: 's1',
            agentId: 'a1',
            timeoutMs: 5000,
        });
        const s = useDebateLiveStore.getState();
        expect(s.agentEvents[0]).toMatchObject({ status: 'timeout', timeoutMs: 5000 });
        expect(s.emotions.get('s1:a1')).toBe('fear');
    });

    it('fallback event sets surprise emotion and records providers', () => {
        emit(EVENTS.DEBATE_AGENT_FALLBACK, {
            sessionId: 's1',
            agentId: 'a1',
            fromProvider: 'groq',
            toProvider: 'openrouter',
        });
        const s = useDebateLiveStore.getState();
        expect(s.agentEvents[0]).toMatchObject({
            status: 'fallback',
            fromProvider: 'groq',
            toProvider: 'openrouter',
        });
        expect(s.emotions.get('s1:a1')).toBe('surprise');
    });

    it('round started/ended events append roundEvents', () => {
        emit(EVENTS.DEBATE_ROUND_STARTED, {
            sessionId: 's1',
            round: 1,
            nodes: ['a1', 'a2'],
        });
        emit(EVENTS.DEBATE_ROUND_ENDED, { sessionId: 's1', round: 1 });
        const s = useDebateLiveStore.getState();
        expect(s.roundEvents).toHaveLength(2);
        expect(s.roundEvents[0]).toEqual({
            sessionId: 's1',
            round: 1,
            nodes: ['a1', 'a2'],
            status: 'started',
        });
        expect(s.roundEvents[1]).toEqual({
            sessionId: 's1',
            round: 1,
            status: 'ended',
        });
    });

    it('memory claim adds memory bubble with truncated label', () => {
        const longClaim = 'x'.repeat(50);
        emit(EVENTS.DEBATE_MEMORY_CLAIM, {
            sessionId: 's1',
            agentId: 'a1',
            claim: longClaim,
        });
        const mb = useDebateLiveStore.getState().memoryBubbles.get('s1:a1');
        expect(mb).toBeDefined();
        expect(mb?.debateLabel).toBe('x'.repeat(30) + '...');
        expect(mb?.relation).toBe('supports');
    });

    it('consensus reached sets judge weights', () => {
        emit(EVENTS.DEBATE_CONSENSUS_REACHED, {
            sessionId: 's1',
            confidence: 0.8,
            agreements: 6,
            conflicts: 2,
        });
        expect(useDebateLiveStore.getState().judgeWeights).toEqual({
            pro: 6,
            con: 2,
            neutral: 2,
        });
    });

    it('quality technique applied increments agent activations and logs event', () => {
        emit(EVENTS.DEBATE_QUALITY_TECHNIQUE_APPLIED, {
            sessionId: 's1',
            techniqueId: 'steelman',
            eventType: 'APPLIED',
            round: 1,
            agentId: 'a1',
            timestamp: 1000,
        });
        emit(EVENTS.DEBATE_QUALITY_TECHNIQUE_APPLIED, {
            sessionId: 's1',
            techniqueId: 'steelman',
            eventType: 'APPLIED',
            round: 1,
            agentId: 'a1',
            timestamp: 1001,
        });
        const s = useDebateLiveStore.getState();
        expect(s.agentQualityActivations.get('s1:a1')).toBe(2);
        expect(s.recentQualityEvents).toHaveLength(2);
        expect(s.recentQualityEvents[0]).toMatchObject({
            techniqueId: 'steelman',
            eventType: 'APPLIED',
        });
    });

    it('quality impact computed adds final impact event', () => {
        emit(EVENTS.DEBATE_QUALITY_IMPACT_COMPUTED, {
            sessionId: 's1',
            techniqueCount: 3,
            timestamp: 2000,
        });
        const s = useDebateLiveStore.getState();
        expect(s.recentQualityEvents[0]).toMatchObject({
            techniqueId: 'impact-computed',
            eventType: 'FINAL_IMPACT',
        });
    });

    it('addAgentEvent and addRoundEvent append with caps', () => {
        const st = useDebateLiveStore.getState();
        for (let i = 0; i < 510; i++) {
            st.addAgentEvent({
                sessionId: 's1',
                agentId: `a${i}`,
                status: 'thinking',
                timestamp: i,
            });
            st.addRoundEvent({ sessionId: 's1', round: i, status: 'started' });
        }
        const s = useDebateLiveStore.getState();
        expect(s.agentEvents.length).toBe(500);
        expect(s.roundEvents.length).toBe(200);
    });

    it('setAgentAddressing adds and removes entries', () => {
        const st = useDebateLiveStore.getState();
        st.setAgentAddressing('s1:a1', 'a2');
        expect(useDebateLiveStore.getState().agentAddressing.get('s1:a1')).toBe('a2');
        st.setAgentAddressing('s1:a1', null);
        expect(useDebateLiveStore.getState().agentAddressing.has('s1:a1')).toBe(false);
    });

    it('addMemoryBubble overwrites by key', () => {
        const st = useDebateLiveStore.getState();
        st.addMemoryBubble('s1:a1', {
            debateLabel: 'first',
            similarity: 0.5,
            relation: 'supports',
        });
        st.addMemoryBubble('s1:a1', {
            debateLabel: 'second',
            similarity: 0.9,
            relation: 'refutes',
        });
        expect(useDebateLiveStore.getState().memoryBubbles.get('s1:a1')).toMatchObject({
            debateLabel: 'second',
            relation: 'refutes',
        });
    });

    it('clearSession removes all data for a session', () => {
        const st = useDebateLiveStore.getState();
        st.setAgentTimeout(30);
        emit(EVENTS.DEBATE_AGENT_THINKING, { sessionId: 's1', agentId: 'a1' });
        emit(EVENTS.DEBATE_AGENT_THINKING, { sessionId: 's2', agentId: 'a1' });
        emit(EVENTS.DEBATE_ROUND_STARTED, { sessionId: 's1', round: 1, nodes: ['a1'] });
        st.clearSession('s1');
        const s = useDebateLiveStore.getState();
        expect(s.agentEvents.some((e) => e.sessionId === 's1')).toBe(false);
        expect(s.agentEvents.some((e) => e.sessionId === 's2')).toBe(true);
        expect(s.currentThinking.has('s1:a1')).toBe(false);
        expect(s.currentThinking.has('s2:a1')).toBe(true);
        expect(s.roundEvents.some((e) => e.sessionId === 's1')).toBe(false);
    });

    it('clearAll resets all state', () => {
        const st = useDebateLiveStore.getState();
        emit(EVENTS.DEBATE_AGENT_THINKING, { sessionId: 's1', agentId: 'a1' });
        emit(EVENTS.DEBATE_CONSENSUS_REACHED, {
            sessionId: 's1',
            confidence: 0.5,
            agreements: 3,
            conflicts: 1,
        });
        st.clearAll();
        const s = useDebateLiveStore.getState();
        expect(s.agentEvents).toEqual([]);
        expect(s.roundEvents).toEqual([]);
        expect(s.judgeWeights).toEqual({ pro: 0, con: 0, neutral: 0 });
        expect(s.streamingContent.size).toBe(0);
        expect(s.emotions.size).toBe(0);
        expect(s.recentQualityEvents).toEqual([]);
    });

    it('setJudgeWeights and setAgentTimeout update state', () => {
        const st = useDebateLiveStore.getState();
        st.setJudgeWeights({ pro: 1, con: 2, neutral: 3 });
        st.setAgentTimeout(45);
        const s = useDebateLiveStore.getState();
        expect(s.judgeWeights).toEqual({ pro: 1, con: 2, neutral: 3 });
        expect(s.agentTimeoutSeconds).toBe(45);
    });

    it('FA-06: intervals start lazily on a live event and stop on clearAll (no always-on leak)', () => {
        const setSpy = vi.spyOn(globalThis, 'setInterval');
        const clearSpy = vi.spyOn(globalThis, 'clearInterval');
        setSpy.mockClear();
        clearSpy.mockClear();

        // No live debate yet → no timers should be running.
        expect(setSpy).not.toHaveBeenCalled();

        emit(EVENTS.DEBATE_AGENT_THINKING, { sessionId: 's1', agentId: 'a1' });
        // metrics (30s) + countdown (1s) intervals are created on the first event.
        expect(setSpy).toHaveBeenCalledTimes(2);

        useDebateLiveStore.getState().clearAll();
        // Emptying the store stops both intervals.
        expect(clearSpy).toHaveBeenCalledTimes(2);

        setSpy.mockRestore();
        clearSpy.mockRestore();
    });

    it('destroy unsubscribes handlers', () => {
        useDebateLiveStore.getState().destroy();
        emit(EVENTS.DEBATE_AGENT_THINKING, { sessionId: 's1', agentId: 'a1' });
        expect(useDebateLiveStore.getState().agentEvents).toHaveLength(0);
    });
});
