/**
 * Project domain types (roadmapp.md §1).
 *
 * A Project is a container for agent-driven work with its own workspace,
 * agents, tasks, runs, and artifacts.
 */

export type ProjectId = string;

export type ProjectType = 'website' | 'python' | 'node' | 'react' | 'data' | 'automation';

export type ProjectStatus = 'draft' | 'building' | 'running' | 'ready' | 'failed' | 'archived';

// ── Project ──

export interface Project {
    id: ProjectId;
    name: string;
    description: string;
    type: ProjectType;
    status: ProjectStatus;
    /** Agent IDs assigned to this project */
    agentIds: string[];
    /** Project memory: goals, constraints, decisions */
    memory: ProjectMemory;
    /** File tree root (virtual FS path or workspace handle) */
    workspacePath?: string;
    createdAt: number;
    updatedAt: number;
    metadata: Record<string, unknown>;
}

export interface ProjectMemory {
    goals: string[];
    constraints: string[];
    decisions: string[];
    knownIssues: string[];
    requirements: string[];
}

// ── Project Task ──

export type TaskStatus = 'queued' | 'running' | 'blocked' | 'completed' | 'failed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectTask {
    id: string;
    projectId: ProjectId;
    agentId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    result?: string;
}

// ── Project Run ──

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ProjectRun {
    id: string;
    taskId: string;
    projectId: ProjectId;
    agentId: string;
    status: RunStatus;
    /** Ordered list of tool calls made during the run */
    toolCalls: ToolCallRecord[];
    error?: string;
    startedAt: number;
    completedAt?: number;
}

export interface ToolCallRecord {
    tool: string;
    args: Record<string, unknown>;
    result?: unknown;
    error?: string;
    timestamp: number;
}

// ── Project File ──

export interface ProjectFile {
    projectId: string;
    path: string;
    content: string;
    /** Agent ID that last modified this file */
    lastModifiedBy?: string;
    /** Task ID that triggered the modification */
    lastTaskId?: string;
    createdAt: number;
    updatedAt: number;
}

// ── Project Artifact ──

export type ArtifactType = 'website' | 'python_script' | 'report' | 'image' | 'dataset';

export interface ProjectArtifact {
    id: string;
    projectId: ProjectId;
    type: ArtifactType;
    name: string;
    /** Files that comprise this artifact */
    files: string[];
    createdAt: number;
}

// ── Project Agent Assignment ──

export type AgentRole = 'director' | 'researcher' | 'developer' | 'designer' | 'content' | 'qa' | string;

export interface ProjectAgentAssignment {
    projectId: ProjectId;
    agentId: string;
    role: AgentRole;
    capabilities: string[];
    assignedAt: number;
}

// ── Create Input ──

export interface CreateProjectInput {
    name: string;
    description: string;
    type: ProjectType;
    agentIds?: string[];
}
