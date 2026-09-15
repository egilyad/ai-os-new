/**
 * Task Trigger contract (AGEMS port, Phase 2.8).
 *
 * External event triggers that fire tasks: webhook / gmail / n8n.
 * Mirrors AGEMS TriggerKind + TriggerAuthKind + TaskTrigger model.
 */
import type {
    TaskTriggerRecord,
    CreateTaskTriggerInput,
    UpdateTaskTriggerInput,
} from '../types/task-types';

export interface ITaskTriggerService {
    create(input: CreateTaskTriggerInput): Promise<TaskTriggerRecord>;
    get(id: string): Promise<TaskTriggerRecord | undefined>;
    listByTask(taskId: string): Promise<TaskTriggerRecord[]>;
    listAll(): Promise<TaskTriggerRecord[]>;
    update(id: string, input: UpdateTaskTriggerInput): Promise<TaskTriggerRecord>;
    delete(id: string): Promise<void>;
    setEnabled(id: string, enabled: boolean): Promise<TaskTriggerRecord>;

    /** Verify an incoming event against the trigger's auth config. */
    verify(triggerId: string, payload: string, signature?: string, token?: string): Promise<boolean>;

    /** Simulate / record a firing (increments firingCount, sets lastFiredAt). */
    fire(triggerId: string, payload: string, signature?: string, token?: string): Promise<TaskTriggerRecord>;
}
