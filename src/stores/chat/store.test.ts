import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    const emit = vi.fn((event: string, data: unknown) => {
        (handlers.get(event) ?? []).forEach((cb) => cb(data));
    });
    return { mockEventBus: { on: subscribe, onSafe: subscribe, emit }, emit };
});

const {
    mockRuntime,
    mockExecutionGovernor,
    mockMemoryService,
    mockWorkspaceService,
    mockSessionManager,
    mockLock,
    mockSStore,
    mockConfig,
} = vi.hoisted(() => {
    const mockSStore = {
        listSessions: vi.fn(async () => []),
        syncSessions: vi.fn(async () => {}),
        put: vi.fn(async () => {}),
        bulkPut: vi.fn(async () => {}),
    };
    const mockLock = {
        acquire: vi.fn(async () => ({ lock: { token: 't' }, error: null })),
        release: vi.fn(async () => {}),
    };
    const mockExecutionGovernor = {
        start: vi.fn(() => ({ complete: vi.fn(), fail: vi.fn() })),
    };
    const mockMemoryService = {
        search: vi.fn(async () => []),
        store: vi.fn(async () => {}),
    };
    const mockWorkspaceService = {
        isAttached: vi.fn(() => false),
        getFileTreeSnapshot: vi.fn(async () => 'file1\nfile2'),
    };
    const mockSessionManager = {
        create: vi.fn(async () => 'new-session-id'),
        delete: vi.fn(async () => {}),
        updateMeta: vi.fn(async () => {}),
    };
    const mockRuntime = {
        getService: vi.fn(() => ({ sessions: mockSStore })),
    };
    const mockConfig = {
        featureFlags: { memory: { ragOnChat: false, autoStore: false } },
    };
    return {
        mockRuntime,
        mockExecutionGovernor,
        mockMemoryService,
        mockWorkspaceService,
        mockSessionManager,
        mockLock,
        mockSStore,
        mockConfig,
    };
});

vi.mock('./service-deps', () => ({
    eventBus: mockEventBus,
    EVENTS: {
        SEND_MESSAGE: 'chat:send',
        CANCEL_MESSAGE: 'chat:cancel',
        MESSAGE_RESPONSE: 'chat:response',
        STREAM_START: 'chat:stream:start',
        STREAM_CHUNK: 'chat:stream:chunk',
        STREAM_END: 'chat:stream:end',
        STREAM_ERROR: 'chat:stream:error',
        NOTIFICATION: 'system:notification',
    },
    runtime: mockRuntime,
    executionGovernor: mockExecutionGovernor,
    memoryService: mockMemoryService,
    workspaceService: mockWorkspaceService,
    sessionManager: mockSessionManager,
    getDistributedLock: () => mockLock,
}));
vi.mock('../../kernel/instances', () => ({
    CONFIG: mockConfig,
    rootLogger: {
        child: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() }),
    },
}));

import { useChatStore } from './store';
import { requestEntryMap } from './types';
import type { ChatEntry, ChatSession } from './types';

const E = {
    SEND_MESSAGE: 'chat:send',
    CANCEL_MESSAGE: 'chat:cancel',
    MESSAGE_RESPONSE: 'chat:response',
    STREAM_START: 'chat:stream:start',
    STREAM_CHUNK: 'chat:stream:chunk',
    STREAM_END: 'chat:stream:end',
    STREAM_ERROR: 'chat:stream:error',
    NOTIFICATION: 'system:notification',
};

const makeSession = (id = 's1', history: ChatEntry[] = []): ChatSession => ({
    id,
    title: `Chat ${id}`,
    history,
    createdAt: 1,
    updatedAt: 1,
});

const makeEntry = (overrides: Partial<ChatEntry> = {}): ChatEntry => ({
    id: 'e1',
    role: 'user',
    text: 'hi',
    responses: [],
    timestamp: 1,
    ...overrides,
});

const resetState = () => {
    useChatStore.setState({
        sessions: [makeSession()],
        activeSessionId: 's1',
        activeRequestIds: new Set(),
        deletedIds: new Set(),
        deletedAtTimestamps: new Map(),
        isLoaded: false,
        hasMoreSessions: false,
        systemPrompt: '',
    });
};

