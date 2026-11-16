import type {
    TopicGraphService,
    TopicGraphDeps,
    IngestPayload,
    TopicCompleteness,
} from '../../contracts/topic-graph';
import type {
    Topic,
    TopicSource,
    TopicClaim,
    TopicConcept,
    TopicRelation,
    TopicEvidence,
    TopicConflict,
    TopicProcessingRun,
} from '../../contracts/topic-graph/types';
import { TopicGraphDB, createTopicGraphDB } from './topic-graph-dexie';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('TopicGraph');

const GENERIC_ID = (() => {
    let n = 0;
    return (prefix: string) => `${prefix}-${Date.now()}-${++n}`;
})();

function fnv1a64(input: string): string {
    let h = 0xcbf29ce484222325n;
    const prime = 0x100000001b3n;
    for (let i = 0; i < input.length; i++) {
        h ^= BigInt(input.charCodeAt(i));
        h = (h * prime) & 0xffffffffffffffffn;
    }
    return h.toString(16).padStart(16, '0');
}

/** Простейший токенизатор + лёгкий стемминг. */
function stem(w: string): string {
    if (w.length > 4 && w.endsWith('ing')) return w.slice(0, -3);
    if (w.length > 3 && w.endsWith('es')) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('ed')) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
}

function tokenize(text: string): Set<string> {
    return new Set(
        text
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .map(stem)
            .filter((w) => w.length > 2 || /^\d+(\.\d+)*$/.test(w)),
    );
}

function jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;
    let inter = 0;
    for (const w of a) if (b.has(w)) inter++;
    const union = a.size + b.size - inter;
    return union === 0 ? 0 : inter / union;
}

const NEGATION_MARKERS = [
    'не',
    'нет',
    'нельзя',
    'неверно',
    'ошибочно',
    'never',
    'cannot',
    'no',
    'not',
    'without',
    'refutes',
    'denies',
    'contradicts',
];

function hasNegation(text: string): boolean {
    const words = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/);
    return NEGATION_MARKERS.some((m) => words.includes(m));
}

/** Jaccard-близость для уверенного автослияния утверждений. */
const DEDUPE_JACCARD_THRESHOLD = 0.6;
/** Cosine-близость эмбеддингов для уверенного автослияния. */
const DEDUPE_EMBEDDING_THRESHOLD = 0.82;
/** Ниже этого порога — не кандидат на объединение. */
const MERGE_CANDIDATE_THRESHOLD = 0.45;
const CONTRADICTION_THRESHOLD = 0.4;

export class TopicGraphServiceImpl implements TopicGraphService {
    private db: TopicGraphDB;

    constructor(
        db?: TopicGraphDB,
        private deps: TopicGraphDeps = {},
    ) {
        this.db = db ?? createTopicGraphDB();
    }

    // ── Topics ──

    async createTopic(title: string, description: string): Promise<Topic> {
        const now = Date.now();
        const topic: Topic = {
            id: GENERIC_ID('topic'),
            title,
            description,
            status: 'active',
            createdAt: now,
            updatedAt: now,
        };
        await this.db.topics.put(topic);
        return topic;
    }

    async listTopics(): Promise<Topic[]> {
        return this.db.topics.toArray();
    }

    async getTopic(id: string): Promise<Topic | undefined> {
        return this.db.topics.get(id);
    }

    async updateTopic(
        id: string,
        patch: Partial<Pick<Topic, 'title' | 'description' | 'status'>>,
    ): Promise<Topic | undefined> {
        const topic = await this.db.topics.get(id);
        if (!topic) return undefined;
        const updated = { ...topic, ...patch, updatedAt: Date.now() };
        await this.db.topics.put(updated);
        return updated;
    }

    async deleteTopic(id: string): Promise<boolean> {
        const topic = await this.db.topics.get(id);
        if (!topic) return false;
        await this.db.topics.delete(id);
        await this.db.topicSources.where('topicId').equals(id).delete();
        await this.db.topicClaims.where('topicId').equals(id).delete();
        await this.db.topicConcepts.where('topicId').equals(id).delete();
        await this.db.topicRelations.where('topicId').equals(id).delete();
        await this.db.topicEvidence.where('topicId').equals(id).delete();
        await this.db.topicConflicts.where('topicId').equals(id).delete();
        await this.db.topicProcessingRuns.where('topicId').equals(id).delete();
        return true;
    }

    // ── Ingest & processing ──

