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

/**
 * EVENT_REGISTRY — single source of truth for all events.
 * Each entry defines the event's string name and its Zod schema.
 * DO NOT add events directly to event-names.ts, event-map.ts, or EventValidators;
 * add them here, and all 3 derived exports will include them automatically.
 */

// ── Provider / Key Events ──────────────────────────────────────────────────
export const EVENT_REGISTRY = {
    KEYS_LOADED: event('key:loaded', z.array(ApiKeySchema)),
    KEY_ADDED: event('key:added', ApiKeySchema),
    KEY_REMOVED: event('key:removed', z.object({ id: z.string() })),
    KEY_UPDATED: event('key:updated', z.array(ApiKeySchema)),
    KEY_STATE_CHANGED: event(
        'key:state:changed',
        z.object({
            id: z.string(),
            provider: z.string(),
            state: z.string(),
            previousState: z.string(),
        }),
    ),
    KEY_COMPROMISED: event(
        'key:compromised',
        z.object({ id: z.string(), provider: z.string(), source: z.string() }),
    ),
    COMPROMISE_SIGNAL: event(
        'key:compromise:signal',
        z.object({
            id: z.string().optional(),
            fingerprint: z.string().optional(),
            source: z.string().optional(),
        }),
    ),
    KEY_COMPROMISE_SIGNAL: event(
        'key:compromise:signal',
        z.object({
            id: z.string().optional(),
            fingerprint: z.string().optional(),
            source: z.string().optional(),
        }),
    ),
    GROUP_SYNC: event(
        'key:group:sync',
        z.object({
            passportAdded: z.number().optional(),
            assigned: z.number().optional(),
            reassigned: z.number().optional(),
        }),
    ),
    KEY_GROUP_SYNC: event(
        'key:group:sync',
        z.object({
            passportAdded: z.number().optional(),
            assigned: z.number().optional(),
            reassigned: z.number().optional(),
        }),
    ),
    KEY_HEALTH_CHECK_STARTED: event(
        'key:health:check:started',
        z.union([z.string(), z.void(), z.undefined()]).optional(),
    ),
    KEY_HEALTH_CHECK_COMPLETED: event(
        'key:health:check:completed',
        z
            .object({
                id: z.string().optional(),
                provider: z.string().optional(),
                status: z.string().optional(),
            })
            .optional(),
    ),
    KEY_HEALTH_CHECK_FAILED: event(
        'key:health:check:failed',
        z.object({ id: z.string(), provider: z.string(), error: z.string() }),
    ),
    KEY_LATENCY_BURST: event(
        'key:latency:burst',
        z.object({ id: z.string(), provider: z.string(), latency: z.number() }),
    ),
    KEY_QUOTA_EXCEEDED: event(
        'key:quota:exceeded',
        z.object({
            id: z.string(),
            provider: z.string(),
            quotaType: z.enum(['tokens', 'requests']),
            limit: z.number().optional(),
            current: z.number().optional(),
            resetAt: z.number().optional(),
        }),
    ),
    KEY_REPUTATION_THRESHOLD_CROSSED: event(
        'key:reputation:threshold:crossed',
        z.object({ id: z.string(), provider: z.string(), score: z.number() }),
    ),
    CHECK_HEALTH: event('key:health:check', z.string()),
    KEY_CHECK_HEALTH: event('key:health:check', z.string()),
    CHECK_ALL_HEALTH: event('key:health:check:all', z.void().or(z.undefined())),
    KEY_CHECK_ALL_HEALTH: event('key:health:check:all', z.void().or(z.undefined())),
    KEY_PROBE_RESULT: event(
        'key:probe:result',
        z.object({
            status: z.string(),
            provider: z.string(),
            keyId: z.string(),
            keyLabel: z.string(),
            model: z.string(),
            latency: z.number(),
            quotaRemaining: z.number().optional(),
            quotaLimit: z.number().optional(),
            rateLimited: z.boolean(),
            circuitOpen: z.boolean(),
            error: z.string().optional(),
            statusCode: z.number().optional(),
            timestamp: z.number(),
        }),
    ),
    PROVIDER_STATE_CHANGED: event(
        'provider:state:changed',
        z.object({ provider: z.string(), status: z.string() }),
    ),
    PROVIDER_CIRCUIT_BREAKER_SYNCED: event(
        'provider:circuit:breaker:synced',
        z.object({
            provider: z.string(),
            keyId: z.string(),
            status: z.string(),
            failureCount: z.number(),
            lastFailure: z.number(),
        }),
    ),
    PROVIDER_RATE_LIMIT_SYNCED: event(
        'provider:rate:limit:synced',
        z.object({
            provider: z.string(),
            keyId: z.string(),
            remaining: z.number(),
            resetAt: z.number(),
        }),
    ),
    PROVIDER_ERROR_SYNCED: event(
        'provider:error:synced',
        z.object({
            provider: z.string(),
            keyId: z.string(),
            error: z.string(),
            timestamp: z.number(),
            statusCode: z.number().optional(),
        }),
    ),
    KEY_ALERT_RESOLVED: event(
        'key:alert:resolved',
        z.object({
            alertId: z.string(),
            keyId: z.string(),
            type: z.string(),
            severity: z.string(),
            resolvedAt: z.number(),
        }),
    ),

    // ── Session / Binding ──────────────────────────────────────────────────
    SESSION_BINDING_EXPIRED: event(
        'session:binding:expired',
        z.object({
            sessionId: z.string(),
            keyId: z.string(),
            provider: z.string(),
            participantId: z.string().optional(),
            boundAt: z.number(),
            evictedAt: z.number(),
            reason: z.string(),
        }),
    ),

    // ── Chat Events ────────────────────────────────────────────────────────
    SEND_MESSAGE: event(
        'chat:send',
        z.object({
            provider: z.string(),
            model: z.string(),
            messages: z.array(z.unknown()),
            requestId: z.string().optional(),
            strategy: z.string().optional(),
            keyId: z.string().optional(),
            options: z.unknown().optional(),
        }),
    ),
    CHAT_SEND_MESSAGE: event(
        'chat:send',
        z.object({
            provider: z.string(),
            model: z.string(),
            messages: z.array(z.unknown()),
            requestId: z.string().optional(),
            strategy: z.string().optional(),
            keyId: z.string().optional(),
            options: z.unknown().optional(),
        }),
    ),
    CANCEL_MESSAGE: event('chat:cancel', z.object({ requestId: z.string() })),
    CHAT_CANCEL_MESSAGE: event('chat:cancel', z.object({ requestId: z.string() })),
    MESSAGE_RESPONSE: event('chat:response', ChatResponseSchema),
    CHAT_MESSAGE_RESPONSE: event('chat:response', ChatResponseSchema),
    SELECT_MODEL: event('chat:model:select', z.object({ provider: z.string(), model: z.string() })),
    CHAT_SELECT_MODEL: event(
        'chat:model:select',
        z.object({ provider: z.string(), model: z.string() }),
    ),
    START_CHAT_WITH_TARGET: event(
        'chat:target:start',
        z.object({ provider: z.string(), model: z.string(), keyId: z.string() }),
    ),
    CHAT_START_WITH_TARGET: event(
        'chat:target:start',
        z.object({ provider: z.string(), model: z.string(), keyId: z.string() }),
    ),
    STREAM_START: event(
        'chat:stream:start',
        z.object({
            requestId: z.string(),
            provider: z.string(),
            model: z.string(),
            keyId: z.string().optional(),
        }),
    ),
    CHAT_STREAM_START: event(
        'chat:stream:start',
        z.object({
            requestId: z.string(),
            provider: z.string(),
            model: z.string(),
            keyId: z.string().optional(),
        }),
    ),
    /**
     * @internal — decorative schema. Runtime validation is bypassed for HOT_EVENTS.
     * Producer side validates payload shape before emit. See chat-executor.ts:315,363
     */
    STREAM_CHUNK: event(
        'chat:stream:chunk',
        z.object({
            requestId: z.string(),
            provider: z.string(),
            chunk: z.string(),
            keyId: z.string().optional(),
        }),
    ),
    /**
     * @internal — decorative schema. Runtime validation bypassed for HOT_EVENTS.
     */
    CHAT_STREAM_CHUNK: event(
        'chat:stream:chunk',
        z.object({
            requestId: z.string(),
            provider: z.string(),
            chunk: z.string(),
            keyId: z.string().optional(),
        }),
    ),
    /**
     * @internal — decorative schema. Runtime validation bypassed for HOT_EVENTS.
     * Producer side validates payload shape before emit.
     */
    STREAM_END: event(
        'chat:stream:end',
        z.object({
            requestId: z.string(),
            fullContent: z.string(),
            latency: z.number(),
            tokens: z.number().optional(),
            provider: z.string().optional(),
            model: z.string().optional(),
            keyId: z.string().optional(),
            ttft: z.number().optional(),
            tps: z.number().optional(),
            status: z.enum(['timeout', 'done', 'cancelled', 'error']).optional(),
            finishReason: z.string().optional(),
            agentId: z.string().optional(),
            invocationId: z.string().optional(),
        }),
    ),
    CHAT_STREAM_END: event(
        'chat:stream:end',
        z.object({
            requestId: z.string(),
            fullContent: z.string(),
            latency: z.number(),
            tokens: z.number().optional(),
            provider: z.string().optional(),
            model: z.string().optional(),
            keyId: z.string().optional(),
            ttft: z.number().optional(),
            tps: z.number().optional(),
            status: z.enum(['timeout', 'done', 'cancelled', 'error']).optional(),
            finishReason: z.string().optional(),
            agentId: z.string().optional(),
            invocationId: z.string().optional(),
        }),
    ),
    STREAM_ERROR: event(
        'chat:stream:error',
        z.object({
            requestId: z.string(),
            provider: z.string(),
            error: z.string(),
            keyId: z.string().optional(),
        }),
    ),
    CHAT_STREAM_ERROR: event(
        'chat:stream:error',
        z.object({
            requestId: z.string(),
            provider: z.string(),
            error: z.string(),
            keyId: z.string().optional(),
        }),
    ),
    CHAT_SUMMARY_CREATED: event(
        'chat:summary:created',
        z.object({ sessionId: z.string(), messageCount: z.number(), keyFactsCount: z.number() }),
    ),

    // ── System Events ──────────────────────────────────────────────────────
    NAVIGATE: event('system:navigate', z.string()),
    SYSTEM_NAVIGATE: event('system:navigate', z.string()),
    NOTIFICATION: event(
        'system:notification',
        z.object({
            message: z.string(),
            type: z.enum(['success', 'error', 'info', 'warning']),
            source: z.string().optional(),
            savings: z
                .object({ latency: z.number().optional(), cost: z.number().optional() })
                .optional(),
        }),
    ),
    SYSTEM_NOTIFICATION: event(
        'system:notification',
        z.object({
            message: z.string(),
            type: z.enum(['success', 'error', 'info', 'warning']),
            source: z.string().optional(),
            savings: z
                .object({ latency: z.number().optional(), cost: z.number().optional() })
                .optional(),
        }),
    ),
    DECISION: event(
        'system:decision',
        z.object({
            requestId: z.string(),
            strategy: z.string(),
            classification: z
                .object({
                    complexity: z.enum(['simple', 'medium', 'complex']),
                    isCode: z.boolean(),
                    isLong: z.boolean(),
                    isMultimodal: z.boolean(),
                    intent: z.string().optional(),
                    language: z.string().optional(),
                })
                .optional(),
            weights: z.unknown(),
            selected: z.string(),
            secondBest: z.string().nullable(),
            scores: z.array(
                z.object({
                    p: z.string(),
                    s: z.string(),
                    c: z
                        .object({
                            raw: z.number(),
                            stabilityBonus: z.number(),
                            reputationBonus: z.number(),
                            explorationBonus: z.number(),
                            keyReputationBonus: z.number(),
                            affinityBonus: z.number(),
                            priorityBonus: z.number(),
                            costPenalty: z.number(),
                            latencyPenalty: z.number(),
                            budgetPenalty: z.number(),
                        })
                        .optional(),
                }),
            ),
            skipped: z
                .array(
                    z.object({
                        provider: z.string(),
                        keyLabel: z.string(),
                        keyId: z.string().optional(),
                        reason: z.string(),
                        stage: z.enum([
                            'status',
                            'policy',
                            'quota',
                            'score',
                            'budget',
                            'unavailable',
                            'circuit',
                            'ratelimit',
                            'backoff',
                            'normalization',
                            'exclusion',
                        ]),
                    }),
                )
                .optional(),
            timestamp: z.number(),
            profile: z.string().optional(),
            isExperiment: z.boolean().optional(),
        }),
    ),
    SYSTEM_DECISION: event(
        'system:decision',
        z.object({
            requestId: z.string(),
            strategy: z.string(),
            classification: z
                .object({
                    complexity: z.enum(['simple', 'medium', 'complex']),
                    isCode: z.boolean(),
                    isLong: z.boolean(),
                    isMultimodal: z.boolean(),
                    intent: z.string().optional(),
                    language: z.string().optional(),
                })
                .optional(),
            weights: z.unknown(),
            selected: z.string(),
            secondBest: z.string().nullable(),
            scores: z.array(
                z.object({
                    p: z.string(),
                    s: z.string(),
                    c: z
                        .object({
                            raw: z.number(),
                            stabilityBonus: z.number(),
                            reputationBonus: z.number(),
                            explorationBonus: z.number(),
                            keyReputationBonus: z.number(),
                            affinityBonus: z.number(),
                            priorityBonus: z.number(),
                            costPenalty: z.number(),
                            latencyPenalty: z.number(),
                            budgetPenalty: z.number(),
                        })
                        .optional(),
                }),
            ),
            skipped: z
                .array(
                    z.object({
                        provider: z.string(),
                        keyLabel: z.string(),
                        keyId: z.string().optional(),
                        reason: z.string(),
                        stage: z.enum([
                            'status',
                            'policy',
                            'quota',
                            'score',
                            'budget',
                            'unavailable',
                            'circuit',
                            'ratelimit',
                            'backoff',
                            'normalization',
                            'exclusion',
                        ]),
                    }),
                )
                .optional(),
            timestamp: z.number(),
            profile: z.string().optional(),
            isExperiment: z.boolean().optional(),
        }),
    ),
    KERNEL_UPDATED: event('kernel:updated', SystemStateSchema),
    KERNEL_HEARTBEAT: event(
        'kernel:heartbeat',
        z.object({ phase: z.string(), uptime: z.number() }),
    ),
    KERNEL_STATE_RESET: event('kernel:state:reset', z.object({ reason: z.string() })),
    RUNTIME_READY: event('system:runtime:ready', z.object({ timestamp: z.number() }).optional()),
    RUNTIME_FAILED: event(
        'system:runtime:failed',
        z.object({
            error: z.string(),
            phase: z.string().optional(),
            failedServices: z.array(z.string()).optional(),
        }),
    ),
    CLEAR_DATA: event('system:data:clear', z.void().or(z.undefined())),
    RELOAD: event('system:reload', z.object({ timestamp: z.number() })),
    SYSTEM_RELOAD: event('system:reload', z.object({ timestamp: z.number() })),
    KERNEL_LOAD_FAILED: event('kernel:load:failed', z.object({ error: z.string() })),
    KERNEL_PERSIST_FAILED: event('kernel:persist:failed', z.object({ error: z.string() })),
    SYSTEM_RUNTIME_METRICS: event('system:runtime:metrics', z.record(z.string(), z.unknown())),
    EVENTBUS_BACKPRESSURE: event(
        'system:eventbus:backpressure',
        z.object({ event: z.string(), depth: z.number(), pending: z.number() }),
    ),

    // ── Provider Runtime ──────────────────────────────────────────────────
    PROVIDER_RUNTIME_STATE: event(
        'provider:runtime:state',
        z.object({
            providers: z.array(z.unknown()),
            updatedAt: z.number(),
            totalActive: z.number(),
            totalDegraded: z.number(),
            totalOffline: z.number(),
            avgSuccessRate: z.number(),
        }),
    ),
    PROVIDER_RUNTIME_BUDGET: event('provider:runtime:budget', BudgetStateSnapshotSchema),

    // ── Debate Runtime Events ──────────────────────────────────────────────
    DEBATE_SESSION_CREATED: event(
        'debate:runtime:session:created',
        z.object({
            sessionId: z.string(),
            topic: z.string().optional().default(''),
            topologyType: z.string().optional().default('roundtable'),
        }),
    ),
    DEBATE_SESSION_STARTED: event(
        'debate:runtime:session:started',
        z.object({ sessionId: z.string() }),
    ),
    DEBATE_SESSION_PAUSED: event(
        'debate:runtime:session:paused',
        z.object({ sessionId: z.string() }),
    ),
    DEBATE_SESSION_RESUMED: event(
        'debate:runtime:session:resumed',
        z.object({ sessionId: z.string() }),
    ),
    DEBATE_SESSION_CANCELLED: event(
        'debate:runtime:session:cancelled',
        z.object({ sessionId: z.string() }),
    ),
    DEBATE_SESSION_COMPLETED: event(
        'debate:runtime:session:completed',
        z.object({ sessionId: z.string(), error: z.string().optional() }),
    ),
    DEBATE_SESSION_FAILED: event(
        'debate:runtime:session:failed',
        z.object({ sessionId: z.string(), error: z.string().optional() }),
    ),
    DEBATE_PHASE_CHANGED: event(
        'debate:runtime:phase:changed',
        z.object({ sessionId: z.string(), from: z.string(), to: z.string() }),
    ),
    DEBATE_BUDGET_EXCEEDED: event(
        'debate:runtime:budget:exceeded',
        z.object({
            sessionId: z.string(),
            reason: z.string(),
            limit: z.number(),
            used: z.number(),
        }),
    ),
    DEBATE_ROUND_STARTED: event(
        'debate:runtime:round:started',
        z.object({ sessionId: z.string(), round: z.number(), nodes: z.array(z.string()) }),
    ),
    DEBATE_ROUND_ENDED: event(
        'debate:runtime:round:ended',
        z.object({ sessionId: z.string(), round: z.number() }),
    ),
    DEBATE_ROUND_EARLY_EXIT: event(
        'debate:runtime:round:early:exit',
        z.object({ sessionId: z.string(), confidence: z.number(), round: z.number() }),
    ),
    DEBATE_AGENT_THINKING: event(
        'debate:runtime:agent:thinking',
        z.object({ sessionId: z.string(), agentId: z.string() }),
    ),
    DEBATE_AGENT_CHUNK: event(
        'debate:runtime:agent:chunk',
        z.object({ sessionId: z.string(), agentId: z.string(), chunk: z.string() }),
    ),
    DEBATE_AGENT_RESPONDED: event(
        'debate:runtime:agent:responded',
        z.object({ sessionId: z.string(), agentId: z.string(), content: z.string() }),
    ),
    DEBATE_AGENT_ERROR: event(
        'debate:runtime:agent:error',
        z.object({ sessionId: z.string(), agentId: z.string(), error: z.string() }),
    ),
    DEBATE_BUDGET_UPDATED: event(
        'debate:runtime:budget:updated',
        z.object({
            sessionId: z.string(),
            pressure: z.string(),
            used: z.number(),
            limit: z.number(),
        }),
    ),
    DEBATE_BUDGET_PRESSURE_CHANGED: event(
        'debate:runtime:budget:pressure',
        z.object({ sessionId: z.string(), level: z.string(), action: z.unknown() }),
    ),
    DEBATE_CONSENSUS_REACHED: event(
        'debate:runtime:consensus:reached',
        z.object({
            sessionId: z.string(),
            confidence: z.number(),
            agreements: z.number(),
            conflicts: z.number(),
        }),
    ),
    DEBATE_AGENT_TIMEOUT: event(
        'debate:runtime:agent:timeout',
        z.object({ sessionId: z.string(), agentId: z.string(), timeoutMs: z.number() }),
    ),
    DEBATE_AGENT_FALLBACK: event(
        'debate:runtime:agent:fallback',
        z.object({
            sessionId: z.string(),
            agentId: z.string(),
            fromProvider: z.string(),
            toProvider: z.string(),
        }),
    ),
    DEBATE_MEMORY_CLAIM: event(
        'debate:runtime:memory:claim',
        z.object({ sessionId: z.string(), agentId: z.string(), claim: z.string() }),
    ),
    DEBATE_AGENT_PHASE_CHANGED: event(
        'debate:runtime:agent:phase:changed',
        z.object({ sessionId: z.string(), agentId: z.string(), from: z.string(), to: z.string() }),
    ),
    DEBATE_AGENT_SCORED: event(
        'debate:runtime:agent:scored',
        z.object({
            sessionId: z.string(),
            agentId: z.string(),
            overall: z.number(),
            argumentQuality: z.number(),
            rebuttalStrength: z.number(),
            coherence: z.number(),
            persuasiveness: z.number(),
            factuality: z.number(),
        }),
    ),
    DEBATE_TRANSITION_INVALID: event(
        'debate:transition:invalid',
        z.object({ from: z.string(), to: z.string(), sessionId: z.string() }),
    ),
    // ── Observability Events ──────────────────────────────────────────────
    TIMELINE_EVENT_ADDED: event(
        'observability:timeline:event:added',
        z.object({
            eventId: z.string(),
            type: z.string(),
            category: z.string(),
            timestamp: z.number(),
            title: z.string(),
        }),
    ),
    TIMELINE_CLEARED: event(
        'observability:timeline:cleared',
        z.object({ count: z.number(), timestamp: z.number() }),
    ),
    METRICS_SNAPSHOT: event(
        'observability:metrics:snapshot',
        z.object({
            timestamp: z.number(),
            totalRequests: z.number(),
            totalTokens: z.number(),
            estimatedCost: z.number(),
            avgLatency: z.number(),
            successRate: z.number(),
        }),
    ),
    METRICS_ALERT: event(
        'observability:metrics:alert',
        z.object({
            id: z.string(),
            metric: z.string(),
            value: z.number(),
            severity: z.enum(['warning', 'critical']),
            timestamp: z.number(),
        }),
    ),
    METRICS_ALERT_RESOLVED: event(
        'observability:metrics:alert:resolved',
        z.object({ id: z.string(), timestamp: z.number() }),
    ),
    TRACE_UPDATED: event(
        'observability:trace:updated',
        z.object({ traceId: z.string(), status: z.string(), timestamp: z.number() }),
    ),
    SYSTEM_HEALTH_CHANGED: event(
        'observability:health:changed',
        z.object({ status: z.string(), score: z.number(), timestamp: z.number() }),
    ),
    ERROR_BOUNDARY_CAUGHT: event(
        'observability:error:boundary:caught',
        z.object({
            name: z.string().optional(),
            message: z.string(),
            componentStack: z.string().optional(),
            stack: z.string().optional(),
            timestamp: z.number(),
        }),
    ),

    // ── Cognitive Events ──────────────────────────────────────────────────
    /**
     * @internal — decorative schema. Runtime validation bypassed for HOT_EVENTS.
     * Producer side validates payload shape before emit. See cognitive-service.ts
     */
    COGNITIVE_TRACE_UPDATED: event(
        'cognitive:trace:updated',
        z.array(
            z.object({
                id: z.string(),
                startTime: z.number(),
                endTime: z.number().optional(),
                input: z.string(),
                output: z.string().optional(),
                status: z.string(),
                steps: z.array(z.unknown()),
                provider: z.string().optional(),
                model: z.string().optional(),
                totalTokens: z.number().optional(),
                latency: z.number().optional(),
                error: z.string().optional(),
            }),
        ),
    ),
    COGNITIVE_STEP_ACTIVE: event(
        'cognitive:step:active',
        z.object({
            nodeId: z.string(),
            traceId: z.string(),
            metadata: z.record(z.string(), z.unknown()).optional(),
        }),
    ),
    COGNITIVE_STEP_COMPLETED: event(
        'cognitive:step:completed',
        z.object({
            nodeId: z.string(),
            traceId: z.string(),
            status: z.enum(['done', 'error']),
            duration: z.number(),
            output: z.string(),
            fullContent: z.string().optional(),
            provider: z.string().optional(),
            model: z.string().optional(),
        }),
    ),
    COGNITIVE_DECISION_MADE: event('cognitive:decision:made', CognitiveDecisionSchema),
    REQUEST_INCOMING: event(
        'request:incoming',
        z.object({ requestId: z.string(), messages: z.array(AdapterMessageSchema) }),
    ),
    REQUEST_COMPLETED: event(
        'request:completed',
        z.object({ final_data: z.object({ traceId: z.string(), output: z.string() }) }),
    ),

    // ── Domain Events ─────────────────────────────────────────────────────
    DEBATE_UPDATED: event('debate:updated', z.unknown()),
    DEBATE_STARTED: event('debate:started', z.unknown()),
    DEBATE_ARGUMENT: event(
        'debate:argument',
        z.object({ sessionId: z.string(), argument: z.unknown() }),
    ),
    DEBATE_CONSENSUS: event(
        'debate:consensus',
        z.object({
            sessionId: z.string(),
            topic: z.string(),
            consensus: z.string(),
            convergenceScore: z.number(),
            synthesis: z
                .object({
                    consensus: z.string(),
                    coreDisagreement: z.string(),
                    resolvedPoints: z.array(z.string()),
                    unresolvedPoints: z.array(z.string()),
                    phase: z.string(),
                })
                .optional(),
        }),
    ),
    DEBATE_ENDED: event(
        'debate:ended',
        z.object({
            sessionId: z.string(),
            topic: z.string(),
            rounds: z.number(),
            durationMs: z.number(),
            consensus: z.string().optional(),
        }),
    ),
    DEBATE_FACT_CHECKED: event(
        'debate:fact:checked',
        z.object({ argumentId: z.string(), factCheck: z.unknown() }),
    ),
    DEBATE_VERDICT_GENERATED: event(
        'debate:verdict:generated',
        z.object({ sessionId: z.string(), verdict: z.unknown() }),
    ),
    DEBATE_SESSION_CONFLICT: event(
        'debate:session:conflict',
        z.object({
            sessionId: z.string(),
            currentVersion: z.number(),
            attemptedVersion: z.number(),
            tabId: z.string().optional(),
        }),
    ),
    MEMORY_UPDATED: event('memory:updated', z.array(MemoryEntrySchema)),
    TOOLS_UPDATED: event('tools:updated', z.array(ToolDefinitionSchema)),
    TOOL_EXECUTION_START: event(
        'tool:execution:start',
        z.object({ toolId: z.string(), input: z.unknown() }),
    ),
    TOOL_EXECUTION_SUCCESS: event(
        'tool:execution:success',
        z.object({ toolId: z.string(), output: z.unknown() }),
    ),
    TOOL_EXECUTION_ERROR: event(
        'tool:execution:error',
        z.object({ toolId: z.string(), error: z.string() }),
    ),
    ROLES_UPDATED: event('roles:updated', z.array(RoleSchema)),
    ROLE_ASSIGNED: event('role:assigned', z.object({ roleId: z.string(), agentId: z.string() })),
    ROLE_UNASSIGNED: event(
        'role:unassigned',
        z.object({ roleId: z.string(), agentId: z.string() }),
    ),
    MCP_UPDATED: event('mcp:updated', z.array(MCPServerConfigSchema)),
    SETTINGS_UPDATED: event(
        'settings:updated',
        z.object({
            settings: z.record(z.string(), z.unknown()),
            changes: z.record(z.string(), z.unknown()),
        }),
    ),
    SETTINGS_LATENCY_THRESHOLD: event(
        'settings:latency:threshold',
        z.object({ keyId: z.string().optional(), threshold: z.number().optional() }).optional(),
    ),
    POLICY_VIOLATION: event('policy:violation', PolicyViolationSchema),
    SKILLS_UPDATED: event('skills:updated', z.array(CognitiveSkillSchema)),
    PRICING_UPDATED: event('pricing:updated', z.unknown()),
    BUDGET_ALERT: event(
        'budget:alert',
        z.union([
            z.object({
                type: z.enum(['global', 'provider', 'agent']),
                level: z.number(),
                entity: z.string(),
                current: z.number(),
                limit: z.number(),
                message: z.string(),
                timestamp: z.number(),
            }),
            z.object({ type: z.literal('spend_updated'), summary: z.unknown() }),
        ]),
    ),
    KEYSTATE_UPDATED: event(
        'keystate:updated',
        z.object({ id: z.string(), state: z.record(z.string(), z.unknown()) }),
    ),
    KEYSTATE_REMOVED: event('keystate:removed', z.object({ id: z.string() })),
    SNAPSHOT_CAPTURED: event(
        'snapshot:captured',
        z.object({
            id: z.string(),
            traceId: z.string(),
            stepId: z.string(),
            timestamp: z.number(),
            label: z.string().optional(),
            tags: z.array(z.string()).optional(),
            runtime: z.unknown(),
            metadata: z.record(z.string(), z.unknown()).optional(),
        }),
    ),
    SNAPSHOT_RESTORED: event(
        'snapshot:restored',
        z.object({ snapshotId: z.string(), timestamp: z.number() }),
    ),
    AGENT_CONFIG_UPDATED: event(
        'agent:config:updated',
        z.object({ id: z.string(), config: z.unknown() }),
    ),
    AGENT_LIFECYCLE_CHANGE: event(
        'agent:lifecycle:change',
        z.object({
            id: z.string(),
            from: z.enum([
                'initializing',
                'ready',
                'busy',
                'idle',
                'paused',
                'degraded',
                'terminated',
            ]),
            to: z.enum([
                'initializing',
                'ready',
                'busy',
                'idle',
                'paused',
                'degraded',
                'terminated',
            ]),
        }),
    ),
    AGENT_HEALTH_CHANGE: event(
        'agent:health:change',
        z.object({
            id: z.string(),
            from: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
            to: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
            errorRate: z.number(),
            consecutiveErrors: z.number(),
        }),
    ),
    AGENT_RESTARTED: event('agent:restarted', z.object({ id: z.string() })),
    AGENT_RATE_LIMITED: event(
        'agent:rate:limited',
        z.object({
            nodeId: z.string(),
            label: z.string(),
            reason: z.string(),
            provider: z.string().optional(),
            retryAfterMs: z.number().optional(),
        }),
    ),
    AGENT_BLACKBOARD_UPDATED: event(
        'agent:blackboard:updated',
        z.object({ agentId: z.string(), key: z.string(), value: z.unknown() }),
    ),
    AGENT_HANDOFF_INITIATED: event(
        'agent:handoff:initiated',
        z.object({
            id: z.string(),
            fromAgent: z.string(),
            toAgent: z.string(),
            description: z.string().optional(),
            priority: z.string().optional(),
        }),
    ),
    ROUTER_SIGNAL: event(
        'router:signal',
        z.object({
            provider: z.string(),
            success: z.boolean(),
            wasRaceWinner: z.boolean(),
            wasFallback: z.boolean(),
            ttft: z.number().optional(),
        }),
    ),
    ADVISOR_SUGGESTION: event('advisor:suggestion', OptimizationSuggestionSchema),
    ADVISOR_SUGGESTION_EXECUTED: event(
        'advisor:suggestion:executed',
        z.object({
            id: z.string(),
            estimatedSavings: z
                .object({ latency: z.number().optional(), cost: z.number().optional() })
                .optional(),
        }),
    ),
    ADVISOR_SUGGESTION_DISMISSED: event(
        'advisor:suggestion:dismissed',
        z.object({ id: z.string() }),
    ),
    DIAGNOSTIC_COMPLETE: event(
        'diagnostic:complete',
        z.object({
            id: z.string(),
            scope: z.string(),
            health: z.string(),
            score: z.number(),
            issueCount: z.number(),
            timestamp: z.number(),
        }),
    ),
    SYSTEM_TOPOLOGY_MOUNTED: event('system:topology:mounted', z.object({ topologyId: z.string() })),
    SYSTEM_NODE_SPAWN: event(
        'system:node:spawn',
        z.object({ nodeId: z.string(), type: z.string() }),
    ),
    SYSTEM_NODE_REMOVED: event('system:node:removed', z.object({ id: z.string() })),
    VIRTUAL_KEY_CREATED: event('virtual:key:created', z.object({ virtualKey: z.unknown() })),
    VIRTUAL_KEY_RESOLVED: event('virtual:key:resolved', z.object({ virtualKeyId: z.string() })),
    VIRTUAL_KEY_REVOKED: event('virtual:key:revoked', z.object({ virtualKeyId: z.string() })),
    ELO_RATING_UPDATED: event(
        'elo:rating:updated',
        z.object({ agentId: z.string(), newRating: z.number(), change: z.number() }),
    ),
    CACHE_INVALIDATED: event(
        'cache:invalidated',
        z.object({ reason: z.string(), section: z.string().optional() }),
    ),
    SESSION_DELETED: event('session:deleted', z.object({ id: z.string(), type: z.string() })),

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
    CREW_STARTED: event(
        'crew:started',
        z.object({ crewId: z.string(), taskCount: z.number() }),
    ),
    CREW_COMPLETED: event(
        'crew:completed',
        z.object({ crewId: z.string(), taskCount: z.number() }),
    ),
    CREW_FAILED: event(
        'crew:failed',
        z.object({ crewId: z.string(), failedCount: z.number() }),
    ),
    CREW_ABORTED: event('crew:aborted', z.object({ crewId: z.string() })),
    CREW_DELETED: event('crew:deleted', z.object({ crewId: z.string() })),
    TASK_STARTED: event(
        'task:started',
        z.object({ crewId: z.string(), taskId: z.string(), assigneeId: z.string() }),
    ),
    TASK_COMPLETED: event(
        'task:completed',
        z.object({ crewId: z.string(), taskId: z.string() }),
    ),
    TASK_FAILED: event(
        'task:failed',
        z.object({ crewId: z.string(), taskId: z.string(), error: z.string() }),
    ),
    TASK_HITL: event(
        'task:hitl',
        z.object({ crewId: z.string(), taskId: z.string() }),
    ),
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
    COUNCIL_PHASE: event(
        'council:phase',
        z.object({ sessionId: z.string(), phase: z.string() }),
    ),
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
    GRAPH_STARTED: event(
        'graph:started',
        z.object({ runId: z.string(), graphId: z.string() }),
    ),
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
    GRAPH_REJECTED: event(
        'graph:rejected',
        z.object({ runId: z.string(), reason: z.string() }),
    ),
    GRAPH_COMPLETED: event(
        'graph:completed',
        z.object({ runId: z.string(), steps: z.number() }),
    ),
    GRAPH_FAILED: event(
        'graph:failed',
        z.object({ runId: z.string(), error: z.string() }),
    ),
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
    MEMORY_PROMOTED: event(
        'memory:promoted',
        z.object({ memoryId: z.string(), tier: z.string() }),
    ),
    MEMORY_FORGOTTEN: event('memory:forgotten', z.object({ memoryId: z.string() })),
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
    CONTEXT_SHARED: event(
        'context:shared',
        z.object({ contextId: z.string(), kind: z.string() }),
    ),
    GOAL_CREATED: event(
        'goal:created',
        z.object({ goalId: z.string(), ownerId: z.string(), level: z.string() }),
    ),
    GOAL_PROGRESS: event(
        'goal:progress',
        z.object({ goalId: z.string(), progress: z.number() }),
    ),
    GOAL_COMPLETED: event(
        'goal:completed',
        z.object({ goalId: z.string(), ownerId: z.string() }),
    ),

    // ── Ops / governance / mobile (Wave 5) ──
    OPS_AUDIT: event(
        'ops:audit',
        z.object({ seq: z.number(), actor: z.string(), action: z.string(), target: z.string() }),
    ),
    OPS_HIERARCHY: event(
        'ops:hierarchy',
        z.object({ nodeId: z.string(), action: z.string() }),
    ),
    OPS_BUDGET: event(
        'ops:budget',
        z.object({ nodeId: z.string(), spent: z.number() }),
    ),
    OPS_SANDBOX: event(
        'ops:sandbox',
        z.object({ ticketId: z.string(), status: z.string() }),
    ),
    OPS_MOBILE: event(
        'ops:mobile',
        z.object({ sessionId: z.string(), status: z.string() }),
    ),
    OPS_NOTIFY: event(
        'ops:notify',
        z.object({ notificationId: z.string(), actionRef: z.string() }),
    ),

    // ── Interop / federation / coordination (Phase A: Waves 6+7) ──
    INTEROP_AGENT: event(
        'interop:agent',
        z.object({ agentId: z.string(), action: z.string() }),
    ),
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
    MARKET_OPENED: event(
        'market:opened',
        z.object({ listingId: z.string(), mode: z.string() }),
    ),
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
    META_APPLIED: event(
        'meta:applied',
        z.object({ proposalId: z.string(), kind: z.string() }),
    ),
    META_EVOLVED: event('meta:evolved', z.object({ skillRef: z.string() })),
    META_HEALTH: event(
        'meta:health',
        z.object({ kind: z.string(), severity: z.number(), source: z.string() }),
    ),
    COG_WRITTEN: event(
        'cog:written',
        z.object({ memoryId: z.string(), kind: z.string(), scope: z.string() }),
    ),
    COG_GOVERNED: event(
        'cog:governed',
        z.object({ removed: z.number(), scope: z.string() }),
    ),
    COG_COUNTERFACTUAL: event(
        'cog:counterfactual',
        z.object({ recordId: z.string(), ownerId: z.string() }),
    ),
    COG_COMPILED: event(
        'cog:compiled',
        z.object({ packageId: z.string(), taskClass: z.string() }),
    ),

    // ── Trust & ecosystem (Phase C: Waves 10+11) ──
    TRUST_UPDATED: event(
        'trust:updated',
        z.object({ subject: z.string(), score: z.number() }),
    ),
    TRUST_POLICY: event(
        'trust:policy',
        z.object({ policyId: z.string(), effect: z.string() }),
    ),
    ECO_INSTALLED: event(
        'eco:installed',
        z.object({ bundleId: z.string(), items: z.number() }),
    ),
    ECO_SNAPSHOT: event(
        'eco:snapshot',
        z.object({ snapshotId: z.string(), tables: z.number() }),
    ),

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
    EVAL_REDTEAM: event(
        'eval:redteam',
        z.object({ target: z.string(), attacks: z.number() }),
    ),
    EVAL_ORG: event(
        'eval:org',
        z.object({ orgId: z.string(), action: z.string() }),
    ),
    EVAL_INTENT: event(
        'eval:intent',
        z.object({ intentId: z.string(), steps: z.number() }),
    ),

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
    LOOP_ITER: event(
        'loop:iter',
        z.object({ loopId: z.string(), iteration: z.number() }),
    ),
    GROUPCHAT_CREATED: event(
        'groupchat:created',
        z.object({ chatId: z.string(), members: z.number() }),
    ),
    GROUPCHAT_TURN: event(
        'groupchat:turn',
        z.object({ chatId: z.string(), speaker: z.string() }),
    ),
    GUARDRAIL_HIT: event(
        'guardrail:hit',
        z.object({ ruleId: z.string(), tripwire: z.string() }),
    ),
    BLOCK_SET: event(
        'block:set',
        z.object({ ownerId: z.string(), section: z.string() }),
    ),
    SOP_PHASE: event(
        'sop:phase',
        z.object({ loopId: z.string(), phase: z.string(), artifact: z.string(), role: z.string() }),
    ),
    QUEUE_ENQUEUED: event(
        'queue:enqueued',
        z.object({ runId: z.string(), kind: z.string() }),
    ),
    DYAD_DONE: event(
        'dyad:done',
        z.object({ loopId: z.string(), turns: z.number() }),
    ),

    // ── Rival parity 2 (Phase G: 10 more projects) ──
    REACT_STEP: event(
        'react:step',
        z.object({ runId: z.string(), step: z.number() }),
    ),
    RAG_ANSWERED: event(
        'rag:answered',
        z.object({ citations: z.number(), rounds: z.number() }),
    ),
    RUNTIME_STARTED: event('runtime:started', z.object({ runId: z.string() })),
    RUNTIME_ACTION: event(
        'runtime:action',
        z.object({ runId: z.string(), action: z.string() }),
    ),
    SWE_EDIT: event('swe:edit', z.object({ path: z.string() })),
    MODES_SWITCHED: event(
        'modes:switched',
        z.object({ modeId: z.string(), name: z.string() }),
    ),
    SMEM_ADDED: event(
        'smem:added',
        z.object({ memoryId: z.string(), scope: z.string() }),
    ),
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
    TYPED_VALID: event(
        'typed:valid',
        z.object({ agentId: z.string(), attempts: z.number() }),
    ),
    CODEPLAN_ROUND: event(
        'codeplan:round',
        z.object({ round: z.number(), calls: z.number() }),
    ),
    DIALOGUE_TURN: event(
        'dialogue:turn',
        z.object({ botId: z.string(), intent: z.string() }),
    ),
    BOTROUTE_NODE: event(
        'botroute:node',
        z.object({ nodeId: z.string(), hits: z.number() }),
    ),

    // ── Rival parity 4 (Phase I: fourth 10) ──
    COPILOT_TOPIC: event(
        'copilot:topic',
        z.object({ topicId: z.string(), score: z.number() }),
    ),
    BEDROCK_ACTION: event(
        'bedrock:action',
        z.object({ groupId: z.string(), tool: z.string() }),
    ),
    BEDROCK_GUARD: event(
        'bedrock:guard',
        z.object({ ok: z.boolean(), hits: z.number() }),
    ),
    CX_ROUTE: event(
        'cx:route',
        z.object({ flowId: z.string(), toPage: z.string() }),
    ),
    FORCE_RUN: event(
        'force:run',
        z.object({ topicId: z.string(), actions: z.number() }),
    ),
    KORE_INTERRUPT: event(
        'kore:interrupt',
        z.object({ dialogId: z.string(), intent: z.string() }),
    ),
    YELLOW_SENT: event(
        'yellow:sent',
        z.object({ campaignId: z.string(), delivered: z.number() }),
    ),
    LINDY_HIRED: event('lindy:hired', z.object({ employeeId: z.string() })),
    SMOL_STEP: event('smol:step', z.object({ tool: z.string() })),

    // ── Rival parity 5 (Phase J: fifth 10) ──
    APP_SCAFFOLD: event('app:scaffold', z.object({ files: z.number() })),
    ONTO_CREATED: event(
        'onto:created',
        z.object({ instanceId: z.string(), type: z.string() }),
    ),
    WORK_PUSHED: event('work:pushed', z.object({ itemId: z.string() })),
    COMPUTER_ACT: event(
        'computer:act',
        z.object({ ticketId: z.string(), action: z.string() }),
    ),
    COMPUTER_HANDOFF: event('computer:handoff', z.object({ action: z.string() })),
    SEARCH_FANOUT: event(
        'search:fanout',
        z.object({ providers: z.number(), hits: z.number() }),
    ),
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
        z.object({ total: z.number(), connected: z.number(), reconnected: z.number(), failed: z.number() }),
    ),
    MCP_HARNESS_PROXY: event(
        'mcp:harness:proxy',
        z.object({ serverId: z.string(), tool: z.string(), ok: z.boolean(), error: z.string().optional() }),
    ),
    EVAL_SCORER_REGISTERED: event(
        'eval:scorer:registered',
        z.object({ name: z.string() }),
    ),
    EVAL_JUDGE_DONE: event(
        'eval:judge:done',
        z.object({ task: z.string(), score: z.number(), via: z.enum(['stub','llm']) }),
    ),

    // ── Rival parity 6 (Phase K: sixth 10) ──
    N8N_RUN: event(
        'n8n:run',
        z.object({ workflowId: z.string(), execId: z.string() }),
    ),
    MAKE_RUN: event('make:run', z.object({ modules: z.number() })),
    ZAP_FIRED: event(
        'zap:fired',
        z.object({ zapId: z.string(), actions: z.number() }),
    ),
    TEMPORAL_STEP: event(
        'temporal:step',
        z.object({ runId: z.string(), step: z.string() }),
    ),
    TEMPORAL_SIGNAL: event(
        'temporal:signal',
        z.object({ runId: z.string(), key: z.string() }),
    ),
    TEMPORAL_PAUSED: event(
        'temporal:paused',
        z.object({ runId: z.string(), step: z.string() }),
    ),
    ASSET_BUILT: event(
        'asset:built',
        z.object({ asset: z.string(), count: z.number() }),
    ),
    SENSOR_OK: event(
        'sensor:ok',
        z.object({ tool: z.string(), attempts: z.number() }),
    ),
    VOICE_STARTED: event('voice:started', z.object({ callId: z.string() })),
    VOICE_ENDED: event(
        'voice:ended',
        z.object({ callId: z.string(), turns: z.number() }),
    ),
    SUPPORT_OPEN: event('support:open', z.object({ ticketId: z.string() })),
    SUPPORT_HANDOFF: event(
        'support:handoff',
        z.object({ ticketId: z.string(), team: z.string() }),
    ),

    // ── Debate plus (Phase L: seventh 10, debate focus) ──
    FORMAT_START: event(
        'format:start',
        z.object({ formatId: z.string(), topic: z.string() }),
    ),
    FORMAT_DONE: event(
        'format:done',
        z.object({ formatId: z.string(), winner: z.string() }),
    ),
    DUNG_ATTACK: event(
        'dung:attack',
        z.object({ from: z.string(), to: z.string() }),
    ),
    TOULMIN_CARD: event(
        'toulmin:card',
        z.object({ cardId: z.string(), completeness: z.number() }),
    ),
    BRIER_RESOLVED: event(
        'brier:resolved',
        z.object({ claimId: z.string(), brier: z.number() }),
    ),

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
    REFLEXION_TRIAL: event(
        'reflexion:trial',
        z.object({ trial: z.number(), ok: z.boolean() }),
    ),
    REFLEXION_DONE: event(
        'reflexion:done',
        z.object({ trials: z.number(), ok: z.boolean() }),
    ),
    TOT_LEVEL: event(
        'tot:level',
        z.object({ level: z.number(), kept: z.number() }),
    ),
    SELFCON_VOTE: event(
        'selfcon:vote',
        z.object({ paths: z.number(), confidence: z.number() }),
    ),
    SOAR_FIRED: event('soar:fired', z.object({ count: z.number() })),
    SOAR_IMPASSE: event('soar:impasse', z.object({ impasse: z.number() })),
    METER_ALERT: event(
        'meter:alert',
        z.object({ name: z.string(), value: z.number() }),
    ),
    ERR_CAPTURED: event('err:captured', z.object({ fingerprint: z.string() })),

    // ── Rival parity 9 (Phase N: hype — OpenClaw/DSH/CN/Manus/Genspark) ──
    CLAW_SOUL: event(
        'claw:soul',
        z.object({ personId: z.string(), name: z.string() }),
    ),
    CLAW_CRON: event('claw:cron', z.object({ count: z.number() })),
    DSH_PLUGIN: event(
        'dsh:plugin',
        z.object({ name: z.string(), enabled: z.boolean() }),
    ),
    MANUS_VERIFY: event(
        'manus:verify',
        z.object({ round: z.number(), pass: z.boolean() }),
    ),
    MANUS_EXPORT: event(
        'manus:export',
        z.object({ kind: z.string(), refId: z.string() }),
    ),
    GEN_FANOUT: event('gen:fanout', z.object({ providers: z.number() })),
    GEN_SHEETS: event(
        'gen:sheets',
        z.object({ rows: z.number(), cols: z.number() }),
    ),
    GEN_LONGTASK: event(
        'gen:longtask',
        z.object({ kind: z.string(), refId: z.string(), status: z.string() }),
    ),

    // ── Rival parity 10 (Phase P: Google + Chat Studio) ──
    A2ASPEC_CARD: event('a2aspec:card', z.object({ agentId: z.string() })),
    A2ASPEC_TASK: event(
        'a2aspec:task',
        z.object({ taskId: z.string(), state: z.string() }),
    ),
    CACHE_SAVED: event(
        'cache:saved',
        z.object({ cacheId: z.string(), bytes: z.number() }),
    ),
    NOTEBOOK_AUDIO: event(
        'notebook:audio',
        z.object({ notebookId: z.string(), chars: z.number() }),
    ),
    LIVE_BARGE: event(
        'live:barge',
        z.object({ sessionId: z.string(), interruptions: z.number() }),
    ),
    LIVE_TOOL: event(
        'live:tool',
        z.object({ sessionId: z.string(), tool: z.string() }),
    ),
    DEEPRES_STEP: event('deepres:step', z.object({ step: z.string() })),
    STUDIO_PACK: event(
        'studio:pack',
        z.object({ kind: z.string(), ref: z.string() }),
    ),

    // ── Rival parity 11 (Phase Q: viz + light sims, the last 9 to 100) ──
    NETLOGO_TICK: event(
        'netlogo:tick',
        z.object({ worldId: z.string(), ticks: z.number() }),
    ),
    MESA_STEP: event(
        'mesa:step',
        z.object({ modelId: z.string(), steps: z.number() }),
    ),
    BONSAI_TRAINED: event(
        'bonsai:trained',
        z.object({ lessonId: z.string(), reward: z.number() }),
    ),
    CHAINLIT_STEP: event(
        'chainlit:step',
        z.object({ stepId: z.string(), runId: z.string() }),
    ),
    MALMO_GOAL: event(
        'malmo:goal',
        z.object({ missionId: z.string(), agent: z.string() }),
    ),

    // ── Rival parity 12 (Phase R: exotic/research) ──
    CONSTIT_CRITIQUE: event('constit:critique', z.object({ violations: z.number() })),
    CONSTIT_REVISE: event('constit:revise', z.object({ ok: z.boolean() })),
    VOYAGER_SKILL: event('voyager:skill', z.object({ name: z.string() })),
    VOYAGER_STEP: event('voyager:step', z.object({ ok: z.boolean() })),

    // ── Rival RU (Phase U: Russian school + market) ──
    METABOLIC_TICK: event('metabolic:tick', z.object({ dominant: z.string(), level: z.string() })),
    MAESTRO_ORCHESTRATE: event('maestro:orchestrate', z.object({ ecoId: z.string(), role: z.string() })),
    LOCALTRIPLE_RUN: event('localtriple:run', z.object({ ok: z.boolean() })),
    RUSLAN_LEARN: event('ruslan:learn', z.object({ skill: z.string() })),
    EVOLAB_RUN: event('evolab:run', z.object({ pattern: z.string(), score: z.number() })),
    GIGASTUDIO_GEN: event('gigastudio:gen', z.object({ files: z.number() })),

    // ── Deploy bundle (Phase 57: G4) ──
    DEPLOY_BUNDLE_CREATED: event(
        'deploy:bundle:created',
        z.object({ bundleId: z.string(), configId: z.string(), target: z.string() }),
    ),
    SIM_WORLD_CREATED: event('sim:world:created', z.object({ worldId: z.string(), name: z.string() })),
    SIM_TICK: event('sim:tick', z.object({ worldId: z.string(), tick: z.number() })),
    SIM_COMPLETED: event('sim:completed', z.object({ worldId: z.string(), ticks: z.number() })),

    // ── Rival synth (Phase V: MIT/Sakana etc.) ──
    LATENT_SYNTH: event('latent:synth', z.object({ agents: z.number() })),

    // ── Projects (roadmapp.md) ──
    PROJECT_CREATED: event(
        'project:created',
        z.object({ projectId: z.string(), name: z.string(), type: z.string() }),
    ),
    PROJECT_UPDATED: event(
        'project:updated',
        z.object({ projectId: z.string() }),
    ),
    PROJECT_DELETED: event(
        'project:deleted',
        z.object({ projectId: z.string() }),
    ),
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
        z.object({ projectId: z.string(), runId: z.string(), taskId: z.string(), agentId: z.string() }),
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
    WORKSPACE_INITIALIZED: event(
        'workspace:initialized',
        z.object({ projectId: z.string() }),
    ),
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
        z.object({ projectId: z.string(), score: z.number(), passed: z.boolean(), issueCount: z.number() }),
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

    // ── Python Runtime (roadmapp.md §P7) ──
    PYTHON_RUN_STARTED: event(
        'python:run:started',
        z.object({ projectId: z.string(), runId: z.string(), command: z.string() }),
    ),
    PYTHON_RUN_COMPLETED: event(
        'python:run:completed',
        z.object({ projectId: z.string(), runId: z.string(), exitCode: z.number().nullable(), durationMs: z.number() }),
    ),
    PYTHON_REQUIREMENT_ADDED: event(
        'python:requirement:added',
        z.object({ projectId: z.string(), requirement: z.string() }),
    ),

    // ── Artifacts (roadmapp.md §P11) ──
    ARTIFACT_CREATED: event(
        'artifact:created',
        z.object({ projectId: z.string(), artifactId: z.string(), type: z.string(), name: z.string() }),
    ),
    ARTIFACT_BUILD_COMPLETED: event(
        'artifact:build:completed',
        z.object({ projectId: z.string(), artifactId: z.string(), success: z.boolean(), durationMs: z.number() }),
    ),
    SNAPSHOT_CREATED: event(
        'snapshot:created',
        z.object({ projectId: z.string(), snapshotId: z.string(), fileCount: z.number() }),
    ),
    PROJECT_EXPORTED: event(
        'project:exported',
        z.object({ projectId: z.string(), fileCount: z.number() }),
    ),
    PROJECT_IMPORTED: event(
        'project:imported',
        z.object({ projectId: z.string(), fileCount: z.number() }),
    ),

    // ── Templates (roadmapp.md §P12) ──
    TEMPLATE_APPLIED: event(
        'template:applied',
        z.object({ projectId: z.string(), templateId: z.string(), fileCount: z.number() }),
    ),

    // ── Debate Integration (roadmapp.md §P13) ──
    PROJECT_DEBATE_STARTED: event(
        'project:debate:started',
        z.object({ projectId: z.string(), debateId: z.string(), decision: z.string(), trigger: z.string() }),
    ),
    PROJECT_DEBATE_VERDICT: event(
        'project:debate:verdict',
        z.object({ projectId: z.string(), debateId: z.string(), confidence: z.number() }),
    ),

    // ── Advanced Autonomy (roadmapp.md §P14) ──
    AUTONOMY_GOAL_CREATED: event(
        'autonomy:goal:created',
        z.object({ projectId: z.string(), goalId: z.string(), description: z.string() }),
    ),
    AUTONOMY_PHASE_ADVANCED: event(
        'autonomy:phase:advanced',
        z.object({ goalId: z.string(), fromPhase: z.string(), toPhase: z.string() }),
    ),
    AUTONOMY_TASK_COMPLETED: event(
        'autonomy:task:completed',
        z.object({ goalId: z.string(), taskId: z.string(), result: z.string() }),
    ),
    AUTONOMY_GOAL_COMPLETED: event(
        'autonomy:goal:completed',
        z.object({ goalId: z.string(), projectId: z.string(), durationMs: z.number() }),
    ),
    AUTONOMY_GOAL_FAILED: event(
        'autonomy:goal:failed',
        z.object({ goalId: z.string(), projectId: z.string(), reason: z.string() }),
    ),

    // ── Project Observability (roadmapp.md §P8) ──
    PROJECT_ACTIVITY_LOGGED: event(
        'project:activity:logged',
        z.object({ projectId: z.string(), type: z.string(), agentId: z.string() }),
    ),
    PROJECT_ERROR_LOGGED: event(
        'project:error:logged',
        z.object({ projectId: z.string(), source: z.string(), severity: z.string(), message: z.string() }),
    ),

    // ── Agent Channels (mIRC-like) ──
    CHANNEL_CREATED: event(
        'channel:created',
        z.object({ channelId: z.string(), name: z.string() }),
    ),
    CHANNEL_MESSAGE: event(
        'channel:message',
        z.object({
            channelId: z.string(),
            messageId: z.string(),
            authorId: z.string(),
            kind: z.string(),
            content: z.string(),
            mentions: z.array(z.string()).optional(),
        }),
    ),
    CHANNEL_AGENT_JOINED: event(
        'channel:agent:joined',
        z.object({ channelId: z.string(), agentId: z.string(), displayName: z.string() }),
    ),
    CHANNEL_AGENT_LEFT: event(
        'channel:agent:left',
        z.object({ channelId: z.string(), agentId: z.string() }),
    ),
    CHANNEL_ARCHIVED: event(
        'channel:archived',
        z.object({ channelId: z.string() }),
    ),

    // ── Agent Management (AGEMS port) ──
    AGENT_CREATED: event(
        'agent:created',
        z.object({ agentId: z.string(), slug: z.string(), type: z.string() }),
    ),
    AGENT_UPDATED: event(
        'agent:updated',
        z.object({ agentId: z.string() }),
    ),
    AGENT_DELETED: event(
        'agent:deleted',
        z.object({ agentId: z.string() }),
    ),
    AGENT_STATUS_CHANGED: event(
        'agent:status-changed',
        z.object({ agentId: z.string(), from: z.string(), to: z.string() }),
    ),
    AGENT_EXECUTION_STARTED: event(
        'agent:execution:started',
        z.object({ agentId: z.string(), executionId: z.string() }),
    ),
    AGENT_EXECUTION_COMPLETED: event(
        'agent:execution:completed',
        z.object({ agentId: z.string(), executionId: z.string(), status: z.string() }),
    ),
    AGENT_CONFIG_ROLLBACK: event(
        'agent:config:rollback',
        z.object({ agentId: z.string(), revisionId: z.string() }),
    ),

    // ── Task Triggers (AGEMS port, Phase 2.8) ──
    TASK_TRIGGER_CREATED: event(
        'task:trigger:created',
        z.object({ triggerId: z.string(), taskId: z.string() }),
    ),
    TASK_TRIGGER_UPDATED: event(
        'task:trigger:updated',
        z.object({ triggerId: z.string() }),
    ),
    TASK_TRIGGER_DELETED: event(
        'task:trigger:deleted',
        z.object({ triggerId: z.string() }),
    ),
    TASK_TRIGGER_FIRED: event(
        'task:trigger:fired',
        z.object({ triggerId: z.string(), taskId: z.string() }),
    ),

    // ── Approval Workflow (AGEMS port, Phase 3) ──
    APPROVAL_REQUEST_SUBMITTED: event(
        'approval:request:submitted',
        z.object({ requestId: z.string(), agentId: z.string(), toolName: z.string(), category: z.string(), riskLevel: z.string() }),
    ),
    APPROVAL_REQUEST_APPROVED: event(
        'approval:request:approved',
        z.object({ requestId: z.string(), resolvedBy: z.string() }),
    ),
    APPROVAL_REQUEST_REJECTED: event(
        'approval:request:rejected',
        z.object({ requestId: z.string(), resolvedBy: z.string(), reason: z.string().optional() }),
    ),
    APPROVAL_REQUEST_EXPIRED: event(
        'approval:request:expired',
        z.object({ requestId: z.string() }),
    ),
    APPROVAL_BULK_RESOLVED: event(
        'approval:bulk:resolved',
        z.object({ ids: z.array(z.string()), action: z.string(), resolvedBy: z.string() }),
    ),
} as const;

