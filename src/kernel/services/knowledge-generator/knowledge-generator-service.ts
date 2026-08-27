import type { IKnowledgeGeneratorService } from '../../contracts/knowledge-generator';
import type { GeneratorRepository } from '../../dal/generator-repository';
import type { IEventBus } from '../../types/interfaces';
import type { ILensEngineService } from '../../contracts/lens-engine';
import type { ICrystalVaultService } from '../../contracts/knowledge-crystal';
import type { Role } from '../../types/role-types';
import type {
    GenerationEvidence,
    GenerationJob,
    GenerationJobId,
    GenerationReview,
    GenerationStage,
    GenerationTrigger,
    GeneratorLimits,
} from '../../types/generator-types';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('KnowledgeGenerator');

const DEFAULT_LIMITS: GeneratorLimits = {
    maxTokensPerJob: 20_000,
    maxConcurrentJobs: 4,
    crystallizationThreshold: 0.55,
};

const ROLE_POOL = [
    'arch',
    'llm',
    'economist',
    'security',
    'governance',
    'philosopher',
    'engineer',
    'product',
];

const REVIEW_ARCHETYPES: Array<{
    roleId: string;
    roleName: string;
    stance: GenerationReview['stance'];
    verdict: GenerationReview['verdict'];
    confidence: number;
}> = [
    {
        roleId: 'advocate',
        roleName: 'Адвокат',
        stance: 'advocate',
        verdict: 'accept',
        confidence: 0.82,
    },
    {
        roleId: 'skeptic',
        roleName: 'Скептик',
        stance: 'skeptic',
        verdict: 'accept',
        confidence: 0.55,
    },
    {
        roleId: 'synthesizer',
        roleName: 'Синтезатор',
        stance: 'synthesizer',
        verdict: 'accept',
        confidence: 0.78,
    },
    {
        roleId: 'metanavigator',
        roleName: 'Метанавигатор',
        stance: 'metanavigator',
        verdict: 'accept',
        confidence: 0.72,
    },
];

/**
 * Knowledge Generator — autonomous research cycle orchestrator (plan §5).
 *
 * Not a single agent: it drives Hypothesis Generation → Evidence Collection →
 * Peer Review Debate → Crystallization on top of the existing services
 * (lensEngine, crystalVault, role loader). Deterministic heuristics keep the
 * whole pipeline unit-testable without an LLM; production wiring can swap
 * stage generation for real model calls.
 */
export class KnowledgeGeneratorService implements IKnowledgeGeneratorService {
    private _initialized = false;
    private limits: GeneratorLimits = { ...DEFAULT_LIMITS };
    private activeCount = 0;

