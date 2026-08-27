import type {
    DebateArgument,
    DebateConfig,
    DebateSession as DebateSessionInterface,
    DebateSessionStrategy,
} from '../../contracts/debate-types';
import type {
    DebateSessionSnapshot,
    TimelineEntry,
    ParticipantConfig,
} from '../../contracts/debate-runtime';

export interface SnapshotBridgeContext {
    participants: ParticipantConfig[];
    strategy: DebateSessionStrategy;
    maxRounds: number;
    config: DebateConfig;
    timeline?: TimelineEntry[];
}

export function timelineToArguments(
    timeline: TimelineEntry[],
    participants: ParticipantConfig[],
    defaultConfidence = 0.7,
): DebateArgument[] {
    const nameById = new Map(participants.map((p) => [p.agentId, p.role || p.nodeId]));
    return timeline
        .filter((e) => e.type === 'agent:responded')
        .map((e, idx) => {
            const payload = e.payload as { agentId?: string; content?: string; round?: number };
            const agentId = payload.agentId ?? 'unknown';
            return {
                id: e.id || `arg-${idx}`,
                agentId,
                agentName: nameById.get(agentId) || agentId,
                content: payload.content ?? '',
                confidence: defaultConfidence,
                timestamp: e.timestamp,
                round: payload.round ?? 1,
                position: 'neutral' as const,
                source: 'llm' as const,
            };
        });
}

export function snapshotToSession(
    snapshot: DebateSessionSnapshot,
    ctx: SnapshotBridgeContext,
): DebateSessionInterface {
    const participants = Array.isArray(ctx.participants) ? ctx.participants : [];
    const args = ctx.timeline ? timelineToArguments(ctx.timeline, participants) : [];
    const round = Math.max(1, snapshot.round);
    const socraticQuestioner =
        ctx.strategy === 'socratic' && participants.length > 1
            ? (round - 1) % participants.length
            : 0;
    return {
        id: snapshot.id,
        topic: snapshot.topic,
        status: snapshot.phase,
        strategy: ctx.strategy,
        maxRounds: ctx.maxRounds,
        currentRound: round,
        participants: participants.map(
            (p) =>
                ({
                    id: p.agentId,
                    name: p.agentId,
                    role: p.role || 'proponent',
                    provider: p.provider,
                    modelId: p.modelId,
                    systemPrompt: p.systemPrompt,
                }) as DebateSessionInterface['participants'][number],
        ),
        arguments: args,
        convergenceScore: 0,
        openingStatements: args.filter((a) => a.round === 0),
        config: ctx.config,
        socraticQuestioner,
        argumentTreeRoundMap: {},
        createdAt: snapshot.startedAt,
    } as DebateSessionInterface;
}
