import type { IProviderAdapter, StreamMeta } from '../../kernel/contracts/provider-adapter';

export type {
    ToolCall,
    ChatMessage,
    SafetyRating,
    ProviderResponse,
    HealthCheckResult,
    Tool,
    SendMessageOptions,
} from '../../kernel/types/llm-types';

/** Canonical adapter interface — re-export of kernel contract IProviderAdapter. */
export type LLMProviderAdapter = IProviderAdapter;
export type { StreamMeta };
