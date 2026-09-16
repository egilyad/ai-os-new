import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Container } from '../container';
import { makeHelpers, type PhaseContext } from '../service-registration/helpers';
import { registerPhase20 } from '../service-registration/phase20-director';
import { ScenarioRepository } from '../dal/scenario-repository';
import { createTestDb, type TestDb } from '../dal/_test-harness';
import { ConversationDirectorService } from './conversation-director-service';
import type { IChatExecutorAdapter } from './conversation-execution-engine';
import type { IAgentResolver } from '../contracts/conversation/agent-resolver';
import { EVENTS } from '../events/event-registry';

interface FakeBus {
    on: (e: string, cb: (d: unknown) => void) => () => void;
    emit: (e: string, d?: unknown) => void;
}

function makeBus(): FakeBus {
    const map = new Map<string, Array<(d: unknown) => void>>();
    return {
        on: (e, cb) => {
            const arr = map.get(e) ?? [];
            arr.push(cb);
            map.set(e, arr);
            return () =>
                map.set(
                    e,
                    (map.get(e) ?? []).filter((c) => c !== cb),
                );
        },
        emit: (e, d) => (map.get(e) ?? []).forEach((cb) => cb(d)),
    };
}

function makeChatExecutor(bus: FakeBus): IChatExecutorAdapter {
    return {
        handleMessage: (req: { requestId: string; messages: Array<{ content: string }> }) => {
            Promise.resolve().then(() =>
                bus.emit(EVENTS.MESSAGE_RESPONSE, {
                    requestId: req.requestId,
                    content: `reply:${req.messages[req.messages.length - 1]?.content ?? ''}`,
                    status: 'done',
                    tokens: 3,
                }),
            );
        },
        cancelRequest: () => {},
    };
}

describe('ConversationDirectorService — DI + runtime binding (B5.4a)', () => {
    let tdb: TestDb;
    let container: Container;
    let bus: FakeBus;

    beforeEach(async () => {
        tdb = await createTestDb();
        await tdb.clearAll();
        container = new Container();
        bus = makeBus();
        container.register('eventBus', bus);
        container.register('chatService', makeChatExecutor(bus));
        container.register('dal', {
            scenarios: new ScenarioRepository(tdb.db),
        } as unknown as import('../dal').DataAccessLayer);
        container.register('agentService', {
            resolveAgent: (id: string) => ({
                id,
                name: id,
                role: id,
                systemPrompt: `Persona of ${id}.`,
                model: undefined,
            }),
        } as unknown as IAgentResolver);
        const ctx: PhaseContext = {
            container,
            eventBus: bus as never,
            registerWithLifecycle: () => {},
        };
        registerPhase20(makeHelpers(ctx), ctx);
    });

    afterEach(async () => {
        await tdb.clearAll();
    });

    it('resolves conversationDirectorService through DI as a real instance', () => {
        const svc = container.get<ConversationDirectorService>('conversationDirectorService');
        expect(svc).toBeInstanceOf(ConversationDirectorService);
    });

    it('runs a real saved Scenario end-to-end to completion', async () => {
        const repo = new ScenarioRepository(tdb.db);
        const scenario = await repo.create({
            name: 'Runtime wiring',
            description: 'B5.4a proof',
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

        const director = container.get<ConversationDirectorService>('conversationDirectorService');
        const loaded = await director.loadScenario(scenario.id);
        expect(loaded.id).toBe(scenario.id);
        expect(loaded.turns.length).toBe(2);

        await director.run();

        expect(director.getState()).toBe('completed');
        const results = director.getResults();
        expect(results.length).toBe(2);
        expect(results.every((r) => r.success)).toBe(true);
        expect(results[0]!.content).toContain('propose plan');
        expect(results[1]!.content).toContain('audit plan');
    });
});