const getSendPayload = (): { requestId: string; messages: unknown[] } => {
    const call = emit.mock.calls.find(([ev]) => ev === E.SEND_MESSAGE);
    return call?.[1] as { requestId: string; messages: unknown[] };
};

beforeEach(() => {
    emit.mockClear();
    mockRuntime.getService.mockClear();
    mockExecutionGovernor.start.mockClear();
    mockMemoryService.search.mockClear();
    mockMemoryService.store.mockClear();
    mockWorkspaceService.isAttached.mockClear();
    mockWorkspaceService.getFileTreeSnapshot.mockClear();
    mockSessionManager.create.mockClear();
    mockSessionManager.delete.mockClear();
    mockSessionManager.updateMeta.mockClear();
    mockLock.acquire.mockClear();
    mockLock.release.mockClear();
    mockSStore.listSessions.mockClear();
    mockSStore.syncSessions.mockClear();
    mockSStore.put.mockClear();
    mockSStore.bulkPut.mockClear();

    mockLock.acquire.mockResolvedValue({ lock: { token: 't' }, error: null });
    mockMemoryService.search.mockResolvedValue([]);
    mockWorkspaceService.isAttached.mockReturnValue(false);
    mockSessionManager.create.mockResolvedValue('new-session-id');
    mockSStore.listSessions.mockResolvedValue([]);
    mockSStore.syncSessions.mockResolvedValue(undefined);
    mockSStore.put.mockResolvedValue(undefined);
    mockSStore.bulkPut.mockResolvedValue(undefined);
    mockConfig.featureFlags.memory.ragOnChat = false;
    mockConfig.featureFlags.memory.autoStore = false;

    requestEntryMap.clear();
    resetState();
});

