import type {
    ToolCall,
    ChatMessage as AdapterMessage,
    ProviderResponse as AdapterResponse,
    HealthCheckResult as AdapterHealthResult,
    SendMessageOptions as AdapterSendMessageOptions,
} from '../types/llm-types';

export type { ChatMessage as AdapterMessage } from '../types/llm-types';
export type { ProviderResponse as AdapterResponse } from '../types/llm-types';
export type { ToolCall } from '../types/llm-types';
export type { HealthCheckResult as AdapterHealthResult } from '../types/llm-types';

export type AdapterFinishReason =
    | 'STOP'
    | 'MAX_TOKENS'
    | 'SAFETY'
    | 'RECITATION'
    | 'OTHER'
    | 'TOOL_CALLS'
    | 'LANGUAGE'
    | 'BLOCKLIST'
    | 'PROHIBITED_CONTENT'
    | 'SPII'
    | 'MALFORMED_FUNCTION_CALL';

export interface StreamMeta {
    finishReason?: string;
    usage?: Record<string, unknown>;
    reasoning?: string;
    tokens?: number;
    safetyRatings?: Array<{
        category: string;
        probability: string;
        blocked?: boolean;
    }>;
    usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
    };
}

interface BatchRequest {
    messages: AdapterMessage[];
    model: string;
    apiKey: string;
    signal?: AbortSignal;
    options?: AdapterSendMessageOptions;
}

interface BatchStreamRequest {
    messages: AdapterMessage[];
    model: string;
    apiKey: string;
    onChunk: (chunk: string, meta?: StreamMeta) => void;
    signal?: AbortSignal;
    options?: AdapterSendMessageOptions;
}

export interface IProviderAdapter {
    readonly id: string;
    sendMessage(
        messages: AdapterMessage[],
        model: string,
        apiKey: string,
        signal?: AbortSignal,
        options?: AdapterSendMessageOptions,
    ): Promise<AdapterResponse>;
    streamMessage?(
        messages: AdapterMessage[],
        model: string,
        apiKey: string,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        options?: AdapterSendMessageOptions,
    ): Promise<void>;
    batchSendMessage?(requests: BatchRequest[]): Promise<AdapterResponse[]>;
    batchStreamMessage?(requests: BatchStreamRequest[]): Promise<void>;
    checkHealth(apiKey: string): Promise<AdapterHealthResult>;
    getAvailableModels(apiKey: string, signal?: AbortSignal): Promise<string[]>;
    rotateKey?(currentKey: string): Promise<{ newKey: string; label?: string } | null>;
    destroy?(): void;
}

export interface ProviderRuntimeStatus {
    circuitOpen: boolean;
    rateLimited: boolean;
}

export interface IAdapterRegistry {
    getAdapter(provider: string): IProviderAdapter | undefined;
    hasAdapter(provider: string): boolean;
    getOrCreateWithFallback(primary: string, fallback: string): IProviderAdapter;
    getAllProviders(): string[];
    getProviderRuntimeStatus(provider: string): ProviderRuntimeStatus;
    getCircuitBreakerState(provider: string): 'closed' | 'open' | 'half-open';
    resetCircuitBreaker(provider: string): void;
    syncCircuitBreakerState(provider: string, status: string): void;
    syncRateLimitState(provider: string, remaining: number): void;
    /** Walk the decorator chain of all adapters and clear CacheDecorator caches */
    clearAllCaches(): void;
}

export interface ILLMClientConfig {
    defaultProvider?: string;
    defaultModel?: string;
    resolveApiKey: (provider: string) => string | undefined;
}

export interface ILLMClientChatOptions {
    provider?: string;
    model?: string;
    signal?: AbortSignal;
    onChunk?: (chunk: string, meta?: StreamMeta) => void;
    priority?: 'low' | 'normal' | 'high';
    temperature?: number;
    maxTokens?: number;
    apiKeyOverride?: string;
    stopSequences?: string[];
    tools?: Record<string, unknown>[];
    toolChoice?: string | { type: 'function'; function: { name: string } };
    responseFormat?: { type: 'text' | 'json_object' };
    /** B-20: scopes the response cache by agent/session/role to avoid cross-agent contamination. */
    cacheScope?: {
        agentId?: string;
        sessionId?: string;
        role?: string;
    };
}

export interface ILLMClientService {
    chat(messages: AdapterMessage[], options?: ILLMClientChatOptions): Promise<AdapterResponse>;
    sendMessage(
        messages: AdapterMessage[],
        options?: ILLMClientChatOptions,
    ): Promise<{
        content: string;
        toolCalls?: ToolCall[];
        latency: number;
        tokens: number;
        error?: string;
        finishReason?: AdapterFinishReason;
    }>;
}
