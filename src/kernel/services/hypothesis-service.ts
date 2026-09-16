import { genId } from '../../utils/gen-id';
import { z } from 'zod';
import type { IHypothesisService, ProposeHypothesisInput } from '../contracts/hypothesis';
import type {
    ResearchHypothesis,
    HypothesisCategory,
    HypothesisStatus,
} from '../types/research-types';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';

const HYPOTHESIS_UPDATE_SCHEMA = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).optional(),
    category: z.enum(['arch', 'prompt', 'routing', 'gov']).optional(),
    status: z.enum(['proposed', 'debating', 'accepted', 'rejected', 'archived']).optional(),
    sourceFile: z.string().optional(),
    evidenceRefs: z.array(z.string()).optional(),
    linkedDebateId: z.string().optional(),
});

const LOGGER = rootLogger.child('HypothesisService');

const STORAGE_KEY = 'research_hypotheses';

const SEED_HYPOTHESES: ResearchHypothesis[] = [
    {
        id: 'seed-1',
        title: 'Debate runtime: split into domain-specific modules',
        description:
            'The debate runtime is organized across debate-engine, debate-session, debate-metrics, debate-prompt-builder, debate-finalizer, and debate-sync-manager modules under debate-runtime/.',
        category: 'arch',
        status: 'accepted',
        createdAt: Date.now() - 86400000 * 2,
        sourceFile: 'src/kernel/services/debate-runtime/',
        evidenceRefs: ['docs/DEBT_REPORT.md D-02'],
    },
    {
        id: 'seed-2',
        title: 'Unify argument strategy prompts across topology agents',
        description:
            'Argument strategies are injected at multiple levels across agents. A single strategy registry would reduce duplication.',
        category: 'prompt',
        status: 'proposed',
        createdAt: Date.now() - 86400000,
        sourceFile: 'src/kernel/state/topology-defaults.ts',
        evidenceRefs: ['src/kernel/services/debate-prompt-builder.ts'],
    },
    {
        id: 'seed-3',
        title: 'Factor circuit breaker state into router weights',
        description:
            'Router weights do not account for open circuits. Adding breaker state as a multiplier would avoid wasted requests.',
        category: 'routing',
        status: 'debating',
        createdAt: Date.now() - 86400000 * 3,
        linkedDebateId: 'demo-debate',
        evidenceRefs: ['src/llm/decorators/circuit-breaker.ts'],
    },
];

export interface HypothesisServiceDeps {
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    eventBus: { emit: (event: string, data?: unknown) => void };
}

export class HypothesisService implements IHypothesisService {
    private hypotheses: ResearchHypothesis[] = [];

    constructor(private deps: HypothesisServiceDeps) {}
    private _initialized = false;

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        const saved = await this.deps.database.getKv<ResearchHypothesis[]>(STORAGE_KEY);
        if (saved?.length) {
            this.hypotheses = saved;
        } else {
            this.hypotheses = [...SEED_HYPOTHESES];
            await this.persist();
        }
    }

    destroy(): void {
        this._initialized = false;
        this.hypotheses = [];
    }

    getAll(): ResearchHypothesis[] {
        return [...this.hypotheses];
    }

    async propose(input: ProposeHypothesisInput): Promise<ResearchHypothesis> {
        const title =
            input.title?.trim() ||
            this.mockTitle(input.category, input.sourceFile, input.description);
        const hypothesis: ResearchHypothesis = {
            id: genId('h'),
            title,
            description: input.description.trim(),
            category: input.category,
            status: 'proposed',
            createdAt: Date.now(),
            sourceFile: input.sourceFile?.trim() || undefined,
            evidenceRefs: input.evidenceRefs ?? [],
        };
        this.hypotheses = [hypothesis, ...this.hypotheses];
        await this.persist();
        this.deps.eventBus.emit(EVENTS.NOTIFICATION, {
            message: `Hypothesis proposed: ${title}`,
            type: 'info',
        });
        this.deps.eventBus.emit(EVENTS.HYPOTHESES_UPDATED, { hypotheses: this.hypotheses });
        return hypothesis;
    }

    async update(
        id: string,
        patch: Partial<ResearchHypothesis>,
    ): Promise<ResearchHypothesis | null> {
        const idx = this.hypotheses.findIndex((h) => h.id === id);
        if (idx === -1) return null;

        const parsed = HYPOTHESIS_UPDATE_SCHEMA.safeParse(patch);
        if (!parsed.success) {
            LOGGER.warn('HypothesisService', 'Invalid update fields', {
                errors: parsed.error.flatten().fieldErrors,
            });
            return null;
        }

        const allowed = parsed.data as Partial<ResearchHypothesis>;
        this.hypotheses[idx] = { ...this.hypotheses[idx]!, ...allowed };
        await this.persist();
        this.deps.eventBus.emit(EVENTS.HYPOTHESES_UPDATED, { hypotheses: this.hypotheses });
        return this.hypotheses[idx]!;
    }

    async remove(id: string): Promise<void> {
        this.hypotheses = this.hypotheses.filter((h) => h.id !== id);
        await this.persist();
        this.deps.eventBus.emit(EVENTS.HYPOTHESES_UPDATED, { hypotheses: this.hypotheses });
    }

    async linkDebate(id: string, debateId: string): Promise<void> {
        await this.update(id, { linkedDebateId: debateId, status: 'debating' });
    }

    async setStatus(id: string, status: HypothesisStatus): Promise<void> {
        await this.update(id, { status });
    }

    private async persist(): Promise<void> {
        try {
            await this.deps.database.setKv(STORAGE_KEY, this.hypotheses);
        } catch (e) {
            LOGGER.warn('HypothesisService', 'Persist failed', { error: e });
        }
    }

    private mockTitle(
        category: HypothesisCategory,
        sourceFile: string | undefined,
        description: string,
    ): string {
        const file = sourceFile?.split('/').pop() ?? 'system';
        const snippet = description.slice(0, 48).trim();
        const labels: Record<HypothesisCategory, string> = {
            arch: 'Architecture',
            prompt: 'Prompt',
            routing: 'Routing',
            gov: 'Governance',
        };
        return `${labels[category]} improvement for ${file}: ${snippet}${description.length > 48 ? '…' : ''}`;
    }
}
