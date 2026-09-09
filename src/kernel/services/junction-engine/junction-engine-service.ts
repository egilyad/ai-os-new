import type { IJunctionEngineService, JunctionSourceView } from '../../contracts/junction-engine';
import type { JunctionRepository } from '../../dal/junction-repository';
import type { ICrystalVaultService } from '../../contracts/knowledge-crystal';
import type { IEventBus } from '../../types/interfaces';
import type {
    Junction,
    JunctionAgentRole,
    JunctionCandidate,
    JunctionId,
    JunctionQuery,
    JunctionSource,
    JunctionSynthesisType,
} from '../../types/junction-types';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('JunctionEngine');

const EMBEDDING_DIMENSIONS = 256;
const STRONG_THRESHOLD = 0.5;
const WEAK_THRESHOLD = 0.3;

/** Negation signals — used by ContradictionMiner. */
const NEGATION_MARKERS =
    /\b(не|нет|никогда|без|нельзя|not|no|never|without|недостаточно|вопреки)\b/i;

const ABSTRACT_MARKERS =
    /\b(принцип|паттерн|структура|абстракци|архитектур|закон|механизм|система|architecture|pattern|principle|mechanism|structure)\b/i;

/**
 * Junction Engine — cross-domain synthesis (plan §3).
 *
 * JunctionDetector pairs knowledge sources from different domains and
 * classifies each pair as NONE|WEAK|STRONG using semantic + structural
 * heuristics. STRONG pairs become JunctionCandidates.
 *
 * Triplet agents map to synthesis types:
 *   - BridgeBuilder         → structural_analogy
 *   - ContradictionMiner    → contradiction
 *   - AbstractionElevator   → abstraction / pattern_completion
 *
 * JunctionValidator publishes STRONG candidates as pending junctions; a
 * counterargument either validates or rejects the junction.
 */
export class JunctionEngineService implements IJunctionEngineService {
    private _initialized = false;
    /** In-memory candidates from the last detect() run. */
    private candidates = new Map<string, JunctionCandidate>();

