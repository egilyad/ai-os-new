import type { ChatMessage } from './llm-types';

export type ChatStatus =
    'loading' | 'done' | 'error' | 'cancelled' | 'streaming' | 'queued' | 'timeout' | 'cached';
export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';
export type ChatStrategy =
    'auto' | 'broadcast' | 'race' | 'performance' | 'cost' | 'latency' | 'manual';

export interface ChatResponse {
    id: string;
    requestId: string;
    provider: string;
    model: string;
    keyId?: string;
    content: string;
    latency: number;
    status: ChatStatus;
    error?: string;
    tokens?: number;
    ttft?: number;
    tps?: number;
    cost?: number;
    strategy?: ChatStrategy;
    finishReason?: string;
    timestamp?: number;
}

export interface QueuedRequest {
    requestId: string;
    provider: string;
    model: string;
    messages: ChatMessage[];
    keyId?: string;
    options?: {
        stream?: boolean;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
        stop?: string[];
        strategy?: ChatStrategy;
        timeout?: number;
        userId?: string;
        sessionId?: string;
        metadata?: Record<string, unknown>;
    };
    priority?: 'low' | 'normal' | 'high';
    createdAt?: number;
}
