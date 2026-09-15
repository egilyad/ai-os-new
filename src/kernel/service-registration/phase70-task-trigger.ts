/**
 * Phase 70 — Task Triggers (AGEMS port, Phase 2.8).
 *
 * External event triggers for tasks: webhook / gmail / n8n.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IDatabaseService, IEventBus } from '../types/interfaces';
import { TaskTriggerService } from '../services/task-trigger-service';

export const registerPhase70: Phase = ({ register }) => {
    register('taskTriggerService', (c: IContainer) => {
        return new TaskTriggerService(
            c.get<IDatabaseService>('database'),
            c.get<IEventBus>('eventBus'),
        );
    });
};
