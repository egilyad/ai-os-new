/**
 * Approval / Safety types (roadmapp.md §P10 + AGEMS port Phase 3).
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

// ── AGEMS Phase 3: Approvals / HITL ──

export type ApprovalPreset = 'full_control' | 'supervised' | 'guided' | 'autopilot';

export interface ApprovalPresetConfig {
    id: string;
    name: string;
    preset: ApprovalPreset;
    description: string;
    /** Per-category defaults: which categories auto-approve vs require human */
    categoryDefaults: Record<ApprovalCategory, ApprovalAction>;
    /** Per-tool overrides (toolName → action) */
    toolOverrides: Record<string, ApprovalAction>;
    /** Auto-approve rules: conditions under which requests are auto-approved */
    autoApproveRules: AutoApproveRule[];
    isDefault?: boolean;
    createdAt: number;
    updatedAt: number;
}

export type ApprovalCategory = 'read' | 'write' | 'delete' | 'execute' | 'send' | 'admin';

export type ApprovalAction = 'auto_approve' | 'require_approval' | 'deny';

export interface AutoApproveRule {
    id: string;
    name: string;
    enabled: boolean;
    /** Match conditions */
    category?: ApprovalCategory;
    toolName?: string;      // exact match
    toolPattern?: string;   // glob pattern (e.g. "read_*")
    maxRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
    /** Time window (optional) */
    timeWindowStart?: string; // HH:MM
    timeWindowEnd?: string;   // HH:MM
    /** Limits */
    maxApprovalsPerHour?: number;
    maxApprovalsPerDay?: number;
    createdAt: number;
}

export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_approved';

export interface ApprovalRequest {
    id: string;
    agentId: string;
    toolName: string;
    toolInput?: string;
    category: ApprovalCategory;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    status: ApprovalRequestStatus;
    presetId?: string;
    /** Resolution */
    resolvedBy?: string;    // 'human' | 'auto' | agentId
    resolvedAt?: number;
    rejectionReason?: string;
    expiresAt?: number;
    /** Metadata */
    sessionId?: string;
    metadata?: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}

export interface ApprovalComment {
    id: string;
    requestId: string;
    authorType: 'human' | 'agent' | 'system';
    authorId: string;
    content: string;
    createdAt: number;
}

export interface CreateApprovalRequestInput {
    agentId: string;
    toolName: string;
    toolInput?: string;
    category: ApprovalCategory;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    presetId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    ttlMs?: number; // time-to-live for expiration
}

export interface UpdateApprovalPresetInput {
    name?: string;
    description?: string;
    categoryDefaults?: Record<ApprovalCategory, ApprovalAction>;
    toolOverrides?: Record<string, ApprovalAction>;
    autoApproveRules?: AutoApproveRule[];
}

export const CATEGORY_LABELS: Record<ApprovalCategory, string> = {
    read: 'Read',
    write: 'Write',
    delete: 'Delete',
    execute: 'Execute',
    send: 'Send',
    admin: 'Admin',
};

export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export const DEFAULT_PRESETS: Omit<ApprovalPresetConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'Full Control',
        preset: 'full_control',
        description: 'Human approves everything. Maximum safety.',
        categoryDefaults: {
            read: 'auto_approve', write: 'require_approval', delete: 'require_approval',
            execute: 'require_approval', send: 'require_approval', admin: 'require_approval',
        },
        toolOverrides: {},
        autoApproveRules: [],
        isDefault: true,
    },
    {
        name: 'Supervised',
        preset: 'supervised',
        description: 'Read auto-approved. Write/delete/execute require approval.',
        categoryDefaults: {
            read: 'auto_approve', write: 'require_approval', delete: 'require_approval',
            execute: 'require_approval', send: 'auto_approve', admin: 'require_approval',
        },
        toolOverrides: {},
        autoApproveRules: [],
    },
    {
        name: 'Guided',
        preset: 'guided',
        description: 'Read/write auto-approved. Delete/execute/admin require approval.',
        categoryDefaults: {
            read: 'auto_approve', write: 'auto_approve', delete: 'require_approval',
            execute: 'require_approval', send: 'auto_approve', admin: 'require_approval',
        },
        toolOverrides: {},
        autoApproveRules: [],
    },
    {
        name: 'Autopilot',
        preset: 'autopilot',
        description: 'Everything auto-approved except admin and delete. Use with caution.',
        categoryDefaults: {
            read: 'auto_approve', write: 'auto_approve', delete: 'require_approval',
            execute: 'auto_approve', send: 'auto_approve', admin: 'require_approval',
        },
        toolOverrides: {},
        autoApproveRules: [],
    },
];
