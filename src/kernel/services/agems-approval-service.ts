import { getDexieDb } from './dexie-schema';
import type { ApprovalPolicy, ApprovalRequest, ApprovalPreset } from '../types/agems-approval';
import { PRESET_DEFAULTS } from '../types/agems-approval';

export interface AgemsApprovalDelegates {
    onResolved?: (req: ApprovalRequest, status: 'APPROVED' | 'REJECTED') => void;
}

export class AgemsApprovalService {
    delegates: AgemsApprovalDelegates = {};
    async getPolicy(agentId: string): Promise<ApprovalPolicy | undefined> {
        return (await getDexieDb().approvalPolicies.where('agentId').equals(agentId).first()) as unknown as ApprovalPolicy | undefined;
    }

    async setPreset(agentId: string, preset: ApprovalPreset): Promise<ApprovalPolicy> {
        const existing = await this.getPolicy(agentId);
        const defaults = PRESET_DEFAULTS[preset];
        const policy: ApprovalPolicy = {
            ...(existing as ApprovalPolicy ?? { agentId, preset, updatedAt: Date.now() }),
            agentId,
            preset,
            ...defaults,
            updatedAt: Date.now(),
        };
        if (existing?.id) {
            await getDexieDb().approvalPolicies.update(existing.id as number, policy as never);
            return { ...policy, id: existing.id } as ApprovalPolicy;
        }
        const id = (await getDexieDb().approvalPolicies.add(policy as never)) as unknown as number;
        return { ...policy, id } as ApprovalPolicy;
    }

    async requestApproval(input: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt'>): Promise<ApprovalRequest> {
        const req: ApprovalRequest = {
            agentId: input.agentId,
            toolName: input.toolName,
            toolInput: input.toolInput,
            category: input.category,
            riskLevel: input.riskLevel,
            description: input.description,
            status: 'PENDING',
            expiresAt: input.expiresAt ?? Date.now() + 24 * 3600000,
            createdAt: Date.now(),
        };
        const id = (await getDexieDb().approvalRequests.add(req as never)) as unknown as number;
        return { ...req, id } as ApprovalRequest;
    }

    async resolve(id: number, status: 'APPROVED' | 'REJECTED', reason?: string, resolverId?: string): Promise<void> {
        const req = (await getDexieDb().approvalRequests.get(id)) as unknown as ApprovalRequest | undefined;
        await getDexieDb().approvalRequests.update(id, { status, rejectionReason: reason, resolvedBy: resolverId, resolvedAt: Date.now() } as never);
        // B3: живой junction — решение уходит делегату (execution-bridge), best-effort.
        if (req) {
            try {
                this.delegates.onResolved?.({ ...req, status, resolvedBy: resolverId, resolvedAt: Date.now() }, status);
            } catch {
                /* delegate must never break resolve */
            }
        }
    }

    async list(agentId?: string, status?: ApprovalRequest['status']): Promise<ApprovalRequest[]> {
        const col = getDexieDb().approvalRequests.toCollection();
        const all = (await col.toArray()) as unknown as ApprovalRequest[];
        let filtered = all;
        if (agentId) filtered = filtered.filter((r) => r.agentId === agentId);
        if (status) filtered = filtered.filter((r) => r.status === status);
        return filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    async updatePolicy(agentId: string, patch: Partial<ApprovalPolicy>): Promise<ApprovalPolicy> {
        const existing = await this.getPolicy(agentId);
        if (existing?.id) {
            await getDexieDb().approvalPolicies.update(existing.id as number, { ...patch, updatedAt: Date.now() } as never);
            return { ...existing, ...patch, updatedAt: Date.now() } as ApprovalPolicy;
        }
        return this.setPreset(agentId, patch.preset ?? 'SUPERVISED').then(async (pol) => {
            const { preset: _p, ...rest } = patch;
            void _p;
            if (Object.keys(rest).length) {
                await getDexieDb().approvalPolicies.update(pol.id as number, { ...rest, updatedAt: Date.now() } as never);
                return { ...pol, ...rest } as ApprovalPolicy;
            }
            return pol;
        });
    }

    async bulkResolve(ids: number[], status: 'APPROVED' | 'REJECTED'): Promise<void> {
        for (const id of ids) await this.resolve(id, status);
    }
}

export const agemsApprovalService = new AgemsApprovalService();
