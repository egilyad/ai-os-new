import type { IKnowledgeGeneratorService } from '../../contracts/knowledge-generator';
import type { GenerationJob } from '../../types/generator-types';
import { GeneratorRepository } from '../../dal/generator-repository';
import { getDexieDb } from '../database-service';
import type { DatabaseService } from '../database-service';

/**
 * Demo seed for the Knowledge Generator: runs one real generation pipeline
 * (hypothesis → evidence → peer review → crystallization, all local
 * heuristics) on a demo gap and returns the completed job.
 *
 * Idempotent: completed jobs with DEMO_TOPIC are reused (checked straight
 * from the job table — the service only lists active jobs).
 */
export const DEMO_GENERATOR_TOPIC = 'Демо: тихие часы снижают отток от уведомлений';

export async function seedGeneratorDemo(
    service: IKnowledgeGeneratorService,
    repository?: GeneratorRepository,
): Promise<GenerationJob> {
    const repo =
        repository ??
        new GeneratorRepository(getDexieDb() as unknown as DatabaseService);
    const existing = (await repo.listJobs()).find(
        (r) => r.job?.topic === DEMO_GENERATOR_TOPIC && r.status === 'completed',
    );
    if (existing?.job) return existing.job;

    // The gap description becomes the job topic (topicOf trigger).
    const id = await service.generateFromTrigger({
        kind: 'gap',
        gapDescription: DEMO_GENERATOR_TOPIC,
    });
    const job = await service.getStatus(id);
    if (!job) throw new Error('Generator demo: job vanished after generation');
    return job;
}
