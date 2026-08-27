import type { ISynthesisEngineService } from '../../contracts/synthesis-engine';
import type { SynthesisRepository } from '../../dal/synthesis-repository';
import type { IEventBus } from '../../types/interfaces';
import type { ILensEngineService } from '../../contracts/lens-engine';
import type { ICrystalVaultService } from '../../contracts/knowledge-crystal';
import type { Role } from '../../types/role-types';
import type { Lens } from '../../types/lens-types';
import type {
    ConsensusZone,
    ConfidenceDist,
    DissentZone,
    Perspective,
    Synthesis,
    SynthesisDepth,
    SynthesisFeedback,
    SynthesisId,
    SynthesisInput,
    SynthesisQuery,
    SynthesisSessionRecord,
    UncertaintyZone,
} from '../../types/synthesis-types';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('SynthesisEngine');

const EMBEDDING_DIMENSIONS = 256;
/** Minimum pairwise similarity for two perspectives to form consensus. */
const CONSENSUS_EDGE = 0.32;
/** Minimum similarity for a semantic conflict (dissent) to be detected. */
const CONFLICT_EDGE = 0.34;
/** Perspectives below this confidence feed the uncertainty zone. */
const UNCERTAINTY_THRESHOLD = 0.35;
const BASE_TOKEN_COST = 140;

const NEGATION_MARKERS =
    /\b(не|нет|никогда|без|нельзя|not|no|never|without|недостаточно|вопреки|против)\b/i;

/**
 * Synthesis Engine — multi-perspective consensus orchestrator (plan §4).
 *
 * Not a single agent: it drives Decomposition → Parallel Perspectives →
 * Cross-Perspective Debate → Zone Identification → Synthesis Statement →
 * Optional Crystallization. Deterministic heuristics are used so the whole
 * pipeline is unit-testable without an LLM; production wiring can swap
 * perspective generation for real model calls.
 */
export class SynthesisEngineService implements ISynthesisEngineService {
    private _initialized = false;

