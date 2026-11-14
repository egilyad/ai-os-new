import { getDexieDb } from './database-service';
import type { AgemsTask } from '../types/agems-task';
import { rootLogger } from './logger-service';
import { fireDueRecurring } from './task-scheduler-adapter';

const LOGGER = rootLogger.child('TaskLockSweeper');

export class TaskLockSweeperService {
    private timer?: ReturnType<typeof setInterval>;

    start(intervalMs = 60_000): void {
        if (this.timer) return;
        this.timer = setInterval(() => {
            void this.sweep().catch((e) =>
                LOGGER.warn('TaskLockSweeper', 'sweep failed', { error: e }),
            );
        }, intervalMs);
    }

    stop(): void {
        this.destroy();
    }

    destroy(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    async sweep(): Promise<number> {
        const db = getDexieDb();
        const now = Date.now();
        const expired = (await db.agemsTasks
            .where('lockedUntil')
            .below(now)
            .toArray()) as unknown as AgemsTask[];
        let requeued = 0;
        for (const t of expired) {
            await db.agemsTasks.update(t.id, {
                status: t.status === 'IN_PROGRESS' ? 'PENDING' : t.status,
                lockedBy: undefined,
                lockedUntil: undefined,
                updatedAt: now,
            } as never);
            if (t.status === 'IN_PROGRESS') requeued += 1;
        }
        if (requeued > 0) LOGGER.info('TaskLockSweeper', 'requeued', { count: requeued });

        // M5.3 — retry/backoff for FAILED tasks
        const failed = (await db.agemsTasks
            .where('status')
            .equals('FAILED')
            .toArray()) as unknown as AgemsTask[];
        for (const t of failed) {
            const maxRetries = t.maxRetries ?? 3;
            const retryCount = t.retryCount ?? 0;
            if (retryCount >= maxRetries) continue;
            const nextRetryAt = t.nextRetryAt ?? 0;
            if (nextRetryAt > now) continue;
            const backoffMs = 60_000 * 2 ** retryCount;
            await db.agemsTasks.update(t.id, {
                status: 'PENDING',
                retryCount: retryCount + 1,
                nextRetryAt: now + backoffMs,
                updatedAt: now,
            } as never);
            requeued += 1;
        }

        // M5.1 — spawn due RECURRING instances
        try {
            await fireDueRecurring(undefined, now);
        } catch (e) {
            LOGGER.warn('TaskLockSweeper', 'recurring spawn failed', { error: e });
        }

        return requeued;
    }
}

export const taskLockSweeperService = new TaskLockSweeperService();
