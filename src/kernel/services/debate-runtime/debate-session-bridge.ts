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
import { BUILTIN_STRATEGIES } from './debate-strategy-definitions';
import { BUILTIN_MODES } from './debate-mode-system';

export interface SnapshotBridgeContext {
    participants: DebateParticipant[];
    strategy: DebateStrategy | string;
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

function topologyNodes(participants: DebateParticipant[]): DebateTopology['nodes'] {
    return participants.map((p) => ({
        id: p.id,
        label: p.name,
        role: p.role,
        modelId: p.modelId,
        provider: p.provider,
    }));
}

function chainEdges(ids: string[]): DebateTopology['edges'] {
    return ids.slice(0, -1).map((from, i) => ({
        from,
        to: ids[i + 1]!,
        type: 'sequential' as const,
    }));
}

export function buildLinearTopology(
    participants: DebateParticipant[],
    maxRounds?: number,
): DebateTopology {
    const ids = participants.map((p) => p.id);
    return {
        id: `topo-${Date.now()}`,
        type: 'linear',
        nodes: topologyNodes(participants),
        edges: chainEdges(ids),
        maxRounds,
    };
}

export function buildTreeTopology(
    participants: DebateParticipant[],
    maxRounds?: number,
): DebateTopology {
    const ids = participants.map((p) => p.id);
    const edges =
        ids.length > 1
            ? ids.slice(1).map((to) => ({
                  from: ids[0]!,
                  to,
                  type: 'sequential' as const,
              }))
            : [];
    return {
        id: `topo-${Date.now()}`,
        type: 'tree-of-thought',
        nodes: topologyNodes(participants),
        edges,
        maxRounds,
    };
}

export function buildJudgeTopology(
    participants: DebateParticipant[],
    maxRounds?: number,
): DebateTopology {
    const debaters = participants.filter((p) => p.role !== 'judge');
    const judges = participants.filter((p) => p.role === 'judge');
    const debaterIds = debaters.map((p) => p.id);
    const edges: DebateTopology['edges'] = [...chainEdges(debaterIds)];
    if (debaterIds.length && judges.length) {
        edges.push({ from: debaterIds[0]!, to: judges[0]!.id, type: 'sequential' as const });
    }
    return {
        id: `topo-${Date.now()}`,
        type: 'judge',
        nodes: topologyNodes(participants),
        edges,
        maxRounds,
    };
}

export function buildRedBlueTopology(
    participants: DebateParticipant[],
    maxRounds?: number,
): DebateTopology {
    const attackers = participants.filter((p) => p.role === 'attacker');
    const defenders = participants.filter((p) => p.role === 'defender');
    const edges: DebateTopology['edges'] = [];
    for (const a of attackers) {
        for (const d of defenders) edges.push({ from: a.id, to: d.id, type: 'sequential' as const });
    }
    if (edges.length === 1 && attackers.length && defenders.length) {
        edges.push({ from: defenders[0]!.id, to: attackers[0]!.id, type: 'sequential' as const });
    }
    return {
        id: `topo-${Date.now()}`,
        type: 'red-blue',
        nodes: topologyNodes(participants),
        edges,
        maxRounds,
    };
}

/**
 * Strategy → forced quality technique ids. Makes otherwise-generic strategies
 * actually behave differently once `startDebate` merges these into the session's
 * quality settings (additive — never disables user choices).
 */
export function strategyQualityForced(strategy: DebateStrategy): string[] {
    switch (strategy) {
        case 'cross-examination':
            return ['cross-examination'];
        case 'tournament':
            return ['adaptive-order'];
        case 'jury_trial':
            return ['blind-evaluation', 'bayesian-judges'];
        case 'moderated':
            return ['critic'];
        case 'free_for_all':
            return ['insight-bus'];
        default:
            return [];
    }
}

/**
 * Map a DSL root primitive to a usable execution model (topology + quality).
 * This is the light-weight runtime interpreter for the 33 BUILTIN DSL
 * strategies (D2): it turns a declarative root into real debate behavior.
 */
const ROOT_TO_EXECUTION: Record<
    string,
    { topology?: 'roundtable' | 'linear' | 'judge' | 'tree-of-thought' | 'red-blue'; quality: string[] }
> = {
    sequence: { topology: 'linear', quality: ['adaptive-order'] },
    debate_graph: { topology: 'roundtable', quality: [] },
    critic_loop: { topology: 'roundtable', quality: ['critic', 'socratic-pivot'] },
    voting: { topology: 'roundtable', quality: ['bayesian-judges', 'blind-evaluation'] },
    peer_review: { topology: 'judge', quality: ['blind-evaluation', 'critic'] },
};

export function builtinRootToHints(rootType: string | undefined): {
    topology?: 'roundtable' | 'linear' | 'judge' | 'tree-of-thought' | 'red-blue';
    quality: string[];
} {
    if (!rootType) return { quality: [] };
    return ROOT_TO_EXECUTION[rootType] ?? { quality: [] };
}

export function builtinExecutionHints(strategyId: string): {
    topology?: 'roundtable' | 'linear' | 'judge' | 'tree-of-thought' | 'red-blue';
    quality: string[];
} {
    const def = BUILTIN_STRATEGIES.find((d) => d.id === strategyId);
    return builtinRootToHints(def?.root?.type);
}

export interface ResolvedStrategyConfig {
    topology: DebateTopology;
    forcedQuality: string[];
}

export interface ModeSessionHints {
    constraint?: string;
    temperature?: number;
    maxRounds?: number;
    forcedQuality: string[];
    strategy?: DebateStrategy | string;
}

/**
 * D3: apply a builtin mode's defaults (constraint, temperature, maxRounds,
 * strategyRef, and policy→quality mapping) as session hints. Purely additive:
 * only fields the mode defines override the caller's config.
 */
export function applyModeToSession(modeId: string): ModeSessionHints {
    const mode = BUILTIN_MODES.find((m) => m.id === modeId);
    const hints: ModeSessionHints = { forcedQuality: [] };
    if (!mode) return hints;

    if (mode.constraint && mode.constraint !== 'none') {
        hints.constraint = mode.constraint;
        // Only force 'constrained' if the mode doesn't resolve a specific strategyRef;
        // otherwise keep the strategyRef path (constraint applies via 'constrained').
        if (!mode.strategyRef) hints.strategy = 'constrained';
    }
    if (mode.defaultTemperature !== undefined) hints.temperature = mode.defaultTemperature;
    if (mode.defaultMaxRounds !== undefined) hints.maxRounds = mode.defaultMaxRounds;
    if (mode.strategyRef) hints.strategy = mode.strategyRef;

    for (const p of mode.policies ?? []) {
        switch (p.type) {
            case 'require_evidence':
                hints.forcedQuality.push('evidence-triangulation', 'fact-checking');
                break;
            case 'forbid_emotion':
                hints.forcedQuality.push('rhetoric-safety');
                break;
            case 'contradiction_penalty':
                hints.forcedQuality.push('consistency-check', 'belief-mining');
                break;
            case 'temperature_cap':
                if (typeof p.value === 'number') hints.temperature = p.value;
                break;
            default:
                break;
        }
    }
    hints.forcedQuality = [...new Set(hints.forcedQuality)];
    return hints;
}

/**
 * Resolve a strategy (enum OR builtin DSL id) into a concrete topology +
 * forced quality techniques. For enum strategies it is exactly the existing
 * behavior; for builtin ids it uses the light-weight DSL interpreter.
 */
export function resolveStrategyConfig(
    strategy: DebateStrategy | string,
    participants: DebateParticipant[],
    maxRounds?: number,
): ResolvedStrategyConfig {
    const forcedQuality: string[] = [];
    let effective = strategy as DebateStrategy;

    if (typeof strategy === 'string' && strategy.startsWith('builtin.')) {
        const hints = builtinExecutionHints(strategy);
        forcedQuality.push(...hints.quality);
        const topoType = hints.topology;
        if (topoType === 'linear') {
            return {
                topology: buildLinearTopology(participants, maxRounds),
                forcedQuality: [...new Set(forcedQuality)],
            };
        }
        if (topoType === 'judge' && participants.some((p) => p.role === 'judge')) {
            return {
                topology: buildJudgeTopology(participants, maxRounds),
                forcedQuality: [...new Set(forcedQuality)],
            };
        }
        effective = 'round_robin';
    }

    const topology = buildTopologyForStrategy(effective, participants, maxRounds);
    forcedQuality.push(...strategyQualityForced(effective));
    return { topology, forcedQuality: [...new Set(forcedQuality)] };
}

export function buildTopologyForStrategy(
    strategy: DebateStrategy,
    participants: DebateParticipant[],
    maxRounds?: number,
): DebateTopology {
    switch (strategy) {
        case 'sequential':
            return buildLinearTopology(participants, maxRounds);
        case 'tree-of-thought':
            return buildTreeTopology(participants, maxRounds);
        case 'judge':
        case 'jury_trial':
            if (participants.some((p) => p.role === 'judge'))
                return buildJudgeTopology(participants, maxRounds);
            break;
        case 'red-blue':
            if (
                participants.some((p) => p.role === 'attacker') &&
                participants.some((p) => p.role === 'defender')
            )
                return buildRedBlueTopology(participants, maxRounds);
            break;
        case 'tournament':
            // Elimination-style: speak sequentially, one turn at a time (linear).
            return buildLinearTopology(participants, maxRounds);
        default:
            // cross-examination / moderated / free_for_all / socratic / argument_tree /
            // constrained → roundtable (distinct behavior comes from prompt/quality gates).
            break;
    }
    return buildRoundtableTopology(participants, maxRounds);
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
        strategy: ctx.strategy as DebateStrategy,
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

export async function mergeAndProcessSession(
    engine: IDebateEngine,
    runtimeSessionId: string,
    bridgeCtx: SnapshotBridgeContext,
    postProcessor: DebatePostProcessor,
    governor: DebateGovernor | null,
    prevActiveSession: DebateSession | null,
): Promise<{ session: DebateSession; newArgs: DebateArgument[] }> {
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
    // N4c: await fact-checks so getForArgument returns completed results before scoring
    await postProcessor.processFactCheck(newArgs);
    postProcessor.updateConvergenceScore(bridged);

    return { session: bridged, newArgs };
}
