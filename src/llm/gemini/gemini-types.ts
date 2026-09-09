export type GeminiFinishReason =
    | 'STOP'
    | 'MAX_TOKENS'
    | 'SAFETY'
    | 'RECITATION'
    | 'LANGUAGE'
    | 'BLOCKLIST'
    | 'PROHIBITED_CONTENT'
    | 'SPII'
    | 'MALFORMED_FUNCTION_CALL'
    | 'OTHER';

export interface GeminiSafetyRating {
    category: string;
    probability: 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH';
    blocked?: boolean;
}

export interface GeminiFunctionCall {
    name: string;
    args: Record<string, unknown>;
}

export interface GeminiFunctionResponse {
    name: string;
    response: Record<string, unknown>;
}

export interface GeminiInlineData {
    mimeType: string;
    data: string; // base64-encoded
}

export interface GeminiPart {
    text?: string;
    inlineData?: GeminiInlineData;
    functionCall?: GeminiFunctionCall;
    functionResponse?: GeminiFunctionResponse;
}

export interface GeminiCandidate {
    content?: { parts?: GeminiPart[] };
    finishReason?: GeminiFinishReason;
    safetyRatings?: GeminiSafetyRating[];
}

export interface GeminiUsageMetadata {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
}

export interface GeminiGroundingChunk {
    web?: { uri: string; title: string };
}

export interface GeminiGroundingSupport {
    segment: { text: string; startIndex?: number; endIndex?: number };
    groundingChunkIndices: number[];
    confidenceScores: number[];
}

export interface GeminiGroundingMetadata {
    groundingChunks?: GeminiGroundingChunk[];
    groundingSupports?: GeminiGroundingSupport[];
    webSearchQueries?: string[];
}

export type GeminiBlockReason =
    | 'BLOCKED_REASON_UNSPECIFIED'
    | 'SAFETY'
    | 'OTHER'
    | 'BLOCKLIST'
    | 'PROHIBITED_CONTENT'
    | 'IMAGE_SAFETY';

export interface GeminiPromptFeedback {
    blockReason?: GeminiBlockReason;
    blockReasonMessage?: string;
    safetyRatings?: GeminiSafetyRating[];
}

export interface GeminiResponse {
    candidates?: GeminiCandidate[];
    promptFeedback?: GeminiPromptFeedback;
    usageMetadata?: GeminiUsageMetadata;
    groundingMetadata?: GeminiGroundingMetadata;
}

export interface GeminiStreamChunk {
    candidates?: Array<{
        content?: { parts?: GeminiPart[] };
        finishReason?: GeminiFinishReason;
        safetyRatings?: GeminiSafetyRating[];
    }>;
}

export interface GeminiRequestBody {
    cachedContent?: string;
    contents: Array<{
        role: 'user' | 'model';
        parts: GeminiPart[];
    }>;
    system_instruction?: { parts: Array<{ text: string }> };
    tools?: Array<{
        functionDeclarations?: Array<{
            name: string;
            description: string;
            parameters?: {
                type: string;
                properties?: Record<string, unknown>;
                required?: string[];
            };
        }>;
    }>;
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
        stopSequences?: string[];
        responseMimeType?: 'text/plain' | 'application/json';
        responseSchema?: unknown;
    };
    safetySettings?: Array<{
        category: string;
        threshold: string;
    }>;
    /** Enable deep thinking (Gemini 2.5 Flash/Pro) */
    thinkingConfig?: {
        type: 'ENABLED' | 'DISABLED';
    };
    /** Ground the response in Google Search */
    groundingConfig?: {
        sources: Array<{
            type: 'WEB' | 'VERTEX_AI_SEARCH';
        }>;
    };
}

export interface StreamMeta {
    finishReason?: GeminiFinishReason;
    safetyRatings?: Array<{
        category: string;
        probability: 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH';
        blocked?: boolean;
    }>;
    usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
    };
}
