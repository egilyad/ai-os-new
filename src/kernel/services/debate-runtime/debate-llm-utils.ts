/**
 * Strip speaker label prefixes from LLM response.
 * Agents copy the history format `[Name (self/opponent)]: content` or bare
 * `[Name]: content` including the wrong speaker's name. Strip iteratively
 * until no more prefix patterns remain at the start.
 *
 * Also handles Gemini timestamp prefix (e.g. "19:40\n[Name]: ...") by
 * stripping leading timestamps before the prefix pattern matching.
 */
export function stripSpeakerPrefix(content: string): string {
    // Strip leading timestamps that Gemini sometimes prepends before the
    // speaker label (e.g. "19:40\n[Economist / Экономист]: Коллеги...")
    const TIMESTAMP = /^\d{1,2}:\d{2}(?::\d{2})?\s*\n*/;
    const PREFIX = /^\[[^\]]+(?:\s+(?:self|opponent|я|оппонент))?\]:\s*/i;
    let prev: string;
    let result = content.replace(TIMESTAMP, '');
    do {
        prev = result;
        result = result.replace(PREFIX, '');
    } while (result !== prev);
    return result;
}

/**
 * Compute Jaccard similarity of word sets between two texts.
 */
export function jaccardText(a: string, b: string): number {
    const norm = (t: string) =>
        new Set(
            t
                .toLowerCase()
                .replace(/[^a-zа-яё0-9\s]/g, '')
                .split(/\s+/)
                .filter((w) => w.length > 3),
        );
    const aWords = norm(a);
    const bWords = norm(b);
    if (aWords.size < 3 || bWords.size < 3) return 0;
    const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
    const union = new Set([...aWords, ...bWords]);
    return intersection.size / union.size;
}

/**
 * Check if response is a near-duplicate of any recent argument from other agents.
 * Prevents content repetition cascade where one agent's response gets copied
 * verbatim by subsequent agents. Checks both full text and opening (first 200 chars)
 * separately — identical openings are treated as duplicates even if middles diverge.
 */
export function isCrossAgentDuplicate(
    content: string,
    recentSteps: Array<{ agentId: string; content: string }>,
    currentAgentId: string,
): boolean {
    const opening = content.slice(0, 200);

    for (const step of recentSteps) {
        if (step.agentId === currentAgentId) continue;

        // Full-text check: threshold 0.45 (was 0.55 — lowered to catch more
        // subtle duplicates that share the same framing but differ in examples)
        if (jaccardText(content, step.content) > 0.45) return true;

        // Opening check: if first 200 chars overlap > 0.3, it's a copied framing
        if (jaccardText(opening, step.content.slice(0, 200)) > 0.3) return true;
    }
    return false;
}

export function estimateConfidence(content: string): number {
    const certaintyMarkers =
        /\b(definitely|certainly|undoubtedly|absolutely|clearly|obviously|always|never|must|without doubt|unquestionably|undeniably|in fact|indeed)\b/gi;
    const hedgingMarkers =
        /\b(perhaps|possibly|might|could|seems|appears|i think|i believe|probably|likely|somewhat|generally|often|sometimes|i suspect|i guess|i assume|i suppose|it seems|it appears|maybe)\b/gi;
    const certainty = (content.match(certaintyMarkers) || []).length;
    const hedging = (content.match(hedgingMarkers) || []).length;
    const score = 0.5 + (certainty - hedging) * 0.05;
    return Math.max(0.3, Math.min(0.95, score));
}
