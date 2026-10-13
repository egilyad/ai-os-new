/**
 * Phase 70, трасса B (Anthropic Computer Use).
 * `'function'` — обычный OpenAI function-calling вызов.
 * `'computer_20250124'` — Anthropic computer-use tool_use (`name: 'computer'`,
 * `input: { action, coordinate, ... }`); `function.arguments` при этом хранит
 * JSON-строку raw input, чтобы существующие потребители
 * (`call.function.name/arguments`) продолжали работать без ветвлений.
 */
export type ToolCallType = 'function' | 'computer_20250124';

export interface ToolCall {
    id: string;
    type: ToolCallType;
    function: {
        name: string;
        arguments: string;
    };
}

export interface InlineDataPart {
    mimeType: string;
    data: string; // base64-encoded
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    name?: string;
    toolCallId?: string;
    toolCalls?: ToolCall[];
    /**
     * Multimodal inline data (images, audio, video) attached to this message.
     * Phase 70, трасса B: AnthropicAdapter маппит image-части в
     * `content: [{ type: 'image', source: { type: 'base64', ... } }]`
     * (включая скриншоты в `tool_result` для computer-use loop).
     * На role:'tool' сообщениях с toolCallId inlineData уходит как
     * image-content внутри `tool_result` с `tool_use_id`.
     */
    inlineData?: InlineDataPart[];
    /**
     * N.1 DeepSeek-style reasoning passthrough: assistant reasoning content
     * that MUST be sent back verbatim in multi-turn tool loops (400 otherwise).
     * Flows through OpenAI-compatible JSON automatically (unindexed field).
     */
    reasoningContent?: string;
}

export interface SafetyRating {
    category: string;
    probability: 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH';
    blocked?: boolean;
}

export interface GroundingChunk {
    web?: { uri: string; title: string };
    retrievedContext?: { uri: string; title: string };
}

export interface GroundingSupport {
    segment: { text: string; startIndex?: number; endIndex?: number };
    groundingChunkIndices: number[];
    confidenceScores: number[];
}

export interface GroundingMetadata {
    groundingChunks?: GroundingChunk[];
    groundingSupports?: GroundingSupport[];
    webSearchQueries?: string[];
}

export interface ProviderResponse {
    content: string;
    latency: number;
    tokens: number;
    error?: string;
    finishReason?:
        | 'STOP'
        | 'MAX_TOKENS'
        | 'SAFETY'
        | 'RECITATION'
        | 'LANGUAGE'
        | 'BLOCKLIST'
        | 'PROHIBITED_CONTENT'
        | 'SPII'
        | 'OTHER'
        | 'TOOL_CALLS'
        | 'MALFORMED_FUNCTION_CALL';
    safetyRatings?: SafetyRating[];
    toolCalls?: ToolCall[];
    /** Gemini grounding metadata (from Google Search) */
    groundingMetadata?: GroundingMetadata;
    /** Chain-of-thought reasoning from thinking models */
    reasoning?: string;
}

export interface HealthCheckResult {
    status: 'active' | 'error';
    latency: number;
    models: string[];
    error?: string;
    finishReason?: string;
}

export interface Tool {
    type?: string;
    name?: string;
    description?: string;
    function?: {
        name: string;
        description?: string;
        parameters?: Record<string, unknown>;
    };
    /**
     * Phase 70, трасса B: параметры Anthropic computer-use инструмента.
     * Когда `type === 'computer_20250124'`, AnthropicAdapter строит
     * `{ type: 'computer_20250124', name: 'computer', display_width_px,
     * display_height_px }` из этого поля.
     */
    computer?: {
        displayWidthPx: number;
        displayHeightPx: number;
    };
}

export interface SendMessageOptions {
    temperature?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    tools?: Tool[];
    /**
     * Phase 70, трасса B: включить Anthropic computer-use инструмент
     * (`computer_20250124`) с размерами экрана. Не зависит от `tools` —
     * computer-инструмент не является function-tool и добавляется отдельно.
     */
    computerUse?: {
        displayWidthPx: number;
        displayHeightPx: number;
    };
    toolChoice?: unknown;
    responseFormat?: { type: 'text' | 'json_object'; schema?: unknown };
    safetySettings?: Array<{ category: string; threshold: string }>;
    cachedContent?: string;
    priority?: 'low' | 'normal' | 'high';

    /** Google Gemini only: enables deep thinking (Gemini 2.5 Flash/Pro) */
    thinkingConfig?: { type: 'ENABLED' | 'DISABLED' };

    /** Google Gemini only: grounds responses in Google Search */
    googleSearchGrounding?: boolean;

    /**
     * Google Gemini only: Vertex AI Search enterprise grounding.
     * When `true` with no datastore, uses googleSearchRetrieval with dynamic threshold.
     * When a datastore path is provided, uses Vertex AI Search retrieval tool.
     */
    vertexSearchGrounding?: boolean | VertexSearchConfig;

    /**
     * B-20: scopes the LLM response cache so identical prompts from different
     * agents/sessions/roles do NOT collide. Without this, the CacheDecorator's
     * key (apiKey + messages + model + options) lets one agent's cached answer
     * be served to another agent that happens to send the same prompt — most
     * harmful in debates where identical opening prompts are common.
     */
    cacheScope?: {
        agentId?: string;
        sessionId?: string;
        role?: string;
    };
}

export interface DynamicRetrievalConfig {
    mode?: 'MODE_DYNAMIC' | 'MODE_STATIC';
    dynamicThreshold?: number;
}

export interface VertexSearchConfig {
    /** Vertex AI Search datastore path, e.g. "projects/.../locations/global/collections/default_collection/dataStores/my-datastore" */
    datastore?: string;
    /** Dynamic retrieval config */
    dynamicRetrievalConfig?: DynamicRetrievalConfig;
    /** Web search fallback when datastore returns insufficient results */
    includeWebFallback?: boolean;
}
