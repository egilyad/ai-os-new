/**
 * ProjectService — the core service for managing projects.
 *
 * Implements IProjectService contract. Coordinates project lifecycle,
 * agent assignments, tasks, runs, files, and memory.
 */
import type { IProjectManagerService } from '../contracts/project';
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
import type { ProjectRepository } from '../dal/project-repository';
import type { IEventBus } from '../types/interfaces';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ProjectService');

function genId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyMemory(): ProjectMemory {
    return { goals: [], constraints: [], decisions: [], knownIssues: [], requirements: [] };
}

export class ProjectService implements IProjectManagerService {
    private repo: ProjectRepository;
    private eventBus?: IEventBus;

    constructor(repo: ProjectRepository, eventBus?: IEventBus) {
        this.repo = repo;
        this.eventBus = eventBus;
    }

    // ── CRUD ──

    async create(input: CreateProjectInput): Promise<Project> {
        const now = Date.now();
        const project: Project = {
            id: genId('project'),
            name: input.name,
            description: input.description,
            type: input.type,
            status: 'draft',
            agentIds: input.agentIds ?? [],
            memory: emptyMemory(),
            createdAt: now,
            updatedAt: now,
            metadata: {},
        };
        await this.repo.put(project);
        this.emit('project:created', { projectId: project.id, name: project.name, type: project.type });
        LOGGER.info('Project created', { id: project.id, name: project.name, type: project.type });
        return project;
    }

    async get(id: ProjectId): Promise<Project | undefined> {
        return this.repo.get(id);
    }

    async list(status?: ProjectStatus, type?: ProjectType): Promise<Project[]> {
        return this.repo.list(status, type);
    }

    async update(id: ProjectId, patch: Partial<Pick<Project, 'name' | 'description' | 'status' | 'metadata'>>): Promise<Project> {
        const project = await this.repo.get(id);
        if (!project) throw new Error(`Project not found: ${id}`);
        const updated = { ...project, ...patch, updatedAt: Date.now() };
        await this.repo.put(updated);
        this.emit('project:updated', { projectId: id, ...patch });
        return updated;
    }

    async delete(id: ProjectId): Promise<void> {
        await this.repo.delete(id);
        this.emit('project:deleted', { projectId: id });
        LOGGER.info('Project deleted', { id });
    }

    // ── Agents ──

    async assignAgent(projectId: ProjectId, agentId: string, role: string, capabilities: string[] = []): Promise<ProjectAgentAssignment> {
        const assignment: ProjectAgentAssignment = {
            projectId,
            agentId,
            role,
            capabilities,
            assignedAt: Date.now(),
        };
        await this.repo.putAssignment(assignment);
        const project = await this.repo.get(projectId);
        if (project && !project.agentIds.includes(agentId)) {
            project.agentIds = [...project.agentIds, agentId];
            project.updatedAt = Date.now();
            await this.repo.put(project);
        }
        this.emit('project:agent:assigned', { projectId, agentId, role });
        return assignment;
    }

    async removeAgent(projectId: ProjectId, agentId: string): Promise<void> {
        await this.repo.deleteAssignment(projectId, agentId);
        const project = await this.repo.get(projectId);
        if (project) {
            project.agentIds = project.agentIds.filter((id) => id !== agentId);
            project.updatedAt = Date.now();
            await this.repo.put(project);
        }
        this.emit('project:agent:removed', { projectId, agentId });
    }

    async listAgents(projectId: ProjectId): Promise<ProjectAgentAssignment[]> {
        return this.repo.listAssignments(projectId);
    }

    // ── Tasks ──

    async createTask(projectId: ProjectId, agentId: string, title: string, description: string, priority: string = 'medium'): Promise<ProjectTask> {
        const task: ProjectTask = {
            id: genId('task'),
            projectId,
            agentId,
            title,
            description,
            status: 'queued',
            priority: priority as ProjectTask['priority'],
            createdAt: Date.now(),
        };
        await this.repo.putTask(task);
        this.emit('project:task:created', { projectId, taskId: task.id, title });
        return task;
    }

    async getTask(taskId: string): Promise<ProjectTask | undefined> {
        return this.repo.getTask(taskId);
    }

    async listTasks(projectId: ProjectId, status?: TaskStatus): Promise<ProjectTask[]> {
        return this.repo.listTasks(projectId, status);
    }

    async updateTaskStatus(taskId: string, status: TaskStatus, result?: string): Promise<ProjectTask> {
        const task = await this.repo.getTask(taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        const updated: ProjectTask = {
            ...task,
            status,
            result,
            startedAt: status === 'running' ? Date.now() : task.startedAt,
            completedAt: status === 'completed' || status === 'failed' || status === 'cancelled' ? Date.now() : task.completedAt,
        };
        await this.repo.putTask(updated);
        this.emit('project:task:status', { projectId: task.projectId, taskId, status });
        return updated;
    }

    // ── Runs ──

    async startRun(taskId: string, agentId: string): Promise<ProjectRun> {
        const task = await this.repo.getTask(taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        const run: ProjectRun = {
            id: genId('run'),
            taskId,
            projectId: task.projectId,
            agentId,
            status: 'running',
            toolCalls: [],
            startedAt: Date.now(),
        };
        await this.repo.putRun(run);
        this.emit('project:run:started', { projectId: task.projectId, runId: run.id, taskId, agentId });
        return run;
    }

    async completeRun(runId: string, status: RunStatus, error?: string): Promise<ProjectRun> {
        const run = await this.repo.getRun(runId);
        if (!run) throw new Error(`Run not found: ${runId}`);
        const updated: ProjectRun = {
            ...run,
            status,
            error,
            completedAt: Date.now(),
        };
        await this.repo.putRun(updated);
        this.emit('project:run:completed', { projectId: run.projectId, runId, status });
        return updated;
    }

    async listRuns(projectId: string): Promise<ProjectRun[]> {
        return this.repo.listRuns(projectId);
    }

    // ── Files ──

    async writeFile(projectId: string, path: string, content: string, agentId?: string, taskId?: string): Promise<ProjectFile> {
        const existing = await this.repo.getFile(projectId, path);
        const file: ProjectFile = {
            projectId,
            path,
            content,
            lastModifiedBy: agentId,
            lastTaskId: taskId,
            createdAt: existing?.createdAt ?? Date.now(),
            updatedAt: Date.now(),
        };
        await this.repo.putFile(file);
        this.emit('project:file:updated', { projectId, path, agentId });
        return file;
    }

    async readFile(projectId: string, path: string): Promise<ProjectFile | undefined> {
        return this.repo.getFile(projectId, path);
    }

    async listFiles(projectId: string): Promise<ProjectFile[]> {
        return this.repo.listFiles(projectId);
    }

    async deleteFile(projectId: string, path: string): Promise<void> {
        await this.repo.deleteFile(projectId, path);
        this.emit('project:file:deleted', { projectId, path });
    }

    // ── Memory ──

    async getMemory(projectId: ProjectId): Promise<ProjectMemory> {
        const project = await this.repo.get(projectId);
        return project?.memory ?? emptyMemory();
    }

    async updateMemory(projectId: ProjectId, patch: Partial<ProjectMemory>): Promise<ProjectMemory> {
        const project = await this.repo.get(projectId);
        if (!project) throw new Error(`Project not found: ${projectId}`);
        project.memory = { ...project.memory, ...patch };
        project.updatedAt = Date.now();
        await this.repo.put(project);
        return project.memory;
    }

    private emit(event: string, data: Record<string, unknown>): void {
        try {
            this.eventBus?.emit(event, data);
        } catch { /* fire-and-forget */ }
    }
}
