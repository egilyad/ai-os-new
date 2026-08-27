import { parseSSEStream } from '../http/sse-parser';
import { extractChunkText, extractStreamMeta } from './gemini-response-mapper';
import type { StreamMeta } from './gemini-types';

export class GeminiStreamParser {
    static async parse(
        response: Response,
        onChunk: (chunk: string, meta?: StreamMeta) => void,
        signal?: AbortSignal,
        idleTimeoutMs = 15000,
    ): Promise<void> {
        await parseSSEStream(
            response,
            onChunk,
            extractChunkText,
            (parsed) => {
                const meta = extractStreamMeta(parsed);
                if (meta) onChunk('', meta);
            },
            { signal, idleTimeoutMs },
        );
    }
}
