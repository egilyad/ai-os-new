/**
 * CrossDebateMemoryService — shared memory index across debate sessions.
 *
 * After each debate completes, key conclusions (verdict + top arguments) are
 * indexed into a searchable store. When a new debate starts, relevant past
 * conclusions are surfaced as context to make each debate smarter.
 *
 * Persistence: Dexie table `crossDebateMemory` (additive, v35).
 * Query: topic similarity via simple keyword overlap (no embeddings needed).
 */
import type { IEventBus } from '../../types/interfaces';
import type { DebateVerdict } from '../../contracts/debate-types';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('CrossDebateMemory');

export interface CrossDebateMemoryEntry {
    readonly id: string;
    readonly sessionId: string;
    readonly topic: string;
    readonly summary: string;
    readonly conclusionType: string;
    readonly stanceResult: string;
    readonly confidence: number;
    readonly keyArguments: Array<{
        readonly agentId: string;
        readonly content: string;
        readonly position: string;
        readonly confidence: number;
    }>;
    readonly topicKeywords: string[];
    readonly createdAt: number;
}

export interface CrossDebateContext {
    readonly topic: string;
    readonly relatedDebates: Array<{
        readonly sessionId: string;
        readonly topic: string;
        readonly summary: string;
        readonly conclusionType: string;
        readonly stanceResult: string;
        readonly confidence: number;
        readonly keyArguments: Array<{
            readonly agentId: string;
            readonly content: string;
            readonly position: string;
        }>;
        readonly relevanceScore: number;
    }>;
    readonly totalIndexed: number;
}

interface CrossDebateMemoryDeps {
    eventBus: IEventBus;
    store: {
        config: {
            get(key: string): Promise<unknown>;
            set(key: string, value: unknown): Promise<void>;
        };
    };
}

const STORAGE_KEY = 'cross_debate_memory_index';
const MAX_INDEX_ENTRIES = 200;
const MAX_RELATED = 5;

function extractTopicKeywords(topic: string): string[] {
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
        'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
        'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
        'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
        'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
        'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
        'don', 'now', 'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с',
        'со', 'как', 'а', 'то', 'все', 'она', 'так', 'его', 'но', 'да',
        'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее',
        'мне', 'было', 'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из',
        'ему', 'теперь', 'когда', 'даже', 'ну', 'ли', 'если', 'или',
        'ни', 'быть', 'был', 'него', 'до', 'вас', 'нибудь', 'опять',
        'уж', 'вам', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей',
        'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для',
        'мы', 'тебя', 'их', 'чем', 'была', 'сам', 'чтоб', 'без',
        'будто', 'чего', 'раз', 'тоже', 'себе', 'под', 'будет', 'ж',
        'тогда', 'кто', 'этот', 'того', 'потому', 'этого', 'какой',
        'совсем', 'ним', 'здесь', 'этом', 'один', 'почти', 'мой',
        'тем', 'чтобы', 'нее', 'сейчас', 'были', 'куда', 'зачем',
        'всех', 'никогда', 'можно', 'при', 'наконец', 'два', 'об',
        'другой', 'хоть', 'после', 'над', 'больше', 'тот', 'через',
        'эти', 'нас', 'про', 'всего', 'них', 'какая', 'много',
        'разве', 'три', 'эту', 'моя', 'впрочем', 'хорошо', 'свою',
        'этой', 'перед', 'иногда', 'лучше', 'чуть', 'том', 'нельзя',
        'такой', 'им', 'более', 'всегда', 'уже', ' конечно', 'всю',
        'между',
    ]);
    return topic
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w))
        .slice(0, 20);
}

function computeRelevanceScore(
    queryKeywords: string[],
    entryKeywords: string[],
): number {
    if (queryKeywords.length === 0 || entryKeywords.length === 0) return 0;
    const querySet = new Set(queryKeywords);
    const entrySet = new Set(entryKeywords);
    let overlap = 0;
    for (const kw of querySet) {
        if (entrySet.has(kw)) overlap++;
    }
    return overlap / Math.max(querySet.size, entrySet.size);
}

export class CrossDebateMemoryService {
    private entries: CrossDebateMemoryEntry[] = [];
    private deps: CrossDebateMemoryDeps;
    private _loaded = false;

