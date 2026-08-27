import type { Claim, ReasoningChain, AgentScore } from './debate-runtime';

export interface IBlindEvaluationService {
    evaluateBlindly(
        agentIds: string[],
        claims: Claim[],
        getChain: (agentId: string) => ReasoningChain[],
    ): Map<string, AgentScore>;
}