    async ingest(topicId: string, payload: IngestPayload): Promise<TopicProcessingRun> {
        const run: TopicProcessingRun = {
            id: GENERIC_ID('run'),
            topicId,
            sourceIds: [],
            status: 'running',
            stats: { extracted: 0, duplicates: 0, newClaims: 0, conflicts: 0, relations: 0 },
            createdAt: Date.now(),
        };
        await this.db.topicProcessingRuns.put(run);
        try {
            const sha = fnv1a64(`${payload.kind}|${payload.ref}|${payload.content}`);
            const existingSource = await this.db.topicSources
                .where('topicId')
                .equals(topicId)
                .filter((s) => s.sha256 === sha)
                .first();
            if (existingSource) {
                run.status = 'completed';
                run.completedAt = Date.now();
                run.sourceIds = [existingSource.id];
                await this.db.topicProcessingRuns.put(run);
                return run;
            }

            const source: TopicSource = {
                id: GENERIC_ID('src'),
                topicId,
                kind: payload.kind,
                ref: payload.ref,
                title: payload.title,
                sha256: sha,
                content: payload.content,
                importedAt: Date.now(),
                meta: payload.meta,
            };
            await this.db.topicSources.put(source);
            run.sourceIds = [source.id];

                // Извлечение утверждений: LLM (если есть) или фрагменты по предложениям.
                const sentenceUnits: Array<{ sentence: string; start?: number }> = this.deps.llm
                    ? (await this.extractClaimsWithLlm(payload.content)).map((sentence) => ({ sentence }))
                    : splitIntoSentencesWithOffsets(payload.content);
                const existingClaims = await this.db.topicClaims.where('topicId').equals(topicId).toArray();
                const existingEmbeddings = existingClaims.map((c) => c.embedding).filter(Boolean) as number[][];
                const newClaims: TopicClaim[] = [];
                const evidenceEntries: TopicEvidence[] = [];
                for (const unit of sentenceUnits) {
                    const text = normalizeClaim(unit.sentence);
                    if (text.length < 12) continue;

                    // Эмбедддинг-близость (если доступен) поверх jaccard.
                    let embedding: number[] | undefined;
                    if (this.deps.embedder) {
                        try {
                            const vecs = await this.deps.embedder.embed([text]);
                            embedding = vecs[0];
                        } catch {
                            embedding = undefined;
                        }
                    }
                    const found = findDuplicate(existingClaims, text, embedding, existingEmbeddings);
                    if (found.dup) {
                        const conflicting = hasNegation(found.dup.text) !== hasNegation(text);
                        if (conflicting) {
                            // противоречие: не схлопываем
                        } else {
                            if (!found.dup.sourceIds.includes(source.id)) {
                                found.dup.sourceIds.push(source.id);
                                found.dup.updatedAt = Date.now();
                                await this.db.topicClaims.put(found.dup);
                            }
                            run.stats.duplicates++;
                            continue;
                        }
                    } else if (found.candidate) {
                        run.stats.mergeCandidates++;
                    }
                    const claim: TopicClaim = {
                        id: GENERIC_ID('claim'),
                        topicId,
                        text,
                        sourceIds: [source.id],
                        confidence: embedding ? 0.7 : 0.6,
                        status: 'extracted',
                        embedding,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    };
                    existingClaims.push(claim);
                    if (embedding) existingEmbeddings.push(embedding);
                    newClaims.push(claim);
                    evidenceEntries.push({
                        id: GENERIC_ID('ev'),
                        topicId,
                        claimId: claim.id,
                        sourceId: source.id,
                        quote:
                            unit.start !== undefined
                                ? payload.content.slice(unit.start, Math.min(unit.start + 300, payload.content.length))
                                : unit.sentence.slice(0, 300),
                        offset: unit.start,
                        createdAt: Date.now(),
                    });
                    run.stats.newClaims++;
                }
            await this.db.topicClaims.bulkPut(newClaims as never);

            // Противоречия.
            const conflicts = this.detectConflicts(newClaims, existingClaims);
            for (const c of conflicts) {
                await this.db.topicConflicts.put(c);
            }
            run.stats.conflicts = conflicts.length;

            // Концепты (простые: частые слова в новых утверждениях).
            const concepts = this.extractConcepts(topicId, newClaims);
            for (const concept of concepts) {
                const existing = await this.db.topicConcepts
                    .where('topicId')
                    .equals(topicId)
                    .filter((x) => x.name === concept.name)
                    .first();
                if (existing) {
                    const merged = {
                        ...existing,
                        aliases: [...new Set([...existing.aliases, ...concept.aliases])],
                        claimIds: [...new Set([...existing.claimIds, ...concept.claimIds])],
                    };
                    await this.db.topicConcepts.put(merged);
                } else {
                    await this.db.topicConcepts.put(concept);
                }
            }

            // Связи: поддержка между утверждениями с общими концептами.
            const relations = this.discoverRelations(topicId, newClaims);
            for (const r of relations) {
                await this.db.topicRelations.put(r);
            }
            run.stats.relations = relations.length;

            // Evidence: для каждого нового claim — цитата из оригинала + offset.
            await this.db.topicEvidence.bulkPut(evidenceEntries as never);

            run.status = 'completed';
            run.completedAt = Date.now();
            await this.db.topicProcessingRuns.put(run);
            return run;
        } catch (e) {
            run.status = 'failed';
            run.error = e instanceof Error ? e.message : String(e);
            await this.db.topicProcessingRuns.put(run);
            LOGGER.warn('TopicGraph', 'ingest failed', { error: run.error });
            return run;
        }
    }

