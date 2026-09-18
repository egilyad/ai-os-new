export type ApprovalPreset = 'FULL_CONTROL' | 'SUPERVISED' | 'GUIDED' | 'AUTOPILOT';
export type ToolApprovalMode = 'FREE' | 'REQUIRES_APPROVAL' | 'BLOCKED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'AUTO_APPROVED';

export interface ApprovalPolicy {
    id?: number;
    agentId: string;
    preset: ApprovalPreset;
    readMode?: ToolApprovalMode;
    writeMode?: ToolApprovalMode;
    deleteMode?: ToolApprovalMode;
    executeMode?: ToolApprovalMode;
    sendMode?: ToolApprovalMode;
    adminMode?: ToolApprovalMode;
    toolOverrides?: Record<string, ToolApprovalMode>;
    autoApproveAfterMin?: number;
    autoApproveLowRisk?: boolean;
    costThresholdUsd?: number;
    updatedAt: number;
}

export interface ApprovalRequest {
    id?: number;
    agentId: string;
    toolName: string;
    toolInput: unknown;
    category: string;
    riskLevel: 'low' | 'medium' | 'high';
    description?: string;
    status: ApprovalStatus;
    resolvedBy?: string;
    resolvedAt?: number;
    rejectionReason?: string;
    expiresAt?: number;
    createdAt: number;
    reviewComments?: ApprovalReviewComment[];
}

export interface ApprovalReviewComment {
    authorId: string;
    text: string;
    at: number;
}

export const PRESET_DEFAULTS: Record<ApprovalPreset, Partial<ApprovalPolicy>> = {
    FULL_CONTROL: { readMode: 'FREE', writeMode: 'REQUIRES_APPROVAL', deleteMode: 'BLOCKED', executeMode: 'REQUIRES_APPROVAL', sendMode: 'REQUIRES_APPROVAL', adminMode: 'BLOCKED' },
    SUPERVISED: { readMode: 'FREE', writeMode: 'REQUIRES_APPROVAL', deleteMode: 'REQUIRES_APPROVAL', executeMode: 'REQUIRES_APPROVAL', sendMode: 'FREE', adminMode: 'REQUIRES_APPROVAL' },
    GUIDED: { readMode: 'FREE', writeMode: 'FREE', deleteMode: 'REQUIRES_APPROVAL', executeMode: 'REQUIRES_APPROVAL', sendMode: 'FREE', adminMode: 'REQUIRES_APPROVAL' },
    AUTOPILOT: { readMode: 'FREE', writeMode: 'FREE', deleteMode: 'FREE', executeMode: 'FREE', sendMode: 'FREE', adminMode: 'FREE' },
};
