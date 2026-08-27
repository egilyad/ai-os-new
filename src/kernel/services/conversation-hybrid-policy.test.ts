/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, vi } from 'vitest';
import { HybridPolicy } from './conversation-hybrid-policy';
import { ConversationOrchestrator } from './conversation-orchestrator';
import { ChatExecutionEngine } from './conversation-execution-engine';
import type { TurnProposal } from '../contracts/conversation/turn';
import type { ConversationContext } from '../contracts/conversation/context';

interface IChatExecutorAdapter {
    handleMessage(req: any): void;
    cancelRequest(requestId: string): void;
}

function makeEventBus(): any {
    const map = new Map<string, Array<(d: any) => void>>();
    return {
        on: (event: string, cb: (d: any) => void) => {
            const arr = map.get(event) ?? [];
            arr.push(cb);
            map.set(event, arr);
            return () => {
                const filtered = (map.get(event) ?? []).filter((c) => c !== cb);
                map.set(event, filtered);
            };
        },
        off: () => {},
        emit: (event: string, data?: any) => {
            (map.get(event) ?? []).forEach((cb) => cb(data));
        },
        onSafe: () => () => {},
        emitOnce: () => false,
        subscribeAll: () => () => {},
    };
}

const plan: TurnProposal[] = [
    {
        participantId: 'architect',
        objective: { type: 'INTRODUCE', description: 'Plan A', constraints: [] },
    },
    {
        participantId: 'security',
        objective: { type: 'CRITIQUE', description: 'Review A', constraints: [] },
    },
    {
        participantId: 'architect',
        objective: { type: 'RESPOND', description: 'Fix A', constraints: [] },
    },
];

function baseContext(): ConversationContext {
    return {
        topic: 'Ashdod',
        participants: [
            { id: 'architect', role: 'Architect' },
            { id: 'security', role: 'Security' },
        ],
        history: [],
        metadata: { sessionId: 'sess-h' },
    };
}

test('HybridPolicy runs base plan in order', async () => {
    const policy = new HybridPolicy(plan);
    const a = await policy.proposeNextTurn(baseContext(), { id: 's', data: {} });
    const b = await policy.proposeNextTurn(baseContext(), { id: 's', data: {} });
    const c = await policy.proposeNextTurn(baseContext(), { id: 's', data: {} });
    const d = await policy.proposeNextTurn(baseContext(), { id: 's', data: {} });
    expect(a!.participantId).toBe('architect');
    expect(b!.participantId).toBe('security');
    expect(c!.participantId).toBe('architect');
    expect(d).toBeNull();
});

test('HybridPolicy: user override inserts without consuming the plan', async () => {
    const policy = new HybridPolicy(plan);
    const first = await policy.proposeNextTurn(baseContext(), { id: 's', data: {} });
    expect(first!.objective.description).toBe('Plan A');

    policy.queueOverride({
        participantId: 'security',
        objective: { type: 'CHALLENGE', description: 'User injected challenge', constraints: [] },
    });

    const second = await policy.proposeNextTurn(baseContext(), { id: 's', data: {} });
    expect(second!.objective.description).toBe('User injected challenge');

    // plan cursor was preserved: next is the original CRITIQUE, not skipped
    const third = await policy.proposeNextTurn(baseContext(), { id: 's', data: {} });
    expect(third!.objective.description).toBe('Review A');
});

test('HybridPolicy: skipNextTurn drops the planned turn', async () => {
    const policy = new HybridPolicy(plan);
    const first = await policy.proposeNextTurn(baseContext(), { id: 's', data: {} });
    expect(first!.objective.description).toBe('Plan A');

    policy.skipNextTurn();
    const second = await policy.proposeNextTurn(baseContext(), { id: 's', data: {} });
    // skipped "Review A", next is "Fix A"
    expect(second!.objective.description).toBe('Fix A');
});

test('Orchestrator routes overrideTurn/skipNext to HybridPolicy via real execution', async () => {
    const bus = makeEventBus();
    const captured: any[] = [];
    const adapter: IChatExecutorAdapter = {
        handleMessage: vi.fn((req: any) => {
            captured.push(req);
            bus.emit('chat:response', {
                requestId: req.requestId,
                content: 'ok',
                status: 'done',
                tokens: 1,
            });
        }),
        cancelRequest: vi.fn(),
    };
    const engine = new ChatExecutionEngine(adapter, bus);
    const policy = new HybridPolicy(plan);
    const orch = new ConversationOrchestrator(policy, engine, baseContext());

    // Turn 1 (architect/Plan A)
    await orch.processNextStep('sess-h');
    expect(captured[captured.length - 1].options.metadata.agentId).toBe('architect');

    // director pauses, injects a custom challenge, then resumes
    orch.pause();
    orch.overrideTurn({
        participantId: 'security',
        objective: { type: 'CHALLENGE', description: 'Director challenge', constraints: [] },
    });
    orch.resume();
    await orch.processNextStep('sess-h');
    expect(captured[captured.length - 1].options.metadata.agentId).toBe('security');
    expect(
        captured[captured.length - 1].messages[captured[captured.length - 1].messages.length - 1]
            .content,
    ).toContain('Director challenge');

    // next is the preserved plan turn (Review A), proving override did not consume the plan
    await orch.processNextStep('sess-h');
    expect(
        captured[captured.length - 1].messages[captured[captured.length - 1].messages.length - 1]
            .content,
    ).toContain('Review A');
});
