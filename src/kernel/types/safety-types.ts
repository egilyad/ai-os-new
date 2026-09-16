/**
 * Approval / Safety types (roadmapp.md §P10).
 */

export type PermissionLevel = 'read' | 'write' | 'execute' | 'admin';

export interface Capability {
    name: string;
    description: string;
    requiresApproval: boolean;
    level: PermissionLevel;
}

export interface ApprovalGate {
    id: string;
    projectId: string;
    name: string;
    requiredCapabilities: string[];
    approver: string; // 'human' | agentId
    status: 'pending' | 'approved' | 'denied';
    requestedAt: number;
    resolvedAt?: number;
    reason?: string;
}

export interface ExecutionLimit {
    maxTokensPerRun: number;
    maxToolCallsPerRun: number;
    maxDurationMs: number;
    maxConcurrentRuns: number;
    allowedToolNames: string[];
    blockedToolNames: string[];
}

export const DEFAULT_EXECUTION_LIMITS: ExecutionLimit = {
    maxTokensPerRun: 100000,
    maxToolCallsPerRun: 50,
    maxDurationMs: 300000, // 5 minutes
    maxConcurrentRuns: 3,
    allowedToolNames: [],
    blockedToolNames: ['delete_project', 'modify_permissions'],
};

export interface SandboxBoundary {
    networkAccess: boolean;
    filesystemRoot?: string; // only this path is accessible
    maxMemoryMb: number;
    maxCpuSeconds: number;
    canSpawnWorkers: boolean;
    canAccessDOM: boolean;
}

export const DEFAULT_SANDBOX: SandboxBoundary = {
    networkAccess: false,
    maxMemoryMb: 256,
    maxCpuSeconds: 30,
    canSpawnWorkers: false,
    canAccessDOM: false,
};