    constructor(
        private deps: {
            repository: JunctionRepository;
            eventBus: IEventBus;
            crystalVault: ICrystalVaultService;
            debateSources?: () => Promise<JunctionSourceView[]>;
        },
    ) {}

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
    }

    async destroy(): Promise<void> {
        this._initialized = false;
        this.candidates.clear();
    }

    async detect(): Promise<JunctionCandidate[]> {
        const sources = await this.getSources();
        const pairs = this.buildPairs(sources);

        const found: JunctionCandidate[] = [];
        for (const [a, b] of pairs) {
            const evaluation = this.evaluatePair(a, b);
            if (!evaluation || evaluation.confidence < STRONG_THRESHOLD) continue;
            const candidate = this.toCandidate(a, b, evaluation);
            this.candidates.set(candidate.candidateId, candidate);
            found.push(candidate);
            this.deps.eventBus.emit(EVENTS.JUNCTION_DETECTED, {
                junctionId: candidate.candidateId,
                inputs: candidate.inputs.map((s) => s.id),
                synthesisType: candidate.synthesisType,
                confidence: candidate.confidence,
            });
        }

        LOGGER.info('JunctionEngine', 'detect() complete', {
            pairs: pairs.length,
            candidates: found.length,
        });
        return found;
    }

    async validate(candidateId: JunctionId): Promise<Junction | null> {
        const candidate = this.candidates.get(candidateId);
        if (!candidate) return null;

        const junction: Junction = {
            id: genId('junction'),
            inputs: candidate.inputs,
            synthesisType: candidate.synthesisType,
            confidence: candidate.confidence,
            content: this.synthesize(candidate),
            status: 'pending',
            cognitiveDebt: this.cognitiveDebtFor(candidate),
            rationale: candidate.rationale,
            agentRole: candidate.agentRole,
            createdAt: Date.now(),
        };
        await this.deps.repository.put(junction);
        this.candidates.delete(candidateId);
        return junction;
    }

    async submitCounterargument(
        junctionId: JunctionId,
        counterArgument: string,
        agentId?: string,
    ): Promise<Junction | null> {
        const junction = await this.deps.repository.get(junctionId);
        if (!junction || junction.status !== 'pending') return null;

        const content = junction.content;
        const contradiction =
            NEGATION_MARKERS.test(counterArgument) &&
            this.semanticScore(counterArgument, content) > 0.4;

        if (contradiction) {
            junction.status = 'rejected';
            junction.rejectedAt = Date.now();
            await this.deps.repository.put(junction);
            this.deps.eventBus.emit(EVENTS.JUNCTION_REJECTED, {
                junctionId,
                reason: counterArgument,
                agentId: agentId ?? null,
            });
            return junction;
        }

        junction.status = 'validated';
        junction.validatedAt = Date.now();
        await this.deps.repository.put(junction);
        this.deps.eventBus.emit(EVENTS.JUNCTION_VALIDATED, {
            junctionId,
            confidence: junction.confidence,
            content: junction.content,
        });
        return junction;
    }

    async reject(junctionId: JunctionId, reason: string): Promise<Junction | null> {
        const junction = await this.deps.repository.get(junctionId);
        if (!junction) return null;
        junction.status = 'rejected';
        junction.rejectedAt = Date.now();
        await this.deps.repository.put(junction);
        this.deps.eventBus.emit(EVENTS.JUNCTION_REJECTED, {
            junctionId,
            reason,
            agentId: null,
        });
        return junction;
    }

    async get(id: JunctionId): Promise<Junction | null> {
        return (await this.deps.repository.get(id)) ?? null;
    }

    async list(opts?: JunctionQuery): Promise<Junction[]> {
        let junctions = await this.deps.repository.list();
        if (opts?.status) junctions = junctions.filter((j) => j.status === opts.status);
        if (opts?.synthesisType)
            junctions = junctions.filter((j) => j.synthesisType === opts.synthesisType);
        if (opts?.domain)
            junctions = junctions.filter((j) => j.inputs.some((s) => s.domain === opts.domain));
        junctions.sort((a, b) => b.createdAt - a.createdAt);
        if (opts?.limit && junctions.length > opts.limit)
            junctions = junctions.slice(0, opts.limit);
        return junctions;
    }

    async getSources(): Promise<JunctionSourceView[]> {
        const views: JunctionSourceView[] = [];

        // Crystals (mature knowledge units with explicit domains)
        try {
            const crystals = await this.deps.crystalVault.list();
            for (const c of crystals) {
                if (c.status === 'refuted' || c.status === 'superseded') continue;
                views.push({
                    kind: 'crystal',
                    id: `crystal://${c.crystalId}`,
                    label: c.content.statement.slice(0, 72),
                    domain: c.applicableDomain,
                    statement: `${c.content.statement} ${c.content.elaboration ?? ''}`.trim(),
                });
            }
        } catch (e) {
            LOGGER.warn('JunctionEngine', 'failed to read crystals', { error: e });
        }

        // Debate verdicts (optional provider — e.g. DAL-backed)
        try {
            const debateViews = this.deps.debateSources ? await this.deps.debateSources() : [];
            views.push(...debateViews);
        } catch (e) {
            LOGGER.warn('JunctionEngine', 'failed to read debate sources', { error: e });
        }

        return views;
    }

    // ── Detector internals ──────────────────────────────────────────────────

    private buildPairs(
        sources: JunctionSourceView[],
    ): Array<[JunctionSourceView, JunctionSourceView]> {
        const pairs: Array<[JunctionSourceView, JunctionSourceView]> = [];
        for (let i = 0; i < sources.length; i++) {
            for (let j = i + 1; j < sources.length; j++) {
                const a = sources[i]!;
                const b = sources[j]!;
                // Only pair sources from different domains (cross-domain synthesis)
                if (a.domain === b.domain) continue;
                pairs.push([a, b]);
            }
        }
        return pairs;
    }

    private evaluatePair(
        a: JunctionSourceView,
        b: JunctionSourceView,
    ): {
        type: JunctionSynthesisType;
        confidence: number;
        rationale: string;
        role: JunctionAgentRole;
    } | null {
        const semantic = this.semanticScore(a.statement, b.statement);
        const negationA = NEGATION_MARKERS.test(a.statement);
        const negationB = NEGATION_MARKERS.test(b.statement);

        // ContradictionMiner: semantically close but opposite polarity
        if (semantic > 0.5 && negationA !== negationB) {
            return {
                type: 'contradiction',
                confidence: Math.min(0.98, semantic + 0.15),
                rationale: 'Семантически близкие утверждения противоположной полярности',
                role: 'contradiction-miner',
            };
        }

        // AbstractionElevator: shared abstract structure
        if (ABSTRACT_MARKERS.test(a.statement) && ABSTRACT_MARKERS.test(b.statement)) {
            return {
                type: 'abstraction',
                confidence: Math.min(0.95, 0.5 + semantic),
                rationale: 'Общая абстрактная структура в разных доменах',
                role: 'abstraction-elevator',
            };
        }

        // BridgeBuilder: structural analogy via shared vocabulary
        if (semantic >= STRONG_THRESHOLD) {
            return {
                type: 'structural_analogy',
                confidence: semantic,
                rationale: 'Структурная аналогия: общий понятийный каркас в разных доменах',
                role: 'bridge-builder',
            };
        }

        // Pattern completion: moderate similarity, one side is a concrete instance
        if (semantic >= WEAK_THRESHOLD) {
            return {
                type: 'pattern_completion',
                confidence: Math.min(0.8, semantic + 0.1),
                rationale: 'Завершение паттерна: конкретный случай дополняет общий принцип',
                role: 'bridge-builder',
            };
        }

        return null;
    }

    private toCandidate(
        a: JunctionSourceView,
        b: JunctionSourceView,
        evaluation: NonNullable<ReturnType<typeof this.evaluatePair>>,
    ): JunctionCandidate {
        return {
            candidateId: genId('junction-candidate'),
            inputs: [this.toSource(a), this.toSource(b)],
            synthesisType: evaluation.type,
            confidence: evaluation.confidence,
            rationale: evaluation.rationale,
            agentRole: evaluation.role,
            createdAt: Date.now(),
        };
    }

    private toSource(v: JunctionSourceView): JunctionSource {
        return {
            kind: v.kind,
            id: v.id,
            label: v.label,
            domain: v.domain,
            statement: v.statement,
        };
    }

    private synthesize(c: JunctionCandidate): string {
        const [a, b] = c.inputs;
        switch (c.synthesisType) {
            case 'contradiction':
                return `Противоречие между доменами «${a!.domain}» и «${b!.domain}»: «${a!.statement}» против «${b!.statement}». Требуется разрешение через дебат.`;
            case 'abstraction':
                return `Абстракция: «${a!.statement}» и «${b!.statement}» разделяют общий структурный принцип (S' = f(A, B)).`;
            case 'pattern_completion':
                return `Завершение паттерна: «${a!.statement}» и «${b!.statement}» образуют полный цикл (общий принцип + конкретный случай).`;
            case 'structural_analogy':
            default:
                return `Структурная аналогия: «${a!.statement}» (${a!.domain}) ⟷ «${b!.statement}» (${b!.domain}). Новое знание S' объединяет оба понятийных каркаса.`;
        }
    }

    private cognitiveDebtFor(c: JunctionCandidate): string {
        switch (c.synthesisType) {
            case 'contradiction':
                return 'Провести дебат между сторонниками обоих утверждений; проверить эмпирически, какая сторона выдерживает контраргумент.';
            case 'abstraction':
                return 'Сформулировать общий принцип как новый кристалл; проверить применимость к третьему домену.';
            case 'structural_analogy':
                return 'Построить формальную модель переноса структуры из домена A в домен B и проверить на 2 контрольных примерах.';
            case 'pattern_completion':
            default:
                return 'Проверить, что конкретный случай действительно порождается общим принципом; задокументировать исключения.';
        }
    }

    private semanticScore(a: string, b: string): number {
        const trigram = this.trigramDice(a, b);
        const overlap = this.stemOverlap(a, b);
        const embedding = this.cosine(this.embed(a), this.embed(b));
        // Combine three orthogonal signals: shared morphemes (trigram), shared
        // stemmed content words (overlap), and hashed-embedding cosine. The max
        // ensures inflection-heavy pairs (isolates/responsibility, layer/layering)
        // are detected even when the embedding cosine is weak.
        return Math.max(trigram, overlap, embedding);
    }

    /** Character 3-gram Dice coefficient — captures shared morphemes. */
    private trigramDice(a: string, b: string): number {
        const grams = (s: string): Set<string> => {
            const tokens = s.toLowerCase().replace(/[^a-zа-яё0-9\s]/g, '');
            const set = new Set<string>();
            for (let i = 0; i + 3 <= tokens.length; i++) set.add(tokens.slice(i, i + 3));
            return set;
        };
        const ga = grams(a);
        const gb = grams(b);
        if (ga.size === 0 || gb.size === 0) return 0;
        let inter = 0;
        for (const g of ga) if (gb.has(g)) inter++;
        return (2 * inter) / (ga.size + gb.size);
    }

    /** Stemmed content-word overlap (shared / min set). Robust to inflections. */
    private stemOverlap(a: string, b: string): number {
        const stem = (w: string): string =>
            w
                .replace(/ing$/, '')
                .replace(/ies$/, 'y')
                .replace(/es$/, '')
                .replace(/ed$/, '')
                .replace(/s$/, '');
        const words = (s: string): Set<string> =>
            new Set(
                s
                    .toLowerCase()
                    .replace(/[^a-zа-яё0-9\s]/g, '')
                    .split(/\s+/)
                    .filter((w) => w.length > 3)
                    .map(stem),
            );
        const sa = words(a);
        const sb = words(b);
        if (sa.size === 0 || sb.size === 0) return 0;
        let inter = 0;
        for (const w of sa) if (sb.has(w)) inter++;
        return inter / Math.min(sa.size, sb.size);
    }

    private embed(text: string): number[] {
        const vector = new Array(EMBEDDING_DIMENSIONS).fill(0);
        const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
        for (const token of tokens) {
            let hash = 0;
            for (let i = 0; i < token.length; i++) {
                hash = (hash << 5) - hash + token.charCodeAt(i);
                hash |= 0;
            }
            vector[Math.abs(hash) % EMBEDDING_DIMENSIONS]! += 1;
        }
        let norm = 0;
        for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) norm += vector[i]! * vector[i]!;
        if (norm > 0) {
            const inv = 1 / Math.sqrt(norm);
            for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) vector[i]! *= inv;
        }
        return vector;
    }

    private cosine(a: number[], b: number[]): number {
        let dot = 0;
        for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
        return dot;
    }
}
