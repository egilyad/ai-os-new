import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DebateAnalytics from './DebateAnalytics';
import type { DebateSession, DebateParticipant } from '../../kernel/contracts/debate-types';

const t = (k: string) => k;
const getAgentLabel = (id: string) => id;

function baseSession(): DebateSession {
    return {
        id: 's1',
        topic: 'Test',
        status: 'completed',
        strategy: 'round_robin',
        maxRounds: 3,
        currentRound: 1,
        participants: [{ id: 'agent-network', name: 'Network Engineer', role: 'pro' }],
        arguments: [
            { id: 'a1', agentId: 'agent-network', agentName: 'Network Engineer', content: 'hello', confidence: 0.8, timestamp: 0, round: 1, position: 'pro', source: 'llm' },
        ],
        convergenceScore: 80,
        createdAt: 0,
        config: { roundDelayMs: 0, maxTokens: 100, temperature: 0.7, debateTemperature: 0.7, useModerator: false, timeoutMs: 1000 },
        roundVotes: { 1: [{ round: 1, voter: 'human', votedAgentId: 'agent-network', score: 5, timestamp: 0 }] },
        activityMetrics: {
            perAgent: [{ agentId: 'agent-network', agentName: 'Network Engineer', argumentCount: 1, wordCount: 1, avgConfidence: 0.8, avgDepth: 0, childrenReceived: 0 }],
            mostDiscussed: [],
            roundIntensity: [1],
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
        session.participants = [{ id: undefined, name: 'X', role: 'pro' } as unknown as DebateParticipant];
        expect(() =>
            render(<DebateAnalytics session={session} getAgentLabel={getAgentLabel} t={t} />),
        ).not.toThrow();
    });
});
