/**
 * ApprovalService — permission gates, execution limits, sandbox boundaries (roadmapp.md §P10).
 */
import type {
    ApprovalGate,
    ExecutionLimit,
    SandboxBoundary,
} from '../types/safety-types';
import { DEFAULT_EXECUTION_LIMITS, DEFAULT_SANDBOX } from '../types/safety-types';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ApprovalService');

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

let gateCounter = 0;

export class ApprovalService implements IApprovalService {
    private gates = new Map<string, ApprovalGate>();
    private limits = new Map<string, ExecutionLimit>();
    private sandboxes = new Map<string, SandboxBoundary>();

    requestApproval(projectId: string, name: string, requiredCapabilities: string[], approver = 'human'): ApprovalGate {
        const gate: ApprovalGate = {
            id: `gate-${Date.now()}-${++gateCounter}`,
            projectId,
            name,
            requiredCapabilities,
            approver,
            status: 'pending',
            requestedAt: Date.now(),
        };

        this.gates.set(gate.id, gate);
        LOGGER.info('requestApproval', `Approval requested: ${name} for project ${projectId}`);
        return gate;
    }

    approve(gateId: string, reason?: string): void {
        const gate = this.gates.get(gateId);
        if (!gate) throw new Error(`Gate not found: ${gateId}`);
        gate.status = 'approved';
        gate.resolvedAt = Date.now();
        gate.reason = reason;
    }

    deny(gateId: string, reason?: string): void {
        const gate = this.gates.get(gateId);
        if (!gate) throw new Error(`Gate not found: ${gateId}`);
        gate.status = 'denied';
        gate.resolvedAt = Date.now();
        gate.reason = reason;
    }

    getPendingApprovals(projectId: string): ApprovalGate[] {
        return Array.from(this.gates.values()).filter(
            (g) => g.projectId === projectId && g.status === 'pending',
        );
    }

    isApproved(gateId: string): boolean {
        return this.gates.get(gateId)?.status === 'approved';
    }

    getExecutionLimits(projectId: string): ExecutionLimit {
        return this.limits.get(projectId) || { ...DEFAULT_EXECUTION_LIMITS };
    }

    setExecutionLimits(projectId: string, limits: Partial<ExecutionLimit>): void {
        const existing = this.getExecutionLimits(projectId);
        this.limits.set(projectId, { ...existing, ...limits });
    }

    getSandboxBoundary(projectId: string): SandboxBoundary {
        return this.sandboxes.get(projectId) || { ...DEFAULT_SANDBOX };
    }

    setSandboxBoundary(projectId: string, boundary: Partial<SandboxBoundary>): void {
        const existing = this.getSandboxBoundary(projectId);
        this.sandboxes.set(projectId, { ...existing, ...boundary });
    }

    checkCapability(projectId: string, toolName: string): { allowed: boolean; reason?: string } {
        const limits = this.getExecutionLimits(projectId);

        if (limits.blockedToolNames.includes(toolName)) {
            return { allowed: false, reason: `Tool '${toolName}' is blocked by execution limits` };
        }

        if (limits.allowedToolNames.length > 0 && !limits.allowedToolNames.includes(toolName)) {
            return { allowed: false, reason: `Tool '${toolName}' is not in the allowed tools list` };
        }

        return { allowed: true };
    }
}
