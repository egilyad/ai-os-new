import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { defaultContainer } from '../../kernel/container';
import { clearResolvedServices } from '../../kernel/service-helper';
import { ConversationDirectorService } from '../../kernel/services/conversation-director-service';
import {
    ChatExecutionEngine,
    type IChatExecutorAdapter,
} from '../../kernel/services/conversation-execution-engine';
import { eventBus as coreEventBus, EVENTS as CORE_EVENTS } from '../../kernel/events/event-bus';
import { EVENTS } from '../../kernel/events/event-registry';
import { ScenarioRepository } from '../../kernel/dal/scenario-repository';
import { createTestDb, type TestDb } from '../../kernel/dal/_test-harness';
import { useDirectorStore } from '../../stores/directorStore';

/**
 * B6.1 — End-to-end integration gate for the generic Conversation Director.
 *
 * One full REAL path, driven entirely through the production UI + runtime:
 *
 *   RunTab (real)                         ── UI
 *     └─ createDirectorControls()        ── real control surface (B5.4b)
 *          └─ conversationDirector       ── real lazyService → real service
 *               └─ ConversationDirectorService (real, B3)
 *                    └─ HybridPolicy → ConversationOrchestrator (real, B4)
 *                         └─ ChatExecutionEngine (real, B3)
 *                              └─ stubbed chatService → real coreEventBus
 *                                   └─ CONVERSATION_* events
 *                                        └─ DirectorStore (real, B4)
 *                                             └─ RunTab re-render (live)
 *
 * The scenario is persisted through the REAL ScenarioRepository (the same
 * DAL behind Configure/Library), then the real Run button loads + runs it.
 * No Debate / Forum / DEBATE_* anywhere in the path.
 */

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
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'director.run.heading': 'Run & observe',
                'director.run.noScenario': 'no scenario',
                'director.run.selected': 'Selected scenario',
                'director.run.current': 'Current',
                'director.run.objective': 'Objective',
                'director.run.progress': 'Progress',
                'director.run.run': 'Run',
                'director.run.pause': 'Pause',
                'director.run.resume': 'Resume',
                'director.run.skip': 'Skip',
                'director.run.override': 'Override',
                'director.run.abort': 'Abort',
                'director.run.overrideParticipant': 'Participant',
                'director.run.overrideObjective': 'Instruction',
                'director.run.overrideSubmit': 'Inject',
                'director.run.log': 'Turn log',
                'director.run.logEmpty': 'empty',
                'director.run.status.idle': 'Idle',
                'director.run.status.running': 'Running',
                'director.run.status.paused': 'Paused',
                'director.run.status.aborted': 'Aborted',
                'director.run.status.completed': 'Completed',
                'director.run.status.error': 'Error',
                'director.run.turnStatus.running': 'running',
                'director.run.turnStatus.complete': 'complete',
                'director.run.turnStatus.error': 'error',
            };
            return labels[key] || key;
        },
    }),
}));

describe('Conversation Director — B6.1 E2E integration gate', () => {
    let tdb: TestDb;
    let repo: ScenarioRepository;
    let director: ConversationDirectorService;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        repo = new ScenarioRepository(tdb.db);

        // Stubbed LLM: echoes a valid ChatResponse back on the REAL eventBus.
        const chatService: IChatExecutorAdapter = {
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

        const engine = new ChatExecutionEngine(chatService, coreEventBus);
        director = new ConversationDirectorService(repo, engine, undefined, coreEventBus);

        // Bind the real service so the real `directorController` (used by RunTab)
        // resolves to it through the global lazyService.
        clearResolvedServices();
        defaultContainer.register('conversationDirectorService', director);

        act(() => useDirectorStore.getState().reset());
    });

    afterEach(async () => {
        await tdb.clearAll();
    });

    it('runs a full real path: create → load → run → events → store → RunTab', async () => {
        // 1) CREATE — persist a scenario through the real DAL (Library/Configure backend)
        const scenario = await repo.create({
            name: 'E2E Gate',
            description: 'B6.1 end-to-end',
            participants: [
                { id: 'architect', role: 'Architect' },
                { id: 'auditor', role: 'Auditor' },
            ],
            turns: [
                {
                    participantId: 'architect',
                    objective: { type: 'INTRODUCE', description: 'propose plan', constraints: [] },
                },
                {
                    participantId: 'auditor',
                    objective: { type: 'CRITIQUE', description: 'audit plan', constraints: [] },
                },
            ],
        });

        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={scenario} />);
        expect(screen.getByText('E2E Gate')).toBeDefined();

        // 2) RUN — the real Run button drives the full runtime via directorController
        fireEvent.click(screen.getByText('Run'));

        // 3) SERVICE reaches completion
        await waitFor(() => expect(director.getState()).toBe('completed'), { timeout: 10000 });

        // 4) REAL DirectorStore observed the live run (turn log fully completed + status)
        await waitFor(
            () => {
                const s = useDirectorStore.getState();
                expect(s.status).toBe('completed');
                expect(s.turnLog.length).toBe(2);
                expect(s.turnLog.every((e) => e.status === 'complete')).toBe(true);
            },
            { timeout: 10000 },
        );

        // 5) REAL RunTab UI re-rendered from the live store (badge + literal participant ids)
        expect(screen.getByText('Completed')).toBeDefined();
        expect(screen.getAllByText('architect').length).toBeGreaterThan(0);
        expect(screen.getAllByText('auditor').length).toBeGreaterThan(0);

        // 6) REAL engine executed the AUTHORED scenario (content carries objectives)
        const results = director.getResults();
        expect(results.length).toBe(2);
        expect(results.every((r) => r.success)).toBe(true);
        expect(results[0]!.content).toContain('propose plan');
        expect(results[1]!.content).toContain('audit plan');

        // 7) OUTPUT PLUMBING: TurnResult.content propagates
        //    orchestrator → CONVERSATION_TURN_COMPLETE → DirectorStore → RunTab DOM.
        const storeLog = useDirectorStore.getState().turnLog;
        expect(storeLog[0]!.content).toContain('propose plan');
        expect(storeLog[1]!.content).toContain('audit plan');
        // TurnResult content (now carrying the propagated Topic) is rendered in RunTab.
        expect(document.body.textContent).toContain('reply:Topic:');
    });

    it('stays generic — no Debate-specific events fire during the run', async () => {
        const seen: string[] = [];
        const unsub = coreEventBus.subscribeAll((p) => seen.push(p.event));

        const scenario = await repo.create({
            name: 'E2E Generic',
            description: 'B6.1 generic guard',
            participants: [{ id: 'architect', role: 'Architect' }],
            turns: [
                {
                    participantId: 'architect',
                    objective: { type: 'INTRODUCE', description: 'say hi', constraints: [] },
                },
            ],
        });

        const RunTab = (await import('./RunTab')).default;
        render(<RunTab scenario={scenario} />);
        fireEvent.click(screen.getByText('Run'));

        await waitFor(() => expect(director.getState()).toBe('completed'), { timeout: 10000 });
        unsub();

        // The runtime is generic: only conversation:* (+ the generic chat:response
        // bridge the ChatExecutionEngine listens on) — never Debate/Forum/DEBATE_*.
        expect(seen.some((e) => /^debate/i.test(e))).toBe(false);
        expect(seen.some((e) => e === CORE_EVENTS.CONVERSATION_TURN_START)).toBe(true);
        expect(seen.some((e) => e === CORE_EVENTS.CONVERSATION_TURN_COMPLETE)).toBe(true);
        expect(seen.some((e) => e === CORE_EVENTS.CONVERSATION_COMPLETED)).toBe(true);
    });
});
