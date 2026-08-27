import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DebateAnalytics from './DebateAnalytics';

const t = (k: string) => k;
const getAgentLabel = (id: string) => id;

function baseSession(): any {
    return {
        id: 's1',
        status: 'completed',
        convergenceScore: 80,
        strategy: 'standard',
        arguments: [
            { id: 'a1', round: 1, agentId: 'agent-network', content: 'hello', confidence: 0.8 },
        ],
        participants: [{ id: 'agent-network', name: 'Network Engineer', role: 'agent' }],
        roundVotes: { '1': [{ votedAgentId: 'agent-network', score: 5 }] },
        activityMetrics: {
            perAgent: [{ id: 'agent-network', argumentCount: 1, childrenReceived: 0 }],
            mostDiscussed: [],
        },
    };
}

describe('DebateAnalytics', () => {
    it('renders a normal session with curated agents', () => {
        expect(() =>
            render(<DebateAnalytics session={baseSession()} getAgentLabel={getAgentLabel} t={t} />),
        ).not.toThrow();
    });

    it('does not crash when a participant has no id (regression: AgentAvatar undefined id)', () => {
        const session = baseSession();
        session.participants = [{ id: undefined, name: 'X', role: 'agent' }];
        expect(() =>
            render(<DebateAnalytics session={session} getAgentLabel={getAgentLabel} t={t} />),
        ).not.toThrow();
    });
});
