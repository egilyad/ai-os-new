import { z } from 'zod';
function event<N extends string, S extends z.ZodType>(name: N, schema: S) {
    return { name, schema } as const;
}
export const EVENT_REGISTRY_GROUP_4 = {

    // ── Debate (extras) ──────────────────────────────────────────────────
    DEBATE_HUMAN_VOTE: event('debate:human:vote', z.unknown()),

    // ── Quality Impact ──────────────────────────────────────────────────
    DEBATE_QUALITY_TECHNIQUE_APPLIED: event(
        'debate:quality:technique:applied',
        z.object({
            sessionId: z.string(),
            techniqueId: z.string(),
            eventType: z.string(),
            round: z.number(),
            agentId: z.string().optional(),
            timestamp: z.number(),
        }),
    ),
    DEBATE_QUALITY_IMPACT_COMPUTED: event(
        'debate:quality:impact:computed',
        z.object({
            sessionId: z.string(),
            techniqueCount: z.number(),
            techniqueDelta: z.number().optional(),
            timestamp: z.number(),
        }),
    ),
    DEBATE_QUALITY_EXPERIMENT_COMPLETED: event(
        'debate:quality:experiment:completed',
        z.object({
            experimentId: z.string(),
            techniqueIds: z.array(z.string()),
            sessionsCompleted: z.number(),
            timestamp: z.number(),
        }),
    ),

    // ── Crystal Vault (knowledge) ──────────────────────────────────────────
    CRYSTAL_PROPOSED: event(
        'knowledge:crystal:proposed',
        z.object({
            crystalId: z.string(),
            statement: z.string(),
            originKind: z.string(),
            status: z.string(),
        }),
    ),
    CRYSTAL_FORMED: event(
        'knowledge:crystal:formed',
        z.object({
            crystalId: z.string(),
            version: z.number(),
            statement: z.string(),
            confidence: z.number(),
        }),
    ),
    CRYSTAL_SUPERSEDED: event(
        'knowledge:crystal:superseded',
        z.object({
            crystalId: z.string(),
            oldVersion: z.number(),
            newVersion: z.number(),
            reason: z.string(),
        }),
    ),
    CRYSTAL_REFUTED: event(
        'knowledge:crystal:refuted',
        z.object({
            crystalId: z.string(),
            reason: z.string(),
        }),
    ),
    CRYSTAL_CONTRADICTION_DETECTED: event(
        'knowledge:crystal:contradiction:detected',
        z.object({
            crystalId: z.string(),
            contradictingCrystalIds: z.array(z.string()),
        }),
    ),

    // ── Junction Engine (cross-domain synthesis) ─────────────────────────────
    JUNCTION_DETECTED: event(
        'knowledge:junction:detected',
        z.object({
            junctionId: z.string(),
            inputs: z.array(z.string()),
            synthesisType: z.string(),
            confidence: z.number(),
        }),
    ),
    JUNCTION_VALIDATED: event(
        'knowledge:junction:validated',
        z.object({
            junctionId: z.string(),
            confidence: z.number(),
            content: z.string(),
        }),
    ),
    JUNCTION_REJECTED: event(
        'knowledge:junction:rejected',
        z.object({
            junctionId: z.string(),
            reason: z.string(),
            agentId: z.string().nullable(),
        }),
    ),

    // ── Synthesis Engine (multi-perspective consensus) ─────────────────────
    SYNTHESIS_STARTED: event(
        'synthesis:started',
        z.object({
            synthesisId: z.string(),
            question: z.string(),
            roleCount: z.number(),
            lensCount: z.number(),
            depth: z.string(),
        }),
    ),
    SYNTHESIS_COMPLETED: event(
        'synthesis:completed',
        z.object({
            synthesisId: z.string(),
            statement: z.string(),
            consensusZones: z.number(),
            dissentZones: z.number(),
            uncertaintyZones: z.number(),
            confidence: z.number(),
        }),
    ),
    SYNTHESIS_REFINED: event(
        'synthesis:refined',
        z.object({
            synthesisId: z.string(),
            refinedFrom: z.string(),
            focusAreas: z.array(z.string()).optional(),
        }),
    ),
    SYNTHESIS_EXPORTED_TO_CRYSTAL: event(
        'synthesis:exported-to-crystal',
        z.object({
            synthesisId: z.string(),
            crystalId: z.string(),
        }),
    ),
    SYNTHESIS_EXPORTED_TO_FORUM: event(
        'synthesis:exported-to-forum',
        z.object({
            synthesisId: z.string(),
            topicId: z.string(),
            statement: z.string(),
        }),
    ),

    // ── Knowledge Generator (autonomous research cycle) ─────────────────────
    GENERATOR_STARTED: event(
        'generator:started',
        z.object({
            jobId: z.string(),
            triggerKind: z.string(),
            topic: z.string(),
        }),
    ),
    GENERATOR_STAGE: event(
        'generator:stage',
        z.object({
            jobId: z.string(),
            stage: z.string(),
        }),
    ),
    GENERATOR_COMPLETED: event(
        'generator:completed',
        z.object({
            jobId: z.string(),
            crystalId: z.string().nullable(),
            confidence: z.number(),
        }),
    ),
    GENERATOR_FAILED: event(
        'generator:failed',
        z.object({
            jobId: z.string(),
            error: z.string(),
        }),
    ),
    GENERATOR_CANCELLED: event(
        'generator:cancelled',
        z.object({
            jobId: z.string(),
        }),
    ),

    // ── Agent Forum (async persistent threads) ───────────────────────────────
    FORUM_TOPIC_CREATED: event(
        'forum:topic:created',
        z.object({
            topicId: z.string(),
            title: z.string(),
            category: z.string(),
            authorId: z.string(),
        }),
    ),
    FORUM_POST_ADDED: event(
        'forum:post:added',
        z.object({
            postId: z.string(),
            topicId: z.string(),
            authorId: z.string(),
        }),
    ),
    FORUM_POST_VOTED: event(
        'forum:post:voted',
        z.object({
            postId: z.string(),
            topicId: z.string(),
            voterId: z.string(),
            vote: z.string(),
        }),
    ),
    FORUM_TOPIC_ESCALATED_TO_DEBATE: event(
        'forum:topic:escalated-to-debate',
        z.object({
            topicId: z.string(),
            title: z.string(),
            category: z.string(),
        }),
    ),

    // ── Invocation Engine (managed agent invocation; intent lifecycle only) ──
    INVOCATION_REQUESTED: event(
        'invocation:requested',
        z.object({
            invocationId: z.string(),
            caller: z.object({ kind: z.enum(['human', 'event', 'schedule']), id: z.string() }),
            target: z.union([
                z.object({ agentId: z.string() }),
                z.object({ role: z.string() }),
                z.object({ expertise: z.array(z.string()) }),
            ]),
            context: z.union([
                z.object({ type: z.literal('forum-topic'), ref: z.string() }),
                z.object({ type: z.literal('room'), ref: z.string() }),
                z.object({ type: z.literal('conversation'), ref: z.string() }),
            ]),
        }),
    ),
    INVOCATION_ACCEPTED: event(
        'invocation:accepted',
        z.object({
            invocationId: z.string(),
            policyRef: z.string(),
            agents: z.array(
                z.object({
                    id: z.string(),
                    role: z.string().optional(),
                    expertise: z.array(z.string()).optional(),
                }),
            ),
            sessionRef: z
                .union([
                    z.object({ kind: z.literal('conversation'), ref: z.string() }),
                    z.object({ kind: z.literal('debate'), ref: z.string() }),
                    z.object({ kind: z.literal('room'), ref: z.string() }),
                ])
                .optional(),
        }),
    ),
    INVOCATION_REJECTED: event(
        'invocation:rejected',
        z.object({ invocationId: z.string(), reason: z.string() }),
    ),
    INVOCATION_EXECUTING: event(
        'invocation:executing',
        z.object({
            invocationId: z.string(),
            sessionRef: z.union([
                z.object({ kind: z.literal('conversation'), ref: z.string() }),
                z.object({ kind: z.literal('debate'), ref: z.string() }),
                z.object({ kind: z.literal('room'), ref: z.string() }),
            ]),
        }),
    ),
    INVOCATION_DONE: event(
        'invocation:done',
        z.object({ invocationId: z.string(), resultRef: z.string().optional() }),
    ),
} as const;