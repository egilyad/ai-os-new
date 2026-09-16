/**
 * Project observability types (roadmapp.md §P8).
 */

export type ActivityEventType =
    | 'project.created'
    | 'project.updated'
    | 'project.deleted'
    | 'task.created'
    | 'task.started'
    | 'task.completed'
    | 'task.failed'
    | 'run.started'
    | 'run.completed'
    | 'run.failed'
    | 'file.created'
    | 'file.updated'
    | 'file.deleted'
    | 'agent.assigned'
    | 'agent.unassigned'
    | 'pipeline.advanced'
    | 'pipeline.completed'
    | 'python.run'
    | 'qa.inspection'
    | 'memory.added';

export interface ActivityEvent {
    id: string;
    projectId: string;
    type: ActivityEventType;
    agentId?: string;
    details: Record<string, unknown>;
    timestamp: number;
}

export interface ToolCallRecord {
    id: string;
    projectId: string;
    agentId: string;
    toolName: string;
    input: unknown;
    output: unknown;
    durationMs: number;
    success: boolean;
    error?: string;
    timestamp: number;
}

export interface ErrorRecord {
    id: string;
    projectId: string;
    source: string; // e.g. 'agent', 'runtime', 'sandbox'
    message: string;
    stack?: string;
    severity: 'warning' | 'error' | 'critical';
    resolved: boolean;
    timestamp: number;
}

export interface FileChangeRecord {
    id: string;
    projectId: string;
    filePath: string;
    changeType: 'created' | 'updated' | 'deleted';
    agentId?: string;
    sizeBytes: number;
    timestamp: number;
}

export interface ProjectObservability {
    activity: ActivityEvent[];
    toolCalls: ToolCallRecord[];
    errors: ErrorRecord[];
    fileChanges: FileChangeRecord[];
    summary: {
        totalActivity: number;
        totalToolCalls: number;
        totalErrors: number;
        unresolvedErrors: number;
        totalFileChanges: number;
        lastActivityAt?: number;
    };
}
