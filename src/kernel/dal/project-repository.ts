/**
 * Project repository — CRUD for the projects domain.
 *
 * Follows the DAL convention: one repository per domain.
 * All project tables accessed through this repository.
 */
import type {
    Project,
    ProjectId,
    ProjectTask,
    ProjectRun,
    ProjectFile,
    ProjectAgentAssignment,
    ProjectStatus,
    ProjectType,
    TaskStatus,
} from '../types/project-types';
import type { DatabaseService } from '../services/database-service';
import { rootLogger } from '../services/logger-service';

const LOGGER = rootLogger.child('ProjectRepository');

export class ProjectRepository {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    // ── Projects ──

    async put(project: Project): Promise<void> {
        await this.db.projects.put(project);
    }

    async get(id: ProjectId): Promise<Project | undefined> {
        return this.db.projects.get(id);
    }

    async list(status?: ProjectStatus, type?: ProjectType): Promise<Project[]> {
        let collection = this.db.projects.toCollection();
        let items = await collection.toArray();
        if (status) items = items.filter((p) => p.status === status);
        if (type) items = items.filter((p) => p.type === type);
        return items.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    async delete(id: ProjectId): Promise<void> {
        await this.db.projects.delete(id);
        await this.db.projectTasks.where('projectId').equals(id).delete();
        await this.db.projectRuns.where('projectId').equals(id).delete();
        await this.db.projectFiles.where('projectId').equals(id).delete();
        await this.db.projectArtifacts.where('projectId').equals(id).delete();
        await this.db.projectAssignments.where('projectId').equals(id).delete();
    }

    // ── Tasks ──

    async putTask(task: ProjectTask): Promise<void> {
        await this.db.projectTasks.put(task);
    }

    async getTask(id: string): Promise<ProjectTask | undefined> {
        return this.db.projectTasks.get(id);
    }

    async listTasks(projectId: string, status?: TaskStatus): Promise<ProjectTask[]> {
        let items = await this.db.projectTasks.where('projectId').equals(projectId).toArray();
        if (status) items = items.filter((t) => t.status === status);
        return items.sort((a, b) => b.createdAt - a.createdAt);
    }

    // ── Runs ──

    async putRun(run: ProjectRun): Promise<void> {
        await this.db.projectRuns.put(run);
    }

    async getRun(id: string): Promise<ProjectRun | undefined> {
        return this.db.projectRuns.get(id);
    }

    async listRuns(projectId: string): Promise<ProjectRun[]> {
        return this.db.projectRuns
            .where('projectId')
            .equals(projectId)
            .toArray()
            .then((runs) => runs.sort((a, b) => b.startedAt - a.startedAt));
    }

    // ── Files ──

    async putFile(file: ProjectFile): Promise<void> {
        await this.db.projectFiles.put(file as any);
    }

    async getFile(projectId: string, path: string): Promise<ProjectFile | undefined> {
        return this.db.projectFiles.get([projectId, path]);
    }

    async listFiles(projectId: string): Promise<ProjectFile[]> {
        return this.db.projectFiles.where('projectId').equals(projectId).toArray();
    }

    async deleteFile(projectId: string, path: string): Promise<void> {
        await this.db.projectFiles.delete([projectId, path]);
    }

    // ── Assignments ──

    async putAssignment(assignment: ProjectAgentAssignment): Promise<void> {
        await this.db.projectAssignments.put(assignment);
    }

    async listAssignments(projectId: string): Promise<ProjectAgentAssignment[]> {
        return this.db.projectAssignments.where('projectId').equals(projectId).toArray();
    }

    async deleteAssignment(projectId: string, agentId: string): Promise<void> {
        await this.db.projectAssignments.delete([projectId, agentId]);
    }
}
