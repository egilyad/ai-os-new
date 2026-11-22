/**
 * Mnestic scoring (Generative Agents-inspired, H1+H2).
 *
 * H1 — retrieval score is recency × importance × relevance (all 0..1),
 * with a decay factor for older memories. H2 — accumulated salience above a
 * threshold triggers a reflection pass; themes are derived from the most
 * salient hits so the caller can feed them into an LLM prompt.
 */
import type {
    IMnesticService,
    MnesticEntry,
    WeightedHit,
    ReflectionResult,
} from '../../contracts/mnestic';

const HOUR_MS = 60 * 60 * 1000;
const DECAY_HOURS = 24;

export class MnesticService implements IMnesticService {
    async init(): Promise<void> {}

    async destroy(): Promise<void> {}

    rank(entries: MnesticEntry[], now = Date.now()): WeightedHit[] {
        return entries
            .map((entry) => {
                const ageHours = Math.max(
                    0,
                    (now - (entry.lastAccessedAt ?? entry.createdAt)) / HOUR_MS,
                );
                const recency = Math.exp(-ageHours / DECAY_HOURS);
                const importance = Math.max(0, Math.min(1, entry.importance));
                const relevance = Math.max(0, Math.min(1, entry.relevance ?? 0.5));
                return { entry, score: recency * importance * relevance };
            })
            .sort((a, b) => b.score - a.score);
    }

    maybeReflect(hits: WeightedHit[], threshold = 1.2): ReflectionResult {
        const score = hits.slice(0, 8).reduce((sum, h) => sum + h.score, 0);
        const triggered = score >= threshold;
        const themes = triggered ? hits.slice(0, 5).map((h) => h.entry.text.slice(0, 80)) : [];
        return { triggered, score, themes };
    }
}
