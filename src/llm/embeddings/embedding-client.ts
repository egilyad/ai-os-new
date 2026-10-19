/**
 * EmbeddingClient — OpenAI-compatible embeddings endpoint (`POST {baseUrl}/embeddings`).
 *
 * Works with every provider that exposes the OpenAI embeddings shape: OpenAI,
 * OpenRouter, NVIDIA NIM, Together, Ollama, Gemini's OpenAI-compat endpoint, etc.
 *
 * The client is transport-only: it knows nothing about keys or configuration,
 * the caller supplies baseUrl/apiKey/model.
 */
import { rootLogger } from '../../kernel/services/logger-service';

const LOGGER = rootLogger.child('EmbeddingClient');

export const EMBEDDING_TIMEOUT_MS = 30_000;

export interface EmbeddingRequest {
    baseUrl: string;
    apiKey: string;
    model: string;
    texts: string[];
    /** Optional dimension hint (providers that support Matryoshka truncation). */
    dimensions?: number;
    signal?: AbortSignal;
}

export interface EmbeddingClientDeps {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
}

interface EmbeddingResponsePayload {
    data?: Array<{ embedding?: unknown; index?: number }>;
    error?: { message?: string };
}

function normalize(vector: number[]): number[] {
    let norm = 0;
    for (const v of vector) norm += v * v;
    norm = Math.sqrt(norm);
    if (!norm) return vector;
    return vector.map((v) => v / norm);
}

export class EmbeddingClient {
    private readonly fetchImpl: typeof fetch;
    private readonly timeoutMs: number;

    constructor(deps: EmbeddingClientDeps = {}) {
        this.fetchImpl = deps.fetchImpl ?? globalThis.fetch.bind(globalThis);
        this.timeoutMs = deps.timeoutMs ?? EMBEDDING_TIMEOUT_MS;
    }

    async embed(req: EmbeddingRequest): Promise<number[][]> {
        if (!req.texts.length) return [];
        const base = req.baseUrl.replace(/\/+$/, '');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        const onAbort = (): void => controller.abort();
        req.signal?.addEventListener('abort', onAbort);
        try {
            const body: Record<string, unknown> = {
                model: req.model,
                input: req.texts,
            };
            if (typeof req.dimensions === 'number') body['dimensions'] = req.dimensions;

            const res = await this.fetchImpl(`${base}/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${req.apiKey}`,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(
                    `Embeddings request failed: ${res.status} ${res.statusText}${
                        text ? ` — ${text.slice(0, 200)}` : ''
                    }`,
                );
            }

            const payload = (await res.json()) as EmbeddingResponsePayload;
            const rows = Array.isArray(payload?.data) ? payload.data : [];
            const ordered = rows
                .map((row, idx) => ({
                    idx: typeof row.index === 'number' ? row.index : idx,
                    vector: Array.isArray(row.embedding) ? (row.embedding as number[]) : undefined,
                }))
                .filter((row): row is { idx: number; vector: number[] } => !!row.vector)
                .sort((a, b) => a.idx - b.idx);

            if (ordered.length !== req.texts.length) {
                throw new Error(
                    `Embeddings response mismatch: expected ${req.texts.length} vectors, got ${ordered.length}`,
                );
            }
            return ordered.map((row) => normalize(row.vector));
        } catch (e) {
            LOGGER.warn('EmbeddingClient', 'embed request failed', { error: e });
            throw e instanceof Error ? e : new Error(String(e));
        } finally {
            clearTimeout(timer);
            req.signal?.removeEventListener('abort', onAbort);
        }
    }
}
