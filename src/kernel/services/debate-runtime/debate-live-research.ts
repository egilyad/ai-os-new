import type { IGeminiResearchService } from '../../contracts/gemini-research';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('DebateLiveResearch');

// One grounded search per round, shared by all participants via cache.
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;
const FETCH_TIMEOUT_MS = 25000;
const MAX_SOURCES = 3;
const MAX_ANSWER_CHARS = 600;
const MAX_TITLE_CHARS = 80;
const MAX_SNIPPET_CHARS = 200;
const MAX_URI_CHARS = 500;
const MAX_QUERY_CHARS = 300;

const cache = new Map<string, { at: number; text: string }>();

/** Test-only: reset the per-round cache between cases. */
export function clearLiveResearchCache(): void {
    cache.clear();
}

function buildQuery(topic: string, round: number, opponentSnippets: string[]): string {
    const t = topic.slice(0, 200);
    if (round <= 1 || opponentSnippets.length === 0) return t;
    return `${t} — ${opponentSnippets.join(' | ')}`.slice(0, MAX_QUERY_CHARS);
}

function formatBlock(
    query: string,
    answer: string,
    sources: Array<{ title: string; uri: string; snippet: string }>,
    language: string,
): string {
    const intro =
        language === 'Russian'
            ? '### 🔎 Живой поиск (проверенные веб-источники)\nЦитируй эти источники как [название](url). Не выдумывай других URL.'
            : '### 🔎 Live web research (verified sources)\nCite these sources as [title](url). Do not invent other URLs.';
    const lines: string[] = [intro, `Query: ${query}`];
    if (answer.trim()) lines.push(`Summary: ${answer.slice(0, MAX_ANSWER_CHARS)}`);
    for (const s of sources.slice(0, MAX_SOURCES)) {
        const title = s.title.slice(0, MAX_TITLE_CHARS).replace(/[[\]]/g, '');
        const uri = s.uri.slice(0, MAX_URI_CHARS);
        lines.push(`- [${title}](${uri}): ${s.snippet.slice(0, MAX_SNIPPET_CHARS)}`);
    }
    return `\n\n${lines.join('\n')}`;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    const guarded = p.then(
        (v) => ({ ok: true as const, v }),
        () => ({ ok: false as const }),
    );
    const winner = await Promise.race([
        guarded,
        new Promise<{ ok: false }>((resolve) => setTimeout(() => resolve({ ok: false }), ms)),
    ]);
    if (!winner.ok) throw new Error('live research timeout');
    return winner.v;
}

export interface LiveResearchInput {
    sessionId: string;
    round: number;
    topic: string;
    opponentSnippets: string[];
    language: string;
    /** Override for tests; defaults to FETCH_TIMEOUT_MS. */
    timeoutMs?: number;
}

/**
 * Fetch one grounded web search for the round (cached per session+round so
 * every participant shares it) and format it as a prompt block.
 * Returns undefined when unavailable/failing — the debate proceeds unaffected.
 */
export async function getLiveResearchText(
    service: IGeminiResearchService | undefined,
    input: LiveResearchInput,
): Promise<string | undefined> {
    if (!service || !service.isAvailable || input.round < 1) return undefined;
    const key = `${input.sessionId}:r${input.round}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.text;
    const query = buildQuery(input.topic, input.round, input.opponentSnippets);
    try {
        const res = await withTimeout(
            service.enhancedSearch(query),
            input.timeoutMs ?? FETCH_TIMEOUT_MS,
        );
        if (!res || res.sources.length === 0) return undefined;
        const text = formatBlock(query, res.answer || '', res.sources, input.language);
        cache.set(key, { at: Date.now(), text });
        if (cache.size > MAX_CACHE_ENTRIES) {
            const oldest = [...cache.entries()].sort((a, b) => a[1]!.at - b[1]!.at)[0];
            if (oldest) cache.delete(oldest[0]);
        }
        return text;
    } catch {
        LOGGER.warn('DebateLiveResearch', 'live search skipped', { sessionId: input.sessionId });
        return undefined;
    }
}