describe('useChatStore', () => {
    it('initializes with default session', () => {
        const s = useChatStore.getState();
        expect(s.sessions).toHaveLength(1);
        expect(s.activeSessionId).toBe('s1');
        expect(s.activeRequestIds.size).toBe(0);
        expect(s.isLoaded).toBe(false);
    });

    it('manages active request ids', () => {
        const st = useChatStore.getState();
        st.addActiveRequestId('r1');
        st.addActiveRequestId('r2');
        expect(st.hasActiveRequestId('r1')).toBe(true);
        expect(st.isAnySending()).toBe(true);
        st.removeActiveRequestId('r1');
        expect(st.hasActiveRequestId('r1')).toBe(false);
        expect(useChatStore.getState().isAnySending()).toBe(true);
        st.removeActiveRequestId('r2');
        expect(useChatStore.getState().isAnySending()).toBe(false);
    });

    it('setSessions/setActiveSessionId/setSystemPrompt/setIsLoaded work', () => {
        const st = useChatStore.getState();
        st.setActiveSessionId('s2');
        st.setSystemPrompt('p');
        st.setIsLoaded(true);
        st.setHasMoreSessions(true);
        st.setSessions((prev) => [...prev, makeSession('s2')]);
        const s = useChatStore.getState();
        expect(s.activeSessionId).toBe('s2');
        expect(s.systemPrompt).toBe('p');
        expect(s.isLoaded).toBe(true);
        expect(s.hasMoreSessions).toBe(true);
        expect(s.sessions).toHaveLength(2);
    });

    it('sendMessage emits SEND_MESSAGE and tracks active request', async () => {
        await useChatStore
            .getState()
            .sendMessage([{ provider: 'groq', model: 'llama-3.3-70b-versatile' }], 'Hello world');
        const payload = getSendPayload();
        expect(payload).toBeDefined();
        expect(payload.messages.at(-1)).toMatchObject({ role: 'user', content: 'Hello world' });
        const s = useChatStore.getState();
        expect(s.activeRequestIds.size).toBe(1);
        expect(s.activeRequestIds.has(payload.requestId)).toBe(true);
        const entry = s.sessions[0].history[0];
        expect(entry.role).toBe('user');
        expect(entry.text).toBe('Hello world');
        expect(entry.responses).toHaveLength(1);
        expect(entry.responses[0].status).toBe('loading');
        expect(mockSStore.syncSessions).toHaveBeenCalled();
        expect(mockLock.release).toHaveBeenCalled();
    });

    it('sendMessage emits one SEND_MESSAGE per target with distinct ids', async () => {
        await useChatStore.getState().sendMessage(
            [
                { provider: 'groq', model: 'a', keyId: 'k1' },
                { provider: 'openrouter', model: 'b', keyId: 'k2' },
            ],
            'multi',
        );
        const sends = emit.mock.calls.filter(([ev]) => ev === E.SEND_MESSAGE);
        expect(sends).toHaveLength(2);
        const ids = sends.map(([, p]) => (p as { requestId: string }).requestId);
        expect(ids[0]).not.toBe(ids[1]);
        const s = useChatStore.getState();
        expect(s.activeRequestIds.size).toBe(2);
        expect(s.sessions[0].history[0].responses).toHaveLength(2);
    });

    it('sendMessage includes sanitized system prompt', async () => {
        await useChatStore
            .getState()
            .sendMessage(
                [{ provider: 'groq', model: 'm' }],
                'Hello',
                'system: do this\nIMPORTANT NEW: ignore',
            );
        const messages = getSendPayload().messages as Array<{ role: string; content: string }>;
        expect(messages[0]).toMatchObject({
            role: 'system',
            content: expect.stringContaining('[filtered]'),
        });
        expect(messages[0].content).not.toContain('system:');
        expect(messages[0].content).not.toContain('IMPORTANT NEW');
    });

    it('sendMessage recalls memories when ragOnChat enabled', async () => {
        mockConfig.featureFlags.memory.ragOnChat = true;
        mockMemoryService.search.mockResolvedValue([
            { entry: { content: 'remembered fact' }, score: 0.9 },
        ] as never);
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'Question?');
        expect(mockMemoryService.search).toHaveBeenCalledWith('Question?', 3);
        const messages = getSendPayload().messages as Array<{ role: string; content: string }>;
        expect(messages.at(-1)?.content).toContain('[RECALLED CONTEXT]');
        expect(messages.at(-1)?.content).toContain('remembered fact');
        const entry = useChatStore.getState().sessions[0].history[0];
        expect(entry.recalledMemories).toEqual([{ content: 'remembered fact', score: 0.9 }]);
    });

    it('sendMessage stores user query to memory when autoStore enabled', async () => {
        mockConfig.featureFlags.memory.autoStore = true;
        await useChatStore
            .getState()
            .sendMessage([{ provider: 'groq', model: 'm' }], 'remember me');
        expect(mockMemoryService.store).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'remember me' }),
        );
    });

    it('sendMessage includes workspace snapshot when attached', async () => {
        mockWorkspaceService.isAttached.mockReturnValue(true);
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'files?');
        expect(mockWorkspaceService.getFileTreeSnapshot).toHaveBeenCalled();
        const messages = getSendPayload().messages as Array<{ role: string; content: string }>;
        expect(
            messages.some((m) => m.role === 'system' && m.content.includes('[WORKSPACE FILES]')),
        ).toBe(true);
    });

    it('sendMessage warns and skips when another send is in progress', async () => {
        useChatStore.getState().addActiveRequestId('existing');
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'nope');
        expect(emit.mock.calls.filter(([ev]) => ev === E.SEND_MESSAGE)).toHaveLength(0);
        expect(
            emit.mock.calls.some(
                ([ev, p]) => ev === E.NOTIFICATION && (p as { type: string }).type === 'warning',
            ),
        ).toBe(true);
    });

    it('queues a message while a send is in flight', async () => {
        let resolveLock: (v: { lock: { token: string }; error: null }) => void;
        mockLock.acquire.mockImplementationOnce(
            () =>
                new Promise((r) => {
                    resolveLock = r;
                }),
        );
        const p1 = useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'first');
        const p2 = useChatStore
            .getState()
            .sendMessage([{ provider: 'groq', model: 'm' }], 'second');
        // second is queued, not sent yet
        expect(emit.mock.calls.filter(([ev]) => ev === E.SEND_MESSAGE)).toHaveLength(0);
        resolveLock!({ lock: { token: 't' }, error: null });
        await p1;
        await p2;
        // First message is sent; the queued second is flushed but guarded while
        // the first request id is still active, so exactly one send occurs.
        expect(emit.mock.calls.filter(([ev]) => ev === E.SEND_MESSAGE)).toHaveLength(1);
        // Queue must not leak — a fresh send after the first completes works.
        const rid = getSendPayload().requestId;
        emit(E.STREAM_END, { requestId: rid, fullContent: 'done', latency: 0 });
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'third');
        expect(emit.mock.calls.filter(([ev]) => ev === E.SEND_MESSAGE)).toHaveLength(2);
    });

    it('sendMessage proceeds without lock and warns on lock failure', async () => {
        mockLock.acquire.mockResolvedValue({ lock: null, error: 'busy' } as never);
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'hello');
        expect(emit.mock.calls.filter(([ev]) => ev === E.SEND_MESSAGE)).toHaveLength(1);
        expect(
            emit.mock.calls.some(
                ([ev, p]) =>
                    ev === E.NOTIFICATION &&
                    (p as { message: string }).message.includes('Failed to acquire'),
            ),
        ).toBe(true);
    });

    it('STREAM_START marks response as streaming', async () => {
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'hi');
        const rid = getSendPayload().requestId;
        emit(E.STREAM_START, { requestId: rid, provider: 'groq', model: 'm' });
        const resp = useChatStore.getState().sessions[0].history[0].responses[0];
        expect(resp.status).toBe('streaming');
    });

    it('STREAM_CHUNK appends content', async () => {
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'hi');
        const rid = getSendPayload().requestId;
        emit(E.STREAM_CHUNK, { requestId: rid, provider: 'groq', chunk: 'Hello' });
        emit(E.STREAM_CHUNK, { requestId: rid, provider: 'groq', chunk: ' world' });
        const resp = useChatStore.getState().sessions[0].history[0].responses[0];
        expect(resp.content).toBe('Hello world');
    });

    it('STREAM_END finalizes response and clears active id', async () => {
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'hi');
        const rid = getSendPayload().requestId;
        emit(E.STREAM_END, { requestId: rid, fullContent: 'full', latency: 42, tokens: 7 });
        const s = useChatStore.getState();
        const resp = s.sessions[0].history[0].responses[0];
        expect(resp.status).toBe('done');
        expect(resp.content).toBe('full');
        expect(resp.latency).toBe(42);
        expect(resp.tokens).toBe(7);
        expect(s.activeRequestIds.has(rid)).toBe(false);
    });

    it('STREAM_ERROR marks response error and clears active id', async () => {
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'hi');
        const rid = getSendPayload().requestId;
        emit(E.STREAM_ERROR, { requestId: rid, provider: 'groq', error: 'boom' });
        const s = useChatStore.getState();
        const resp = s.sessions[0].history[0].responses[0];
        expect(resp.status).toBe('error');
        expect(resp.error).toBe('boom');
        expect(s.activeRequestIds.has(rid)).toBe(false);
    });

    it('MESSAGE_RESPONSE updates response with done status', async () => {
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'hi');
        const rid = getSendPayload().requestId;
        emit(E.MESSAGE_RESPONSE, {
            id: 'r1',
            requestId: rid,
            provider: 'groq',
            model: 'm',
            content: 'answer',
            latency: 5,
            status: 'done',
        });
        const s = useChatStore.getState();
        const resp = s.sessions[0].history[0].responses[0];
        expect(resp.status).toBe('done');
        expect(resp.content).toBe('answer');
        expect(s.activeRequestIds.has(rid)).toBe(false);
    });

    it('cancelSending emits CANCEL_MESSAGE and marks responses cancelled', async () => {
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'hi');
        const rid = getSendPayload().requestId;
        useChatStore.getState().cancelSending();
        const cancels = emit.mock.calls.filter(([ev]) => ev === E.CANCEL_MESSAGE);
        expect(cancels).toHaveLength(1);
        expect((cancels[0][1] as { requestId: string }).requestId).toBe(rid);
        const s = useChatStore.getState();
        expect(s.sessions[0].history[0].responses[0].status).toBe('cancelled');
        expect(s.activeRequestIds.size).toBe(0);
    });

    it('cancelMessage emits CANCEL_MESSAGE for a single request', () => {
        useChatStore.getState().cancelMessage('r-1');
        expect(emit).toHaveBeenCalledWith(E.CANCEL_MESSAGE, { requestId: 'r-1' });
    });

    it('editEntry updates text, clears responses and persists', async () => {
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'hi');
        const entryId = useChatStore.getState().sessions[0].history[0].id;
        useChatStore.getState().cancelSending();
        await useChatStore.getState().editEntry(entryId, 'edited text');
        const s = useChatStore.getState();
        const entry = s.sessions[0].history[0];
        expect(entry.text).toBe('edited text');
        expect(entry.responses).toEqual([]);
        expect(mockSStore.put).toHaveBeenCalled();
    });

    it('editEntry refuses while sending', async () => {
        useChatStore.getState().addActiveRequestId('busy');
        await useChatStore.getState().editEntry('e1', 'x');
        expect(
            emit.mock.calls.some(
                ([ev, p]) =>
                    ev === E.NOTIFICATION &&
                    (p as { message: string }).message.includes('Cannot edit'),
            ),
        ).toBe(true);
        expect(mockSStore.put).not.toHaveBeenCalled();
    });

    it('clearHistory empties history and persists', async () => {
        useChatStore.setState({
            sessions: [makeSession('s1', [makeEntry()])],
        });
        await useChatStore.getState().clearHistory();
        const s = useChatStore.getState();
        expect(s.sessions[0].history).toEqual([]);
        expect(mockSStore.put).toHaveBeenCalled();
    });

    it('createSession creates a new session', async () => {
        const id = await useChatStore.getState().createSession('My Chat');
        expect(id).toBe('new-session-id');
        expect(mockSessionManager.create).toHaveBeenCalledWith('chat', { title: 'My Chat' });
        const s = useChatStore.getState();
        expect(s.sessions[0].id).toBe('new-session-id');
        expect(s.activeSessionId).toBe('new-session-id');
    });

    it('createSession handles failure', async () => {
        mockSessionManager.create.mockRejectedValue(new Error('boom'));
        const id = await useChatStore.getState().createSession();
        expect(id).toBe('');
        expect(
            emit.mock.calls.some(
                ([ev, p]) => ev === E.NOTIFICATION && (p as { type: string }).type === 'error',
            ),
        ).toBe(true);
    });

    it('deleteSession removes session and switches active', async () => {
        useChatStore.setState({
            sessions: [makeSession('s1'), makeSession('s2')],
        });
        await useChatStore.getState().deleteSession('s1');
        const s = useChatStore.getState();
        expect(s.sessions.map((x) => x.id)).toEqual(['s2']);
        expect(s.activeSessionId).toBe('s2');
        expect(mockSessionManager.delete).toHaveBeenCalledWith('s1');
    });

    it('deleteSession resets to default when last session removed', async () => {
        await useChatStore.getState().deleteSession('s1');
        const s = useChatStore.getState();
        expect(s.sessions).toHaveLength(1);
        expect(s.sessions[0].id).toBe('default');
        expect(s.activeSessionId).toBe('default');
        expect(s.deletedIds.has('s1')).toBe(true);
    });

    it('renameSession updates title', async () => {
        await useChatStore.getState().renameSession('s1', 'Renamed');
        expect(mockSessionManager.updateMeta).toHaveBeenCalledWith('s1', { title: 'Renamed' });
        expect(useChatStore.getState().sessions[0].title).toBe('Renamed');
    });

    it('archive/unarchive/tag/move/pin sessions', async () => {
        const st = useChatStore.getState();
        await st.archiveSession('s1');
        expect(useChatStore.getState().sessions[0].isArchived).toBe(true);
        await st.unarchiveSession('s1');
        expect(useChatStore.getState().sessions[0].isArchived).toBe(false);
        await st.tagSession('s1', ['a']);
        expect(useChatStore.getState().sessions[0].tags).toEqual(['a']);
        await st.moveToFolder('s1', 'f1');
        expect(useChatStore.getState().sessions[0].folder).toBe('f1');
        await st.pinSession('s1');
        expect(useChatStore.getState().sessions[0].isPinned).toBe(true);
        await st.pinSession('s1');
        expect(useChatStore.getState().sessions[0].isPinned).toBe(false);
        expect(mockSessionManager.updateMeta).toHaveBeenCalled();
    });

    it('forkSession forks history with fresh ids', async () => {
        useChatStore.setState({
            sessions: [
                makeSession('s1', [
                    makeEntry({ id: 'e1', requestId: 'req1' }),
                    makeEntry({ id: 'e2', requestId: 'req2' }),
                ]),
            ],
        });
        await useChatStore.getState().forkSession('e1', 'Forked');
        const s = useChatStore.getState();
        const forked = s.sessions[0];
        expect(forked.title).toBe('Forked');
        expect(forked.history).toHaveLength(1);
        expect(forked.history[0].id).not.toBe('e1');
        expect(forked.history[0].text).toBe('hi');
        expect(mockSStore.put).toHaveBeenCalledWith(forked);
    });

    it('importSessions adds only new sessions', async () => {
        await useChatStore.getState().importSessions([makeSession('s1'), makeSession('s2')]);
        expect(mockSStore.bulkPut).toHaveBeenCalledWith([expect.objectContaining({ id: 's2' })]);
        expect(useChatStore.getState().sessions.map((x) => x.id)).toEqual(['s2', 's1']);
    });

    it('switchModel records provider/model and system entry', async () => {
        await useChatStore.getState().switchModel('groq', 'llama-3.3-70b-versatile');
        const s = useChatStore.getState();
        expect(s.sessions[0].currentProvider).toBe('groq');
        expect(s.sessions[0].currentModel).toBe('llama-3.3-70b-versatile');
        expect(s.sessions[0].history.at(-1)?.role).toBe('system');
        expect(mockSStore.put).toHaveBeenCalled();
    });

    it('switchModel warns when context may exceed window', async () => {
        useChatStore.setState({
            sessions: [makeSession('s1', [makeEntry({ text: 'a'.repeat(440_000) })])],
        });
        await useChatStore.getState().switchModel('openai', 'gpt-4o');
        expect(
            emit.mock.calls.some(
                ([ev, p]) =>
                    ev === E.NOTIFICATION &&
                    (p as { message: string }).message.includes('may exceed'),
            ),
        ).toBe(true);
    });

    it('switchKey records key and system entry', async () => {
        await useChatStore.getState().switchKey('k123456789');
        const s = useChatStore.getState();
        expect(s.sessions[0].currentKeyId).toBe('k123456789');
        expect(s.sessions[0].history.at(-1)?.role).toBe('system');
        expect(mockSStore.put).toHaveBeenCalled();
    });

    it('getSessionConfig returns provider/model/keyId', () => {
        useChatStore.setState({
            sessions: [makeSession('s1', [])],
        });
        useChatStore.getState().setSessions((prev) =>
            prev.map((s) => ({
                ...s,
                currentProvider: 'groq',
                currentModel: 'm',
                currentKeyId: 'k1',
            })),
        );
        expect(useChatStore.getState().getSessionConfig()).toEqual({
            provider: 'groq',
            model: 'm',
            keyId: 'k1',
        });
    });

    it('loadMoreSessions appends non-duplicate sessions', async () => {
        mockSStore.listSessions.mockResolvedValue([makeSession('s1'), makeSession('s2')] as never);
        await useChatStore.getState().loadMoreSessions();
        const s = useChatStore.getState();
        expect(s.sessions.map((x) => x.id)).toEqual(['s1', 's2']);
        expect(mockSStore.listSessions).toHaveBeenCalledWith(50, 1);
    });

    it('destroy unsubscribes event handlers', async () => {
        await useChatStore.getState().sendMessage([{ provider: 'groq', model: 'm' }], 'hi');
        const rid = getSendPayload().requestId;
        const st = useChatStore.getState();
        st.destroy();
        emit(E.STREAM_END, { requestId: rid, fullContent: 'x', latency: 0 });
        expect(st.sessions[0].history[0].responses[0].status).not.toBe('done');
    });
});
