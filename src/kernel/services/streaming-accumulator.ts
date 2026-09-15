/**
 * Streaming Accumulator — AGEMS port, Phase 12.7.
 * Accumulates streaming chunks into a complete message.
 */

export interface StreamChunk {
    content?: string;
    done?: boolean;
    error?: string;
    usage?: { promptTokens: number; completionTokens: number };
}

export interface AccumulatedResult {
    content: string;
    done: boolean;
    error?: string;
    chunks: number;
    totalLength: number;
}

export class StreamingAccumulator {
    private chunks: string[] = [];
    private finished = false;
    private error: string | undefined;

    /**
     * Add a chunk to the accumulator.
     */
    addChunk(chunk: StreamChunk): void {
        if (chunk.error) {
            this.error = chunk.error;
            this.finished = true;
            return;
        }
        if (chunk.content) {
            this.chunks.push(chunk.content);
        }
        if (chunk.done) {
            this.finished = true;
        }
    }

    /**
     * Get the accumulated content.
     */
    getResult(): AccumulatedResult {
        const content = this.chunks.join('');
        return {
            content,
            done: this.finished,
            error: this.error,
            chunks: this.chunks.length,
            totalLength: content.length,
        };
    }

    /**
     * Check if accumulation is complete.
     */
    isDone(): boolean {
        return this.finished;
    }

    /**
     * Reset the accumulator.
     */
    reset(): void {
        this.chunks = [];
        this.finished = false;
        this.error = undefined;
    }

    /**
     * Get the current content length.
     */
    getLength(): number {
        return this.chunks.join('').length;
    }

    /**
     * Get the number of chunks received.
     */
    getChunkCount(): number {
        return this.chunks.length;
    }
}