    private detectConflicts(
        newClaims: TopicClaim[],
        allClaims: TopicClaim[],
    ): TopicConflict[] {
        const out: TopicConflict[] = [];
        for (let i = 0; i < newClaims.length; i++) {
            for (let j = 0; j < allClaims.length; j++) {
                const a = newClaims[i]!;
                const b = allClaims[j]!;
                if (a.id === b.id) continue;
                const ta = tokenize(a.text);
                const tb = tokenize(b.text);
                if (ta.size < 3 || tb.size < 3) continue;
                const sim = jaccard(ta, tb);
                if (sim >= CONTRADICTION_THRESHOLD && hasNegation(a.text) !== hasNegation(b.text)) {
                    out.push({
                        id: GENERIC_ID('conflict'),
                        topicId: a.topicId,
                        claimAId: a.id,
                        claimBId: b.id,
                        reason: 'shared terms with opposite polarity',
                        confidence: Math.min(0.95, 0.5 + sim * 0.4),
                        resolved: false,
                        createdAt: Date.now(),
                    });
                }
            }
        }
        return out;
    }

    private extractConcepts(topicId: string, claims: TopicClaim[]): TopicConcept[] {
        const freq = new Map<string, number>();
        for (const c of claims) {
            for (const w of tokenize(c.text)) {
                freq.set(w, (freq.get(w) ?? 0) + 1);
            }
        }
        const top = [...freq.entries()]
            .filter(([, n]) => n >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([w]) => w);
        return top.map((name) => ({
            id: GENERIC_ID('concept'),
            topicId,
            name,
            aliases: [],
            claimIds: claims.filter((c) => tokenize(c.text).has(name)).map((c) => c.id),
            createdAt: Date.now(),
        }));
    }

    private discoverRelations(topicId: string, claims: TopicClaim[]): TopicRelation[] {
        const out: TopicRelation[] = [];
        for (let i = 0; i < claims.length; i++) {
            for (let j = i + 1; j < claims.length; j++) {
                const a = claims[i]!;
                const b = claims[j]!;
                const inter = [...tokenize(a.text)].filter((w) => tokenize(b.text).has(w)).length;
                if (inter >= 2) {
                    out.push({
                        id: GENERIC_ID('rel'),
                        topicId,
                        fromId: a.id,
                        toId: b.id,
                        relation: 'supports',
                        weight: Math.min(1, 0.4 + inter * 0.1),
                        createdAt: Date.now(),
                    });
                }
            }
        }
        return out;
    }

    private async extractClaimsWithLlm(content: string): Promise<string[]> {
        if (!this.deps.llm) return splitIntoSentences(content);
        const all: string[] = [];
        const CHUNK_SIZE = 6000;
        const OVERLAP = 400;
        for (let start = 0; start < content.length; start += CHUNK_SIZE - OVERLAP) {
            const chunk = content.slice(start, start + CHUNK_SIZE);
            try {
                const res = await this.deps.llm.chat([
                    {
                        role: 'system',
                        content:
                            'Extract standalone factual claims from the text. ' +
                            'Return ONLY a JSON array of strings: ["claim1","claim2",...]. ' +
                            'Each claim must be a single concrete fact. No prose.',
                    },
                    { role: 'user', content: chunk },
                ]);
                const match = res.content.match(/\[[\s\S]*\]/);
                if (match) {
                    const parsed = JSON.parse(match[0]) as unknown;
                    if (Array.isArray(parsed)) {
                        all.push(...parsed.map((s) => String(s)).filter((s) => s.length > 0));
                    }
                }
            } catch (e) {
                LOGGER.warn('TopicGraph', 'llm extraction failed on chunk', { error: String(e) });
            }
        }
        if (all.length === 0) return splitIntoSentences(content);
        return all;
    }

