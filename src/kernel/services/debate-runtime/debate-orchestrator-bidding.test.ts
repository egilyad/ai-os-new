import { describe, it, expect } from 'vitest';
import { DebateOrchestrator } from './debate-orchestrator';
import type { DebateTopology } from '../../contracts/debate-runtime';
import type { DebateTopologyService } from './debate-topology';

interface N {
    id: string;
    label: string;
    role: 'pro' | 'con';
}

function orch(nodes: N[][], rounds = 1) {
    const groups = nodes.slice(0, rounds);
    const topologyService = {
        buildRounds: () => groups,
    } as unknown as DebateTopologyService;
    const o = new DebateOrchestrator(topologyService);
    o.setAgentExecutor(async ({ agentId }) => ({
        success: true,
        content: `argument from ${agentId}`,
        latency: 1,
    }));
    return o;
}

async function respondedOrder(
    o: DebateOrchestrator,
    topology: DebateTopology,
    sessionId: string,
    skipAgents?: ReadonlySet<string>,
): Promise<string[]> {
    const order: string[] = [];
    for await (const ev of o.generateRoundEvents(topology, sessionId, 0, skipAgents)) {
        if (ev.type === 'agent:responded') order.push(ev.agentId);
    }
    return order;
}

const TOPO = { nodes: [] } as unknown as DebateTopology;

describe('DebateOrchestrator bidding + session isolation (audit #3/#4)', () => {
    it('gives the rebuttal bonus to the opposite role (round >= 2)', async () => {
        // Round 2 starts [a-con, b-con, c-pro] by id tiebreak; after a-con
        // speaks, c-pro (+0.3 rebuttal) must jump ahead of b-con (+0.1 same).
        const nodes: N[] = [
            { id: 'a-con', label: 'Alice', role: 'con' },
            { id: 'b-con', label: 'Bob', role: 'con' },
            { id: 'c-pro', label: 'Carol', role: 'pro' },
        ];
        const o = orch([nodes, nodes], 2);
        expect(await respondedOrder(o, TOPO, 's-bid')).toEqual([
            'a-con',
            'b-con',
            'c-pro',
            'a-con',
            'c-pro',
            'b-con',
        ]);
    });

    it('keeps participation bidding isolated per session', async () => {
        const nodes: N[] = [
            { id: 'a-pro', label: 'Alice', role: 'pro' },
            { id: 'b-con', label: 'Bob', role: 'con' },
        ];
        const o = orch([nodes]);
        // s-one: only a-pro speaks → counts {a:1, b:0} for s-one only.
        expect(await respondedOrder(o, TOPO, 's-one', new Set(['b-con']))).toEqual(['a-pro']);
        // Fresh session must NOT inherit s-one counts: tiebreak by id →
        // a-pro first (contaminated flat map would put b-con first).
        expect(await respondedOrder(o, TOPO, 's-two')).toEqual(['a-pro', 'b-con']);
    });

    it('destroy(sessionId) clears only that session', async () => {
        const nodes: N[] = [
            { id: 'a-pro', label: 'Alice', role: 'pro' },
            { id: 'b-con', label: 'Bob', role: 'con' },
        ];
        const o = orch([nodes]);
        await respondedOrder(o, TOPO, 's-a', new Set(['b-con']));
        o.destroy('s-a');
        // After destroy the session starts clean: tiebreak → a-pro first.
        expect(await respondedOrder(o, TOPO, 's-a')).toEqual(['a-pro', 'b-con']);
    });
});