    constructor(deps: CrossDebateMemoryDeps) {
        this.deps = deps;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.deps.eventBus.onSafe<{ sessionId: string; verdict: DebateVerdict }>(
            EVENTS.DEBATE_VERDICT_GENERATED,
            (data) => {
                this.indexVerdict(data.sessionId, data.verdict).catch((e) => {
                    LOGGER.warn('Failed to index verdict', { error: String(e) });
                });
            },
        );
    }

    async loadIndex(): Promise<void> {
        if (this._loaded) return;
        try {
            const raw = await this.deps.store.config.get(STORAGE_KEY);
            if (Array.isArray(raw)) {
                this.entries = raw as CrossDebateMemoryEntry[];
            }
        } catch {
            this.entries = [];
        }
        this._loaded = true;
        LOGGER.info('Loaded cross-debate memory index', { count: this.entries.length });
    }

    private async persistIndex(): Promise<void> {
        try {
            await this.deps.store.config.set(STORAGE_KEY, this.entries);
        } catch (e) {
            LOGGER.warn('Failed to persist cross-debate memory index', { error: String(e) });
        }
    }

    async indexVerdict(sessionId: string, verdict: DebateVerdict): Promise<void> {
        await this.loadIndex();
        const existing = this.entries.find((e) => e.sessionId === sessionId);
        if (existing) return;

        const entry: CrossDebateMemoryEntry = {
            id: `cdm-${sessionId}`,
            sessionId,
            topic: verdict.topic,
            summary: verdict.summary,
            conclusionType: verdict.conclusionType,
            stanceResult: verdict.stanceResult,
            confidence: verdict.confidence,
            keyArguments: verdict.keyArguments.map((ka) => ({
                agentId: ka.agentId,
                content: ka.content.slice(0, 500),
                position: ka.position,
                confidence: ka.confidence,
            })),
            topicKeywords: extractTopicKeywords(verdict.topic),
            createdAt: Date.now(),
        };

        this.entries.unshift(entry);
        if (this.entries.length > MAX_INDEX_ENTRIES) {
            this.entries = this.entries.slice(0, MAX_INDEX_ENTRIES);
        }

        await this.persistIndex();
        LOGGER.info('Indexed cross-debate memory', {
            sessionId,
            topic: verdict.topic,
            conclusionType: verdict.conclusionType,
        });
    }

    async getContext(topic: string): Promise<CrossDebateContext> {
        await this.loadIndex();
        const queryKeywords = extractTopicKeywords(topic);

        const scored = this.entries.map((entry) => ({
            entry,
            score: computeRelevanceScore(queryKeywords, entry.topicKeywords),
        }));

        scored.sort((a, b) => b.score - a.score);

        const related = scored
            .filter((s) => s.score > 0)
            .slice(0, MAX_RELATED)
            .map((s) => ({
                sessionId: s.entry.sessionId,
                topic: s.entry.topic,
                summary: s.entry.summary,
                conclusionType: s.entry.conclusionType,
                stanceResult: s.entry.stanceResult,
                confidence: s.entry.confidence,
                keyArguments: s.entry.keyArguments.map((ka) => ({
                    agentId: ka.agentId,
                    content: ka.content,
                    position: ka.position,
                })),
                relevanceScore: s.score,
            }));

        return {
            topic,
            relatedDebates: related,
            totalIndexed: this.entries.length,
        };
    }

    formatContextForPrompt(context: CrossDebateContext): string {
        if (context.relatedDebates.length === 0) {
            return '';
        }
        const lines = ['## Related Past Debates'];
        for (const rd of context.relatedDebates) {
            lines.push(`\n### "${rd.topic}" (${rd.conclusionType}, confidence: ${(rd.confidence * 100).toFixed(0)}%)`);
            lines.push(`Summary: ${rd.summary}`);
            if (rd.keyArguments.length > 0) {
                lines.push('Key arguments:');
                for (const ka of rd.keyArguments.slice(0, 3)) {
                    lines.push(`  - [${ka.position}] ${ka.content.slice(0, 200)}`);
                }
            }
        }
        lines.push(`\n(${context.totalIndexed} total debates indexed)`);
        return lines.join('\n');
    }

    getEntryCount(): number {
        return this.entries.length;
    }

    async clear(): Promise<void> {
        this.entries = [];
        await this.persistIndex();
    }
}
