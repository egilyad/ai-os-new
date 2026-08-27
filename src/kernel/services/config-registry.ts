import type { ConfigRegistry, StorageConfigSection } from '../contracts/config-registry';

export const rawConfig: ConfigRegistry = {
    version: '1.0.0',
    buildId:
        typeof import.meta !== 'undefined' && import.meta.env?.VITE_BUILD_ID
            ? (import.meta.env.VITE_BUILD_ID as string)
            : 'dev',

    router: {
        history: { maxDecisions: 100 },
        latency: { slidingWindowSize: 10, monitorIntervalMs: 30000, degradationRatio: 1.5 },
        scoring: {
            ttftMaxMs: 2000,
            tpsMax: 100,
            reliabilityFloor: 0.4,
            stabilityBonus: 0.1,
            reputationBonus: 0.1,
            keyReputationBonus: 0.15,
            latencyPenalty: { thresholdRatio: 1.5, max: 0.3, slope: 0.2 },
            costPenalty: { scalar: 100 },
        },
        classification: {
            shortThreshold: 500,
            mediumThreshold: 2000,
            complexThreshold: 2000,
            longThreshold: 4000,
            codePatterns:
                '(function|class|const|import|export|def |```|SELECT|CREATE TABLE|async |await )',
            reasoningPatterns:
                '(why|explain|analyze|compare|contrast|what if|how does|reason|think step|solve)',
            multimodalPatterns: '(image|picture|photo|diagram|chart|graph|visual|render|draw)',
        },
        defaultWeights: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
        strategyWeights: {
            broadcast: { ttft: 0.33, tps: 0.33, reliability: 0.34 },
            performance: { ttft: 0.1, tps: 0.7, reliability: 0.2 },
            reliability: { ttft: 0.1, tps: 0.1, reliability: 0.8 },
            latency: { ttft: 0.8, tps: 0.0, reliability: 0.2 },
            auto: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
            race: { ttft: 0.9, tps: 0.0, reliability: 0.1 },
            cost: { ttft: 0.2, tps: 0.3, reliability: 0.5 },
            content: { ttft: 0.4, tps: 0.2, reliability: 0.4 },
            freeFirst: { ttft: 0.1, tps: 0.1, reliability: 0.8 },
        },
        autoDynamicAdjustment: {
            short: { ttftDelta: 0.2, tpsDelta: -0.1, reliabilityDelta: 0.1 },
            long: { ttftDelta: -0.2, tpsDelta: 0.3, reliabilityDelta: 0.1 },
        },
        latencyVarianceBands: [
            { minVariance: 1.0, weights: { ttft: 0.85, tps: 0.1, reliability: 0.05 } },
            { minVariance: 0.5, weights: { ttft: 0.7, tps: 0.15, reliability: 0.15 } },
            { minVariance: 0.25, weights: { ttft: 0.5, tps: 0.25, reliability: 0.25 } },
        ],
        weights: {
            default: { ttft: 0.4, tps: 0.3, reliability: 0.3 },
            performance: { ttft: 0.1, tps: 0.7, reliability: 0.2 },
            reliability: { ttft: 0.1, tps: 0.1, reliability: 0.8 },
            latency: { ttft: 0.8, tps: 0.0, reliability: 0.2 },
            cost: { ttft: 0.1, tps: 0.3, reliability: 0.1 },
            freeFirst: { ttft: 0.1, tps: 0.1, reliability: 0.8 },
            race: { ttft: 0.9, tps: 0.0, reliability: 0.1 },
            broadcast: { ttft: 0.33, tps: 0.33, reliability: 0.34 },
            content: { ttft: 0.2, tps: 0.1, reliability: 0.2 },
        },
        decisionHistoryDefaultLimit: 20,
        raceCandidateCount: 2,
        budgetPenalty: {
            thresholds: [
                { pct: 1, penalty: 100 },
                { pct: 0.9, penalty: 50 },
                { pct: 0.8, penalty: 20 },
            ],
        },
        costEstimate: { tokenDivisor: 4, outputMultiplier: 2, per1kDivisor: 1000 },
        affinity: {
            multimodal: { gemini: 0.5, openrouter: 0.3 },
            code: { gemini: 0.3, openrouter: 0.3, groq: 0.2 },
            longPrompt: { minLength: 8000, values: { gemini: 0.4, openrouter: 0.2 } },
            shortPrompt: { maxLength: 200, values: { groq: 0.3, gemini: 0.15 } },
            complexity: {
                complex: { openrouter: 0.3, gemini: 0.2 },
                simple: { groq: 0.25 },
            },
        },
        priority: {
            high: { groq: 0.4, gemini: 0.2 },
            low: { groq: -0.2 },
        },
        providerByComplexity: {
            multimodal: { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
            long: { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
            complexCode: { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
            complex: { provider: 'openrouter', model: 'openai/gpt-4o-mini' },
            medium: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
            default: { provider: 'groq', model: 'llama-3.1-8b-instant' },
        },
    },

    monitoring: {
        healthCheckStaleIntervalMs: 10000,
        healthThresholds: { healthy: 0.8, degraded: 0.5 },
        latencyPenalty: { thresholdMs: 3000, cap: 0.3, divisor: 20000 },
        errorRatePenalty: { threshold: 0.1, cap: 0.3, multiplier: 0.5 },
        successRatePenalty: { floor: 0.9, multiplier: 0.5 },
        alertPenalty: { perAlert: 0.1, cap: 0.3 },
    },

    metrics: {
        maxHistoryPoints: 1000,
        autoCaptureIntervalMs: 30000,
        defaultReportLimit: 100,
        defaultThresholds: {
            avgLatency: { warning: 3000, critical: 8000 },
            errorRate: { warning: 0.1, critical: 0.25 },
            successRate: { warning: 0.9, critical: 0.75 },
            totalTokens: { warning: 500000, critical: 1000000 },
        },
    },

    traces: {
        // RETENTION: in-memory + DB limited to 200 entries
        maxEntries: 200, // max traces kept in memory; older entries evicted
        dbLoadLimit: 200, // max traces loaded from IndexedDB on init
        tokenEstimateDivisor: 4, // APPROXIMATION: len/4 used when real token count unavailable
    },

    webhooks: {
        maxRetries: 3,
        retryDelayMs: 2000,
        timeoutMs: 10000,
        discordContentMaxLength: 2000,
        discordEmbedDescMaxLength: 4096,
        providers: ['slack', 'telegram'],
        eventOptions: [
            'system:notification',
            'key:quota:exceeded',
            'policy:violation',
            'key:state:changed',
            'chat:stream:error',
        ],
    },

    keys: {
        // TODO: Per-model limits — FreeTierLimit type needs refactoring
        // Real Groq limits: llama-3.3-70b 1000/500k, light models 14400/500k
        freeTierLimits: {
            Groq: { requestsPerDay: 1000, tokensPerDay: 500000 },
            Gemini: { requestsPerDay: 1500, tokensPerDay: 1000000 },
            OpenRouter: { requestsPerDay: 50, tokensPerDay: 0 },
            NVIDIA: { requestsPerDay: 1000, tokensPerDay: 0 },
            Cerebras: { requestsPerDay: 14400, tokensPerDay: 1000000 },
            Cloudflare: { requestsPerDay: 10000, tokensPerDay: 0 },
        },
        defaultRules: {
            maxConcurrentRequests: 5,
            retryPolicy: { maxAttempts: 3, backoffMs: 1000 },
            timeoutMs: 30000,
            quota: { tokensPerDay: 1000000, requestsPerDay: 1000 },
            slaThresholds: { latencyP95: 2000, errorFloor: 0.05 },
        },
        healthCheckTimeoutMs: 5000,
        rateLimitSpikeWindowMs: 60000,
        rateLimitSpikeThreshold: 3,
        initialBackoffMs: 1000,
        maxBackoffMs: 120000,
        slaProfiles: {
            LOW_LATENCY: { timeoutMs: 5000, latencyP95: 1200 },
            HIGH_QUALITY: { timeoutMs: 60000, latencyP95: 5000 },
            FREE_FIRST: { timeoutMs: 60000, latencyP95: 5000 },
            DEFAULT: { timeoutMs: 30000, latencyP95: 2000 },
        },
    },

    llm: {
        retry: { maxRetries: 3, baseDelayMs: 1000 },
        circuitBreaker: {
            failureThreshold: 5,
            successThreshold: 2,
            openTimeoutMs: 30000,
            halfOpenMaxRequests: 1,
        },
        rateLimiter: { maxTokens: 60, refillRate: 60, refillIntervalMs: 60000 },
        cache: { defaultTTLMs: 60000, maxEntries: 100 },
        priorityQueue: { maxConcurrency: 4, lowPriorityDelayMs: 200, maxQueueSize: 1000 },
        tokenEstimateDivisor: 4,
        pricing: {
            'gpt-4o': { inputPer1K: 0.005, outputPer1K: 0.015 },
            'gpt-4o-mini': { inputPer1K: 0.00015, outputPer1K: 0.0006 },
            'claude-3-haiku': { inputPer1K: 0.00025, outputPer1K: 0.00125 },
            'claude-3-sonnet': { inputPer1K: 0.003, outputPer1K: 0.015 },
            'gemini-3.1-flash-lite': { inputPer1K: 0.00025, outputPer1K: 0.0015 },
        },
        pricingFallback: { inputPer1K: 0.002, outputPer1K: 0.008 },
        costRecordMax: 100000,
        costRecordTrimTo: 50000,
    },

    pressure: {
        levelThresholds: { critical: 80, high: 60, medium: 35, low: 10 },
        formulaWeights: {
            status: 0.25,
            reliability: 0.15,
            quotaPct: 0.2,
            budgetPct: 0.1,
            errorRate: 0.1,
            saturation: 0.1,
            latencySignal: 0.1,
        },
        autoRefreshIntervalMs: 10000,
    },

    pricing: {
        defaultMonthlyBudget: 50,
        cacheTTLMs: 3600000,
        prefixCacheMaxSize: 500,
        perTokenDivisor: 1000000,
        costHistoryMax: 500,
        defaultEstimatedOutputTokens: 256,
    },

    services: {
        advisor: {
            latencyThreshold: 4000,
            costThreshold: 10,
            minConfidence: 0.7,
            analysisIntervalMs: 60000,
        },
        diagnostics: {
            providerErrorHistoryLimit: 20,
            recentErrorWindowMs: 300000,
            escalationRecentCount: 5,
            activeKeyScaleTarget: 3,
            quotaCriticalPct: 90,
            quotaWarningPct: 70,
            latencyCriticalMs: 3000,
            latencyWarningMs: 1000,
            rateLimitWarningCount: 5,
            timeoutCriticalCount: 3,
            successRateMinRequests: 10,
            successRateCritical: 0.7,
            successRateWarning: 0.9,
        },
        debate: {
            maxRetries: 3,
            baseBackoffMs: 5000,
            maxBackoffMs: 30000,
            debateTimeoutMs: 30000,
            largeModelTimeoutMs: 90000,
            maxDurationMs: 1800000,
            roundDelayMs: 3000,
            maxTokens: 500,
            temperature: 0.7,
            timeoutMs: 30000,
            timelineMaxEntries: 5000,
        },
        cache: { defaultTTLMs: 300000, maxEntries: 500 },
        toolExecutor: { maxHistory: 200, defaultTimeoutMs: 10000 },
        sandbox: { fetchTimeoutMs: 10000, codeExecutionTimeoutMs: 5000 },
        mcp: { safeFetchTimeoutMs: 5000 },
        logger: { maxBuffer: 500 },
        admin: { maxAuditEntries: 5000 },
        timeline: { maxEvents: 5000 },
        usageTracker: { maxRecords: 10000, debounceMs: 2000 },
        eventRecorder: { maxEvents: 10000 },
        policy: { maxViolations: 200 },
        pressureMap: { maxTrendHistory: 200, alertCooldownMs: 60000, alertsBufferSize: 100 },
        whatif: { maxHistory: 100 },
        keyService: { introspectionTimeoutMs: 10000 },
        providerInstance: { healthCheckIntervalMs: 30000 },
        memory: { semanticEnabled: true, autoEmbedOnStore: true, maxEntries: 1000 },
    },

    featureFlags: {
        memory: {
            enabled: true,
            semantic: true,
            ragOnChat: true,
            autoStore: true,
        },
        debate: {
            runtimeEngine: false,
            engineOnly: false,
        },
        ui: {
            experimentalVisuals: false,
        },
        mockServices: {
            enabled: true,
        },
    },

    storage: {} as StorageConfigSection,
    security: {
        adminToken: undefined,
        webhookSecret: undefined as string | undefined,
    },
};

let _configDefaults: Readonly<ConfigRegistry> | undefined;

function buildConfigDefaults(): Readonly<ConfigRegistry> {
    const clone = structuredClone(rawConfig);
    if (!clone.security) clone.security = {};
    // adminToken kept for forward-compat with future server mode; no longer enforced
    // (single-user local-first app — it was only JS-heap obfuscation, not real auth)
    const adminToken = clone.security.adminToken || crypto.randomUUID();
    let webhookSecret = clone.security.webhookSecret;
    if (!webhookSecret) {
        const STORAGE_KEY = 'superagents_webhook_secret';
        try {
            webhookSecret = localStorage.getItem(STORAGE_KEY) || undefined;
        } catch {
            /* storage unavailable — fall through */
        }
        if (!webhookSecret) {
            webhookSecret = crypto.randomUUID();
            try {
                localStorage.setItem(STORAGE_KEY, webhookSecret);
            } catch {
                /* storage unavailable — use in-memory only */
            }
        }
    }
    Object.defineProperty(clone.security, 'adminToken', {
        value: adminToken,
        enumerable: false,
        writable: false,
        configurable: false,
    });
    Object.defineProperty(clone.security, 'webhookSecret', {
        value: webhookSecret,
        enumerable: false,
        writable: false,
        configurable: false,
    });
    deepFreeze(clone);
    return clone;
}

const configDefaultsHandler: ProxyHandler<Readonly<ConfigRegistry>> = {
    get(_, prop) {
        if (!_configDefaults) _configDefaults = buildConfigDefaults();
        return Reflect.get(_configDefaults, prop, _configDefaults);
    },
    has(_, prop) {
        if (!_configDefaults) _configDefaults = buildConfigDefaults();
        return Reflect.has(_configDefaults, prop);
    },
    ownKeys() {
        if (!_configDefaults) _configDefaults = buildConfigDefaults();
        return Reflect.ownKeys(_configDefaults);
    },
};

/** Deep-frozen defaults — never mutated. Used by ConfigService as the base for overlays.
 *  Lazily initialized: the JSON.parse clone happens on first property access, not at module load time,
 *  saving ~50ms of main-thread blocking during initial page load. */
export const CONFIG_DEFAULTS: Readonly<ConfigRegistry> = new Proxy(
    {} as Readonly<ConfigRegistry>,
    configDefaultsHandler,
);

/** Frozen public API — all mutations must go through config service.
 *  Proxy traps prevent accidental direct mutation at runtime. */
/** Default language for debate prompts when not explicitly configured */
export const DEFAULT_DEBATE_LANGUAGE: string = 'Russian';

export const CONFIG: Readonly<ConfigRegistry> = new Proxy(rawConfig, {
    set: () => {
        throw new Error('CONFIG is read-only — use setConfig() or replaceConfig()');
    },
    deleteProperty: () => {
        throw new Error('CONFIG is read-only — use setConfig() or replaceConfig()');
    },
    defineProperty: () => {
        throw new Error('CONFIG is read-only — use setConfig() or replaceConfig()');
    },
}) as Readonly<ConfigRegistry>;

/** N-14: deep freeze helper to prevent accidental CONFIG mutation */
export function deepFreeze(obj: unknown): void {
    if (obj === null || typeof obj !== 'object') return;
    if (Object.isFrozen(obj)) return;
    Object.freeze(obj);
    for (const val of Object.values(obj as Record<string, unknown>)) deepFreeze(val);
}
