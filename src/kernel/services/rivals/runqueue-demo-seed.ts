import type { RivalRepository } from '../../dal/rival-repository';
import { RivalRepository as RivalRepositoryImpl } from '../../dal/rival-repository';
import { getDexieDb } from '../database-service';
import type { DatabaseService } from '../database-service';
import type { QueuedRun } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';

/**
 * Demo seed for the Run Queue: one queued crew item (enqueue only, no
 * drain — the row visibly waits in the queue).
 *
 * Idempotent: queued runs with DEMO_QUEUE_REF are reused.
 */
export const DEMO_QUEUE_REF = 'demo-morning-paper';

export async function seedRunQueueDemo(repository?: RivalRepository): Promise<QueuedRun> {
    const repo =
        repository ?? new RivalRepositoryImpl(getDexieDb() as unknown as DatabaseService);
    const existing = (await repo.listQueued()).find((q) => q.refId === DEMO_QUEUE_REF);
    if (existing) return existing;
    const now = Date.now();
    const item: QueuedRun = {
        id: genId('queue'),
        kind: 'crew',
        refId: DEMO_QUEUE_REF,
        input: { goal: 'Демо: собрать утренний дайджест' },
        status: 'queued',
        createdAt: now,
        updatedAt: now,
    };
    await repo.putQueued(item);
    return item;
}
