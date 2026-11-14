import Dexie, { type Table } from 'dexie';
import type { WorkPlan } from './assistant-planner-service';

/**
 * AssistantPlannerDB — separate Dexie instance for structured plans (M4).
 * Kept apart from the main schema so its versioning never touches the
 * product-wide DB (same pattern as WikiBrain / ProjectGraph).
 */
export class AssistantPlannerDB extends Dexie {
    plans!: Table<WorkPlan, string>;

    constructor(dbName = 'aios-assistant-planner') {
        super(dbName);
        this.version(1).stores({
            plans: 'id, projectId, status, createdAt',
        });
    }
}

let _db: AssistantPlannerDB | undefined;

export function createAssistantPlannerDB(dbName = 'aios-assistant-planner'): AssistantPlannerDB {
    if (!_db) _db = new AssistantPlannerDB(dbName);
    return _db;
}

export function getAssistantPlannerDB(): AssistantPlannerDB {
    if (!_db)
        throw new Error(
            'AssistantPlannerDB not initialized — call createAssistantPlannerDB() first',
        );
    return _db;
}
