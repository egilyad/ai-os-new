import { DebatePolicy } from './debate-policy';
import { DebateTopologyService } from './debate-topology';
import type { ConversationContext } from '../../contracts/conversation/context';
import { expect, test } from 'vitest';

test('DebatePolicy should propose a turn independently', async () => {
    const topologyService = new DebateTopologyService();
    const policy = new DebatePolicy(topologyService);

    const context: ConversationContext = {
        topic: 'Water in Ashdod',
        participants: [
            { id: 'scientist', role: 'Climate Scientist' },
            { id: 'engineer', role: 'Engineer' },
        ],
        history: [],
        metadata: {
            topology: {
                type: 'roundtable',
                maxRounds: 2,
                nodes: [
                    { id: 'scientist', label: 'Climate Scientist' },
                    { id: 'engineer', label: 'Engineer' },
                ],
                edges: [],
            },
        },
    };

    const proposal = await policy.proposeNextTurn(context);

    expect(proposal).toBeDefined();
    expect(proposal?.participantId).toBeDefined();
    expect(proposal?.objective.type).toBe('RESPOND');
});
