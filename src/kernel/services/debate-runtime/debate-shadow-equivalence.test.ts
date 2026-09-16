import { describe, expect, it } from 'vitest';
import { DebatePolicy } from './debate-policy';
import { DebateTopologyService } from './debate-topology';
import { DebateOrchestrator } from './debate-orchestrator';
import type { ConversationContext } from '../../contracts/conversation/context';
import type { DebateTopology } from '../../contracts/debate-runtime';

/**
 * Step A.1 — Shadow / Parallel Debate equivalence.
 *
 * Proves that on identical deterministic input the OLD runtime
 * (DebateOrchestrator.generateRoundEvents) and the NEW Core policy
 * (DebatePolicy) make equivalent CONTROL-STRUCTURE decisions:
 *   participant order · round boundaries · termination.
 *
 * LLM text is intentionally NOT compared. Old runtime uses a stub executor,
 * new path uses updateStateAfterTurn(success) — only the decision trace matters.
 *
 * No production code is changed here; DebateOrchestrator remains the live path.
 */

type Step = { round: number; agentId: string };

function roundtableTopology(): DebateTopology {
    return {
        id: 'shadow-rt',
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

function judgeTopology(): DebateTopology {
    return {
        id: 'shadow-judge',
        type: 'judge',
        nodes: [
            { id: 'a', label: 'Alpha', role: 'pro' },
            { id: 'b', label: 'Beta', role: 'con' },
            { id: 'j', label: 'Judge', role: 'judge' },
        ],
        edges: [{ from: 'a', to: 'b', type: 'sequential' }],
    };
}

async function oldTrace(topology: DebateTopology): Promise<Step[]> {
    const orch = new DebateOrchestrator(new DebateTopologyService());
    orch.setAgentExecutor(() => Promise.resolve({ content: 'x', latency: 1, success: true }));
    const steps: Step[] = [];
    let currentRound = 0;
    for await (const ev of orch.generateRoundEvents(topology, 'sess-old', 0)) {
        if (ev.type === 'round:start') currentRound = ev.round;
        else if (ev.type === 'agent:responded')
            steps.push({ round: currentRound, agentId: ev.agentId });
    }
    return steps;
}

async function newTrace(topology: DebateTopology): Promise<Step[]> {
    const policy = new DebatePolicy(new DebateTopologyService());
    const context: ConversationContext = {
        topic: 'shadow',
        participants: topology.nodes.map((n) => ({ id: n.id, role: n.label })),
        history: [],
        metadata: { topology },
    };
    const steps: Step[] = [];
    let proposal = await policy.proposeNextTurn(context);
    while (proposal) {
        steps.push({ round: policy.roundNumber, agentId: proposal.participantId });
        policy.updateStateAfterTurn(proposal.participantId, true);
        proposal = await policy.proposeNextTurn(context);
    }
    return steps;
}

async function expectEquivalent(topology: DebateTopology): Promise<void> {
    const oldSteps = await oldTrace(topology);
    const newSteps = await newTrace(topology);
    expect(newSteps).toEqual(oldSteps);
}

describe('Debate shadow equivalence (A.1)', () => {
    it('roundtable: 3 agents x 2 rounds — identical decision trace', async () => {
        await expectEquivalent(roundtableTopology());
    });

    it('judge: debaters then judges — identical decision trace', async () => {
        await expectEquivalent(judgeTopology());
    });

    it('termination: both exhaust at the same step count', async () => {
        const topology = roundtableTopology();
        const oldSteps = await oldTrace(topology);
        const newSteps = await newTrace(topology);
        expect(oldSteps.length).toBe(newSteps.length);
        expect(oldSteps.length).toBe(6); // 3 agents * 2 rounds
    });
});
