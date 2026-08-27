import type {
    StrategyPrimitive,
    SequencePrimitive,
    DebateGraphPrimitive,
    CriticLoopPrimitive,
    VotingPrimitive,
    PeerReviewPrimitive,
    ReviewCriteria,
    VotingMechanism,
    GraphEdgeType,
} from '../../kernel/contracts/debate-strategy-dsl';

export const PRIMITIVE_META: Record<string, { color: string; label: string; description: string }> =
    {
        sequence: { color: 'var(--accent)', label: 'Sequence', description: 'Run steps in order' },
        debate_graph: {
            color: 'var(--purple)',
            label: 'Debate Graph',
            description: 'Multi-agent interaction',
        },
        critic_loop: {
            color: '#06b6d4',
            label: 'Critic Loop',
            description: 'Iterative refinement',
        },
        voting: { color: 'var(--warning)', label: 'Voting', description: 'Opinion tallying' },
        peer_review: {
            color: 'var(--success)',
            label: 'Peer Review',
            description: 'Structured evaluation',
        },
    };

export const REVIEW_CRITERIA_OPTIONS: ReviewCriteria[] = [
    'correctness',
    'completeness',
    'clarity',
    'evidence',
    'originality',
    'feasibility',
];

export const VOTING_MECHANISMS: VotingMechanism[] = [
    'simple_majority',
    'supermajority',
    'unanimous',
    'ranked_choice',
    'weighted',
];

export const EDGE_TYPES: GraphEdgeType[] = [
    'sequential',
    'broadcast',
    'conditional',
    'challenge',
    'refine',
];

export const AGENT_ROLES = ['pro', 'con', 'neutral', 'judge', 'attacker', 'defender'] as const;

export function createDefaultPrimitive(type: string): StrategyPrimitive {
    const id = `${type}-${Date.now()}`;
    switch (type) {
        case 'sequence':
            return { type: 'sequence', id, steps: [] } as SequencePrimitive;
        case 'debate_graph':
            return {
                type: 'debate_graph',
                id,
                agents: [
                    { nodeId: 'agent-a', role: 'pro', label: 'Agent A' },
                    { nodeId: 'agent-b', role: 'con', label: 'Agent B' },
                ],
                edges: [{ from: 'agent-a', to: 'agent-b', type: 'sequential' }],
                maxRounds: 4,
            } as DebateGraphPrimitive;
        case 'critic_loop':
            return {
                type: 'critic_loop',
                id,
                proponent: { nodeId: 'proponent', role: 'pro', label: 'Proponent' },
                critic: { nodeId: 'critic', role: 'con', label: 'Critic' },
                maxIterations: 5,
                stopWhen: 'agreement',
            } as CriticLoopPrimitive;
        case 'voting':
            return {
                type: 'voting',
                id,
                voters: [
                    { nodeId: 'voter-1', role: 'neutral', label: 'Voter 1' },
                    { nodeId: 'voter-2', role: 'neutral', label: 'Voter 2' },
                ],
                mechanism: 'simple_majority',
            } as VotingPrimitive;
        case 'peer_review':
            return {
                type: 'peer_review',
                id,
                authors: [{ nodeId: 'author', role: 'pro', label: 'Author' }],
                reviewers: [{ nodeId: 'reviewer', role: 'neutral', label: 'Reviewer' }],
                criteria: ['correctness', 'clarity'],
                minReviewsPerAuthor: 1,
            } as PeerReviewPrimitive;
        default:
            return { type: 'sequence', id, steps: [] } as SequencePrimitive;
    }
}

export function clonePrimitive(p: StrategyPrimitive): StrategyPrimitive {
    try {
        return structuredClone(p);
    } catch {
        return JSON.parse(JSON.stringify(p));
    }
}
