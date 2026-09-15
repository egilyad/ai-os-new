/**
 * Phase 69 — Task Manager (AGEMS port, Phase 2).
 *
 * Full task lifecycle: CRUD, status transitions, claims, labels,
 * comments, work products.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IDatabaseService, IEventBus } from '../types/interfaces';
import { TaskManagerService } from '../services/task-manager-service';

export const registerPhase69: Phase = ({ register }) => {
    register('taskManagerService', (c: IContainer) => {
        return new TaskManagerService(
            c.get<IDatabaseService>('database'),
            c.get<IEventBus>('eventBus'),
        );
    });
};
