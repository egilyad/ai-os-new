import type {
    DebateSession,
    DebateParticipant,
    DebateConfig,
    DebateArgument,
    DebateStrategy,
} from '../../contracts/debate-types';
import type {
    IDebateEngine,
    DebateTopology,
    ParticipantConfig,
    DebateSessionSnapshot,
} from '../../contracts/debate-runtime';
import type { TimelineEntry } from '../../contracts/debate-types';
import { DebatePostProcessor } from './debate-post-processor';
import type { DebateGovernor } from './debate-governor';

export interface SnapshotBridgeContext {
    participants: DebateParticipant[];
    strategy: DebateStrategy;
    maxRounds: number;
    config: DebateConfig;
    timeline?: TimelineEntry[];
}

export function participantsToConfig(participants: DebateParticipant[]): ParticipantConfig[] {
    return participants.map((p) => ({
        agentId: p.id,
        nodeId: p.id,
        modelId: p.modelId,
        provider: p.provider,
        systemPrompt: p.systemPrompt,
    }));
}

export function buildRoundtableTopology(
    participants: DebateParticipant[],
    maxRounds?: number,
): DebateTopology {
    const nodes = participants.map((p) => ({
        id: p.id,
        label: p.name,
        role: p.role,
        modelId: p.modelId,
        provider: p.provider,
    }));
    const edges =
        participants.length > 1
            ? participants.map((p, i) => ({
                  from: p.id,
                  to: participants[(i + 1) % participants.length]!.id,
                  type: 'sequential' as const,
              }))
            : [];
    return {
        id: `topo-${Date.now()}`,
        type: 'roundtable',
        nodes,
        edges,
        maxRounds,
    };
}

export function timelineToArguments(
    timeline: TimelineEntry[],
    participants: DebateParticipant[],
    defaultConfidence = 0.7,
): DebateArgument[] {
    const nameById = new Map(participants.map((p) => [p.id, p.name]));
    const roleById = new Map(participants.map((p) => [p.id, p.role]));
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
                position: (roleById.get(agentId) ?? 'neutral') as 'pro' | 'con' | 'neutral',
                source: 'llm' as const,
            };
        });
}

export function snapshotToSession(
    snapshot: DebateSessionSnapshot,
    ctx: SnapshotBridgeContext,
): DebateSession {
    const participants = Array.isArray(ctx.participants)
        ? ctx.participants.filter((p, i, arr) => arr.findIndex((o) => o.id === p.id) === i)
        : [];
    const args = ctx.timeline ? timelineToArguments(ctx.timeline, participants) : [];
    const round = Math.max(1, snapshot.round);
    const socraticQuestioner =
        ctx.strategy === 'socratic' && participants.length > 1
            ? (round - 1) % participants.length
            : 0;
    const id = snapshot.id;
    const s: DebateSession = {
        id,
        topic: snapshot.topic,
        status: snapshot.phase,
        strategy: ctx.strategy,
        maxRounds: ctx.maxRounds,
        currentRound: round,
        participants,
        arguments: args,
        convergenceScore: 0,
        openingStatements: args.filter((a) => a.round === 0),
        config: ctx.config,
        socraticQuestioner,
        argumentTreeRoundMap: {},
        createdAt: snapshot.startedAt,
    };
    return s;
}

export function getRichSession(
    engine: IDebateEngine | null,
    runtimeSessionId: string | null,
    bridgeCtx: SnapshotBridgeContext | null,
): DebateSession | null {
    if (!engine || !runtimeSessionId || !bridgeCtx) return null;
    const snapshot = engine.getSession(runtimeSessionId);
    if (!snapshot) return null;
    const timeline = engine.getTimeline(runtimeSessionId);
    const ctx = bridgeCtx;
    return snapshotToSession(snapshot, { ...ctx, timeline });
}

export function mergeAndProcessSession(
    engine: IDebateEngine,
    runtimeSessionId: string,
    bridgeCtx: SnapshotBridgeContext,
    postProcessor: DebatePostProcessor,
    governor: DebateGovernor | null,
    prevActiveSession: DebateSession | null,
): { session: DebateSession; newArgs: DebateArgument[] } {
    const prevIds = new Set(prevActiveSession?.arguments.map((a) => a.id) ?? []);
    const prevHumanArgs = prevActiveSession?.arguments.filter((a) => a.source === 'human') ?? [];
    const snapshot = engine.getSession(runtimeSessionId);
    if (!snapshot) return { session: prevActiveSession!, newArgs: [] };
    const timeline = engine.getTimeline(runtimeSessionId);
    const ctx = bridgeCtx;
    const bridged = snapshotToSession(snapshot, { ...ctx, timeline });

    for (const humanArg of prevHumanArgs) {
        if (!bridged.arguments.some((a) => a.id === humanArg.id)) {
            bridged.arguments.push(humanArg);
        }
    }

    postProcessor.process(bridged);
    const newArgs = bridged.arguments.filter((a) => !prevIds.has(a.id));
    postProcessor.processGovernorFeeding(newArgs, governor);
    postProcessor.processFactCheck(newArgs);
    postProcessor.updateConvergenceScore(bridged);

    return { session: bridged, newArgs };
}
