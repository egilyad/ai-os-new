import { z } from 'zod';

export const RotationConfigSchema = z.object({
    ttlHours: z.number().min(0),
    autoRotate: z.boolean(),
    notifyBefore: z.string().default('24,1'),
    lastRotated: z.string().optional(),
    expiresAt: z.string().optional(),
});

export const KeyHistoryEntrySchema = z.object({
    id: z.string(),
    timestamp: z.number(),
    action: z.enum([
        'added',
        'probed',
        'quota_exceeded',
        'error',
        'rotated',
        'status_changed',
        'latency_burst',
        'reputation_changed',
        'note_added',
    ]),
    detail: z.string(),
});

export const RotationEventSchema = z.object({
    id: z.string(),
    keyId: z.string(),
    timestamp: z.number(),
    type: z.enum(['manual', 'auto', 'ttl_expired']),
    fromStatus: z.string(),
    toStatus: z.string(),
    oldKeyRef: z.string().optional(),
    newKeyRef: z.string().optional(),
    result: z.enum(['success', 'failed']),
    error: z.string().optional(),
});

export const KeyNoteSchema = z.object({
    id: z.string(),
    keyId: z.string(),
    type: z.enum(['admin', 'system', 'ai']),
    text: z.string(),
    timestamp: z.number(),
    author: z.string().optional(),
});

export const KeyExtendedStatsSchema = z
    .object({
        coldStartLatency: z.number(),
        warmStartLatency: z.number(),
        stabilityIndex: z.number(),
        retryImpactScore: z.number(),
        rateLimitPressure: z.number(),
        keyAgeScore: z.number(),
        estimatedCost: z.number(),
        tokenEfficiency: z.number(),
        contextUtilization: z.number(),
        reputationScore: z.number(),
        stabilityForecast: z.enum(['improving', 'stable', 'degrading']),
        currentConcurrentRequests: z.number(),
        usageToday: z.object({
            tokens: z.number(),
            weightedTokens: z.number(),
            requests: z.number(),
            estimatedCost: z.number(),
        }),
        usageMonthly: z.object({
            tokens: z.number(),
            requests: z.number(),
            estimatedCost: z.number(),
        }),
        throughputHistory: z.array(
            z.object({
                timestamp: z.number(),
                latency: z.number(),
                tokens: z.number(),
                tps: z.number().optional(),
            }),
        ),
    })
    .partial()
    .passthrough();

export const ApiKeyStatsSchema = z.object({
    successCount: z.number(),
    errorCount: z.number(),
    totalTokens: z.number(),
    avgLatency: z.number(),
    minLatency: z.number(),
    maxLatency: z.number(),
    lastModel: z.string().optional(),
    lastError: z.object({ message: z.string(), timestamp: z.string() }).optional(),
    extended: KeyExtendedStatsSchema.optional(),
});

export const ApiKeySchema = z.object({
    id: z.string(),
    provider: z.string(),
    key: z.string(),
    group: z.string().optional(),
    account: z.string().optional(),
    accountId: z.string().optional(),
    label: z.string(),
    model: z.string().optional(),
    status: z.enum([
        'active',
        'checking',
        'error',
        'inactive',
        'pending',
        'quota_exhausted',
        'invalid',
        'duplicate',
        'quarantined',
        'probation',
        'compromised',
    ]),
    availableModels: z.array(z.string()).optional(),
    stats: ApiKeyStatsSchema,
    latency: z.number().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    isEncrypted: z.boolean().optional(),
    fingerprint: z.string().optional(),
    secretRef: z.string().optional(),
    tags: z.array(z.string()).optional(),
    history: z.array(KeyHistoryEntrySchema).optional(),
    notes: z.array(KeyNoteSchema).optional(),
    rotationConfig: RotationConfigSchema.optional(),
    rotationHistory: z.array(RotationEventSchema).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
    alerts: z.array(z.string()).optional(),
    quota: z.record(z.string(), z.unknown()).optional(),
    priority: z.number().optional(),
    expiresAt: z.number().optional(),
    createdAt: z.number().optional(),
    lastUsed: z.number().nullable().optional(),
    maxBudget: z.number().nullable().optional(),
    monthlySpend: z.number().optional(),
});

export const SystemStateSchema = z.record(z.string(), z.unknown());

export const ChatResponseSchema = z.object({
    id: z.string(),
    requestId: z.string(),
    provider: z.string(),
    model: z.string(),
    keyId: z.string().optional(),
    content: z.string(),
    latency: z.number(),
    status: z.enum([
        'loading',
        'done',
        'error',
        'cancelled',
        'streaming',
        'queued',
        'timeout',
        'cached',
    ]),
    error: z.string().optional(),
    tokens: z.number().optional(),
    ttft: z.number().optional(),
    tps: z.number().optional(),
    cost: z.number().optional(),
    strategy: z
        .enum(['auto', 'broadcast', 'race', 'performance', 'cost', 'latency', 'manual'])
        .optional(),
    finishReason: z.string().optional(),
    timestamp: z.number().optional(),
});