    /** Экспорт отчёта темы в файл проекта (TopicResults/<slug>.md). */
    async exportToProject(
        repo: {
            putFile(input: {
                projectId: string;
                path: string;
                content: string;
                createdAt: number;
                updatedAt: number;
            }): Promise<void>;
        },
        projectId: string,
        topicId: string,
    ): Promise<{ path: string } | undefined> {
        if (!projectId) return undefined;
        const topic = await this.getTopic(topicId);
        if (!topic) return undefined;
        const report = await this.exportReport(topicId);
        const slug =
            topic.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 60) || `topic-${topicId}`;
        const path = `TopicResults/${slug}.md`;
        const now = Date.now();
        await repo.putFile({
            projectId,
            path,
            content: report,
            createdAt: now,
            updatedAt: now,
        });
        return { path };
    }

    // ── Accessors ──

    async sources(topicId: string): Promise<TopicSource[]> {
        return this.db.topicSources.where('topicId').equals(topicId).toArray();
    }
    async claims(topicId: string): Promise<TopicClaim[]> {
        return this.db.topicClaims.where('topicId').equals(topicId).toArray();
    }
    async concepts(topicId: string): Promise<TopicConcept[]> {
        return this.db.topicConcepts.where('topicId').equals(topicId).toArray();
    }
    async relations(topicId: string): Promise<TopicRelation[]> {
        return this.db.topicRelations.where('topicId').equals(topicId).toArray();
    }
    async evidence(topicId: string): Promise<TopicEvidence[]> {
        return this.db.topicEvidence.where('topicId').equals(topicId).toArray();
    }
    async conflicts(topicId: string): Promise<TopicConflict[]> {
        return this.db.topicConflicts.where('topicId').equals(topicId).toArray();
    }
    async runs(topicId: string): Promise<TopicProcessingRun[]> {
        return this.db.topicProcessingRuns.where('topicId').equals(topicId).toArray();
    }

    async completeness(topicId: string): Promise<TopicCompleteness> {
        const [claims, concepts, conflicts, sources] = await Promise.all([
            this.claims(topicId),
            this.concepts(topicId),
            this.conflicts(topicId),
            this.sources(topicId),
        ]);
        const coverage = claims.length === 0 ? 0 : Math.min(1, claims.length / 20);
        return {
            totalClaims: claims.length,
            uniqueConcepts: concepts.length,
            conflicts: conflicts.length,
            sources: sources.length,
            coverage,
        };
    }

    async search(topicId: string, query: string): Promise<TopicClaim[]> {
        const q = tokenize(query);
        if (q.size === 0) return [];
        const claims = await this.claims(topicId);
        return claims
            .map((c) => ({ c, sim: jaccard(q, tokenize(c.text)) }))
            .filter((x) => x.sim > 0)
            .sort((a, b) => b.sim - a.sim)
            .map((x) => x.c)
            .slice(0, 20);
    }

    async exportReport(topicId: string): Promise<string> {
        const [topic, claims, concepts, relations, conflicts, sources] = await Promise.all([
            this.getTopic(topicId),
            this.claims(topicId),
            this.concepts(topicId),
            this.relations(topicId),
            this.conflicts(topicId),
            this.sources(topicId),
        ]);
        if (!topic) return '# Topic not found';
        const comp = await this.completeness(topicId);
        const lines: string[] = [];
        lines.push(`# Topic Graph: ${topic.title}`);
        lines.push('');
        lines.push(`- Description: ${topic.description}`);
        lines.push(`- Category: ${topic.status}`);
        lines.push(`- Sources: ${sources.length}`);
        lines.push(`- Claims: ${claims.length}`);
        lines.push(`- Concepts: ${concepts.length}`);
        lines.push(`- Relations: ${relations.length}`);
        lines.push(`- Conflicts: ${conflicts.length}`);
        lines.push(`- Coverage: ${Math.round(comp.coverage * 100)}%`);
        lines.push('');
        lines.push('## Concepts');
        lines.push('');
        concepts.forEach((c) => {
            lines.push(`- ${c.name} (${c.claimIds.length} claims)`);
        });
        lines.push('');
        lines.push('## Claims');
        lines.push('');
        claims.slice(0, 300).forEach((c) => {
            lines.push(`- ${c.text} [${c.sourceIds.length} sources, conf ${c.confidence.toFixed(2)}]`);
        });
        lines.push('');
        lines.push('## Sources');
        lines.push('');
        sources.forEach((s) => {
            lines.push(`- ${s.title} [${s.kind}] — ${s.ref}`);
        });
        lines.push('');
        lines.push('## Conflicts');
        lines.push('');
        conflicts.forEach((c) => {
            lines.push(`- ${c.claimAId} ↔ ${c.claimBId}: ${c.reason} (${c.confidence.toFixed(2)})`);
        });
        lines.push('');
        return lines.join('\n');
    }
}

