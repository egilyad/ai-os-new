import { EVENT_REGISTRY, type EventMap } from './event-registry';

export const ChatEvents = {
    SEND: EVENT_REGISTRY.SEND_MESSAGE.name,
    CANCEL: EVENT_REGISTRY.CANCEL_MESSAGE.name,
    RESPONSE: EVENT_REGISTRY.MESSAGE_RESPONSE.name,
    STREAM_START: EVENT_REGISTRY.STREAM_START.name,
    STREAM_CHUNK: EVENT_REGISTRY.STREAM_CHUNK.name,
    STREAM_END: EVENT_REGISTRY.STREAM_END.name,
    STREAM_ERROR: EVENT_REGISTRY.STREAM_ERROR.name,
    SELECT_MODEL: EVENT_REGISTRY.SELECT_MODEL.name,
    START_WITH_TARGET: EVENT_REGISTRY.START_CHAT_WITH_TARGET.name,
    SUMMARY_CREATED: EVENT_REGISTRY.CHAT_SUMMARY_CREATED.name,
} as const;

export type ChatEventMap = Pick<
    EventMap,
    | 'chat:send'
    | 'chat:cancel'
    | 'chat:response'
    | 'chat:stream:start'
    | 'chat:stream:chunk'
    | 'chat:stream:end'
    | 'chat:stream:error'
    | 'chat:model:select'
    | 'chat:target:start'
    | 'chat:summary:created'
>;

export interface ChatSendPayload {
    provider: string;
    model: string;
    messages: unknown[];
    requestId?: string;
    strategy?: string;
    keyId?: string;
    options?: {
        stream?: boolean;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
        stop?: string[];
        timeout?: number;
        userId?: string;
        sessionId?: string;
        metadata?: Record<string, unknown>;
    };
}

export interface StreamLifecyclePayload {
    requestId: string;
    provider: string;
    model: string;
    keyId?: string;
}

export interface StreamChunkPayload {
    requestId: string;
    provider: string;
    chunk: string;
    keyId?: string;
}

export type StreamEndStatus = 'timeout' | 'done' | 'cancelled' | 'error';

export interface StreamEndPayload {
    requestId: string;
    fullContent: string;
    latency: number;
    tokens?: number;
    provider?: string;
    model?: string;
    keyId?: string;
    agentId?: string;
    ttft?: number;
    tps?: number;
    status?: StreamEndStatus;
    finishReason?: string;
}

export interface StreamErrorPayload {
    requestId: string;
    provider: string;
    error: string;
    keyId?: string;
}
