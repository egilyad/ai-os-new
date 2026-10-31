import { getDexieDb } from './database-service';
import type { ApprovalPolicy, ApprovalRequest, ApprovalPreset } from '../types/agems-approval';
import { PRESET_DEFAULTS } from '../types/agems-approval';

export interface AgemsApprovalDelegates {
    onResolved?: (req: ApprovalRequest, status: 'APPROVED' | 'REJECTED') => void;
}

export class AgemsApprovalService {
    delegates: AgemsApprovalDelegates = {};
    async getPolicy(agentId: string): Promise<ApprovalPolicy | undefined> {
        return (await getDexieDb()
            .approvalPolicies.where('agentId')
            .equals(agentId)
            .first()) as unknown as ApprovalPolicy | undefined;
    }

    async setPreset(agentId: string, preset: ApprovalPreset): Promise<ApprovalPolicy> {
        const existing = await this.getPolicy(agentId);
        const defaults = PRESET_DEFAULTS[preset];
        const policy: ApprovalPolicy = {
            ...((existing as ApprovalPolicy) ?? { agentId, preset, updatedAt: Date.now() }),
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

    async requestApproval(
        input: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt'>,
    ): Promise<ApprovalRequest> {
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

    async resolve(
        id: number,
        status: 'APPROVED' | 'REJECTED',
        reason?: string,
        resolverId?: string,
    ): Promise<void> {
        const req = (await getDexieDb().approvalRequests.get(id)) as unknown as
            ApprovalRequest | undefined;
        if (!req) throw new Error(`Approval request not found: ${id}`);
        // ro2 §5.1: TTL — просроченная заявка переходит в EXPIRED
        // вместо исполнения по устаревшему решению человека.
        if (typeof req.expiresAt === 'number' && Date.now() > req.expiresAt) {
            await getDexieDb().approvalRequests.update(id, {
                status: 'EXPIRED',
                resolvedAt: Date.now(),
            } as never);
            throw new Error(`Approval request ${id} expired`);
        }
        // ro2 §5.1: атомарный переход только из PENDING — при конкурентных
        // resolve победитель один, остальные получают ошибку (нет двойного
        // onResolved / двойного исполнения инструмента).
        const updated = await getDexieDb()
            .approvalRequests.where('id')
            .equals(id)
            .modify((r) => {
                if (r.status !== 'PENDING')
                    throw new Error(`Approval request ${id} is already ${r.status}`);
                r.status = status;
                r.rejectionReason = reason;
                r.resolvedBy = resolverId;
                r.resolvedAt = Date.now();
            });
        if (updated === 0) throw new Error(`Approval request ${id} is already ${req.status}`);
        // B3: живой junction — решение уходит делегату (execution-bridge), best-effort.
        try {
            this.delegates.onResolved?.(
                { ...req, status, resolvedBy: resolverId, resolvedAt: Date.now() },
                status,
            );
        } catch {
            /* delegate must never break resolve */
        }
    }

    /**
     * Phase 73: claim одноразового approve (защита от повторного USE).
     * resolve() запрещает повторный RESOLVE, claim — повторный ЗАПУСК:
     * computer.use помечает заявку CONSUMED сразу после проверки, до loop.
     * Повторный claim/вызов падает (`already CONSUMED`), новый запуск
     * требует нового человеческого approve.
     */
    async claim(id: number): Promise<ApprovalRequest> {
        const req = (await getDexieDb().approvalRequests.get(id)) as unknown as
            ApprovalRequest | undefined;
        if (!req) throw new Error(`Approval request not found: ${id}`);
        // Атомарный переход только из APPROVED — исключает двойной запуск
        // компьютер-лупа/инструмента при конкурентных claim.
        const updated = await getDexieDb()
            .approvalRequests.where('id')
            .equals(id)
            .modify((r) => {
                if (r.status !== 'APPROVED')
                    throw new Error(`Approval request ${id} is already ${r.status}`);
                r.status = 'CONSUMED';
                r.resolvedAt = Date.now();
            });
        if (updated === 0) throw new Error(`Approval request ${id} is already ${req.status}`);
        return { ...req, status: 'CONSUMED' as const, resolvedAt: Date.now() };
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
        // W4-044: never allow auto-approval after < 60 minutes — a 0-minute
        // timeout with a FREE preset silently auto-approves destructive actions.
        if (patch.autoApproveAfterMin !== undefined) {
            const min = patch.autoApproveAfterMin;
            if (typeof min !== 'number' || !Number.isFinite(min) || min < 60) {
                throw new Error('autoApproveAfterMin must be >= 60 minutes');
            }
        }
        const existing = await this.getPolicy(agentId);
        if (existing?.id) {
            await getDexieDb().approvalPolicies.update(
                existing.id as number,
                { ...patch, updatedAt: Date.now() } as never,
            );
            return { ...existing, ...patch, updatedAt: Date.now() } as ApprovalPolicy;
        }
        return this.setPreset(agentId, patch.preset ?? 'SUPERVISED').then(async (pol) => {
            const { preset: _p, ...rest } = patch;
            void _p;
            if (Object.keys(rest).length) {
                await getDexieDb().approvalPolicies.update(
                    pol.id as number,
                    { ...rest, updatedAt: Date.now() } as never,
                );
                return { ...pol, ...rest } as ApprovalPolicy;
            }
            return pol;
        });
    }

    async bulkResolve(ids: number[], status: 'APPROVED' | 'REJECTED'): Promise<void> {
        // Best-effort: уже решённые/просроченные заявки пропускаем,
        // чтобы один settled id не абортил весь батч.
        for (const id of ids) {
            try {
                await this.resolve(id, status);
            } catch {
                /* settled/expired — skip */
            }
        }
    }
}

export const agemsApprovalService = new AgemsApprovalService();
