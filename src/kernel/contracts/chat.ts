import type { ILLMClientService } from './provider-adapter';
import type { ChatMessage, ProviderResponse, SendMessageOptions } from '../types/llm-types';
import type { ILogger } from './logger';
import type { IPromptSecurityService } from './prompt-security-types';

export interface ChatServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
        emitOnce: (event: string, key: string, data?: unknown) => boolean;
    };
    promptSecurityService: IPromptSecurityService;
    keyService: {
        selectFromPool: (
            provider: string,
        ) => { id: string; key: string; provider: string; status: string } | null | undefined;
        selectWithBurst?: (
            provider: string,
        ) => { id: string; key: string; provider: string; status: string } | null | undefined;
        getKeys: () => { id: string; key: string; provider: string; status: string }[];
        getKey?: (
            id: string,
        ) => { id: string; key: string; provider: string; status: string } | null | undefined;
        recordUsage: (
            keyIdOrProvider: string,
            latency: number,
            tokens?: number,
            model?: string,
            extra?: Record<string, unknown>,
        ) => void;
        handleProviderError: (keyId: string, error: string) => void;
        updateKeyStatus: (id: string, status: string, latency?: number) => void;
    };
    virtualKeyService: {
        resolve: (id: string) => { realKeyId: string } | undefined;
    };
    settingsService: {
        getSettings: () => { streamingEnabled: boolean };
    };
    routerService: {
        getRankedProviders: (
            strategy: string,
            prompt: string,
            priority?: string,
            agentId?: string,
            probeResults?: Map<string, unknown>,
            overrideState?: unknown,
            suppressEmit?: boolean,
            origin?: string,
            sessionId?: string,
        ) => Array<{ provider: string; key: { id: string }; score?: number }>;
        getRaceCandidateDetails: (
            prompt: string,
        ) => Array<{ provider: string; model: string; keyId: string }>;
        getDeepDowngradedModel: (model: string, levels: number) => string | null;
        getDowngradedModel: (model: string) => string | null;
        resolveWithFallback: (
            strategy: string,
            excludeProviders?: Set<string> | string,
            excludeKeyId?: string,
        ) => { provider: string; key: { id: string } } | null;
    };
    raceExecutor?: {
        race: (
            messages: ChatMessage[],
            candidates: { provider: string; model: string; keyId: string }[],
            options?: {
                signal?: AbortSignal;
                adapterOptions?: SendMessageOptions;
                timeoutMs?: number;
                keyResolver?: (keyId: string) => string | undefined;
            },
        ) => Promise<{
            winner: { provider: string; model: string; keyId: string };
            response: ProviderResponse;
            latency: number;
            failures: Array<{
                candidate: { provider: string; model: string; keyId: string };
                error: string;
            }>;
            aborted: { provider: string; model: string; keyId: string }[];
        }>;
        destroy: () => void;
    };
    routingPolicyService?: {
        getDowngradedModel: (model: string) => string | null;
        getDeepDowngradedModel: (model: string, steps: number) => string | null;
        smartDowngradeDeep?: (
            model: string,
            metrics: { avgLatency: number; errorRate: number },
            maxSteps?: number,
        ) => { model: string; reason: string } | null;
    };
    getProviderState?: (provider: string) => { avgTTFT: number } | undefined;
    cacheService: {
        generateKey: (
            messages: Array<{ role: string; content: string }>,
            model: string,
        ) => Promise<string>;
        get: (key: string) => {
            response: string;
            model: string;
            promptTokens: number;
            completionTokens: number;
        } | null;
        set: (
            key: string,
            response: string,
            model: string,
            provider: string,
            promptTokens: number,
            completionTokens: number,
            ttl?: number,
        ) => void;
    };
    policyService: {
        checkAgentPolicy: (
            agentId: string,
            provider: string,
            model?: string,
        ) => { allowed: boolean; reason?: string };
    };
    budgetService?: {
        recordSpend: (agentId: string | null, provider: string, amount: number) => void;
    };
    freeTierLimits: Record<string, { requestsPerDay: number; tokensPerDay: number }>;
    executionGovernor?: {
        start(spec: { type: string; timeoutMs: number; metadata?: Record<string, unknown> }): {
            complete(): void;
            fail(e: Error): void;
        };
    };
    providerRuntime?: {
        createSession: (
            instanceId: string,
            provider: string,
            model: string,
        ) => {
            id: string;
            instanceId: string;
            provider: string;
            status: string;
            activate: () => void;
            complete: (latency: number) => void;
            fail: (error: string) => void;
            recordTokens: (input: number, output: number) => void;
            recordCost: (cost: number) => void;
        };
        getOrCreateInstance: (key: { id: string; key: string; provider: string }) => { id: string };
        getInstance: (instanceId: string) => { id: string } | undefined;
    };
    logger: ILogger;
    llmClient: ILLMClientService;
}