type Registry = typeof EVENT_REGISTRY;

// ── Derived: EVENTS (runtime string constants) ────────────────────────────
type EventsType = { [K in keyof Registry]: Registry[K]['name'] & string };

function buildEvents(): EventsType {
    const result: Record<string, string> = {};
    for (const key of Object.keys(EVENT_REGISTRY) as Array<keyof Registry>) {
        result[key as string] = EVENT_REGISTRY[key].name;
    }
    Object.freeze(result);
    return result as unknown as EventsType;
}

export const EVENTS: EventsType = buildEvents();

// ── Derived: EventMap (type-level: event name → payload type) ─────────────
export type EventMap = {
    [K in keyof Registry as Registry[K]['name']]: z.infer<Registry[K]['schema']>;
} & { '*': { event: string; data: Record<string, unknown> } };

// ── Derived: EventValidators (runtime Zod schema lookup) ──────────────────
type EventValidatorsType = Record<string, z.ZodType<unknown>>;

function buildValidators(): EventValidatorsType {
    const result: EventValidatorsType = {};
    for (const key of Object.keys(EVENT_REGISTRY) as Array<keyof Registry>) {
        const entry = EVENT_REGISTRY[key];
        result[entry.name] = entry.schema;
    }
    return result;
}

export const EventValidators: EventValidatorsType = buildValidators();
