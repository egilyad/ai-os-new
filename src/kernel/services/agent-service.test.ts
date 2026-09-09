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
