/**
 * buildAssociativeContext — HippoRAG-style recall for the main chat turn.
 *
 * Seeds long-term memory with a keyword recall, then expands each seed through
 * Personalized PageRank over currently-valid memory links, and renders the
 * de-duplicated neighbours as a prompt block. Pure orchestration over
 * `ILtMemoryService` so it can be unit-tested with a fake.
 */
import type { ILtMemoryService } from '../../contracts/persona';

export interface AssociativeContextOptions {
    /** Seed memories fetched by keyword recall (default 3). */
    seeds?: number;
    /** Neighbours expanded per seed (default 3). */
    perSeed?: number;
    /** Max rendered lines (default 8). */
    limit?: number;
}

export async function buildAssociativeContext(
    lt: ILtMemoryService,
    ownerId: string,
    query: string,
    opts: AssociativeContextOptions = {},
): Promise<string> {
    if (!query.trim()) return '';
    const seedCount = opts.seeds ?? 3;
    const perSeed = opts.perSeed ?? 3;
    const maxLines = opts.limit ?? 8;

    const seeds = await lt.recall(ownerId, query, seedCount);
    if (seeds.length === 0) return '';

    const seen = new Set(seeds.map((s) => s.id));
    const lines: string[] = [];
    for (const seed of seeds) {
        if (lines.length >= maxLines) break;
        const hits = await lt.associativeRecall(seed.id, { limit: perSeed });
        for (const hit of hits) {
            if (lines.length >= maxLines) break;
            if (seen.has(hit.memory.id)) continue;
            seen.add(hit.memory.id);
            lines.push(`- ${hit.memory.content} (via ${seed.content.slice(0, 60)})`);
        }
    }

    return lines.length > 0 ? `[ASSOCIATIVE MEMORY]\n${lines.join('\n')}\n\n` : '';
}