    constructor(
        private deps: {
            repository: GeneratorRepository;
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

    setLimits(limits: Partial<GeneratorLimits>): void {
        this.limits = { ...this.limits, ...limits };
    }

    async generateFromTrigger(trigger: GenerationTrigger): Promise<GenerationJobId> {
        const topic = this.topicOf(trigger);
        if (!topic.trim()) throw new Error('KnowledgeGenerator: trigger has no research topic');

        // Synchronous concurrency guard (before the first await).
        if (this.activeCount >= this.limits.maxConcurrentJobs) {
            throw new Error(
                `KnowledgeGenerator: maxConcurrentJobs (${this.limits.maxConcurrentJobs}) exceeded`,
            );
        }
        this.activeCount++;

        const id = genId('gen');
        const createdAt = Date.now();
        const job: GenerationJob = {
            id,
            trigger,
            topic,
            status: 'queued',
            stage: 'hypothesis',
            hypothesis: '',
            roleIds: [],
            lensIds: [],
            evidences: [],
            reviews: [],
            confidence: 0,
            tokensSpent: 0,
            createdAt,
        };

        this.deps.eventBus.emit(EVENTS.GENERATOR_STARTED, {
            jobId: id,
            triggerKind: trigger.kind,
            topic,
        });

        try {
            await this.runJob(job);
        } finally {
            this.activeCount--;
        }
        return id;
    }

    async getStatus(jobId: GenerationJobId): Promise<GenerationJob | null> {
        const record = await this.deps.repository.getJob(jobId);
        if (!record) return null;
        return record.job ?? null;
    }

    async cancel(jobId: GenerationJobId): Promise<boolean> {
        const record = await this.deps.repository.getJob(jobId);
        if (!record?.job) return false;
        const job = record.job;
        if (job.status !== 'queued' && job.status !== 'running') return false;
        job.status = 'cancelled';
        job.stage = 'done';
        job.completedAt = Date.now();
        await this.save(job);
        this.deps.eventBus.emit(EVENTS.GENERATOR_CANCELLED, { jobId });
        return true;
    }

    async listActiveJobs(): Promise<GenerationJob[]> {
        const running = await this.deps.repository.listJobs({ status: 'running' });
        const queued = await this.deps.repository.listJobs({ status: 'queued' });
        const active = [...running, ...queued].sort((a, b) => b.createdAt - a.createdAt);
        const out: GenerationJob[] = [];
        for (const r of active) if (r.job) out.push(r.job);
        return out;
    }

    // ── Pipeline ─────────────────────────────────────────────────────────────

    private async runJob(job: GenerationJob): Promise<void> {
        job.status = 'running';
        job.startedAt = Date.now();
        await this.save(job);

        try {
            // Stage 1: Hypothesis (contrastive prompt per role × lens).
            await this.emitStage(job, 'hypothesis');
            const hypothesis = await this.generateHypothesis(job);
            job.hypothesis = hypothesis.text;
            job.roleIds = hypothesis.roleIds;
            job.lensIds = hypothesis.lensIds;
            job.tokensSpent += 60 + Math.ceil(job.topic.length / 4);
            await this.save(job);

            // Stage 2: Evidence (crystal vault + counter-examples).
            await this.emitStage(job, 'evidence');
            job.evidences = await this.collectEvidence(job);
            job.tokensSpent += job.evidences.length * 30;
            await this.save(job);

            // Stage 3: Peer review debate (advocate/skeptic/synthesizer/metanavigator).
            await this.emitStage(job, 'review');
            const review = this.peerReview(job);
            job.reviews = review.reviews;
            job.confidence = review.confidence;
            job.tokensSpent += review.reviews.length * 40;
            await this.save(job);

            // Stage 4: Crystallization → propose + crystallize when strong enough.
            await this.emitStage(job, 'crystallization');
            if (job.confidence >= this.limits.crystallizationThreshold) {
                const crystalId = await this.crystallize(job);
                job.crystalId = crystalId;
                job.tokensSpent += 80;
            }
            await this.save(job);

            job.status = 'completed';
            job.stage = 'done';
            job.completedAt = Date.now();
            await this.save(job);

            this.deps.eventBus.emit(EVENTS.GENERATOR_COMPLETED, {
                jobId: job.id,
                crystalId: job.crystalId ?? null,
                confidence: job.confidence,
            });
            LOGGER.info('KnowledgeGenerator', 'job complete', {
                id: job.id,
                confidence: job.confidence,
                crystalId: job.crystalId,
                tokens: job.tokensSpent,
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            job.status = 'failed';
            job.error = message;
            job.completedAt = Date.now();
            await this.save(job);
            this.deps.eventBus.emit(EVENTS.GENERATOR_FAILED, { jobId: job.id, error: message });
            LOGGER.error('KnowledgeGenerator', 'job failed', { id: job.id, error: message });
        }
    }

    // ── Stage 1: Hypothesis ──────────────────────────────────────────────────

    private async generateHypothesis(job: GenerationJob): Promise<{
        text: string;
        roleIds: string[];
        lensIds: string[];
    }> {
        const lensIds = this.lensPool();
        const roleIds = this.pickRoles(job.topic, job.trigger);
        const candidates: Array<{ text: string; score: number }> = [];

        for (let i = 0; i < roleIds.length; i++) {
            const roleId = roleIds[i]!;
            const lensId = lensIds[i % lensIds.length]!;
            const role = this.deps.roles ? await this.deps.roles(roleId) : undefined;
            const lens = this.deps.lensEngine.getLens(lensId);
            const roleName = role?.name ?? `Роль ${roleId}`;
            const lensName = lens?.name ?? `Линза ${lensId}`;

            const affirm =
                `Гипотеза «${roleName}» через линзу «${lensName}»: утверждение «${job.topic}» подтверждается ` +
                (role?.description ?? 'анализом доступных данных');
            const negate =
                `Контр-гипотеза «${roleName}» через линзу «${lensName}»: утверждение «${job.topic}» ` +
                'нуждается в ограничениях и не подтверждается без дополнительных данных';

            const text = i % 2 === 0 ? affirm : negate;
            candidates.push({
                text,
                score:
                    this.hypothesisScore(text, job.topic) +
                    (candidates.length % 2 === 0 ? 0.05 : 0),
            });
        }

        const best = [...candidates].sort((a, b) => b.score - a.score)[0]!;
        return { text: best.text, roleIds, lensIds };
    }

    private lensPool(): string[] {
        const all = this.deps.lensEngine.listLenses();
        const metas = all
            .filter((l) => l.id.startsWith('lens:meta') || l.id === 'lens:critical')
            .map((l) => l.id);
        if (metas.length === 0) return ['lens:critical'];
        return metas.slice(0, 3);
    }

    private pickRoles(topic: string, trigger: GenerationTrigger): string[] {
        const hash = this.hash(`${trigger.kind}:${topic}`);
        const count = 3;
        const picked: string[] = [];
        for (let i = 0; i < count; i++) {
            const idx = Math.abs(hash + i * 7) % ROLE_POOL.length;
            const roleId = ROLE_POOL[idx]!;
            if (!picked.includes(roleId)) picked.push(roleId);
        }
        return picked;
    }

    private hypothesisScore(text: string, topic: string): number {
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
        const topicWords = words(topic);
        const textWords = words(text);
        if (topicWords.size === 0) return 0.3;
        let inter = 0;
        for (const w of topicWords) if (textWords.has(w)) inter++;
        return inter / Math.max(1, topicWords.size) + 0.3;
    }

    // ── Stage 2: Evidence ────────────────────────────────────────────────────

    private async collectEvidence(job: GenerationJob): Promise<GenerationEvidence[]> {
        const out: GenerationEvidence[] = [];
        try {
            const hits = await this.deps.crystalVault.search(job.topic, 4);
            for (const h of hits) {
                const stance =
                    h.score >= 0.18 ? 'support' : h.score >= 0.14 ? 'contradict' : 'neutral';
                out.push({
                    id: genId('ev'),
                    source: 'crystal-vault',
                    content: h.crystal.content.statement.slice(0, 200),
                    stance,
                    score: h.score,
                });
            }
        } catch {
            // Crystal vault unavailable — continue with synthetic evidence.
        }

        // Counter-example placeholders from the lens stack (memory mesh role).
        const lensIds = job.lensIds.length > 0 ? job.lensIds : ['lens:critical'];
        for (const lensId of lensIds) {
            const lens = this.deps.lensEngine.getLens(lensId);
            if (!lens) continue;
            out.push({
                id: genId('ev'),
                source: 'counter-example',
                content: `Контр-пример из линзы «${lens.name}»: случай, когда «${job.topic}» не выполняется.`,
                stance: 'neutral',
                score: 0.2,
            });
        }
        return out;
    }

    // ── Stage 3: Peer review ─────────────────────────────────────────────────

    private peerReview(job: GenerationJob): { reviews: GenerationReview[]; confidence: number } {
        const support = job.evidences.filter((e) => e.stance === 'support').length;
        const contradict = job.evidences.filter((e) => e.stance === 'contradict').length;

        const reviews: GenerationReview[] = REVIEW_ARCHETYPES.map((a) => ({
            roleId: a.roleId,
            roleName: a.roleName,
            stance: a.stance,
            verdict: a.verdict,
            argument: this.archetypeArgument(a.stance, job.topic, support, contradict),
            confidence: a.confidence,
        }));

        const reviewAvg =
            reviews.reduce((s, r) => s + r.confidence, 0) / Math.max(1, reviews.length);
        const balance = support + contradict === 0 ? 0.5 : support / (support + contradict);
        const jitter = (this.hash(job.topic) % 7) / 100;
        const raw = 0.45 * reviewAvg + 0.35 * balance + 0.2 * 0.5 + jitter;
        const confidence = Math.round(Math.min(0.92, Math.max(0.2, raw)) * 100) / 100;
        return { reviews, confidence };
    }

    private archetypeArgument(
        stance: GenerationReview['stance'],
        topic: string,
        support: number,
        contradict: number,
    ): string {
        switch (stance) {
            case 'advocate':
                return `Приводит доводы в пользу: подтверждающие свидетельства (${support}), логическая последовательность по «${topic}».`;
            case 'skeptic':
                return `Оспаривает: противоречия (${contradict}), границы применимости утверждения «${topic}» не установлены.`;
            case 'synthesizer':
                return `Интегрирует: объединяет доводы защитника и скептика в квалифицированное утверждение по «${topic}».`;
            case 'metanavigator':
                return `Оценивает качество дебатов: полнота свидетельств по «${topic}» и риски преждевременной кристаллизации.`;
        }
    }

    // ── Stage 4: Crystallization ─────────────────────────────────────────────

    private async crystallize(job: GenerationJob): Promise<string> {
        const crystalId = await this.deps.crystalVault.propose({
            content: {
                statement: job.hypothesis.slice(0, 400),
                elaboration: `Автономное исследование по теме «${job.topic}». Peer review: ${job.reviews.length} ролей, уверенность ${(job.confidence * 100).toFixed(0)}%.`,
                evidence: job.evidences.map((e) => e.content),
            },
            originKind: 'synthesis',
            originId: `generator://${job.id}`,
            contributingAgents: job.roleIds,
            linkedLensIds: job.lensIds,
            linkedRoleIds: job.roleIds,
            totalTokensSpent: job.tokensSpent,
        });
        try {
            await this.deps.crystalVault.crystallize(crystalId);
        } catch {
            // Crystallization promotion is best-effort.
        }
        return crystalId;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private topicOf(trigger: GenerationTrigger): string {
        switch (trigger.kind) {
            case 'scheduled':
                return trigger.topic;
            case 'anomaly':
                return `Анализ аномалии ${trigger.detectedAnomalyId}`;
            case 'gap':
                return trigger.gapDescription;
            case 'forum-question':
                return `Исследование вопроса форума ${trigger.topicId}`;
            case 'crystal-conflict':
                return `Конфликт кристаллов: ${trigger.crystalIds.join(', ')}`;
            case 'cross-domain':
                return `Кросс-доменный синтез: ${trigger.sourceDomains.join(', ')}`;
        }
    }

    private emitStage(job: GenerationJob, stage: GenerationStage): Promise<void> {
        this.deps.eventBus.emit(EVENTS.GENERATOR_STAGE, { jobId: job.id, stage });
        return Promise.resolve();
    }

    private async save(job: GenerationJob): Promise<void> {
        await this.deps.repository.putJob({
            id: job.id,
            trigger: job.trigger,
            topic: job.topic,
            status: job.status,
            stage: job.stage,
            hypothesis: job.hypothesis,
            confidence: job.confidence,
            crystalId: job.crystalId,
            error: job.error,
            createdAt: job.createdAt,
            job,
        });
    }

    private hash(text: string): number {
        let h = 0;
        for (let i = 0; i < text.length; i++) {
            h = (h << 5) - h + text.charCodeAt(i);
            h |= 0;
        }
        return h;
    }
}
