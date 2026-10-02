import type {
    ConclusionType,
    DebateVerdict,
    StanceResult,
    VerdictKeyArgument,
} from '../../contracts/debate-types';

export interface HeuristicVerdictInput {
    id: string;
    topic: string;
    participants: Array<{ id: string; name?: string }>;
    args: Array<{
        agentId?: string;
        agentName?: string;
        content?: string;
        confidence?: number;
        position?: string;
    }>;
    consensus?: string;
    currentRound?: number;
    convergenceScore?: number;
}

/**
 * Shared heuristic verdict builder (audit R11–R13).
 *
 * Used when the LLM verdict path fails or the session ends as
 * failed/cancelled: callers previously emitted "completed/failed" with NO
 * verdict at all (and one path even logged "using heuristic" while emitting
 * nothing). Scoring mirrors the long-standing sync-manager implementation
 * so both paths agree.
 */
export function buildHeuristicVerdict(input: HeuristicVerdictInput, reason: string): DebateVerdict {
    const participantNameById = new Map(input.participants.map((p) => [p.id, p.name]));
    const agentScores = new Map<string, { count: number; totalWords: number; totalConfidence: number }>();
    for (const arg of input.args) {
        if (!arg.agentId || arg.agentId === 'human') continue;
        const entry = agentScores.get(arg.agentId) ?? {
            count: 0,
            totalWords: 0,
            totalConfidence: 0,
        };
        entry.count++;
        entry.totalWords += (arg.content ?? '').split(/\s+/).filter(Boolean).length;
        entry.totalConfidence += arg.confidence ?? 0.7;
        agentScores.set(arg.agentId, entry);
    }

    const keyArguments: VerdictKeyArgument[] = input.args.slice(-5).map((a) => ({
        agentId: a.agentId ?? 'unknown',
        agentName: a.agentName ?? a.agentId ?? 'unknown',
        content: (a.content ?? '').slice(0, 500),
        stance: (a.position as 'pro' | 'con' | 'neutral') ?? 'neutral',
        strength: a.confidence ?? 0.7,
    }));

    let bestAgentId = '';
    let bestScore = -1;
    for (const [agentId, s] of agentScores) {
        const score =
            s.count * 1_000_000 +
            Math.min(s.totalWords, 999_999) +
            Math.min(Math.round(s.totalConfidence * 100), 999);
        if (score > bestScore) {
            bestScore = score;
            bestAgentId = agentId;
        }
    }

    const convergenceScore = input.convergenceScore ?? 0;
    let conclusionType: ConclusionType;
    let stanceResult: StanceResult;
    if (convergenceScore > 75) {
        conclusionType = 'consensus';
        stanceResult = 'balanced';
    } else if (bestAgentId && agentScores.size > 1) {
        const bestEntry = agentScores.get(bestAgentId)!;
        if (bestEntry.count > input.args.length * 0.4) {
            conclusionType = 'dominance';
            stanceResult = 'pro_wins';
        } else {
            conclusionType = 'partial_agreement';
            stanceResult = 'no_clear_winner';
        }
    } else {
        conclusionType = 'inconclusive';
        stanceResult = 'no_clear_winner';
    }

    return {
        sessionId: input.id,
        topic: input.topic,
        summary:
            input.consensus ??
            `Debate concluded after ${input.currentRound ?? 0} rounds with ${input.args.length} total arguments.`,
        conclusionType,
        stanceResult,
        keyArguments,
        reasoning: `Heuristic verdict (${reason}). ${bestAgentId ? `Leading participant: ${participantNameById.get(bestAgentId) || bestAgentId}` : 'No clear leader.'}`,
        confidence: Math.min(0.7, 0.3 + input.args.length * 0.02),
        generatedAt: Date.now(),
        roundsTotal: input.currentRound ?? 0,
        totalTokens: 0,
    };
}
