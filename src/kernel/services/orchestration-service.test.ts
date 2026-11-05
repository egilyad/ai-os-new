import { describe, expect, it, vi } from 'vitest';
import { OrchestrationService, type OrchestrationServiceDeps } from './orchestration-service';
import type { ISTopology } from '../contracts/topology';

function makeDeps(overrides: Partial<OrchestrationServiceDeps> = {}): OrchestrationServiceDeps {
    return {
        eventBus: {
            on: vi.fn(() => () => {}),
            onSafe: vi.fn(() => () => {}),
            emit: vi.fn(),
            off: vi.fn(),
            emitOnce: vi.fn(),
            subscribeAll: vi.fn(),
            getSubscriptionStats: vi.fn(() => ({ totalCallbacks: 0, perEvent: {} })),
        },
        toolService: { execute: vi.fn(async () => ({ status: 'success', data: 'ok' })) },
        cognitiveService: { executeAgentNode: vi.fn(async () => 'agent out') },
        policyService: {
            enforcePrivacy: vi.fn(() => ({ blocked: false })),
            sanitizeOutput: vi.fn((_id, out) => out),
        },
        ...overrides,
    };
}

const validTopology: ISTopology = {
    id: 't1',
    name: 'Topo',
    version: '1.0.0',
    nodes: [
        { id: 'entry', type: 'router', label: 'Entry', config: {} },
        { id: 'n2', type: 'agent', label: 'Agent', config: {} },
    ],
    edges: [{ id: 'e1', from: 'entry', to: 'n2', trigger: 'on_success' }],
} as unknown as ISTopology;

