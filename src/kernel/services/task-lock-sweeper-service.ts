import { getDexieDb } from './database-service';
import type { AgemsTask } from '../types/agems-task';
import { rootLogger } from './logger-service';

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
        return requeued;
    }
}

export const taskLockSweeperService = new TaskLockSweeperService();
