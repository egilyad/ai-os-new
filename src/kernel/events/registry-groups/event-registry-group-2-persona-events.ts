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

export const EVENT_REGISTRY_GROUP_2 = {

    // ── Persona Events ────────────────────────────────────────────────────
    PERSONA_CHANGED: event('persona:changed', z.unknown()),
    PERSONA_TONE_CHANGED: event('persona:tone:changed', z.unknown()),
    PERSONA_CREATED: event('persona:created', z.unknown()),
    PERSONA_UPDATED: event('persona:updated', z.unknown()),
    PERSONA_DELETED: event('persona:deleted', z.unknown()),

    // ── Achievement / Agent Delegation ────────────────────────────────────
    AGENT_WIZARD_CONFIG_GENERATED: event('agent:wizard:config-generated', z.unknown()),
    AGENT_JOURNAL_ADDED: event('agent:journal:added', z.unknown()),
    AGENT_JOURNAL_REMOVED: event('agent:journal:removed', z.unknown()),
    AGENT_JOURNAL_CLEARED: event('agent:journal:cleared', z.unknown()),

    // ── Aquarium / Arch Review ────────────────────────────────────────────
    AQUARIUM_SCREENSHOT_CAPTURED: event('aquarium:screenshot:captured', z.unknown()),
    // ── Chat Lifecycle ────────────────────────────────────────────────────
    CHAT_FORKED: event('chat:forked', z.unknown()),
    CHAT_REWOUND: event('chat:rewound', z.unknown()),
    CHAT_BOOKMARK_ADDED: event('chat:bookmark:added', z.unknown()),
    CHAT_BOOKMARK_REMOVED: event('chat:bookmark:removed', z.unknown()),
    CHAT_BOOKMARK_CLEARED: event('chat:bookmark:cleared', z.unknown()),

    // ── Experiment / Hypothesis / Research ────────────────────────────────
    HYPOTHESES_UPDATED: event('hypotheses:updated', z.unknown()),
    RESEARCH_SESSION_UPDATED: event('research:session:updated', z.unknown()),

    // ── Key Rotation ──────────────────────────────────────────────────────
    KEY_ROTATION_TRIGGERED: event(
        'key:rotation:triggered',
        z.object({
            keyId: z.string(),
            provider: z.string().optional(),
            trigger: z.string().optional(),
            reason: z.string().optional(),
            timestamp: z.number().optional(),
            autoRotate: z.boolean().optional(),
            metadata: z.object({ error: z.string() }).optional(),
        }),
    ),

    // ── Intelligence / Local ──────────────────────────────────────────────
    KEY_INTELLIGENCE_PIPELINE_ERROR: event('key:intelligence:pipeline:error', z.unknown()),

    // ── Message / Prompt ──────────────────────────────────────────────────
} as const;
