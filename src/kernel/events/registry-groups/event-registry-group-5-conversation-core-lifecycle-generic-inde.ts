import { z } from 'zod';
import {
    ApiKeySchema,
    SystemStateSchema,
    ChatResponseSchema,
    MemoryEntrySchema,
    CognitiveSkillSchema,
    RoleSchema,
    ToolDefinitionSchema,
    MCPServerConfigSchema,
    BudgetStateSnapshotSchema,
    PolicyViolationSchema,
    CognitiveDecisionSchema,
    OptimizationSuggestionSchema,
    AdapterMessageSchema,
} from '../types/schema-types';

function event<N extends string, S extends z.ZodType>(name: N, schema: S) {
    return { name, schema } as const;
}

export const EVENT_REGISTRY_GROUP_5 = {

    // ── Conversation Core lifecycle (generic; independent of Debate/Forum/Chat) ──
    CONVERSATION_TURN_START: event(
        'conversation:turn:start',
        z.object({
            sessionId: z.string(),
            participantId: z.string(),
            turnIndex: z.number().optional(),
            injected: z.boolean().optional(),
        }),
    ),
    CONVERSATION_TURN_COMPLETE: event(
        'conversation:turn:complete',
        z.object({
            sessionId: z.string(),
            participantId: z.string(),
            success: z.boolean(),
            content: z.string().optional(),
            turnIndex: z.number().optional(),
            injected: z.boolean().optional(),
        }),
    ),
    CONVERSATION_TURN_ERROR: event(
        'conversation:turn:error',
        z.object({
            sessionId: z.string(),
            participantId: z.string(),
            error: z.string(),
            turnIndex: z.number().optional(),
            injected: z.boolean().optional(),
        }),
    ),
    CONVERSATION_PAUSED: event('conversation:paused', z.object({ sessionId: z.string() })),
    CONVERSATION_RESUMED: event('conversation:resumed', z.object({ sessionId: z.string() })),
    CONVERSATION_ABORTED: event('conversation:aborted', z.object({ sessionId: z.string() })),
    CONVERSATION_COMPLETED: event('conversation:completed', z.object({ sessionId: z.string() })),

    // ── Crew + Task + Process (Wave 1.1, CrewAI-style, local-first) ──
    CREW_CREATED: event(
        'crew:created',
        z.object({
            crewId: z.string(),
            name: z.string(),
            process: z.string(),
            roleCount: z.number(),
            taskCount: z.number(),
        }),
    ),
    CREW_STARTED: event('crew:started', z.object({ crewId: z.string(), taskCount: z.number() })),
    CREW_COMPLETED: event(
        'crew:completed',
        z.object({ crewId: z.string(), taskCount: z.number() }),
    ),
    CREW_FAILED: event('crew:failed', z.object({ crewId: z.string(), failedCount: z.number() })),
    CREW_ABORTED: event('crew:aborted', z.object({ crewId: z.string() })),
    CREW_DELETED: event('crew:deleted', z.object({ crewId: z.string() })),
    TASK_STARTED: event(
        'task:started',
        z.object({ crewId: z.string(), taskId: z.string(), assigneeId: z.string() }),
    ),
    TASK_COMPLETED: event('task:completed', z.object({ crewId: z.string(), taskId: z.string() })),
    TASK_FAILED: event(
        'task:failed',
        z.object({ crewId: z.string(), taskId: z.string(), error: z.string() }),
    ),
    TASK_HITL: event('task:hitl', z.object({ crewId: z.string(), taskId: z.string() })),
    FORGE_PROPOSED: event(
        'forge:proposed',
        z.object({
            proposalId: z.string(),
            goal: z.string(),
            roleCount: z.number(),
            mode: z.string(),
        }),
    ),

    // ── Council / advanced debate (Wave 2, additive over Debate Runtime) ──
    COUNCIL_CREATED: event(
        'council:created',
        z.object({
            sessionId: z.string(),
            topic: z.string(),
            phase: z.string(),
            participantCount: z.number(),
            judgeCount: z.number(),
        }),
    ),
    COUNCIL_PROPOSAL: event(
        'council:proposal',
        z.object({ sessionId: z.string(), authorId: z.string(), stance: z.string() }),
    ),
    COUNCIL_FACT: event(
        'council:fact',
        z.object({
            sessionId: z.string(),
            factId: z.string(),
            verdict: z.string(),
            claim: z.string(),
        }),
    ),
    COUNCIL_MESSAGE: event(
        'council:message',
        z.object({ sessionId: z.string(), authorId: z.string(), round: z.number() }),
    ),
    COUNCIL_WHISPER: event(
        'council:whisper',
        z.object({ sessionId: z.string(), fromId: z.string(), toId: z.string() }),
    ),
    COUNCIL_PHASE: event('council:phase', z.object({ sessionId: z.string(), phase: z.string() })),
    COUNCIL_JUDGED: event(
        'council:judged',
        z.object({
            sessionId: z.string(),
            judgeId: z.string(),
            winnerId: z.string(),
            blind: z.boolean(),
        }),
    ),
    COUNCIL_VOTE: event(
        'council:vote',
        z.object({ sessionId: z.string(), voterId: z.string(), pickId: z.string() }),
    ),
    COUNCIL_COMPLETED: event(
        'council:completed',
        z.object({
            sessionId: z.string(),
            winnerId: z.string(),
            judgeCount: z.number(),
            audienceCount: z.number(),
        }),
    ),
    COUNCIL_ABORTED: event('council:aborted', z.object({ sessionId: z.string() })),

    // ── State Graph runtime (Wave 3, LangGraph-style, local-first) ──
    GRAPH_DEFINED: event(
        'graph:defined',
        z.object({
            graphId: z.string(),
            name: z.string(),
            mode: z.string(),
            nodeCount: z.number(),
        }),
    ),
    GRAPH_STARTED: event('graph:started', z.object({ runId: z.string(), graphId: z.string() })),
    GRAPH_NODE: event(
        'graph:node',
        z.object({ runId: z.string(), nodeId: z.string(), kind: z.string() }),
    ),
    GRAPH_CHECKPOINT: event(
        'graph:checkpoint',
        z.object({ runId: z.string(), stepIndex: z.number(), nodeId: z.string() }),
    ),
    GRAPH_REFLECTED: event(
        'graph:reflected',
        z.object({ runId: z.string(), stepCount: z.number() }),
    ),
    GRAPH_HITL: event(
        'graph:hitl',
        z.object({ runId: z.string(), nodeId: z.string(), prompt: z.string() }),
    ),
    GRAPH_APPROVED: event('graph:approved', z.object({ runId: z.string() })),
    GRAPH_REJECTED: event('graph:rejected', z.object({ runId: z.string(), reason: z.string() })),
    GRAPH_COMPLETED: event('graph:completed', z.object({ runId: z.string(), steps: z.number() })),
    GRAPH_FAILED: event('graph:failed', z.object({ runId: z.string(), error: z.string() })),
    GRAPH_ABORTED: event('graph:aborted', z.object({ runId: z.string() })),
    GRAPH_RESTORED: event(
        'graph:restored',
        z.object({ runId: z.string(), checkpointId: z.string(), stepIndex: z.number() }),
    ),

    // ── Persona & Context (Wave 4: Letta-style memory, persona, goals) ──
    MEMORY_REMEMBERED: event(
        'memory:remembered',
        z.object({ memoryId: z.string(), ownerId: z.string(), tier: z.string() }),
    ),
    MEMORY_PROMOTED: event('memory:promoted', z.object({ memoryId: z.string(), tier: z.string() })),
    MEMORY_FORGOTTEN: event('memory:forgotten', z.object({ memoryId: z.string() })),
    MEMORY_SEARCHED: event(
        'memory:searched',
        z.object({ latencyMs: z.number(), hit: z.boolean() }),
    ),
    LT_MEMORY_UPDATED: event(
        'memory:lt-updated',
        z.object({ memoryId: z.string(), ownerId: z.string() }),
    ),
    MEMORY_LINKED: event(
        'memory:linked',
        z.object({ fromId: z.string(), toId: z.string(), relation: z.string() }),
    ),
    PERSONA_DISTILLED: event(
        'persona:distilled',
        z.object({ personId: z.string(), ownerId: z.string(), sampleCount: z.number() }),
    ),
    CONTEXT_CREATED: event(
        'context:created',
        z.object({ contextId: z.string(), scopeKind: z.string(), scopeRef: z.string() }),
    ),
    CONTEXT_SHARED: event('context:shared', z.object({ contextId: z.string(), kind: z.string() })),
    GOAL_CREATED: event(
        'goal:created',
        z.object({ goalId: z.string(), ownerId: z.string(), level: z.string() }),
    ),
    GOAL_PROGRESS: event('goal:progress', z.object({ goalId: z.string(), progress: z.number() })),
    GOAL_COMPLETED: event('goal:completed', z.object({ goalId: z.string(), ownerId: z.string() })),

    // ── Ops / governance / mobile (Wave 5) ──
    OPS_AUDIT: event(
        'ops:audit',
        z.object({ seq: z.number(), actor: z.string(), action: z.string(), target: z.string() }),
    ),
    OPS_HIERARCHY: event('ops:hierarchy', z.object({ nodeId: z.string(), action: z.string() })),
    OPS_BUDGET: event('ops:budget', z.object({ nodeId: z.string(), spent: z.number() })),
    OPS_SANDBOX: event('ops:sandbox', z.object({ ticketId: z.string(), status: z.string() })),
    OPS_MOBILE: event('ops:mobile', z.object({ sessionId: z.string(), status: z.string() })),
    OPS_NOTIFY: event(
        'ops:notify',
        z.object({ notificationId: z.string(), actionRef: z.string() }),
    ),

    // ── Interop / federation / coordination (Phase A: Waves 6+7) ──
    INTEROP_AGENT: event('interop:agent', z.object({ agentId: z.string(), action: z.string() })),
    INTEROP_NEGOTIATED: event(
        'interop:negotiated',
        z.object({ agentId: z.string(), accepted: z.boolean() }),
    ),
    INTEROP_ERROR: event(
        'interop:error',
        z.object({ agentId: z.string(), error: z.record(z.string(), z.unknown()) }),
    ),
    GATEWAY_INGRESS: event(
        'gateway:ingress',
        z.object({
            envelopeId: z.string(),
            from: z.string(),
            protocol: z.string(),
            kind: z.string(),
        }),
    ),
    FED_PEER: event(
        'fed:peer',
        z.object({ peerId: z.string(), action: z.string(), trust: z.string() }),
    ),
    HANDOFF_DISPATCHED: event(
        'handoff:dispatched',
        z.object({ handoffId: z.string(), target: z.string() }),
    ),
    HANDOFF_RETURNED: event('handoff:returned', z.object({ handoffId: z.string() })),
    MARKET_OPENED: event('market:opened', z.object({ listingId: z.string(), mode: z.string() })),
    MARKET_AWARDED: event(
        'market:awarded',
        z.object({ listingId: z.string(), winnerId: z.string() }),
    ),
    CONTRACT_PROPOSED: event('contract:proposed', z.object({ contractId: z.string() })),

    // ── Meta & unified memory (Phase B: Waves 8+9) ──
    META_PROPOSED: event(
        'meta:proposed',
        z.object({ proposalId: z.string(), kind: z.string(), confidence: z.number() }),
    ),
    META_APPLIED: event('meta:applied', z.object({ proposalId: z.string(), kind: z.string() })),
    META_EVOLVED: event('meta:evolved', z.object({ skillRef: z.string() })),
    META_HEALTH: event(
        'meta:health',
        z.object({ kind: z.string(), severity: z.number(), source: z.string() }),
    ),
    COG_WRITTEN: event(
        'cog:written',
        z.object({ memoryId: z.string(), kind: z.string(), scope: z.string() }),
    ),
    COG_GOVERNED: event('cog:governed', z.object({ removed: z.number(), scope: z.string() })),
    COG_COUNTERFACTUAL: event(
        'cog:counterfactual',
        z.object({ recordId: z.string(), ownerId: z.string() }),
    ),
    COG_COMPILED: event('cog:compiled', z.object({ packageId: z.string(), taskClass: z.string() })),
} as const;
