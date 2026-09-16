/**
 * Approval / Safety contract (roadmapp.md §P10).
 */
import type { ApprovalGate, ExecutionLimit, SandboxBoundary } from '../types/safety-types';

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
