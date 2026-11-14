export interface WikiChunk {
    index: number;
    text: string;
    start: number;
    end: number;
}

export interface WikiChunkerOptions {
    size?: number;
    overlap?: number;
}

const DEFAULT_SIZE = 3200;
const DEFAULT_OVERLAP = 200;

/**
 * WikiChunkerService — F1: split long text into overlapping chunks.
 * Used by ingest/analyze so LLM inputs stay bounded and recall can address
 * sub-document spans.
 */
export class WikiChunkerService {
    chunkText(text: string, opts: WikiChunkerOptions = {}): WikiChunk[] {
        const size = opts.size ?? DEFAULT_SIZE;
        const overlap = opts.overlap ?? DEFAULT_OVERLAP;
        if (size <= 0) return [];
        if (text.length <= size) {
            return [{ index: 0, text, start: 0, end: text.length }];
        }
        const step = Math.max(1, size - overlap);
        const chunks: WikiChunk[] = [];
        let start = 0;
        let index = 0;
        while (start < text.length) {
            const end = Math.min(text.length, start + size);
            chunks.push({ index: index++, text: text.slice(start, end), start, end });
            if (end >= text.length) break;
            start += step;
        }
        return chunks;
    }

    /** Split on paragraph boundaries (best-effort), then chunk too-long ones. */
    splitIntoChunks(text: string, opts: WikiChunkerOptions = {}): WikiChunk[] {
        if (text.length <= (opts.size ?? DEFAULT_SIZE)) {
            return this.chunkText(text, opts);
        }
        const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
        const out: WikiChunk[] = [];
        let cursor = 0;
        for (const p of paragraphs) {
            const idx = text.indexOf(p, cursor);
            const start = idx >= 0 ? idx : cursor;
            const end = start + p.length;
            cursor = end;
            if (p.length <= (opts.size ?? DEFAULT_SIZE)) {
                out.push({ index: out.length, text: p, start, end });
            } else {
                for (const c of this.chunkText(p, opts)) {
                    out.push({
                        index: out.length,
                        text: c.text,
                        start: start + c.start,
                        end: start + c.end,
                    });
                }
            }
        }
        if (out.length === 0) return this.chunkText(text, opts);
        return out;
    }
}

export const wikiChunkerService = new WikiChunkerService();
