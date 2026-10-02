/**
 * CouncilAwareEvaluator — D4.4a canonical evaluator wiring (no second runtime).
 *
 * Implements IDebateEvaluator, delegates to WeightedJudgeEvaluator when
 * topology.nodes[0].config.councilMode true, otherwise to standard DebateEvaluator.
 * One IDebateEvaluator interface, two strategies selectable per session (via getEvaluator).
 */

import type { IDebateEvaluator, AgentScore } from '../../contracts/debate-runtime';
import type { Claim, ReasoningChain } from '../../contracts/debate-runtime';
import type { DebateEvaluator } from '../debate-runtime/debate-evaluator';
import type { WeightedJudgeEvaluator } from './weighted-judge-evaluator';

export class CouncilAwareEvaluator implements IDebateEvaluator {
    private currentSessionId: string | null = null;

    constructor(
        private standard: DebateEvaluator,
        private weighted: WeightedJudgeEvaluator,
        private getSession: (sessionId: string) => { topology?: { nodes?: Array<{ config?: Record<string, unknown> }> } } | undefined,
    ) {}

    /** N4a: explicit sessionId — no globalThis, no second runtime */
    setCurrentSessionId(sessionId: string | null): void {
        this.currentSessionId = sessionId;
    }

    private isCouncilModeForCurrentCall(): boolean {
        const sid = this.currentSessionId;
        if (!sid) return false;
        const snap = this.getSession(sid);
        const nodes = snap?.topology?.nodes as Array<{ config?: Record<string, unknown> }> | undefined;
        // Audit TS-1: was nodes[0]-only — fragile for empty topologies and
        // hand-built ones. Mapper sets the flag on every node; any-match
        // covers both.
        return Boolean(nodes?.some((n) => n.config?.councilMode === true));
    }

    scoreArguments(agentId: string, claims: Claim[], chain: ReasoningChain[]): AgentScore {
        if (this.isCouncilModeForCurrentCall()) return this.weighted.scoreArguments(agentId, claims, chain);
        return this.standard.scoreArguments(agentId, claims, chain);
    }

    rankParticipants(scores: AgentScore[]): AgentScore[] {
        if (this.isCouncilModeForCurrentCall()) return this.weighted.rankParticipants(scores);
        return this.standard.rankParticipants(scores);
    }
}
