/**
 * CrewRepository — DAL wrapper for Crew + Task persistence (Wave 1.1).
 *
 * Two Dexie tables (v23):
 *   - crews: 'id, status, process, createdAt'
 *   - crewTasks: 'id, crewId, status, assigneeId, createdAt'
 */
import type { DatabaseService } from '../services/database-service';
import type {
    AgentRole,
    Crew,
    CrewRecord,
    CrewTask,
    CrewTaskRecord,
} from '../types/crew-types';

function toCrew(r: CrewRecord): Crew {
    return {
        id: r.id,
        name: r.name,
        description: r.description,
        process: r.process,
        managerId: r.managerId,
        roles: r.roles,
        taskIds: r.taskIds,
        status: r.status,
        currentTaskId: r.currentTaskId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}

function toTask(r: CrewTaskRecord): CrewTask {
    return {
        id: r.id,
        crewId: r.crewId,
        description: r.description,
        expectedOutput: r.expectedOutput,
        assigneeId: r.assigneeId,
        outputSchema: r.outputSchema,
        status: r.status,
        dependsOn: r.dependsOn,
        output: r.output,
        error: r.error,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
    };
}

export class CrewRepository {
    constructor(private db: DatabaseService) {}

    // ── Crews ──
    async putCrew(crew: Crew): Promise<void> {
        const record: CrewRecord = { ...crew };
        await this.db.crews.put(record);
    }

    async getCrew(id: string): Promise<Crew | null> {
        const r = await this.db.crews.get(id);
        return r ? toCrew(r) : null;
    }

    async listCrews(): Promise<Crew[]> {
        const rows = await this.db.crews.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(toCrew);
    }

    async deleteCrew(id: string): Promise<void> {
        await this.db.crews.delete(id);
        const tasks = await this.db.crewTasks.where('crewId').equals(id).toArray();
        await Promise.all(tasks.map((t) => this.db.crewTasks.delete(t.id)));
    }

    // ── Tasks ──
    async putTask(task: CrewTask): Promise<void> {
        const record: CrewTaskRecord = { ...task };
        await this.db.crewTasks.put(record);
    }

    async getTask(id: string): Promise<CrewTask | null> {
        const r = await this.db.crewTasks.get(id);
        return r ? toTask(r) : null;
    }

    async listTasks(crewId: string): Promise<CrewTask[]> {
        const rows = await this.db.crewTasks.where('crewId').equals(crewId).toArray();
        rows.sort((a, b) => a.createdAt - b.createdAt);
        return rows.map(toTask);
    }

    async clear(): Promise<void> {
        await this.db.crewTasks.clear();
        await this.db.crews.clear();
    }
}

export type { AgentRole };