const ChatHistoryEntrySchema = z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    text: z
        .string()
        .optional()
        .default(() => ''),
    responses: z.array(ChatResponseSchema).optional().default([]),
    timestamp: z
        .number()
        .optional()
        .default(() => Date.now()),
    requestId: z.string().optional(),
    parentId: z.string().optional(),
    recalledMemories: z
        .array(z.object({ content: z.string(), score: z.number().optional() }))
        .optional(),
});

export const ChatSessionSchema = z.object({
    id: z.string(),
    title: z.string(),
    history: z.array(ChatHistoryEntrySchema),
    createdAt: z.number(),
    updatedAt: z.number(),
    version: z.number().int().min(0).optional().default(0),
    tags: z.array(z.string()).optional(),
    folder: z.string().optional(),
    isArchived: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    summary: z.string().optional(),
    linkedDebateId: z.string().optional(),
    currentProvider: z.string().optional(),
    currentModel: z.string().optional(),
    currentKeyId: z.string().optional(),
});

export const ToolCallSchema = z.object({
    id: z.string(),
    type: z.literal('function'),
    function: z.object({
        name: z.string(),
        arguments: z.string(),
    }),
});

export const AdapterMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    content: z.string(),
    name: z.string().optional(),
    toolCallId: z.string().optional(),
    toolCalls: z.array(ToolCallSchema).optional(),
});

export const MemoryEntrySchema = z.object({
    id: z.string(),
    content: z.string(),
    metadata: z.object({
        source: z.string(),
        type: z.string(),
        collection: z.enum(['long_term', 'ephemeral', 'rag_sources']).optional(),
        timestamp: z.number(),
        importance: z.number(),
        chatId: z.string().optional(),
        requestId: z.string().optional(),
        agentId: z.string().optional(),
        roleId: z.string().optional(),
        tags: z
            .object({
                labels: z.array(z.string()),
                category: z.string().optional(),
                domain: z.string().optional(),
            })
            .optional(),
        vectorData: z
            .object({
                dimensions: z.number().optional(),
            })
            .optional(),
        relations: z
            .array(
                z.object({
                    targetId: z.string(),
                    type: z.enum(['similar', 'causal', 'sequential', 'derived', 'reference']),
                    weight: z.number(),
                }),
            )
            .optional(),
        importanceLabel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        tokenCount: z.number().optional(),
        ttl: z.number().optional(),
        accessCount: z.number().optional(),
        lastAccessed: z.number().optional(),
        sessionId: z.string().optional(),
        parentId: z.string().optional(),
        childrenIds: z.array(z.string()).optional(),
    }),
    embedding: z.array(z.number()).optional(),
    vector: z.array(z.number()).optional(),
    score: z.number().optional(),
});

export const MemoryStatsSchema = z.object({
    totalEntries: z.number(),
    totalTokens: z.number(),
    uniqueSources: z.number(),
    byType: z.record(z.string(), z.number()),
    byImportance: z.record(z.string(), z.number()),
    avgImportance: z.number(),
    oldestEntry: z.number(),
    newestEntry: z.number(),
    totalStorageBytes: z.number(),
    lastPruned: z.number().nullable(),
});