    constructor(
        private deps: {
            repository: SynthesisRepository;
            eventBus: IEventBus;
            lensEngine: ILensEngineService;
            crystalVault: ICrystalVaultService;
            roles?: (roleId: string) => Promise<Role | undefined>;
        },
    ) {}

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
    }

    async destroy(): Promise<void> {
        this._initialized = false;
    }

    async synthesize(input: SynthesisInput): Promise<SynthesisId> {
        const question = input.question?.trim();
        if (!question) throw new Error('SynthesisEngine: question is required');
        if (input.roleIds.length === 0)
            throw new Error('SynthesisEngine: at least one role is required');
        if (input.lensIds.length === 0)
            throw new Error('SynthesisEngine: at least one lens is required');

        const depth: SynthesisDepth = input.depth ?? 'standard';
        const preserveDissent = input.preserveDissent ?? true;
        const debateStrategy = input.debateStrategy ?? 'round_robin';
        const id = genId('synthesis');

        this.deps.eventBus.emit(EVENTS.SYNTHESIS_STARTED, {
            synthesisId: id,
            question,
            roleCount: input.roleIds.length,
            lensCount: input.lensIds.length,
            depth,
        });

        const startedAt = Date.now();
        const subQuestions = this.decompose(question, depth);
        const perspectives = await this.generatePerspectives(input, subQuestions, depth);
        const zones = this.identifyZones(perspectives, preserveDissent);
        const statement = this.buildStatement(zones, preserveDissent);
        const confidenceDistribution = this.distribute(zones);
        const tokenCost = this.estimateTokens(perspectives, subQuestions);

        const [supportingCrystals, contradictingCrystals] =
            await this.findRelatedCrystals(question);

        const synthesis: Synthesis = {
            id,
            status: 'completed',
            input: { ...input, depth, preserveDissent, debateStrategy },
            subQuestions,
            perspectives,
            consensusZones: zones.consensus,
            dissentZones: zones.dissent,
            uncertaintyZones: zones.uncertainty,
            synthesizedStatement: statement,
            confidenceDistribution,
            supportingCrystals,
            contradictingCrystals,
            debateIds: [],
            totalTokensSpent: tokenCost,
            createdAt: startedAt,
            completedAt: Date.now(),
        };

        await this.persist(synthesis);
        this.deps.eventBus.emit(EVENTS.SYNTHESIS_COMPLETED, {
            synthesisId: id,
            statement,
            consensusZones: zones.consensus.length,
            dissentZones: zones.dissent.length,
            uncertaintyZones: zones.uncertainty.length,
            confidence: confidenceDistribution.consensus,
        });

        LOGGER.info('SynthesisEngine', 'synthesize() complete', {
            id,
            perspectives: perspectives.length,
            tokens: tokenCost,
        });
        return id;
    }

    async getSynthesis(id: SynthesisId): Promise<Synthesis | null> {
        const record = await this.deps.repository.getSession(id);
        if (!record) return null;
        return record.synthesis ?? null;
    }

    async list(opts?: SynthesisQuery): Promise<Synthesis[]> {
        const records = await this.deps.repository.listSessions({
            status: opts?.status,
            limit: opts?.limit,
        });
        const out: Synthesis[] = [];
        for (const r of records) {
            if (r.synthesis) out.push(r.synthesis);
        }
        return out;
    }

    async refine(id: SynthesisId, feedback: SynthesisFeedback): Promise<Synthesis | null> {
        const parent = await this.getSynthesis(id);
        if (!parent || parent.status === 'running') return null;

        const context =
            (parent.input.context ?? '') +
            (feedback.comments ? `\nУточнение пользователя: ${feedback.comments}` : '') +
            (feedback.focusAreas?.length
                ? `\nФокус внимания: ${feedback.focusAreas.join(', ')}`
                : '');

        const refinedInput: SynthesisInput = {
            ...parent.input,
            context: context.trim() || undefined,
            depth: parent.input.depth,
        };
        const newId = await this.synthesize(refinedInput);
        const refined = await this.getSynthesis(newId);
        if (!refined) return null;
        refined.refinedFrom = id;
        refined.status = 'refined';
        await this.persist(refined);

        this.deps.eventBus.emit(EVENTS.SYNTHESIS_REFINED, {
            synthesisId: newId,
            refinedFrom: id,
            focusAreas: feedback.focusAreas,
        });
        return refined;
    }

    async exportToCrystal(id: SynthesisId): Promise<string> {
        const synthesis = await this.getSynthesis(id);
        if (!synthesis) throw new Error(`Synthesis ${id} not found`);
        if (synthesis.generatedCrystalId) return synthesis.generatedCrystalId;

        const statement =
            synthesis.consensusZones.length > 0
                ? synthesis.consensusZones
                      .map((z) => z.claim)
                      .join(' ')
                      .slice(0, 400)
                : synthesis.synthesizedStatement;

        const crystalId = await this.deps.crystalVault.propose({
            content: {
                statement,
                elaboration: synthesis.synthesizedStatement,
                assumptions: synthesis.input.context ? [synthesis.input.context] : undefined,
            },
            originKind: 'synthesis',
            originId: `synthesis://${id}`,
            contributingAgents: synthesis.perspectives.map((p) => p.roleId),
            linkedLensIds: synthesis.input.lensIds,
            linkedRoleIds: synthesis.input.roleIds,
            supportingCrystalIds: synthesis.supportingCrystals,
            totalTokensSpent: synthesis.totalTokensSpent,
        });

        synthesis.generatedCrystalId = crystalId;
        await this.persist(synthesis);
        this.deps.eventBus.emit(EVENTS.SYNTHESIS_EXPORTED_TO_CRYSTAL, {
            synthesisId: id,
            crystalId,
        });
        return crystalId;
    }

    async exportToForum(id: SynthesisId): Promise<string> {
        const synthesis = await this.getSynthesis(id);
        if (!synthesis) throw new Error(`Synthesis ${id} not found`);
        const topicId = genId('topic');
        this.deps.eventBus.emit(EVENTS.SYNTHESIS_EXPORTED_TO_FORUM, {
            synthesisId: id,
            topicId,
            statement: synthesis.synthesizedStatement,
        });
        return topicId;
    }

    // ── Step 1: Decomposition ───────────────────────────────────────────────

    private decompose(question: string, depth: SynthesisDepth): string[] {
        const clauses = question
            .split(/[.!?]|\b(?:и|а|но|затем|однако|при этом)\b/gi)
            .map((c) => (c ?? '').trim())
            .filter((c) => c.length > 8);

        const cap = depth === 'quick' ? 1 : depth === 'deep' ? 5 : 3;
        const picked = clauses.length > 1 ? clauses.slice(0, cap) : [question];

        const result = picked.map((c) => (c.endsWith('?') ? c : `${c}?`));
        if (result.length < 2) {
            result.push(`Какие ограничения применимы к: ${question}?`);
            result.push(`Каковы критерии успеха для: ${question}?`);
        }
        return result.slice(0, cap + 1);
    }

    // ── Step 2: Parallel Perspectives ───────────────────────────────────────

    private async generatePerspectives(
        input: SynthesisInput,
        subQuestions: string[],
        depth: SynthesisDepth,
    ): Promise<Perspective[]> {
        const pairs: Array<{ roleId: string; lensId: string }> = [];
        for (const roleId of input.roleIds) {
            for (const lensId of input.lensIds) {
                pairs.push({ roleId, lensId });
            }
        }
        const maxPairs = depth === 'deep' ? 12 : depth === 'quick' ? 4 : 8;
        const selected = pairs.slice(0, maxPairs);

        const perspectives: Perspective[] = [];
        for (const pair of selected) {
            const [role, lens] = await Promise.all([
                this.deps.roles ? this.deps.roles(pair.roleId) : undefined,
                Promise.resolve(this.deps.lensEngine.getLens(pair.lensId)),
            ]);
            perspectives.push(
                this.buildPerspective(
                    pair.roleId,
                    pair.lensId,
                    input.question,
                    input.context,
                    role,
                    lens,
                    subQuestions,
                ),
            );
        }
        if (perspectives.length === 0) return [];
        return perspectives;
    }

    private buildPerspective(
        roleId: string,
        lensId: string,
        question: string,
        context: string | undefined,
        role: Role | undefined,
        lens: Lens | undefined,
        subQuestions: string[],
    ): Perspective {
        const roleName = role?.name ?? `Роль ${roleId}`;
        const lensName = lens?.name ?? `Линза ${lensId}`;
        const roleLine = (role?.systemPrompt ?? role?.description ?? 'Нейтральный эксперт').slice(
            0,
            140,
        );
        const lensQuestions = this.lensQuestionsOf(lens);
        const angle = lensQuestions.length > 0 ? lensQuestions.join(' ') : `анализ: ${question}`;

        const argument =
            `Позиция «${roleName}» через линзу «${lensName}»: ${roleLine} ${context ?? ''} ${angle}`.trim();
        const keyClaims = this.extractClaims(role, lens, question);
        const concessions = this.extractConcessions(roleId, lensId);

        return {
            id: genId('perspective'),
            roleId,
            roleName,
            lensId,
            lensName,
            argument,
            confidence: this.deterministicConfidence(roleId, lensId, question),
            keyClaims,
            concessions,
            subQuestions,
            tokensUsed: 40 + Math.ceil(argument.length / 4),
        };
    }

    private lensQuestionsOf(lens: Lens | undefined): string[] {
        if (!lens) return [];
        if (lens.transform.kind === 'perspective-inject') return lens.transform.questions;
        if (lens.transform.kind === 'composite') {
            return lens.transform.transforms
                .filter(
                    (t): t is Extract<Lens['transform'], { kind: 'perspective-inject' }> =>
                        t.kind === 'perspective-inject',
                )
                .flatMap((t) => t.questions);
        }
        return [];
    }

    private extractClaims(
        role: Role | undefined,
        lens: { name: string } | undefined,
        question: string,
    ): string[] {
        const claims: string[] = [];
        if (role?.description) claims.push(role.description.slice(0, 100));
        if (lens?.name) claims.push(`Анализ через линзу «${lens.name}»`);
        if (claims.length === 0) claims.push(question.slice(0, 100));
        return claims.slice(0, 3);
    }

    private extractConcessions(roleId: string, lensId: string): string[] {
        const text = `${roleId} ${lensId}`.toLowerCase();
        const concessions: string[] = [];
        if (lensId.includes('dissent')) {
            concessions.push('Признаёт ценность противоположной позиции');
        }
        if (text.includes('neutral') || text.includes('аналит')) {
            concessions.push('Учитывает неопределённость данных');
        }
        return concessions;
    }

    private deterministicConfidence(roleId: string, lensId: string, question: string): number {
        let hash = 0;
        for (const ch of `${roleId}:${lensId}:${question}`) {
            hash = (hash << 5) - hash + ch.charCodeAt(0);
            hash |= 0;
        }
        const base = (Math.abs(hash) % 55) / 100; // 0..0.55
        return Math.min(0.85, Math.max(0.25, 0.3 + base));
    }

    // ── Step 3+4: Debate + Zone Identification ──────────────────────────────

    private identifyZones(
        perspectives: Perspective[],
        preserveDissent: boolean,
    ): { consensus: ConsensusZone[]; dissent: DissentZone[]; uncertainty: UncertaintyZone[] } {
        const consensus: ConsensusZone[] = [];
        const dissent: DissentZone[] = [];
        const uncertainty: UncertaintyZone[] = [];

        if (perspectives.length === 0) return { consensus, dissent, uncertainty };

        // 1) Agreement graph → connected components = consensus zones.
        const edges: Array<[number, number, number]> = [];
        for (let i = 0; i < perspectives.length; i++) {
            for (let j = i + 1; j < perspectives.length; j++) {
                const a = perspectives[i]!;
                const b = perspectives[j]!;
                const sim = this.semanticScore(a.argument, b.argument);
                const conflicting =
                    NEGATION_MARKERS.test(a.argument) !== NEGATION_MARKERS.test(b.argument);
                if (sim >= CONSENSUS_EDGE && !conflicting) edges.push([i, j, sim]);
                if (sim >= CONFLICT_EDGE && conflicting) {
                    dissent.push({
                        id: genId('dissent'),
                        kind: 'dissent',
                        claim: this.dissentClaim(a, b),
                        positions: [
                            { perspectiveId: a.id, stance: a.argument.slice(0, 90) },
                            { perspectiveId: b.id, stance: b.argument.slice(0, 90) },
                        ],
                        irreducible: preserveDissent && a.confidence >= 0.5 && b.confidence >= 0.5,
                    });
                }
            }
        }

        const components = this.components(perspectives.length, edges);
        for (const comp of components) {
            const members = comp.map((idx) => perspectives[idx]!);
            if (members.length === 0) continue;
            const confidence = members.reduce((s, p) => s + p.confidence, 0) / members.length;
            const claim = this.consensusClaim(members);
            consensus.push({
                id: genId('consensus'),
                kind: 'consensus',
                claim,
                supportingPerspectiveIds: members.map((p) => p.id),
                confidence: Math.round(confidence * 100) / 100,
            });
        }

        // 2) Uncertainty from low-confidence perspectives not in any consensus.
        const covered = new Set(consensus.flatMap((z) => z.supportingPerspectiveIds));
        for (const p of perspectives) {
            if (p.confidence < UNCERTAINTY_THRESHOLD || !covered.has(p.id)) {
                uncertainty.push({
                    id: genId('uncertainty'),
                    kind: 'uncertainty',
                    claim: p.keyClaims[0] ?? p.argument.slice(0, 80),
                    why: `Низкая уверенность (${(p.confidence * 100).toFixed(0)}%) или отсутствие поддержки в консенсусе`,
                    neededEvidences: [
                        'Эмпирические данные для проверки утверждения',
                        'Кросс-проверка с независимым источником',
                    ],
                });
            }
        }

        return { consensus, dissent, uncertainty };
    }

    private components(n: number, edges: Array<[number, number, number]>): number[][] {
        const parent = Array.from({ length: n }, (_, i) => i);
        const find = (x: number): number => {
            while (parent[x]! !== x) {
                parent[x] = parent[parent[x]!]!;
                x = parent[x]!;
            }
            return x;
        };
        const union = (a: number, b: number): void => {
            const ra = find(a);
            const rb = find(b);
            if (ra !== rb) parent[rb] = ra;
        };
        for (const [a, b] of edges) union(a, b);
        const groups = new Map<number, number[]>();
        for (let i = 0; i < n; i++) {
            const r = find(i);
            const list = groups.get(r) ?? [];
            list.push(i);
            groups.set(r, list);
        }
        return [...groups.values()].filter((g) => g.length > 1);
    }

    private consensusClaim(members: Perspective[]): string {
        const longest = [...members].sort((a, b) => b.argument.length - a.argument.length)[0]!;
        return longest.keyClaims[0] ?? longest.argument.slice(0, 90);
    }

    private dissentClaim(a: Perspective, b: Perspective): string {
        return `Разногласие между «${a.roleName}» и «${b.roleName}» по вопросу согласованности позиций`;
    }

    // ── Step 5: Synthesis Statement ─────────────────────────────────────────

    private buildStatement(
        zones: {
            consensus: ConsensusZone[];
            dissent: DissentZone[];
            uncertainty: UncertaintyZone[];
        },
        preserveDissent: boolean,
    ): string {
        const parts: string[] = [];
        if (zones.consensus.length > 0) {
            const avg =
                zones.consensus.reduce((s, z) => s + z.confidence, 0) / zones.consensus.length;
            const qualifier =
                avg >= 0.6
                    ? 'Высокая уверенность'
                    : avg >= 0.45
                      ? 'Умеренная уверенность'
                      : 'Слабая уверенность';
            parts.push(
                `Консенсус (${qualifier}): ${zones.consensus.map((z) => z.claim).join('; ')}`,
            );
        } else {
            parts.push('Устойчивого консенсуса не достигнуто');
        }
        if (preserveDissent && zones.dissent.length > 0) {
            parts.push(
                `Сохранённое несогласие: ${zones.dissent
                    .map((d) => (d.irreducible ? `[неразрешимо] ${d.claim}` : d.claim))
                    .join('; ')}`,
            );
        }
        if (zones.uncertainty.length > 0) {
            parts.push(`Неопределённость: ${zones.uncertainty.map((u) => u.claim).join('; ')}`);
        }
        return parts.join('. ') + '.';
    }

    private distribute(zones: {
        consensus: ConsensusZone[];
        dissent: DissentZone[];
        uncertainty: UncertaintyZone[];
    }): ConfidenceDist {
        const c = zones.consensus.length;
        const d = zones.dissent.length;
        const u = zones.uncertainty.length;
        const total = c + d + u;
        if (total === 0) return { consensus: 0, dissent: 0, uncertainty: 0 };
        const round = (x: number): number => Math.round(x * 100) / 100;
        const consensusShare = round(c / total);
        const dissentShare = round(d / total);
        const uncertaintyShare = round(u / total);
        // Normalize any floating-point drift so the distribution sums to 1.
        const sum = consensusShare + dissentShare + uncertaintyShare;
        return {
            consensus: round(consensusShare / sum) || 0,
            dissent: round(dissentShare / sum) || 0,
            uncertainty: round(uncertaintyShare / sum) || 0,
        };
    }

    // ── Crystallization support ─────────────────────────────────────────────

    private async findRelatedCrystals(question: string): Promise<[string[], string[]]> {
        try {
            const hits = await this.deps.crystalVault.search(question, 6);
            const supporting = hits.filter((h) => h.score >= 0.18).map((h) => h.crystal.crystalId);
            const contradicting = hits
                .filter((h) => h.score >= 0.14 && h.score < 0.18)
                .map((h) => h.crystal.crystalId);
            return [supporting, contradicting];
        } catch {
            return [[], []];
        }
    }

    // ── Persistence ─────────────────────────────────────────────────────────

    private async persist(synthesis: Synthesis): Promise<void> {
        const record: SynthesisSessionRecord = {
            id: synthesis.id,
            question: synthesis.input.question,
            status: synthesis.status,
            depth: synthesis.input.depth ?? 'standard',
            preserveDissent: synthesis.input.preserveDissent ?? true,
            lensIds: synthesis.input.lensIds,
            roleIds: synthesis.input.roleIds,
            synthesizedStatement: synthesis.synthesizedStatement,
            createdAt: synthesis.createdAt,
            synthesis,
        };
        await this.deps.repository.putSession(record);
        for (const p of synthesis.perspectives) {
            await this.deps.repository.putPerspective({
                id: p.id,
                synthesisId: synthesis.id,
                roleId: p.roleId,
                lensId: p.lensId,
                argument: p.argument,
                confidence: p.confidence,
                tokensUsed: p.tokensUsed,
            });
        }
    }

    private estimateTokens(perspectives: Perspective[], subQuestions: string[]): number {
        const base =
            BASE_TOKEN_COST + subQuestions.reduce((s, q) => s + Math.ceil(q.length / 4), 0);
        return base + perspectives.reduce((s, p) => s + p.tokensUsed, 0);
    }

    // ── Semantic helpers ────────────────────────────────────────────────────

    private semanticScore(a: string, b: string): number {
        return Math.max(
            this.trigramDice(a, b),
            this.stemOverlap(a, b),
            this.cosine(this.embed(a), this.embed(b)),
        );
    }

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
