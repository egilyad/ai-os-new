/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { AgentService } from './agent-service';
import type { ISTopology } from '../contracts/topology';

function makeService(topology: ISTopology | null): AgentService {
    return new AgentService({
        eventBus: { on: () => () => {}, onSafe: () => () => {}, emit: () => {} },
        orchestrator: {
            getActiveTopology: () => topology,
            isNodeDisabled: () => false,
            mount: () => {},
            setNodeDisabled: () => {},
            execute: async () => {},
        },
        database: { getKv: async () => null, setKv: async () => {} },
        pricingService: { calculateCost: () => 0 },
    });
}

const topology = {
    nodes: [
        {
            id: 'agent-1',
            type: 'agent',
            label: 'Architect',
            config: {
                roleName: 'Architect',
                systemPrompt: 'You are a systems architect.',
                model: 'gpt-4o',
            },
        },
        {
            id: 'agent-2',
            type: 'agent',
            label: 'Critic',
            config: { roleName: 'Critic', prompt: 'You are a harsh critic.', model: 'auto' },
        },
        { id: 'router-1', type: 'router', label: 'Router', config: {} },
    ],
    edges: [],
} as unknown as ISTopology;

describe('AgentService.resolveAgent (Director B-seam)', () => {
    it('resolves an agent with persona + pinned model', () => {
        const svc = makeService(topology);
        const agent = svc.resolveAgent('agent-1');
        expect(agent).not.toBeNull();
        expect(agent!.id).toBe('agent-1');
        expect(agent!.name).toBe('Architect');
        expect(agent!.role).toBe('Architect');
        expect(agent!.systemPrompt).toBe('You are a systems architect.');
        expect(agent!.model).toBe('gpt-4o');
    });

    it('falls back to config.prompt and drops auto model', () => {
        const svc = makeService(topology);
        const agent = svc.resolveAgent('agent-2');
        expect(agent!.systemPrompt).toBe('You are a harsh critic.');
        expect(agent!.model).toBeUndefined();
    });

    it('maps router nodes to Semantic Router role', () => {
        const svc = makeService(topology);
        expect(svc.resolveAgent('router-1')!.role).toBe('Semantic Router');
    });

    it('returns null for unknown id and when no topology is mounted', () => {
        const svc = makeService(topology);
        expect(svc.resolveAgent('nope')).toBeNull();
        expect(makeService(null).resolveAgent('agent-1')).toBeNull();
    });
});

function makeServiceWithKv(
    topology: ISTopology | null,
    kv: Map<string, unknown>,
): AgentService {
    return new AgentService({
        eventBus: { on: () => () => {}, onSafe: () => () => {}, emit: () => {} },
        orchestrator: {
            getActiveTopology: () => topology,
            isNodeDisabled: () => false,
            mount: () => {},
            setNodeDisabled: () => {},
            execute: async () => {},
        },
        database: {
            getKv: async (id: string) => (kv.has(id) ? (kv.get(id) as never) : null),
            setKv: async (id: string, value: unknown) => {
                kv.set(id, value);
            },
        },
        pricingService: { calculateCost: () => 0 },
    });
}

function freshTopology(): ISTopology {
    return structuredClone(topology) as unknown as ISTopology;
}

