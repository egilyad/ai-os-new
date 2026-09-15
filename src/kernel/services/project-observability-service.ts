/**
 * ProjectObservabilityService — tracks project activity, tool calls, errors, file changes (roadmapp.md §P8).
 */
import type {
    ActivityEvent,
    ActivityEventType,
    ToolCallRecord,
    ErrorRecord,
    FileChangeRecord,
    ProjectObservability,
} from '../types/observability-types';
import type { IEventBus } from '../types/interfaces';

export interface IProjectObservabilityService {
    logActivity(projectId: string, type: ActivityEventType, agentId?: string, details?: Record<string, unknown>): void;
    logToolCall(record: Omit<ToolCallRecord, 'id' | 'timestamp'>): void;
    logError(projectId: string, source: string, message: string, severity?: ErrorRecord['severity'], stack?: string): void;
    resolveError(projectId: string, errorId: string): void;
    logFileChange(projectId: string, filePath: string, changeType: FileChangeRecord['changeType'], sizeBytes: number, agentId?: string): void;
    getObservability(projectId: string): ProjectObservability;
    getActivity(projectId: string, limit?: number): ActivityEvent[];
    getToolCalls(projectId: string, limit?: number): ToolCallRecord[];
    getErrors(projectId: string, resolved?: boolean): ErrorRecord[];
    getFileChanges(projectId: string, limit?: number): FileChangeRecord[];
}

let eventCounter = 0;

export class ProjectObservabilityService implements IProjectObservabilityService {
    private activity = new Map<string, ActivityEvent[]>();
    private toolCalls = new Map<string, ToolCallRecord[]>();
    private errors = new Map<string, ErrorRecord[]>();
    private fileChanges = new Map<string, FileChangeRecord[]>();
    private eventBus: IEventBus;

    constructor(eventBus: IEventBus) {
        this.eventBus = eventBus;
    }

    logActivity(projectId: string, type: ActivityEventType, agentId?: string, details: Record<string, unknown> = {}): void {
        const event: ActivityEvent = {
            id: `act-${Date.now()}-${++eventCounter}`,
            projectId,
            type,
            agentId,
            details,
            timestamp: Date.now(),
        };

        const events = this.activity.get(projectId) || [];
        events.push(event);
        this.activity.set(projectId, events);

        this.eventBus.emit('project:activity:logged', { projectId, type, agentId: agentId || '' });
    }

    logToolCall(record: Omit<ToolCallRecord, 'id' | 'timestamp'>): void {
        const toolCall: ToolCallRecord = {
            ...record,
            id: `tc-${Date.now()}-${++eventCounter}`,
            timestamp: Date.now(),
        };

        const calls = this.toolCalls.get(record.projectId) || [];
        calls.push(toolCall);
        this.toolCalls.set(record.projectId, calls);
    }

    logError(projectId: string, source: string, message: string, severity: ErrorRecord['severity'] = 'error', stack?: string): string {
        const error: ErrorRecord = {
            id: `err-${Date.now()}-${++eventCounter}`,
            projectId,
            source,
            message,
            stack,
            severity,
            resolved: false,
            timestamp: Date.now(),
        };

        const errors = this.errors.get(projectId) || [];
        errors.push(error);
        this.errors.set(projectId, errors);

        this.eventBus.emit('project:error:logged', { projectId, source, severity, message });
        return error.id;
    }

    resolveError(projectId: string, errorId: string): void {
        const errors = this.errors.get(projectId) || [];
        const error = errors.find((e) => e.id === errorId);
        if (error) error.resolved = true;
    }

    logFileChange(projectId: string, filePath: string, changeType: FileChangeRecord['changeType'], sizeBytes: number, agentId?: string): void {
        const change: FileChangeRecord = {
            id: `fc-${Date.now()}-${++eventCounter}`,
            projectId,
            filePath,
            changeType,
            agentId,
            sizeBytes,
            timestamp: Date.now(),
        };

        const changes = this.fileChanges.get(projectId) || [];
        changes.push(change);
        this.fileChanges.set(projectId, changes);
    }

    getObservability(projectId: string): ProjectObservability {
        const activity = this.activity.get(projectId) || [];
        const toolCalls = this.toolCalls.get(projectId) || [];
        const errors = this.errors.get(projectId) || [];
        const fileChanges = this.fileChanges.get(projectId) || [];
        const unresolvedErrors = errors.filter((e) => !e.resolved).length;

        return {
            activity,
            toolCalls,
            errors,
            fileChanges,
            summary: {
                totalActivity: activity.length,
                totalToolCalls: toolCalls.length,
                totalErrors: errors.length,
                unresolvedErrors,
                totalFileChanges: fileChanges.length,
                lastActivityAt: activity.length > 0 ? activity[activity.length - 1].timestamp : undefined,
            },
        };
    }

    getActivity(projectId: string, limit = 50): ActivityEvent[] {
        return (this.activity.get(projectId) || []).slice(-limit);
    }

    getToolCalls(projectId: string, limit = 50): ToolCallRecord[] {
        return (this.toolCalls.get(projectId) || []).slice(-limit);
    }

    getErrors(projectId: string, resolved?: boolean): ErrorRecord[] {
        const errors = this.errors.get(projectId) || [];
        if (resolved === undefined) return errors;
        return errors.filter((e) => e.resolved === resolved);
    }

    getFileChanges(projectId: string, limit = 50): FileChangeRecord[] {
        return (this.fileChanges.get(projectId) || []).slice(-limit);
    }
}
