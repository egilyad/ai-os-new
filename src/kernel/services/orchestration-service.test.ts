import { describe, expect, it, vi } from 'vitest';
import { OrchestrationService, type OrchestrationServiceDeps } from './orchestration-service';
import type { ISTopology } from '../contracts/topology';

function makeDeps(overrides: Partial<OrchestrationServiceDeps> = {}): OrchestrationServiceDeps {
    return {
        eventBus: { on: vi.fn(() => () => {}), emit: vi.fn() },
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
        { id: 'entry', type: 'router', label: 'Entry' },
        { id: 'n2', type: 'agent', label: 'Agent' },
    ],
    edges: [{ from: 'entry', to: 'n2', type: 'sequential' }],
} as ISTopology;

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
            nodes: [{ id: 'n2', type: 'agent', label: 'Agent' }],
        };
        const res = svc.validateTopology(bad);
        expect(res.valid).toBe(false);
        expect(res.errors.join(' ')).toContain('entry');
    });

    it('validateTopology находит self-loop', () => {
        const svc = new OrchestrationService(makeDeps());
        const bad: ISTopology = {
            ...validTopology,
            edges: [{ from: 'entry', to: 'entry', type: 'sequential' }],
        };
        const res = svc.validateTopology(bad);
        expect(res.errors.join(' ')).toContain('Self-loop');
    });

    it('mount устанавливает lifecycle и эмитит событие', () => {
        const emit = vi.fn();
        const svc = new OrchestrationService(makeDeps({ eventBus: { on: vi.fn(), emit } }));
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
});