describe('OrchestrationService', () => {
    it('validateTopology принимает валидную топологию', () => {
        const svc = new OrchestrationService(makeDeps());
        const res = svc.validateTopology(validTopology);
        expect(res.valid).toBe(true);
        expect(res.errors).toEqual([]);
    });

    it('validateTopology находит отсутствие entry-узла', () => {
        const svc = new OrchestrationService(makeDeps());
        const bad: ISTopology = {
            ...validTopology,
            nodes: [{ id: 'n2', type: 'agent', label: 'Agent', config: {} }],
        };
        const res = svc.validateTopology(bad);
        expect(res.valid).toBe(false);
        expect(res.errors.join(' ')).toContain('entry');
    });

    it('validateTopology находит self-loop', () => {
        const svc = new OrchestrationService(makeDeps());
        const bad: ISTopology = {
            ...validTopology,
            edges: [{ id: 'e2', from: 'entry', to: 'entry', trigger: 'on_success' }],
        };
        const res = svc.validateTopology(bad);
        expect(res.errors.join(' ')).toContain('Self-loop');
    });

    it('validateTopology находит ссылки на несуществующие узлы', () => {
        const svc = new OrchestrationService(makeDeps());
        const bad: ISTopology = {
            ...validTopology,
            edges: [{ id: 'e3', from: 'entry', to: 'ghost', trigger: 'on_success' }],
        };
        const res = svc.validateTopology(bad);
        expect(res.errors.join(' ')).toContain('ghost');
    });

    it('mount устанавливает lifecycle и эмитит событие', () => {
        const emit = vi.fn();
        const svc = new OrchestrationService(
            makeDeps({
                eventBus: {
                    on: vi.fn(),
                    onSafe: vi.fn(),
                    emit,
                    off: vi.fn(),
                    emitOnce: vi.fn(),
                    subscribeAll: vi.fn(),
                    getSubscriptionStats: vi.fn(() => ({ totalCallbacks: 0, perEvent: {} })),
                },
            }),
        );
        svc.mount(validTopology);
        expect(svc.getActiveTopology()).toBeDefined();
        expect(emit).toHaveBeenCalledWith(
            expect.stringContaining('topology:mounted'),
            expect.objectContaining({ topologyId: 't1' }),
        );
    });

    it('setNodeDisabled переключает статус', () => {
        const svc = new OrchestrationService(makeDeps());
        svc.mount(validTopology);
        svc.setNodeDisabled('n2', true);
        expect(svc.isNodeDisabled('n2')).toBe(true);
        svc.setNodeDisabled('n2', false);
        expect(svc.isNodeDisabled('n2')).toBe(false);
    });

    it('execute без активной топологии ничего не делает', async () => {
        const svc = new OrchestrationService(makeDeps());
        await expect(svc.execute({})).resolves.toBeUndefined();
    });

    it('execute с топологией увеличивает totalExecutions', async () => {
        const svc = new OrchestrationService(makeDeps());
        svc.mount(validTopology);
        await svc.execute({});
        expect(svc.getExecutionStats().totalExecutions).toBe(1);
    });

    it('execute с tool-узлом вызывает toolService', async () => {
        const toolService = {
            execute: vi.fn(async () => ({ status: 'success', data: 'tool out' })),
        };
        const svc = new OrchestrationService(makeDeps({ toolService }));
        const topology: ISTopology = {
            id: 't2',
            name: 'ToolTopo',
            version: '1.0.0',
            nodes: [
                { id: 'entry', type: 'router', label: 'Entry', config: {} },
                { id: 'tool', type: 'tool', label: 'Tool', config: { toolId: 't-web' } },
            ],
            edges: [{ id: 'e4', from: 'entry', to: 'tool', trigger: 'on_success' }],
        } as unknown as ISTopology;
        svc.mount(topology);
        await svc.execute({});
        expect(toolService.execute).toHaveBeenCalled();
    });

    it('guardrail блокирует по keyword', async () => {
        const svc = new OrchestrationService(makeDeps());
        const topology: ISTopology = {
            id: 't3',
            name: 'GuardTopo',
            version: '1.0.0',
            nodes: [
                { id: 'entry', type: 'router', label: 'Entry', config: {} },
                { id: 'g', type: 'guardrail', label: 'G', config: { blockedKeywords: ['evil'] } },
            ],
            edges: [{ id: 'e5', from: 'entry', to: 'g', trigger: 'on_success' }],
        } as unknown as ISTopology;
        svc.mount(topology);
        await svc.execute({ output: 'contains evil word' });
        expect(svc.getExecutionStats().failedNodes).toBeGreaterThanOrEqual(1);
    });

    it('execute с цепочкой узлов проходит по всем', async () => {
        const cognitiveService = { executeAgentNode: vi.fn(async () => 'agent out') };
        const svc = new OrchestrationService(makeDeps({ cognitiveService }));
        const topology: ISTopology = {
            id: 't4',
            name: 'ChainTopo',
            version: '1.0.0',
            nodes: [
                { id: 'entry', type: 'router', label: 'Entry', config: {} },
                { id: 'a1', type: 'agent', label: 'A1', config: {} },
                { id: 'a2', type: 'agent', label: 'A2', config: {} },
            ],
            edges: [
                { id: 'e6', from: 'entry', to: 'a1', trigger: 'on_success' },
                { id: 'e7', from: 'a1', to: 'a2', trigger: 'on_success' },
            ],
        } as unknown as ISTopology;
        svc.mount(topology);
        await svc.execute({});
        expect(svc.getExecutionStats().completedNodes).toBeGreaterThanOrEqual(2);
        expect(cognitiveService.executeAgentNode).toHaveBeenCalledTimes(2);
    });

    it('execute с router-узлом выбирает назначение', async () => {
        const cognitiveService = { executeAgentNode: vi.fn(async () => 'agent out') };
        const svc = new OrchestrationService(makeDeps({ cognitiveService }));
        const topology: ISTopology = {
            id: 't5',
            name: 'RouterTopo',
            version: '1.0.0',
            nodes: [
                { id: 'entry', type: 'router', label: 'Entry', config: {} },
                { id: 'a1', type: 'agent', label: 'A1', config: {} },
                { id: 'a2', type: 'agent', label: 'A2', config: {} },
            ],
            edges: [
                { id: 'e8', from: 'entry', to: 'a1', trigger: 'data_flow' },
                { id: 'e9', from: 'entry', to: 'a2', trigger: 'data_flow' },
            ],
        } as unknown as ISTopology;
        svc.mount(topology);
        await svc.execute({});
        expect(cognitiveService.executeAgentNode).toHaveBeenCalled();
        expect(svc.getExecutionStats().totalExecutions).toBe(1);
    });
});
