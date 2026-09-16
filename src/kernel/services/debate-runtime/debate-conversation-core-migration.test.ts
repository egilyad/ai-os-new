/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
import { DebateOrchestrator } from './debate-orchestrator';
import { ConversationBackedDebateOrchestrator } from './conversation-backed-debate-orchestrator';
import { DebateTopologyService } from './debate-topology';
import { createDebateOrchestrator } from './index';
import type {
    AgentExecutor,
    DebateTopology,
    OrchestratorEvent,
} from '../../contracts/debate-runtime';

/**
 * Step A.2 — runtime equivalence behind a feature flag.
 *
 * Both orchestrators implement IDebateOrchestrator, so the EXISTING
 * debate-pipeline-builder translation layer (anti-corrosion layer) consumes
 * either one identically. These tests prove the NEW path emits the SAME
 * OrchestratorEvent stream as the OLD path on the same deterministic input —
 * i.e. identical observable behavior (round framing, agent order, errors,
 * budget-skip, abort, termination).
 *
 * Execution semantics (routing / budget / governor / retry / failover / timeout)
 * are preserved BY CONSTRUCTION: the new path reuses the SAME AgentExecutor
 * (injected by the pipeline) via DebateAgentExecutionEngine.
 */

function roundtableTopology(): DebateTopology {
    return {
        id: 'a2-rt',
        type: 'roundtable',
        maxRounds: 2,
        nodes: [
            { id: 'a', label: 'Alpha', role: 'pro' },
            { id: 'b', label: 'Beta', role: 'con' },
            { id: 'c', label: 'Gamma', role: 'neutral' },
        ],
        edges: [
            { from: 'a', to: 'b', type: 'sequential' },
            { from: 'b', to: 'c', type: 'sequential' },
        ],
    };
}

async function collect(
    make: () => { orch: { generateRoundEvents: (...a: any) => AsyncGenerator<OrchestratorEvent> } },
    executor: AgentExecutor,
    topology: DebateTopology,
): Promise<OrchestratorEvent[]> {
    const { orch } = make() as any;
    orch.setAgentExecutor(executor);
    const events: OrchestratorEvent[] = [];
    for await (const ev of orch.generateRoundEvents(topology, 'sess-a2', 0)) {
        events.push(ev);
    }
    return events;
}

const successStub: AgentExecutor = (req) =>
    Promise.resolve({ content: `reply-${req.agentId}`, latency: 1, success: true });

const errorStub: AgentExecutor = () =>
    Promise.resolve({ content: '', latency: 1, success: false, error: 'boom' });

const budgetStub: AgentExecutor = (req) =>
    req.agentId === 'b'
        ? Promise.resolve({ content: '', latency: 1, success: false, budgetSkipped: true })
        : Promise.resolve({ content: `reply-${req.agentId}`, latency: 1, success: true });

const oldFactory = () => ({ orch: new DebateOrchestrator(new DebateTopologyService()) });
const newFactory = () => ({
    orch: new ConversationBackedDebateOrchestrator(new DebateTopologyService()),
});

describe('A.2 runtime equivalence (old path vs ConversationCore path)', () => {
    it('R1 happy: identical event stream (order + content + rounds + termination)', async () => {
        const oldEvents = await collect(oldFactory, successStub, roundtableTopology());
        const newEvents = await collect(newFactory, successStub, roundtableTopology());
        expect(newEvents).toEqual(oldEvents);
        // sanity: full lifecycle present
        expect(newEvents[0]).toEqual({ type: 'round:start', round: 1, nodes: ['a', 'b', 'c'] });
        expect(newEvents[newEvents.length - 1]).toEqual({ type: 'topology:complete' });
    });

    it('R2 error: identical agent:error placement', async () => {
        const oldEvents = await collect(oldFactory, errorStub, roundtableTopology());
        const newEvents = await collect(newFactory, errorStub, roundtableTopology());
        expect(newEvents).toEqual(oldEvents);
    });

    it('R3 budget-skip: identical silent skip + anyBudgetSkipped flag', async () => {
        const oldEvents = await collect(oldFactory, budgetStub, roundtableTopology());
        const newEvents = await collect(newFactory, budgetStub, roundtableTopology());
        expect(newEvents).toEqual(oldEvents);
        // 'b' produced only agent:thinking, no responded/error
        const bResponded = newEvents.filter(
            (e) => (e.type === 'agent:responded' || e.type === 'agent:error') && e.agentId === 'b',
        );
        expect(bResponded).toHaveLength(0);
    });

    it('R4 abort before start: both produce empty stream (kill switch behavior)', async () => {
        const topo = roundtableTopology();
        const oldOrch = new DebateOrchestrator(new DebateTopologyService());
        oldOrch.setAgentExecutor(successStub);
        oldOrch.abort('sess-a2');
        const oldEvents: OrchestratorEvent[] = [];
        for await (const ev of oldOrch.generateRoundEvents(topo, 'sess-a2', 0)) oldEvents.push(ev);

        const newOrch = new ConversationBackedDebateOrchestrator(new DebateTopologyService());
        newOrch.setAgentExecutor(successStub);
        newOrch.abort('sess-a2');
        const newEvents: OrchestratorEvent[] = [];
        for await (const ev of newOrch.generateRoundEvents(topo, 'sess-a2', 0)) newEvents.push(ev);

        expect(oldEvents).toEqual([]);
        expect(newEvents).toEqual([]);
    });

    it('reuses the SAME debate execution (DebateAgentExecutionEngine maps Turn → AgentExecutor)', async () => {
        const orch = new ConversationBackedDebateOrchestrator(new DebateTopologyService());
        const spy = vi.fn(successStub);
        orch.setAgentExecutor(spy as unknown as AgentExecutor);
        const events = await collect(
            () => ({ orch }),
            spy as unknown as AgentExecutor,
            roundtableTopology(),
        );
        // 6 agents spoke (3 x 2 rounds) → 6 executor calls
        expect(spy).toHaveBeenCalledTimes(6);
        expect(events[events.length - 1]).toEqual({ type: 'topology:complete' });
    });
});

describe('A.2 factory (ConversationCore is the permanent Debate path)', () => {
    it('createDebateOrchestrator returns ConversationBackedDebateOrchestrator', () => {
        const orch = createDebateOrchestrator(new DebateTopologyService());
        expect(orch).toBeInstanceOf(ConversationBackedDebateOrchestrator);
        expect(orch).not.toBeInstanceOf(DebateOrchestrator);
    });
});
