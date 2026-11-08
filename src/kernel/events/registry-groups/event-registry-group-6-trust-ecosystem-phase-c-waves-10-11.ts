import { z } from 'zod';
function event<N extends string, S extends z.ZodType>(name: N, schema: S) {
    return { name, schema } as const;
}
export const EVENT_REGISTRY_GROUP_6 = {

    // ── Trust & ecosystem (Phase C: Waves 10+11) ──
    TRUST_UPDATED: event('trust:updated', z.object({ subject: z.string(), score: z.number() })),
    TRUST_POLICY: event('trust:policy', z.object({ policyId: z.string(), effect: z.string() })),
    ECO_INSTALLED: event('eco:installed', z.object({ bundleId: z.string(), items: z.number() })),
    ECO_SNAPSHOT: event('eco:snapshot', z.object({ snapshotId: z.string(), tables: z.number() })),

    // ── Frontier evals & exotic (Phase D: Waves 12+13) ──
    EVAL_RUN: event(
        'eval:run',
        z.object({
            runId: z.string(),
            benchmarkId: z.string(),
            total: z.number(),
            maxTotal: z.number(),
        }),
    ),
    EVAL_COMPARED: event(
        'eval:compared',
        z.object({ benchmarkId: z.string(), winner: z.string(), delta: z.number() }),
    ),
    EVAL_REDTEAM: event('eval:redteam', z.object({ target: z.string(), attacks: z.number() })),
    EVAL_ORG: event('eval:org', z.object({ orgId: z.string(), action: z.string() })),
    EVAL_INTENT: event('eval:intent', z.object({ intentId: z.string(), steps: z.number() })),

    // ── Parity E.2/E.3 (tools, knowledge, training) ──
    TOOL_EXECUTED: event(
        'tool:executed',
        z.object({
            agentId: z.string(),
            tool: z.string(),
            ok: z.boolean(),
            latencyMs: z.number(),
        }),
    ),
    KNOWLEDGE_ADDED: event(
        'knowledge:added',
        z.object({ sourceId: z.string(), chunks: z.number() }),
    ),
    KNOWLEDGE_HYBRID_RETRIEVED: event(
        'knowledge:hybrid:retrieved',
        z.object({
            query: z.string(),
            count: z.number(),
            bm25Candidates: z.number(),
            vectorCandidates: z.number(),
            reranked: z.boolean(),
        }),
    ),
    TRAINING_RECORDED: event(
        'training:recorded',
        z.object({ role: z.string(), runs: z.number(), quality: z.number() }),
    ),
    CATALOG_UPDATED: event(
        'catalog:updated',
        z.object({ at: z.number(), count: z.number().optional() }),
    ),

    // ── Rival parity (Phase F: 10 projects) ──
    LOOP_ITER: event('loop:iter', z.object({ loopId: z.string(), iteration: z.number() })),
    GROUPCHAT_CREATED: event(
        'groupchat:created',
        z.object({ chatId: z.string(), members: z.number() }),
    ),
    GROUPCHAT_TURN: event('groupchat:turn', z.object({ chatId: z.string(), speaker: z.string() })),
    GUARDRAIL_HIT: event('guardrail:hit', z.object({ ruleId: z.string(), tripwire: z.string() })),
    GUARDRAIL_RULE_ADDED: event(
        'guardrail:rule:added',
        z.object({ ruleId: z.string(), name: z.string(), kind: z.string(), tripwire: z.string() }),
    ),
    GUARDRAIL_RULE_REMOVED: event('guardrail:rule:removed', z.object({ ruleId: z.string() })),
    INTERPRETER_EXEC: event(
        'interpreter:exec',
        z.object({ lang: z.string(), codeHash: z.string(), ok: z.boolean() }),
    ),
    MINISWE_SOLVED: event('miniswe:solved', z.object({ issue: z.string(), passed: z.boolean() })),
    WHALE_CARGO_CHECK: event(
        'whale:cargo:check',
        z.object({ ok: z.boolean(), output: z.string() }),
    ),
    WHALE_PATCH_APPLIED: event('whale:patch:applied', z.object({ lines: z.number() })),
    CACHE_CONTROL_MARKED: event(
        'cache:control:marked',
        z.object({ key: z.string(), ttlMs: z.number() }),
    ),
    CACHE_CONTROL_STATS: event(
        'cache:control:stats',
        z.object({ entries: z.number(), hitRate: z.number() }),
    ),
    FILES_UPLOADED: event('files:uploaded', z.object({ fileId: z.string(), name: z.string() })),
    PROJECT_CREATED_RIVALS: event(
        'project:created:rivals',
        z.object({ projectId: z.string(), name: z.string() }),
    ),
    PROJECT_FILE_ADDED: event(
        'project:file:added',
        z.object({ projectId: z.string(), name: z.string() }),
    ),
    ROUTINE_DEFINED: event(
        'routine:defined',
        z.object({ routineId: z.string(), name: z.string() }),
    ),
    ROUTINE_TRIGGERED: event('routine:triggered', z.object({ routineId: z.string() })),
    AGENTVIEW_SESSIONS: event('agentview:sessions', z.object({ count: z.number() })),
    AGENTVIEW_SKILL: event('agentview:skill', z.object({ skill: z.string(), task: z.string() })),
    BLOCK_SET: event('block:set', z.object({ ownerId: z.string(), section: z.string() })),
    SOP_PHASE: event(
        'sop:phase',
        z.object({ loopId: z.string(), phase: z.string(), artifact: z.string(), role: z.string() }),
    ),
    QUEUE_ENQUEUED: event('queue:enqueued', z.object({ runId: z.string(), kind: z.string() })),
    DYAD_DONE: event('dyad:done', z.object({ loopId: z.string(), turns: z.number() })),
    PLANNER_PLAN_COMPLETED: event(
        'planner:plan:completed',
        z.object({ task: z.string(), strategy: z.string(), result: z.string() }),
    ),
    PLANNER_STEP: event('planner:step', z.object({ step: z.string(), result: z.string() })),
    PLANNER_FILTER_ADDED: event(
        'planner:filter:added',
        z.object({ stage: z.string(), name: z.string() }),
    ),

    // ── Rival parity 2 (Phase G: 10 more projects) ──
    REACT_STEP: event('react:step', z.object({ runId: z.string(), step: z.number() })),
    RAG_ANSWERED: event('rag:answered', z.object({ citations: z.number(), rounds: z.number() })),
    RUNTIME_STARTED: event('runtime:started', z.object({ runId: z.string() })),
    RUNTIME_ACTION: event('runtime:action', z.object({ runId: z.string(), action: z.string() })),
    SWE_EDIT: event('swe:edit', z.object({ path: z.string() })),
    MODES_SWITCHED: event('modes:switched', z.object({ modeId: z.string(), name: z.string() })),
    SMEM_ADDED: event('smem:added', z.object({ memoryId: z.string(), scope: z.string() })),
    INTEGRATION_TRIGGER: event(
        'integration:trigger',
        z.object({ app: z.string(), trigger: z.string(), triggerId: z.string() }),
    ),
    CHARACTER_IMPORTED: event(
        'character:imported',
        z.object({ personId: z.string(), name: z.string() }),
    ),

    // ── Rival parity 3 (Phase H: third 10) ──
    REASON_THOUGHT: event('reason:thought', z.object({ steps: z.number() })),
    SESSION_DELTA: event(
        'session:delta',
        z.object({ scope: z.string(), scopeId: z.string(), key: z.string() }),
    ),
    DATASET_HIT: event(
        'dataset:hit',
        z.object({ datasetId: z.string(), fromAnnotation: z.boolean() }),
    ),
    DOCSTORE_FEEDBACK: event(
        'docstore:feedback',
        z.object({ messageId: z.string(), vote: z.string() }),
    ),
    TYPED_VALID: event('typed:valid', z.object({ agentId: z.string(), attempts: z.number() })),
    CODEPLAN_ROUND: event('codeplan:round', z.object({ round: z.number(), calls: z.number() })),
    DIALOGUE_TURN: event('dialogue:turn', z.object({ botId: z.string(), intent: z.string() })),
    BOTROUTE_NODE: event('botroute:node', z.object({ nodeId: z.string(), hits: z.number() })),

    // ── Rival parity 4 (Phase I: fourth 10) ──
    COPILOT_TOPIC: event('copilot:topic', z.object({ topicId: z.string(), score: z.number() })),
    BEDROCK_ACTION: event('bedrock:action', z.object({ groupId: z.string(), tool: z.string() })),
    BEDROCK_GUARD: event('bedrock:guard', z.object({ ok: z.boolean(), hits: z.number() })),
    CX_ROUTE: event('cx:route', z.object({ flowId: z.string(), toPage: z.string() })),
    FORCE_RUN: event('force:run', z.object({ topicId: z.string(), actions: z.number() })),
    KORE_INTERRUPT: event('kore:interrupt', z.object({ dialogId: z.string(), intent: z.string() })),
    YELLOW_SENT: event('yellow:sent', z.object({ campaignId: z.string(), delivered: z.number() })),
    LINDY_HIRED: event('lindy:hired', z.object({ employeeId: z.string() })),
    SMOL_STEP: event('smol:step', z.object({ tool: z.string() })),

    // ── Rival parity 5 (Phase J: fifth 10) ──
    APP_SCAFFOLD: event('app:scaffold', z.object({ files: z.number() })),
    ONTO_CREATED: event('onto:created', z.object({ instanceId: z.string(), type: z.string() })),
    WORK_PUSHED: event('work:pushed', z.object({ itemId: z.string() })),
    COMPUTER_ACT: event('computer:act', z.object({ ticketId: z.string(), action: z.string() })),
    COMPUTER_HANDOFF: event('computer:handoff', z.object({ action: z.string() })),
    SEARCH_FANOUT: event('search:fanout', z.object({ providers: z.number(), hits: z.number() })),
    CODEEXEC_QUEUED: event(
        'codeexec:queued',
        z.object({ ticketId: z.string(), language: z.string() }),
    ),
    CODEEXEC_SANDBOX_DONE: event(
        'codeexec:sandbox:done',
        z.object({ ticketId: z.string(), language: z.string(), timeoutMs: z.number() }),
    ),
    BROWSER_HARNESS_ACT: event(
        'browser:harness:act',
        z.object({ id: z.string(), ticketId: z.string(), action: z.string(), status: z.string() }),
    ),
    MCP_HARNESS_RECONNECTED: event(
        'mcp:harness:reconnected',
        z.object({
            total: z.number(),
            connected: z.number(),
            reconnected: z.number(),
            failed: z.number(),
        }),
    ),
    MCP_HARNESS_PROXY: event(
        'mcp:harness:proxy',
        z.object({
            serverId: z.string(),
            tool: z.string(),
            ok: z.boolean(),
            error: z.string().optional(),
        }),
    ),
    EVAL_SCORER_REGISTERED: event('eval:scorer:registered', z.object({ name: z.string() })),
    EVAL_JUDGE_DONE: event(
        'eval:judge:done',
        z.object({ task: z.string(), score: z.number(), via: z.enum(['stub', 'llm']) }),
    ),
} as const;