const CognitiveStepSchema = z.object({
    id: z.string(),
    nodeId: z.string().optional(),
    type: z.enum(['routing', 'retrieval', 'reasoning', 'action', 'verification']),
    label: z.string(),
    status: z.enum(['pending', 'active', 'done', 'error']),
    timestamp: z.number(),
    duration: z.number().optional(),
    decision: z.record(z.string(), z.unknown()).optional(),
    thoughts: z.array(z.string()).optional(),
    observations: z.string().optional(),
    tools_used: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CognitiveTraceSchema = z.object({
    id: z.string(),
    traceId: z.string(),
    startTime: z.number(),
    endTime: z.number().optional(),
    input: z.string(),
    output: z.string().optional(),
    status: z.enum(['running', 'completed', 'failed']),
    steps: z.array(CognitiveStepSchema),
    decisionGraph: z.object({
        nodes: z.array(z.string()),
        edges: z.array(
            z.object({
                from: z.string(),
                to: z.string(),
                type: z.enum(['causal', 'data']),
            }),
        ),
    }),
    totalLatency: z.number(),
    totalTokens: z.number(),
    estimatedCost: z.number(),
    semanticConfidence: z.number(),
    dataQuality: z
        .object({
            tokenCount: z
                .object({
                    source: z.enum(['actual', 'estimated']),
                    method: z.string().optional(),
                    divisor: z.number().optional(),
                    note: z.string().optional(),
                })
                .optional(),
            retention: z
                .object({
                    inMemoryLimit: z.number(),
                    dbLoadLimit: z.number(),
                    policy: z.literal('newest-first'),
                    evictedOlderEntries: z.boolean().optional(),
                })
                .optional(),
        })
        .optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CognitiveSkillSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.enum(['analysis', 'generation', 'orchestration', 'utility']),
    status: z.enum(['installed', 'active', 'not_installed']),
    toolsUsed: z.array(z.string()),
    version: z.string(),
    executionCount: z.number(),
});

export const RoleSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    systemPrompt: z.string().optional(),
    baseTemperature: z.number().optional(),
    icon: z.string().optional(),
    priority: z.number().optional(),
    parentRoleId: z.string().optional(),
    capabilities: z.array(z.string()).default([]),
    permissions: z.array(z.string()).default([]),
    deniedPermissions: z.array(z.string()).optional(),
    metadata: z.object({
        category: z.enum(['creative', 'technical', 'analytical', 'management', 'custom']),
        created: z.number(),
        updated: z.number(),
        tags: z.array(z.string()).default([]),
        author: z.string().optional(),
        version: z.string().optional(),
        avatar: z.string().optional(),
        avatarShape: z.string().optional(),
        avatarColor: z.string().optional(),
    }),
    isBuiltin: z.boolean().optional().default(false),
});

export const ExecutionTraceSchema = z.object({
    id: z.string(),
    startTime: z.number(),
    endTime: z.number().optional(),
    input: z.string(),
    output: z.string().optional(),
    status: z.enum(['running', 'completed', 'failed']),
    steps: z.array(z.record(z.string(), z.unknown())),
    provider: z.string().optional(),
    model: z.string().optional(),
    totalTokens: z.number().optional(),
    estimatedCost: z.number().optional(),
});

export const ConnectorSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string(),
    color: z.string(),
    status: z.enum(['connected', 'auth_required', 'disconnected']),
    lastSync: z.string().optional(),
});

export const KeyValueSchema = z.object({
    id: z.string(),
    value: z.unknown(),
    createdAt: z.number().optional(),
    version: z.number().optional(),
});

export const EventPayloadSchema = z.object({
    event: z.string(),
    data: z.unknown(),
});

export const ToolDefinitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['script', 'api', 'database']),
    category: z
        .enum(['search', 'code', 'web', 'data', 'connector', 'utility', 'custom'])
        .optional(),
    language: z.enum(['python', 'javascript', 'sql']).optional(),
    code: z.string().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    enabled: z.boolean().optional(),
    rateLimit: z.number().optional(),
    timeout: z.number().optional(),
    allowedDomains: z.array(z.string()).optional(),
    parameters: z.unknown().optional(),
});

export const MCPServerConfigSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    status: z.enum(['connected', 'disconnected', 'error']),
    error: z.string().optional(),
    lastConnected: z.number().optional(),
    capabilities: z.array(z.string()).optional(),
});

export const BudgetStateEntrySchema = z.object({
    provider: z.string(),
    sessionCount: z.number(),
    totalCost: z.number(),
    totalTokens: z.number(),
    activeSessions: z.number(),
});

export const BudgetStateSnapshotSchema = z.object({
    global: z.object({
        totalCost: z.number(),
        totalTokens: z.number(),
        totalSessions: z.number(),
        activeSessions: z.number(),
    }),
    byProvider: z.array(BudgetStateEntrySchema),
    limits: z.object({
        maxCostPerProvider: z.number(),
        maxTokensPerProvider: z.number(),
        maxTotalCost: z.number(),
        maxTotalTokens: z.number(),
        maxSessionsPerProvider: z.number(),
        maxConcurrentSessions: z.number(),
    }),
    exhausted: z.boolean(),
    timestamp: z.number(),
});

export const PolicyViolationSchema = z.object({
    id: z.string(),
    policyId: z.string(),
    nodeId: z.string(),
    type: z.enum(['latency', 'privacy', 'cost', 'safety', 'rate_limit', 'content', 'custom']),
    severity: z.enum(['info', 'warning', 'error', 'critical']),
    detail: z.string(),
    value: z.number().optional(),
    threshold: z.number().optional(),
    timestamp: z.number(),
    resolved: z.boolean(),
});

export const CognitiveDecisionSchema = z.object({
    input: z.string(),
    constraints: z.array(z.string()),
    alternatives: z.array(
        z.object({
            id: z.string(),
            label: z.string(),
            score: z.number(),
            reasoning: z.string(),
            constraints_impact: z.record(z.string(), z.number()).optional(),
            metadata: z.record(z.string(), z.unknown()).optional(),
        }),
    ),
    selectedId: z.string(),
    confidence: z.number(),
    logic: z.string(),
    cost: z.number().optional(),
    causal_chain: z.array(z.string()).optional(),
});

