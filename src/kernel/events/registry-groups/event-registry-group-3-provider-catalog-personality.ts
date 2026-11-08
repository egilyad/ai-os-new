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

export const EVENT_REGISTRY_GROUP_3 = {

    // ── Provider Catalog / Personality ────────────────────────────────────

    // ── Roles ─────────────────────────────────────────────────────────────
    ROLE_CREATED: event('role:created', z.unknown()),
    ROLE_DELETED: event('role:deleted', z.unknown()),
    ROLE_SANDBOX_TEST_COMPLETED: event('role:sandbox:test:completed', z.unknown()),
    ROLE_SANDBOX_TEST_FAILED: event('role:sandbox:test:failed', z.unknown()),
    ROLE_UPDATED: event('role:updated', z.unknown()),

    // ── Team Events ────────────────────────────────────────────────────────
    TEAM_CREATED: event(
        'team:created',
        z.object({ id: z.string(), name: z.string(), domain: z.string(), memberCount: z.number() }),
    ),
    TEAM_UPDATED: event(
        'team:updated',
        z.object({ id: z.string(), name: z.string().optional(), strategy: z.string().optional() }),
    ),
    TEAM_DELETED: event('team:deleted', z.object({ id: z.string(), name: z.string() })),
    TEAM_EXECUTION_STARTED: event(
        'team:execution:started',
        z.object({
            teamId: z.string(),
            task: z.string(),
            strategy: z.string(),
            timestamp: z.number(),
        }),
    ),
    TEAM_EXECUTION_COMPLETED: event(
        'team:execution:completed',
        z.object({
            teamId: z.string(),
            duration: z.number(),
            tokensUsed: z.number(),
            successRate: z.number(),
            synthesis: z.string().optional(),
        }),
    ),
    TEAM_EXECUTION_FAILED: event(
        'team:execution:failed',
        z.object({
            teamId: z.string(),
            error: z.string(),
            failedRoles: z.array(z.string()).optional(),
        }),
    ),
    // ── Scheduler ─────────────────────────────────────────────────────────
    SCHEDULE_COMPLETED: event('schedule:completed', z.unknown()),
    SCHEDULE_CREATED: event('schedule:created', z.unknown()),
    SCHEDULE_DELETED: event('schedule:deleted', z.unknown()),
    SCHEDULE_TRIGGERED: event('schedule:triggered', z.unknown()),
    SCHEDULE_UPDATED: event('schedule:updated', z.unknown()),
    SCHEDULER_HEARTBEAT: event('scheduler:heartbeat', z.object({ lastCheckTime: z.number() })),

    // ── Metrics ───────────────────────────────────────────────────────────
    KEY_STORE_GAUGES: event(
        'metrics:key:store:gauges',
        z.object({
            activeCount: z.number(),
            errorCount: z.number(),
            alertCount: z.number(),
            totalCount: z.number().optional(),
        }),
    ),

    // ── WhatIf / Pressure ────────────────────────────────────────────────
    WHATIF_SIMULATION_COMPLETED: event(
        'whatif:simulation:completed',
        z.object({
            type: z.string(),
            sessionId: z.string().optional(),
            proposedType: z.string().optional(),
            additionalAgents: z.number().optional(),
            proposedBudget: z.number().optional(),
            currentBudget: z.number().optional(),
            ratio: z.number().optional(),
            currentProvider: z.string().optional(),
            proposedProvider: z.string().optional(),
            latencyImpact: z.number().optional(),
            costImpact: z.number().optional(),
            reliabilityImpact: z.number().optional(),
            hasResult: z.boolean().optional(),
            currentStrategy: z.string().optional(),
            proposedStrategy: z.string().optional(),
            estimatedQualityChange: z.number().optional(),
            estimatedLatencyChange: z.number().optional(),
            estimatedCostChange: z.number().optional(),
            policyType: z.string().optional(),
            violationsCount: z.number().optional(),
            severityLevel: z.string().optional(),
        }),
    ),
    PRESSURE_MAP_UPDATED: event(
        'pressure:map:updated',
        z.object({
            global: z.object({ level: z.string(), score: z.number() }),
            providers: z.array(z.unknown()),
            sessions: z.array(z.unknown()),
            alertCount: z.number(),
            timestamp: z.number(),
        }),
    ),
    PRESSURE_ALERT_RAISED: event(
        'pressure:alert:raised',
        z.object({
            scope: z.string(),
            id: z.string(),
            level: z.string(),
            message: z.string(),
            timestamp: z.number(),
            acknowledged: z.boolean(),
        }),
    ),

    // ── Webhook / Secrets / Compromise ────────────────────────────────────
    WEBHOOK_DELIVERY_FAILED: event('webhook:delivery:failed', z.unknown()),
    SECRETS_LOOKUP_FAILED: event('secrets:lookup:failed', z.unknown()),
    COMPROMISE_SIGNAL_REJECTED: event('compromise:signal:rejected', z.unknown()),

    // ── Topology / Queue ──────────────────────────────────────────────────
    TOPOLOGY_EVALUATED: event('topology:evaluated', z.unknown()),
    QUEUE_TASK_FAILED: event(
        'queue:task:failed',
        z.object({
            taskId: z.string(),
            priority: z.string(),
            error: z.string(),
            timestamp: z.number(),
        }),
    ),
} as const;
