import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eventBus } from '../kernel/events/event-bus';
import { EVENTS } from '../kernel/events/event-registry';
import { ConversationDirectorService } from '../kernel/services/conversation-director-service';
import { ChatExecutionEngine } from '../kernel/services/conversation-execution-engine';
import type { IChatExecutorAdapter } from '../kernel/services/conversation-execution-engine';
import { ScenarioRepository } from '../kernel/dal/scenario-repository';
import { createTestDb, type TestDb } from '../kernel/dal/_test-harness';
import { useDirectorStore } from './directorStore';
import { createDirectorControls } from './directorController';
import type { TurnProposal } from '../kernel/contracts/conversation/turn';

function makeChatExecutor(): IChatExecutorAdapter {
    const emit = eventBus.emit.bind(eventBus) as unknown as (e: string, d: unknown) => void;
    return {
        handleMessage: (req: { requestId: string; messages: Array<{ content: string }> }) => {
            Promise.resolve().then(() =>
                emit(EVENTS.MESSAGE_RESPONSE, {
                    id: req.requestId,
                    requestId: req.requestId,
                    provider: 'test',
                    model: 'test',
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

const PLAN: TurnProposal[] = [
    {
        participantId: 'architect',
        objective: { type: 'INTRODUCE', description: 'plan A', constraints: [] },
    },
    {
        participantId: 'auditor',
        objective: { type: 'CRITIQUE', description: 'audit A', constraints: [] },
    },
];

describe('Director controls + DirectorStore binding (B5.4b)', () => {
    let tdb: TestDb;
    let service: ConversationDirectorService;
    let controls: ReturnType<typeof createDirectorControls>;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        useDirectorStore.getState().reset();
        const repo = new ScenarioRepository(tdb.db);
        service = new ConversationDirectorService(
            repo,
            new ChatExecutionEngine(makeChatExecutor(), eventBus),
            undefined,
            eventBus,
        );
        controls = createDirectorControls(service);
        const scenario = await repo.create({
            name: 'B5.4b',
            description: 'controls',
            participants: [
                { id: 'architect', role: 'Architect' },
                { id: 'auditor', role: 'Auditor' },
            ],
            turns: PLAN,
        });
        await controls.load(scenario.id);
    });

    afterEach(async () => {
        await tdb.clearAll();
    });

    it('run() executes the plan and the store observes every turn', async () => {
        await controls.run();
        expect(service.getState()).toBe('completed');
        const { turnLog } = useDirectorStore.getState();
        expect(turnLog.map((e) => e.participantId)).toEqual(['architect', 'auditor']);
        expect(turnLog.every((e) => e.status === 'complete' && e.success)).toBe(true);
    });

    it('pause() freezes the runtime and the store reports paused', async () => {
        const p = controls.run();
        controls.pause();
        // synchronous assertions right after pause — store + service agree
        expect(useDirectorStore.getState().status).toBe('paused');
        expect(service.getState()).toBe('paused');
        await p;
        expect(service.getState()).toBe('paused');
        expect(useDirectorStore.getState().status).toBe('paused');
    });

    it('resume() continues the paused run to completion', async () => {
        const p = controls.run();
        controls.pause();
        await p;
        await controls.resume();
        expect(service.getState()).toBe('completed');
        const { turnLog } = useDirectorStore.getState();
        expect(turnLog.map((e) => e.participantId)).toEqual(['architect', 'auditor']);
        expect(turnLog.every((e) => e.status === 'complete')).toBe(true);
    });

    it('skip() drops the next planned turn', async () => {
        controls.skip();
        await controls.run();
        expect(service.getState()).toBe('completed');
        const { turnLog } = useDirectorStore.getState();
        expect(turnLog.map((e) => e.participantId)).toEqual(['auditor']);
    });

    it('override() injects a turn without consuming the plan', async () => {
        controls.override({
            participantId: 'mediator',
            objective: { type: 'CHALLENGE', description: 'inject', constraints: [] },
        });
        await controls.run();
        expect(service.getState()).toBe('completed');
        const { turnLog } = useDirectorStore.getState();
        expect(turnLog.map((e) => e.participantId)).toEqual(['mediator', 'architect', 'auditor']);
    });

    it('abort() stops the runtime and the store reports aborted', async () => {
        const p = controls.run();
        controls.abort();
        expect(useDirectorStore.getState().status).toBe('aborted');
        expect(service.getState()).toBe('aborted');
        await p;
        expect(service.getState()).toBe('aborted');
    });

    it('reset() clears the store observer state', () => {
        controls.reset();
        const s = useDirectorStore.getState();
        expect(s.status).toBe('idle');
        expect(s.turnLog).toEqual([]);
        expect(s.currentParticipantId).toBeNull();
    });

    it('a failed turn moves the session to error instead of completed (truthfulness)', async () => {
        const emit = eventBus.emit.bind(eventBus) as unknown as (e: string, d: unknown) => void;
        const failingExecutor: IChatExecutorAdapter = {
            handleMessage: (req: { requestId: string; messages: Array<{ content: string }> }) => {
                Promise.resolve().then(() =>
                    emit(EVENTS.MESSAGE_RESPONSE, {
                        id: req.requestId,
                        requestId: req.requestId,
                        provider: 'test',
                        model: 'test',
                        content: '',
                        latency: 1,
                        status: 'error',
                        error: 'llm down',
                        tokens: 0,
                    }),
                );
            },
            cancelRequest: () => {},
        };
        const failingRepo = new ScenarioRepository(tdb.db);
        const failingScenario = await failingRepo.create({
            name: 'fail',
            description: 'fail',
            participants: [
                { id: 'architect', role: 'Architect' },
                { id: 'auditor', role: 'Auditor' },
            ],
            turns: PLAN,
        });
        const failingService = new ConversationDirectorService(
            failingRepo,
            new ChatExecutionEngine(failingExecutor, eventBus),
            undefined,
            eventBus,
        );
        const failingControls = createDirectorControls(failingService);
        await failingControls.load(failingScenario.id);
        // A failed turn must surface as error, not be swallowed as a completion.
        await expect(failingControls.run()).rejects.toThrow('llm down');
        expect(failingService.getState()).toBe('error');
        const { turnLog, status } = useDirectorStore.getState();
        expect(status).toBe('error');
        expect(turnLog[0]?.status).toBe('error');
        expect(turnLog[0]?.success).toBe(false);
    });
});