export const OptimizationSuggestionSchema = z.object({
    id: z.string(),
    type: z.enum(['latency', 'accuracy', 'cost', 'topology', 'security']),
    title: z.string(),
    description: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    targetNodeId: z.string().optional(),
    proposedChange: z
        .object({
            routing_update: z.string().optional(),
            disable_providers: z.array(z.string()).optional(),
            queue_delay: z.number().optional(),
            add_guardrail: z.string().optional(),
            switch_provider: z.string().optional(),
            verify_keys: z.array(z.string()).optional(),
            add_redundant_keys: z.boolean().optional(),
            optimize_nodes: z.array(z.string()).optional(),
            prefer_providers: z.array(z.string()).optional(),
            topology_update: z.string().optional(),
            add_node: z.string().optional(),
            tier_switch: z.string().optional(),
            switch_to: z.string().optional(),
        })
        .optional(),
    autoExecutable: z.boolean().optional(),
    estimatedSavings: z
        .object({ latency: z.number().optional(), cost: z.number().optional() })
        .optional(),
    bottleneckNodes: z.array(z.string()).optional(),
    effectiveness: z
        .object({
            improved: z.boolean(),
            measuredAt: z.number(),
            metricBefore: z.number(),
            metricAfter: z.number(),
        })
        .optional(),
});

export const DebateSessionRecordSchema = z.object({
    id: z.string().min(1),
    topic: z.string().min(1).optional().default('(no topic)'),
    topologyType: z.string().min(1).optional().default('roundtable'),
    phase: z.string().min(1),
    round: z.number().int().min(0),
    totalTokens: z.number().min(0),
    totalCost: z.number().min(0),
    agentStates: z.string().min(1),
    arguments: z.string(),
    topology: z.string().min(1),
    participants: z.string(),
    memory: z.string(),
    startedAt: z.number().positive(),
    updatedAt: z.number().positive(),
    createdAt: z.number().positive(),
    version: z.number().int().min(1).default(1),
    language: z.string().optional().default('Russian'),
});

export const DebateVerdictRecordSchema = z.object({
    sessionId: z.string().min(1),
    topic: z.string().min(1),
    summary: z.string(),
    conclusionType: z.string().min(1),
    stanceResult: z.string().min(1),
    keyArguments: z.string(),
    reasoning: z.string(),
    confidence: z.number().min(0).max(1),
    generatedAt: z.number().positive(),
    roundsTotal: z.number().int().min(0),
    totalTokens: z.number().min(0),
});

export const DebateTimelineEntrySchema = z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    timestamp: z.number().positive(),
    type: z.string().min(1),
    payload: z.string(),
});

export const DebateOverrideSchema = z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    type: z.string().min(1),
    payload: z.string(),
    appliedAt: z.number().positive(),
});

export const SessionLinkSchema = z.object({
    id: z.string().min(1),
    fromId: z.string().min(1),
    toId: z.string().min(1),
    linkType: z.enum(['chat_to_debate', 'debate_to_chat', 'continuation', 'derivative']),
    context: z.string(),
    createdAt: z.number().positive(),
});

export const EventLogEntrySchema = z.object({
    id: z.number().int().positive().optional(),
    sequence: z.number().int().min(0),
    event: z.string().min(1),
    dataJson: z.string(),
    timestamp: z.number().positive(),
    checksum: z.string().min(1),
});

export const RuntimeStateSchema = z.object({
    kernel: z.record(z.string(), z.unknown()),
    topology: z.unknown(),
    disabledNodes: z.array(z.string()),
    memoryCount: z.number(),
});

export const SystemSnapshotSchema = z.object({
    id: z.string(),
    traceId: z.string(),
    stepId: z.string(),
    timestamp: z.number(),
    schemaVersion: z.number().default(0),
    label: z.string().optional(),
    tags: z.array(z.string()).optional(),
    runtime: RuntimeStateSchema,
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ConversationScenarioSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    topic: z.string().optional(),
    version: z.number().int().min(1),
    status: z.enum(['draft', 'active', 'archived']),
    participants: z.array(z.object({ id: z.string(), role: z.string() })),
    turns: z.array(
        z.object({
            participantId: z.string(),
            objective: z.object({
                type: z.enum([
                    'INTRODUCE',
                    'CRITIQUE',
                    'RESPOND',
                    'ANALYZE',
                    'SUMMARIZE',
                    'CHALLENGE',
                    'CUSTOM',
                ]),
                description: z.string(),
                constraints: z.array(z.string()),
            }),
            targetTurnId: z.string().optional(),
        }),
    ),
    createdAt: z.number(),
    updatedAt: z.number(),
});
