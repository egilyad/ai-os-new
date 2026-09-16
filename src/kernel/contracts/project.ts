/**
 * Project service contract (roadmapp.md §1, §10, §11).
 *
 * NOTE: A separate IProjectService (simple stub) exists in contracts/rivals14.ts.
 * This IProjectManagerService is the full roadmapp.md project management contract.
 */
import type {
    Project,
    ProjectId,
    ProjectType,
    ProjectStatus,
    ProjectTask,
    ProjectRun,
    ProjectFile,
    ProjectMemory,
    ProjectAgentAssignment,
    CreateProjectInput,
    TaskStatus,
    RunStatus,
} from '../types/project-types';

export interface IProjectManagerService {
    // ── CRUD ──
    create(input: CreateProjectInput): Promise<Project>;
    get(id: ProjectId): Promise<Project | undefined>;
    list(status?: ProjectStatus, type?: ProjectType): Promise<Project[]>;
    update(id: ProjectId, patch: Partial<Pick<Project, 'name' | 'description' | 'status' | 'metadata'>>): Promise<Project>;
    delete(id: ProjectId): Promise<void>;

    // ── Agents ──
    assignAgent(projectId: ProjectId, agentId: string, role: string, capabilities?: string[]): Promise<ProjectAgentAssignment>;
    removeAgent(projectId: ProjectId, agentId: string): Promise<void>;
    listAgents(projectId: ProjectId): Promise<ProjectAgentAssignment[]>;

    // ── Tasks ──
    createTask(projectId: ProjectId, agentId: string, title: string, description: string, priority?: string): Promise<ProjectTask>;
    getTask(taskId: string): Promise<ProjectTask | undefined>;
    listTasks(projectId: ProjectId, status?: TaskStatus): Promise<ProjectTask[]>;
    updateTaskStatus(taskId: string, status: TaskStatus, result?: string): Promise<ProjectTask>;

    // ── Runs ──
    startRun(taskId: string, agentId: string): Promise<ProjectRun>;
    completeRun(runId: string, status: RunStatus, error?: string): Promise<ProjectRun>;
    listRuns(projectId: ProjectId): Promise<ProjectRun[]>;

    // ── Files ──
    writeFile(projectId: string, path: string, content: string, agentId?: string, taskId?: string): Promise<ProjectFile>;
    readFile(projectId: string, path: string): Promise<ProjectFile | undefined>;
    listFiles(projectId: string): Promise<ProjectFile[]>;
    deleteFile(projectId: string, path: string): Promise<void>;

    // ── Memory ──
    getMemory(projectId: ProjectId): Promise<ProjectMemory>;
    updateMemory(projectId: ProjectId, patch: Partial<ProjectMemory>): Promise<ProjectMemory>;
}