describe('AgentService topology persistence (P0)', () => {
    it('persists update/spawn/delete and re-applies them after reboot', async () => {
        const kv = new Map<string, unknown>();
        const live = freshTopology();
        const svc = makeServiceWithKv(live, kv);

        svc.updateAgent('agent-1', { label: 'Architect X', model: 'gemini-3.1-flash-lite' });
        const newId = svc.spawnAgent('Newbie')!;
        svc.deleteAgent('agent-2');
        // Flush the debounced write synchronously for the test.
        (svc as unknown as { persistTopology: (immediate?: boolean) => void }).persistTopology(
            true,
        );
        await Promise.resolve();

        const snap = kv.get('super_agents_agent_topology') as {
            overrides: Record<string, { label?: string; config: Record<string, unknown> }>;
            customNodes: Array<{ id: string }>;
            deletedIds: string[];
        };
        expect(snap.overrides['agent-1']?.label).toBe('Architect X');
        expect(snap.customNodes.map((n) => n.id)).toContain(newId);
        expect(snap.deletedIds).toContain('agent-2');

        // Simulate reboot: pristine registry topology, same KV store.
        const rebooted = freshTopology();
        const svc2 = makeServiceWithKv(rebooted, kv);
        await (svc2 as unknown as { loadTopologyOverrides: () => Promise<void> }).loadTopologyOverrides();
        svc2.applyStoredTopologyOverrides();

        const ids = rebooted.nodes.map((n) => n.id);
        expect(ids).toContain('agent-1');
        expect(ids).toContain(newId);
        expect(ids).not.toContain('agent-2');
        const a1 = rebooted.nodes.find((n) => n.id === 'agent-1')!;
        expect(a1.label).toBe('Architect X');
        expect((a1.config as Record<string, unknown>).model).toBe('gemini-3.1-flash-lite');
    });

    it('does not resurrect registry defaults over untouched agents', async () => {
        const kv = new Map<string, unknown>();
        const rebooted = freshTopology();
        const svc = makeServiceWithKv(rebooted, kv);
        await (svc as unknown as { loadTopologyOverrides: () => Promise<void> }).loadTopologyOverrides();
        svc.applyStoredTopologyOverrides();
        // Nothing stored: topology passes through unchanged.
        expect(rebooted.nodes.map((n) => n.id)).toEqual(['agent-1', 'agent-2', 'router-1']);
    });
});

describe('AgentService built-in agents', () => {
    const spec = {
        id: 'assistant',
        type: 'agent',
        label: 'Project Assistant',
        config: { roleName: 'Project Assistant', systemAgent: true, model: 'auto' },
    } as unknown as ISTopology['nodes'][number];

    it('seeds the built-in agent into the live topology with an entry edge', () => {
        const live = freshTopology();
        const svc = makeServiceWithKv(live, new Map());
        svc.registerSystemAgents([spec]);

        expect(live.nodes.map((n) => n.id)).toContain('assistant');
        expect(live.edges.some((e) => e.from === 'router-1' && e.to === 'assistant')).toBe(true);
        expect(svc.isSystemAgent('assistant')).toBe(true);
        expect(svc.getAgents().find((a) => a.id === 'assistant')?.name).toBe('Project Assistant');
    });

    it('is idempotent: a second registration does not duplicate the node', () => {
        const live = freshTopology();
        const svc = makeServiceWithKv(live, new Map());
        svc.registerSystemAgents([spec]);
        svc.registerSystemAgents([spec]);
        expect(live.nodes.filter((n) => n.id === 'assistant')).toHaveLength(1);
        expect(live.edges.filter((e) => e.to === 'assistant')).toHaveLength(1);
    });

    it('keeps user edits but never lets the node be deleted', async () => {
        const live = freshTopology();
        const kv = new Map<string, unknown>();
        const svc = makeServiceWithKv(live, kv);
        svc.registerSystemAgents([spec]);
        svc.updateAgent('assistant', { temperature: 0.5 });

        expect(svc.deleteAgent('assistant')).toBe(false);
        expect(live.nodes.some((n) => n.id === 'assistant')).toBe(true);

        (svc as unknown as { persistTopology: (immediate?: boolean) => void }).persistTopology(
            true,
        );
        await Promise.resolve();
        const snap = kv.get('super_agents_agent_topology') as {
            customNodes: Array<{ id: string }>;
            deletedIds: string[];
        };
        // The built-in node is not stored as a user customization.
        expect(snap.customNodes.map((n) => n.id)).not.toContain('assistant');
        expect(snap.deletedIds).not.toContain('assistant');
    });

    it('resurrects the built-in agent when an older snapshot omits it', () => {
        const live = freshTopology();
        const svc = makeServiceWithKv(live, new Map());
        svc.registerSystemAgents([spec]);
        live.nodes = live.nodes.filter((n) => n.id !== 'assistant');
        live.edges = [];

        svc.applyStoredTopologyOverrides();
        (
            svc as unknown as { ensureSystemAgents: () => void }
        ).ensureSystemAgents();
        expect(live.nodes.some((n) => n.id === 'assistant')).toBe(true);
    });
});
