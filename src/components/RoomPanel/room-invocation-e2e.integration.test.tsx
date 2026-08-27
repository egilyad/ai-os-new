import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { defaultContainer } from '../../kernel/container';
import { clearResolvedServices } from '../../kernel/service-helper';
import { eventBus as coreEventBus, EVENTS as CORE_EVENTS } from '../../kernel/events/event-bus';
import { EVENTS } from '../../kernel/events/event-registry';
import { ScenarioRepository } from '../../kernel/dal/scenario-repository';
import { createTestDb, type TestDb } from '../../kernel/dal/_test-harness';
import { useInvocationStore } from '../../stores/invocationStore';
import { invocationEngine } from '../../kernel/instances/services-extras';
import { registerPhase20 } from '../../kernel/service-registration/phase20-director';
import { registerPhase21 } from '../../kernel/service-registration/phase21-invocation';
import { makeHelpers, type PhaseContext } from '../../kernel/service-registration/helpers';

/**
 * Invocation Engine — E2E integration gate (Step 6 smoke).
 *
 * One full REAL path, driven entirely through the production UI + runtime:
 *
 *   RoomPanel (real)                      ── UI
 *     └─ invocationEngine.invoke(req)     ── real lazyService → real service
 *          └─ InvocationEngineService     ── real (Step 4), evaluates policy
 *               └─ InvocationRepository    ── real persistence (v20 tables)
 *                    └─ InvocationExecutionDelegate
 *                         └─ ConversationDirectorService (real) + stubbed chatService
 *                              └─ CONVERSATION_* events on coreEventBus
 *                                   └─ useInvocationStore (real) → RoomPanel re-render
 *
 * The smoke policy is seeded through the EXISTING `invocationPolicies` repo
 * (no new UI / service / event / table). The agent is invoked by the human from
 * Room (source 'human-mention'); `actions.target` is intentionally NOT used for
 * resolution — Room explicitly submits SMOKE_AGENT as `req.target`.
 */

const SMOKE_AGENT = 'smoke-agent';

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

interface ChatExecutorRequest {
    requestId: string;
    provider: string;
    model: string;
    messages: { content?: string }[];
}

interface IChatExecutorAdapter {
    handleMessage: (req: ChatExecutorRequest) => void;
    cancelRequest: () => void;
}

function makeChatExecutor(): IChatExecutorAdapter {
    return {
        handleMessage: (req) => {
            const requestId = req.requestId;
            Promise.resolve().then(() =>
                coreEventBus.emit(EVENTS.MESSAGE_RESPONSE, {
                    id: crypto.randomUUID(),
                    requestId,
                    provider: req.provider,
                    model: req.model,
                    content: `reply:${req.messages[req.messages.length - 1]?.content ?? ''}`,
                    latency: 1,
                    status: 'done',
                    tokens: 3,
                }),
            );
        },
        cancelRequest: () => {},
    };
}

