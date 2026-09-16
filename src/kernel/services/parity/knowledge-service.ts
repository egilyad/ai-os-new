/**
 * KnowledgeService — GAP E.2 (RAG over url/text sources, offline-first).
 *
 * Sources are chunked (paragraphs ≤ 600 chars) and retrieved with
 * token-overlap scoring; every hit carries its source title for citation.
 * URL ingestion is best-effort fetch (CORS/network may refuse — the source
 * still registers with whatever content was provided).
 */
import type { ParityRepository } from '../../dal/parity-repository';
import type { IEmbeddingPort, IKnowledgeService } from '../../contracts/parity';
import type { KnowledgeSource } from '../../types/parity-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import type { IEventBus } from '../../types/interfaces';

const LOGGER = rootLogger.child('Knowledge');

function cosine(a: number[], b: number[]): number {
    let dot = 0;
    let na = 0;
    let nb = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
        dot += (a[i] ?? 0) * (b[i] ?? 0);
        na += (a[i] ?? 0) * (a[i] ?? 0);
        nb += (b[i] ?? 0) * (b[i] ?? 0);
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function now(): number {
    return Date.now();
}

function chunkText(text: string, max = 600): string[] {
    const paras = text
        .split(/\n\s*\n/u)
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.length > 0);
    const out: string[] = [];
    for (const p of paras) {
        if (p.length <= max) {
            out.push(p);
            continue;
        }
        for (let i = 0; i < p.length; i += max) out.push(p.slice(i, i + max));
    }
    return out.slice(0, 200);
}

function tokens(s: string): Set<string> {
    return new Set(
        s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2),
    );
}

function score(query: string, chunk: string): number {
    const q = tokens(query);
    if (q.size === 0) return 0;
    const c = tokens(chunk);
    let hit = 0;
    for (const t of q) if (c.has(t)) hit += 1;
    return hit / q.size;
}

export class KnowledgeService implements IKnowledgeService {
    private embedder?: IEmbeddingPort;
    private vectors = new Map<string, number[]>();

    constructor(
        private repo: ParityRepository,
        private events: IEventBus,
    ) {}

    /** GAP E.3 — attach embeddings; scores blend 0.6 vector + 0.4 token. */
    setEmbedder(embedder: IEmbeddingPort): void {
        this.embedder = embedder;
        this.vectors.clear();
    }

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async addSource(input: {
        kind: 'url' | 'text';
        title: string;
        uri?: string;
        content?: string;
    }): Promise<KnowledgeSource> {
        let content = input.content ?? '';
        if (input.kind === 'url' && input.uri && !content) {
            try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 12000);
                try {
                    const res = await fetch(input.uri, { signal: ctrl.signal });
                    if (res.ok) {
                        const raw = await res.text();
                        content = raw
                            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim()
                            .slice(0, 60000);
                    }
                } finally {
                    clearTimeout(timer);
                }
            } catch (e) {
                LOGGER.warn('url ingest failed (source registered without content)', {
                    uri: input.uri,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        const source: KnowledgeSource = {
            id: genId('know'),
            kind: input.kind,
            title: input.title.slice(0, 200),
            uri: input.uri,
            chunks: chunkText(content),
            createdAt: now(),
        };
        await this.repo.putSource(source);
        this.events.emit(EVENTS.KNOWLEDGE_ADDED, {
            sourceId: source.id,
            chunks: source.chunks.length,
        });
        return source;
    }

    async listSources(): Promise<KnowledgeSource[]> {
        return this.repo.listSources();
    }

    async removeSource(id: string): Promise<void> {
        await this.repo.deleteSource(id);
    }

    async retrieve(
        query: string,
        limit = 5,
    ): Promise<Array<{ sourceId: string; title: string; chunk: string }>> {
        const sources = await this.repo.listSources();
        const scored: Array<{ sourceId: string; title: string; chunk: string; s: number }> = [];
        let queryVec: number[] | undefined;
        if (this.embedder) {
            try {
                const vecs = await this.embedder.embed([query]);
                queryVec = vecs[0];
            } catch (e) {
                LOGGER.warn('embedder query failed, token-only retrieval', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        for (const s of sources) {
            for (let i = 0; i < s.chunks.length; i++) {
                const chunk = s.chunks[i] as string;
                const tokenScore = score(query, chunk);
                let final = tokenScore;
                if (queryVec) {
                    const key = `${s.id}:${i}`;
                    let vec = this.vectors.get(key);
                    if (!vec) {
                        try {
                            const vecs = await this.embedder!.embed([chunk]);
                            vec = vecs[0];
                            if (vec) this.vectors.set(key, vec);
                        } catch {
                            vec = undefined;
                        }
                    }
                    if (vec) final = 0.6 * cosine(queryVec, vec) + 0.4 * tokenScore;
                }
                if (final > 0) scored.push({ sourceId: s.id, title: s.title, chunk, s: final });
            }
        }
        scored.sort((a, b) => b.s - a.s);
        return scored.slice(0, Math.max(1, limit)).map(({ sourceId, title, chunk }) => ({
            sourceId,
            title,
            chunk,
        }));
    }
}
