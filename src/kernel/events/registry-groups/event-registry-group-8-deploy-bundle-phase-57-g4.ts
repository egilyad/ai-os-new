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

export const EVENT_REGISTRY_GROUP_8 = {

    // ── Deploy bundle (Phase 57: G4) ──
    DEPLOY_BUNDLE_CREATED: event(
        'deploy:bundle:created',
        z.object({ bundleId: z.string(), configId: z.string(), target: z.string() }),
    ),
    SIM_WORLD_CREATED: event(
        'sim:world:created',
        z.object({ worldId: z.string(), name: z.string() }),
    ),
    SIM_TICK: event('sim:tick', z.object({ worldId: z.string(), tick: z.number() })),
    SIM_COMPLETED: event('sim:completed', z.object({ worldId: z.string(), ticks: z.number() })),

    // ── Rival synth (Phase V: MIT/Sakana etc.) ──
    LATENT_SYNTH: event('latent:synth', z.object({ agents: z.number() })),
    AISCIENTIST_QUEUED: event('aiscientist:queued', z.object({ ideaId: z.string() })),
    AISCIENTIST_RUN: event('aiscientist:run', z.object({ ideaId: z.string(), score: z.number() })),
    SPARKS_CYCLE: event('sparks:cycle', z.object({ hypothesis: z.string() })),
    SCIAGENTS_HYPOTHESIZE: event('sciagents:hypothesize', z.object({ topic: z.string() })),
    EIGHTSTAGE_RUN: event('eightstage:run', z.object({ topic: z.string(), stages: z.number() })),
    COGNITAE_RUN: event('cognitae:run', z.object({ task: z.string() })),
    COGTEAM_RUN: event('cogteam:run', z.object({ task: z.string() })),
    SYN_SLEEP: event('syn:sleep', z.object({ compressed: z.number() })),
    HELIX_GAPS: event('helix:gaps', z.object({ count: z.number() })),
    IDEATOR_TEST: event('ideator:test', z.object({ topic: z.string(), best: z.string() })),
    RCK_BIND: event('rck:bind', z.object({ id: z.string() })),
    COGNEE_RECALL: event('cognee:recall', z.object({ query: z.string() })),
    METAN_HIERARCHY: event('metan:hierarchy', z.object({ id: z.string() })),
    CONCEPTS_COMPOSE: event('concepts:compose', z.object({ count: z.number() })),
    SECONDBRAIN_RUN: event('secondbrain:run', z.object({ input: z.string() })),
    STORM_RESEARCH: event('storm:research', z.object({ topic: z.string() })),
    BLACKBOARD_POST: event('blackboard:post', z.object({ board: z.string() })),
    DOLORES_TRACE: event('dolores:trace', z.object({ id: z.string() })),
    EPISTEME_SYNC: event('episteme:sync', z.object({ id: z.string() })),
    METAKB_QUERY: event('metakb:query', z.object({ query: z.string() })),
    RESEARCHOS_FOLDER: event('researchos:folder', z.object({ folder: z.string() })),
    DEEPRESEARCH2_RUN: event('deepresearch2:run', z.object({ topic: z.string() })),
    DARWIN_EVOLVE: event('darwin:evolve', z.object({ task: z.string() })),
    QYVARIA_QUERY: event('qyvaria:query', z.object({ query: z.string() })),
    PARLIAMENTARY_RUN: event('parliamentary:run', z.object({ topic: z.string() })),
    POLICY_ADVANTAGES: event('policy:advantages', z.object({ topic: z.string() })),
    SOCRATIC_DISCUSS: event('socratic:discuss', z.object({ topic: z.string() })),
    FISHBOWL_ROTATE: event('fishbowl:rotate', z.object({ topic: z.string() })),
    CONTINUE_CHAT: event('continue:chat', z.object({ message: z.string() })),
    GOOSE_RECIPE: event('goose:recipe', z.object({ name: z.string() })),
    GPTENGINEER_RUN: event('gptengineer:run', z.object({ spec: z.string() })),
    GOTPILOT_START: event('gptpilot:start', z.object({ spec: z.string() })),
    PI_DISPATCH: event('pi:dispatch', z.object({ tool: z.string() })),
    TABBY_COMPLETE: event('tabby:complete', z.object({ prefix: z.string() })),
    VOID_SESSION: event('void:session', z.object({ file: z.string() })),
    WARP_BLOCK: event('warp:block', z.object({ input: z.string() })),
    ZED_OPEN: event('zed:open', z.object({ path: z.string() })),
    CODEX_PROMPT: event('codex:prompt', z.object({ prompt: z.string() })),
    GEMINICLI_CHAT: event('geminicli:chat', z.object({ message: z.string() })),
    KILO_FANOUT: event('kilo:fanout', z.object({ prompt: z.string(), models: z.number() })),
    HELICONE_LOG: event('helicone:log', z.object({ request: z.string() })),
    PORTKEY_ROUTE: event('portkey:route', z.object({ model: z.string() })),
    LITELLM_PROXY: event('litellm:proxy', z.object({ model: z.string() })),
    LANGFUSE_TRACE: event('langfuse:trace', z.object({ name: z.string() })),

    // ── Projects (roadmapp.md) ──
    PROJECT_CREATED: event(
        'project:created',
        z.object({ projectId: z.string(), name: z.string(), type: z.string() }),
    ),
    PROJECT_UPDATED: event('project:updated', z.object({ projectId: z.string() })),
    PROJECT_DELETED: event('project:deleted', z.object({ projectId: z.string() })),
    PROJECT_AGENT_ASSIGNED: event(
        'project:agent:assigned',
        z.object({ projectId: z.string(), agentId: z.string(), role: z.string() }),
    ),
    PROJECT_AGENT_REMOVED: event(
        'project:agent:removed',
        z.object({ projectId: z.string(), agentId: z.string() }),
    ),
    PROJECT_TASK_CREATED: event(
        'project:task:created',
        z.object({ projectId: z.string(), taskId: z.string(), title: z.string() }),
    ),
    PROJECT_TASK_STATUS: event(
        'project:task:status',
        z.object({ projectId: z.string(), taskId: z.string(), status: z.string() }),
    ),
    PROJECT_RUN_STARTED: event(
        'project:run:started',
        z.object({
            projectId: z.string(),
            runId: z.string(),
            taskId: z.string(),
            agentId: z.string(),
        }),
    ),
    PROJECT_RUN_COMPLETED: event(
        'project:run:completed',
        z.object({ projectId: z.string(), runId: z.string(), status: z.string() }),
    ),
    PROJECT_FILE_UPDATED: event(
        'project:file:updated',
        z.object({ projectId: z.string(), path: z.string(), agentId: z.string().optional() }),
    ),
    PROJECT_FILE_DELETED: event(
        'project:file:deleted',
        z.object({ projectId: z.string(), path: z.string() }),
    ),

    // ── Project Workspace (roadmapp.md §P2) ──
    WORKSPACE_INITIALIZED: event('workspace:initialized', z.object({ projectId: z.string() })),
    WORKSPACE_FILE_WRITTEN: event(
        'workspace:file:written',
        z.object({ projectId: z.string(), path: z.string(), size: z.number() }),
    ),
    WORKSPACE_FILE_DELETED: event(
        'workspace:file:deleted',
        z.object({ projectId: z.string(), path: z.string() }),
    ),
    WORKSPACE_DIR_DELETED: event(
        'workspace:dir:deleted',
        z.object({ projectId: z.string(), path: z.string() }),
    ),

    // ── Agent Runtime (roadmapp.md §P3) ──
    RUNTIME_AGENT_EVENT: event(
        'runtime:agent:event',
        z.object({
            type: z.string(),
            agentId: z.string(),
            projectId: z.string(),
            taskId: z.string().optional(),
            tool: z.string().optional(),
            message: z.string().optional(),
            timestamp: z.number(),
        }),
    ),

    // ── Website Preview (roadmapp.md §P4) ──
    WEBSITE_PREVIEW_GENERATED: event(
        'website:preview:generated',
        z.object({ projectId: z.string(), fileCount: z.number() }),
    ),
    WEBSITE_PREVIEW_VALIDATED: event(
        'website:preview:validated',
        z.object({ projectId: z.string(), valid: z.boolean(), errorCount: z.number() }),
    ),

    // ── QA / Browser Inspector (roadmapp.md §P5) ──
    QA_INSPECTION_COMPLETED: event(
        'qa:inspection:completed',
        z.object({
            projectId: z.string(),
            score: z.number(),
            passed: z.boolean(),
            issueCount: z.number(),
        }),
    ),

    // ── Multi-Agent Pipeline (roadmapp.md §P6) ──
    PIPELINE_CREATED: event(
        'pipeline:created',
        z.object({ projectId: z.string(), currentStage: z.string() }),
    ),
    PIPELINE_STAGE_COMPLETED: event(
        'pipeline:stage:completed',
        z.object({ projectId: z.string(), stage: z.string(), output: z.string().optional() }),
    ),
    PIPELINE_ADVANCED: event(
        'pipeline:advanced',
        z.object({ projectId: z.string(), fromStage: z.string(), toStage: z.string() }),
    ),
    PIPELINE_COMPLETED: event(
        'pipeline:completed',
        z.object({ projectId: z.string(), totalStages: z.number() }),
    ),
} as const;
