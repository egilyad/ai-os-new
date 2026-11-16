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

    async archiveTopic(id: string): Promise<Topic | undefined> {
        return this.updateTopic(id, { status: 'archived' });
    }

    async deleteTopic(id: string, confirm = false): Promise<boolean> {
        if (!confirm) return false;
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
            stats: { extracted: 0, duplicates: 0, newClaims: 0, newEvidence: 0, conflicts: 0, relations: 0, mergeCandidates: 0, fallbackClaims: 0 },
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
                let sentenceUnits: Array<{ sentence: string; start?: number }>;
                let llmWarnings: string[] = [];
                let llmMode: 'llm' | 'fallback' = 'fallback';
                let failedChunks = 0;
                if (this.deps.llm) {
                    const { sentences, warnings, mode, failedChunks: fc } = await this.extractClaimsWithLlm(payload.content);
                    llmWarnings = warnings;
                    llmMode = mode;
                    failedChunks = fc;
                    sentenceUnits = sentences.map((sentence) => {
                        const loc = locateFragment(payload.content, sentence);
                        return loc ? { sentence, start: loc.start } : { sentence };
                    });
                } else {
                    sentenceUnits = splitIntoSentencesWithOffsets(payload.content);
                }
                const existingClaims = await this.db.topicClaims.where('topicId').equals(topicId).toArray();
                const newClaims: TopicClaim[] = [];
                const evidenceEntries: TopicEvidence[] = [];
                for (const unit of sentenceUnits) {
                    const text = normalizeClaim(unit.sentence);
                    if (text.length < 12) continue;
                    run.stats.extracted++;

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
                    const makeEvidence = (claimId: string): TopicEvidence => {
                        const loc =
                            unit.start !== undefined
                                ? { start: unit.start }
                                : locateFragment(payload.content, unit.sentence);
                        const quote = loc
                            ? payload.content.slice(loc.start, Math.min(loc.start + 300, payload.content.length))
                            : unit.sentence.slice(0, 300);
                        run.stats.newEvidence++;
                        return {
                            id: GENERIC_ID('ev'),
                            topicId,
                            claimId,
                            sourceId: source.id,
                            quote,
                            offset: loc?.start,
                            end: loc ? loc.start + quote.length : undefined,
                            origin: loc ? 'source' : 'model',
                            extraction: llmMode,
                            createdAt: Date.now(),
                        };
                    };
                    const found = findDuplicate(existingClaims, text, embedding);
                    if (found.dup) {
                        const conflicting = hasNegation(found.dup.text) !== hasNegation(text);
                        if (conflicting) {
                            // противоречие: не схлопываем
                        } else {
                            if (!found.dup.sourceIds.includes(source.id)) {
                                found.dup.sourceIds.push(source.id);
                                found.dup.updatedAt = Date.now();
                                await this.db.topicClaims.put(found.dup);
                                evidenceEntries.push(makeEvidence(found.dup.id));
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
                    newClaims.push(claim);
                    evidenceEntries.push(makeEvidence(claim.id));
                    if (llmMode === 'fallback') run.stats.fallbackClaims++;
                    run.stats.newClaims++;
                }
                if (llmWarnings.length > 0) {
                    run.warnings = llmWarnings;
                }
                run.status = failedChunks > 0 ? 'partial' : llmMode === 'fallback' ? 'fallback' : 'completed';
            await this.db.topicClaims.bulkPut(newClaims as never);

            // Противоречия.
            const conflicts = this.detectConflicts(newClaims, existingClaims);
            for (const c of conflicts) {
                await this.db.topicConflicts.put(c);
            }
            run.stats.conflicts = conflicts.length;

            // Концепты: глобальная синхронизация по всем утверждениям темы.
            await this.syncConcepts(topicId, existingClaims);

            // Иерархия концептов (part_of / related_to) по покрытию.
            await this.rebuildConceptRelations(topicId);

            // Связи: поддержка между утверждениями с общими концептами.
            const relations = this.discoverRelations(topicId, newClaims, existingClaims);
            await this.putUniqueRelations(topicId, relations);
            run.stats.relations = relations.length;

            // Evidence: для каждого нового claim — цитата из оригинала + offset.
            await this.db.topicEvidence.bulkPut(evidenceEntries as never);

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

    private async syncConcepts(topicId: string, allClaims: TopicClaim[]): Promise<void> {
        const freq = new Map<string, number>();
        for (const c of allClaims) {
            for (const w of tokenize(c.text)) {
                if (STOPWORDS.has(w)) continue;
                freq.set(w, (freq.get(w) ?? 0) + 1);
            }
        }
        const names = [...freq.entries()]
            .filter(([, n]) => n >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([w]) => w);
        const existing = await this.db.topicConcepts.where('topicId').equals(topicId).toArray();
        const byName = new Map(existing.map((c) => [c.name.normalize('NFKC'), c]));
        const activeNames = new Set<string>();
        for (const rawName of names) {
            const name = rawName.normalize('NFKC');
            activeNames.add(name);
            const claimIds = allClaims.filter((c) => tokenize(c.text).has(rawName)).map((c) => c.id);
            const prev = byName.get(name) ?? byName.get(rawName);
            if (prev) {
                await this.db.topicConcepts.put({ ...prev, claimIds });
            } else {
                let embedding: number[] | undefined;
                let mergedInto: TopicConcept | undefined;
                if (this.deps.embedder) {
                    try {
                        const vecs = await this.deps.embedder.embed([name]);
                        embedding = vecs[0];
                        for (const c of existing) {
                            if (!c.embedding) continue;
                            if (cosine(embedding, c.embedding) >= ENTITY_MERGE_THRESHOLD) {
                                mergedInto = c;
                                break;
                            }
                        }
                    } catch {
                        embedding = undefined;
                    }
                }
                if (mergedInto) {
                    await this.db.topicConcepts.put({
                        ...mergedInto,
                        aliases: [...new Set([...mergedInto.aliases, name])],
                        claimIds: [...new Set([...mergedInto.claimIds, ...claimIds])],
                    });
                } else {
                    await this.db.topicConcepts.put({
                        id: GENERIC_ID('concept'),
                        topicId,
                        name,
                        aliases: [],
                        claimIds,
                        embedding,
                        createdAt: Date.now(),
                    });
                }
            }
        }
        // Устаревшие: пересчитать claimIds; полностью мёртвые — удалить с рёбрами.
        for (const c of existing) {
            const nm = c.name.normalize('NFKC');
            const claimIds = allClaims.filter((cc) => tokenize(cc.text).has(nm)).map((cc) => cc.id);
            if (claimIds.length > 0) {
                if (!activeNames.has(nm)) {
                    await this.db.topicConcepts.put({ ...c, claimIds });
                }
            } else {
                await this.db.topicConcepts.delete(c.id);
                await this.db.topicRelations
                    .where('topicId')
                    .equals(topicId)
                    .filter((r) => r.fromId === c.id || r.toId === c.id)
                    .delete();
            }
        }
    }

    private discoverRelations(
        topicId: string,
        newClaims: TopicClaim[],
        allClaims: TopicClaim[],
    ): TopicRelation[] {
        const out: TopicRelation[] = [];
        const seen = new Set<string>();
        for (const a of newClaims) {
            for (const b of allClaims) {
                if (a.id === b.id) continue;
                const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
                if (seen.has(key)) continue;
                seen.add(key);
                const inter = [...tokenize(a.text)].filter((w) => tokenize(b.text).has(w)).length;
                if (inter >= 2) {
                    const contradicts = hasNegation(a.text) !== hasNegation(b.text);
                    out.push({
                        id: GENERIC_ID('rel'),
                        topicId,
                        fromId: a.id,
                        toId: b.id,
                        relation: contradicts ? 'contradicts' : 'related_to',
                        weight: contradicts
                            ? Math.min(1, 0.4 + inter * 0.1)
                            : Math.max(0.3, Math.min(0.6, inter * 0.15)),
                        createdAt: Date.now(),
                    });
                }
            }
        }
        return out;
    }

    // ── Concept hierarchy (RAGraph-inspired: topic clustering / PART_OF) ──

    private async putUniqueRelations(topicId: string, relations: TopicRelation[]): Promise<void> {
        if (relations.length === 0) return;
        const existing = await this.db.topicRelations.where('topicId').equals(topicId).toArray();
        const known = new Map(existing.map((r) => [`${r.fromId}|${r.toId}|${r.relation}`, r]));
        const fresh: TopicRelation[] = [];
        for (const r of relations) {
            const k = `${r.fromId}|${r.toId}|${r.relation}`;
            const prev = known.get(k);
            if (!prev) {
                known.set(k, r);
                fresh.push(r);
            } else if (!prev.manual && r.weight > prev.weight) {
                const merged = { ...prev, weight: r.weight };
                known.set(k, merged);
                fresh.push(merged);
            }
        }
        if (fresh.length > 0) {
            await this.db.topicRelations.bulkPut(fresh as never);
        }
    }

    private async rebuildConceptRelations(topicId: string): Promise<void> {
        const concepts = await this.db.topicConcepts.where('topicId').equals(topicId).toArray();
        if (concepts.length < 2) return;
        const conceptIds = new Set(concepts.map((c) => c.id));
        // Полный пересчёт автоматических рёбер: ручные не трогаем.
        await this.db.topicRelations
            .where('topicId')
            .equals(topicId)
            .filter((r) => !r.manual && conceptIds.has(r.fromId) && conceptIds.has(r.toId))
            .delete();
        const relations = buildConceptRelations(topicId, concepts, CONCEPT_COVER_THRESHOLD);
        if (relations.length > 0) {
            await this.db.topicRelations.bulkPut(relations as never);
        }
    }

    private async extractClaimsWithLlm(
        content: string,
    ): Promise<{ sentences: string[]; warnings: string[]; mode: 'llm' | 'fallback'; failedChunks: number }> {
        if (!this.deps.llm) {
            return { sentences: splitIntoSentences(content), warnings: [], mode: 'fallback', failedChunks: 0 };
        }
        const all: string[] = [];
        const warnings: string[] = [];
        const CHUNK_SIZE = 6000;
        const OVERLAP = 400;
        let chunksTotal = 0;
        let chunksFailed = 0;
        for (let start = 0; start < content.length; start += CHUNK_SIZE - OVERLAP) {
            chunksTotal++;
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
                if (!match) throw new Error('ответ не содержит JSON-массив');
                const parsed = JSON.parse(match[0]) as unknown;
                if (!Array.isArray(parsed)) throw new Error('ответ не является массивом');
                const strings = parsed.map((x) => {
                    if (typeof x === 'string') return x;
                    if (x && typeof x === 'object' && typeof (x as { text?: unknown }).text === 'string') {
                        return (x as { text: string }).text;
                    }
                    return null;
                });
                if (strings.some((s) => s === null)) {
                    throw new Error('ответ содержит нестроковые элементы');
                }
                all.push(...strings.filter((s): s is string => s.length > 0));
            } catch (e) {
                chunksFailed++;
                warnings.push(`Чанк #${chunksTotal} (offset ${start}) не обработан: ${e instanceof Error ? e.message : String(e)}`);
                LOGGER.warn('TopicGraph', 'llm extraction failed on chunk', { error: String(e) });
            }
        }
        if (chunksFailed > 0) {
            warnings.push(`LLM не обработал ${chunksFailed} из ${chunksTotal} чанков; результат может быть неполным`);
        }
        if (all.length === 0) {
            warnings.push('LLM ничего не извлекла; использован fallback по предложениям');
            return { sentences: splitIntoSentences(content), warnings, mode: 'fallback', failedChunks: chunksFailed };
        }
        return { sentences: all, warnings, mode: 'llm', failedChunks: chunksFailed };
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
        const conceptScore = Math.min(1, concepts.length / 5);
        const sourceScore = Math.min(1, sources.length / 3);
        const claimScore = Math.min(1, claims.length / 20);
        const coverage = Math.round((conceptScore * 0.5 + sourceScore * 0.3 + claimScore * 0.2) * 100) / 100;
        return {
            totalClaims: claims.length,
            uniqueConcepts: concepts.length,
            conflicts: conflicts.length,
            sources: sources.length,
            coverage,
            collectionProgress: coverage,
            criteria: [
                { name: 'concepts', score: conceptScore },
                { name: 'sources', score: sourceScore },
                { name: 'claims', score: claimScore },
            ],
        };
    }

    async search(topicId: string, query: string): Promise<TopicClaim[]> {
        const q = tokenize(query);
        if (q.size === 0) return [];
        let qEmb: number[] | undefined;
        if (this.deps.embedder) {
            try {
                qEmb = (await this.deps.embedder.embed([query]))[0];
            } catch {
                qEmb = undefined;
            }
        }
        const [claims, relations] = await Promise.all([this.claims(topicId), this.relations(topicId)]);
        const scored = claims.map((c) => {
            let sim = jaccard(q, tokenize(c.text));
            if (qEmb && c.embedding) {
                sim = Math.max(sim, cosine(qEmb, c.embedding));
            }
            return { c, sim };
        });
        scored.sort((a, b) => b.sim - a.sim);
        // Graph expansion: соседи топ-сидов получают буст (как в RAGraph),
        // поэтому связанные утверждения без прямого совпадения тоже попадают.
        const seeds = new Set(
            scored
                .filter((x) => x.sim > 0)
                .slice(0, 5)
                .map((x) => x.c.id),
        );
        const boost = new Map<string, number>();
        for (const r of relations) {
            const neighbor = seeds.has(r.fromId) ? r.toId : seeds.has(r.toId) ? r.fromId : undefined;
            if (neighbor) boost.set(neighbor, Math.max(boost.get(neighbor) ?? 0, r.weight));
        }
        for (const x of scored) {
            const b = boost.get(x.c.id);
            if (b) x.sim += b * 0.15;
        }
        scored.sort((a, b) => b.sim - a.sim);
        return scored.filter((x) => x.sim > 0).slice(0, 20).map((x) => x.c);
    }

    /** Пересборка глобальной структуры (концепты + иерархия) по требованию. */
    async consolidate(topicId: string): Promise<void> {
        const claims = await this.db.topicClaims.where('topicId').equals(topicId).toArray();
        await this.syncConcepts(topicId, claims);
        await this.rebuildConceptRelations(topicId);
    }

    /** Нормализованная степень центральности узлов (claims + концепты). */
    async centrality(
        topicId: string,
    ): Promise<Array<{ id: string; kind: 'claim' | 'concept'; degree: number; normalized: number }>> {
        const [claims, concepts, relations] = await Promise.all([
            this.claims(topicId),
            this.concepts(topicId),
            this.relations(topicId),
        ]);
        const deg = new Map<string, number>();
        for (const r of relations) {
            deg.set(r.fromId, (deg.get(r.fromId) ?? 0) + 1);
            deg.set(r.toId, (deg.get(r.toId) ?? 0) + 1);
        }
        const nodes: Array<{ id: string; kind: 'claim' | 'concept' }> = [
            ...claims.map((c) => ({ id: c.id, kind: 'claim' as const })),
            ...concepts.map((c) => ({ id: c.id, kind: 'concept' as const })),
        ];
        const max = Math.max(1, ...nodes.map((n) => deg.get(n.id) ?? 0));
        return nodes.map((n) => ({
            id: n.id,
            kind: n.kind,
            degree: deg.get(n.id) ?? 0,
            normalized: (deg.get(n.id) ?? 0) / max,
        }));
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
        lines.push(`- Collection progress (накопление материала): ${Math.round(comp.collectionProgress * 100)}%`);
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
        lines.push('## Key claims (centrality)');
        lines.push('');
        const cent = await this.centrality(topicId);
        const claimById = new Map(claims.map((c) => [c.id, c]));
        cent
            .filter((n) => n.kind === 'claim')
            .sort((a, b) => b.normalized - a.normalized)
            .slice(0, 5)
            .forEach((n) => {
                const c = claimById.get(n.id);
                if (c) lines.push(`- ${c.text} [centrality ${n.normalized.toFixed(2)}]`);
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

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Пытается найти утверждение в исходном тексте. Возвращает позицию именно в
 * оригинале: сначала дословный поиск, затем regex с допуском любых пробелов
 * (включая переносы строк) между словами.
 */
function locateFragment(content: string, claim: string): { start: number } | undefined {
    const trimmed = claim.trim();
    if (trimmed.length === 0) return undefined;
    const direct = content.indexOf(trimmed);
    if (direct !== -1) return { start: direct };
    const pattern = trimmed
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(escapeRegExp)
        .join('\\s+');
    const match = new RegExp(pattern).exec(content);
    if (match) return { start: match.index };
    return undefined;
}

/** Порог покрытия claim-множеств для иерархии концептов (part_of). */
const CONCEPT_COVER_THRESHOLD = 0.8;

/** Cosine-порог слияния концептов-синонимов (RAGraph entityMergeThreshold). */
const ENTITY_MERGE_THRESHOLD = 0.85;

/** Общеупотребительные слова, не являющиеся понятиями. */
const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while',
    'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'into', 'onto',
    'about', 'over', 'under', 'between', 'against', 'through', 'during', 'after',
    'before', 'until', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'has',
    'have', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can',
    'could', 'may', 'might', 'must', 'not', 'no', 'nor', 'so', 'too', 'very',
    'just', 'also', 'only', 'more', 'most', 'other', 'such', 'than', 'as', 'it',
    'its', 'this', 'that', 'these', 'those', 'he', 'she', 'they', 'we', 'you',
    'i', 'me', 'him', 'her', 'them', 'us', 'my', 'your', 'his', 'their', 'our',
    'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'many', 'much', 'some', 'several',
    'there', 'here', 'up', 'down', 'out', 'off', 'again', 'once', 'also',
    'и', 'в', 'на', 'с', 'со', 'по', 'для', 'от', 'из', 'к', 'ко', 'за',
    'при', 'не', 'нет', 'ни', 'но', 'а', 'или', 'если', 'то', 'так', 'как',
    'что', 'чтобы', 'это', 'этот', 'эта', 'это', 'эти', 'он', 'она', 'оно',
    'они', 'мы', 'вы', 'ты', 'я', 'мне', 'меня', 'тебе', 'вам', 'нам',
    'его', 'её', 'ее', 'их', 'мой', 'твой', 'наш', 'ваш', 'свой', 'который',
    'которая', 'которое', 'которые', 'там', 'здесь', 'тут', 'уже', 'ещё',
    'еще', 'только', 'более', 'менее', 'очень', 'все', 'всё', 'весь', 'сам',
    'сама', 'само', 'сами', 'другой', 'другая', 'другое', 'другие', 'такой',
    'такая', 'такое', 'такие', 'каждый', 'каждая', 'каждое', 'каждые',
    'между', 'через', 'около', 'над', 'под', 'перед', 'после', 'во', 'время',
    'дело', 'вещь', 'часть', 'год', 'года', 'лет', 'день', 'дня', 'дней',
    'раз', 'раза', 'когда', 'потому', 'поэтому', 'хотя', 'даже', 'ли',
    'бы', 'был', 'была', 'было', 'были', 'будет', 'будут', 'есть', 'можно',
    'нельзя', 'нужно', 'надо', 'должен', 'должна', 'должны', 'может', 'могут',
    'является', 'являются', 'считается', 'представляет',
]);

/**
 * Иерархия концептов (идея из RAGraph: topic clustering / PART_OF):
 * если claim-множество концепта почти полностью покрыто другим — меньший
 * вложен в больший (part_of); при заметном пересечении — related_to.
 */
function buildConceptRelations(
    topicId: string,
    concepts: TopicConcept[],
    coverThreshold = CONCEPT_COVER_THRESHOLD,
): TopicRelation[] {
    const out: TopicRelation[] = [];
    const seen = new Set<string>();
    const push = (r: TopicRelation) => {
        const key = `${r.fromId}|${r.toId}|${r.relation}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(r);
    };
    // Fallback: супер-фраза (слово B целиком входит в имя A) → part_of.
    const nameTokens = concepts.map((c) => ({
        c,
        tokens: new Set(tokenize(c.name)),
    }));
    for (let i = 0; i < nameTokens.length; i++) {
        for (let j = 0; j < nameTokens.length; j++) {
            if (i === j) continue;
            const a = nameTokens[i]!;
            const b = nameTokens[j]!;
            if (a.tokens.size === 0 || b.tokens.size === 0) continue;
            if (b.tokens.size < a.tokens.size && [...b.tokens].every((t) => a.tokens.has(t))) {
                push({
                    id: GENERIC_ID('rel'),
                    topicId,
                    fromId: b.c.id,
                    toId: a.c.id,
                    relation: 'part_of',
                    weight: 0.85,
                    createdAt: Date.now(),
                });
            }
        }
    }
    for (let i = 0; i < concepts.length; i++) {
        for (let j = i + 1; j < concepts.length; j++) {
            const a = concepts[i]!;
            const b = concepts[j]!;
            if (a.id === b.id) continue;
            const aSet = new Set(a.claimIds);
            const bSet = new Set(b.claimIds);
            const minSize = Math.min(aSet.size, bSet.size);
            if (minSize === 0) continue;
            const inter = [...aSet].filter((id) => bSet.has(id)).length;
            if (inter === 0) continue;
            const cover = inter / minSize;
            if (cover >= coverThreshold && aSet.size !== bSet.size) {
                const [child, parent] = aSet.size < bSet.size ? [a, b] : [b, a];
                push({
                    id: GENERIC_ID('rel'),
                    topicId,
                    fromId: child.id,
                    toId: parent.id,
                    relation: 'part_of',
                    weight: 0.9,
                    createdAt: Date.now(),
                });
            } else if (cover >= 0.4) {
                push({
                    id: GENERIC_ID('rel'),
                    topicId,
                    fromId: a.id,
                    toId: b.id,
                    relation: 'related_to',
                    weight: Math.max(0.3, Math.min(0.6, cover)),
                    createdAt: Date.now(),
                });
            }
        }
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
): { dup?: TopicClaim; candidate?: TopicClaim } {
    const t = tokenize(text);
    let bestCandidate: TopicClaim | undefined;
    let bestSim = 0;
    for (const claim of existing) {
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
    }
    return bestCandidate ? { candidate: bestCandidate } : {};
}
