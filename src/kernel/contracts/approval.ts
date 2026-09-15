/**
 * Approval / Safety contract (roadmapp.md §P10 + AGEMS port Phase 3).
 */
import type {
    ApprovalGate,
    ExecutionLimit,
    SandboxBoundary,
    ApprovalPresetConfig,
    ApprovalRequest,
    ApprovalComment,
    ApprovalRequestStatus,
    ApprovalCategory,
    ApprovalAction,
    CreateApprovalRequestInput,
    UpdateApprovalPresetInput,
} from '../types/safety-types';

// ── Legacy gates (P10, in-memory) ──

export interface IApprovalService {
    requestApproval(projectId: string, name: string, requiredCapabilities: string[], approver?: string): ApprovalGate;
    approve(gateId: string, reason?: string): void;
    deny(gateId: string, reason?: string): void;
    getPendingApprovals(projectId: string): ApprovalGate[];
    isApproved(gateId: string): boolean;
    getExecutionLimits(projectId: string): ExecutionLimit;
    setExecutionLimits(projectId: string, limits: Partial<ExecutionLimit>): void;
    getSandboxBoundary(projectId: string): SandboxBoundary;
    setSandboxBoundary(projectId: string, boundary: Partial<SandboxBoundary>): void;
    checkCapability(projectId: string, toolName: string): { allowed: boolean; reason?: string };
}

// ── AGEMS Phase 3: Presets + Requests + Comments (Dexie-persisted) ──

export interface IApprovalWorkflowService {
    // ── Presets ──
    listPresets(): Promise<ApprovalPresetConfig[]>;
    getPreset(id: string): Promise<ApprovalPresetConfig | undefined>;
    createPreset(input: Omit<ApprovalPresetConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApprovalPresetConfig>;
    updatePreset(id: string, input: UpdateApprovalPresetInput): Promise<ApprovalPresetConfig>;
    deletePreset(id: string): Promise<void>;
    getDefaultPreset(): Promise<ApprovalPresetConfig | undefined>;

    // ── Requests ──
    submitRequest(input: CreateApprovalRequestInput): Promise<ApprovalRequest>;
    approveRequest(id: string, resolvedBy: string, reason?: string): Promise<ApprovalRequest>;
    rejectRequest(id: string, resolvedBy: string, reason?: string): Promise<ApprovalRequest>;
    bulkApprove(ids: string[], resolvedBy: string, reason?: string): Promise<ApprovalRequest[]>;
    bulkReject(ids: string[], resolvedBy: string, reason?: string): Promise<ApprovalRequest[]>;
    getRequest(id: string): Promise<ApprovalRequest | undefined>;
    listRequests(status?: ApprovalRequestStatus): Promise<ApprovalRequest[]>;
    listRequestsByAgent(agentId: string): Promise<ApprovalRequest[]>;
    expireStale(): Promise<number>; // returns count of expired

    // ── Check (auto-approve / require) ──
    checkRequest(agentId: string, toolName: string, category: ApprovalCategory, riskLevel: ApprovalRequest['riskLevel']): Promise<{ action: ApprovalAction; requestId?: string; reason?: string }>;

    // ── Comments ──
    addComment(requestId: string, authorType: ApprovalComment['authorType'], authorId: string, content: string): Promise<ApprovalComment>;
    getComments(requestId: string): Promise<ApprovalComment[]>;
}
