import type { ProviderResponse, SafetyRating, ToolCall } from '../core/types';
import type { GeminiResponse, GeminiCandidate, StreamMeta } from './gemini-types';
import { rootLogger } from '../../kernel/services/logger-service';

const LOGGER = rootLogger.child('GeminiResponseMapper');

const BLOCKED_REASONS = new Set([
    'SAFETY',
    'RECITATION',
    'LANGUAGE',
    'BLOCKLIST',
    'PROHIBITED_CONTENT',
    'SPII',
]);

export function extractTokenCount(data: GeminiResponse): number {
    const meta = data.usageMetadata;
    if (meta?.totalTokenCount) return meta.totalTokenCount;
    if (meta?.promptTokenCount || meta?.candidatesTokenCount) {
        return (meta.promptTokenCount ?? 0) + (meta.candidatesTokenCount ?? 0);
    }
    const textLen =
        data.candidates?.[0]?.content?.parts?.reduce((s, p) => s + (p.text?.length ?? 0), 0) ?? 0;
    return Math.ceil(textLen / 4);
}

export function extractCandidateMeta(candidate: GeminiCandidate | undefined): {
    finishReason: ProviderResponse['finishReason'];
    safetyRatings: SafetyRating[];
    blocked: boolean;
} {
    const finishReason = candidate?.finishReason as ProviderResponse['finishReason'] | undefined;
    const safetyRatings = (candidate?.safetyRatings ?? []).map((r) => ({
        category: r.category,
        probability: r.probability,
        blocked: r.blocked,
    }));
    const blocked = BLOCKED_REASONS.has(finishReason ?? '');
    return { finishReason, safetyRatings, blocked };
}

export function extractGroundingMetadata(
    data: GeminiResponse,
): ProviderResponse['groundingMetadata'] {
    const gm = data.groundingMetadata;
    if (!gm) return undefined;
    return {
        groundingChunks: gm.groundingChunks?.map((c) => ({
            web: c.web ? { uri: c.web.uri, title: c.web.title } : undefined,
        })),
        groundingSupports: gm.groundingSupports?.map((s) => ({
            segment: s.segment,
            groundingChunkIndices: s.groundingChunkIndices,
            confidenceScores: s.confidenceScores,
        })),
        webSearchQueries: gm.webSearchQueries,
    };
}

export function toProviderResponse(data: GeminiResponse, latency: number): ProviderResponse {
    const candidate = data.candidates?.[0];
    const { finishReason, safetyRatings, blocked } = extractCandidateMeta(candidate);

    const pf = data.promptFeedback;

    if (!data.candidates || data.candidates.length === 0) {
        if (pf?.blockReason) {
            const errMsg = `Response blocked by Gemini. Reason: ${pf.blockReason}${pf.blockReasonMessage ? ` — ${pf.blockReasonMessage}` : ''}.`;
            if (import.meta.env.DEV) {
                LOGGER.warn('GeminiResponseMapper', `blocked — ${errMsg}`);
            }
            return {
                content: '',
                finishReason,
                safetyRatings,
                latency,
                tokens: extractTokenCount(data),
                error: errMsg,
                groundingMetadata: extractGroundingMetadata(data),
            };
        }
        if (import.meta.env.DEV) {
            LOGGER.warn('GeminiResponseMapper', 'no candidates, no blockReason — returning empty');
        }
        return {
            content: '',
            finishReason,
            safetyRatings,
            latency,
            tokens: extractTokenCount(data),
            error: 'Empty response — no candidates and no block reason',
            groundingMetadata: extractGroundingMetadata(data),
        };
    }

    const toolCalls: ToolCall[] = [];
    const parts = candidate?.content?.parts || [];
    let content = '';
    const callCountByName = new Map<string, number>();

    for (const part of parts) {
        if (part.text) {
            content += part.text;
        }
        if (part.functionCall) {
            const name = part.functionCall.name;
            const idx = (callCountByName.get(name) ?? 0) + 1;
            callCountByName.set(name, idx);
            toolCalls.push({
                id: `gemini-call-${name}-${idx}`,
                type: 'function',
                function: {
                    name,
                    arguments: JSON.stringify(part.functionCall.args || {}),
                },
            });
        }
    }

    const finalFinishReason = toolCalls.length > 0 ? ('TOOL_CALLS' as const) : finishReason;

    return {
        content,
        finishReason: finalFinishReason,
        safetyRatings,
        latency,
        tokens: extractTokenCount(data),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        error: blocked
            ? `Response blocked by Gemini. Reason: ${finishReason}. Check safetyRatings for details.`
            : undefined,
        groundingMetadata: extractGroundingMetadata(data),
    };
}

export function extractChunkText(parsed: Record<string, unknown>): string {
    const chunk = parsed as {
        candidates?: Array<{
            content?: { parts?: Array<{ text?: string; functionCall?: unknown }> };
        }>;
    };
    const parts = chunk.candidates?.[0]?.content?.parts || [];
    let text = '';
    for (const part of parts) {
        if (part.text) {
            text += part.text;
        }
        if (part.functionCall) {
            const fc = part.functionCall as { name?: string; args?: Record<string, unknown> };
            text += `\n[Function Call: ${fc.name} with ${JSON.stringify(fc.args || {})}]\n`;
        }
    }
    return text;
}

export function extractStreamMeta(parsed: Record<string, unknown>): StreamMeta | null {
    const chunk = parsed as {
        candidates?: Array<{
            finishReason?: string;
            safetyRatings?: Array<{ category: string; probability: string; blocked?: boolean }>;
        }>;
        usageMetadata?: {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
            totalTokenCount?: number;
        };
    };
    const candidate = chunk.candidates?.[0];
    const hasCandidateMeta = candidate?.finishReason || candidate?.safetyRatings?.length;
    const hasUsageMeta =
        chunk.usageMetadata &&
        (chunk.usageMetadata.promptTokenCount || chunk.usageMetadata.totalTokenCount);
    if (!hasCandidateMeta && !hasUsageMeta) return null;
    const meta: StreamMeta = {};
    if (candidate?.finishReason)
        meta.finishReason = candidate.finishReason as StreamMeta['finishReason'];
    if (candidate?.safetyRatings?.length) {
        meta.safetyRatings = candidate.safetyRatings.map(
            (r: { category: string; probability: string; blocked?: boolean }) => ({
                category: r.category,
                probability: r.probability as 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH',
                blocked: r.blocked,
            }),
        );
    }
    if (chunk.usageMetadata) {
        meta.usageMetadata = {
            promptTokenCount: chunk.usageMetadata.promptTokenCount,
            candidatesTokenCount: chunk.usageMetadata.candidatesTokenCount,
            totalTokenCount: chunk.usageMetadata.totalTokenCount,
        };
    }
    return meta;
}