describe('Invocation Engine — Room → Engine → policy → ConversationCore E2E', () => {
    let tdb: TestDb;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        clearResolvedServices();

        // Real infra tokens (B6.1 style) — values, not toy mocks of the engine.
        defaultContainer.register('eventBus', coreEventBus);
        defaultContainer.register('chatService', makeChatExecutor());
        defaultContainer.register('agentService', {
            getAgents: () => [
                {
                    id: SMOKE_AGENT,
                    name: 'Smoke Agent',
                    role: 'Analyst',
                    status: 'active',
                    stats: {},
                },
                {
                    id: 'system-architect',
                    name: 'System Architect',
                    role: 'Architect',
                    status: 'active',
                    stats: {},
                },
            ],
            resolveAgent: (id: string) => ({
                id,
                name: id,
                role: 'Analyst',
                systemPrompt: `Persona of ${id}.`,
                model: undefined,
                specializations: ['testing'],
            }),
        } as unknown as import('../../kernel/services/agent-service').AgentService);
        defaultContainer.register('database', {
            invocations: tdb.db.invocations,
            invocationPolicies: tdb.db.invocationPolicies,
        } as unknown as import('../../kernel/services/database-service').DatabaseService);
        defaultContainer.register('dal', {
            scenarios: new ScenarioRepository(tdb.db),
        } as unknown as import('../../kernel/dal').DataAccessLayer);
        defaultContainer.register('debateService', {
            startDebate: async () => ({ id: 'stub-debate' }) as never,
        } as unknown as import('../../kernel/services/debate-runtime/debate-sync-manager').DebateSyncManager);

        const ctx: PhaseContext = {
            container: defaultContainer,
            eventBus: coreEventBus as never,
            registerWithLifecycle: () => {},
        };
        registerPhase20(makeHelpers(ctx), ctx);
        registerPhase21(makeHelpers(ctx), ctx);

        // Seed ONE minimal smoke policy through the existing repo mechanism.
        await invocationEngine.createPolicy({
            name: 'Room smoke policy',
            enabled: true,
            createdBy: 'e2e-seed',
            match: { source: 'human-mention' },
            actions: { target: { agentId: SMOKE_AGENT }, mode: 'chat' },
            allowAgentInitiatedInvocation: false,
            priority: 1,
        });

        act(() => useInvocationStore.getState().clear());
    });

    afterEach(async () => {
        await tdb.clearAll();
    });

    it('drives a real Room invocation end-to-end: requested → accepted → executing → done', async () => {
        const RoomPanel = (await import('./RoomPanel')).default;
        render(<RoomPanel />);

        // Fill the real Invoke form: target = SMOKE_AGENT, any task.
        fireEvent.change(screen.getByRole('combobox', { name: 'room.invoke.agent' }), {
            target: { value: SMOKE_AGENT },
        });
        fireEvent.change(screen.getByPlaceholderText('room.invoke.taskPlaceholder'), {
            target: { value: 'e2e smoke reason' },
        });

        // The single write path: real Invoke button → invocationEngine.invoke().
        fireEvent.click(screen.getByText('room.invoke.submit'));

        // Real store reaches terminal `done`.
        await waitFor(
            () => {
                const s = useInvocationStore.getState();
                const id = s.order[0];
                expect(id).toBeTruthy();
                expect(s.invocations[id!]!.status).toBe('done');
            },
            { timeout: 20000 },
        );

        const s = useInvocationStore.getState();
        const id = s.order[0]!;

        // Full intent lifecycle observed (D7 audit trail).
        const events = s.log.map((e) => e.event);
        expect(events).toContain('requested');
        expect(events).toContain('accepted');
        expect(events).toContain('executing');
        expect(events).toContain('done');

        // Real ConversationCore live output flowed through coreEventBus.
        expect(s.feed.length).toBeGreaterThan(0);

        // Real persistence: the Invocation aggregate was written by the Engine only.
        const persisted = await invocationEngine.getInvocation(id);
        expect(persisted?.status).toBe('done');
        expect(persisted?.policyRef).toBeTruthy();
        expect(persisted?.resolvedAgents.map((a) => a.id)).toContain(SMOKE_AGENT);
    });

    it('stays generic — only conversation:* (no debate/forum) events fire', async () => {
        const seen: string[] = [];
        const unsub = coreEventBus.subscribeAll((p) => seen.push(p.event));

        const RoomPanel = (await import('./RoomPanel')).default;
        render(<RoomPanel />);
        fireEvent.change(screen.getByRole('combobox', { name: 'room.invoke.agent' }), {
            target: { value: SMOKE_AGENT },
        });
        fireEvent.change(screen.getByPlaceholderText('room.invoke.taskPlaceholder'), {
            target: { value: 'e2e generic guard' },
        });
        fireEvent.click(screen.getByText('room.invoke.submit'));

        await waitFor(
            () =>
                expect(
                    useInvocationStore.getState().invocations[
                        useInvocationStore.getState().order[0]!
                    ]?.status,
                ).toBe('done'),
            { timeout: 20000 },
        );
        unsub();

        expect(seen.some((e) => /^debate/i.test(e))).toBe(false);
        expect(seen.some((e) => e === CORE_EVENTS.CONVERSATION_TURN_START)).toBe(true);
        expect(seen.some((e) => e === CORE_EVENTS.CONVERSATION_TURN_COMPLETE)).toBe(true);
    });

    it('allows ANY human-selected person via a source-only policy (System Architect)', async () => {
        // The seeded smoke policy matches on `source: 'human-mention'` only
        // (no target constraint), so a *different* registered agent — chosen by
        // the human in RoomPanel — passes the gate without any engine change.
        const RoomPanel = (await import('./RoomPanel')).default;
        render(<RoomPanel />);

        fireEvent.change(screen.getByRole('combobox', { name: 'room.invoke.agent' }), {
            target: { value: 'system-architect' },
        });
        fireEvent.change(screen.getByPlaceholderText('room.invoke.taskPlaceholder'), {
            target: { value: 'Вася здесь.' },
        });
        fireEvent.click(screen.getByText('room.invoke.submit'));

        await waitFor(
            () =>
                expect(
                    useInvocationStore.getState().invocations[
                        useInvocationStore.getState().order[0]!
                    ]?.status,
                ).toBe('done'),
            { timeout: 20000 },
        );

        const s = useInvocationStore.getState();
        const id = s.order[0]!;
        expect(s.invocations[id]!.status).toBe('done');

        // Real ConversationCore live output flowed through coreEventBus.
        expect(s.feed.length).toBeGreaterThan(0);

        // Real persistence: the Engine resolved the HUMAN-SELECTED agent.
        const persisted = await invocationEngine.getInvocation(id);
        expect(persisted?.status).toBe('done');
        expect(persisted?.resolvedAgents.map((a) => a.id)).toContain('system-architect');
    });

    it('opens the linked Conversation session via the existing router', async () => {
        const RoomPanel = (await import('./RoomPanel')).default;
        render(<RoomPanel />);

        fireEvent.change(screen.getByRole('combobox', { name: 'room.invoke.agent' }), {
            target: { value: SMOKE_AGENT },
        });
        fireEvent.change(screen.getByPlaceholderText('room.invoke.taskPlaceholder'), {
            target: { value: 'open me' },
        });
        fireEvent.click(screen.getByText('room.invoke.submit'));

        await waitFor(
            () =>
                expect(
                    useInvocationStore.getState().invocations[
                        useInvocationStore.getState().order[0]!
                    ]?.status,
                ).toBe('done'),
            { timeout: 20000 },
        );

        const id = useInvocationStore.getState().order[0]!;
        const sessionRef = useInvocationStore.getState().invocations[id]!.sessionRef!;
        expect(sessionRef.kind).toBe('conversation');

        fireEvent.click(screen.getByText('room.invocation.openSession'));
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/director?session='));
    });

    it('reloads persisted invocations from Dexie after a store reset (history)', async () => {
        const RoomPanel = (await import('./RoomPanel')).default;
        render(<RoomPanel />);

        fireEvent.change(screen.getByRole('combobox', { name: 'room.invoke.agent' }), {
            target: { value: SMOKE_AGENT },
        });
        fireEvent.change(screen.getByPlaceholderText('room.invoke.taskPlaceholder'), {
            target: { value: 'persist me' },
        });
        fireEvent.click(screen.getByText('room.invoke.submit'));

        await waitFor(
            () =>
                expect(
                    useInvocationStore.getState().invocations[
                        useInvocationStore.getState().order[0]!
                    ]?.status,
                ).toBe('done'),
            { timeout: 20000 },
        );

        const id = useInvocationStore.getState().order[0]!;

        // Simulate a page reload: in-memory store cleared, then rehydrated.
        act(() => useInvocationStore.getState().clear());
        expect(useInvocationStore.getState().order).toEqual([]);

        await act(async () => {
            await useInvocationStore.getState().loadHistory();
        });

        expect(useInvocationStore.getState().order).toContain(id);
        const reloaded = await invocationEngine.getInvocation(id);
        expect(reloaded?.status).toBe('done');
    });
});
