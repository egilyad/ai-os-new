/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, vi } from 'vitest';
import { ChatExecutionEngine } from './conversation-execution-engine';

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

test('ChatExecutionEngine maps Turn to ChatExecutor and returns result', async () => {
    const bus = makeEventBus();
    const captured: any[] = [];
    const adapter: IChatExecutorAdapter = {
        handleMessage: vi.fn((req: any) => captured.push(req)),
        cancelRequest: vi.fn(),
    };
    const engine = new ChatExecutionEngine(adapter, bus);

    const done = engine.execute(
        {
            participantId: 'architect',
            objective: {
                type: 'INTRODUCE',
                description: 'Introduce design',
                constraints: ['Be concise'],
            },
            targetTurnId: 't1',
        } as any,
        {
            topic: 'Ashdod',
            participants: [{ id: 'architect', role: 'Architect' }],
            history: [],
            metadata: { sessionId: 'sess-1' },
        } as any,
        new AbortController().signal,
    );

    expect(captured.length).toBe(1);
    expect(captured[0].options.metadata.agentId).toBe('architect');
    expect(captured[0].options.metadata.objective).toBe('INTRODUCE');
    const msgLast = captured[0].messages[captured[0].messages.length - 1];
    const contentStr =
        typeof msgLast.content === 'string' ? msgLast.content : JSON.stringify(msgLast.content);
    expect(contentStr).toContain('Introduce design');
    expect(contentStr).toContain('Be concise');
    expect(contentStr).toContain('t1');

    bus.emit('chat:response', {
        requestId: captured[0].requestId,
        content: 'Design v1',
        status: 'done',
        tokens: 10,
    });

    const result = await done;
    expect(result.success).toBe(true);
    expect(result.content).toBe('Design v1');
    expect(result.tokens).toBe(10);
});

test('ChatExecutionEngine resolves as failure on chat error', async () => {
    const bus = makeEventBus();
    const captured: any[] = [];
    const adapter: IChatExecutorAdapter = {
        handleMessage: vi.fn((req: any) => captured.push(req)),
        cancelRequest: vi.fn(),
    };
    const engine = new ChatExecutionEngine(adapter, bus);

    const done = engine.execute(
        {
            participantId: 'a',
            objective: { type: 'CUSTOM', description: 'x', constraints: [] },
        } as any,
        { topic: 't', participants: [], history: [], metadata: {} } as any,
        new AbortController().signal,
    );

    bus.emit('chat:response', { requestId: captured[0].requestId, status: 'error', error: 'boom' });

    const result = await done;
    expect(result.success).toBe(false);
    expect(result.error).toBe('boom');
});

test('ChatExecutionEngine injects resolved agent persona as system message', async () => {
    const bus = makeEventBus();
    const captured: any[] = [];
    const adapter: IChatExecutorAdapter = {
        handleMessage: vi.fn((req: any) => captured.push(req)),
        cancelRequest: vi.fn(),
    };
    const resolver = {
        resolveAgent: (id: string) =>
            id === 'architect'
                ? {
                      id,
                      name: 'Architect',
                      role: 'Architect',
                      systemPrompt: 'You are a systems architect.',
                      model: 'gpt-4o',
                  }
                : null,
    };
    const engine = new ChatExecutionEngine(adapter, bus, resolver);

    engine.execute(
        {
            participantId: 'architect',
            objective: { type: 'INTRODUCE', description: 'Introduce design', constraints: [] },
        } as any,
        {
            topic: 'Ashdod',
            participants: [{ id: 'architect', role: 'Architect' }],
            history: [],
            metadata: {},
        } as any,
        new AbortController().signal,
    );

    expect(captured.length).toBe(1);
    const messages = captured[0].messages;
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toBe('You are a systems architect.');
    expect(captured[0].model).toBe('gpt-4o');
    expect(captured[0].options.metadata.agentId).toBe('architect');
    expect(captured[0].options.metadata.participantName).toBe('Architect');
    // user prompt is still the last message
    expect(messages[messages.length - 1].role).toBe('user');
});

test('ChatExecutionEngine leaves request unchanged when resolver is absent', async () => {
    const bus = makeEventBus();
    const captured: any[] = [];
    const adapter: IChatExecutorAdapter = {
        handleMessage: vi.fn((req: any) => captured.push(req)),
        cancelRequest: vi.fn(),
    };
    const engine = new ChatExecutionEngine(adapter, bus);

    engine.execute(
        {
            participantId: 'p1',
            objective: { type: 'CUSTOM', description: 'x', constraints: [] },
        } as any,
        { topic: 't', participants: [], history: [], metadata: {} } as any,
        new AbortController().signal,
    );

    expect(captured.length).toBe(1);
    expect(captured[0].messages[0].role).toBe('user');
    expect(captured[0].model).toBe('default');
});

test('ChatExecutionEngine honours session abort signal', async () => {
    const bus = makeEventBus();
    const adapter: IChatExecutorAdapter = { handleMessage: vi.fn(), cancelRequest: vi.fn() };
    const engine = new ChatExecutionEngine(adapter, bus);

    const controller = new AbortController();
    const done = engine.execute(
        {
            participantId: 'a',
            objective: { type: 'CUSTOM', description: 'x', constraints: [] },
        } as any,
        { topic: 't', participants: [], history: [], metadata: {} } as any,
        controller.signal,
    );

    controller.abort();

    const result = await done;
    expect(result.success).toBe(false);
    expect(adapter.cancelRequest).toHaveBeenCalled();
});
