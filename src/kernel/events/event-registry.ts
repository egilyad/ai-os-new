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
