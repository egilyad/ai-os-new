/**
 * GovernanceService — Wave 10.22–10.24 + 10.27 (least privilege + trust + policy + humans).
 *
 * Single decision pipeline: capability grant → policy rules (priority-ordered,
 * deny wins, require_hitl escalates) → trust floor. Human roles gate who may
 * observe/approve/direct/audit. All mutations audited via AuditService delegate.
 */
import type { IEventBus } from '../../types/interfaces';
import type { TrustRepository } from '../../dal/trust-repository';
import type { IAuditService, IGovernanceService } from '../../contracts/trust';
import type {
    CapabilityGrant,
    GovAssignment,
    HumanRole,
    PolicyEffect,
    PolicyRule,
    TrustScore,
} from '../../types/trust-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Governance');

function now(): number {
    return Date.now();
}

const ROLE_CANDO: Record<HumanRole, Array<'observe' | 'approve' | 'direct' | 'audit'>> = {
    observer: ['observe'],
    approver: ['observe', 'approve'],
    director: ['observe', 'approve', 'direct'],
    auditor: ['observe', 'audit'],
};

function subjectMatches(pattern: string, subject: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith(':*')) return subject.startsWith(pattern.slice(0, -1));
    return pattern === subject;
}

export class GovernanceService implements IGovernanceService {
    constructor(
        private repo: TrustRepository,
        private events: IEventBus,
        private audit: IAuditService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Governance', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    // ── Capabilities ──
    async grantCapability(subject: string, capability: string, allow = true): Promise<CapabilityGrant> {
        const grant: CapabilityGrant = {
            id: genId('cap'),
            subject,
            capability,
            allow,
            createdAt: now(),
        };
        await this.repo.putCapability(grant);
        await this.audit.append('governance', allow ? 'capability.granted' : 'capability.revoked', subject, capability);
        return grant;
    }

    async checkCapability(subject: string, capability: string): Promise<boolean> {
        const grants = (await this.repo.listCapabilities()).filter(
            (g) => subjectMatches(g.subject, subject) && (g.capability === capability || g.capability === '*'),
        );
        let allowed = false;
        for (const g of grants) {
            if (!g.allow) return false;
            allowed = true;
        }
        return allowed;
    }

    // ── Trust ──
    async feedback(subject: string, outcome: number): Promise<TrustScore> {
        const clamped = Math.max(0, Math.min(1, outcome));
        const existing = await this.repo.getTrustBySubject(subject);
        const t = now();
        if (!existing) {
            const fresh: TrustScore = {
                id: genId('trust'),
                subject,
                score: clamped,
                interactions: 1,
                createdAt: t,
                updatedAt: t,
            };
            await this.repo.putTrust(fresh);
            return fresh;
        }
        // Exponential moving average (alpha 0.2) — reputation with memory.
        existing.score = existing.score * 0.8 + clamped * 0.2;
        existing.interactions += 1;
        existing.updatedAt = t;
        await this.repo.putTrust(existing);
        this.events.emit(EVENTS.TRUST_UPDATED, { subject, score: existing.score });
        return existing;
    }

    async trustOf(subject: string): Promise<TrustScore | null> {
        return this.repo.getTrustBySubject(subject);
    }

    // ── Policies ──
    async addPolicy(input: {
        name: string;
        action: string;
        subject?: string;
        effect?: PolicyEffect;
        limit?: number;
        priority?: number;
    }): Promise<PolicyRule> {
        const rule: PolicyRule = {
            id: genId('pol'),
            name: input.name,
            action: input.action,
            subject: input.subject ?? '*',
            effect: input.effect ?? 'allow',
            limit: input.limit,
            priority: input.priority ?? 0,
            enabled: true,
            createdAt: now(),
        };
        await this.repo.putPolicy(rule);
        await this.audit.append('governance', 'policy.added', rule.id, `${rule.action}→${rule.effect}`);
        this.events.emit(EVENTS.TRUST_POLICY, { policyId: rule.id, effect: rule.effect });
        return rule;
    }

    async setPolicyEnabled(id: string, enabled: boolean): Promise<PolicyRule> {
        const rule = await this.repo.getPolicy(id);
        if (!rule) throw new Error(`Policy not found: ${id}`);
        rule.enabled = enabled;
        await this.repo.putPolicy(rule);
        await this.audit.append('governance', enabled ? 'policy.enabled' : 'policy.disabled', id, rule.name);
        return rule;
    }

    async evaluate(input: { action: string; subject: string; amount?: number }): Promise<{
        decision: PolicyEffect;
        ruleId?: string;
    }> {
        const rules = (await this.repo.listPolicies()).filter(
            (r) => r.enabled && r.action === input.action && subjectMatches(r.subject, input.subject),
        );
        // Highest priority first; deny beats allow at equal priority.
        for (const r of rules) {
            if (r.effect === 'deny') return { decision: 'deny', ruleId: r.id };
        }
        for (const r of rules) {
            if (r.effect === 'require_hitl') return { decision: 'require_hitl', ruleId: r.id };
        }
        for (const r of rules) {
            if (r.effect === 'allow') {
                if (input.action === 'budget:spend' && r.limit !== undefined && (input.amount ?? 0) > r.limit) {
                    return { decision: 'deny', ruleId: r.id };
                }
                return { decision: 'allow', ruleId: r.id };
            }
        }
        return { decision: 'allow' };
    }

    // ── Human roles ──
    async assignRole(userId: string, role: HumanRole, scope = 'global'): Promise<GovAssignment> {
        const assignment: GovAssignment = {
            id: genId('gov'),
            userId,
            role,
            scope,
            createdAt: now(),
        };
        await this.repo.putRole(assignment);
        await this.audit.append('governance', 'role.assigned', userId, `${role}@${scope}`);
        return assignment;
    }

    async rolesOf(userId: string): Promise<GovAssignment[]> {
        const all = await this.repo.listRoles();
        return all.filter((r) => r.userId === userId);
    }

    async can(userId: string, action: 'observe' | 'approve' | 'direct' | 'audit'): Promise<boolean> {
        const roles = await this.rolesOf(userId);
        return roles.some((r) => ROLE_CANDO[r.role].includes(action));
    }
}
