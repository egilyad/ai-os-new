import '../tests/setup-runtime';
import { describe, it, expect, vi } from 'vitest';
import { runtime } from './runtime';
import { eventBus } from './events/event-bus';

describe('DI Container — cross-phase resolution', () => {
    it('foundation services (phase 1)', () => {
        expect(runtime.getService('settingsService')).toBeDefined();
        expect(runtime.getService('kernel')).toBeDefined();
        expect(runtime.getService('keyService')).toBeDefined();
        expect(runtime.getService('metricsService')).toBeDefined();
    });

    it('infrastructure services (phase 2)', () => {
        expect(runtime.getService('memoryService')).toBeDefined();
        expect(runtime.getService('toolService')).toBeDefined();
        expect(runtime.getService('externalSecretsService')).toBeDefined();
    });

    it('debate runtime services (phase 3)', () => {
        expect(runtime.getService('debateService')).toBeDefined();
        expect(runtime.getService('debateEngine')).toBeDefined();
        expect(runtime.getService('debateEvaluator')).toBeDefined();
        expect(runtime.getService('strategyManager')).toBeDefined();
    });

    it('agent and role services (phase 4)', () => {
        expect(runtime.getService('agentService')).toBeDefined();
        expect(runtime.getService('roleService')).toBeDefined();
        expect(runtime.getService('orchestrator')).toBeDefined();
    });

    it('routing and LLM services (phase 5)', () => {
        expect(runtime.getService('routerService')).toBeDefined();
        expect(runtime.getService('llmClientService')).toBeDefined();
        expect(runtime.getService('cacheService')).toBeDefined();
    });

    it('high-level services (phase 6)', () => {
        expect(runtime.getService('chatService')).toBeDefined();
        expect(runtime.getService('eventSourcingService')).toBeDefined();
    });

    it('memory orchestration services (phase 7)', () => {
        expect(runtime.getService('memoryOrchestrator')).toBeDefined();
    });

    it('resolves 140+ services without error', () => {
        expect(runtime.getServices().length).toBeGreaterThan(140);
    });
});

describe('EventBus → EventRecorder integration', () => {
    function getRecorder() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return runtime.getService<any>('eventSourcingService');
    }

    it('records events emitted on the event bus', async () => {
        const countBefore = getRecorder().getCount();

        eventBus.emit('kernel:heartbeat', { phase: 'ready', uptime: 12345 });

        await vi.waitFor(
            () => {
                expect(getRecorder().getCount()).toBeGreaterThan(countBefore);
            },
            { timeout: 5000 },
        );
    });

    it('records debate session created event', async () => {
        const countBefore = getRecorder().getCount();

        eventBus.emit('debate:runtime:session:created', {
            sessionId: 'int-test-session-1',
            topic: 'Integration test topic',
            topologyType: 'roundtable',
        });

        await vi.waitFor(
            () => {
                expect(getRecorder().getCount()).toBeGreaterThan(countBefore);
            },
            { timeout: 5000 },
        );
    });

    it('records multiple events and maintains sequence order', async () => {
        const countBefore = getRecorder().getCount();

        eventBus.emit('debate:runtime:session:created', {
            sessionId: 'seq-test',
            topic: 'Sequence test',
            topologyType: 'roundtable',
        });
        eventBus.emit('debate:runtime:session:started', { sessionId: 'seq-test' });
        eventBus.emit('debate:runtime:session:completed', { sessionId: 'seq-test' });

        await vi.waitFor(
            () => {
                expect(getRecorder().getCount()).toBeGreaterThanOrEqual(countBefore + 2);
            },
            { timeout: 5000 },
        );

        const allEvents = getRecorder().getAll();
        const names = [
            'debate:runtime:session:created',
            'debate:runtime:session:started',
            'debate:runtime:session:completed',
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const debateEvents = allEvents.filter((e: any) => names.includes(e.event));
        expect(debateEvents.length).toBeGreaterThanOrEqual(2);
        for (let i = 1; i < debateEvents.length; i++) {
            expect(debateEvents[i].sequence).toBeGreaterThan(debateEvents[i - 1].sequence);
        }
    });
});

