import type {
    TopicGraphService,
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

/** Простейший токенизатор для близости (слова >2 символов). */
function tokenize(text: string): Set<string> {
    return new Set(
        text
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 2),
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
    const lower = text.toLowerCase();
    return NEGATION_MARKERS.some((m) => lower.includes(m));
}

const DEDUPE_THRESHOLD = 0.6;
const CONTRADICTION_THRESHOLD = 0.45;

export class TopicGraphServiceImpl implements TopicGraphService {
    private db: TopicGraphDB;

    constructor(db?: TopicGraphDB) {
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

            // Извлечение утверждений (MVP: фрагменты по предложениям).
            const sentences = splitIntoSentences(payload.content);
            const existingClaims = await this.db.topicClaims.where('topicId').equals(topicId).toArray();
            const newClaims: TopicClaim[] = [];
            for (const sentence of sentences) {
                const text = normalizeClaim(sentence);
                if (text.length < 12) continue;
                // Дедупликация по смысловой близости к уже известным.
                // Если похожее утверждение имеет противоположный знак — это
                // противоречие, а не дубль: сохраняем оба.
                const dup = findDuplicate(existingClaims, text);
                if (dup) {
                    const conflicting = hasNegation(dup.text) !== hasNegation(text);
                    if (conflicting) {
                        // не схлопываем: оба останутся как отдельные claims
                    } else {
                        if (!dup.sourceIds.includes(source.id)) {
                            dup.sourceIds.push(source.id);
                            dup.updatedAt = Date.now();
                            await this.db.topicClaims.put(dup);
                        }
                        run.stats.duplicates++;
                        continue;
                    }
                }
                const claim: TopicClaim = {
                    id: GENERIC_ID('claim'),
                    topicId,
                    text,
                    sourceIds: [source.id],
                    confidence: 0.6,
                    status: 'extracted',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                existingClaims.push(claim);
                newClaims.push(claim);
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

            // Evidence: для каждого нового claim — цитата.
            const evidence: TopicEvidence[] = newClaims.map((c) => ({
                id: GENERIC_ID('ev'),
                topicId,
                claimId: c.id,
                sourceId: source.id,
                quote: c.text.slice(0, 300),
                createdAt: Date.now(),
            }));
            await this.db.topicEvidence.bulkPut(evidence as never);

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
        const lines: string[] = [];
        lines.push(`# Topic Graph: ${topic.title}`);
        lines.push('');
        lines.push(`- Description: ${topic.description}`);
        lines.push(`- Sources: ${sources.length}`);
        lines.push(`- Claims: ${claims.length}`);
        lines.push(`- Concepts: ${concepts.length}`);
        lines.push(`- Relations: ${relations.length}`);
        lines.push(`- Conflicts: ${conflicts.length}`);
        lines.push('');
        lines.push('## Claims');
        lines.push('');
        claims.slice(0, 200).forEach((c) => {
            lines.push(`- ${c.text} [${c.sourceIds.length} sources]`);
        });
        lines.push('');
        lines.push('## Conflicts');
        lines.push('');
        conflicts.forEach((c) => {
            lines.push(`- ${c.claimAId} ↔ ${c.claimBId}: ${c.reason}`);
        });
        lines.push('');
        return lines.join('\n');
    }
}

function splitIntoSentences(text: string): string[] {
    return text
        .replace(/([.!?])\s+/g, '$1\n')
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

function normalizeClaim(sentence: string): string {
    return sentence
        .replace(/^\s*[-*#>\d.)]+\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function findDuplicate(existing: TopicClaim[], text: string): TopicClaim | undefined {
    const t = tokenize(text);
    for (const claim of existing) {
        if (jaccard(t, tokenize(claim.text)) >= DEDUPE_THRESHOLD) {
            return claim;
        }
    }
    return undefined;
}
