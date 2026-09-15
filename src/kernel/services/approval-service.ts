/**
 * ApprovalService — permission gates, execution limits, sandbox boundaries (roadmapp.md §P10).
 * ApprovalWorkflowService — Dexie-persisted presets, requests, comments (AGEMS port Phase 3).
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
import { DEFAULT_EXECUTION_LIMITS, DEFAULT_SANDBOX } from '../types/safety-types';
import type { IApprovalService, IApprovalWorkflowService } from '../contracts/approval';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ApprovalService');

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

// ── AGEMS Phase 3: ApprovalWorkflowService (Dexie-persisted) ──

let reqCounter = 0;
let commentCounter = 0;
let presetCounter = 0;

function genId(prefix: string): string {
    return `${prefix}-${Date.now()}-${++reqCounter}`;
}

function globMatch(pattern: string, value: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return regex.test(value);
}

export class ApprovalWorkflowService implements IApprovalWorkflowService {
    private db: {
        approvalPresets: { toArray(): Promise<Record<string, unknown>[]>; put(v: Record<string, unknown>): Promise<string>; delete(id: string): Promise<void> };
        approvalRequests: { toArray(): Promise<Record<string, unknown>[]>; put(v: Record<string, unknown>): Promise<string> };
        approvalComments: { toArray(): Promise<Record<string, unknown>[]>; put(v: Record<string, unknown>): Promise<string> };
    };

    constructor(db: {
        approvalPresets: { toArray(): Promise<Record<string, unknown>[]>; put(v: Record<string, unknown>): Promise<string>; delete(id: string): Promise<void> };
        approvalRequests: { toArray(): Promise<Record<string, unknown>[]>; put(v: Record<string, unknown>): Promise<string> };
        approvalComments: { toArray(): Promise<Record<string, unknown>[]>; put(v: Record<string, unknown>): Promise<string> };
    }) {
        this.db = db;
    }

    // ── Presets ──

    async listPresets(): Promise<ApprovalPresetConfig[]> {
        return (await this.db.approvalPresets.toArray()) as unknown as ApprovalPresetConfig[];
    }

    async getPreset(id: string): Promise<ApprovalPresetConfig | undefined> {
        const all = await this.listPresets();
        return all.find(p => p.id === id);
    }

    async createPreset(input: Omit<ApprovalPresetConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApprovalPresetConfig> {
        const preset: ApprovalPresetConfig = {
            ...input,
            id: `preset-${Date.now()}-${++presetCounter}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await this.db.approvalPresets.put(preset as unknown as Record<string, unknown>);
        LOGGER.info('createPreset', `Created preset: ${preset.name} (${preset.preset})`);
        return preset;
    }

    async updatePreset(id: string, input: UpdateApprovalPresetInput): Promise<ApprovalPresetConfig> {
        const existing = await this.getPreset(id);
        if (!existing) throw new Error(`Preset not found: ${id}`);
        const updated: ApprovalPresetConfig = { ...existing, ...input, updatedAt: Date.now() };
        await this.db.approvalPresets.put(updated as unknown as Record<string, unknown>);
        return updated;
    }

    async deletePreset(id: string): Promise<void> {
        const existing = await this.getPreset(id);
        if (!existing) throw new Error(`Preset not found: ${id}`);
        await this.db.approvalPresets.delete(id);
    }

    async getDefaultPreset(): Promise<ApprovalPresetConfig | undefined> {
        const all = await this.listPresets();
        return all.find(p => p.isDefault) ?? all[0];
    }

    // ── Requests ──

    async submitRequest(input: CreateApprovalRequestInput): Promise<ApprovalRequest> {
        const now = Date.now();
        const request: ApprovalRequest = {
            id: genId('approval'),
            agentId: input.agentId,
            toolName: input.toolName,
            toolInput: input.toolInput,
            category: input.category,
            riskLevel: input.riskLevel,
            description: input.description,
            status: 'pending',
            presetId: input.presetId,
            sessionId: input.sessionId,
            metadata: input.metadata,
            expiresAt: input.ttlMs ? now + input.ttlMs : undefined,
            createdAt: now,
            updatedAt: now,
        };

        // Check auto-approve
        const preset = input.presetId ? await this.getPreset(input.presetId) : await this.getDefaultPreset();
        if (preset) {
            const action = this.evaluatePreset(preset, input.category, input.toolName, input.riskLevel);
            if (action === 'auto_approve') {
                request.status = 'auto_approved';
                request.resolvedBy = 'auto';
                request.resolvedAt = now;
            } else if (action === 'deny') {
                request.status = 'rejected';
                request.resolvedBy = 'auto';
                request.resolvedAt = now;
                request.rejectionReason = 'Auto-denied by preset policy';
            }
        }

        await this.db.approvalRequests.put(request as unknown as Record<string, unknown>);
        LOGGER.info('submitRequest', `Request ${request.id}: ${input.toolName} (${input.category}) → ${request.status}`);
        return request;
    }

    async approveRequest(id: string, resolvedBy: string, reason?: string): Promise<ApprovalRequest> {
        const req = await this.getRequest(id);
        if (!req) throw new Error(`Request not found: ${id}`);
        if (req.status !== 'pending') throw new Error(`Request ${id} is not pending (status: ${req.status})`);
        const now = Date.now();
        const updated: ApprovalRequest = { ...req, status: 'approved', resolvedBy, resolvedAt: now, rejectionReason: reason, updatedAt: now };
        await this.db.approvalRequests.put(updated as unknown as Record<string, unknown>);
        LOGGER.info('approveRequest', `Approved request ${id} by ${resolvedBy}`);
        return updated;
    }

    async rejectRequest(id: string, resolvedBy: string, reason?: string): Promise<ApprovalRequest> {
        const req = await this.getRequest(id);
        if (!req) throw new Error(`Request not found: ${id}`);
        if (req.status !== 'pending') throw new Error(`Request ${id} is not pending (status: ${req.status})`);
        const now = Date.now();
        const updated: ApprovalRequest = { ...req, status: 'rejected', resolvedBy, resolvedAt: now, rejectionReason: reason, updatedAt: now };
        await this.db.approvalRequests.put(updated as unknown as Record<string, unknown>);
        LOGGER.info('rejectRequest', `Rejected request ${id} by ${resolvedBy}: ${reason ?? '(no reason)'}`);
        return updated;
    }

    async bulkApprove(ids: string[], resolvedBy: string, reason?: string): Promise<ApprovalRequest[]> {
        const results: ApprovalRequest[] = [];
        for (const id of ids) {
            try {
                results.push(await this.approveRequest(id, resolvedBy, reason));
            } catch { /* skip non-pending */ }
        }
        return results;
    }

    async bulkReject(ids: string[], resolvedBy: string, reason?: string): Promise<ApprovalRequest[]> {
        const results: ApprovalRequest[] = [];
        for (const id of ids) {
            try {
                results.push(await this.rejectRequest(id, resolvedBy, reason));
            } catch { /* skip non-pending */ }
        }
        return results;
    }

    async getRequest(id: string): Promise<ApprovalRequest | undefined> {
        const all = await this.db.approvalRequests.toArray();
        return all.find(r => r.id === id) as unknown as ApprovalRequest | undefined;
    }

    async listRequests(status?: ApprovalRequestStatus): Promise<ApprovalRequest[]> {
        const all = await this.db.approvalRequests.toArray() as unknown as ApprovalRequest[];
        return status ? all.filter(r => r.status === status) : all;
    }

    async listRequestsByAgent(agentId: string): Promise<ApprovalRequest[]> {
        const all = await this.db.approvalRequests.toArray() as unknown as ApprovalRequest[];
        return all.filter(r => r.agentId === agentId);
    }

    async expireStale(): Promise<number> {
        const now = Date.now();
        const all = await this.db.approvalRequests.toArray() as unknown as ApprovalRequest[];
        let count = 0;
        for (const req of all) {
            if (req.status === 'pending' && req.expiresAt && req.expiresAt < now) {
                const updated: ApprovalRequest = { ...req, status: 'expired', resolvedBy: 'system', resolvedAt: now, updatedAt: now };
                await this.db.approvalRequests.put(updated as unknown as Record<string, unknown>);
                count++;
            }
        }
        return count;
    }

    // ── Check ──

    async checkRequest(agentId: string, toolName: string, category: ApprovalCategory, riskLevel: ApprovalRequest['riskLevel']): Promise<{ action: ApprovalAction; requestId?: string; reason?: string }> {
        const preset = await this.getDefaultPreset();
        if (!preset) return { action: 'require_approval', reason: 'No preset configured' };
        const action = this.evaluatePreset(preset, category, toolName, riskLevel);

        if (action === 'auto_approve') {
            const req = await this.submitRequest({ agentId, toolName, category, riskLevel, description: `Auto-approved: ${toolName}` });
            return { action: 'auto_approve', requestId: req.id };
        }

        if (action === 'deny') {
            const req = await this.submitRequest({ agentId, toolName, category, riskLevel, description: `Auto-denied: ${toolName}` });
            return { action: 'deny', requestId: req.id, reason: 'Auto-denied by preset policy' };
        }

        // require_approval
        const req = await this.submitRequest({ agentId, toolName, category, riskLevel, description: `Requires approval: ${toolName}` });
        return { action: 'require_approval', requestId: req.id };
    }

    // ── Comments ──

    async addComment(requestId: string, authorType: ApprovalComment['authorType'], authorId: string, content: string): Promise<ApprovalComment> {
        const comment: ApprovalComment = {
            id: `acomment-${Date.now()}-${++commentCounter}`,
            requestId,
            authorType,
            authorId,
            content,
            createdAt: Date.now(),
        };
        await this.db.approvalComments.put(comment as unknown as Record<string, unknown>);
        return comment;
    }

    async getComments(requestId: string): Promise<ApprovalComment[]> {
        const all = await this.db.approvalComments.toArray() as unknown as ApprovalComment[];
        return all.filter(c => c.requestId === requestId);
    }

    // ── Private helpers ──

    private evaluatePreset(preset: ApprovalPresetConfig, category: ApprovalCategory, toolName: string, riskLevel: ApprovalRequest['riskLevel']): ApprovalAction {
        // 1. Tool overrides (highest priority)
        if (preset.toolOverrides[toolName]) {
            return preset.toolOverrides[toolName];
        }

        // 2. Auto-approve rules
        for (const rule of preset.autoApproveRules) {
            if (!rule.enabled) continue;
            if (rule.category && rule.category !== category) continue;
            if (rule.toolName && rule.toolName !== toolName) continue;
            if (rule.toolPattern && !globMatch(rule.toolPattern, toolName)) continue;
            if (rule.maxRiskLevel) {
                const riskOrder = ['low', 'medium', 'high', 'critical'];
                if (riskOrder.indexOf(riskLevel) > riskOrder.indexOf(rule.maxRiskLevel)) continue;
            }
            return 'auto_approve';
        }

        // 3. Category defaults
        return preset.categoryDefaults[category] ?? 'require_approval';
    }
}
