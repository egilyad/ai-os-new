import type { ILifecycle } from './lifecycle';
import type {
    GenerationJob,
    GenerationJobId,
    GenerationTrigger,
    GeneratorLimits,
} from '../types/generator-types';

/**
 * Knowledge Generator — autonomous research cycle (plan §5).
 *
 * Pipeline: trigger → hypothesis → evidence → peer review → crystallization.
 * The output is a new (semi-)crystal when peer-review confidence crosses the
 * crystallization threshold. It is NOT a single agent — it orchestrates the
 * existing services (lensEngine, crystalVault, roles, debate archetypes).
 *
 * Triggers: scheduled (cron), anomaly, gap, forum-question,
 * crystal-conflict, cross-domain.
 */
export interface IKnowledgeGeneratorService extends ILifecycle {
    /** Start a generation job from a trigger. Returns the new job id. */
    generateFromTrigger(trigger: GenerationTrigger): Promise<GenerationJobId>;
    /** Get the current status + full state of a job. */
    getStatus(jobId: GenerationJobId): Promise<GenerationJob | null>;
    /** Cancel a queued/running job. */
    cancel(jobId: GenerationJobId): Promise<boolean>;
    /** List all active (queued/running) jobs. */
    listActiveJobs(): Promise<GenerationJob[]>;
    /** Override per-job limits (max tokens, concurrency, threshold). */
    setLimits(limits: Partial<GeneratorLimits>): void;
}
