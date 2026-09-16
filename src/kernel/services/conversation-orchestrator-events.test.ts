/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversationOrchestrator } from './conversation-orchestrator';
import { HybridPolicy } from './conversation-hybrid-policy';
import type { IExecutionEngine } from '../contracts/conversation/execution';
import type { ConversationContext, TurnProposal } from '../contracts/conversation/context';
import { eventBus, EVENTS } from '../events/event-bus';

type Ev = { type: string; payload: any };

function turn(participantId: string): TurnProposal {
    return { participantId, objective: { type: 'CUSTOM', description: 'd', constraints: [] } };
}

function makeContext(): ConversationContext {
    return {
        topic: 't',
        participants: [
            { id: 'a', role: 'r' },
            { id: 'b', role: 'r' },
        ],
        history: [],
        metadata: {},
    };
}

describe('ConversationOrchestrator lifecycle events (B4)', () => {
    let events: Ev[] = [];
    const unsubs: Array<() => void> = [];

    beforeEach(() => {
        events = [];
        const names = [
            EVENTS.CONVERSATION_TURN_START,
            EVENTS.CONVERSATION_TURN_COMPLETE,
            EVENTS.CONVERSATION_TURN_ERROR,
            EVENTS.CONVERSATION_PAUSED,
            EVENTS.CONVERSATION_RESUMED,
            EVENTS.CONVERSATION_ABORTED,
            EVENTS.CONVERSATION_COMPLETED,
        ] as const;
        for (const n of names) {
            unsubs.push(eventBus.on(n, (payload) => events.push({ type: n, payload })));
        }
    });

    afterEach(() => {
        unsubs.forEach((u) => u());
        unsubs.length = 0;
    });

    it('emits turn:start then turn:complete in order for each executed turn', async () => {
        const engine: IExecutionEngine = {
            execute: vi.fn().mockResolvedValue({ success: true, content: 'ok' }),
        };
        const orch = new ConversationOrchestrator(
            new HybridPolicy([turn('a'), turn('b')]),
            engine,
            makeContext(),
        );

        await orch.processNextStep('s1');
        await orch.processNextStep('s1');

        expect(events.map((e) => e.type)).toEqual([
            EVENTS.CONVERSATION_TURN_START,
            EVENTS.CONVERSATION_TURN_COMPLETE,
            EVENTS.CONVERSATION_TURN_START,
            EVENTS.CONVERSATION_TURN_COMPLETE,
        ]);
        expect(events[0].payload).toMatchObject({ sessionId: 's1', participantId: 'a' });
        expect(events[2].payload).toMatchObject({ sessionId: 's1', participantId: 'b' });
    });

    it('emits turn:error (and rethrows) when the engine fails', async () => {
        let call = 0;
        const engine: IExecutionEngine = {
            async execute() {
                call++;
                if (call === 2) throw new Error('boom');
                return { success: true, content: 'ok' };
            },
        };
        const orch = new ConversationOrchestrator(
            new HybridPolicy([turn('a'), turn('b')]),
            engine,
            makeContext(),
        );

        await orch.processNextStep('s1');
        await expect(orch.processNextStep('s1')).rejects.toThrow('boom');

        expect(events.map((e) => e.type)).toEqual([
            EVENTS.CONVERSATION_TURN_START,
            EVENTS.CONVERSATION_TURN_COMPLETE,
            EVENTS.CONVERSATION_TURN_START,
            EVENTS.CONVERSATION_TURN_ERROR,
        ]);
        expect(events[3].payload).toMatchObject({
            sessionId: 's1',
            participantId: 'b',
            error: 'boom',
        });
    });

    it('emits conversation:paused on pause()', async () => {
        const engine: IExecutionEngine = {
            execute: vi.fn().mockResolvedValue({ success: true, content: 'ok' }),
        };
        const orch = new ConversationOrchestrator(
            new HybridPolicy([turn('a'), turn('b')]),
            engine,
            makeContext(),
        );
        await orch.processNextStep('s1');
        orch.pause();

        expect(events[events.length - 1].type).toBe(EVENTS.CONVERSATION_PAUSED);
        expect(events[events.length - 1].payload).toEqual({ sessionId: 's1' });
    });

    it('emits conversation:resumed on resume() after pause', async () => {
        const engine: IExecutionEngine = {
            execute: vi.fn().mockResolvedValue({ success: true, content: 'ok' }),
        };
        const orch = new ConversationOrchestrator(
            new HybridPolicy([turn('a'), turn('b')]),
            engine,
            makeContext(),
        );
        await orch.processNextStep('s1');
        orch.pause();
        orch.resume();

        expect(events[events.length - 1].type).toBe(EVENTS.CONVERSATION_RESUMED);
        expect(events[events.length - 1].payload).toEqual({ sessionId: 's1' });
    });

    it('emits conversation:aborted on abortSession()', () => {
        const engine: IExecutionEngine = {
            execute: vi.fn().mockResolvedValue({ success: true, content: 'ok' }),
        };
        const orch = new ConversationOrchestrator(
            new HybridPolicy([turn('a'), turn('b')]),
            engine,
            makeContext(),
        );
        orch.abortSession('s9');

        expect(events.map((e) => e.type)).toEqual([EVENTS.CONVERSATION_ABORTED]);
        expect(events[0].payload).toEqual({ sessionId: 's9' });
    });

    it('surfaces a non-thrown success:false turn as TURN_ERROR (not TURN_COMPLETE)', async () => {
        const engine: IExecutionEngine = {
            execute: vi.fn().mockResolvedValue({ success: false, error: 'nope', content: '' }),
        };
        const orch = new ConversationOrchestrator(
            new HybridPolicy([turn('a')]),
            engine,
            makeContext(),
        );

        await expect(orch.processNextStep('s1')).rejects.toThrow('nope');

        expect(events.map((e) => e.type)).toEqual([
            EVENTS.CONVERSATION_TURN_START,
            EVENTS.CONVERSATION_TURN_ERROR,
        ]);
        // Must NOT be reported as a successful completion.
        expect(events.some((e) => e.type === EVENTS.CONVERSATION_TURN_COMPLETE)).toBe(false);
        expect(events[1].payload).toMatchObject({
            sessionId: 's1',
            participantId: 'a',
            error: 'nope',
        });
    });

    it('emits conversation:completed once the policy is exhausted (B6.2)', async () => {
        const engine: IExecutionEngine = {
            execute: vi.fn().mockResolvedValue({ success: true, content: 'ok' }),
        };
        const orch = new ConversationOrchestrator(
            new HybridPolicy([turn('a'), turn('b')]),
            engine,
            makeContext(),
        );
        await orch.processNextStep('s1');
        await orch.processNextStep('s1');
        await orch.processNextStep('s1');

        expect(events.map((e) => e.type)).toEqual([
            EVENTS.CONVERSATION_TURN_START,
            EVENTS.CONVERSATION_TURN_COMPLETE,
            EVENTS.CONVERSATION_TURN_START,
            EVENTS.CONVERSATION_TURN_COMPLETE,
            EVENTS.CONVERSATION_COMPLETED,
        ]);
        expect(events[events.length - 1].payload).toEqual({ sessionId: 's1' });
    });
});
