import { parseSSEStream } from '../http/sse-parser';
import { extractChunkText, extractStreamMeta } from './gemini-response-mapper';
import type { StreamMeta } from './gemini-types';
import type { ToolCall } from '../core/types';

/**
 * Gemini streams a function call as a whole `functionCall` part (unlike
 * OpenAI-style deltas), so collecting them is a simple append. They still have
 * to be reported through `meta.toolCalls`, otherwise a streamed agent turn
 * loses its tool calls and never acts.
 */
function collectFunctionCalls(parsed: Record<string, unknown>, calls: ToolCall[]): void {
    const chunk = parsed as {
        candidates?: Array<{
            content?: {
                parts?: Array<{ functionCall?: { name?: string; args?: Record<string, unknown> } }>;
            };
        }>;
    };
    const parts = chunk.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
        const call = part.functionCall;
        if (!call?.name) continue;
        calls.push({
            id: `gemini_call_${calls.length}`,
            type: 'function',
            function: {
                name: call.name,
                arguments: JSON.stringify(call.args ?? {}),
            },
        });
    }
}

export class GeminiStreamParser {
    static async parse(
        response: Response,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        idleTimeoutMs = 15000,
    ): Promise<void> {
        const calls: ToolCall[] = [];
        await parseSSEStream(
            response,
            onChunk,
            (parsed) => {
                collectFunctionCalls(parsed, calls);
                return extractChunkText(parsed);
            },
            (parsed) => {
                const meta = extractStreamMeta(parsed);
                if (!meta && calls.length === 0) return;
                onChunk('', {
                    ...(meta ?? {}),
                    ...(calls.length > 0 ? { toolCalls: calls.slice() } : {}),
                });
            },
            { signal, idleTimeoutMs },
        );
    }
}
