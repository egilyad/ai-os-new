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
} from '../../types/schema-types';
function event<N extends string, S extends z.ZodType>(name: N, schema: S) {
    return { name, schema } as const;
}
export const EVENT_REGISTRY_GROUP_1 = {
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
    // SPEC_01: passphrase-vault жизненный цикл
    KEY_VAULT_CREATED: event('key:vault:created', z.object({})),
    KEY_VAULT_UNLOCKED: event('key:vault:unlocked', z.object({})),
    KEY_VAULT_LOCKED: event('key:vault:locked', z.object({})),
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
    QUOTA_BREACH: event(
        'quota:breached',
        z.object({
            keyId: z.string(),
            used: z.number(),
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
            sessionId: z.string().optional(),
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
            model: z.string().optional(),
            error: z.string(),
            keyId: z.string().optional(),
        }),
    ),
    CHAT_STREAM_ERROR: event(
        'chat:stream:error',
        z.object({
            requestId: z.string(),
            provider: z.string(),
            model: z.string().optional(),
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
    // 5.1: WIRE ENCODING — intentionally NOT RouterDecision-shaped.
    // scores use compact {p, s, c} (provider, score.toFixed(3) STRING,
    // components) to keep bus payloads small. Consumers must read p/s/c,
    // never RouterDecision's {provider, score: number}. The SYSTEM_DECISION
    // alias below MUST stay structurally identical (drift test enforces).
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
    PERMISSION_DECIDED: event(
        'permission:decided',
        z.object({
            agentId: z.string(),
            action: z.string(),
            resource: z.string(),
            effect: z.enum(['allow', 'deny', 'ask']),
            escalated: z.boolean().optional(),
            reason: z.string().optional(),
        }),
    ),
    PERMISSION_UPDATED: event(
        'permission:updated',
        z.object({ agentId: z.string(), mode: z.string().optional() }),
    ),
    TOOL_PIPELINE_BLOCKED: event(
        'tool:pipeline:blocked',
        z.object({
            toolId: z.string(),
            agentId: z.string().optional(),
            reason: z.string(),
            phase: z.enum(['pre', 'post']),
        }),
    ),
    /** HITL: a tool call needs a human decision. The UI renders a dialog. */
    TOOL_APPROVAL_REQUESTED: event(
        'tool:approval:requested',
        z.object({
            id: z.string(),
            toolId: z.string(),
            agentId: z.string().optional(),
            action: z.string().optional(),
            resource: z.string().optional(),
            reason: z.string(),
            input: z.unknown().optional(),
            createdAt: z.number(),
            expiresAt: z.number(),
        }),
    ),
    TOOL_APPROVAL_RESOLVED: event(
        'tool:approval:resolved',
        z.object({
            id: z.string(),
            toolId: z.string(),
            agentId: z.string().optional(),
            decision: z.enum(['allow', 'deny']),
        }),
    ),
    /** A tool call inside a chat turn — the UI shows the progress. */
    CHAT_TOOL_CALL: event(
        'chat:tool:call',
        z.object({
            requestId: z.string(),
            agentId: z.string(),
            tool: z.string(),
            args: z.unknown().optional(),
            status: z.enum(['started', 'done', 'error']),
            output: z.string().optional(),
            error: z.string().optional(),
        }),
    ),
    /** The assistant asks the UI to open a route. */
    ASSISTANT_NAVIGATION: event(
        'assistant:navigation',
        z.object({
            id: z.string(),
            route: z.string(),
            reason: z.string(),
            params: z.record(z.string(), z.unknown()).optional(),
        }),
    ),
    ASSISTANT_NAVIGATION_RESOLVED: event(
        'assistant:navigation:resolved',
        z.object({
            id: z.string(),
            route: z.string(),
            confirmed: z.boolean(),
        }),
    ),
    /** The assistant streams its answer. */
    ASSISTANT_CHUNK: event(
        'assistant:chunk',
        z.object({
            requestId: z.string(),
            chunk: z.string(),
        }),
    ),
    /** The assistant used an action. */
    ASSISTANT_TOOL_CALL: event(
        'assistant:tool:call',
        z.object({
            requestId: z.string(),
            action: z.string(),
            group: z.string(),
            args: z.unknown().optional(),
            status: z.enum(['started', 'done', 'error', 'denied']),
            detail: z.string().optional(),
        }),
    ),
    ASSISTANT_DONE: event(
        'assistant:done',
        z.object({
            requestId: z.string(),
            content: z.string(),
            toolCalls: z.array(z.string()),
            rounds: z.number(),
            cancelled: z.boolean().optional(),
        }),
    ),
    /** A capability changed its trust level. */
    CAPABILITY_TRUST_CHANGED: event(
        'capability:trust:changed',
        z.object({
            id: z.string(),
            kind: z.string(),
            trust: z.string(),
            stale: z.boolean(),
        }),
    ),
    CAPABILITY_TRUST_SEEDED: event(
        'capability:trust:seeded',
        z.object({ added: z.number(), total: z.number() }),
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
    CLAUDECODE_EXEC: event('claudecode:exec', z.object({ planId: z.string() })),
    AGENT_CREATED: event('agent:created', z.object({ agentId: z.string() })),
    AGENT_EXECUTED: event('agent:executed', z.object({ agentId: z.string() })),
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
    TASK_CREATED: event(
        'task:created',
        z.object({
            taskId: z.string(),
            title: z.string(),
            creatorId: z.string().optional(),
            assigneeId: z.string().optional(),
            projectId: z.string().optional(),
        }),
    ),
    TASK_STATUS_CHANGED: event(
        'task:status:changed',
        z.object({
            taskId: z.string(),
            from: z.string(),
            to: z.string(),
            actorId: z.string().optional(),
            reason: z.string().optional(),
        }),
    ),
    TASK_CLAIMED: event(
        'task:claimed',
        z.object({ taskId: z.string(), workerId: z.string(), ttlMs: z.number() }),
    ),
    TASK_RELEASED: event('task:released', z.object({ taskId: z.string(), workerId: z.string() })),
    TASK_REQUEUED: event(
        'task:requeued',
        z.object({
            taskId: z.string(),
            reason: z.enum(['lock-expired', 'manual', 'retry']),
        }),
    ),
    TASK_DELETED: event('task:deleted', z.object({ taskId: z.string() })),
    TASK_WORK_PRODUCT_ADDED: event(
        'task:work-product:added',
        z.object({
            taskId: z.string(),
            workProductId: z.number(),
            fileName: z.string(),
            mimeType: z.string().optional(),
            size: z.number().optional(),
        }),
    ),
    TASK_TRIGGER_FIRED: event(
        'task:trigger:fired',
        z.object({
            taskId: z.string(),
            status: z.string(),
            action: z.string(),
            target: z.string().optional(),
        }),
    ),
} as const;
