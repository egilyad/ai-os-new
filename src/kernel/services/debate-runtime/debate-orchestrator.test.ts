import { describe, it, expect, vi } from 'vitest';
import { DebateOrchestrator } from './debate-orchestrator';
import { DebateTopologyService } from './debate-topology';
import type {
    DebateTopology,
    AgentExecutionResult,
    OrchestratorEvent,
} from '../../contracts/debate-runtime';

function makeTopology(overrides?: Partial<DebateTopology>): DebateTopology {
    return {
        id: 'test-topology',
        type: 'roundtable',
        nodes: [
            { id: 'agent-1', label: 'Proponent', role: 'pro' },
            { id: 'agent-2', label: 'Opponent', role: 'con' },
        ],
        edges: [
            { from: 'agent-1', to: 'agent-2', type: 'sequential' },
            { from: 'agent-2', to: 'agent-1', type: 'sequential' },
        ],
        maxRounds: 2,
        ...overrides,
    };
}

async function collectEvents(
    gen: AsyncGenerator<OrchestratorEvent, void, unknown>,
): Promise<OrchestratorEvent[]> {
    const events: OrchestratorEvent[] = [];
    for await (const evt of gen) {
        events.push(evt);
    }
    return events;
}

describe('DebateOrchestrator', () => {
    it('yields round:start, agent events, round:end, and topology:complete', async () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        const executor = vi.fn().mockResolvedValue({
            content: 'Agent response',
            latency: 10,
            success: true,
        } satisfies AgentExecutionResult);
        orch.setAgentExecutor(executor);

        const events = await collectEvents(
            orch.generateRoundEvents(makeTopology({ maxRounds: 1 }), 'session-1'),
        );

        expect(events[0]).toMatchObject({ type: 'round:start', round: 1 });
        expect(events.filter((e) => e.type === 'agent:responded')).toHaveLength(2);
        expect(events[events.length - 2]).toMatchObject({ type: 'round:end', round: 1 });
        expect(events[events.length - 1]).toMatchObject({ type: 'topology:complete' });
    });

    it('passes sessionId and agentId to executor', async () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        const executor = vi.fn().mockResolvedValue({
            content: 'ok',
            latency: 5,
            success: true,
        } satisfies AgentExecutionResult);
        orch.setAgentExecutor(executor);

        await collectEvents(orch.generateRoundEvents(makeTopology({ maxRounds: 1 }), 'session-42'));

        expect(executor).toHaveBeenCalledWith(
            expect.objectContaining({ sessionId: 'session-42', agentId: 'agent-1' }),
        );
        expect(executor).toHaveBeenCalledWith(
            expect.objectContaining({ sessionId: 'session-42', agentId: 'agent-2' }),
        );
    });

    it('yields agent:error when executor returns failure', async () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        orch.setAgentExecutor(
            vi.fn().mockResolvedValue({
                content: '',
                latency: 5,
                success: false,
                error: 'Provider error',
            } satisfies AgentExecutionResult),
        );

        const events = await collectEvents(
            orch.generateRoundEvents(makeTopology({ maxRounds: 1 }), 'session-1'),
        );

        const errors = events.filter((e) => e.type === 'agent:error');
        expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('yields agent:error when executor throws', async () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        orch.setAgentExecutor(vi.fn().mockRejectedValue(new Error('Executor crashed')));

        const events = await collectEvents(
            orch.generateRoundEvents(makeTopology({ maxRounds: 1 }), 'session-1'),
        );

        const errors = events.filter((e) => e.type === 'agent:error');
        expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('stops generating events when aborted mid-round', async () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        orch.setAgentExecutor(
            vi.fn().mockImplementation(async () => {
                await new Promise((r) => setTimeout(r, 50));
                return {
                    content: 'late',
                    latency: 10,
                    success: true,
                } satisfies AgentExecutionResult;
            }),
        );

        const gen = orch.generateRoundEvents(makeTopology({ maxRounds: 2 }), 'session-1');
        const events: OrchestratorEvent[] = [];
        const collector = (async () => {
            for await (const evt of gen) {
                events.push(evt);
                if (evt.type === 'round:start' && evt.round === 1) {
                    orch.abort('session-1');
                }
            }
        })();
        await collector;

        expect(events.length).toBeGreaterThanOrEqual(1);
        expect(events.filter((e) => e.type === 'topology:complete')).toHaveLength(0);
    });

    it('skips agents in skipAgents set', async () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        const executor = vi.fn().mockResolvedValue({
            content: 'ok',
            latency: 5,
            success: true,
        } satisfies AgentExecutionResult);
        orch.setAgentExecutor(executor);

        const events = await collectEvents(
            orch.generateRoundEvents(
                makeTopology({ maxRounds: 1 }),
                'session-1',
                0,
                new Set(['agent-1']),
            ),
        );

        const responded = events.filter((e) => e.type === 'agent:responded');
        expect(responded).toHaveLength(1);
        expect(responded[0]).toMatchObject({ agentId: 'agent-2' });
    });

    it('handles budget skip without yielding events', async () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        const executor = vi.fn().mockResolvedValue({
            content: '',
            latency: 0,
            success: false,
            budgetSkipped: true,
        } satisfies AgentExecutionResult);
        orch.setAgentExecutor(executor);

        const events = await collectEvents(
            orch.generateRoundEvents(makeTopology({ maxRounds: 1 }), 'session-1'),
        );

        expect(events.filter((e) => e.type === 'agent:responded')).toHaveLength(0);
        expect(events.filter((e) => e.type === 'agent:error')).toHaveLength(0);
    });

    it('abort and clearAbort work correctly', () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        orch.abort('session-1');
        orch.clearAbort('session-1');
        // Should not throw — allows restarting a session
    });

    it('destroy clears state for specific session', () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        orch.abort('session-1');
        orch.destroy('session-1');
        // Session should be removed from aborted set
        orch.abort('session-1'); // re-abort should work after clear
    });

    it('destroy without sessionId clears all state', () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        orch.abort('session-1');
        orch.abort('session-2');
        orch.destroy();
    });

    it('yields agent:error when no executor is set', async () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);

        const events = await collectEvents(
            orch.generateRoundEvents(makeTopology({ maxRounds: 1 }), 'session-1'),
        );

        const errors = events.filter((e) => e.type === 'agent:error');
        expect(errors).toHaveLength(2);
        expect(errors[0]).toMatchObject({ agentId: 'agent-1', error: 'No executor set' });
    });

    it('yields allErrored flag in round:end when all agents fail', async () => {
        const topologyService = new DebateTopologyService();
        const orch = new DebateOrchestrator(topologyService);
        orch.setAgentExecutor(
            vi.fn().mockResolvedValue({
                content: '',
                latency: 0,
                success: false,
                error: 'fail',
            } satisfies AgentExecutionResult),
        );

        const events = await collectEvents(
            orch.generateRoundEvents(makeTopology({ maxRounds: 1 }), 'session-1'),
        );

        const roundEnds = events.filter((e) => e.type === 'round:end');
        expect(roundEnds[0]).toMatchObject({ allErrored: true });
    });
});
