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

export const EVENT_REGISTRY_GROUP_7 = {

    // ── Rival parity 6 (Phase K: sixth 10) ──
    N8N_RUN: event('n8n:run', z.object({ workflowId: z.string(), execId: z.string() })),
    MAKE_RUN: event('make:run', z.object({ modules: z.number() })),
    ZAP_FIRED: event('zap:fired', z.object({ zapId: z.string(), actions: z.number() })),
    TEMPORAL_STEP: event('temporal:step', z.object({ runId: z.string(), step: z.string() })),
    TEMPORAL_SIGNAL: event('temporal:signal', z.object({ runId: z.string(), key: z.string() })),
    TEMPORAL_PAUSED: event('temporal:paused', z.object({ runId: z.string(), step: z.string() })),
    ASSET_BUILT: event('asset:built', z.object({ asset: z.string(), count: z.number() })),
    SENSOR_OK: event('sensor:ok', z.object({ tool: z.string(), attempts: z.number() })),
    VOICE_STARTED: event('voice:started', z.object({ callId: z.string() })),
    VOICE_ENDED: event('voice:ended', z.object({ callId: z.string(), turns: z.number() })),
    SUPPORT_OPEN: event('support:open', z.object({ ticketId: z.string() })),
    SUPPORT_HANDOFF: event('support:handoff', z.object({ ticketId: z.string(), team: z.string() })),

    // ── Debate plus (Phase L: seventh 10, debate focus) ──
    FORMAT_START: event('format:start', z.object({ formatId: z.string(), topic: z.string() })),
    FORMAT_DONE: event('format:done', z.object({ formatId: z.string(), winner: z.string() })),
    DUNG_ATTACK: event('dung:attack', z.object({ from: z.string(), to: z.string() })),
    TOULMIN_CARD: event('toulmin:card', z.object({ cardId: z.string(), completeness: z.number() })),
    BRIER_RESOLVED: event('brier:resolved', z.object({ claimId: z.string(), brier: z.number() })),

    // ── Rival parity 8 (Phase M: forums/diagnostics/cognitive) ──
    FORUMPLUS_POLL: event('forumplus:poll', z.object({ pollId: z.string() })),
    FORUMPLUS_SOLVED: event(
        'forumplus:solved',
        z.object({ topicId: z.string(), postId: z.string() }),
    ),
    DECISION_OUTCOME: event(
        'decision:outcome',
        z.object({ proposalId: z.string(), result: z.string() }),
    ),
    POLIS_CLUSTERED: event(
        'polis:clustered',
        z.object({ convoId: z.string(), groups: z.number() }),
    ),
    REFLEXION_TRIAL: event('reflexion:trial', z.object({ trial: z.number(), ok: z.boolean() })),
    REFLEXION_DONE: event('reflexion:done', z.object({ trials: z.number(), ok: z.boolean() })),
    TOT_LEVEL: event('tot:level', z.object({ level: z.number(), kept: z.number() })),
    SELFCON_VOTE: event('selfcon:vote', z.object({ paths: z.number(), confidence: z.number() })),
    SOAR_FIRED: event('soar:fired', z.object({ count: z.number() })),
    SOAR_IMPASSE: event('soar:impasse', z.object({ impasse: z.number() })),
    METER_ALERT: event('meter:alert', z.object({ name: z.string(), value: z.number() })),
    ERR_CAPTURED: event('err:captured', z.object({ fingerprint: z.string() })),

    // ── Rival parity 9 (Phase N: hype — OpenClaw/DSH/CN/Manus/Genspark) ──
    CLAW_SOUL: event('claw:soul', z.object({ personId: z.string(), name: z.string() })),
    CLAW_CRON: event('claw:cron', z.object({ count: z.number() })),
    DSH_PLUGIN: event('dsh:plugin', z.object({ name: z.string(), enabled: z.boolean() })),
    MANUS_VERIFY: event('manus:verify', z.object({ round: z.number(), pass: z.boolean() })),
    MANUS_EXPORT: event('manus:export', z.object({ kind: z.string(), refId: z.string() })),
    GEN_FANOUT: event('gen:fanout', z.object({ providers: z.number() })),
    GEN_SHEETS: event('gen:sheets', z.object({ rows: z.number(), cols: z.number() })),
    GEN_LONGTASK: event(
        'gen:longtask',
        z.object({ kind: z.string(), refId: z.string(), status: z.string() }),
    ),

    // ── Rival parity 10 (Phase P: Google + Chat Studio) ──
    A2ASPEC_CARD: event('a2aspec:card', z.object({ agentId: z.string() })),
    A2ASPEC_TASK: event('a2aspec:task', z.object({ taskId: z.string(), state: z.string() })),
    CACHE_SAVED: event('cache:saved', z.object({ cacheId: z.string(), bytes: z.number() })),
    NOTEBOOK_AUDIO: event(
        'notebook:audio',
        z.object({ notebookId: z.string(), chars: z.number() }),
    ),
    LIVE_BARGE: event('live:barge', z.object({ sessionId: z.string(), interruptions: z.number() })),
    LIVE_TOOL: event('live:tool', z.object({ sessionId: z.string(), tool: z.string() })),
    DEEPRES_STEP: event('deepres:step', z.object({ step: z.string() })),
    STUDIO_PACK: event('studio:pack', z.object({ kind: z.string(), ref: z.string() })),

    // ── Rival parity 11 (Phase Q: viz + light sims, the last 9 to 100) ──
    NETLOGO_TICK: event('netlogo:tick', z.object({ worldId: z.string(), ticks: z.number() })),
    MESA_STEP: event('mesa:step', z.object({ modelId: z.string(), steps: z.number() })),
    BONSAI_TRAINED: event('bonsai:trained', z.object({ lessonId: z.string(), reward: z.number() })),
    CHAINLIT_STEP: event('chainlit:step', z.object({ stepId: z.string(), runId: z.string() })),
    MALMO_GOAL: event('malmo:goal', z.object({ missionId: z.string(), agent: z.string() })),

    // ── Rival parity 12 (Phase R: exotic/research) ──
    CONSTIT_CRITIQUE: event('constit:critique', z.object({ violations: z.number() })),
    CONSTIT_REVISE: event('constit:revise', z.object({ ok: z.boolean() })),
    VOYAGER_SKILL: event('voyager:skill', z.object({ name: z.string() })),
    VOYAGER_STEP: event('voyager:step', z.object({ ok: z.boolean() })),

    // ── Rival RU (Phase U: Russian school + market) ──
    METABOLIC_TICK: event('metabolic:tick', z.object({ dominant: z.string(), level: z.string() })),
    MAESTRO_ORCHESTRATE: event(
        'maestro:orchestrate',
        z.object({ ecoId: z.string(), role: z.string() }),
    ),
    LOCALTRIPLE_RUN: event('localtriple:run', z.object({ ok: z.boolean() })),
    RUSLAN_LEARN: event('ruslan:learn', z.object({ skill: z.string() })),
    EVOLAB_RUN: event('evolab:run', z.object({ pattern: z.string(), score: z.number() })),
    GIGASTUDIO_GEN: event('gigastudio:gen', z.object({ files: z.number() })),
    AGENCYRU_CATALOG: event('agencyru:catalog', z.object({ count: z.number() })),
    AGENCYRU_IMPORT: event('agencyru:import', z.object({ name: z.string(), queued: z.boolean() })),
    ANALITIK_INTAKE: event('analitik:intake', z.object({ id: z.string() })),
    CHEMIST_ASK: event('chemist:ask', z.object({ question: z.string(), hasRag: z.boolean() })),
    HEISENBERG_BOARD: event('heisenberg:board', z.object({ count: z.number() })),
    HEISENBERG_MOVE: event('heisenberg:move', z.object({ cardId: z.string(), status: z.string() })),
} as const;
