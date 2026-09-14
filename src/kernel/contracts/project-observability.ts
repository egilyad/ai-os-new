/**
 * Project observability contract (roadmapp.md §P8).
 */
import type {
    ActivityEvent,
    ActivityEventType,
    ToolCallRecord,
    ErrorRecord,
    FileChangeRecord,
    ProjectObservability,
} from '../types/observability-types';

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