describe('Memory service integration', () => {
    function getMemory() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return runtime.getService<any>('memoryService');
    }

    it('stores and retrieves a memory entry', async () => {
        const memory = getMemory();
        const content = 'Integration test memory ' + Date.now();

        await memory.store({
            content,
            metadata: {
                source: 'test',
                type: 'integration',
                timestamp: Date.now(),
                importance: 5,
            },
        });

        const results = await memory.search(content, 5);
        expect(results.length).toBeGreaterThanOrEqual(1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(results.some((r: any) => r.entry.content === content)).toBe(true);
    });

    it('stores batch entries and retrieves stats', async () => {
        const memory = getMemory();
        const statsBefore = memory.getStats();

        await memory.storeBatch([
            {
                content: 'Integration batch entry 1',
                metadata: { source: 'test', type: 'batch', timestamp: Date.now(), importance: 3 },
            },
            {
                content: 'Integration batch entry 2',
                metadata: { source: 'test', type: 'batch', timestamp: Date.now(), importance: 7 },
            },
        ]);

        const statsAfter = memory.getStats();
        expect(statsAfter.totalEntries).toBeGreaterThanOrEqual(statsBefore.totalEntries + 2);
    });
});

describe('Debate engine session lifecycle', () => {
    function getEngine() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return runtime.getService<any>('debateEngine');
    }

    const baseTopology = {
        id: 'int-test-topology',
        type: 'roundtable' as const,
        nodes: [
            { id: 'agent-1', label: 'Proponent', role: 'participant' },
            { id: 'agent-2', label: 'Opponent', role: 'participant' },
        ],
        edges: [
            { from: 'agent-1', to: 'agent-2', type: 'sequential' as const },
            { from: 'agent-2', to: 'agent-1', type: 'sequential' as const },
        ],
        maxRounds: 1,
    };

    const baseParticipants = [
        { agentId: 'agent-1', nodeId: 'agent-1', role: 'participant' },
        { agentId: 'agent-2', nodeId: 'agent-2', role: 'participant' },
    ];

    it('creates a debate session in created phase', () => {
        const engine = getEngine();

        const id = engine.createSession(baseTopology, 'Integration test debate', baseParticipants);
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');

        const session = engine.getSession(id);
        expect(session).toBeDefined();
        expect(session!.phase).toBe('created');
        expect(session!.topic).toBe('Integration test debate');

        engine.cancelSession(id);
        expect(engine.getSession(id)).toBeUndefined();
    });

    it('lists active and all sessions', () => {
        const engine = getEngine();

        const id1 = engine.createSession(baseTopology, 'List test 1', baseParticipants);
        const id2 = engine.createSession(baseTopology, 'List test 2', baseParticipants);

        const all = engine.getAllSessions();
        expect(all.length).toBeGreaterThanOrEqual(2);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allIds = all.map((s: any) => s.id);
        expect(allIds).toContain(id1);
        expect(allIds).toContain(id2);

        const active = engine.getActiveSessions();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeIds = active.map((s: any) => s.id);
        expect(activeIds).toContain(id1);
        expect(activeIds).toContain(id2);

        engine.cancelSession(id1);
        engine.cancelSession(id2);
        expect(engine.getSession(id1)).toBeUndefined();
        expect(engine.getSession(id2)).toBeUndefined();
    });
});

describe('Runtime lifecycle', () => {
    it('reports ready status after start', () => {
        expect(runtime.isReady()).toBe(true);
    });

    it('reports runtime status with phase and uptime', () => {
        const status = runtime.getStatus();
        expect(status.phase).toBe('ready');
        expect(status.uptime).toBeGreaterThan(0);
        expect(status.startTime).toBeGreaterThan(0);
        expect(status.servicesReady).toBeGreaterThan(0);
        expect(status.servicesTotal).toBeGreaterThan(0);
        expect(status.servicesReady).toBeLessThanOrEqual(status.servicesTotal);
    });

    it('lists registered services', () => {
        const services = runtime.getServices();
        expect(services.length).toBeGreaterThan(140);
        expect(services).toContain('debateEngine');
        expect(services).toContain('memoryService');
        expect(services).toContain('eventSourcingService');
        expect(services).toContain('runtime');
    });

    it('reports container dependencies', () => {
        const deps = runtime.getDependencies();
        expect(deps).toBeDefined();
        expect(typeof deps).toBe('object');
    });
});