function cosine(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i]! * b[i]!;
        na += a[i]! * a[i]!;
        nb += b[i]! * b[i]!;
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function splitIntoSentences(text: string): string[] {
    return text
        .replace(/([.!?])\s+/g, '$1\n')
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

function splitIntoSentencesWithOffsets(text: string): Array<{ sentence: string; start: number }> {
    const lines = text.replace(/([.!?])\s+/g, '$1\n').split('\n');
    const out: Array<{ sentence: string; start: number }> = [];
    let cursor = 0;
    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        const idx = text.indexOf(line, cursor);
        if (idx === -1) continue;
        out.push({ sentence: line, start: idx });
        cursor = idx + line.length;
    }
    return out;
}

function normalizeClaim(sentence: string): string {
    return sentence
        .replace(/^\s*[-*#>\d.)]+\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Числа из токенов в порядке появления. */
function numericTokens(tokens: string[]): string[] {
    return tokens.filter((t) => /^\d+(\.\d+)*$/.test(t));
}

/** Только нечисловые токены. */
function nonNumericTokens(tokens: string[]): string[] {
    return tokens.filter((t) => !/^\d+(\.\d+)*$/.test(t));
}

/**
 * Если два набора токенов совпадают по нечисловым токенам, но различаются
 * числами — это разные факты (например «300 MB» vs «900 MB»), схлопывать нельзя.
 */
function differsOnlyByNumbers(a: Set<string>, b: Set<string>): boolean {
    const an = nonNumericTokens([...a]).sort();
    const bn = nonNumericTokens([...b]).sort();
    if (an.length !== bn.length || an.some((t, i) => t !== bn[i])) return false;
    const anum = numericTokens([...a]).sort();
    const bnum = numericTokens([...b]).sort();
    return (
        anum.length !== bnum.length || anum.some((t, i) => t !== bnum[i])
    );
}

/**
 * Ищет в существующих утверждениях либо уверенный дубликат (auto-merge),
 * либо кандидата на объединение (похож, но не настолько, чтобы сливать).
 */
function findDuplicate(
    existing: TopicClaim[],
    text: string,
    embedding?: number[],
    existingEmbeddings: number[][] = [],
): { dup?: TopicClaim; candidate?: TopicClaim } {
    const t = tokenize(text);
    let bestCandidate: TopicClaim | undefined;
    let bestSim = 0;
    for (let i = 0; i < existing.length; i++) {
        const claim = existing[i]!;
        const jSim = jaccard(t, tokenize(claim.text));
        const eSim =
            embedding && claim.embedding ? cosine(embedding, claim.embedding) : 0;
        const differsNumbers = differsOnlyByNumbers(t, tokenize(claim.text));
        if (
            !differsNumbers &&
            (jSim >= DEDUPE_JACCARD_THRESHOLD || eSim >= DEDUPE_EMBEDDING_THRESHOLD)
        ) {
            return { dup: claim };
        }
        if (!differsNumbers && jSim >= MERGE_CANDIDATE_THRESHOLD && jSim > bestSim) {
            bestCandidate = claim;
            bestSim = jSim;
        }
        if (i < existingEmbeddings.length) {
            const other = existingEmbeddings[i]!;
            if (
                !differsNumbers &&
                embedding &&
                cosine(embedding, other) >= DEDUPE_EMBEDDING_THRESHOLD
            ) {
                const cand = existing.find((c) => c.embedding === other);
                if (cand) return { dup: cand };
            }
        }
    }
    return bestCandidate ? { candidate: bestCandidate } : {};
}
